import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Batch from '../models/batch.model';
import ClassSession from '../models/classSession.model';
import Enrollment from '../models/enrollment.model';
import SkillCourse from '../models/skillCourse.model'; // Assuming this exists
import Attendance from '../models/attendance.model';
import User from '../models/user.model';

export const getStudentDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const studentId = (req as any).user._id;

        // 1. Get Enrolled Courses
        const enrollments = await Enrollment.find({
            studentId,
            status: { $in: ['active', 'completed'] },
        }).populate('courseId');
        const validEnrollments = enrollments.filter((enrollment: any) => enrollment.courseId);

        // 2. Get Upcoming Classes (from batches user is enrolled in)
        const batchIds = validEnrollments.map(e => e.batchId).filter(id => !!id) as mongoose.Types.ObjectId[];
        const upcomingClasses = await ClassSession.find({
            batchId: { $in: batchIds },
            startTime: { $gte: new Date() },
            status: { $ne: 'cancelled' }
        })
            .populate('batchId', 'name')
            .populate('trainerId', 'name')
            .sort({ startTime: 1 })
            .limit(5);

        // 3. Get Recent Progress (Timeline) - Mocking week structure for now from enrollments
        // In a real app, we'd have a Module/Lesson model. For now, we'll return structured enrollment data.

        // 4. Stats
        // Calculate streak (mock or simple logic)
        const stats = {
            streak: 12, // Placeholder
            certificates: validEnrollments.filter(e => e.status === 'completed').length,
            weeklyGoalHours: 10,
            completedHours: 6.5
        };

        res.json({
            user: await User.findById(studentId).select('name email avatar'),
            courses: validEnrollments.map(e => ({
                id: (e.courseId as any)._id,
                title: (e.courseId as any).title,
                progress: e.progress,
                totalLessons: 24, // Placeholder
                completedLessons: e.completedLessons.length,
                thumbnail: (e.courseId as any).image || '📚',
                difficulty: (e.courseId as any).level || 'Beginner'
            })),
            upcomingClasses: upcomingClasses.map(c => ({
                id: c._id,
                title: c.topic,
                startsAt: c.startTime,
                instructor: (c.trainerId as any).name,
                batch: (c.batchId as any).name,
                status: c.status
            })),
            stats
        });

    } catch (error) {
        console.error('Error fetching student dashboard:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getTrainerDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const trainerId = (req as any).user._id;

        // 1. Get Active Batches
        const batches = await Batch.find({ trainerId, isActive: true }).populate('courseId');

        // 2. Get Upcoming Classes
        const upcomingClasses = await ClassSession.find({
            trainerId,
            startTime: { $gte: new Date() },
            status: { $ne: 'cancelled' }
        }).populate('batchId', 'name').sort({ startTime: 1 }).limit(5);

        // 3. Get Students for Performance Table
        const studentIds = batches.reduce((acc, b) => [...acc, ...b.students], [] as mongoose.Types.ObjectId[]);
        const uniqueStudentIds = [...new Set(studentIds.map(id => id.toString()))];
        const students = await User.find({ _id: { $in: uniqueStudentIds } }).select('name email');

        // 4. Stats Aggregation
        const totalStudents = uniqueStudentIds.length;

        res.json({
            stats: {
                totalStudents,
                avgAttendance: 88, // Placeholder
                earnings: 2840 // Placeholder
            },
            batches: batches.map(b => ({
                id: b._id,
                name: b.name,
                course: (b.courseId as any).title,
                students: b.students.length,
                attendance: 90, // Placeholder
                nextClass: 'Today, 10:00 AM'
            })),
            upcomingClasses: upcomingClasses.map(c => ({
                id: c._id,
                title: c.topic,
                time: c.startTime,
                batch: (c.batchId as any).name,
                attendees: 0,
                status: c.status
            })),
            students: students.map(s => ({
                id: s._id,
                name: s.name,
                email: s.email,
                attendance: 85, // Placeholder
                lastActive: '2h ago', // Placeholder
                status: 'active' // Placeholder
            }))
        });

    } catch (error) {
        console.error('Error fetching trainer dashboard:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
