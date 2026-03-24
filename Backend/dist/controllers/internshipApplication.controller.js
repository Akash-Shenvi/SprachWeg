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
exports.deleteRejectedInternshipApplication = exports.updateInternshipApplicationStatus = exports.deleteInternshipPaymentAttempt = exports.getAllInternshipPaymentAttempts = exports.getAllInternshipApplications = exports.getMyEnrolledInternships = exports.getMyInternshipApplications = exports.submitInternshipApplication = exports.buildInternshipPayUCheckoutLaunch = exports.processInternshipPayUPayment = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const internshipApplication_model_1 = __importDefault(require("../models/internshipApplication.model"));
const internshipPaymentAttempt_model_1 = __importDefault(require("../models/internshipPaymentAttempt.model"));
const internshipListing_model_1 = __importDefault(require("../models/internshipListing.model"));
const email_service_1 = require("../utils/email.service");
const payment_helpers_1 = require("../utils/payment.helpers");
const payu_1 = require("../utils/payu");
const payment_urls_1 = require("../utils/payment.urls");
const fileServeRoot = '/home/sovirtraining/file_serve';
const adminDecisionStatuses = ['accepted', 'rejected'];
const internshipModes = ['remote', 'hybrid', 'onsite'];
const paymentAttemptStatuses = ['failed', 'cancelled'];
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
const buildInternshipApplicationLookup = (userId, internshipSlug, internshipTitle) => (Object.assign({ userId }, (internshipSlug
    ? {
        $or: [
            { internshipSlug },
            { internshipTitle },
        ],
    }
    : { internshipTitle })));
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
        transactionId: attempt.transactionId,
        paymentId: attempt.paymentId,
        bankReferenceNumber: attempt.bankReferenceNumber,
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
            && !!(0, payment_helpers_1.resolveTransactionId)(existingApplication)
            && (0, payment_helpers_1.resolveTransactionId)(existingApplication) !== (0, payment_helpers_1.resolveTransactionId)(attempt);
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
            transactionId: attempt.transactionId,
            paymentId: attempt.paymentId,
            bankReferenceNumber: attempt.bankReferenceNumber,
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
        transactionId: undefined,
        paymentId: undefined,
        bankReferenceNumber: undefined,
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
const sendPaymentFailureEmailIfNeeded = (attempt) => __awaiter(void 0, void 0, void 0, function* () {
    if (!shouldSendPaymentFailureEmail(attempt)) {
        return;
    }
    const paymentIssueStatus = attempt.status === 'cancelled' ? 'cancelled' : 'failed';
    const emailSent = yield emailService.sendInternshipPaymentFailureEmail({
        to: attempt.email,
        name: `${attempt.firstName} ${attempt.lastName}`.trim(),
        internshipTitle: attempt.internshipTitle,
        internshipMode: attempt.internshipMode,
        amount: toDisplayAmount(attempt.amount),
        currency: attempt.currency,
        paymentStatus: attempt.paymentStatus || 'Not available',
        paymentMethod: attempt.paymentMethod,
        failureReason: attempt.failureReason || attempt.paymentErrorDescription || attempt.paymentErrorReason,
        status: paymentIssueStatus,
    });
    if (!emailSent) {
        return;
    }
    attempt.paymentFailureEmailSentAt = new Date();
    yield attempt.save();
});
const findInternshipAttempt = (attemptId, transactionId) => __awaiter(void 0, void 0, void 0, function* () {
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
    return internshipPaymentAttempt_model_1.default.findOne({ $or: orConditions });
});
const processInternshipPayUPayment = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const attempt = yield findInternshipAttempt(params.attemptId, params.transactionId);
    if (!attempt) {
        return {
            result: 'failure',
            message: 'Internship payment attempt not found.',
            attempt: null,
        };
    }
    const transactionId = String(params.transactionId || attempt.transactionId || '').trim();
    if (!transactionId) {
        return {
            result: 'failure',
            message: 'Internship payment transaction ID is missing.',
            attempt,
        };
    }
    if (attempt.transactionId && attempt.transactionId !== transactionId) {
        (0, payment_helpers_1.applyGenericPaymentUpdate)(attempt, {
            transactionId,
            gatewaySignature: (0, payu_1.extractPayUPayloadValue)(params.payload, 'hash'),
        }, {
            status: 'failed',
            failureReason: 'The PayU transaction ID does not match this internship checkout attempt.',
        });
        attempt.paymentGateway = 'payu';
        attempt.lastWebhookEvent = params.source ? `payu_${params.source}` : attempt.lastWebhookEvent;
        yield attempt.save();
        return {
            result: 'failure',
            message: 'The PayU transaction did not match this internship checkout attempt.',
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
            failureReason: 'The verified PayU amount did not match this internship checkout attempt.',
        });
        attempt.paymentGateway = 'payu';
        attempt.lastWebhookEvent = params.source ? `payu_${params.source}` : attempt.lastWebhookEvent;
        yield attempt.save();
        yield sendPaymentFailureEmailIfNeeded(attempt);
        return {
            result: 'failure',
            message: 'The verified payment amount did not match this internship checkout attempt.',
            attempt,
        };
    }
    if (verification.currency && normalizeCurrency(verification.currency) !== attempt.currency) {
        (0, payment_helpers_1.applyGenericPaymentUpdate)(attempt, paymentUpdate, {
            status: 'failed',
            failureReason: 'The verified PayU currency did not match this internship checkout attempt.',
        });
        attempt.paymentGateway = 'payu';
        attempt.lastWebhookEvent = params.source ? `payu_${params.source}` : attempt.lastWebhookEvent;
        yield attempt.save();
        yield sendPaymentFailureEmailIfNeeded(attempt);
        return {
            result: 'failure',
            message: 'The verified payment currency did not match this internship checkout attempt.',
            attempt,
        };
    }
    attempt.paymentGateway = 'payu';
    attempt.lastWebhookEvent = params.source ? `payu_${params.source}` : attempt.lastWebhookEvent;
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
        yield sendPaymentFailureEmailIfNeeded(attempt);
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
    const { application, shouldSendApplicationEmail } = yield upsertApplicationFromPaidAttempt(attempt);
    if (shouldSendApplicationEmail) {
        yield emailService.sendInternshipApplicationEmail(application.email, `${application.firstName} ${application.lastName}`.trim(), application.internshipTitle, application.referenceCode, application.internshipMode, {
            amount: (_a = application.paymentAmount) !== null && _a !== void 0 ? _a : application.internshipPrice,
            currency: application.paymentCurrency,
            paymentStatus: application.paymentStatus,
            paymentMethod: application.paymentMethod,
            transactionId: application.transactionId,
            paymentId: application.paymentId,
            bankReferenceNumber: application.bankReferenceNumber,
            paidAt: application.paidAt,
        });
    }
    return {
        result: 'success',
        message: 'Payment verified and internship application submitted successfully.',
        attempt,
        application,
    };
});
exports.processInternshipPayUPayment = processInternshipPayUPayment;
const buildInternshipPayUCheckoutLaunch = (attemptId, req) => __awaiter(void 0, void 0, void 0, function* () {
    const attempt = yield internshipPaymentAttempt_model_1.default.findById(attemptId);
    if (!attempt) {
        throw new Error('Internship payment attempt not found.');
    }
    if (attempt.status !== 'created') {
        throw new Error('This internship checkout attempt is no longer active.');
    }
    if (!attempt.transactionId) {
        throw new Error('Internship payment transaction ID is missing.');
    }
    return {
        transactionId: attempt.transactionId,
        referenceId: String(attempt._id),
        amount: attempt.amount,
        productInfo: attempt.internshipTitle,
        firstName: attempt.firstName,
        lastName: attempt.lastName,
        email: attempt.email,
        phone: attempt.whatsapp,
        flow: 'internship',
        userDefinedFields: {
            udf3: attempt.internshipSlug,
        },
        successAction: (0, payment_urls_1.buildPayUCallbackUrl)(req, 'success'),
        failureAction: (0, payment_urls_1.buildPayUCallbackUrl)(req, 'failure'),
        cancelAction: (0, payment_urls_1.buildPayUCallbackUrl)(req, 'cancel'),
    };
});
exports.buildInternshipPayUCheckoutLaunch = buildInternshipPayUCheckoutLaunch;
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
                application: (0, payment_helpers_1.withResolvedPaymentFields)(application.toObject()),
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
            paymentGateway: 'payu',
        });
        createdAttempt.transactionId = (0, payu_1.buildPayUTransactionId)('internship', String(createdAttempt._id));
        createdAttempt.paymentStatus = 'created';
        yield createdAttempt.save();
        return res.status(201).json({
            message: 'Checkout created successfully.',
            checkout: {
                attemptId: createdAttempt._id,
                redirectUrl: (0, payment_urls_1.buildPayULaunchUrl)(req, 'internship', String(createdAttempt._id)),
                transactionId: createdAttempt.transactionId,
                amount: createdAttempt.amount,
                currency: createdAttempt.currency,
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
const getMyInternshipApplications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in to view your internship applications.' });
        }
        const applications = yield internshipApplication_model_1.default.find({ userId: req.user._id }).sort({ createdAt: -1 });
        return res.status(200).json({
            applications: applications.map((application) => (0, payment_helpers_1.withResolvedPaymentFields)(application.toObject())),
        });
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
            .select('internshipSlug internshipTitle internshipPrice internshipMode referenceCode status createdAt paymentStatus paymentAmount paymentCurrency paymentId')
            .sort({ createdAt: -1 });
        return res.status(200).json({
            internships: internships.map((internship) => (0, payment_helpers_1.withResolvedPaymentFields)(internship.toObject())),
        });
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
        return res.status(200).json({
            applications: applications.map((application) => (0, payment_helpers_1.withResolvedPaymentFields)(application.toObject())),
        });
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
            application: (0, payment_helpers_1.withResolvedPaymentFields)(application.toObject()),
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
