import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import InternshipApplication, { type IInternshipApplication } from '../models/internshipApplication.model';
import InternshipPaymentAttempt, { type IInternshipPaymentAttempt } from '../models/internshipPaymentAttempt.model';
import InternshipListing from '../models/internshipListing.model';
import { EmailService } from '../utils/email.service';
import {
    applyGenericPaymentUpdate,
    resolveTransactionId,
    withResolvedPaymentFields,
} from '../utils/payment.helpers';
import {
    buildPayUTransactionId,
    compareExpectedAmount,
    extractPayUPayloadValue,
    type PayUHostedCheckoutParams,
    verifyPayUTransaction,
} from '../utils/payu';
import {
    buildPayUCallbackUrl,
    buildPayULaunchUrl,
    mapInternalStatusToPaymentResult,
    type PaymentResult,
} from '../utils/payment.urls';

const fileServeRoot = '/home/sovirtraining/file_serve';
const adminDecisionStatuses = ['accepted', 'rejected'] as const;
const internshipModes = ['remote', 'hybrid', 'onsite'] as const;
const paymentAttemptStatuses = ['failed', 'cancelled'] as const;
const emailService = new EmailService();

const toStoredResumeUrl = (filename: string) => `/uploads/internship_resumes/${filename}`;

const removeStoredResume = (resumeUrl?: string) => {
    if (!resumeUrl) return;

    const relativePath = resumeUrl.replace('/uploads/', '');
    const absolutePath = path.join(fileServeRoot, relativePath);

    if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
    }
};

const normalizeInternshipMode = (mode: unknown) => {
    const normalizedValue = String(mode ?? '').trim().toLowerCase();

    if (normalizedValue === 'remote' || normalizedValue === 'online') {
        return 'remote' as const;
    }

    if (normalizedValue === 'hybrid') {
        return 'hybrid' as const;
    }

    if (normalizedValue === 'onsite' || normalizedValue === 'on-site' || normalizedValue === 'on site') {
        return 'onsite' as const;
    }

    return '';
};

const normalizeCurrency = (currency?: string) => String(currency || 'INR').trim().toUpperCase();

const toDisplayAmount = (subunits: number) => Number((subunits / 100).toFixed(2));

const buildInternshipApplicationLookup = (userId: any, internshipSlug: string, internshipTitle: string): Record<string, any> => ({
    userId,
    ...(internshipSlug
        ? {
            $or: [
                { internshipSlug },
                { internshipTitle },
            ],
        }
        : { internshipTitle }),
});

