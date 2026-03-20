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
exports.recordTrainingPaymentFailure = exports.verifyTrainingPayment = exports.createTrainingCheckout = exports.deleteTrainingPaymentAttempt = exports.getAllTrainingPaymentAttempts = void 0;
const env_1 = require("../config/env");
const language_enrollment_model_1 = __importDefault(require("../models/language.enrollment.model"));
const enrollment_model_1 = __importDefault(require("../models/enrollment.model"));
const languageCourse_model_1 = __importDefault(require("../models/languageCourse.model"));
const skillCourse_model_1 = __importDefault(require("../models/skillCourse.model"));
const skillTrainingDetail_model_1 = __importDefault(require("../models/skillTrainingDetail.model"));
const trainingPaymentAttempt_model_1 = __importDefault(require("../models/trainingPaymentAttempt.model"));
const email_service_1 = require("../utils/email.service");
const razorpay_1 = require("../utils/razorpay");
const emailService = new email_service_1.EmailService();
const successfulPaymentStatuses = ['authorized', 'captured'];
const trainingPortalBaseUrl = 'https://training.sovirtechnologies.in';
const extractNumericPrice = (value) => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value !== 'string') {
        return null;
    }
    const normalizedValue = value.replace(/[^0-9.]/g, '');
    if (!normalizedValue) {
        return null;
    }
    const parsedValue = Number(normalizedValue);
    return Number.isFinite(parsedValue) ? parsedValue : null;
};
const extractSingleAmount = (value) => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value !== 'string') {
        return null;
    }
    const amountMatches = value.match(/\d[\d,]*(?:\.\d+)?/g) || [];
    if (amountMatches.length !== 1) {
        return null;
    }
    const parsedValue = Number(amountMatches[0].replace(/,/g, ''));
    return Number.isFinite(parsedValue) ? parsedValue : null;
};
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeOrigin = (value) => String(value !== null && value !== void 0 ? value : '').trim().toLowerCase();
const normalizeCurrency = (currency) => String(currency || 'INR').trim().toUpperCase();
const toDisplayAmount = (subunits) => Number((subunits / 100).toFixed(2));
const isSuccessfulPaymentStatus = (status) => successfulPaymentStatuses.includes(String(status !== null && status !== void 0 ? status : '').trim().toLowerCase());
const syncAttemptWithPayment = (attempt, payment, options) => {
    if (payment.id)
        attempt.razorpayPaymentId = payment.id;
    if (payment.order_id)
        attempt.razorpayOrderId = payment.order_id;
    if (payment.status)
        attempt.paymentStatus = payment.status;
    if (payment.method)
        attempt.paymentMethod = payment.method;
    if (payment.email)
        attempt.paymentEmail = payment.email;
    if (payment.contact)
        attempt.paymentContact = payment.contact;
    if (payment.error_code)
        attempt.paymentErrorCode = payment.error_code;
    if (payment.error_description)
        attempt.paymentErrorDescription = payment.error_description;
    if (payment.error_source)
        attempt.paymentErrorSource = payment.error_source;
    if (payment.error_step)
        attempt.paymentErrorStep = payment.error_step;
    if (payment.error_reason)
        attempt.paymentErrorReason = payment.error_reason;
    if (options === null || options === void 0 ? void 0 : options.signature)
        attempt.razorpaySignature = options.signature;
    if (options === null || options === void 0 ? void 0 : options.failureReason)
        attempt.failureReason = options.failureReason;
    if ((options === null || options === void 0 ? void 0 : options.status) === 'paid') {
        attempt.status = 'paid';
        attempt.paidAt = attempt.paidAt || new Date();
    }
    else if (options === null || options === void 0 ? void 0 : options.status) {
        attempt.status = options.status;
    }
};
const buildPaymentFailureReason = (payload) => payload.reason
    || payload.description
    || payload.errorDescription
    || payload.errorReason
    || 'Payment failed before enrollment verification could complete.';
