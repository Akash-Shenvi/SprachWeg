import { Request, Response } from 'express';
import User from '../models/user.model';
import Enrollment from '../models/language.enrollment.model';
import SkillEnrollment from '../models/enrollment.model';
import SkillCourse from '../models/skillCourse.model';
import TrainingPaymentAttempt from '../models/trainingPaymentAttempt.model';
import SkillBatch from '../models/batch.model';
import ClassSession from '../models/classSession.model';
import Attendance from '../models/attendance.model';
import Assignment from '../models/assignment.model';
import Submission from '../models/submission.model';
import ChatMessage from '../models/chat.message.model';
import InternshipApplication from '../models/internshipApplication.model';
import InternshipPaymentAttempt from '../models/internshipPaymentAttempt.model';
import Webinar from '../models/webinar.model';
import WebinarRegistration from '../models/webinarRegistration.model';
import WebinarPaymentAttempt from '../models/webinarPaymentAttempt.model';
import LanguageBatch from '../models/language.batch.model';
import LanguageClass from '../models/language.class.model';
import LanguageMaterial from '../models/language.material.model';
import LanguageAnnouncement from '../models/language.announcement.model';
import Announcement from '../models/announcement.model';
import SkillMaterial from '../models/skill.material.model';
import InstitutionEnrollmentRequest from '../models/institutionEnrollmentRequest.model';

const buildLanguagePaymentKey = (params: {
    userId: unknown;
    courseTitle: unknown;
    levelName: unknown;
}) => [
    String(params.userId ?? '').trim(),
    String(params.courseTitle ?? '').trim().toLowerCase(),
    String(params.levelName ?? '').trim().toLowerCase(),
].join('::');

const buildSkillPaymentKey = (params: {
    userId: unknown;
    skillCourseId: unknown;
}) => [
    String(params.userId ?? '').trim(),
    String(params.skillCourseId ?? '').trim(),
].join('::');

const toDisplayAmount = (subunits?: number) => {
    const numericValue = Number(subunits);
    if (!Number.isFinite(numericValue)) {
        return null;
    }

    return Number((numericValue / 100).toFixed(2));
};

const normalizeSkillStatusForAdmin = (status?: string) => {
    const normalizedStatus = String(status ?? '').trim().toLowerCase();

    if (normalizedStatus === 'pending') return 'PENDING';
    if (normalizedStatus === 'active') return 'APPROVED';
    if (normalizedStatus === 'dropped') return 'REJECTED';
    if (normalizedStatus === 'completed') return 'COMPLETED';

    return String(status ?? '').trim().toUpperCase();
};

const buildPaymentSnapshot = (attempt: any) => ({
    status: String(attempt.paymentStatus || attempt.status || '').trim(),
    amount: toDisplayAmount(attempt.amount),
    currency: String(attempt.currency || 'INR').trim().toUpperCase(),
    method: attempt.paymentMethod || null,
    gateway: String(attempt.paymentGateway || 'razorpay').trim(),
    razorpayOrderId: attempt.razorpayOrderId || null,
    razorpayPaymentId: attempt.razorpayPaymentId || null,
    paidAt: attempt.paidAt || attempt.createdAt || null,
});

const normalizeTrainingTypeForActiveClasses = (value: unknown) => {
    const normalizedValue = String(value ?? '').trim().toLowerCase();

    if (normalizedValue === 'language' || normalizedValue === 'skill') {
        return normalizedValue as 'language' | 'skill';
    }

    return null;
};

const buildActiveClassSummary = (batch: any, trainingType: 'language' | 'skill') => ({
    _id: String(batch._id),
    courseTitle:
        trainingType === 'language'
            ? String(batch.courseTitle || '').trim()
            : String(batch.courseId?.title || 'Skill Training').trim(),
    name: String(batch.name || '').trim(),
    studentCount: Array.isArray(batch.students) ? batch.students.length : 0,
    trainer: batch.trainerId || null,
    trainingType,
    createdAt: batch.createdAt || null,
});