const upsertApplicationFromPaidAttempt = async (
    attempt: IInternshipPaymentAttempt
): Promise<{ application: IInternshipApplication; shouldSendApplicationEmail: boolean }> => {
    if (attempt.applicationId) {
        const linkedApplication = await InternshipApplication.findById(attempt.applicationId);
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

    const existingApplication = await InternshipApplication.findOne(
        buildInternshipApplicationLookup(attempt.userId, attempt.internshipSlug, attempt.internshipTitle)
    );

    if (existingApplication) {
        const hasDifferentPaidOrder =
            existingApplication.status !== 'rejected'
            && !!resolveTransactionId(existingApplication)
            && resolveTransactionId(existingApplication) !== resolveTransactionId(attempt);

        if (hasDifferentPaidOrder) {
            attempt.applicationId = existingApplication._id;
            await attempt.save();
            return { application: existingApplication, shouldSendApplicationEmail: false };
        }

        if (existingApplication.status === 'rejected') {
            const previousResumeUrl = existingApplication.resumeUrl;

            existingApplication.set({
                ...sharedApplicationData,
                status: 'submitted',
            });

            await existingApplication.save();

            if (previousResumeUrl !== attempt.resumeUrl) {
                removeStoredResume(previousResumeUrl);
            }

            attempt.applicationId = existingApplication._id;
            await attempt.save();

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

        await existingApplication.save();
        attempt.applicationId = existingApplication._id;
        await attempt.save();

        return { application: existingApplication, shouldSendApplicationEmail: false };
    }

    try {
        const application = await InternshipApplication.create({
            ...sharedApplicationData,
            status: 'submitted',
        });

        attempt.applicationId = application._id;
        await attempt.save();

        return { application, shouldSendApplicationEmail: true };
    } catch (error: any) {
        if (error?.code === 11000) {
            const application = await InternshipApplication.findOne(
                buildInternshipApplicationLookup(attempt.userId, attempt.internshipSlug, attempt.internshipTitle)
            );

            if (application) {
                attempt.applicationId = application._id;
                await attempt.save();
                return { application, shouldSendApplicationEmail: false };
            }
        }

        throw error;
    }
};

const upsertFreeApplication = async (params: {
    userId: any;
    accountName: string;
    accountEmail: string;
    accountPhoneNumber?: string;
    internshipSlug: string;
    internshipTitle: string;
    internshipPrice: number;
    internshipMode: (typeof internshipModes)[number];
    currency: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    email: string;
    whatsapp: string;
    college: string;
    registration: string;
    department: string;
    semester: string;
    passingYear: string;
    address: string;
    source: string;
    resumeUrl: string;
    resumeOriginalName: string;
}): Promise<{ application: IInternshipApplication; shouldSendApplicationEmail: boolean }> => {
    const applicationData = {
        userId: params.userId,
        accountName: params.accountName,
        accountEmail: params.accountEmail,
        accountPhoneNumber: params.accountPhoneNumber,
        internshipSlug: params.internshipSlug,
        internshipTitle: params.internshipTitle,
        internshipPrice: params.internshipPrice,
        internshipMode: params.internshipMode,
        paymentGateway: 'free' as const,
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

    const existingApplication = await InternshipApplication.findOne(
        buildInternshipApplicationLookup(params.userId, params.internshipSlug, params.internshipTitle)
    );

    if (existingApplication) {
        if (existingApplication.status !== 'rejected') {
            return { application: existingApplication, shouldSendApplicationEmail: false };
        }

        const previousResumeUrl = existingApplication.resumeUrl;

        existingApplication.set({
            ...applicationData,
            status: 'submitted',
            paymentAttemptId: undefined,
        });

        await existingApplication.save();

        if (previousResumeUrl !== params.resumeUrl) {
            removeStoredResume(previousResumeUrl);
        }

        return { application: existingApplication, shouldSendApplicationEmail: true };
    }

    const application = await InternshipApplication.create({
        ...applicationData,
        status: 'submitted',
    });

    return { application, shouldSendApplicationEmail: true };
};

const buildPaymentFailureReason = (payload: {
    reason?: string;
    description?: string;
    errorDescription?: string;
    errorReason?: string;
}) =>
    payload.reason
    || payload.description
    || payload.errorDescription
    || payload.errorReason
    || 'Payment failed before verification could complete.';

const shouldSendPaymentFailureEmail = (attempt: IInternshipPaymentAttempt) => {
    if (attempt.status !== 'failed' && attempt.status !== 'cancelled') {
        return false;
    }

    if (attempt.paymentFailureEmailSentAt) {
        return false;
    }

    const normalizedReason = String(attempt.failureReason ?? '').trim().toLowerCase();

    if (normalizedReason === 'superseded by a newer checkout attempt.') {
        return false;
    }

    return true;
};

const sendPaymentFailureEmailIfNeeded = async (attempt: IInternshipPaymentAttempt) => {
    if (!shouldSendPaymentFailureEmail(attempt)) {
        return;
    }

    const paymentIssueStatus = attempt.status === 'cancelled' ? 'cancelled' : 'failed';

    const emailSent = await emailService.sendInternshipPaymentFailureEmail({
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
    await attempt.save();
};

type InternshipPayUPaymentProcessResult = {
    result: PaymentResult;
    message: string;
    attempt: IInternshipPaymentAttempt | null;
    application?: IInternshipApplication;
};

const findInternshipAttempt = async (attemptId?: string | null, transactionId?: string | null) => {
    const orConditions: Array<Record<string, unknown>> = [];

    if (attemptId) {
        orConditions.push({ _id: attemptId });
    }

    if (transactionId) {
        orConditions.push({ transactionId });
    }

    if (orConditions.length === 0) {
        return null;
    }

    return InternshipPaymentAttempt.findOne({ $or: orConditions });
};

export const processInternshipPayUPayment = async (params: {
    attemptId?: string | null;
    transactionId?: string | null;
    payload: Record<string, unknown>;
    resultHint?: PaymentResult | null;
    source?: 'callback' | 'webhook';
}): Promise<InternshipPayUPaymentProcessResult> => {
    const attempt = await findInternshipAttempt(params.attemptId, params.transactionId);

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
        applyGenericPaymentUpdate(
            attempt,
            {
                transactionId,
                gatewaySignature: extractPayUPayloadValue(params.payload, 'hash'),
            },
            {
                status: 'failed',
                failureReason: 'The PayU transaction ID does not match this internship checkout attempt.',
            }
        );
        attempt.paymentGateway = 'payu';
        attempt.lastWebhookEvent = params.source ? `payu_${params.source}` : attempt.lastWebhookEvent;
        await attempt.save();

        return {
            result: 'failure',
            message: 'The PayU transaction did not match this internship checkout attempt.',
            attempt,
        };
    }

    const verification = await verifyPayUTransaction(transactionId, params.resultHint || undefined);
    const paymentUpdate = {
        transactionId: verification.transactionId,
        paymentId: verification.paymentId,
        paymentStatus: verification.paymentStatus || verification.status,
        paymentMethod: verification.paymentMethod,
        paymentEmail: extractPayUPayloadValue(params.payload, 'email') || attempt.paymentEmail,
        paymentContact: extractPayUPayloadValue(params.payload, 'phone') || attempt.paymentContact,
        gatewaySignature: extractPayUPayloadValue(params.payload, 'hash'),
        bankReferenceNumber: verification.bankReferenceNumber,
    };

    if (!compareExpectedAmount(attempt.amount, verification.amount)) {
        applyGenericPaymentUpdate(attempt, paymentUpdate, {
            status: 'failed',
            failureReason: 'The verified PayU amount did not match this internship checkout attempt.',
        });
        attempt.paymentGateway = 'payu';
        attempt.lastWebhookEvent = params.source ? `payu_${params.source}` : attempt.lastWebhookEvent;
        await attempt.save();
        await sendPaymentFailureEmailIfNeeded(attempt);

        return {
            result: 'failure',
            message: 'The verified payment amount did not match this internship checkout attempt.',
            attempt,
        };
    }

    if (verification.currency && normalizeCurrency(verification.currency) !== attempt.currency) {
        applyGenericPaymentUpdate(attempt, paymentUpdate, {
            status: 'failed',
            failureReason: 'The verified PayU currency did not match this internship checkout attempt.',
        });
        attempt.paymentGateway = 'payu';
        attempt.lastWebhookEvent = params.source ? `payu_${params.source}` : attempt.lastWebhookEvent;
        await attempt.save();
        await sendPaymentFailureEmailIfNeeded(attempt);

        return {
            result: 'failure',
            message: 'The verified payment currency did not match this internship checkout attempt.',
            attempt,
        };
    }

    attempt.paymentGateway = 'payu';
    attempt.lastWebhookEvent = params.source ? `payu_${params.source}` : attempt.lastWebhookEvent;

    if (verification.internalStatus === 'pending') {
        applyGenericPaymentUpdate(attempt, paymentUpdate, { status: 'created' });
        await attempt.save();

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

        applyGenericPaymentUpdate(attempt, paymentUpdate, {
            status: failureStatus,
            failureReason,
        });
        await attempt.save();
        await sendPaymentFailureEmailIfNeeded(attempt);

        return {
            result: mapInternalStatusToPaymentResult(verification.internalStatus),
            message: failureStatus === 'cancelled'
                ? 'Payment was cancelled before completion.'
                : 'Payment was not completed successfully.',
            attempt,
        };
    }

    applyGenericPaymentUpdate(attempt, paymentUpdate, { status: 'paid' });
    await attempt.save();

    const { application, shouldSendApplicationEmail } = await upsertApplicationFromPaidAttempt(attempt);

    if (shouldSendApplicationEmail) {
        await emailService.sendInternshipApplicationEmail(
            application.email,
            `${application.firstName} ${application.lastName}`.trim(),
            application.internshipTitle,
            application.referenceCode,
            application.internshipMode,
            {
                amount: application.paymentAmount ?? application.internshipPrice,
                currency: application.paymentCurrency,
                paymentStatus: application.paymentStatus,
                paymentMethod: application.paymentMethod,
                transactionId: application.transactionId,
                paymentId: application.paymentId,
                bankReferenceNumber: application.bankReferenceNumber,
                paidAt: application.paidAt,
            }
        );
    }

    return {
        result: 'success',
        message: 'Payment verified and internship application submitted successfully.',
        attempt,
        application,
    };
};

export const buildInternshipPayUCheckoutLaunch = async (
    attemptId: string,
    req: Request
): Promise<PayUHostedCheckoutParams> => {
    const attempt = await InternshipPaymentAttempt.findById(attemptId);

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
        successAction: buildPayUCallbackUrl(req, 'success'),
        failureAction: buildPayUCallbackUrl(req, 'failure'),
        cancelAction: buildPayUCallbackUrl(req, 'cancel'),
    };
};

export const submitInternshipApplication = async (req: Request, res: Response) => {
    let createdAttempt: IInternshipPaymentAttempt | null = null;

    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in to continue with payment.' });
        }

        if ((req as any).fileValidationError) {
            return res.status(400).json({ message: (req as any).fileValidationError });
        }

        const {
            internshipSlug,
            internshipTitle,
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
        } = req.body;

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

        const missingField = Object.entries(requiredFields).find(([, value]) => !String(value ?? '').trim());
        if (missingField) {
            return res.status(400).json({ message: `${missingField[0]} is required.` });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload your resume to continue.' });
        }

        const normalizedInternshipSlug = String(internshipSlug ?? '').trim().toLowerCase();
        const normalizedRequestedTitle = String(internshipTitle ?? '').trim();

        if (!normalizedInternshipSlug && !normalizedRequestedTitle) {
            removeStoredResume(toStoredResumeUrl(req.file.filename));
            return res.status(400).json({ message: 'internshipSlug is required.' });
        }

        let selectedInternship = null;

        if (normalizedInternshipSlug) {
            selectedInternship = await InternshipListing.findOne({
                slug: normalizedInternshipSlug,
                isActive: true,
            });
        } else if (normalizedRequestedTitle) {
            selectedInternship = await InternshipListing.findOne({
                title: normalizedRequestedTitle,
                isActive: true,
            });
        }

        if (!selectedInternship) {
            removeStoredResume(toStoredResumeUrl(req.file.filename));
            return res.status(404).json({ message: 'Selected internship is no longer available.' });
        }

        const normalizedMode = normalizeInternshipMode(internshipMode);
        if (!internshipModes.includes(normalizedMode as (typeof internshipModes)[number])) {
            removeStoredResume(toStoredResumeUrl(req.file.filename));
            return res.status(400).json({ message: 'Internship mode must be remote, hybrid, or onsite.' });
        }
        const validatedMode = normalizedMode as (typeof internshipModes)[number];

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

        const existingApplication = await InternshipApplication.findOne(
            buildInternshipApplicationLookup(req.user._id, selectedInternship.slug, selectedInternship.title)
        );

        if (existingApplication && existingApplication.status !== 'rejected') {
            removeStoredResume(toStoredResumeUrl(req.file.filename));
            return res.status(409).json({
                message: 'You have already applied for this internship.',
                application: existingApplication,
            });
        }

        const resumeUrl = toStoredResumeUrl(req.file.filename);

        if (amount === 0) {
            const { application, shouldSendApplicationEmail } = await upsertFreeApplication({
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
                await emailService.sendInternshipApplicationEmail(
                    application.email,
                    `${application.firstName} ${application.lastName}`.trim(),
                    application.internshipTitle,
                    application.referenceCode,
                    application.internshipMode
                );
            }

            return res.status(existingApplication?.status === 'rejected' ? 200 : 201).json({
                message: existingApplication?.status === 'rejected'
                    ? 'Free internship application updated successfully.'
                    : 'Free internship application submitted successfully.',
                application: withResolvedPaymentFields(application.toObject()),
                checkoutSkipped: true,
            });
        }

        await InternshipPaymentAttempt.updateMany(
            {
                userId: req.user._id,
                internshipSlug: selectedInternship.slug,
                status: 'created',
            },
            {
                $set: {
                    status: 'cancelled',
                    failureReason: 'Superseded by a newer checkout attempt.',
                },
            }
        );

        createdAttempt = await InternshipPaymentAttempt.create({
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

        createdAttempt.transactionId = buildPayUTransactionId('internship', String(createdAttempt._id));

        createdAttempt.paymentStatus = 'created';
        await createdAttempt.save();

        return res.status(201).json({
            message: 'Checkout created successfully.',
            checkout: {
                attemptId: createdAttempt._id,
                redirectUrl: buildPayULaunchUrl(req, 'internship', String(createdAttempt._id)),
                transactionId: createdAttempt.transactionId,
                amount: createdAttempt.amount,
                currency: createdAttempt.currency,
            },
        });
    } catch (error: any) {
        if (createdAttempt) {
            removeStoredResume(createdAttempt.resumeUrl);
            await createdAttempt.deleteOne().catch(() => undefined);
        } else if (req.file) {
            removeStoredResume(toStoredResumeUrl(req.file.filename));
        }

        console.error('Internship checkout creation error:', error);
        return res.status(500).json({ message: error?.message || 'Failed to start internship checkout.' });
    }
};

export const getMyInternshipApplications = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in to view your internship applications.' });
        }

        const applications = await InternshipApplication.find({ userId: req.user._id }).sort({ createdAt: -1 });
        return res.status(200).json({
            applications: applications.map((application) => withResolvedPaymentFields(application.toObject())),
        });
    } catch (error) {
        console.error('Fetching internship applications failed:', error);
        return res.status(500).json({ message: 'Failed to fetch internship applications.' });
    }
};

export const getMyEnrolledInternships = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in to view your enrolled internships.' });
        }

        const internships = await InternshipApplication.find({
            userId: req.user._id,
            status: 'accepted',
        })
            .select('internshipSlug internshipTitle internshipPrice internshipMode referenceCode status createdAt paymentStatus paymentAmount paymentCurrency paymentId')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            internships: internships.map((internship) => withResolvedPaymentFields(internship.toObject())),
        });
    } catch (error) {
        console.error('Fetching enrolled internships failed:', error);
        return res.status(500).json({ message: 'Failed to fetch enrolled internships.' });
    }
};

