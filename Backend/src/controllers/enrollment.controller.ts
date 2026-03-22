import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Enrollment from '../models/enrollment.model';
import Batch from '../models/batch.model';
import SkillCourse from '../models/skillCourse.model';
import User from '../models/user.model';
import { EmailService } from '../utils/email.service';

const emailService = new EmailService();

// 1. Student requests enrollment
export const enrollStudent = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user._id;
        const { courseId } = req.body;

        if (!courseId) {
            return res.status(400).json({ message: 'Course ID is required' });
        }

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({ studentId, courseId });
        if (existingEnrollment) {
            return res.status(400).json({ message: 'Already enrolled or request pending' });
        }

        const newEnrollment = new Enrollment({
            studentId,
            courseId,
            status: 'pending', // Default to pending
            enrollmentDate: new Date()
        });

        await newEnrollment.save();

        res.status(201).json({ message: 'Enrollment requested successfully', enrollment: newEnrollment });
    } catch (error) {
        console.error('Enrollment error:', error);
        res.status(500).json({ message: 'Server error during enrollment' });
    }
};

// 2. Trainer gets pending enrollments (for courses they might teach? or all pending?)
// For simplicity, let's fetch all pending enrollments for now, or filter by trainer's courses if we had that link.
export const getPendingEnrollments = async (req: Request, res: Response) => {
    try {
        // In a real app, we might filter by courses related to this trainer.
        // For now, fetch all pending enrollments.
        const pendingEnrollments = await Enrollment.find({ status: 'pending' })
            .populate('studentId', 'name email')
            .populate('courseId', 'title');

        res.json(pendingEnrollments);
    } catch (error) {
        console.error('Fetch pending enrollments error:', error);
        res.status(500).json({ message: 'Server error fetching pending enrollments' });
    }
};

// 3. Trainer accepts enrollment -> Assigns to Batch
export const acceptEnrollment = async (req: Request, res: Response) => {
    try {
        const actingUser = (req as any).user;
        const actingUserId = actingUser?._id;
        const actingUserRole = String(actingUser?.role ?? '').trim().toLowerCase();
        const { enrollmentId } = req.body;

        const enrollment = await Enrollment.findById(enrollmentId);
        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        if (enrollment.status !== 'pending') {
            return res.status(400).json({ message: 'Enrollment is not pending' });
        }

        // Find a suitable batch (Same Course, Same Trainer, Active, < 20 students)
        // We fetch active batches for this course/trainer and check the size in application logic
        // because $where queries can be slow and unsafe.
        const batchQuery: any = {
            courseId: enrollment.courseId,
            isActive: true
        };
        if (actingUserRole === 'trainer') {
            batchQuery.trainerId = actingUserId;
        }

        const potentialBatches = await Batch.find(batchQuery);

        // Find the first batch with < 20 students
        let batch = potentialBatches.find(b => b.students.length < 20) || null;

        // If no suitable batch, create one immediately. Admin-created batches stay unassigned until a trainer is chosen.
        if (!batch) {
            const course = await SkillCourse.findById(enrollment.courseId);
            const courseTitle = course ? course.title : 'Course';

            // Basic new batch name logic
            const batchCountQuery: any = { courseId: enrollment.courseId };
            if (actingUserRole === 'trainer') {
                batchCountQuery.trainerId = actingUserId;
            }
            const batchCount = await Batch.countDocuments(batchCountQuery);
            const batchName = `${courseTitle} - Batch ${batchCount + 1}`;

            batch = new Batch({
                name: batchName,
                courseId: enrollment.courseId,
                trainerId: actingUserRole === 'trainer' ? actingUserId : undefined,
                students: [],
                isActive: true,
                startDate: new Date(),
                // Default schedule/end date logic could go here
                schedule: { days: ['Mon', 'Wed', 'Fri'], startTime: '10:00', endTime: '11:00' } // Placeholder defaults
            });
            await batch.save();
        }

        if (batch) {
            // Add student to batch only when a batch is available.
            if (!batch.students.some(studentId => studentId.equals(enrollment.studentId))) {
                batch.students.push(enrollment.studentId);
                await batch.save();
            }

            enrollment.batchId = batch._id as mongoose.Types.ObjectId;
        }

        // Update enrollment
        enrollment.status = 'active';
        await enrollment.save();

        const [student, course] = await Promise.all([
            User.findById(enrollment.studentId).select('name email'),
            SkillCourse.findById(enrollment.courseId).select('title'),
        ]);

        if (student?.email) {
            await emailService.sendEnrollmentEmail(
                student.email,
                student.name || 'Student',
                course?.title || 'Skill Training',
                'APPROVED'
            );
        }

        res.json({ message: 'Enrollment accepted', batch: batch?.name || null, enrollment });

    } catch (error) {
        console.error('Accept enrollment error:', error);
        res.status(500).json({ message: 'Server error accepting enrollment' });
    }
};

// 4. Reject Enrollment
export const rejectEnrollment = async (req: Request, res: Response) => {
    try {
        const { enrollmentId } = req.body;
        await Enrollment.findByIdAndUpdate(enrollmentId, { status: 'dropped' }); // Or 'rejected' if we add that status
        res.json({ message: 'Enrollment rejected' });
    } catch (error) {
        res.status(500).json({ message: 'Server error rejecting enrollment' });
    }
}
