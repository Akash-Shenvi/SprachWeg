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
exports.getMyApprovedWebinars = exports.updateWebinarRegistrationStatus = exports.getAdminWebinarRegistrations = exports.recordWebinarPaymentFailure = exports.verifyWebinarPayment = exports.createWebinarCheckout = void 0;
const env_1 = require("../config/env");
const webinar_model_1 = __importDefault(require("../models/webinar.model"));
const webinarPaymentAttempt_model_1 = __importDefault(require("../models/webinarPaymentAttempt.model"));
const webinarRegistration_model_1 = __importDefault(require("../models/webinarRegistration.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const webinar_calendar_1 = require("../utils/webinar.calendar");
const razorpay_1 = require("../utils/razorpay");
const successfulPaymentStatuses = ['authorized', 'captured'];
const normalizeCurrency = (currency) => String(currency || 'INR').trim().toUpperCase();
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
            razorpayOrderId: attempt.razorpayOrderId,
            razorpayPaymentId: attempt.razorpayPaymentId,
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
    existingRegistration.razorpayOrderId = attempt.razorpayOrderId;
    existingRegistration.razorpayPaymentId = attempt.razorpayPaymentId;
    existingRegistration.paidAt = attempt.paidAt;
    if (existingRegistration.status === 'rejected') {
        existingRegistration.status = 'submitted';
    }
    yield existingRegistration.save();
    return existingRegistration;
});
const createWebinarCheckout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Please log in to continue with webinar payment.' });
        }
        const webinarId = String((_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.webinarId) !== null && _b !== void 0 ? _b : '').trim();
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
        const attempt = yield webinarPaymentAttempt_model_1.default.create({
            userId: user._id,
            webinarId: webinar._id,
            webinarTitle: webinar.title,
            scheduledAt: webinar.scheduledAt,
            amount,
            currency: normalizeCurrency(webinar.currency),
        });
        const order = yield (0, razorpay_1.createRazorpayOrder)({
            amount,
            currency: normalizeCurrency(webinar.currency),
            receipt: `webinar_${String(attempt._id)}`.slice(0, 40),
            notes: {
                userId: String(user._id),
                attemptId: String(attempt._id),
                webinarId: String(webinar._id),
            },
        });
        attempt.razorpayOrderId = order.id;
        attempt.paymentStatus = order.status;
        yield attempt.save();
        return res.status(201).json({
            message: 'Webinar checkout created successfully.',
            checkout: {
                keyId: env_1.env.RAZORPAY_KEY_ID,
                attemptId: attempt._id,
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                webinarId: webinar._id,
                webinarTitle: webinar.title,
                scheduledAt: webinar.scheduledAt,
                applicant: {
                    name: user.name,
                    email: user.email,
                    contact: user.phoneNumber,
                },
            },
        });
    }
    catch (error) {
        console.error('Webinar checkout creation error:', error);
        return res.status(500).json({ message: (error === null || error === void 0 ? void 0 : error.message) || 'Failed to start webinar checkout.' });
    }
});
exports.createWebinarCheckout = createWebinarCheckout;
const verifyWebinarPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Please log in to verify webinar payment.' });
        }
        const { attemptId, razorpay_order_id: razorpayOrderId, razorpay_payment_id: razorpayPaymentId, razorpay_signature: razorpaySignature, } = req.body || {};
        if (!attemptId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ message: 'Payment verification details are incomplete.' });
        }
        const attempt = yield webinarPaymentAttempt_model_1.default.findOne({
            _id: attemptId,
            userId: user._id,
        });
        if (!attempt) {
            return res.status(404).json({ message: 'Payment attempt not found.' });
        }
        if (!attempt.razorpayOrderId || attempt.razorpayOrderId !== razorpayOrderId) {
            return res.status(400).json({ message: 'The payment order does not match this webinar checkout attempt.' });
        }
        if (attempt.status === 'paid') {
            const existingRegistration = yield findExistingRegistration(user._id, attempt.webinarId);
            if (existingRegistration) {
                return res.status(200).json({
                    message: 'Payment already verified for this webinar registration.',
                    registration: existingRegistration,
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
            return res.status(400).json({ message: 'Payment was not completed successfully.' });
        }
        syncAttemptWithPayment(attempt, payment, {
            status: 'paid',
            signature: razorpaySignature,
        });
        yield attempt.save();
        const registration = yield upsertRegistrationFromAttempt(attempt);
        return res.status(200).json({
            message: 'Payment verified and webinar registration submitted successfully.',
            registration,
        });
    }
    catch (error) {
        console.error('Webinar payment verification error:', error);
        return res.status(500).json({ message: 'Failed to verify webinar payment.' });
    }
});
exports.verifyWebinarPayment = verifyWebinarPayment;
const recordWebinarPaymentFailure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Please log in to update webinar payment status.' });
        }
        const { attemptId, status, reason, error } = req.body || {};
        const normalizedStatus = String(status !== null && status !== void 0 ? status : '').trim().toLowerCase();
        if (!attemptId || !['failed', 'cancelled'].includes(normalizedStatus)) {
            return res.status(400).json({ message: 'A valid payment attempt and failure status are required.' });
        }
        const attempt = yield webinarPaymentAttempt_model_1.default.findOne({
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
        return res.status(200).json({
            message: `Payment attempt marked as ${normalizedStatus}.`,
            paymentAttempt: attempt,
        });
    }
    catch (error) {
        console.error('Recording webinar payment failure failed:', error);
        return res.status(500).json({ message: 'Failed to update webinar payment status.' });
    }
});
exports.recordWebinarPaymentFailure = recordWebinarPaymentFailure;
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
            registrations,
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
            registration: refreshedRegistration,
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
            return {
                _id: registration._id,
                webinarId: (webinar === null || webinar === void 0 ? void 0 : webinar._id) || registration.webinarId,
                title: (webinar === null || webinar === void 0 ? void 0 : webinar.title) || registration.webinarTitle,
                scheduledAt: (webinar === null || webinar === void 0 ? void 0 : webinar.scheduledAt) || registration.scheduledAt,
                joinLink: (webinar === null || webinar === void 0 ? void 0 : webinar.joinLink) || null,
                price: registration.price,
                currency: registration.currency,
                referenceCode: registration.referenceCode,
                status: registration.status,
                createdAt: registration.createdAt,
            };
        });
        return res.status(200).json({ registrations: webinars });
    }
    catch (error) {
        console.error('Fetching approved webinars failed:', error);
        return res.status(500).json({ message: 'Failed to fetch approved webinars.' });
    }
});
exports.getMyApprovedWebinars = getMyApprovedWebinars;