export const getAllInternshipApplications = async (req: Request, res: Response) => {
    try {
        const applications = await InternshipApplication.find()
            .populate('userId', 'name email phoneNumber role avatar')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            applications: applications.map((application) => withResolvedPaymentFields(application.toObject())),
        });
    } catch (error) {
        console.error('Fetching all internship applications failed:', error);
        return res.status(500).json({ message: 'Failed to fetch internship applications.' });
    }
};

export const getAllInternshipPaymentAttempts = async (req: Request, res: Response) => {
    try {
        const rawPage = Math.max(1, parseInt(req.query.page as string, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 6));
        const issuesOnly = String(req.query.issuesOnly ?? '').trim().toLowerCase() === 'true';
        const status = String(req.query.status ?? '').trim().toLowerCase();

        const filters: Record<string, any> = {};

        if (issuesOnly || status === 'issues') {
            filters.status = { $in: paymentAttemptStatuses };
        } else if (['created', 'paid', ...paymentAttemptStatuses].includes(status)) {
            filters.status = status;
        }

        const totalItems = await InternshipPaymentAttempt.countDocuments(filters);
        const totalPages = Math.max(1, Math.ceil(totalItems / limit));
        const page = Math.min(rawPage, totalPages);

        const paymentAttempts = await InternshipPaymentAttempt.find(filters)
            .populate('userId', 'name email phoneNumber role avatar')
            .populate('applicationId', 'referenceCode status createdAt')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        return res.status(200).json({
            paymentAttempts: paymentAttempts.map((attempt) => withResolvedPaymentFields(attempt.toObject())),
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasPreviousPage: page > 1,
                hasNextPage: page < totalPages,
            },
        });
    } catch (error) {
        console.error('Fetching internship payment attempts failed:', error);
        return res.status(500).json({ message: 'Failed to fetch internship payment attempts.' });
    }
};

