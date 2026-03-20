import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { env } from '../config/env';
import InternshipApplication, { type IInternshipApplication } from '../models/internshipApplication.model';
import InternshipPaymentAttempt, { type IInternshipPaymentAttempt } from '../models/internshipPaymentAttempt.model';
import InternshipListing from '../models/internshipListing.model';
import { EmailService } from '../utils/email.service';
import {
    createRazorpayOrder,
    fetchRazorpayPayment,
    type RazorpayPaymentResponse,
    verifyRazorpayPaymentSignature,
    verifyRazorpayWebhookSignature,
} from '../utils/razorpay';

const fileServeRoot = '/home/sovirtraining/file_serve';
const adminDecisionStatuses = ['accepted', 'rejected'] as const;
const internshipModes = ['remote', 'hybrid', 'onsite'] as const;
const paymentAttemptStatuses = ['failed', 'cancelled'] as const;
const successfulPaymentStatuses = ['authorized', 'captured'] as const;
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

const isSuccessfulPaymentStatus = (status?: string) =>
    successfulPaymentStatuses.includes(String(status ?? '').trim().toLowerCase() as (typeof successfulPaymentStatuses)[number]);

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

const syncAttemptWithPayment = (
    attempt: IInternshipPaymentAttempt,
    payment: Partial<RazorpayPaymentResponse>,
    options?: {
        signature?: string;
        status?: 'paid' | 'failed' | 'cancelled';
        failureReason?: string;
        lastWebhookEvent?: string;
    }
) => {
    if (payment.id) attempt.razorpayPaymentId = payment.id;
    if (payment.order_id) attempt.razorpayOrderId = payment.order_id;
    if (payment.status) attempt.paymentStatus = payment.status;
    if (payment.method) attempt.paymentMethod = payment.method;
    if (payment.email) attempt.paymentEmail = payment.email;
    if (payment.contact) attempt.paymentContact = payment.contact;
    if (payment.error_code) attempt.paymentErrorCode = payment.error_code;
    if (payment.error_description) attempt.paymentErrorDescription = payment.error_description;
    if (payment.error_source) attempt.paymentErrorSource = payment.error_source;
    if (payment.error_step) attempt.paymentErrorStep = payment.error_step;
    if (payment.error_reason) attempt.paymentErrorReason = payment.error_reason;
    if (options?.signature) attempt.razorpaySignature = options.signature;
    if (options?.lastWebhookEvent) attempt.lastWebhookEvent = options.lastWebhookEvent;
    if (options?.failureReason) attempt.failureReason = options.failureReason;

    if (options?.status === 'paid') {
        attempt.status = 'paid';
        attempt.paidAt = attempt.paidAt || new Date();
    } else if (options?.status) {
        attempt.status = options.status;
    }
};

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

    const existingApplication = await InternshipApplication.findOne(
        buildInternshipApplicationLookup(attempt.userId, attempt.internshipSlug, attempt.internshipTitle)
    );

    if (existingApplication) {
        const hasDifferentPaidOrder =
            existingApplication.status !== 'rejected'
            && !!existingApplication.razorpayOrderId
            && existingApplication.razorpayOrderId !== attempt.razorpayOrderId;

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
            razorpayOrderId: attempt.razorpayOrderId,
            razorpayPaymentId: attempt.razorpayPaymentId,
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
                application,
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
        });

        const order = await createRazorpayOrder({
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
        await createdAttempt.save();

        return res.status(201).json({
            message: 'Checkout created successfully.',
            checkout: {
                keyId: env.RAZORPAY_KEY_ID,
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

export const verifyInternshipPayment = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in to verify payment.' });
        }

        const {
            attemptId,
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
        } = req.body || {};

        if (!attemptId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ message: 'Payment verification details are incomplete.' });
        }

        const attempt = await InternshipPaymentAttempt.findOne({
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
            const application = await InternshipApplication.findById(attempt.applicationId);
            if (application) {
                return res.status(200).json({
                    message: 'Payment already verified for this internship.',
                    application,
                });
            }
        }

        const isValidSignature = verifyRazorpayPaymentSignature({
            orderId: attempt.razorpayOrderId,
            paymentId: razorpayPaymentId,
            signature: razorpaySignature,
        });

        if (!isValidSignature) {
            syncAttemptWithPayment(attempt, {}, {
                status: 'failed',
                failureReason: 'Payment signature verification failed.',
            });
            await attempt.save();
            return res.status(400).json({ message: 'Payment signature verification failed.' });
        }

        const payment = await fetchRazorpayPayment(razorpayPaymentId);

        if (payment.order_id !== attempt.razorpayOrderId) {
            syncAttemptWithPayment(attempt, payment, {
                status: 'failed',
                signature: razorpaySignature,
                failureReason: 'Payment order mismatch received from Razorpay.',
            });
            await attempt.save();
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
            await attempt.save();
            return res.status(400).json({ message: 'Payment was not completed successfully.' });
        }

        syncAttemptWithPayment(attempt, payment, {
            status: 'paid',
            signature: razorpaySignature,
        });
        await attempt.save();

        const { application, shouldSendApplicationEmail } = await upsertApplicationFromPaidAttempt(attempt);

        if (shouldSendApplicationEmail) {
            await emailService.sendInternshipApplicationEmail(
                application.email,
                `${application.firstName} ${application.lastName}`.trim(),
                application.internshipTitle,
                application.referenceCode,
                application.internshipMode
            );
        }

        return res.status(200).json({
            message: 'Payment verified and internship application submitted successfully.',
            application,
        });
    } catch (error) {
        console.error('Internship payment verification error:', error);
        return res.status(500).json({ message: 'Failed to verify internship payment.' });
    }
};

export const recordInternshipPaymentFailure = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in to update payment status.' });
        }

        const { attemptId, status, reason, error } = req.body || {};
        const normalizedStatus = String(status ?? '').trim().toLowerCase();

        if (!attemptId || !paymentAttemptStatuses.includes(normalizedStatus as (typeof paymentAttemptStatuses)[number])) {
            return res.status(400).json({ message: 'A valid payment attempt and failure status are required.' });
        }

        const attempt = await InternshipPaymentAttempt.findOne({
            _id: attemptId,
            userId: req.user._id,
        });

        if (!attempt) {
            return res.status(404).json({ message: 'Payment attempt not found.' });
        }

        if (attempt.status === 'paid') {
            return res.status(200).json({ message: 'Payment attempt is already marked as paid.' });
        }

        syncAttemptWithPayment(
            attempt,
            {
                id: error?.metadata?.payment_id,
                order_id: error?.metadata?.order_id || attempt.razorpayOrderId,
                status: 'failed',
                method: error?.metadata?.method,
                error_code: error?.code,
                error_description: error?.description,
                error_source: error?.source,
                error_step: error?.step,
                error_reason: error?.reason,
            },
            {
                status: normalizedStatus as 'failed' | 'cancelled',
                failureReason: buildPaymentFailureReason({
                    reason,
                    description: error?.description,
                    errorDescription: error?.description,
                    errorReason: error?.reason,
                }),
            }
        );

        await attempt.save();

        return res.status(200).json({
            message: `Payment attempt marked as ${normalizedStatus}.`,
            paymentAttempt: attempt,
        });
    } catch (error) {
        console.error('Recording internship payment failure failed:', error);
        return res.status(500).json({ message: 'Failed to update internship payment status.' });
    }
};

