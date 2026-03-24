import { Request, Response } from "express";
import Enrollment from "../models/language.enrollment.model";
import Batch from "../models/language.batch.model";
import TrainingPaymentAttempt from "../models/trainingPaymentAttempt.model";
import User from "../models/user.model";
import { EmailService } from "../utils/email.service";
import { buildPaymentSnapshot } from "../utils/payment.helpers";

const emailService = new EmailService();

const buildLanguagePaymentKey = (params: {
  userId: unknown;
  courseTitle: unknown;
  levelName: unknown;
}) => [
  String(params.userId ?? '').trim(),
  String(params.courseTitle ?? '').trim().toLowerCase(),
  String(params.levelName ?? '').trim().toLowerCase(),
].join('::');

const toDisplayAmount = (subunits?: number) => {
  const numericValue = Number(subunits);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return Number((numericValue / 100).toFixed(2));
};

/* ============================
   STUDENT APIs
============================ */

// POST /api/language-training/enroll
export const applyEnrollment = async (req: Request, res: Response) => {
  try {
    const { courseTitle, name } = req.body;

    if (!courseTitle || !name) {
      return res.status(400).json({ message: "courseTitle and name required" });
    }

    const exists = await Enrollment.findOne({
      userId: (req as any).user._id,
      courseTitle,
      name,
    });

    if (exists) {
      if (exists.status === "REJECTED") {
        exists.status = "PENDING";
        exists.batchId = undefined;
        await exists.save();

        // Send "Request Received" Email for Re-enrollment
        const userEmail = (req as any).user.email;
        const userName = (req as any).user.name;
        await emailService.sendEnrollmentEmail(userEmail, userName, courseTitle, 'PENDING');

        return res.status(200).json({
          message: "Re-enrollment submitted successfully.",
          enrollment: exists,
        });
      }
      return res.status(409).json({ message: "Already enrolled or pending approval" });
    }

    const enrollment = await Enrollment.create({
      userId: (req as any).user._id,
      courseTitle,
      name,
    });

    // Send "Request Received" Email
    const userEmail = (req as any).user.email;
    const userName = (req as any).user.name;
    await emailService.sendEnrollmentEmail(userEmail, userName, courseTitle, 'PENDING');

    res.status(201).json({
      message: "Enrollment request submitted. Await admin approval.",
      enrollment,
    });
  } catch (err) {
    res.status(500).json({ message: "Enrollment failed" });
  }
};

// GET /api/language-training/my-enrollments
export const getMyEnrollments = async (req: Request, res: Response) => {
  const enrollments = await Enrollment.find({
    userId: (req as any).user._id,
  }).populate("batchId", "courseTitle name");

  res.json(enrollments);
};

/* ============================
   ADMIN APIs
============================ */

// GET /api/language-training/admin/enrollments?status=PENDING
export const getEnrollments = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 9));
    const status = String(req.query.status ?? '').trim();
    const level = String(req.query.level ?? '').trim();
    const search = String(req.query.search ?? '').trim();

    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (level && level !== 'All') {
      filter.name = level;
    }

    if (search) {
      const matchingUserIds = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
        ],
      }).distinct('_id');

      filter.$or = [
        { courseTitle: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { userId: { $in: matchingUserIds } },
      ];
    }

    const totalEnrollments = await Enrollment.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(totalEnrollments / limit));
    const currentPage = Math.min(page, totalPages);

    const enrollments = await Enrollment.find(filter)
      .populate('userId', 'name email phoneNumber germanLevel guardianName guardianPhone qualification dateOfBirth avatar role createdAt')
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * limit)
      .limit(limit);

    const enrollmentPaymentKeys = enrollments.map((enrollment) =>
      buildLanguagePaymentKey({
        userId: (enrollment.userId as any)?._id ?? enrollment.userId,
        courseTitle: enrollment.courseTitle,
        levelName: enrollment.name,
      })
    );
    const enrollmentPaymentKeySet = new Set(enrollmentPaymentKeys);

    const matchingPaymentAttempts = enrollments.length > 0
      ? await TrainingPaymentAttempt.find({
        trainingType: 'language',
        status: 'paid',
        userId: {
          $in: enrollments.map((enrollment) => (enrollment.userId as any)?._id ?? enrollment.userId),
        },
        courseTitle: {
          $in: [...new Set(enrollments.map((enrollment) => enrollment.courseTitle))],
        },
        levelName: {
          $in: [...new Set(enrollments.map((enrollment) => enrollment.name))],
        },
      })
        .sort({ paidAt: -1, createdAt: -1 })
        .lean()
      : [];

    const paymentSnapshotByKey = new Map<string, ReturnType<typeof buildPaymentSnapshot>>();

    for (const attempt of matchingPaymentAttempts) {
      const paymentKey = buildLanguagePaymentKey({
        userId: attempt.userId,
        courseTitle: attempt.courseTitle,
        levelName: attempt.levelName,
      });

      if (!enrollmentPaymentKeySet.has(paymentKey) || paymentSnapshotByKey.has(paymentKey)) {
        continue;
      }

      paymentSnapshotByKey.set(paymentKey, buildPaymentSnapshot(attempt));
    }

    const enrollmentsWithPayment = enrollments.map((enrollment) => ({
      ...enrollment.toObject(),
      payment: paymentSnapshotByKey.get(buildLanguagePaymentKey({
        userId: (enrollment.userId as any)?._id ?? enrollment.userId,
        courseTitle: enrollment.courseTitle,
        levelName: enrollment.name,
      })) || null,
    }));

    const availableLevels = await Enrollment.distinct('name', status ? { status } : {});

    return res.json({
      enrollments: enrollmentsWithPayment,
      availableLevels: ['All', ...availableLevels],
      pagination: {
        currentPage,
        totalPages,
        totalEnrollments,
        limit,
        hasPreviousPage: currentPage > 1,
        hasNextPage: currentPage < totalPages,
      },
    });
  } catch (error) {
    console.error('Failed to fetch enrollments:', error);
    return res.status(500).json({ message: 'Failed to fetch enrollments' });
  }
};