const loadActiveClasses = async () => {
    const [languageBatches, skillBatches] = await Promise.all([
        LanguageBatch.find({})
            .populate('trainerId', 'name email')
            .sort({ createdAt: -1 })
            .lean(),
        SkillBatch.find({ isActive: true })
            .populate('trainerId', 'name email')
            .populate('courseId', 'title')
            .sort({ createdAt: -1 })
            .lean(),
    ]);

    return [
        ...languageBatches.map((batch) => buildActiveClassSummary(batch, 'language')),
        ...skillBatches.map((batch) => buildActiveClassSummary(batch, 'skill')),
    ].sort((left, right) => {
        const leftTime = new Date(left.createdAt || 0).getTime();
        const rightTime = new Date(right.createdAt || 0).getTime();
        return rightTime - leftTime;
    });
};

export const getPendingAdminEnrollments = async (req: Request, res: Response) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 9));
        const search = String(req.query.search ?? '').trim();
        const level = String(req.query.level ?? '').trim();

        const matchingUserIds = search
            ? await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phoneNumber: { $regex: search, $options: 'i' } },
                ],
            }).distinct('_id')
            : [];

        const languageFilter: any = { status: 'PENDING' };
        if (level && level !== 'All') {
            languageFilter.name = level;
        }
        if (search) {
            languageFilter.$or = [
                { courseTitle: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
                { userId: { $in: matchingUserIds } },
            ];
        }

        const skillFilter: any = { status: 'pending' };
        if (search) {
            const matchingSkillCourseIds = await SkillCourse.find({
                title: { $regex: search, $options: 'i' },
            }).distinct('_id');

            skillFilter.$or = [
                { studentId: { $in: matchingUserIds } },
                { courseId: { $in: matchingSkillCourseIds } },
            ];
        }

        const [languageEnrollments, skillEnrollments, availableLevels] = await Promise.all([
            Enrollment.find(languageFilter)
                .populate('userId', 'name email phoneNumber germanLevel guardianName guardianPhone qualification dateOfBirth avatar role createdAt')
                .sort({ createdAt: -1 }),
            level && level !== 'All'
                ? Promise.resolve([])
                : SkillEnrollment.find(skillFilter)
                    .populate('studentId', 'name email phoneNumber germanLevel guardianName guardianPhone qualification dateOfBirth avatar role createdAt')
                    .populate('courseId', 'title')
                    .sort({ createdAt: -1 }),
            Enrollment.distinct('name', { status: 'PENDING' }),
        ]);

        const languagePaymentKeys = new Set(
            languageEnrollments.map((enrollment: any) =>
                buildLanguagePaymentKey({
                    userId: enrollment.userId?._id ?? enrollment.userId,
                    courseTitle: enrollment.courseTitle,
                    levelName: enrollment.name,
                })
            )
        );

        const skillPaymentKeys = new Set(
            (skillEnrollments as any[]).map((enrollment: any) =>
                buildSkillPaymentKey({
                    userId: enrollment.studentId?._id ?? enrollment.studentId,
                    skillCourseId: enrollment.courseId?._id ?? enrollment.courseId,
                })
            )
        );

        const [languagePaymentAttempts, skillPaymentAttempts] = await Promise.all([
            languageEnrollments.length > 0
                ? TrainingPaymentAttempt.find({
                    trainingType: 'language',
                    status: 'paid',
                    userId: {
                        $in: languageEnrollments.map((enrollment: any) => enrollment.userId?._id ?? enrollment.userId),
                    },
                    courseTitle: {
                        $in: [...new Set(languageEnrollments.map((enrollment: any) => enrollment.courseTitle))],
                    },
                    levelName: {
                        $in: [...new Set(languageEnrollments.map((enrollment: any) => enrollment.name))],
                    },
                }).sort({ paidAt: -1, createdAt: -1 }).lean()
                : Promise.resolve([]),
            (skillEnrollments as any[]).length > 0
                ? TrainingPaymentAttempt.find({
                    trainingType: 'skill',
                    status: 'paid',
                    userId: {
                        $in: (skillEnrollments as any[]).map((enrollment: any) => enrollment.studentId?._id ?? enrollment.studentId),
                    },
                    skillCourseId: {
                        $in: (skillEnrollments as any[]).map((enrollment: any) => enrollment.courseId?._id ?? enrollment.courseId),
                    },
                }).sort({ paidAt: -1, createdAt: -1 }).lean()
                : Promise.resolve([]),
        ]);

        const languagePaymentSnapshotByKey = new Map<string, ReturnType<typeof buildPaymentSnapshot>>();
        for (const attempt of languagePaymentAttempts) {
            const paymentKey = buildLanguagePaymentKey({
                userId: attempt.userId,
                courseTitle: attempt.courseTitle,
                levelName: attempt.levelName,
            });

            if (!languagePaymentKeys.has(paymentKey) || languagePaymentSnapshotByKey.has(paymentKey)) {
                continue;
            }

            languagePaymentSnapshotByKey.set(paymentKey, buildPaymentSnapshot(attempt));
        }

        const skillPaymentSnapshotByKey = new Map<string, ReturnType<typeof buildPaymentSnapshot>>();
        for (const attempt of skillPaymentAttempts) {
            const paymentKey = buildSkillPaymentKey({
                userId: attempt.userId,
                skillCourseId: attempt.skillCourseId,
            });

            if (!skillPaymentKeys.has(paymentKey) || skillPaymentSnapshotByKey.has(paymentKey)) {
                continue;
            }

            skillPaymentSnapshotByKey.set(paymentKey, buildPaymentSnapshot(attempt));
        }

        const combinedEnrollments = [
            ...languageEnrollments.map((enrollment: any) => ({
                ...enrollment.toObject(),
                trainingType: 'language' as const,
                payment: languagePaymentSnapshotByKey.get(buildLanguagePaymentKey({
                    userId: enrollment.userId?._id ?? enrollment.userId,
                    courseTitle: enrollment.courseTitle,
                    levelName: enrollment.name,
                })) || null,
            })),
            ...(skillEnrollments as any[]).map((enrollment: any) => ({
                _id: enrollment._id,
                userId: enrollment.studentId || null,
                courseTitle: enrollment.courseId?.title || 'Skill Training',
                name: 'Skill Training',
                status: normalizeSkillStatusForAdmin(enrollment.status),
                createdAt: enrollment.createdAt,
                trainingType: 'skill' as const,
                payment: skillPaymentSnapshotByKey.get(buildSkillPaymentKey({
                    userId: enrollment.studentId?._id ?? enrollment.studentId,
                    skillCourseId: enrollment.courseId?._id ?? enrollment.courseId,
                })) || null,
            })),
        ].sort((left: any, right: any) => {
            const leftTime = new Date(left.createdAt || 0).getTime();
            const rightTime = new Date(right.createdAt || 0).getTime();
            return rightTime - leftTime;
        });

        const totalEnrollments = combinedEnrollments.length;
        const totalPages = Math.max(1, Math.ceil(totalEnrollments / limit));
        const currentPage = Math.min(page, totalPages);
        const startIndex = (currentPage - 1) * limit;

        return res.status(200).json({
            enrollments: combinedEnrollments.slice(startIndex, startIndex + limit),
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
        console.error('Error fetching admin enrollments', error);
        res.status(500).json({ message: 'Error fetching admin enrollments', error });
    }
};

export const getActiveClasses = async (req: Request, res: Response) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 6));
        const search = String(req.query.search ?? '').trim().toLowerCase();
        const course = String(req.query.course ?? '').trim().toLowerCase();
        const trainingType = normalizeTrainingTypeForActiveClasses(req.query.trainingType);

        const activeClasses = await loadActiveClasses();
        const availableCourses = ['All', ...new Set(activeClasses.map((item) => item.courseTitle).filter(Boolean))];

        const filteredClasses = activeClasses.filter((item) => {
            const matchesTrainingType = trainingType ? item.trainingType === trainingType : true;
            const matchesCourse = !course || course === 'all'
                ? true
                : item.courseTitle.trim().toLowerCase() === course;
            const matchesSearch = !search
                ? true
                : item.courseTitle.toLowerCase().includes(search)
                || item.name.toLowerCase().includes(search)
                || (item.trainer?.name || '').toLowerCase().includes(search);

            return matchesTrainingType && matchesCourse && matchesSearch;
        });

        const totalClasses = filteredClasses.length;
        const totalPages = Math.max(1, Math.ceil(totalClasses / limit));
        const currentPage = Math.min(page, totalPages);
        const startIndex = (currentPage - 1) * limit;

        return res.status(200).json({
            batches: filteredClasses.slice(startIndex, startIndex + limit),
            availableCourses,
            pagination: {
                currentPage,
                totalPages,
                totalBatches: totalClasses,
                limit,
                hasPreviousPage: currentPage > 1,
                hasNextPage: currentPage < totalPages,
            },
        });
    } catch (error) {
        console.error('Error fetching active classes', error);
        return res.status(500).json({ message: 'Error fetching active classes', error });
    }
};

