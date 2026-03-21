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
exports.getStudentDetails = exports.getStudents = exports.getPendingAdminEnrollments = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const language_enrollment_model_1 = __importDefault(require("../models/language.enrollment.model"));
const enrollment_model_1 = __importDefault(require("../models/enrollment.model"));
const skillCourse_model_1 = __importDefault(require("../models/skillCourse.model"));
const trainingPaymentAttempt_model_1 = __importDefault(require("../models/trainingPaymentAttempt.model"));
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
const buildPaymentSnapshot = (attempt) => ({
    status: String(attempt.paymentStatus || attempt.status || '').trim(),
    amount: toDisplayAmount(attempt.amount),
    currency: String(attempt.currency || 'INR').trim().toUpperCase(),
    method: attempt.paymentMethod || null,
    gateway: String(attempt.paymentGateway || 'razorpay').trim(),
    razorpayOrderId: attempt.razorpayOrderId || null,
    razorpayPaymentId: attempt.razorpayPaymentId || null,
    paidAt: attempt.paidAt || attempt.createdAt || null,
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
            languagePaymentSnapshotByKey.set(paymentKey, buildPaymentSnapshot(attempt));
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
            skillPaymentSnapshotByKey.set(paymentKey, buildPaymentSnapshot(attempt));
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