// POST /api/language-training/admin/enroll/:id/approve
export const approveEnrollment = async (req: Request, res: Response) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id).populate('userId');

    if (!enrollment || enrollment.status !== "PENDING") {
      return res.status(400).json({ message: "Invalid enrollment" });
    }

    let batch = await Batch.findOne({
      courseTitle: enrollment.courseTitle,
      name: enrollment.name,
    });

    if (!batch) {
      batch = await Batch.create({
        courseTitle: enrollment.courseTitle,
        name: enrollment.name,
        students: [],
      });
    }

    if (!batch.students.some(id => id.equals(enrollment.userId))) {
      batch.students.push(enrollment.userId);
      await batch.save();
    }

    enrollment.status = "APPROVED";
    enrollment.batchId = batch._id;
    await enrollment.save();

    // Send "Approved" Email
    // Since we populated userId, it is now an object (depending on TS types). 
    // We cast to any or check type to access email.
    const studentUser = enrollment.userId as any;
    if (studentUser && studentUser.email) {
      await emailService.sendEnrollmentEmail(studentUser.email, studentUser.name, enrollment.courseTitle, 'APPROVED');
    }

    res.json({
      message: "Enrollment approved and assigned to batch",
      enrollment,
    });
  } catch (err) {
    res.status(500).json({ message: "Approval failed" });
  }
};

// POST /api/language-training/admin/enroll/:id/reject
export const rejectEnrollment = async (req: Request, res: Response) => {
  const enrollment = await Enrollment.findById(req.params.id);

  if (!enrollment || enrollment.status !== "PENDING") {
    return res.status(400).json({ message: "Invalid enrollment" });
  }

  enrollment.status = "REJECTED";
  await enrollment.save();

  res.json({ message: "Enrollment rejected" });
};

// GET /api/language-training/admin/batches
export const getBatches = async (req: Request, res: Response) => {
  try {
    const search = String(req.query.search ?? '').trim();
    const course = String(req.query.course ?? '').trim();
    const hasPaginationQuery =
      req.query.page !== undefined
      || req.query.limit !== undefined
      || search.length > 0
      || course.length > 0;

    const filter: any = {};

    if (course && course !== 'All') {
      filter.courseTitle = course;
    }

    if (search) {
      filter.$or = [
        { courseTitle: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    if (!hasPaginationQuery) {
      const batches = await Batch.find(filter)
        .populate('students', 'name email')
        .sort({ createdAt: -1 });

      return res.json(batches);
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 6));
    const totalBatches = await Batch.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(totalBatches / limit));
    const currentPage = Math.min(page, totalPages);

    const batches = await Batch.find(filter)
      .populate('trainerId', 'name email')
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * limit)
      .limit(limit)
      .lean();

    const availableCourses = await Batch.distinct('courseTitle');

    const serializedBatches = batches.map((batch: any) => {
      const { students, trainerId, ...rest } = batch;

      return {
        ...rest,
        studentCount: Array.isArray(students) ? students.length : 0,
        trainer: trainerId || null,
      };
    });

    return res.json({
      batches: serializedBatches,
      availableCourses: ['All', ...availableCourses],
      pagination: {
        currentPage,
        totalPages,
        totalBatches,
        limit,
        hasPreviousPage: currentPage > 1,
        hasNextPage: currentPage < totalPages,
      },
    });
  } catch (error) {
    console.error('Failed to fetch batches:', error);
    return res.status(500).json({ message: 'Failed to fetch batches' });
  }
};

