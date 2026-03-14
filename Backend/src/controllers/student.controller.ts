import { Request, Response } from 'express';
import User from '../models/user.model';
import Enrollment from '../models/language.enrollment.model';
import SkillEnrollment from '../models/enrollment.model';

export const getStudents = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search as string || '';

        const query: any = { role: 'student' };
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const totalStudents = await User.countDocuments(query);
        const students = await User.find(query)
            .select('-password -otp -otpExpires -lastOtpSent')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.status(200).json({
            students,
            totalPages: Math.ceil(totalStudents / limit),
            currentPage: page,
            totalStudents
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students', error });
    }
};

export const getStudentDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const student = await User.findById(id).select('-password -otp -otpExpires -lastOtpSent -googleRefreshToken');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Fetch Language Enrollments
        const languageEnrollments = await Enrollment.find({ userId: id })
            .populate('batchId', 'courseTitle name')
            .sort({ createdAt: -1 });

        // Fetch Skill Enrollments
        const skillEnrollments = await SkillEnrollment.find({ userId: id })
            .populate('skillCourseId', 'title')
            .sort({ createdAt: -1 });

        res.status(200).json({
            student,
            languageEnrollments,
            skillEnrollments
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student details', error });
    }
};
