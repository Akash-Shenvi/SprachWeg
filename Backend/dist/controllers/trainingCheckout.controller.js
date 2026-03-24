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
exports.createTrainingCheckout = exports.processTrainingPayUPayment = exports.deleteTrainingPaymentAttempt = exports.getAllTrainingPaymentAttempts = void 0;
const env_1 = require("../config/env");
const language_enrollment_model_1 = __importDefault(require("../models/language.enrollment.model"));
const enrollment_model_1 = __importDefault(require("../models/enrollment.model"));
const languageCourse_model_1 = __importDefault(require("../models/languageCourse.model"));
const skillCourse_model_1 = __importDefault(require("../models/skillCourse.model"));
const skillTrainingDetail_model_1 = __importDefault(require("../models/skillTrainingDetail.model"));
const trainingPaymentAttempt_model_1 = __importDefault(require("../models/trainingPaymentAttempt.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const email_service_1 = require("../utils/email.service");
const payment_helpers_1 = require("../utils/payment.helpers");
const payu_1 = require("../utils/payu");
const payment_urls_1 = require("../utils/payment.urls");
const emailService = new email_service_1.EmailService();
const trainingPortalBaseUrl = String(env_1.env.FRONTEND_BASE_URL || 'http://localhost:5173').replace(/\/+$/, '');
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
const normalizePhoneNumber = (value) => {
    const digitsOnly = String(value !== null && value !== void 0 ? value : '').replace(/\D/g, '');
    if (!digitsOnly) {
        return '9999999999';
    }
    return digitsOnly.slice(-10) || digitsOnly;
};
const splitName = (value) => {
    const parts = String(value !== null && value !== void 0 ? value : '').trim().split(/\s+/).filter(Boolean);
    return {
        firstName: parts[0] || 'Student',
        lastName: parts.slice(1).join(' '),
    };
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
            paymentAttempts: paymentAttempts.map((attempt) => (0, payment_helpers_1.withResolvedPaymentFields)(attempt.toObject())),
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
const findTrainingAttempt = (attemptId, transactionId) => __awaiter(void 0, void 0, void 0, function* () {
    const orConditions = [];
    if (attemptId) {
        orConditions.push({ _id: attemptId });
    }
    if (transactionId) {
        orConditions.push({ transactionId });
    }
    if (orConditions.length === 0) {
        return null;
    }
    return trainingPaymentAttempt_model_1.default.findOne({ $or: orConditions });
});
const processTrainingPayUPayment = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const attempt = yield findTrainingAttempt(params.attemptId, params.transactionId);
    if (!attempt) {
        return {
            result: 'failure',
            message: 'Training payment attempt not found.',
            attempt: null,
        };
    }
    const transactionId = String(params.transactionId || attempt.transactionId || '').trim();
    if (!transactionId) {
        return {
            result: 'failure',
            message: 'Training payment transaction ID is missing.',
            attempt,
        };
    }
    if (attempt.transactionId && attempt.transactionId !== transactionId) {
        (0, payment_helpers_1.applyGenericPaymentUpdate)(attempt, {
            transactionId,
            gatewaySignature: (0, payu_1.extractPayUPayloadValue)(params.payload, 'hash'),
        }, {
            status: 'failed',
            failureReason: 'The PayU transaction ID does not match this checkout attempt.',
        });
        attempt.paymentGateway = 'payu';
        yield attempt.save();
        return {
            result: 'failure',
            message: 'The PayU transaction did not match this training checkout attempt.',
            attempt,
        };
    }
    const verification = yield (0, payu_1.verifyPayUTransaction)(transactionId, params.resultHint || undefined);
    const paymentUpdate = {
        transactionId: verification.transactionId,
        paymentId: verification.paymentId,
        paymentStatus: verification.paymentStatus || verification.status,
        paymentMethod: verification.paymentMethod,
        paymentEmail: (0, payu_1.extractPayUPayloadValue)(params.payload, 'email') || attempt.paymentEmail,
        paymentContact: (0, payu_1.extractPayUPayloadValue)(params.payload, 'phone') || attempt.paymentContact,
        gatewaySignature: (0, payu_1.extractPayUPayloadValue)(params.payload, 'hash'),
        bankReferenceNumber: verification.bankReferenceNumber,
    };
    if (!(0, payu_1.compareExpectedAmount)(attempt.amount, verification.amount)) {
        (0, payment_helpers_1.applyGenericPaymentUpdate)(attempt, paymentUpdate, {
            status: 'failed',
            failureReason: 'The verified PayU amount did not match this training checkout attempt.',
        });
        attempt.paymentGateway = 'payu';
        yield attempt.save();
        return {
            result: 'failure',
            message: 'The verified payment amount did not match this training checkout attempt.',
            attempt,
        };
    }
    if (verification.currency && normalizeCurrency(verification.currency) !== attempt.currency) {
        (0, payment_helpers_1.applyGenericPaymentUpdate)(attempt, paymentUpdate, {
            status: 'failed',
            failureReason: 'The verified PayU currency did not match this training checkout attempt.',
        });
        attempt.paymentGateway = 'payu';
        yield attempt.save();
        return {
            result: 'failure',
            message: 'The verified payment currency did not match this training checkout attempt.',
            attempt,
        };
    }
    attempt.paymentGateway = 'payu';
    if (verification.internalStatus === 'pending') {
        (0, payment_helpers_1.applyGenericPaymentUpdate)(attempt, paymentUpdate, { status: 'created' });
        yield attempt.save();
        return {
            result: 'pending',
            message: 'Payment is pending confirmation from PayU.',
            attempt,
        };
    }
    if (verification.internalStatus !== 'paid') {
        const failureStatus = verification.internalStatus === 'cancelled' ? 'cancelled' : 'failed';
        const failureReason = failureStatus === 'cancelled'
            ? 'Payment was cancelled before completion.'
            : buildPaymentFailureReason({
                reason: verification.errorMessage || 'Payment was not completed successfully.',
            });
        (0, payment_helpers_1.applyGenericPaymentUpdate)(attempt, paymentUpdate, {
            status: failureStatus,
            failureReason,
        });
        yield attempt.save();
        const paymentUser = yield user_model_1.default.findById(attempt.userId).select('name email').lean().catch(() => null);
        yield sendPaymentFailureEmailIfNeeded(attempt, paymentUser);
        return {
            result: (0, payment_urls_1.mapInternalStatusToPaymentResult)(verification.internalStatus),
            message: failureStatus === 'cancelled'
                ? 'Payment was cancelled before completion.'
                : 'Payment was not completed successfully.',
            attempt,
        };
    }
    (0, payment_helpers_1.applyGenericPaymentUpdate)(attempt, paymentUpdate, { status: 'paid' });
    yield attempt.save();
    const { enrollment, shouldSendEnrollmentEmail, enrollmentEmailCourseTitle } = yield upsertEnrollmentFromAttempt(attempt);
    if (shouldSendEnrollmentEmail) {
        const paymentUser = yield user_model_1.default.findById(attempt.userId).select('name email').lean().catch(() => null);
        yield emailService.sendEnrollmentEmail(String((paymentUser === null || paymentUser === void 0 ? void 0 : paymentUser.email) || attempt.paymentEmail || '').trim(), String((paymentUser === null || paymentUser === void 0 ? void 0 : paymentUser.name) || 'Student').trim(), enrollmentEmailCourseTitle, 'PENDING', {
            amount: toDisplayAmount(attempt.amount),
            currency: attempt.currency,
            paymentStatus: attempt.paymentStatus || attempt.status || 'paid',
            paymentMethod: attempt.paymentMethod,
            transactionId: attempt.transactionId,
            paymentId: attempt.paymentId,
            bankReferenceNumber: attempt.bankReferenceNumber,
            paidAt: attempt.paidAt,
        });
    }
    return {
        result: 'success',
        message: 'Payment verified and enrollment submitted successfully.',
        attempt,
        enrollment,
    };
});
exports.processTrainingPayUPayment = processTrainingPayUPayment;
const createTrainingCheckout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    let attempt = null;
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Please log in to continue with payment.' });
        }
        const origin = normalizeOrigin((_a = req.body) === null || _a === void 0 ? void 0 : _a.origin);
        const selectedLevel = String((_c = (_b = req.body) === null || _b === void 0 ? void 0 : _b.selectedLevel) !== null && _c !== void 0 ? _c : '').trim();
        const payerName = String(((_d = req.body) === null || _d === void 0 ? void 0 : _d.payerName) || user.name || '').trim();
        const payerEmail = String(((_e = req.body) === null || _e === void 0 ? void 0 : _e.payerEmail) || user.email || '').trim().toLowerCase();
        const payerPhone = normalizePhoneNumber(((_f = req.body) === null || _f === void 0 ? void 0 : _f.payerPhone) || user.phoneNumber);
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
        attempt = yield trainingPaymentAttempt_model_1.default.create({
            userId: user._id,
            trainingType: resolvedSelection.trainingType,
            origin: resolvedSelection.origin,
            courseTitle: resolvedSelection.courseTitle,
            levelName: resolvedSelection.trainingType === 'language' ? resolvedSelection.levelName : undefined,
            skillCourseId: resolvedSelection.trainingType === 'skill' ? resolvedSelection.skillCourseId : undefined,
            amount: resolvedSelection.amount,
            currency: resolvedSelection.currency,
            paymentGateway: 'payu',
            paymentEmail: payerEmail,
            paymentContact: payerPhone,
        });
        attempt.transactionId = (0, payu_1.buildPayUTransactionId)('training', String(attempt._id));
        const payerNameParts = splitName(payerName);
        const checkout = yield (0, payu_1.createPayUHostedCheckout)({
            transactionId: attempt.transactionId,
            referenceId: String(attempt._id),
            amount: resolvedSelection.amount,
            productInfo: resolvedSelection.trainingType === 'language' && resolvedSelection.levelName
                ? `${resolvedSelection.courseTitle} - ${resolvedSelection.levelName}`
                : resolvedSelection.displayCourseTitle,
            firstName: payerNameParts.firstName,
            lastName: payerNameParts.lastName,
            email: payerEmail,
            phone: payerPhone,
            flow: 'training',
            userDefinedFields: {
                udf3: resolvedSelection.trainingType,
                udf4: resolvedSelection.origin,
            },
            successAction: (0, payment_urls_1.buildPayUCallbackUrl)(req, 'success'),
            failureAction: (0, payment_urls_1.buildPayUCallbackUrl)(req, 'failure'),
            cancelAction: (0, payment_urls_1.buildPayUCallbackUrl)(req, 'cancel'),
        });
        attempt.paymentStatus = checkout.status;
        yield attempt.save();
        return res.status(201).json({
            message: 'Checkout created successfully.',
            checkout: {
                attemptId: attempt._id,
                redirectUrl: checkout.redirectUrl,
                transactionId: attempt.transactionId,
                amount: attempt.amount,
                currency: attempt.currency,
            },
        });
    }
    catch (error) {
        if (attempt) {
            attempt.paymentGateway = 'payu';
            attempt.status = 'failed';
            attempt.failureReason = (error === null || error === void 0 ? void 0 : error.message) || 'Failed to start training checkout.';
            yield attempt.save().catch(() => undefined);
        }
        console.error('Training checkout creation error:', error);
        return res.status(500).json({ message: (error === null || error === void 0 ? void 0 : error.message) || 'Failed to start training checkout.' });
    }
});
exports.createTrainingCheckout = createTrainingCheckout;