// GET /api/language-training/admin/batches/:batchId/students
export const getBatchStudents = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 8));
    const search = String(req.query.search ?? '').trim();

    const batch = await Batch.findById(batchId).populate('trainerId', 'name email');

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    const studentFilter: any = {
      _id: { $in: batch.students },
      role: 'student',
    };

    if (search) {
      studentFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const totalStudents = await User.countDocuments(studentFilter);
    const totalPages = Math.max(1, Math.ceil(totalStudents / limit));
    const currentPage = Math.min(page, totalPages);

    const students = await User.find(studentFilter)
      .select('-password -otp -otpExpires -lastOtpSent -googleRefreshToken')
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * limit)
      .limit(limit);

    return res.json({
      batch: {
        _id: batch._id,
        courseTitle: batch.courseTitle,
        name: batch.name,
        trainer: batch.trainerId || null,
        studentCount: batch.students.length,
      },
      students,
      pagination: {
        currentPage,
        totalPages,
        totalStudents,
        limit,
        hasPreviousPage: currentPage > 1,
        hasNextPage: currentPage < totalPages,
      },
    });
  } catch (error) {
    console.error('Failed to fetch batch students:', error);
    return res.status(500).json({ message: 'Failed to fetch batch students' });
  }
};

// DELETE /api/language-training/admin/batches/:batchId/students/:studentId
export const removeStudentFromBatch = async (req: Request, res: Response) => {
  try {
    const { batchId, studentId } = req.params;

    // 1. Remove from Batch
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    batch.students = batch.students.filter(id => id.toString() !== studentId);
    await batch.save();

    // 2. Update Enrollment Status
    // Find enrollment for this user & this batch
    const enrollment = await Enrollment.findOne({
      userId: studentId,
      batchId: batchId
    });

    if (enrollment) {
      enrollment.status = "REJECTED"; // Or set to a new status like "DROPPED" if preferred
      enrollment.batchId = undefined; // Unlink batch
      await enrollment.save();
    }

    res.json({ message: "Student removed from batch successfully" });
  } catch (error) {
    console.error("Error removing student:", error);
    res.status(500).json({ message: "Failed to remove student" });
  }
};

// DELETE /api/language-training/admin/batches/:id
export const deleteBatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    // Un-enroll all students in this batch (Reject them)
    // We strictly look for enrollments linked to this batch, or logic matching course/name
    // Best to use batchId if we linked them.
    // If enrollments have batchId populated, use that.

    // Update enrollments
    await Enrollment.updateMany(
      { batchId: id },
      { $set: { status: "REJECTED", batchId: null } }
    );

    // Update enrollments based on course/name matching just in case (legacy safety)
    await Enrollment.updateMany(
      { courseTitle: batch.courseTitle, name: batch.name, status: "APPROVED" },
      { $set: { status: "REJECTED", batchId: null } }
    );

    await batch.deleteOne();

    res.json({ message: "Batch deleted and students un-enrolled" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete batch" });
  }
};

// PUT /api/language-training/admin/batches/:batchId/assign-trainer
export const assignTrainer = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const { trainerId } = req.body;

    if (!trainerId) {
      return res.status(400).json({ message: "trainerId is required" });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    batch.trainerId = trainerId;
    await batch.save();

    res.json({ message: "Trainer assigned successfully", batch });
  } catch (error) {
    res.status(500).json({ message: "Failed to assign trainer", error });
  }
};

// GET /api/language-training/admin/trainers
export const getTrainers = async (req: Request, res: Response) => {
  try {
    const trainers = await User.find({ role: 'trainer' })
      .select('name email _id +googleRefreshToken')
      .lean();

    res.json(
      trainers.map((trainer: any) => ({
        _id: trainer._id,
        name: trainer.name,
        email: trainer.email,
        googleCalendarConnected: !!trainer.googleRefreshToken,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch trainers", error });
  }
};

// POST /api/language-training/admin/promote-trainer
export const promoteToTrainer = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === 'trainer') {
      return res.status(400).json({ message: "User is already a trainer" });
    }

    user.role = 'trainer';
    await user.save();

    res.json({ message: `User ${user.name} (${user.email}) promoted to Trainer successfully.` });
  } catch (error) {
    res.status(500).json({ message: "Failed to promote user", error });
  }
};

// DELETE /api/language-training/admin/trainers/:id
export const demoteTrainer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== 'trainer') {
      return res.status(400).json({ message: "User is not a trainer" });
    }

    user.role = 'student';
    await user.save();

    res.json({ message: `Trainer demoted to Student successfully.` });
  } catch (error) {
    res.status(500).json({ message: "Failed to demote trainer", error });
  }
};