export const getActiveClassStudents = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const trainingType = normalizeTrainingTypeForActiveClasses(req.query.trainingType);
        const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 8));
        const search = String(req.query.search ?? '').trim();

        if (!trainingType) {
            return res.status(400).json({ message: 'A valid trainingType is required.' });
        }

        if (trainingType === 'language') {
            const batch = await LanguageBatch.findById(id).populate('trainerId', 'name email');
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

            return res.status(200).json({
                batch: {
                    _id: batch._id,
                    courseTitle: batch.courseTitle,
                    name: batch.name,
                    trainer: batch.trainerId || null,
                    studentCount: batch.students.length,
                    trainingType,
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
        }

        const batch = await SkillBatch.findById(id)
            .populate('trainerId', 'name email')
            .populate('courseId', 'title');
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

        return res.status(200).json({
            batch: {
                _id: batch._id,
                courseTitle: (batch.courseId as any)?.title || 'Skill Training',
                name: batch.name,
                trainer: batch.trainerId || null,
                studentCount: batch.students.length,
                trainingType,
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
        console.error('Error fetching active class students', error);
        return res.status(500).json({ message: 'Error fetching active class students', error });
    }
};

export const assignActiveClassTrainer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { trainerId, trainingType: rawTrainingType } = req.body || {};
        const trainingType = normalizeTrainingTypeForActiveClasses(rawTrainingType);

        if (!trainingType) {
            return res.status(400).json({ message: 'A valid trainingType is required.' });
        }

        if (!trainerId) {
            return res.status(400).json({ message: 'trainerId is required' });
        }

        if (trainingType === 'language') {
            const batch = await LanguageBatch.findById(id);
            if (!batch) {
                return res.status(404).json({ message: 'Batch not found' });
            }

            batch.trainerId = trainerId;
            await batch.save();

            return res.status(200).json({ message: 'Trainer assigned successfully', batch });
        }

        const batch = await SkillBatch.findById(id);
        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }

        batch.trainerId = trainerId;
        await batch.save();

        return res.status(200).json({ message: 'Trainer assigned successfully', batch });
    } catch (error) {
        console.error('Error assigning active class trainer', error);
        return res.status(500).json({ message: 'Error assigning active class trainer', error });
    }
};

export const removeStudentFromActiveClass = async (req: Request, res: Response) => {
    try {
        const { id, studentId } = req.params;
        const trainingType = normalizeTrainingTypeForActiveClasses(req.query.trainingType);

        if (!trainingType) {
            return res.status(400).json({ message: 'A valid trainingType is required.' });
        }

        if (trainingType === 'language') {
            const batch = await LanguageBatch.findById(id);
            if (!batch) {
                return res.status(404).json({ message: 'Batch not found' });
            }

            batch.students = batch.students.filter((currentStudentId) => currentStudentId.toString() !== studentId);
            await batch.save();

            const enrollment = await Enrollment.findOne({
                userId: studentId,
                batchId: id,
            });

            if (enrollment) {
                enrollment.status = 'REJECTED';
                enrollment.batchId = undefined;
                await enrollment.save();
            }

            return res.status(200).json({ message: 'Student removed from active class successfully' });
        }

        const batch = await SkillBatch.findById(id);
        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }

        batch.students = batch.students.filter((currentStudentId) => currentStudentId.toString() !== studentId);
        await batch.save();

        const enrollment = await SkillEnrollment.findOne({
            studentId,
            $or: [
                { batchId: id },
                { courseId: batch.courseId, status: 'active' },
            ],
        });

        if (enrollment) {
            enrollment.status = 'dropped';
            enrollment.batchId = undefined;
            await enrollment.save();
        }

        return res.status(200).json({ message: 'Student removed from active class successfully' });
    } catch (error) {
        console.error('Error removing student from active class', error);
        return res.status(500).json({ message: 'Error removing student from active class', error });
    }
};