export const handleInternshipPaymentWebhook = async (req: Request, res: Response) => {
    try {
        const signature = String(req.headers['x-razorpay-signature'] ?? '').trim();

        if (!signature) {
            return res.status(400).json({ message: 'Missing Razorpay webhook signature.' });
        }

        const rawBody = (req as any).rawBody as Buffer | undefined;

        if (!rawBody || !verifyRazorpayWebhookSignature(rawBody, signature)) {
            return res.status(400).json({ message: 'Invalid Razorpay webhook signature.' });
        }

        const event = String(req.body?.event ?? '').trim();
        const paymentEntity = req.body?.payload?.payment?.entity as Partial<RazorpayPaymentResponse> | undefined;
        const orderId = String(paymentEntity?.order_id ?? '').trim();

        if (!orderId) {
            return res.status(200).json({ received: true });
        }

        const attempt = await InternshipPaymentAttempt.findOne({ razorpayOrderId: orderId });

        if (!attempt) {
            return res.status(200).json({ received: true });
        }

        if (event === 'payment.failed') {
            syncAttemptWithPayment(attempt, paymentEntity || {}, {
                status: 'failed',
                lastWebhookEvent: event,
                failureReason: buildPaymentFailureReason({
                    errorDescription: paymentEntity?.error_description,
                    errorReason: paymentEntity?.error_reason,
                }),
            });
            await attempt.save();
            return res.status(200).json({ received: true });
        }

        if (event === 'payment.authorized' || event === 'payment.captured') {
            syncAttemptWithPayment(attempt, paymentEntity || {}, {
                status: 'paid',
                lastWebhookEvent: event,
            });
            await attempt.save();

            const { application, shouldSendApplicationEmail } = await upsertApplicationFromPaidAttempt(attempt);

            if (shouldSendApplicationEmail) {
                await emailService.sendInternshipApplicationEmail(
                    application.email,
                    `${application.firstName} ${application.lastName}`.trim(),
                    application.internshipTitle,
                    application.referenceCode,
                    application.internshipMode
                );
            }
        }

        return res.status(200).json({ received: true });
    } catch (error) {
        console.error('Internship payment webhook handling failed:', error);
        return res.status(500).json({ message: 'Failed to process Razorpay webhook.' });
    }
};

export const getMyInternshipApplications = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in to view your internship applications.' });
        }

        const applications = await InternshipApplication.find({ userId: req.user._id }).sort({ createdAt: -1 });
        return res.status(200).json({ applications });
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
            .select('internshipSlug internshipTitle internshipPrice internshipMode referenceCode status createdAt paymentStatus paymentAmount paymentCurrency razorpayPaymentId')
            .sort({ createdAt: -1 });

        return res.status(200).json({ internships });
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

        return res.status(200).json({ applications });
    } catch (error) {
        console.error('Fetching all internship applications failed:', error);
        return res.status(500).json({ message: 'Failed to fetch internship applications.' });
    }
};

export const getAllInternshipPaymentAttempts = async (_req: Request, res: Response) => {
    try {
        const paymentAttempts = await InternshipPaymentAttempt.find()
            .populate('userId', 'name email phoneNumber role avatar')
            .populate('applicationId', 'referenceCode status createdAt')
            .sort({ createdAt: -1 });

        return res.status(200).json({ paymentAttempts });
    } catch (error) {
        console.error('Fetching internship payment attempts failed:', error);
        return res.status(500).json({ message: 'Failed to fetch internship payment attempts.' });
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
            application,
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
