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
exports.deleteRejectedInternshipApplication = exports.updateInternshipApplicationStatus = exports.deleteInternshipPaymentAttempt = exports.getAllInternshipPaymentAttempts = exports.getAllInternshipApplications = exports.getMyEnrolledInternships = exports.getMyInternshipApplications = exports.handleInternshipPaymentWebhook = exports.recordInternshipPaymentFailure = exports.verifyInternshipPayment = exports.submitInternshipApplication = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
const internshipApplication_model_1 = __importDefault(require("../models/internshipApplication.model"));
const internshipPaymentAttempt_model_1 = __importDefault(require("../models/internshipPaymentAttempt.model"));
const internshipListing_model_1 = __importDefault(require("../models/internshipListing.model"));
const email_service_1 = require("../utils/email.service");
const razorpay_1 = require("../utils/razorpay");
const fileServeRoot = '/home/sovirtraining/file_serve';
const adminDecisionStatuses = ['accepted', 'rejected'];
const internshipModes = ['remote', 'hybrid', 'onsite'];
const paymentAttemptStatuses = ['failed', 'cancelled'];
const successfulPaymentStatuses = ['authorized', 'captured'];
const emailService = new email_service_1.EmailService();
const toStoredResumeUrl = (filename) => `/uploads/internship_resumes/${filename}`;
const removeStoredResume = (resumeUrl) => {
    if (!resumeUrl)
        return;
    const relativePath = resumeUrl.replace('/uploads/', '');
    const absolutePath = path_1.default.join(fileServeRoot, relativePath);
    if (fs_1.default.existsSync(absolutePath)) {
        fs_1.default.unlinkSync(absolutePath);
    }
};
const normalizeInternshipMode = (mode) => {
    const normalizedValue = String(mode !== null && mode !== void 0 ? mode : '').trim().toLowerCase();
    if (normalizedValue === 'remote' || normalizedValue === 'online') {
        return 'remote';
    }
    if (normalizedValue === 'hybrid') {
        return 'hybrid';
    }
    if (normalizedValue === 'onsite' || normalizedValue === 'on-site' || normalizedValue === 'on site') {
        return 'onsite';
    }
    return '';
};
const normalizeCurrency = (currency) => String(currency || 'INR').trim().toUpperCase();
const toDisplayAmount = (subunits) => Number((subunits / 100).toFixed(2));
const isSuccessfulPaymentStatus = (status) => successfulPaymentStatuses.includes(String(status !== null && status !== void 0 ? status : '').trim().toLowerCase());
const buildInternshipApplicationLookup = (userId, internshipSlug, internshipTitle) => (Object.assign({ userId }, (internshipSlug
    ? {
        $or: [
            { internshipSlug },
            { internshipTitle },
        ],
    }
    : { internshipTitle })));
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
    if (options === null || options === void 0 ? void 0 : options.lastWebhookEvent)
        attempt.lastWebhookEvent = options.lastWebhookEvent;
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
const upsertApplicationFromPaidAttempt = (attempt) => __awaiter(void 0, void 0, void 0, function* () {
    if (attempt.applicationId) {
        const linkedApplication = yield internshipApplication_model_1.default.findById(attempt.applicationId);
        if (linkedApplication) {
            return { application: linkedApplication, shouldSendApplicationEmail: false };
        }
    }
    const sharedApplicationData = {
        userId: attempt.userId,
        paymentAttemptId: attempt._id,
        accountName: attempt.accountName,
        accountEmail: attempt.accountEmail,
        accountPhoneNumber: attempt.accountPhoneNumber,
        internshipSlug: attempt.internshipSlug,
        internshipTitle: attempt.internshipTitle,
        internshipPrice: attempt.internshipPrice,
        internshipMode: attempt.internshipMode,
        paymentGateway: attempt.paymentGateway,
        paymentStatus: attempt.paymentStatus,
        paymentAmount: toDisplayAmount(attempt.amount),
        paymentCurrency: attempt.currency,
        paymentMethod: attempt.paymentMethod,
        razorpayOrderId: attempt.razorpayOrderId,
        razorpayPaymentId: attempt.razorpayPaymentId,
        paidAt: attempt.paidAt || new Date(),
        firstName: attempt.firstName,
        lastName: attempt.lastName,
        dateOfBirth: attempt.dateOfBirth,
        email: attempt.email,
        whatsapp: attempt.whatsapp,
        college: attempt.college,
        registration: attempt.registration,
        department: attempt.department,
        semester: attempt.semester,
        passingYear: attempt.passingYear,
        address: attempt.address,
        source: attempt.source,
        resumeUrl: attempt.resumeUrl,
        resumeOriginalName: attempt.resumeOriginalName,
    };
    const existingApplication = yield internshipApplication_model_1.default.findOne(buildInternshipApplicationLookup(attempt.userId, attempt.internshipSlug, attempt.internshipTitle));
    if (existingApplication) {
        const hasDifferentPaidOrder = existingApplication.status !== 'rejected'
            && !!existingApplication.razorpayOrderId
            && existingApplication.razorpayOrderId !== attempt.razorpayOrderId;
        if (hasDifferentPaidOrder) {
            attempt.applicationId = existingApplication._id;
            yield attempt.save();
            return { application: existingApplication, shouldSendApplicationEmail: false };
        }
        if (existingApplication.status === 'rejected') {
            const previousResumeUrl = existingApplication.resumeUrl;
            existingApplication.set(Object.assign(Object.assign({}, sharedApplicationData), { status: 'submitted' }));
            yield existingApplication.save();
            if (previousResumeUrl !== attempt.resumeUrl) {
                removeStoredResume(previousResumeUrl);
            }
            attempt.applicationId = existingApplication._id;
            yield attempt.save();
            return { application: existingApplication, shouldSendApplicationEmail: true };
        }
        existingApplication.set({
            paymentAttemptId: attempt._id,
            internshipPrice: attempt.internshipPrice,
            internshipMode: attempt.internshipMode,
            paymentGateway: attempt.paymentGateway,
            paymentStatus: attempt.paymentStatus,
            paymentAmount: toDisplayAmount(attempt.amount),
            paymentCurrency: attempt.currency,
            paymentMethod: attempt.paymentMethod,
            razorpayOrderId: attempt.razorpayOrderId,
            razorpayPaymentId: attempt.razorpayPaymentId,
            paidAt: attempt.paidAt || existingApplication.paidAt || new Date(),
        });
        yield existingApplication.save();
        attempt.applicationId = existingApplication._id;
        yield attempt.save();
        return { application: existingApplication, shouldSendApplicationEmail: false };
    }
    try {
        const application = yield internshipApplication_model_1.default.create(Object.assign(Object.assign({}, sharedApplicationData), { status: 'submitted' }));
        attempt.applicationId = application._id;
        yield attempt.save();
        return { application, shouldSendApplicationEmail: true };
    }
    catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) === 11000) {
            const application = yield internshipApplication_model_1.default.findOne(buildInternshipApplicationLookup(attempt.userId, attempt.internshipSlug, attempt.internshipTitle));
            if (application) {
                attempt.applicationId = application._id;
                yield attempt.save();
                return { application, shouldSendApplicationEmail: false };
            }
        }
        throw error;
    }
});
const upsertFreeApplication = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const applicationData = {
        userId: params.userId,
        accountName: params.accountName,
        accountEmail: params.accountEmail,
        accountPhoneNumber: params.accountPhoneNumber,
        internshipSlug: params.internshipSlug,
        internshipTitle: params.internshipTitle,
        internshipPrice: params.internshipPrice,
        internshipMode: params.internshipMode,
        paymentGateway: 'free',
        paymentStatus: 'free',
        paymentAmount: 0,
        paymentCurrency: params.currency,
        paymentMethod: 'Free',
        razorpayOrderId: undefined,
        razorpayPaymentId: undefined,
        paidAt: new Date(),
        firstName: params.firstName,
        lastName: params.lastName,
        dateOfBirth: params.dateOfBirth,
        email: params.email,
        whatsapp: params.whatsapp,
        college: params.college,
        registration: params.registration,
        department: params.department,
        semester: params.semester,
        passingYear: params.passingYear,
        address: params.address,
        source: params.source,
        resumeUrl: params.resumeUrl,
        resumeOriginalName: params.resumeOriginalName,
    };
    const existingApplication = yield internshipApplication_model_1.default.findOne(buildInternshipApplicationLookup(params.userId, params.internshipSlug, params.internshipTitle));
    if (existingApplication) {
        if (existingApplication.status !== 'rejected') {
            return { application: existingApplication, shouldSendApplicationEmail: false };
        }
        const previousResumeUrl = existingApplication.resumeUrl;
        existingApplication.set(Object.assign(Object.assign({}, applicationData), { status: 'submitted', paymentAttemptId: undefined }));
        yield existingApplication.save();
        if (previousResumeUrl !== params.resumeUrl) {
            removeStoredResume(previousResumeUrl);
        }
        return { application: existingApplication, shouldSendApplicationEmail: true };
    }
    const application = yield internshipApplication_model_1.default.create(Object.assign(Object.assign({}, applicationData), { status: 'submitted' }));
    return { application, shouldSendApplicationEmail: true };
});
const buildPaymentFailureReason = (payload) => payload.reason
    || payload.description
    || payload.errorDescription
    || payload.errorReason
    || 'Payment failed before verification could complete.';
