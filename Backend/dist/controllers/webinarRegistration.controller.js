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
exports.getMyApprovedWebinars = exports.updateWebinarRegistrationStatus = exports.getAdminWebinarRegistrations = exports.createWebinarCheckout = exports.buildWebinarPayUCheckoutLaunch = exports.processWebinarPayUPayment = void 0;
const webinar_model_1 = __importDefault(require("../models/webinar.model"));
const webinarPaymentAttempt_model_1 = __importDefault(require("../models/webinarPaymentAttempt.model"));
const webinarRegistration_model_1 = __importDefault(require("../models/webinarRegistration.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const payment_helpers_1 = require("../utils/payment.helpers");
const payu_1 = require("../utils/payu");
const payment_urls_1 = require("../utils/payment.urls");
const webinar_calendar_1 = require("../utils/webinar.calendar");
const normalizeCurrency = (currency) => String(currency || 'INR').trim().toUpperCase();
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
    || 'Payment failed before webinar registration verification could complete.';
const findExistingRegistration = (userId, webinarId) => __awaiter(void 0, void 0, void 0, function* () { return webinarRegistration_model_1.default.findOne({ userId, webinarId }); });
const syncWebinarRegistrationCalendar = (webinarId) => __awaiter(void 0, void 0, void 0, function* () {
    const webinar = yield webinar_model_1.default.findById(webinarId);
    if (!webinar) {
        throw new Error('Webinar not found.');
    }
    const trainerState = yield (0, webinar_calendar_1.getTrainerCalendarState)(webinar.trainerId);
    if (!trainerState.trainer || !trainerState.connected) {
        throw new Error('Assigned trainer must connect Google Calendar before webinar approvals can be completed.');
    }
    yield (0, webinar_calendar_1.syncWebinarCalendarEvent)(webinar, {
        previousTrainerId: webinar.trainerId,
        previousEventId: webinar.googleCalendarEventId || null,
    });
    yield webinar.save();
    return webinar;
});
const upsertRegistrationFromAttempt = (attempt) => __awaiter(void 0, void 0, void 0, function* () {
    const existingRegistration = yield findExistingRegistration(attempt.userId, attempt.webinarId);
    if (!existingRegistration) {
        return webinarRegistration_model_1.default.create({
            userId: attempt.userId,
            webinarId: attempt.webinarId,
            paymentAttemptId: attempt._id,
            webinarTitle: attempt.webinarTitle,
            scheduledAt: attempt.scheduledAt,
            price: Number((attempt.amount / 100).toFixed(2)),
            currency: attempt.currency,
            paymentGateway: attempt.paymentGateway,
            paymentStatus: attempt.paymentStatus,
            paymentAmount: Number((attempt.amount / 100).toFixed(2)),
            paymentCurrency: attempt.currency,
            paymentMethod: attempt.paymentMethod,
            transactionId: attempt.transactionId,
            paymentId: attempt.paymentId,
            bankReferenceNumber: attempt.bankReferenceNumber,
            paidAt: attempt.paidAt,
            status: 'submitted',
        });
    }
    existingRegistration.paymentAttemptId = attempt._id;
    existingRegistration.webinarTitle = attempt.webinarTitle;
    existingRegistration.scheduledAt = attempt.scheduledAt;
    existingRegistration.price = Number((attempt.amount / 100).toFixed(2));
    existingRegistration.currency = attempt.currency;
    existingRegistration.paymentGateway = attempt.paymentGateway;
    existingRegistration.paymentStatus = attempt.paymentStatus;
    existingRegistration.paymentAmount = Number((attempt.amount / 100).toFixed(2));
    existingRegistration.paymentCurrency = attempt.currency;
    existingRegistration.paymentMethod = attempt.paymentMethod;
    existingRegistration.transactionId = attempt.transactionId;
    existingRegistration.paymentId = attempt.paymentId;
    existingRegistration.bankReferenceNumber = attempt.bankReferenceNumber;
    existingRegistration.paidAt = attempt.paidAt;
    if (existingRegistration.status === 'rejected') {
        existingRegistration.status = 'submitted';
    }
    yield existingRegistration.save();
    return existingRegistration;
});
const findWebinarAttempt = (attemptId, transactionId) => __awaiter(void 0, void 0, void 0, function* () {
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
    return webinarPaymentAttempt_model_1.default.findOne({ $or: orConditions });
});
const processWebinarPayUPayment = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const attempt = yield findWebinarAttempt(params.attemptId, params.transactionId);
    if (!attempt) {
        return {
            result: 'failure',
            message: 'Webinar payment attempt not found.',
            attempt: null,
        };
    }
    const transactionId = String(params.transactionId || attempt.transactionId || '').trim();
    if (!transactionId) {
        return {
            result: 'failure',
            message: 'Webinar payment transaction ID is missing.',
            attempt,
        };
    }
    if (attempt.transactionId && attempt.transactionId !== transactionId) {
        (0, payment_helpers_1.applyGenericPaymentUpdate)(attempt, {
            transactionId,
            gatewaySignature: (0, payu_1.extractPayUPayloadValue)(params.payload, 'hash'),
        }, {
            status: 'failed',
            failureReason: 'The PayU transaction ID does not match this webinar checkout attempt.',
        });
        attempt.paymentGateway = 'payu';
        yield attempt.save();
        return {
            result: 'failure',
            message: 'The PayU transaction did not match this webinar checkout attempt.',
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
            failureReason: 'The verified PayU amount did not match this webinar checkout attempt.',
        });
        attempt.paymentGateway = 'payu';
        yield attempt.save();
        return {
            result: 'failure',
            message: 'The verified payment amount did not match this webinar checkout attempt.',
            attempt,
        };
    }
    if (verification.currency && normalizeCurrency(verification.currency) !== attempt.currency) {
        (0, payment_helpers_1.applyGenericPaymentUpdate)(attempt, paymentUpdate, {
            status: 'failed',
            failureReason: 'The verified PayU currency did not match this webinar checkout attempt.',
        });
        attempt.paymentGateway = 'payu';
        yield attempt.save();
        return {
            result: 'failure',
            message: 'The verified payment currency did not match this webinar checkout attempt.',
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
        (0, payment_helpers_1.applyGenericPaymentUpdate)(attempt, paymentUpdate, {
            status: verification.internalStatus === 'cancelled' ? 'cancelled' : 'failed',
            failureReason: verification.internalStatus === 'cancelled'
                ? 'Payment was cancelled before completion.'
                : buildPaymentFailureReason({
                    reason: verification.errorMessage || 'Payment was not completed successfully.',
                }),
        });
        yield attempt.save();
        return {
            result: (0, payment_urls_1.mapInternalStatusToPaymentResult)(verification.internalStatus),
            message: verification.internalStatus === 'cancelled'
                ? 'Payment was cancelled before completion.'
                : 'Payment was not completed successfully.',
            attempt,
        };
    }
    (0, payment_helpers_1.applyGenericPaymentUpdate)(attempt, paymentUpdate, { status: 'paid' });
    yield attempt.save();
    const registration = yield upsertRegistrationFromAttempt(attempt);
    return {
        result: 'success',
        message: 'Payment verified and webinar registration submitted successfully.',
        attempt,
        registration,
    };
});
exports.processWebinarPayUPayment = processWebinarPayUPayment;
const buildWebinarPayUCheckoutLaunch = (attemptId, req) => __awaiter(void 0, void 0, void 0, function* () {
    const attempt = yield webinarPaymentAttempt_model_1.default.findById(attemptId);
    if (!attempt) {
        throw new Error('Webinar payment attempt not found.');
    }
    if (attempt.status !== 'created') {
        throw new Error('This webinar checkout attempt is no longer active.');
    }
    const paymentUser = yield user_model_1.default.findById(attempt.userId).select('name email phoneNumber').lean();
    const payerNameParts = splitName((paymentUser === null || paymentUser === void 0 ? void 0 : paymentUser.name) || 'Student');
    const payerEmail = String(attempt.paymentEmail || (paymentUser === null || paymentUser === void 0 ? void 0 : paymentUser.email) || '').trim().toLowerCase();
    const payerPhone = normalizePhoneNumber(attempt.paymentContact || (paymentUser === null || paymentUser === void 0 ? void 0 : paymentUser.phoneNumber));
    if (!attempt.transactionId) {
        throw new Error('Webinar payment transaction ID is missing.');
    }
    if (!payerEmail) {
        throw new Error('Webinar payment email is missing.');
    }
    return {
        transactionId: attempt.transactionId,
        referenceId: String(attempt._id),
        amount: attempt.amount,
        productInfo: attempt.webinarTitle,
        firstName: payerNameParts.firstName,
        lastName: payerNameParts.lastName,
        email: payerEmail,
        phone: payerPhone,
        flow: 'webinar',
        userDefinedFields: {
            udf3: String(attempt.webinarId),
        },
        successAction: (0, payment_urls_1.buildPayUCallbackUrl)(req, 'success'),
        failureAction: (0, payment_urls_1.buildPayUCallbackUrl)(req, 'failure'),
        cancelAction: (0, payment_urls_1.buildPayUCallbackUrl)(req, 'cancel'),
    };
});
exports.buildWebinarPayUCheckoutLaunch = buildWebinarPayUCheckoutLaunch;
const createWebinarCheckout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    let attempt = null;
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Please log in to continue with webinar payment.' });
        }
        const webinarId = String((_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.webinarId) !== null && _b !== void 0 ? _b : '').trim();
        const payerEmail = String(((_c = req.body) === null || _c === void 0 ? void 0 : _c.payerEmail) || user.email || '').trim().toLowerCase();
        const payerPhone = normalizePhoneNumber(((_d = req.body) === null || _d === void 0 ? void 0 : _d.payerPhone) || user.phoneNumber);
        if (!webinarId) {
            return res.status(400).json({ message: 'webinarId is required.' });
        }
        const webinar = yield webinar_model_1.default.findById(webinarId);
        if (!webinar || !webinar.isActive) {
            return res.status(404).json({ message: 'The selected webinar is no longer available.' });
        }
        const existingRegistration = yield findExistingRegistration(user._id, webinar._id);
        if (existingRegistration && ['submitted', 'accepted'].includes(existingRegistration.status)) {
            return res.status(409).json({ message: 'You have already registered for this webinar or your registration is pending approval.' });
        }
        yield webinarPaymentAttempt_model_1.default.updateMany({
            userId: user._id,
            webinarId: webinar._id,
            status: 'created',
        }, {
            $set: {
                status: 'cancelled',
                failureReason: 'Superseded by a newer checkout attempt.',
            },
        });
        const amount = Math.round(Number(webinar.price) * 100);
        attempt = yield webinarPaymentAttempt_model_1.default.create({
            userId: user._id,
            webinarId: webinar._id,
            webinarTitle: webinar.title,
            scheduledAt: webinar.scheduledAt,
            amount,
            currency: normalizeCurrency(webinar.currency),
            paymentGateway: 'payu',
            paymentEmail: payerEmail,
            paymentContact: payerPhone,
        });
        attempt.transactionId = (0, payu_1.buildPayUTransactionId)('webinar', String(attempt._id));
        attempt.paymentStatus = 'created';
        yield attempt.save();
        return res.status(201).json({
            message: 'Webinar checkout created successfully.',
            checkout: {
                attemptId: attempt._id,
                redirectUrl: (0, payment_urls_1.buildPayULaunchUrl)(req, 'webinar', String(attempt._id)),
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
            attempt.failureReason = (error === null || error === void 0 ? void 0 : error.message) || 'Failed to start webinar checkout.';
            yield attempt.save().catch(() => undefined);
        }
        console.error('Webinar checkout creation error:', error);
        return res.status(500).json({ message: (error === null || error === void 0 ? void 0 : error.message) || 'Failed to start webinar checkout.' });
    }
});
exports.createWebinarCheckout = createWebinarCheckout;
const getAdminWebinarRegistrations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const search = String((_a = req.query.search) !== null && _a !== void 0 ? _a : '').trim();
        const status = String((_b = req.query.status) !== null && _b !== void 0 ? _b : '').trim().toLowerCase();
        const filters = {};
        if (['submitted', 'accepted', 'rejected'].includes(status)) {
            filters.status = status;
        }
        if (search) {
            const matchingUserIds = yield user_model_1.default.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phoneNumber: { $regex: search, $options: 'i' } },
                ],
            }).distinct('_id');
            filters.$or = [
                { webinarTitle: { $regex: search, $options: 'i' } },
                { referenceCode: { $regex: search, $options: 'i' } },
                { userId: { $in: matchingUserIds } },
            ];
        }
        const totalRegistrations = yield webinarRegistration_model_1.default.countDocuments(filters);
        const totalPages = Math.max(1, Math.ceil(totalRegistrations / limit));
        const currentPage = Math.min(page, totalPages);
        const registrations = yield webinarRegistration_model_1.default.find(filters)
            .populate('userId', 'name email phoneNumber germanLevel guardianName guardianPhone qualification dateOfBirth avatar role createdAt isVerified')
            .populate('webinarId', 'title scheduledAt joinLink isActive trainerId calendarSyncStatus')
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * limit)
            .limit(limit);
        return res.status(200).json({
            registrations: registrations.map((registration) => (0, payment_helpers_1.withResolvedPaymentFields)(registration.toObject())),
            pagination: {
                currentPage,
                totalPages,
                totalRegistrations,
                limit,
                hasPreviousPage: currentPage > 1,
                hasNextPage: currentPage < totalPages,
            },
        });
    }
    catch (error) {
        console.error('Fetching webinar registrations failed:', error);
        return res.status(500).json({ message: 'Failed to fetch webinar registrations.' });
    }
});
exports.getAdminWebinarRegistrations = getAdminWebinarRegistrations;
const updateWebinarRegistrationStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const requestedStatus = String((_a = req.body.status) !== null && _a !== void 0 ? _a : '').trim().toLowerCase();
        if (!['accepted', 'rejected'].includes(requestedStatus)) {
            return res.status(400).json({ message: 'Status must be accepted or rejected.' });
        }
        const registration = yield webinarRegistration_model_1.default.findById(req.params.id)
            .populate('userId', 'name email phoneNumber avatar role')
            .populate('webinarId', 'title scheduledAt joinLink isActive trainerId calendarSyncStatus');
        if (!registration) {
            return res.status(404).json({ message: 'Webinar registration not found.' });
        }
        if (registration.status === requestedStatus) {
            return res.status(200).json({
                message: 'Webinar registration status is already up to date.',
                registration,
            });
        }
        const previousStatus = registration.status;
        registration.status = requestedStatus;
        yield registration.save();
        if (previousStatus === 'accepted' || requestedStatus === 'accepted') {
            try {
                yield syncWebinarRegistrationCalendar(((_b = registration.webinarId) === null || _b === void 0 ? void 0 : _b._id) || registration.webinarId);
            }
            catch (calendarError) {
                registration.status = previousStatus;
                yield registration.save();
                return res.status(400).json({
                    message: (calendarError === null || calendarError === void 0 ? void 0 : calendarError.message) || 'Failed to update webinar calendar attendees.',
                });
            }
        }
        const refreshedRegistration = yield webinarRegistration_model_1.default.findById(req.params.id)
            .populate('userId', 'name email phoneNumber avatar role')
            .populate('webinarId', 'title scheduledAt joinLink isActive trainerId calendarSyncStatus');
        return res.status(200).json({
            message: 'Webinar registration status updated successfully.',
            registration: refreshedRegistration ? (0, payment_helpers_1.withResolvedPaymentFields)(refreshedRegistration.toObject()) : null,
        });
    }
    catch (error) {
        console.error('Updating webinar registration status failed:', error);
        return res.status(500).json({ message: 'Failed to update webinar registration status.' });
    }
});
exports.updateWebinarRegistrationStatus = updateWebinarRegistrationStatus;
const getMyApprovedWebinars = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in to view your approved webinars.' });
        }
        const registrations = yield webinarRegistration_model_1.default.find({
            userId: req.user._id,
            status: 'accepted',
        })
            .populate('webinarId', 'title scheduledAt joinLink isActive')
            .sort({ scheduledAt: 1, createdAt: -1 });
        const webinars = registrations.map((registration) => {
            const webinar = registration.webinarId;
            return Object.assign(Object.assign({}, (0, payment_helpers_1.withResolvedPaymentFields)(registration.toObject())), { _id: registration._id, webinarId: (webinar === null || webinar === void 0 ? void 0 : webinar._id) || registration.webinarId, title: (webinar === null || webinar === void 0 ? void 0 : webinar.title) || registration.webinarTitle, scheduledAt: (webinar === null || webinar === void 0 ? void 0 : webinar.scheduledAt) || registration.scheduledAt, joinLink: (webinar === null || webinar === void 0 ? void 0 : webinar.joinLink) || null, price: registration.price, currency: registration.currency, referenceCode: registration.referenceCode, status: registration.status, createdAt: registration.createdAt });
        });
        return res.status(200).json({ registrations: webinars });
    }
    catch (error) {
        console.error('Fetching approved webinars failed:', error);
        return res.status(500).json({ message: 'Failed to fetch approved webinars.' });
    }
});
exports.getMyApprovedWebinars = getMyApprovedWebinars;
