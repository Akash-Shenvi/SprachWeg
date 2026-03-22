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
exports.rejectEnrollment = exports.acceptEnrollment = exports.getPendingEnrollments = exports.enrollStudent = void 0;
const enrollment_model_1 = __importDefault(require("../models/enrollment.model"));
const batch_model_1 = __importDefault(require("../models/batch.model"));
const skillCourse_model_1 = __importDefault(require("../models/skillCourse.model"));
// 1. Student requests enrollment
const enrollStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const studentId = req.user._id;
        const { courseId } = req.body;
        if (!courseId) {
            return res.status(400).json({ message: 'Course ID is required' });
        }
        // Check if already enrolled
        const existingEnrollment = yield enrollment_model_1.default.findOne({ studentId, courseId });
        if (existingEnrollment) {
            return res.status(400).json({ message: 'Already enrolled or request pending' });
        }
        const newEnrollment = new enrollment_model_1.default({
            studentId,
            courseId,
            status: 'pending', // Default to pending
            enrollmentDate: new Date()
        });
        yield newEnrollment.save();
        res.status(201).json({ message: 'Enrollment requested successfully', enrollment: newEnrollment });
    }
    catch (error) {
        console.error('Enrollment error:', error);
        res.status(500).json({ message: 'Server error during enrollment' });
    }
});
exports.enrollStudent = enrollStudent;
// 2. Trainer gets pending enrollments (for courses they might teach? or all pending?)
// For simplicity, let's fetch all pending enrollments for now, or filter by trainer's courses if we had that link.
const getPendingEnrollments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // In a real app, we might filter by courses related to this trainer.
        // For now, fetch all pending enrollments.
        const pendingEnrollments = yield enrollment_model_1.default.find({ status: 'pending' })
            .populate('studentId', 'name email')
            .populate('courseId', 'title');
        res.json(pendingEnrollments);
    }
    catch (error) {
        console.error('Fetch pending enrollments error:', error);
        res.status(500).json({ message: 'Server error fetching pending enrollments' });
    }
});
exports.getPendingEnrollments = getPendingEnrollments;
// 3. Trainer accepts enrollment -> Assigns to Batch
const acceptEnrollment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const actingUser = req.user;
        const actingUserId = actingUser === null || actingUser === void 0 ? void 0 : actingUser._id;
        const actingUserRole = String((_a = actingUser === null || actingUser === void 0 ? void 0 : actingUser.role) !== null && _a !== void 0 ? _a : '').trim().toLowerCase();
        const { enrollmentId } = req.body;
        const enrollment = yield enrollment_model_1.default.findById(enrollmentId);
        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }
        if (enrollment.status !== 'pending') {
            return res.status(400).json({ message: 'Enrollment is not pending' });
        }
        // Find a suitable batch (Same Course, Same Trainer, Active, < 20 students)
        // We fetch active batches for this course/trainer and check the size in application logic
        // because $where queries can be slow and unsafe.
        const batchQuery = {
            courseId: enrollment.courseId,
            isActive: true
        };
        if (actingUserRole === 'trainer') {
            batchQuery.trainerId = actingUserId;
        }
        const potentialBatches = yield batch_model_1.default.find(batchQuery);
        // Find the first batch with < 20 students
        let batch = potentialBatches.find(b => b.students.length < 20) || null;
        // If no suitable batch, create one immediately. Admin-created batches stay unassigned until a trainer is chosen.
        if (!batch) {
            const course = yield skillCourse_model_1.default.findById(enrollment.courseId);
            const courseTitle = course ? course.title : 'Course';
            // Basic new batch name logic
            const batchCountQuery = { courseId: enrollment.courseId };
            if (actingUserRole === 'trainer') {
                batchCountQuery.trainerId = actingUserId;
            }
            const batchCount = yield batch_model_1.default.countDocuments(batchCountQuery);
            const batchName = `${courseTitle} - Batch ${batchCount + 1}`;
            batch = new batch_model_1.default({
                name: batchName,
                courseId: enrollment.courseId,
                trainerId: actingUserRole === 'trainer' ? actingUserId : undefined,
                students: [],
                isActive: true,
                startDate: new Date(),
                // Default schedule/end date logic could go here
                schedule: { days: ['Mon', 'Wed', 'Fri'], startTime: '10:00', endTime: '11:00' } // Placeholder defaults
            });
            yield batch.save();
        }
        if (batch) {
            // Add student to batch only when a batch is available.
            if (!batch.students.some(studentId => studentId.equals(enrollment.studentId))) {
                batch.students.push(enrollment.studentId);
                yield batch.save();
            }
            enrollment.batchId = batch._id;
        }
        // Update enrollment
        enrollment.status = 'active';
        yield enrollment.save();
        res.json({ message: 'Enrollment accepted', batch: (batch === null || batch === void 0 ? void 0 : batch.name) || null, enrollment });
    }
    catch (error) {
        console.error('Accept enrollment error:', error);
        res.status(500).json({ message: 'Server error accepting enrollment' });
    }
});
exports.acceptEnrollment = acceptEnrollment;
// 4. Reject Enrollment
const rejectEnrollment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { enrollmentId } = req.body;
        yield enrollment_model_1.default.findByIdAndUpdate(enrollmentId, { status: 'dropped' }); // Or 'rejected' if we add that status
        res.json({ message: 'Enrollment rejected' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error rejecting enrollment' });
    }
});
exports.rejectEnrollment = rejectEnrollment;
