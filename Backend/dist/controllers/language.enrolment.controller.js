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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoteTrainer = exports.promoteToTrainer = exports.getTrainers = exports.assignTrainer = exports.deleteBatch = exports.removeStudentFromBatch = exports.getBatchStudents = exports.getBatches = exports.rejectEnrollment = exports.approveEnrollment = exports.getEnrollments = exports.getMyEnrollments = exports.applyEnrollment = void 0;
const language_enrollment_model_1 = __importDefault(require("../models/language.enrollment.model"));
const language_batch_model_1 = __importDefault(require("../models/language.batch.model"));
const trainingPaymentAttempt_model_1 = __importDefault(require("../models/trainingPaymentAttempt.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const email_service_1 = require("../utils/email.service");
const payment_helpers_1 = require("../utils/payment.helpers");
const roles_1 = require("../utils/roles");
const emailService = new email_service_1.EmailService();
const buildLanguagePaymentKey = (params) => {
    var _a, _b, _c;
    return [
        String((_a = params.userId) !== null && _a !== void 0 ? _a : '').trim(),
        String((_b = params.courseTitle) !== null && _b !== void 0 ? _b : '').trim().toLowerCase(),
        String((_c = params.levelName) !== null && _c !== void 0 ? _c : '').trim().toLowerCase(),
    ].join('::');
};
const toDisplayAmount = (subunits) => {
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
    var _a, _b, _c;
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 9));
        const status = String((_a = req.query.status) !== null && _a !== void 0 ? _a : '').trim();
        const level = String((_b = req.query.level) !== null && _b !== void 0 ? _b : '').trim();
        const search = String((_c = req.query.search) !== null && _c !== void 0 ? _c : '').trim();
        const filter = {};
        if (status) {
            filter.status = status;
        }
        if (level && level !== 'All') {
            filter.name = level;
        }
        if (search) {
            const matchingUserIds = yield user_model_1.default.find({
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
        const totalEnrollments = yield language_enrollment_model_1.default.countDocuments(filter);
        const totalPages = Math.max(1, Math.ceil(totalEnrollments / limit));
        const currentPage = Math.min(page, totalPages);
        const enrollments = yield language_enrollment_model_1.default.find(filter)
            .populate('userId', 'name email phoneNumber germanLevel guardianName guardianPhone qualification dateOfBirth avatar role createdAt')
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * limit)
            .limit(limit);
        const enrollmentPaymentKeys = enrollments.map((enrollment) => {
            var _a, _b;
            return buildLanguagePaymentKey({
                userId: (_b = (_a = enrollment.userId) === null || _a === void 0 ? void 0 : _a._id) !== null && _b !== void 0 ? _b : enrollment.userId,
                courseTitle: enrollment.courseTitle,
                levelName: enrollment.name,
            });
        });
        const enrollmentPaymentKeySet = new Set(enrollmentPaymentKeys);
        const matchingPaymentAttempts = enrollments.length > 0
            ? yield trainingPaymentAttempt_model_1.default.find({
                trainingType: 'language',
                status: 'paid',
                userId: {
                    $in: enrollments.map((enrollment) => { var _a, _b; return (_b = (_a = enrollment.userId) === null || _a === void 0 ? void 0 : _a._id) !== null && _b !== void 0 ? _b : enrollment.userId; }),
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
        const paymentSnapshotByKey = new Map();
        for (const attempt of matchingPaymentAttempts) {
            const paymentKey = buildLanguagePaymentKey({
                userId: attempt.userId,
                courseTitle: attempt.courseTitle,
                levelName: attempt.levelName,
            });
            if (!enrollmentPaymentKeySet.has(paymentKey) || paymentSnapshotByKey.has(paymentKey)) {
                continue;
            }
            paymentSnapshotByKey.set(paymentKey, (0, payment_helpers_1.buildPaymentSnapshot)(attempt));
        }
        const enrollmentsWithPayment = enrollments.map((enrollment) => {
            var _a, _b;
            return (Object.assign(Object.assign({}, enrollment.toObject()), { payment: paymentSnapshotByKey.get(buildLanguagePaymentKey({
                    userId: (_b = (_a = enrollment.userId) === null || _a === void 0 ? void 0 : _a._id) !== null && _b !== void 0 ? _b : enrollment.userId,
                    courseTitle: enrollment.courseTitle,
                    levelName: enrollment.name,
                })) || null }));
        });
        const availableLevels = yield language_enrollment_model_1.default.distinct('name', status ? { status } : {});
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
    }
    catch (error) {
        console.error('Failed to fetch enrollments:', error);
        return res.status(500).json({ message: 'Failed to fetch enrollments' });
    }
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
    var _a, _b;
    try {
        const search = String((_a = req.query.search) !== null && _a !== void 0 ? _a : '').trim();
        const course = String((_b = req.query.course) !== null && _b !== void 0 ? _b : '').trim();
        const hasPaginationQuery = req.query.page !== undefined
            || req.query.limit !== undefined
            || search.length > 0
            || course.length > 0;
        const filter = {};
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
            const batches = yield language_batch_model_1.default.find(filter)
                .populate('students', 'name email')
                .sort({ createdAt: -1 });
            return res.json(batches);
        }
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 6));
        const totalBatches = yield language_batch_model_1.default.countDocuments(filter);
        const totalPages = Math.max(1, Math.ceil(totalBatches / limit));
        const currentPage = Math.min(page, totalPages);
        const batches = yield language_batch_model_1.default.find(filter)
            .populate('trainerId', 'name email')
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * limit)
            .limit(limit)
            .lean();
        const availableCourses = yield language_batch_model_1.default.distinct('courseTitle');
        const serializedBatches = batches.map((batch) => {
            const { students, trainerId } = batch, rest = __rest(batch, ["students", "trainerId"]);
            return Object.assign(Object.assign({}, rest), { studentCount: Array.isArray(students) ? students.length : 0, trainer: trainerId || null });
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
    }
    catch (error) {
        console.error('Failed to fetch batches:', error);
        return res.status(500).json({ message: 'Failed to fetch batches' });
    }
});
exports.getBatches = getBatches;
// GET /api/language-training/admin/batches/:batchId/students
const getBatchStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { batchId } = req.params;
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 8));
        const search = String((_a = req.query.search) !== null && _a !== void 0 ? _a : '').trim();
        const batch = yield language_batch_model_1.default.findById(batchId).populate('trainerId', 'name email');
        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }
        const studentFilter = {
            _id: { $in: batch.students },
            role: { $in: [...roles_1.LEARNER_ROLES] },
        };
        if (search) {
            studentFilter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } },
            ];
        }
        const totalStudents = yield user_model_1.default.countDocuments(studentFilter);
        const totalPages = Math.max(1, Math.ceil(totalStudents / limit));
        const currentPage = Math.min(page, totalPages);
        const students = yield user_model_1.default.find(studentFilter)
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
    }
    catch (error) {
        console.error('Failed to fetch batch students:', error);
        return res.status(500).json({ message: 'Failed to fetch batch students' });
    }
});
exports.getBatchStudents = getBatchStudents;
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
        const trainers = yield user_model_1.default.find({ role: 'trainer' })
            .select('name email _id +googleRefreshToken')
            .lean();
        res.json(trainers.map((trainer) => ({
            _id: trainer._id,
            name: trainer.name,
            email: trainer.email,
            googleCalendarConnected: !!trainer.googleRefreshToken,
        })));
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