export const deleteActiveClass = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const trainingType = normalizeTrainingTypeForActiveClasses(req.query.trainingType);

        if (!trainingType) {
            return res.status(400).json({ message: 'A valid trainingType is required.' });
        }

        if (trainingType === 'language') {
            const batch = await LanguageBatch.findById(id);
            if (!batch) {
                return res.status(404).json({ message: 'Batch not found' });
            }

            await Enrollment.updateMany(
                { batchId: id },
                { $set: { status: 'REJECTED', batchId: null } }
            );

            await Enrollment.updateMany(
                { courseTitle: batch.courseTitle, name: batch.name, status: 'APPROVED' },
                { $set: { status: 'REJECTED', batchId: null } }
            );

            await batch.deleteOne();

            return res.status(200).json({ message: 'Active class deleted and students unenrolled successfully' });
        }

        const batch = await SkillBatch.findById(id);
        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }

        const [skillClassIds, assignmentIds] = await Promise.all([
            ClassSession.find({ batchId: id }).distinct('_id'),
            Assignment.find({ batchId: id }).distinct('_id'),
        ]);

        await Promise.all([
            SkillEnrollment.updateMany(
                { batchId: id },
                { $set: { status: 'dropped', batchId: null } }
            ),
            Attendance.deleteMany({ classSessionId: { $in: skillClassIds } }),
            Submission.deleteMany({ assignmentId: { $in: assignmentIds } }),
            Announcement.deleteMany({ batchId: id }),
            SkillMaterial.deleteMany({ batchId: id }),
            ClassSession.deleteMany({ batchId: id }),
            Assignment.deleteMany({ batchId: id }),
            batch.deleteOne(),
        ]);

        return res.status(200).json({ message: 'Active class deleted and students unenrolled successfully' });
    } catch (error) {
        console.error('Error deleting active class', error);
        return res.status(500).json({ message: 'Error deleting active class', error });
    }
};