export const deleteInternshipPaymentAttempt = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const paymentAttempt = await InternshipPaymentAttempt.findById(id);

        if (!paymentAttempt) {
            return res.status(404).json({ message: 'Internship payment attempt not found.' });
        }

        if (paymentAttempt.status !== 'failed' && paymentAttempt.status !== 'cancelled') {
            return res.status(400).json({ message: 'Only failed or cancelled payment attempts can be deleted.' });
        }

        const resumeUrl = paymentAttempt.resumeUrl;
        const hasLinkedApplication = !!paymentAttempt.applicationId;

        await paymentAttempt.deleteOne();

        if (!hasLinkedApplication) {
            removeStoredResume(resumeUrl);
        }

        return res.status(200).json({ message: 'Internship payment attempt deleted successfully.' });
    } catch (error) {
        console.error('Deleting internship payment attempt failed:', error);
        return res.status(500).json({ message: 'Failed to delete internship payment attempt.' });
    }
};

export const updateInternshipApplicationStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const requestedStatus = String(req.body.status ?? '').trim().toLowerCase();

        if (!adminDecisionStatuses.includes(requestedStatus as (typeof adminDecisionStatuses)[number])) {
            return res.status(400).json({ message: 'Status must be accepted or rejected.' });
        }

        const application = await InternshipApplication.findById(id).populate('userId', 'name email phoneNumber role avatar');

        if (!application) {
            return res.status(404).json({ message: 'Internship application not found.' });
        }

        application.status = requestedStatus as (typeof adminDecisionStatuses)[number];
        await application.save();

        await emailService.sendInternshipStatusEmail(
            application.email,
            `${application.firstName} ${application.lastName}`.trim(),
            application.internshipTitle,
            application.referenceCode,
            application.internshipMode,
            requestedStatus as 'accepted' | 'rejected'
        );

        return res.status(200).json({
            message: `Internship application ${requestedStatus} successfully.`,
            application: withResolvedPaymentFields(application.toObject()),
        });
    } catch (error) {
        console.error('Updating internship application status failed:', error);
        return res.status(500).json({ message: 'Failed to update internship application status.' });
    }
};

export const deleteRejectedInternshipApplication = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const application = await InternshipApplication.findById(id);

        if (!application) {
            return res.status(404).json({ message: 'Internship application not found.' });
        }

        if (application.status !== 'rejected') {
            return res.status(400).json({ message: 'Only rejected internship applications can be deleted.' });
        }

        removeStoredResume(application.resumeUrl);
        await application.deleteOne();

        return res.status(200).json({ message: 'Rejected internship application deleted successfully.' });
    } catch (error) {
        console.error('Deleting rejected internship application failed:', error);
        return res.status(500).json({ message: 'Failed to delete internship application.' });
    }
};