const submitInternshipApplication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let createdAttempt = null;
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in to continue with payment.' });
        }
        if (req.fileValidationError) {
            return res.status(400).json({ message: req.fileValidationError });
        }
        const { internshipSlug, internshipTitle, internshipMode, firstName, lastName, dob, email, whatsapp, college, registration, department, semester, passingYear, address, source, } = req.body;
        const requiredFields = {
            internshipMode,
            firstName,
            lastName,
            dob,
            email,
            whatsapp,
            college,
            registration,
            department,
            semester,
            passingYear,
            address,
            source,
        };
        const missingField = Object.entries(requiredFields).find(([, value]) => !String(value !== null && value !== void 0 ? value : '').trim());
        if (missingField) {
            return res.status(400).json({ message: `${missingField[0]} is required.` });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload your resume to continue.' });
        }
        const normalizedInternshipSlug = String(internshipSlug !== null && internshipSlug !== void 0 ? internshipSlug : '').trim().toLowerCase();
        const normalizedRequestedTitle = String(internshipTitle !== null && internshipTitle !== void 0 ? internshipTitle : '').trim();
        if (!normalizedInternshipSlug && !normalizedRequestedTitle) {
            removeStoredResume(toStoredResumeUrl(req.file.filename));
            return res.status(400).json({ message: 'internshipSlug is required.' });
        }
        let selectedInternship = null;
        if (normalizedInternshipSlug) {
            selectedInternship = yield internshipListing_model_1.default.findOne({
                slug: normalizedInternshipSlug,
                isActive: true,
            });
        }
        else if (normalizedRequestedTitle) {
            selectedInternship = yield internshipListing_model_1.default.findOne({
                title: normalizedRequestedTitle,
                isActive: true,
            });
        }
        if (!selectedInternship) {
            removeStoredResume(toStoredResumeUrl(req.file.filename));
            return res.status(404).json({ message: 'Selected internship is no longer available.' });
        }
        const normalizedMode = normalizeInternshipMode(internshipMode);
        if (!internshipModes.includes(normalizedMode)) {
            removeStoredResume(toStoredResumeUrl(req.file.filename));
            return res.status(400).json({ message: 'Internship mode must be remote, hybrid, or onsite.' });
        }
        const validatedMode = normalizedMode;
        const parsedDate = new Date(dob);
        if (Number.isNaN(parsedDate.getTime())) {
            removeStoredResume(toStoredResumeUrl(req.file.filename));
            return res.status(400).json({ message: 'Please provide a valid date of birth.' });
        }
        const currency = normalizeCurrency(selectedInternship.currency);
        const amount = Math.round(Number(selectedInternship.price) * 100);
        if (!Number.isFinite(amount) || amount < 0) {
            removeStoredResume(toStoredResumeUrl(req.file.filename));
            return res.status(400).json({ message: 'The internship fee is not configured correctly for checkout.' });
        }
        const existingApplication = yield internshipApplication_model_1.default.findOne(buildInternshipApplicationLookup(req.user._id, selectedInternship.slug, selectedInternship.title));
        if (existingApplication && existingApplication.status !== 'rejected') {
            removeStoredResume(toStoredResumeUrl(req.file.filename));
            return res.status(409).json({
                message: 'You have already applied for this internship.',
                application: existingApplication,
            });
        }
        const resumeUrl = toStoredResumeUrl(req.file.filename);
        if (amount === 0) {
            const { application, shouldSendApplicationEmail } = yield upsertFreeApplication({
                userId: req.user._id,
                accountName: req.user.name,
                accountEmail: req.user.email,
                accountPhoneNumber: req.user.phoneNumber,
                internshipSlug: selectedInternship.slug,
                internshipTitle: selectedInternship.title,
                internshipPrice: selectedInternship.price,
                internshipMode: validatedMode,
                currency,
                firstName: String(firstName).trim(),
                lastName: String(lastName).trim(),
                dateOfBirth: parsedDate,
                email: String(email).trim().toLowerCase(),
                whatsapp: String(whatsapp).trim(),
                college: String(college).trim(),
                registration: String(registration).trim(),
                department: String(department).trim(),
                semester: String(semester).trim(),
                passingYear: String(passingYear).trim(),
                address: String(address).trim(),
                source: String(source).trim(),
                resumeUrl,
                resumeOriginalName: req.file.originalname,
            });
            if (shouldSendApplicationEmail) {
                yield emailService.sendInternshipApplicationEmail(application.email, `${application.firstName} ${application.lastName}`.trim(), application.internshipTitle, application.referenceCode, application.internshipMode);
            }
            return res.status((existingApplication === null || existingApplication === void 0 ? void 0 : existingApplication.status) === 'rejected' ? 200 : 201).json({
                message: (existingApplication === null || existingApplication === void 0 ? void 0 : existingApplication.status) === 'rejected'
                    ? 'Free internship application updated successfully.'
                    : 'Free internship application submitted successfully.',
                application,
                checkoutSkipped: true,
            });
        }
        yield internshipPaymentAttempt_model_1.default.updateMany({
            userId: req.user._id,
            internshipSlug: selectedInternship.slug,
            status: 'created',
        }, {
            $set: {
                status: 'cancelled',
                failureReason: 'Superseded by a newer checkout attempt.',
            },
        });
        createdAttempt = yield internshipPaymentAttempt_model_1.default.create({
            userId: req.user._id,
            accountName: req.user.name,
            accountEmail: req.user.email,
            accountPhoneNumber: req.user.phoneNumber,
            internshipSlug: selectedInternship.slug,
            internshipTitle: selectedInternship.title,
            internshipPrice: selectedInternship.price,
            internshipMode: validatedMode,
            amount,
            currency,
            firstName: String(firstName).trim(),
            lastName: String(lastName).trim(),
            dateOfBirth: parsedDate,
            email: String(email).trim().toLowerCase(),
            whatsapp: String(whatsapp).trim(),
            college: String(college).trim(),
            registration: String(registration).trim(),
            department: String(department).trim(),
            semester: String(semester).trim(),
            passingYear: String(passingYear).trim(),
            address: String(address).trim(),
            source: String(source).trim(),
            resumeUrl,
            resumeOriginalName: req.file.originalname,
        });
        const order = yield (0, razorpay_1.createRazorpayOrder)({
            amount,
            currency,
            receipt: `internship_${String(createdAttempt._id)}`.slice(0, 40),
            notes: {
                internshipSlug: selectedInternship.slug,
                internshipTitle: selectedInternship.title.slice(0, 50),
                userId: String(req.user._id),
                attemptId: String(createdAttempt._id),
            },
        });
        createdAttempt.razorpayOrderId = order.id;
        createdAttempt.paymentStatus = order.status;
        yield createdAttempt.save();
        return res.status(201).json({
            message: 'Checkout created successfully.',
            checkout: {
                keyId: env_1.env.RAZORPAY_KEY_ID,
                attemptId: createdAttempt._id,
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                internshipTitle: selectedInternship.title,
                internshipPrice: selectedInternship.price,
                applicant: {
                    name: `${createdAttempt.firstName} ${createdAttempt.lastName}`.trim(),
                    email: createdAttempt.email,
                    contact: createdAttempt.whatsapp,
                },
            },
        });
    }
    catch (error) {
        if (createdAttempt) {
            removeStoredResume(createdAttempt.resumeUrl);
            yield createdAttempt.deleteOne().catch(() => undefined);
        }
        else if (req.file) {
            removeStoredResume(toStoredResumeUrl(req.file.filename));
        }
        console.error('Internship checkout creation error:', error);
        return res.status(500).json({ message: (error === null || error === void 0 ? void 0 : error.message) || 'Failed to start internship checkout.' });
    }
});
exports.submitInternshipApplication = submitInternshipApplication;
const verifyInternshipPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in to verify payment.' });
        }
        const { attemptId, razorpay_order_id: razorpayOrderId, razorpay_payment_id: razorpayPaymentId, razorpay_signature: razorpaySignature, } = req.body || {};
        if (!attemptId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ message: 'Payment verification details are incomplete.' });
        }
        const attempt = yield internshipPaymentAttempt_model_1.default.findOne({
            _id: attemptId,
            userId: req.user._id,
        });
        if (!attempt) {
            return res.status(404).json({ message: 'Payment attempt not found.' });
        }
        if (!attempt.razorpayOrderId || attempt.razorpayOrderId !== razorpayOrderId) {
            return res.status(400).json({ message: 'The payment order does not match this checkout attempt.' });
        }
        if (attempt.status === 'paid' && attempt.applicationId) {
            const application = yield internshipApplication_model_1.default.findById(attempt.applicationId);
            if (application) {
                return res.status(200).json({
                    message: 'Payment already verified for this internship.',
                    application,
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
        const { application, shouldSendApplicationEmail } = yield upsertApplicationFromPaidAttempt(attempt);
        if (shouldSendApplicationEmail) {
            yield emailService.sendInternshipApplicationEmail(application.email, `${application.firstName} ${application.lastName}`.trim(), application.internshipTitle, application.referenceCode, application.internshipMode);
        }
        return res.status(200).json({
            message: 'Payment verified and internship application submitted successfully.',
            application,
        });
    }
    catch (error) {
        console.error('Internship payment verification error:', error);
        return res.status(500).json({ message: 'Failed to verify internship payment.' });
    }
});
exports.verifyInternshipPayment = verifyInternshipPayment;
const recordInternshipPaymentFailure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in to update payment status.' });
        }
        const { attemptId, status, reason, error } = req.body || {};
        const normalizedStatus = String(status !== null && status !== void 0 ? status : '').trim().toLowerCase();
        if (!attemptId || !paymentAttemptStatuses.includes(normalizedStatus)) {
            return res.status(400).json({ message: 'A valid payment attempt and failure status are required.' });
        }
        const attempt = yield internshipPaymentAttempt_model_1.default.findOne({
            _id: attemptId,
            userId: req.user._id,
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
        console.error('Recording internship payment failure failed:', error);
        return res.status(500).json({ message: 'Failed to update internship payment status.' });
    }
});
exports.recordInternshipPaymentFailure = recordInternshipPaymentFailure;
const handleInternshipPaymentWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const signature = String((_a = req.headers['x-razorpay-signature']) !== null && _a !== void 0 ? _a : '').trim();
        if (!signature) {
            return res.status(400).json({ message: 'Missing Razorpay webhook signature.' });
        }
        const rawBody = req.rawBody;
        if (!rawBody || !(0, razorpay_1.verifyRazorpayWebhookSignature)(rawBody, signature)) {
            return res.status(400).json({ message: 'Invalid Razorpay webhook signature.' });
        }
        const event = String((_c = (_b = req.body) === null || _b === void 0 ? void 0 : _b.event) !== null && _c !== void 0 ? _c : '').trim();
        const paymentEntity = (_f = (_e = (_d = req.body) === null || _d === void 0 ? void 0 : _d.payload) === null || _e === void 0 ? void 0 : _e.payment) === null || _f === void 0 ? void 0 : _f.entity;
        const orderId = String((_g = paymentEntity === null || paymentEntity === void 0 ? void 0 : paymentEntity.order_id) !== null && _g !== void 0 ? _g : '').trim();
        if (!orderId) {
            return res.status(200).json({ received: true });
        }
        const attempt = yield internshipPaymentAttempt_model_1.default.findOne({ razorpayOrderId: orderId });
        if (!attempt) {
            return res.status(200).json({ received: true });
        }
        if (event === 'payment.failed') {
            syncAttemptWithPayment(attempt, paymentEntity || {}, {
                status: 'failed',
                lastWebhookEvent: event,
                failureReason: buildPaymentFailureReason({
                    errorDescription: paymentEntity === null || paymentEntity === void 0 ? void 0 : paymentEntity.error_description,
                    errorReason: paymentEntity === null || paymentEntity === void 0 ? void 0 : paymentEntity.error_reason,
                }),
            });
            yield attempt.save();
            return res.status(200).json({ received: true });
        }
        if (event === 'payment.authorized' || event === 'payment.captured') {
            syncAttemptWithPayment(attempt, paymentEntity || {}, {
                status: 'paid',
                lastWebhookEvent: event,
            });
            yield attempt.save();
            const { application, shouldSendApplicationEmail } = yield upsertApplicationFromPaidAttempt(attempt);
            if (shouldSendApplicationEmail) {
                yield emailService.sendInternshipApplicationEmail(application.email, `${application.firstName} ${application.lastName}`.trim(), application.internshipTitle, application.referenceCode, application.internshipMode);
            }
        }
        return res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('Internship payment webhook handling failed:', error);
        return res.status(500).json({ message: 'Failed to process Razorpay webhook.' });
    }
});
exports.handleInternshipPaymentWebhook = handleInternshipPaymentWebhook;
const getMyInternshipApplications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in to view your internship applications.' });
        }
        const applications = yield internshipApplication_model_1.default.find({ userId: req.user._id }).sort({ createdAt: -1 });
        return res.status(200).json({ applications });
    }
    catch (error) {
        console.error('Fetching internship applications failed:', error);
        return res.status(500).json({ message: 'Failed to fetch internship applications.' });
    }
});
exports.getMyInternshipApplications = getMyInternshipApplications;
const getMyEnrolledInternships = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in to view your enrolled internships.' });
        }
        const internships = yield internshipApplication_model_1.default.find({
            userId: req.user._id,
            status: 'accepted',
        })
            .select('internshipSlug internshipTitle internshipPrice internshipMode referenceCode status createdAt paymentStatus paymentAmount paymentCurrency razorpayPaymentId')
            .sort({ createdAt: -1 });
        return res.status(200).json({ internships });
    }
    catch (error) {
        console.error('Fetching enrolled internships failed:', error);
        return res.status(500).json({ message: 'Failed to fetch enrolled internships.' });
    }
});
exports.getMyEnrolledInternships = getMyEnrolledInternships;
const getAllInternshipApplications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const applications = yield internshipApplication_model_1.default.find()
            .populate('userId', 'name email phoneNumber role avatar')
            .sort({ createdAt: -1 });
        return res.status(200).json({ applications });
    }
    catch (error) {
        console.error('Fetching all internship applications failed:', error);
        return res.status(500).json({ message: 'Failed to fetch internship applications.' });
    }
});
exports.getAllInternshipApplications = getAllInternshipApplications;
const getAllInternshipPaymentAttempts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const rawPage = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 6));
        const issuesOnly = String((_a = req.query.issuesOnly) !== null && _a !== void 0 ? _a : '').trim().toLowerCase() === 'true';
        const status = String((_b = req.query.status) !== null && _b !== void 0 ? _b : '').trim().toLowerCase();
        const filters = {};
        if (issuesOnly || status === 'issues') {
            filters.status = { $in: paymentAttemptStatuses };
        }
        else if (['created', 'paid', ...paymentAttemptStatuses].includes(status)) {
            filters.status = status;
        }
        const totalItems = yield internshipPaymentAttempt_model_1.default.countDocuments(filters);
        const totalPages = Math.max(1, Math.ceil(totalItems / limit));
        const page = Math.min(rawPage, totalPages);
        const paymentAttempts = yield internshipPaymentAttempt_model_1.default.find(filters)
            .populate('userId', 'name email phoneNumber role avatar')
            .populate('applicationId', 'referenceCode status createdAt')
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
        console.error('Fetching internship payment attempts failed:', error);
        return res.status(500).json({ message: 'Failed to fetch internship payment attempts.' });
    }
});
exports.getAllInternshipPaymentAttempts = getAllInternshipPaymentAttempts;
const deleteInternshipPaymentAttempt = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const paymentAttempt = yield internshipPaymentAttempt_model_1.default.findById(id);
        if (!paymentAttempt) {
            return res.status(404).json({ message: 'Internship payment attempt not found.' });
        }
        if (paymentAttempt.status !== 'failed' && paymentAttempt.status !== 'cancelled') {
            return res.status(400).json({ message: 'Only failed or cancelled payment attempts can be deleted.' });
        }
        const resumeUrl = paymentAttempt.resumeUrl;
        const hasLinkedApplication = !!paymentAttempt.applicationId;
        yield paymentAttempt.deleteOne();
        if (!hasLinkedApplication) {
            removeStoredResume(resumeUrl);
        }
        return res.status(200).json({ message: 'Internship payment attempt deleted successfully.' });
    }
    catch (error) {
        console.error('Deleting internship payment attempt failed:', error);
        return res.status(500).json({ message: 'Failed to delete internship payment attempt.' });
    }
});
exports.deleteInternshipPaymentAttempt = deleteInternshipPaymentAttempt;
const updateInternshipApplicationStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const requestedStatus = String((_a = req.body.status) !== null && _a !== void 0 ? _a : '').trim().toLowerCase();
        if (!adminDecisionStatuses.includes(requestedStatus)) {
            return res.status(400).json({ message: 'Status must be accepted or rejected.' });
        }
        const application = yield internshipApplication_model_1.default.findById(id).populate('userId', 'name email phoneNumber role avatar');
        if (!application) {
            return res.status(404).json({ message: 'Internship application not found.' });
        }
        application.status = requestedStatus;
        yield application.save();
        yield emailService.sendInternshipStatusEmail(application.email, `${application.firstName} ${application.lastName}`.trim(), application.internshipTitle, application.referenceCode, application.internshipMode, requestedStatus);
        return res.status(200).json({
            message: `Internship application ${requestedStatus} successfully.`,
            application,
        });
    }
    catch (error) {
        console.error('Updating internship application status failed:', error);
        return res.status(500).json({ message: 'Failed to update internship application status.' });
    }
});
exports.updateInternshipApplicationStatus = updateInternshipApplicationStatus;
const deleteRejectedInternshipApplication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const application = yield internshipApplication_model_1.default.findById(id);
        if (!application) {
            return res.status(404).json({ message: 'Internship application not found.' });
        }
        if (application.status !== 'rejected') {
            return res.status(400).json({ message: 'Only rejected internship applications can be deleted.' });
        }
        removeStoredResume(application.resumeUrl);
        yield application.deleteOne();
        return res.status(200).json({ message: 'Rejected internship application deleted successfully.' });
    }
    catch (error) {
        console.error('Deleting rejected internship application failed:', error);
        return res.status(500).json({ message: 'Failed to delete internship application.' });
    }
});
exports.deleteRejectedInternshipApplication = deleteRejectedInternshipApplication;
