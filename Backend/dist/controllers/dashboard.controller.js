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
        const batchIds = validEnrollments.map(e => e.batchId).filter(id => !!id);
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
            certificates: validEnrollments.filter(e => e.status === 'completed').length,
            weeklyGoalHours: 10,
            completedHours: 6.5
        };
        res.json({
            user: yield user_model_1.default.findById(studentId).select('name email avatar'),
            courses: validEnrollments.map(e => ({
                id: e.courseId._id,
                title: e.courseId.title,
                progress: e.progress,
                totalLessons: 24, // Placeholder
                completedLessons: e.completedLessons.length,
                thumbnail: e.courseId.image || '📚',
                difficulty: e.courseId.level || 'Beginner'
            })),
            upcomingClasses: upcomingClasses.map(c => ({
                id: c._id,
                title: c.topic,
                startsAt: c.startTime,
                instructor: c.trainerId.name,
                batch: c.batchId.name,
                status: c.status
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
        const studentIds = batches.reduce((acc, b) => [...acc, ...b.students], []);
        const uniqueStudentIds = [...new Set(studentIds.map(id => id.toString()))];
        const students = yield user_model_1.default.find({ _id: { $in: uniqueStudentIds } }).select('name email');
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
                course: b.courseId.title,
                students: b.students.length,
                attendance: 90, // Placeholder
                nextClass: 'Today, 10:00 AM'
            })),
            upcomingClasses: upcomingClasses.map(c => ({
                id: c._id,
                title: c.topic,
                time: c.startTime,
                batch: c.batchId.name,
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
    }
    catch (error) {
        console.error('Error fetching trainer dashboard:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getTrainerDashboard = getTrainerDashboard;
