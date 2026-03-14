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
exports.demoteTrainer = exports.promoteToTrainer = exports.getTrainers = exports.assignTrainer = exports.deleteBatch = exports.removeStudentFromBatch = exports.getBatches = exports.rejectEnrollment = exports.approveEnrollment = exports.getEnrollments = exports.getMyEnrollments = exports.applyEnrollment = void 0;
const language_enrollment_model_1 = __importDefault(require("../models/language.enrollment.model"));
const language_batch_model_1 = __importDefault(require("../models/language.batch.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const email_service_1 = require("../utils/email.service");
const emailService = new email_service_1.EmailService();
/* ============================
   STUDENT APIs
============================ */
// POST /api/language-training/enroll
const applyEnrollment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { courseTitle, name } = req.body;
        if (!courseTitle || !name) {
            return res.status(400).json({ message: "courseTitle and name required" });
        }
        const exists = yield language_enrollment_model_1.default.findOne({
            userId: req.user._id,
            courseTitle,
            name,
        });
        if (exists) {
            if (exists.status === "REJECTED") {
                exists.status = "PENDING";
                exists.batchId = undefined;
                yield exists.save();
                // Send "Request Received" Email for Re-enrollment
                const userEmail = req.user.email;
                const userName = req.user.name;
                yield emailService.sendEnrollmentEmail(userEmail, userName, courseTitle, 'PENDING');
                return res.status(200).json({
                    message: "Re-enrollment submitted successfully.",
                    enrollment: exists,
                });
            }
            return res.status(409).json({ message: "Already enrolled or pending approval" });
        }
        const enrollment = yield language_enrollment_model_1.default.create({
            userId: req.user._id,
            courseTitle,
            name,
        });
        // Send "Request Received" Email
        const userEmail = req.user.email;
        const userName = req.user.name;
        yield emailService.sendEnrollmentEmail(userEmail, userName, courseTitle, 'PENDING');
        res.status(201).json({
            message: "Enrollment request submitted. Await admin approval.",
            enrollment,
        });
    }
    catch (err) {
        res.status(500).json({ message: "Enrollment failed" });
    }
});
exports.applyEnrollment = applyEnrollment;
// GET /api/language-training/my-enrollments
const getMyEnrollments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const enrollments = yield language_enrollment_model_1.default.find({
        userId: req.user._id,
    }).populate("batchId", "courseTitle name");
    res.json(enrollments);
});
exports.getMyEnrollments = getMyEnrollments;
/* ============================
   ADMIN APIs
============================ */
// GET /api/language-training/admin/enrollments?status=PENDING
const getEnrollments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = req.query.status ? { status: req.query.status } : {};
    const enrollments = yield language_enrollment_model_1.default.find(filter)
        .populate("userId", "name email phoneNumber germanLevel guardianName guardianPhone qualification dateOfBirth avatar role");
    res.json(enrollments);
});
exports.getEnrollments = getEnrollments;
// POST /api/language-training/admin/enroll/:id/approve
const approveEnrollment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const enrollment = yield language_enrollment_model_1.default.findById(req.params.id).populate('userId');
        if (!enrollment || enrollment.status !== "PENDING") {
            return res.status(400).json({ message: "Invalid enrollment" });
        }
        let batch = yield language_batch_model_1.default.findOne({
            courseTitle: enrollment.courseTitle,
            name: enrollment.name,
        });
        if (!batch) {
            batch = yield language_batch_model_1.default.create({
                courseTitle: enrollment.courseTitle,
                name: enrollment.name,
                students: [],
            });
        }
        if (!batch.students.some(id => id.equals(enrollment.userId))) {
            batch.students.push(enrollment.userId);
            yield batch.save();
        }
        enrollment.status = "APPROVED";
        enrollment.batchId = batch._id;
        yield enrollment.save();
        // Send "Approved" Email
        // Since we populated userId, it is now an object (depending on TS types). 
        // We cast to any or check type to access email.
        const studentUser = enrollment.userId;
        if (studentUser && studentUser.email) {
            yield emailService.sendEnrollmentEmail(studentUser.email, studentUser.name, enrollment.courseTitle, 'APPROVED');
        }
        res.json({
            message: "Enrollment approved and assigned to batch",
            enrollment,
        });
    }
    catch (err) {
        res.status(500).json({ message: "Approval failed" });
    }
});
exports.approveEnrollment = approveEnrollment;
// POST /api/language-training/admin/enroll/:id/reject
const rejectEnrollment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const enrollment = yield language_enrollment_model_1.default.findById(req.params.id);
    if (!enrollment || enrollment.status !== "PENDING") {
        return res.status(400).json({ message: "Invalid enrollment" });
    }
    enrollment.status = "REJECTED";
    yield enrollment.save();
    res.json({ message: "Enrollment rejected" });
});
exports.rejectEnrollment = rejectEnrollment;
// GET /api/language-training/admin/batches
const getBatches = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const batches = yield language_batch_model_1.default.find()
        .populate("students", "name email");
    res.json(batches);
});
exports.getBatches = getBatches;
// DELETE /api/language-training/admin/batches/:batchId/students/:studentId
const removeStudentFromBatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { batchId, studentId } = req.params;
        // 1. Remove from Batch
        const batch = yield language_batch_model_1.default.findById(batchId);
        if (!batch) {
            return res.status(404).json({ message: "Batch not found" });
        }
        batch.students = batch.students.filter(id => id.toString() !== studentId);
        yield batch.save();
        // 2. Update Enrollment Status
        // Find enrollment for this user & this batch
        const enrollment = yield language_enrollment_model_1.default.findOne({
            userId: studentId,
            batchId: batchId
        });
        if (enrollment) {
            enrollment.status = "REJECTED"; // Or set to a new status like "DROPPED" if preferred
            enrollment.batchId = undefined; // Unlink batch
            yield enrollment.save();
        }
        res.json({ message: "Student removed from batch successfully" });
    }
    catch (error) {
        console.error("Error removing student:", error);
        res.status(500).json({ message: "Failed to remove student" });
    }
});
exports.removeStudentFromBatch = removeStudentFromBatch;
// DELETE /api/language-training/admin/batches/:id
const deleteBatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const batch = yield language_batch_model_1.default.findById(id);
        if (!batch) {
            return res.status(404).json({ message: "Batch not found" });
        }
        // Un-enroll all students in this batch (Reject them)
        // We strictly look for enrollments linked to this batch, or logic matching course/name
        // Best to use batchId if we linked them.
        // If enrollments have batchId populated, use that.
        // Update enrollments
        yield language_enrollment_model_1.default.updateMany({ batchId: id }, { $set: { status: "REJECTED", batchId: null } });
        // Update enrollments based on course/name matching just in case (legacy safety)
        yield language_enrollment_model_1.default.updateMany({ courseTitle: batch.courseTitle, name: batch.name, status: "APPROVED" }, { $set: { status: "REJECTED", batchId: null } });
        yield batch.deleteOne();
        res.json({ message: "Batch deleted and students un-enrolled" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete batch" });
    }
});
exports.deleteBatch = deleteBatch;
// PUT /api/language-training/admin/batches/:batchId/assign-trainer
const assignTrainer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { batchId } = req.params;
        const { trainerId } = req.body;
        if (!trainerId) {
            return res.status(400).json({ message: "trainerId is required" });
        }
        const batch = yield language_batch_model_1.default.findById(batchId);
        if (!batch) {
            return res.status(404).json({ message: "Batch not found" });
        }
        batch.trainerId = trainerId;
        yield batch.save();
        res.json({ message: "Trainer assigned successfully", batch });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to assign trainer", error });
    }
});
exports.assignTrainer = assignTrainer;
// GET /api/language-training/admin/trainers
const getTrainers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const trainers = yield user_model_1.default.find({ role: 'trainer' }).select('name email _id');
        res.json(trainers);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch trainers", error });
    }
});
exports.getTrainers = getTrainers;
// POST /api/language-training/admin/promote-trainer
const promoteToTrainer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ message: "Email is required" });
        const user = yield user_model_1.default.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.role === 'trainer') {
            return res.status(400).json({ message: "User is already a trainer" });
        }
        user.role = 'trainer';
        yield user.save();
        res.json({ message: `User ${user.name} (${user.email}) promoted to Trainer successfully.` });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to promote user", error });
    }
});
exports.promoteToTrainer = promoteToTrainer;
// DELETE /api/language-training/admin/trainers/:id
const demoteTrainer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield user_model_1.default.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.role !== 'trainer') {
            return res.status(400).json({ message: "User is not a trainer" });
        }
        user.role = 'student';
        yield user.save();
        res.json({ message: `Trainer demoted to Student successfully.` });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to demote trainer", error });
    }
});
exports.demoteTrainer = demoteTrainer;
