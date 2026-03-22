"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrainerDashboard = exports.getStudentDashboard = void 0;
const batch_model_1 = __importDefault(require("../models/batch.model"));
const classSession_model_1 = __importDefault(require("../models/classSession.model"));
const enrollment_model_1 = __importDefault(require("../models/enrollment.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const getStudentDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const studentId = req.user._id;
        // 1. Get Enrolled Courses
        const enrollments = yield enrollment_model_1.default.find({
            studentId,
            status: { $in: ['active', 'completed'] },
        }).populate('courseId');
        const validEnrollments = enrollments.filter((enrollment) => enrollment.courseId);
        // 2. Get Upcoming Classes (from batches user is enrolled in)
        const batchIds = validEnrollments.map((enrollment) => enrollment.batchId).filter(Boolean);
        const batches = yield batch_model_1.default.find({
            _id: { $in: batchIds },
        })
            .select('trainerId isActive')
            .populate('trainerId', 'name');
        const batchMap = new Map(batches.map((batch) => [String(batch._id), batch]));
        const upcomingClasses = yield classSession_model_1.default.find({
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
            certificates: validEnrollments.filter((enrollment) => enrollment.status === 'completed').length,
            weeklyGoalHours: 10,
            completedHours: 6.5
        };
        const dashboardCourses = validEnrollments.map((enrollment) => {
            const normalizedBatchId = enrollment.batchId ? String(enrollment.batchId) : null;
            const batch = normalizedBatchId ? batchMap.get(normalizedBatchId) : null;
            const trainer = (batch === null || batch === void 0 ? void 0 : batch.isActive) === false ? null : (batch === null || batch === void 0 ? void 0 : batch.trainerId) || null;
            return {
                id: enrollment.courseId._id,
                batchId: normalizedBatchId,
                title: enrollment.courseId.title,
                progress: enrollment.progress,
                totalLessons: 24, // Placeholder
                completedLessons: enrollment.completedLessons.length,
                thumbnail: enrollment.courseId.image || '',
                difficulty: enrollment.courseId.level || 'Beginner',
                trainerId: trainer ? {
                    _id: String(trainer._id),
                    name: trainer.name || 'Trainer',
                } : null,
            };
        });
        res.json({
            user: yield user_model_1.default.findById(studentId).select('name email avatar'),
            courses: dashboardCourses,
            upcomingClasses: upcomingClasses.map((skillClass) => ({
                id: skillClass._id,
                title: skillClass.topic,
                startsAt: skillClass.startTime,
                instructor: skillClass.trainerId.name,
                batch: skillClass.batchId.name,
                status: skillClass.status
            })),
            stats
        });
    }
    catch (error) {
        console.error('Error fetching student dashboard:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getStudentDashboard = getStudentDashboard;
const getTrainerDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const trainerId = req.user._id;
        // 1. Get Active Batches
        const batches = yield batch_model_1.default.find({ trainerId, isActive: true }).populate('courseId');
        // 2. Get Upcoming Classes
        const upcomingClasses = yield classSession_model_1.default.find({
            trainerId,
            startTime: { $gte: new Date() },
            status: { $ne: 'cancelled' }
        }).populate('batchId', 'name').sort({ startTime: 1 }).limit(5);
        // 3. Get Students for Performance Table
        const studentIds = batches.reduce((acc, batch) => [...acc, ...batch.students], []);
        const uniqueStudentIds = [...new Set(studentIds.map((id) => id.toString()))];
        const students = yield user_model_1.default.find({ _id: { $in: uniqueStudentIds } }).select('name email');
        // 4. Stats Aggregation
        const totalStudents = uniqueStudentIds.length;
        res.json({
            stats: {
                totalStudents,
                avgAttendance: 88, // Placeholder
                earnings: 2840 // Placeholder
            },
            batches: batches.map((batch) => ({
                id: batch._id,
                name: batch.name,
                course: batch.courseId.title,
                students: batch.students.length,
                attendance: 90, // Placeholder
                nextClass: 'Today, 10:00 AM'
            })),
            upcomingClasses: upcomingClasses.map((skillClass) => ({
                id: skillClass._id,
                title: skillClass.topic,
                time: skillClass.startTime,
                batch: skillClass.batchId.name,
                attendees: 0,
                status: skillClass.status
            })),
            students: students.map((student) => ({
                id: student._id,
                name: student.name,
                email: student.email,
                attendance: 85, // Placeholder
                lastActive: '2h ago', // Placeholder
                status: 'active' // Placeholder
            }))
        });
    }
    catch (error) {
        console.error('Error fetching trainer dashboard:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getTrainerDashboard = getTrainerDashboard;