export const getStudents = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 10;
        const skip = (page - 1) * limit;
        const search = String(req.query.search ?? '').trim();

        const query: Record<string, unknown> = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } },
                { role: { $regex: search, $options: 'i' } },
            ];
        }

        const [totalUsers, users] = await Promise.all([
            User.countDocuments(query),
            User.find(query)
                .select('-password -otp -otpExpires -lastOtpSent -googleRefreshToken')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
        ]);

        res.status(200).json({
            users,
            students: users,
            totalPages: Math.ceil(totalUsers / limit),
            currentPage: page,
            totalUsers,
            totalStudents: totalUsers,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
};

export const getStudentDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select('-password -otp -otpExpires -lastOtpSent -googleRefreshToken');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch Language Enrollments
        const languageEnrollments = await Enrollment.find({ userId: id })
            .populate('batchId', 'courseTitle name')
            .sort({ createdAt: -1 });

        // Fetch Skill Enrollments
        const skillEnrollments = await SkillEnrollment.find({ studentId: id })
            .populate('courseId', 'title')
            .sort({ createdAt: -1 });

        const normalizedSkillEnrollments = skillEnrollments.map((enrollment: any) => {
            const enrollmentObject = enrollment.toObject();

            return {
                ...enrollmentObject,
                status: normalizeSkillStatusForAdmin(enrollmentObject.status),
                skillCourseId: enrollmentObject.courseId || null,
            };
        });

        res.status(200).json({
            user,
            student: user,
            languageEnrollments,
            skillEnrollments: normalizedSkillEnrollments,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user details', error });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select('name email role');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Admin accounts cannot be deleted.' });
        }

        const userId = user._id;
        const userIdString = String(user._id);
        const skillClassSessionIds = await ClassSession.find({ trainerId: userId }).distinct('_id');

        const cleanupTasks: Promise<unknown>[] = [
            Enrollment.deleteMany({ userId }),
            SkillEnrollment.deleteMany({ studentId: userId }),
            TrainingPaymentAttempt.deleteMany({ userId }),
            InternshipApplication.deleteMany({ userId }),
            InternshipPaymentAttempt.deleteMany({ userId }),
            WebinarRegistration.deleteMany({ userId }),
            WebinarPaymentAttempt.deleteMany({ userId }),
            Submission.deleteMany({ studentId: userId }),
            Attendance.deleteMany({ studentId: userId }),
            ChatMessage.deleteMany({
                $or: [
                    { studentId: userIdString },
                    { trainerId: userIdString },
                    { senderId: userIdString },
                ],
            }),
            LanguageBatch.updateMany({ students: userId }, { $pull: { students: userId } }),
            LanguageBatch.updateMany({ trainerId: userId }, { $unset: { trainerId: 1 } }),
            SkillBatch.updateMany({ students: userId }, { $pull: { students: userId } }),
            SkillBatch.updateMany({ trainerId: userId }, { $set: { isActive: false } }),
            LanguageClass.updateMany(
                { 'attendees.studentId': userId },
                { $pull: { attendees: { studentId: userId } } }
            ),
            InstitutionEnrollmentRequest.updateMany(
                { 'students.createdUserId': userId },
                { $set: { 'students.$[student].createdUserId': null } },
                {
                    arrayFilters: [{ 'student.createdUserId': userId }],
                }
            ),
            LanguageMaterial.deleteMany({ uploadedBy: userId }),
            SkillMaterial.deleteMany({ uploadedBy: userId }),
            LanguageAnnouncement.deleteMany({ senderId: userId }),
            LanguageClass.deleteMany({ trainerId: userId }),
            Announcement.deleteMany({ senderId: userId }),
            ClassSession.deleteMany({ trainerId: userId }),
            Webinar.updateMany(
                { trainerId: userId },
                {
                    $set: {
                        calendarSyncStatus: 'needs_trainer_connection',
                        calendarSyncError: 'Trainer account deleted.',
                        isActive: false,
                    },
                    $unset: {
                        trainerId: 1,
                        joinLink: 1,
                        googleCalendarEventId: 1,
                    },
                }
            ),
        ];

        if (skillClassSessionIds.length > 0) {
            cleanupTasks.push(Attendance.deleteMany({ classSessionId: { $in: skillClassSessionIds } }));
        }

        if (user.role === 'institution') {
            cleanupTasks.push(InstitutionEnrollmentRequest.deleteMany({ institutionId: userId }));
        }

        await Promise.all(cleanupTasks);
        await user.deleteOne();

        return res.status(200).json({
            message: 'User deleted successfully.',
            deletedUser: {
                _id: userId,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Error deleting user', error);
        return res.status(500).json({ message: 'Error deleting user', error });
    }
};
