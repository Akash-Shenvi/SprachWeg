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
exports.deleteUser = exports.getStudentDetails = exports.getStudents = exports.deleteActiveClass = exports.removeStudentFromActiveClass = exports.assignActiveClassTrainer = exports.getActiveClassStudents = exports.getActiveClasses = exports.getPendingAdminEnrollments = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const language_enrollment_model_1 = __importDefault(require("../models/language.enrollment.model"));
const enrollment_model_1 = __importDefault(require("../models/enrollment.model"));
const skillCourse_model_1 = __importDefault(require("../models/skillCourse.model"));
const trainingPaymentAttempt_model_1 = __importDefault(require("../models/trainingPaymentAttempt.model"));
const batch_model_1 = __importDefault(require("../models/batch.model"));
const classSession_model_1 = __importDefault(require("../models/classSession.model"));
const attendance_model_1 = __importDefault(require("../models/attendance.model"));
const assignment_model_1 = __importDefault(require("../models/assignment.model"));
const submission_model_1 = __importDefault(require("../models/submission.model"));
const chat_message_model_1 = __importDefault(require("../models/chat.message.model"));
const internshipApplication_model_1 = __importDefault(require("../models/internshipApplication.model"));
const internshipPaymentAttempt_model_1 = __importDefault(require("../models/internshipPaymentAttempt.model"));
const webinar_model_1 = __importDefault(require("../models/webinar.model"));
const webinarRegistration_model_1 = __importDefault(require("../models/webinarRegistration.model"));
const webinarPaymentAttempt_model_1 = __importDefault(require("../models/webinarPaymentAttempt.model"));
const language_batch_model_1 = __importDefault(require("../models/language.batch.model"));
const language_class_model_1 = __importDefault(require("../models/language.class.model"));
const language_material_model_1 = __importDefault(require("../models/language.material.model"));
const language_announcement_model_1 = __importDefault(require("../models/language.announcement.model"));
const announcement_model_1 = __importDefault(require("../models/announcement.model"));
const skill_material_model_1 = __importDefault(require("../models/skill.material.model"));
const institutionEnrollmentRequest_model_1 = __importDefault(require("../models/institutionEnrollmentRequest.model"));
const payment_helpers_1 = require("../utils/payment.helpers");
const roles_1 = require("../utils/roles");
const buildLanguagePaymentKey = (params) => {
    var _a, _b, _c;
    return [
        String((_a = params.userId) !== null && _a !== void 0 ? _a : '').trim(),
        String((_b = params.courseTitle) !== null && _b !== void 0 ? _b : '').trim().toLowerCase(),
        String((_c = params.levelName) !== null && _c !== void 0 ? _c : '').trim().toLowerCase(),
    ].join('::');
};
const buildSkillPaymentKey = (params) => {
    var _a, _b;
    return [
        String((_a = params.userId) !== null && _a !== void 0 ? _a : '').trim(),
        String((_b = params.skillCourseId) !== null && _b !== void 0 ? _b : '').trim(),
    ].join('::');
};
const toDisplayAmount = (subunits) => {
    const numericValue = Number(subunits);
    if (!Number.isFinite(numericValue)) {
        return null;
    }
    return Number((numericValue / 100).toFixed(2));
};
const normalizeSkillStatusForAdmin = (status) => {
    const normalizedStatus = String(status !== null && status !== void 0 ? status : '').trim().toLowerCase();
    if (normalizedStatus === 'pending')
        return 'PENDING';
    if (normalizedStatus === 'active')
        return 'APPROVED';
    if (normalizedStatus === 'dropped')
        return 'REJECTED';
    if (normalizedStatus === 'completed')
        return 'COMPLETED';
    return String(status !== null && status !== void 0 ? status : '').trim().toUpperCase();
};
const normalizeTrainingTypeForActiveClasses = (value) => {
    const normalizedValue = String(value !== null && value !== void 0 ? value : '').trim().toLowerCase();
    if (normalizedValue === 'language' || normalizedValue === 'skill') {
        return normalizedValue;
    }
    return null;
};
const buildActiveClassSummary = (batch, trainingType) => {
    var _a;
    return ({
        _id: String(batch._id),
        courseTitle: trainingType === 'language'
            ? String(batch.courseTitle || '').trim()
            : String(((_a = batch.courseId) === null || _a === void 0 ? void 0 : _a.title) || 'Skill Training').trim(),
        name: String(batch.name || '').trim(),
        studentCount: Array.isArray(batch.students) ? batch.students.length : 0,
        trainer: batch.trainerId || null,
        trainingType,
        createdAt: batch.createdAt || null,
    });
};
const loadActiveClasses = () => __awaiter(void 0, void 0, void 0, function* () {
    const [languageBatches, skillBatches] = yield Promise.all([
        language_batch_model_1.default.find({})
            .populate('trainerId', 'name email')
            .sort({ createdAt: -1 })
            .lean(),
        batch_model_1.default.find({ isActive: true })
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
});
const getPendingAdminEnrollments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 9));
        const search = String((_a = req.query.search) !== null && _a !== void 0 ? _a : '').trim();
        const level = String((_b = req.query.level) !== null && _b !== void 0 ? _b : '').trim();
        const matchingUserIds = search
            ? yield user_model_1.default.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phoneNumber: { $regex: search, $options: 'i' } },
                ],
            }).distinct('_id')
            : [];
        const languageFilter = { status: 'PENDING' };
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
        const skillFilter = { status: 'pending' };
        if (search) {
            const matchingSkillCourseIds = yield skillCourse_model_1.default.find({
                title: { $regex: search, $options: 'i' },
            }).distinct('_id');
            skillFilter.$or = [
                { studentId: { $in: matchingUserIds } },
                { courseId: { $in: matchingSkillCourseIds } },
            ];
        }
        const [languageEnrollments, skillEnrollments, availableLevels] = yield Promise.all([
            language_enrollment_model_1.default.find(languageFilter)
                .populate('userId', 'name email phoneNumber germanLevel guardianName guardianPhone qualification dateOfBirth avatar role createdAt')
                .sort({ createdAt: -1 }),
            level && level !== 'All'
                ? Promise.resolve([])
                : enrollment_model_1.default.find(skillFilter)
                    .populate('studentId', 'name email phoneNumber germanLevel guardianName guardianPhone qualification dateOfBirth avatar role createdAt')
                    .populate('courseId', 'title')
                    .sort({ createdAt: -1 }),
            language_enrollment_model_1.default.distinct('name', { status: 'PENDING' }),
        ]);
        const languagePaymentKeys = new Set(languageEnrollments.map((enrollment) => {
            var _a, _b;
            return buildLanguagePaymentKey({
                userId: (_b = (_a = enrollment.userId) === null || _a === void 0 ? void 0 : _a._id) !== null && _b !== void 0 ? _b : enrollment.userId,
                courseTitle: enrollment.courseTitle,
                levelName: enrollment.name,
            });
        }));
        const skillPaymentKeys = new Set(skillEnrollments.map((enrollment) => {
            var _a, _b, _c, _d;
            return buildSkillPaymentKey({
                userId: (_b = (_a = enrollment.studentId) === null || _a === void 0 ? void 0 : _a._id) !== null && _b !== void 0 ? _b : enrollment.studentId,
                skillCourseId: (_d = (_c = enrollment.courseId) === null || _c === void 0 ? void 0 : _c._id) !== null && _d !== void 0 ? _d : enrollment.courseId,
            });
        }));
        const [languagePaymentAttempts, skillPaymentAttempts] = yield Promise.all([
            languageEnrollments.length > 0
                ? trainingPaymentAttempt_model_1.default.find({
                    trainingType: 'language',
                    status: 'paid',
                    userId: {
                        $in: languageEnrollments.map((enrollment) => { var _a, _b; return (_b = (_a = enrollment.userId) === null || _a === void 0 ? void 0 : _a._id) !== null && _b !== void 0 ? _b : enrollment.userId; }),
                    },
                    courseTitle: {
                        $in: [...new Set(languageEnrollments.map((enrollment) => enrollment.courseTitle))],
                    },
                    levelName: {
                        $in: [...new Set(languageEnrollments.map((enrollment) => enrollment.name))],
                    },
                }).sort({ paidAt: -1, createdAt: -1 }).lean()
                : Promise.resolve([]),
            skillEnrollments.length > 0
                ? trainingPaymentAttempt_model_1.default.find({
                    trainingType: 'skill',
                    status: 'paid',
                    userId: {
                        $in: skillEnrollments.map((enrollment) => { var _a, _b; return (_b = (_a = enrollment.studentId) === null || _a === void 0 ? void 0 : _a._id) !== null && _b !== void 0 ? _b : enrollment.studentId; }),
                    },
                    skillCourseId: {
                        $in: skillEnrollments.map((enrollment) => { var _a, _b; return (_b = (_a = enrollment.courseId) === null || _a === void 0 ? void 0 : _a._id) !== null && _b !== void 0 ? _b : enrollment.courseId; }),
                    },
                }).sort({ paidAt: -1, createdAt: -1 }).lean()
                : Promise.resolve([]),
        ]);
        const languagePaymentSnapshotByKey = new Map();
        for (const attempt of languagePaymentAttempts) {
            const paymentKey = buildLanguagePaymentKey({
                userId: attempt.userId,
                courseTitle: attempt.courseTitle,
                levelName: attempt.levelName,
            });
            if (!languagePaymentKeys.has(paymentKey) || languagePaymentSnapshotByKey.has(paymentKey)) {
                continue;
            }
            languagePaymentSnapshotByKey.set(paymentKey, (0, payment_helpers_1.buildPaymentSnapshot)(attempt));
        }
        const skillPaymentSnapshotByKey = new Map();
        for (const attempt of skillPaymentAttempts) {
            const paymentKey = buildSkillPaymentKey({
                userId: attempt.userId,
                skillCourseId: attempt.skillCourseId,
            });
            if (!skillPaymentKeys.has(paymentKey) || skillPaymentSnapshotByKey.has(paymentKey)) {
                continue;
            }
            skillPaymentSnapshotByKey.set(paymentKey, (0, payment_helpers_1.buildPaymentSnapshot)(attempt));
        }
        const combinedEnrollments = [
            ...languageEnrollments.map((enrollment) => {
                var _a, _b;
                return (Object.assign(Object.assign({}, enrollment.toObject()), { trainingType: 'language', payment: languagePaymentSnapshotByKey.get(buildLanguagePaymentKey({
                        userId: (_b = (_a = enrollment.userId) === null || _a === void 0 ? void 0 : _a._id) !== null && _b !== void 0 ? _b : enrollment.userId,
                        courseTitle: enrollment.courseTitle,
                        levelName: enrollment.name,
                    })) || null }));
            }),
            ...skillEnrollments.map((enrollment) => {
                var _a, _b, _c, _d, _e;
                return ({
                    _id: enrollment._id,
                    userId: enrollment.studentId || null,
                    courseTitle: ((_a = enrollment.courseId) === null || _a === void 0 ? void 0 : _a.title) || 'Skill Training',
                    name: 'Skill Training',
                    status: normalizeSkillStatusForAdmin(enrollment.status),
                    createdAt: enrollment.createdAt,
                    trainingType: 'skill',
                    payment: skillPaymentSnapshotByKey.get(buildSkillPaymentKey({
                        userId: (_c = (_b = enrollment.studentId) === null || _b === void 0 ? void 0 : _b._id) !== null && _c !== void 0 ? _c : enrollment.studentId,
                        skillCourseId: (_e = (_d = enrollment.courseId) === null || _d === void 0 ? void 0 : _d._id) !== null && _e !== void 0 ? _e : enrollment.courseId,
                    })) || null,
                });
            }),
        ].sort((left, right) => {
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
    }
    catch (error) {
        console.error('Error fetching admin enrollments', error);
        res.status(500).json({ message: 'Error fetching admin enrollments', error });
    }
});
exports.getPendingAdminEnrollments = getPendingAdminEnrollments;
const getActiveClasses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 6));
        const search = String((_a = req.query.search) !== null && _a !== void 0 ? _a : '').trim().toLowerCase();
        const course = String((_b = req.query.course) !== null && _b !== void 0 ? _b : '').trim().toLowerCase();
        const trainingType = normalizeTrainingTypeForActiveClasses(req.query.trainingType);
        const activeClasses = yield loadActiveClasses();
        const availableCourses = ['All', ...new Set(activeClasses.map((item) => item.courseTitle).filter(Boolean))];
        const filteredClasses = activeClasses.filter((item) => {
            var _a;
            const matchesTrainingType = trainingType ? item.trainingType === trainingType : true;
            const matchesCourse = !course || course === 'all'
                ? true
                : item.courseTitle.trim().toLowerCase() === course;
            const matchesSearch = !search
                ? true
                : item.courseTitle.toLowerCase().includes(search)
                    || item.name.toLowerCase().includes(search)
                    || (((_a = item.trainer) === null || _a === void 0 ? void 0 : _a.name) || '').toLowerCase().includes(search);
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
    }
    catch (error) {
        console.error('Error fetching active classes', error);
        return res.status(500).json({ message: 'Error fetching active classes', error });
    }
});
exports.getActiveClasses = getActiveClasses;
const getActiveClassStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const trainingType = normalizeTrainingTypeForActiveClasses(req.query.trainingType);
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 8));
        const search = String((_a = req.query.search) !== null && _a !== void 0 ? _a : '').trim();
        if (!trainingType) {
            return res.status(400).json({ message: 'A valid trainingType is required.' });
        }
        if (trainingType === 'language') {
            const batch = yield language_batch_model_1.default.findById(id).populate('trainerId', 'name email');
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
        const batch = yield batch_model_1.default.findById(id)
            .populate('trainerId', 'name email')
            .populate('courseId', 'title');
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
        return res.status(200).json({
            batch: {
                _id: batch._id,
                courseTitle: ((_b = batch.courseId) === null || _b === void 0 ? void 0 : _b.title) || 'Skill Training',
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
    catch (error) {
        console.error('Error fetching active class students', error);
        return res.status(500).json({ message: 'Error fetching active class students', error });
    }
});
exports.getActiveClassStudents = getActiveClassStudents;
const assignActiveClassTrainer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            const batch = yield language_batch_model_1.default.findById(id);
            if (!batch) {
                return res.status(404).json({ message: 'Batch not found' });
            }
            batch.trainerId = trainerId;
            yield batch.save();
            return res.status(200).json({ message: 'Trainer assigned successfully', batch });
        }
        const batch = yield batch_model_1.default.findById(id);
        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }
        batch.trainerId = trainerId;
        yield batch.save();
        return res.status(200).json({ message: 'Trainer assigned successfully', batch });
    }
    catch (error) {
        console.error('Error assigning active class trainer', error);
        return res.status(500).json({ message: 'Error assigning active class trainer', error });
    }
});
exports.assignActiveClassTrainer = assignActiveClassTrainer;
const removeStudentFromActiveClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, studentId } = req.params;
        const trainingType = normalizeTrainingTypeForActiveClasses(req.query.trainingType);
        if (!trainingType) {
            return res.status(400).json({ message: 'A valid trainingType is required.' });
        }
        if (trainingType === 'language') {
            const batch = yield language_batch_model_1.default.findById(id);
            if (!batch) {
                return res.status(404).json({ message: 'Batch not found' });
            }
            batch.students = batch.students.filter((currentStudentId) => currentStudentId.toString() !== studentId);
            yield batch.save();
            const enrollment = yield language_enrollment_model_1.default.findOne({
                userId: studentId,
                batchId: id,
            });
            if (enrollment) {
                enrollment.status = 'REJECTED';
                enrollment.batchId = undefined;
                yield enrollment.save();
            }
            return res.status(200).json({ message: 'Student removed from active class successfully' });
        }
        const batch = yield batch_model_1.default.findById(id);
        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }
        batch.students = batch.students.filter((currentStudentId) => currentStudentId.toString() !== studentId);
        yield batch.save();
        const enrollment = yield enrollment_model_1.default.findOne({
            studentId,
            $or: [
                { batchId: id },
                { courseId: batch.courseId, status: 'active' },
            ],
        });
        if (enrollment) {
            enrollment.status = 'dropped';
            enrollment.batchId = undefined;
            yield enrollment.save();
        }
        return res.status(200).json({ message: 'Student removed from active class successfully' });
    }
    catch (error) {
        console.error('Error removing student from active class', error);
        return res.status(500).json({ message: 'Error removing student from active class', error });
    }
});
exports.removeStudentFromActiveClass = removeStudentFromActiveClass;
const deleteActiveClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const trainingType = normalizeTrainingTypeForActiveClasses(req.query.trainingType);
        if (!trainingType) {
            return res.status(400).json({ message: 'A valid trainingType is required.' });
        }
        if (trainingType === 'language') {
            const batch = yield language_batch_model_1.default.findById(id);
            if (!batch) {
                return res.status(404).json({ message: 'Batch not found' });
            }
            yield language_enrollment_model_1.default.updateMany({ batchId: id }, { $set: { status: 'REJECTED', batchId: null } });
            yield language_enrollment_model_1.default.updateMany({ courseTitle: batch.courseTitle, name: batch.name, status: 'APPROVED' }, { $set: { status: 'REJECTED', batchId: null } });
            yield batch.deleteOne();
            return res.status(200).json({ message: 'Active class deleted and students unenrolled successfully' });
        }
        const batch = yield batch_model_1.default.findById(id);
        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }
        const [skillClassIds, assignmentIds] = yield Promise.all([
            classSession_model_1.default.find({ batchId: id }).distinct('_id'),
            assignment_model_1.default.find({ batchId: id }).distinct('_id'),
        ]);
        yield Promise.all([
            enrollment_model_1.default.updateMany({ batchId: id }, { $set: { status: 'dropped', batchId: null } }),
            attendance_model_1.default.deleteMany({ classSessionId: { $in: skillClassIds } }),
            submission_model_1.default.deleteMany({ assignmentId: { $in: assignmentIds } }),
            announcement_model_1.default.deleteMany({ batchId: id }),
            skill_material_model_1.default.deleteMany({ batchId: id }),
            classSession_model_1.default.deleteMany({ batchId: id }),
            assignment_model_1.default.deleteMany({ batchId: id }),
            batch.deleteOne(),
        ]);
        return res.status(200).json({ message: 'Active class deleted and students unenrolled successfully' });
    }
    catch (error) {
        console.error('Error deleting active class', error);
        return res.status(500).json({ message: 'Error deleting active class', error });
    }
});
exports.deleteActiveClass = deleteActiveClass;
const getStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;
        const search = String((_a = req.query.search) !== null && _a !== void 0 ? _a : '').trim();
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } },
                { role: { $regex: search, $options: 'i' } },
            ];
        }
        const [totalUsers, users] = yield Promise.all([
            user_model_1.default.countDocuments(query),
            user_model_1.default.find(query)
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
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
});
exports.getStudents = getStudents;
const getStudentDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield user_model_1.default.findById(id).select('-password -otp -otpExpires -lastOtpSent -googleRefreshToken');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Fetch Language Enrollments
        const languageEnrollments = yield language_enrollment_model_1.default.find({ userId: id })
            .populate('batchId', 'courseTitle name')
            .sort({ createdAt: -1 });
        // Fetch Skill Enrollments
        const skillEnrollments = yield enrollment_model_1.default.find({ studentId: id })
            .populate('courseId', 'title')
            .sort({ createdAt: -1 });
        const normalizedSkillEnrollments = skillEnrollments.map((enrollment) => {
            const enrollmentObject = enrollment.toObject();
            return Object.assign(Object.assign({}, enrollmentObject), { status: normalizeSkillStatusForAdmin(enrollmentObject.status), skillCourseId: enrollmentObject.courseId || null });
        });
        res.status(200).json({
            user,
            student: user,
            languageEnrollments,
            skillEnrollments: normalizedSkillEnrollments,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching user details', error });
    }
});
exports.getStudentDetails = getStudentDetails;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield user_model_1.default.findById(id).select('name email role');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Admin accounts cannot be deleted.' });
        }
        const userId = user._id;
        const userIdString = String(user._id);
        const skillClassSessionIds = yield classSession_model_1.default.find({ trainerId: userId }).distinct('_id');
        const cleanupTasks = [
            language_enrollment_model_1.default.deleteMany({ userId }),
            enrollment_model_1.default.deleteMany({ studentId: userId }),
            trainingPaymentAttempt_model_1.default.deleteMany({ userId }),
            internshipApplication_model_1.default.deleteMany({ userId }),
            internshipPaymentAttempt_model_1.default.deleteMany({ userId }),
            webinarRegistration_model_1.default.deleteMany({ userId }),
            webinarPaymentAttempt_model_1.default.deleteMany({ userId }),
            submission_model_1.default.deleteMany({ studentId: userId }),
            attendance_model_1.default.deleteMany({ studentId: userId }),
            chat_message_model_1.default.deleteMany({
                $or: [
                    { studentId: userIdString },
                    { trainerId: userIdString },
                    { senderId: userIdString },
                ],
            }),
            language_batch_model_1.default.updateMany({ students: userId }, { $pull: { students: userId } }),
            language_batch_model_1.default.updateMany({ trainerId: userId }, { $unset: { trainerId: 1 } }),
            batch_model_1.default.updateMany({ students: userId }, { $pull: { students: userId } }),
            batch_model_1.default.updateMany({ trainerId: userId }, { $set: { isActive: false } }),
            language_class_model_1.default.updateMany({ 'attendees.studentId': userId }, { $pull: { attendees: { studentId: userId } } }),
            institutionEnrollmentRequest_model_1.default.updateMany({ 'students.createdUserId': userId }, { $set: { 'students.$[student].createdUserId': null } }, {
                arrayFilters: [{ 'student.createdUserId': userId }],
            }),
            language_material_model_1.default.deleteMany({ uploadedBy: userId }),
            skill_material_model_1.default.deleteMany({ uploadedBy: userId }),
            language_announcement_model_1.default.deleteMany({ senderId: userId }),
            language_class_model_1.default.deleteMany({ trainerId: userId }),
            announcement_model_1.default.deleteMany({ senderId: userId }),
            classSession_model_1.default.deleteMany({ trainerId: userId }),
            webinar_model_1.default.updateMany({ trainerId: userId }, {
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
            }),
        ];
        if (skillClassSessionIds.length > 0) {
            cleanupTasks.push(attendance_model_1.default.deleteMany({ classSessionId: { $in: skillClassSessionIds } }));
        }
        if (user.role === 'institution') {
            cleanupTasks.push(institutionEnrollmentRequest_model_1.default.deleteMany({ institutionId: userId }));
        }
        yield Promise.all(cleanupTasks);
        yield user.deleteOne();
        return res.status(200).json({
            message: 'User deleted successfully.',
            deletedUser: {
                _id: userId,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error('Error deleting user', error);
        return res.status(500).json({ message: 'Error deleting user', error });
    }
});
exports.deleteUser = deleteUser;