const trainingRetryPathByOrigin = {
    english: '/training/english',
    german: '/training/german',
    japanese: '/training/japanese',
    'plc-automation': '/skill-training/plc',
    'scada-hmi': '/skill-training/scada',
    'industrial-drives': '/skill-training/drives',
    'industry-4.0': '/skill-training/industry4',
    'corporate-training': '/skill-training/corporate',
};
const getTrainingRetryUrl = (attempt) => {
    const retryPath = trainingRetryPathByOrigin[normalizeOrigin(attempt.origin)];
    if (retryPath) {
        return `${trainingPortalBaseUrl}${retryPath}`;
    }
    return attempt.trainingType === 'language'
        ? `${trainingPortalBaseUrl}/language-training`
        : `${trainingPortalBaseUrl}/skill-training`;
};
const shouldSendPaymentFailureEmail = (attempt) => {
    var _a;
    if (attempt.status !== 'failed' && attempt.status !== 'cancelled') {
        return false;
    }
    if (attempt.paymentFailureEmailSentAt) {
        return false;
    }
    const normalizedReason = String((_a = attempt.failureReason) !== null && _a !== void 0 ? _a : '').trim().toLowerCase();
    if (normalizedReason === 'superseded by a newer checkout attempt.') {
        return false;
    }
    return true;
};
const sendPaymentFailureEmailIfNeeded = (attempt, user) => __awaiter(void 0, void 0, void 0, function* () {
    if (!shouldSendPaymentFailureEmail(attempt)) {
        return;
    }
    const recipientEmail = String((user === null || user === void 0 ? void 0 : user.email) || attempt.paymentEmail || '').trim();
    if (!recipientEmail) {
        return;
    }
    const emailSent = yield emailService.sendTrainingPaymentFailureEmail({
        to: recipientEmail,
        name: String((user === null || user === void 0 ? void 0 : user.name) || 'Student').trim(),
        courseTitle: attempt.courseTitle,
        trainingType: attempt.trainingType,
        levelName: attempt.levelName,
        amount: toDisplayAmount(attempt.amount),
        currency: attempt.currency,
        paymentStatus: attempt.paymentStatus || 'Not available',
        paymentMethod: attempt.paymentMethod,
        failureReason: attempt.failureReason || attempt.paymentErrorDescription || attempt.paymentErrorReason,
        status: attempt.status === 'cancelled' ? 'cancelled' : 'failed',
        retryUrl: getTrainingRetryUrl(attempt),
    });
    if (!emailSent) {
        return;
    }
    attempt.paymentFailureEmailSentAt = new Date();
    yield attempt.save();
});
const getAllTrainingPaymentAttempts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const rawPage = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 6));
        const issuesOnly = String((_a = req.query.issuesOnly) !== null && _a !== void 0 ? _a : '').trim().toLowerCase() === 'true';
        const status = String((_b = req.query.status) !== null && _b !== void 0 ? _b : '').trim().toLowerCase();
        const filters = {};
        if (issuesOnly || status === 'issues') {
            filters.status = { $in: ['failed', 'cancelled'] };
        }
        else if (['created', 'paid', 'failed', 'cancelled'].includes(status)) {
            filters.status = status;
        }
        const totalItems = yield trainingPaymentAttempt_model_1.default.countDocuments(filters);
        const totalPages = Math.max(1, Math.ceil(totalItems / limit));
        const page = Math.min(rawPage, totalPages);
        const paymentAttempts = yield trainingPaymentAttempt_model_1.default.find(filters)
            .populate('userId', 'name email phoneNumber role avatar')
            .populate('skillCourseId', 'title')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });
        return res.status(200).json({
            paymentAttempts,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasPreviousPage: page > 1,
                hasNextPage: page < totalPages,
            },
        });
    }
    catch (error) {
        console.error('Fetching training payment attempts failed:', error);
        return res.status(500).json({ message: 'Failed to fetch training payment attempts.' });
    }
});
exports.getAllTrainingPaymentAttempts = getAllTrainingPaymentAttempts;
const deleteTrainingPaymentAttempt = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const paymentAttempt = yield trainingPaymentAttempt_model_1.default.findById(id);
        if (!paymentAttempt) {
            return res.status(404).json({ message: 'Training payment attempt not found.' });
        }
        if (paymentAttempt.status !== 'failed' && paymentAttempt.status !== 'cancelled') {
            return res.status(400).json({ message: 'Only failed or cancelled payment attempts can be deleted.' });
        }
        yield paymentAttempt.deleteOne();
        return res.status(200).json({ message: 'Training payment attempt deleted successfully.' });
    }
    catch (error) {
        console.error('Deleting training payment attempt failed:', error);
        return res.status(500).json({ message: 'Failed to delete training payment attempt.' });
    }
});
exports.deleteTrainingPaymentAttempt = deleteTrainingPaymentAttempt;
const languageOriginMap = {
    english: { keyword: 'English', courseTitle: 'English' },
    german: { keyword: 'German', courseTitle: 'German' },
    japanese: { keyword: 'Japanese', courseTitle: 'Japanese' },
};
const skillOriginPatterns = {
    'plc-automation': /plc|programmable logic/i,
    'scada-hmi': /scada|hmi/i,
    'industrial-drives': /industrial drives|motion control|drives/i,
    'industry-4.0': /industry\s*4\.0/i,
    'corporate-training': /corporate training/i,
};
const resolveLanguageSelection = (origin, selectedLevel) => __awaiter(void 0, void 0, void 0, function* () {
    const mapping = languageOriginMap[origin];
    if (!mapping) {
        return null;
    }
    const course = yield languageCourse_model_1.default.findOne({
        title: { $regex: mapping.keyword, $options: 'i' },
    });
    if (!course) {
        return null;
    }
    const normalizedSelectedLevel = String(selectedLevel !== null && selectedLevel !== void 0 ? selectedLevel : '').trim().toLowerCase();
    const level = course.levels.find((item) => { var _a; return String((_a = item === null || item === void 0 ? void 0 : item.name) !== null && _a !== void 0 ? _a : '').trim().toLowerCase() === normalizedSelectedLevel; });
    if (!level) {
        return {
            error: `The selected level is no longer available for ${mapping.courseTitle}.`,
        };
    }
    const resolvedPrice = extractNumericPrice(level.price);
    if (resolvedPrice === null || resolvedPrice <= 0) {
        return {
            error: `The payment amount for ${mapping.courseTitle} ${level.name} is not configured correctly.`,
        };
    }
    return {
        trainingType: 'language',
        origin,
        courseTitle: mapping.courseTitle,
        displayCourseTitle: course.title,
        levelName: level.name,
        amount: Math.round(resolvedPrice * 100),
        currency: normalizeCurrency(),
    };
});
const resolveSkillSelection = (origin) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const originPattern = new RegExp(`^${escapeRegex(origin)}$`, 'i');
    let detail = yield skillTrainingDetail_model_1.default.findOne({
        origin: { $regex: originPattern },
    }).populate('skillCourseId');
    let populatedSkillCourse = detail === null || detail === void 0 ? void 0 : detail.skillCourseId;
    if (!detail) {
        const exactTitleMatch = yield skillCourse_model_1.default.findOne({
            title: { $regex: originPattern },
        });
        if (exactTitleMatch === null || exactTitleMatch === void 0 ? void 0 : exactTitleMatch._id) {
            detail = yield skillTrainingDetail_model_1.default.findOne({ skillCourseId: exactTitleMatch._id }).populate('skillCourseId');
            populatedSkillCourse = detail === null || detail === void 0 ? void 0 : detail.skillCourseId;
            if (!populatedSkillCourse) {
                populatedSkillCourse = exactTitleMatch;
            }
        }
    }
    let course = populatedSkillCourse || null;
    if (!course) {
        const fallbackPattern = skillOriginPatterns[origin];
        if (!fallbackPattern) {
            return null;
        }
        course = yield skillCourse_model_1.default.findOne({
            title: { $regex: fallbackPattern },
        });
    }
    if (!course) {
        return null;
    }
    const resolvedPrice = (_a = extractNumericPrice(course.price)) !== null && _a !== void 0 ? _a : extractSingleAmount(detail === null || detail === void 0 ? void 0 : detail.fees);
    if (resolvedPrice === null || resolvedPrice <= 0) {
        return {
            error: `The payment amount for ${course.title} is not configured correctly. Please set a single course price or a single fee amount in skill details.`,
        };
    }
    return {
        trainingType: 'skill',
        origin,
        courseTitle: String(course.title).trim(),
        displayCourseTitle: String(course.title).trim(),
        skillCourseId: course._id,
        amount: Math.round(resolvedPrice * 100),
        currency: normalizeCurrency(),
    };
});
const findExistingPaidEnrollment = (attempt) => __awaiter(void 0, void 0, void 0, function* () {
    if (attempt.trainingType === 'language' && attempt.levelName) {
        return language_enrollment_model_1.default.findOne({
            userId: attempt.userId,
            courseTitle: attempt.courseTitle,
            name: attempt.levelName,
        });
    }
    if (attempt.trainingType === 'skill' && attempt.skillCourseId) {
        return enrollment_model_1.default.findOne({
            studentId: attempt.userId,
            courseId: attempt.skillCourseId,
        });
    }
    return null;
});
const upsertLanguageEnrollment = (attempt) => __awaiter(void 0, void 0, void 0, function* () {
    if (!attempt.levelName) {
        throw new Error('Language level details are missing for this payment attempt.');
    }
    const existingEnrollment = yield language_enrollment_model_1.default.findOne({
        userId: attempt.userId,
        courseTitle: attempt.courseTitle,
        name: attempt.levelName,
    });
    let shouldSendEnrollmentEmail = false;
    let enrollment = existingEnrollment;
    if (!enrollment) {
        enrollment = yield language_enrollment_model_1.default.create({
            userId: attempt.userId,
            courseTitle: attempt.courseTitle,
            name: attempt.levelName,
        });
        shouldSendEnrollmentEmail = true;
    }
    else if (enrollment.status === 'REJECTED') {
        enrollment.status = 'PENDING';
        enrollment.batchId = undefined;
        yield enrollment.save();
        shouldSendEnrollmentEmail = true;
    }
    return {
        enrollment,
        shouldSendEnrollmentEmail,
        enrollmentEmailCourseTitle: `${attempt.courseTitle} - ${attempt.levelName}`,
    };
});
const upsertSkillEnrollment = (attempt) => __awaiter(void 0, void 0, void 0, function* () {
    if (!attempt.skillCourseId) {
        throw new Error('Skill course details are missing for this payment attempt.');
    }
    const existingEnrollment = yield enrollment_model_1.default.findOne({
        studentId: attempt.userId,
        courseId: attempt.skillCourseId,
    });
    let shouldSendEnrollmentEmail = false;
    let enrollment = existingEnrollment;
    if (!enrollment) {
        enrollment = yield enrollment_model_1.default.create({
            studentId: attempt.userId,
            courseId: attempt.skillCourseId,
            status: 'pending',
            enrollmentDate: new Date(),
            progress: 0,
            completedLessons: [],
        });
        shouldSendEnrollmentEmail = true;
    }
    else if (enrollment.status === 'dropped') {
        enrollment.status = 'pending';
        enrollment.batchId = undefined;
        enrollment.enrollmentDate = new Date();
        enrollment.progress = 0;
        enrollment.completedLessons = [];
        yield enrollment.save();
        shouldSendEnrollmentEmail = true;
    }
    return {
        enrollment,
        shouldSendEnrollmentEmail,
        enrollmentEmailCourseTitle: attempt.courseTitle,
    };
});
const upsertEnrollmentFromAttempt = (attempt) => __awaiter(void 0, void 0, void 0, function* () {
    if (attempt.trainingType === 'language') {
        return upsertLanguageEnrollment(attempt);
    }
    return upsertSkillEnrollment(attempt);
});
const createTrainingCheckout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Please log in to continue with payment.' });
        }
        const origin = normalizeOrigin((_a = req.body) === null || _a === void 0 ? void 0 : _a.origin);
        const selectedLevel = String((_c = (_b = req.body) === null || _b === void 0 ? void 0 : _b.selectedLevel) !== null && _c !== void 0 ? _c : '').trim();
        if (!origin) {
            return res.status(400).json({ message: 'A valid training selection is required.' });
        }
        const resolvedSelection = languageOriginMap[origin]
            ? yield resolveLanguageSelection(origin, selectedLevel)
            : yield resolveSkillSelection(origin);
        if (!resolvedSelection) {
            return res.status(404).json({ message: 'The selected training is no longer available.' });
        }
        if ('error' in resolvedSelection) {
            return res.status(400).json({ message: resolvedSelection.error });
        }
        if (resolvedSelection.trainingType === 'language') {
            const existingEnrollment = yield language_enrollment_model_1.default.findOne({
                userId: user._id,
                courseTitle: resolvedSelection.courseTitle,
                name: resolvedSelection.levelName,
            });
            if (existingEnrollment && existingEnrollment.status !== 'REJECTED') {
                return res.status(409).json({ message: 'You are already enrolled in this language course or your request is pending approval.' });
            }
        }
        else {
            const existingEnrollment = yield enrollment_model_1.default.findOne({
                studentId: user._id,
                courseId: resolvedSelection.skillCourseId,
            });
            if (existingEnrollment && existingEnrollment.status !== 'dropped') {
                return res.status(409).json({ message: 'You are already enrolled in this skill course or your request is pending approval.' });
            }
        }
        yield trainingPaymentAttempt_model_1.default.updateMany({
            userId: user._id,
            status: 'created',
            trainingType: resolvedSelection.trainingType,
            origin: resolvedSelection.origin,
        }, {
            $set: {
                status: 'cancelled',
                failureReason: 'Superseded by a newer checkout attempt.',
            },
        });
        const attempt = yield trainingPaymentAttempt_model_1.default.create({
            userId: user._id,
            trainingType: resolvedSelection.trainingType,
            origin: resolvedSelection.origin,
            courseTitle: resolvedSelection.courseTitle,
            levelName: resolvedSelection.trainingType === 'language' ? resolvedSelection.levelName : undefined,
            skillCourseId: resolvedSelection.trainingType === 'skill' ? resolvedSelection.skillCourseId : undefined,
            amount: resolvedSelection.amount,
            currency: resolvedSelection.currency,
        });
        const order = yield (0, razorpay_1.createRazorpayOrder)({
            amount: resolvedSelection.amount,
            currency: resolvedSelection.currency,
            receipt: `training_${String(attempt._id)}`.slice(0, 40),
            notes: {
                userId: String(user._id),
                attemptId: String(attempt._id),
                trainingType: resolvedSelection.trainingType,
                origin: resolvedSelection.origin,
            },
        });
        attempt.razorpayOrderId = order.id;
        attempt.paymentStatus = order.status;
        yield attempt.save();
        return res.status(201).json({
            message: 'Checkout created successfully.',
            checkout: {
                keyId: env_1.env.RAZORPAY_KEY_ID,
                attemptId: attempt._id,
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                trainingType: resolvedSelection.trainingType,
                courseTitle: resolvedSelection.courseTitle,
                displayCourseTitle: resolvedSelection.displayCourseTitle,
                levelName: resolvedSelection.trainingType === 'language' ? resolvedSelection.levelName : undefined,
                applicant: {
                    name: user.name,
                    email: user.email,
                    contact: user.phoneNumber,
                },
            },
        });
    }
    catch (error) {
        console.error('Training checkout creation error:', error);
        return res.status(500).json({ message: (error === null || error === void 0 ? void 0 : error.message) || 'Failed to start training checkout.' });
    }
});
exports.createTrainingCheckout = createTrainingCheckout;
const verifyTrainingPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Please log in to verify payment.' });
        }
        const { attemptId, razorpay_order_id: razorpayOrderId, razorpay_payment_id: razorpayPaymentId, razorpay_signature: razorpaySignature, } = req.body || {};
        if (!attemptId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ message: 'Payment verification details are incomplete.' });
        }
        const attempt = yield trainingPaymentAttempt_model_1.default.findOne({
            _id: attemptId,
            userId: user._id,
        });
        if (!attempt) {
            return res.status(404).json({ message: 'Payment attempt not found.' });
        }
        if (!attempt.razorpayOrderId || attempt.razorpayOrderId !== razorpayOrderId) {
            return res.status(400).json({ message: 'The payment order does not match this checkout attempt.' });
        }
        if (attempt.status === 'paid') {
            const existingEnrollment = yield findExistingPaidEnrollment(attempt);
            if (existingEnrollment) {
                return res.status(200).json({
                    message: 'Payment already verified for this training enrollment.',
                    enrollment: existingEnrollment,
                });
            }
        }
        const isValidSignature = (0, razorpay_1.verifyRazorpayPaymentSignature)({
            orderId: attempt.razorpayOrderId,
            paymentId: razorpayPaymentId,
            signature: razorpaySignature,
        });
        if (!isValidSignature) {
            syncAttemptWithPayment(attempt, {}, {
                status: 'failed',
                failureReason: 'Payment signature verification failed.',
            });
            yield attempt.save();
            yield sendPaymentFailureEmailIfNeeded(attempt, user);
            return res.status(400).json({ message: 'Payment signature verification failed.' });
        }
        const payment = yield (0, razorpay_1.fetchRazorpayPayment)(razorpayPaymentId);
        if (payment.order_id !== attempt.razorpayOrderId) {
            syncAttemptWithPayment(attempt, payment, {
                status: 'failed',
                signature: razorpaySignature,
                failureReason: 'Payment order mismatch received from Razorpay.',
            });
            yield attempt.save();
            yield sendPaymentFailureEmailIfNeeded(attempt, user);
            return res.status(400).json({ message: 'Payment order mismatch received from Razorpay.' });
        }
        if (!isSuccessfulPaymentStatus(payment.status)) {
            syncAttemptWithPayment(attempt, payment, {
                status: 'failed',
                signature: razorpaySignature,
                failureReason: buildPaymentFailureReason({
                    reason: 'Payment was not completed successfully.',
                    errorDescription: payment.error_description,
                    errorReason: payment.error_reason,
                }),
            });
            yield attempt.save();
            yield sendPaymentFailureEmailIfNeeded(attempt, user);
            return res.status(400).json({ message: 'Payment was not completed successfully.' });
        }
        syncAttemptWithPayment(attempt, payment, {
            status: 'paid',
            signature: razorpaySignature,
        });
        yield attempt.save();
        const { enrollment, shouldSendEnrollmentEmail, enrollmentEmailCourseTitle } = yield upsertEnrollmentFromAttempt(attempt);
        if (shouldSendEnrollmentEmail) {
            yield emailService.sendEnrollmentEmail(user.email, user.name, enrollmentEmailCourseTitle, 'PENDING', {
                amount: toDisplayAmount(attempt.amount),
                currency: attempt.currency,
                paymentStatus: attempt.paymentStatus || attempt.status || 'paid',
                paymentMethod: attempt.paymentMethod,
                razorpayOrderId: attempt.razorpayOrderId,
                razorpayPaymentId: attempt.razorpayPaymentId,
                paidAt: attempt.paidAt,
            });
        }
        return res.status(200).json({
            message: 'Payment verified and enrollment submitted successfully.',
            enrollment,
        });
    }
    catch (error) {
        console.error('Training payment verification error:', error);
        return res.status(500).json({ message: 'Failed to verify training payment.' });
    }
});
exports.verifyTrainingPayment = verifyTrainingPayment;
const recordTrainingPaymentFailure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Please log in to update payment status.' });
        }
        const { attemptId, status, reason, error } = req.body || {};
        const normalizedStatus = String(status !== null && status !== void 0 ? status : '').trim().toLowerCase();
        if (!attemptId || !['failed', 'cancelled'].includes(normalizedStatus)) {
            return res.status(400).json({ message: 'A valid payment attempt and failure status are required.' });
        }
        const attempt = yield trainingPaymentAttempt_model_1.default.findOne({
            _id: attemptId,
            userId: user._id,
        });
        if (!attempt) {
            return res.status(404).json({ message: 'Payment attempt not found.' });
        }
        if (attempt.status === 'paid') {
            return res.status(200).json({ message: 'Payment attempt is already marked as paid.' });
        }
        syncAttemptWithPayment(attempt, {
            id: (_a = error === null || error === void 0 ? void 0 : error.metadata) === null || _a === void 0 ? void 0 : _a.payment_id,
            order_id: ((_b = error === null || error === void 0 ? void 0 : error.metadata) === null || _b === void 0 ? void 0 : _b.order_id) || attempt.razorpayOrderId,
            status: 'failed',
            method: (_c = error === null || error === void 0 ? void 0 : error.metadata) === null || _c === void 0 ? void 0 : _c.method,
            error_code: error === null || error === void 0 ? void 0 : error.code,
            error_description: error === null || error === void 0 ? void 0 : error.description,
            error_source: error === null || error === void 0 ? void 0 : error.source,
            error_step: error === null || error === void 0 ? void 0 : error.step,
            error_reason: error === null || error === void 0 ? void 0 : error.reason,
        }, {
            status: normalizedStatus,
            failureReason: buildPaymentFailureReason({
                reason,
                description: error === null || error === void 0 ? void 0 : error.description,
                errorDescription: error === null || error === void 0 ? void 0 : error.description,
                errorReason: error === null || error === void 0 ? void 0 : error.reason,
            }),
        });
        yield attempt.save();
        yield sendPaymentFailureEmailIfNeeded(attempt, user);
        return res.status(200).json({
            message: `Payment attempt marked as ${normalizedStatus}.`,
            paymentAttempt: attempt,
        });
    }
    catch (error) {
        console.error('Recording training payment failure failed:', error);
        return res.status(500).json({ message: 'Failed to update training payment status.' });
    }
});
exports.recordTrainingPaymentFailure = recordTrainingPaymentFailure;
