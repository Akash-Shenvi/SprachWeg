import { Request, Response } from 'express';
import { env } from '../config/env';
import Webinar from '../models/webinar.model';
import WebinarPaymentAttempt, { type IWebinarPaymentAttempt } from '../models/webinarPaymentAttempt.model';
import WebinarRegistration from '../models/webinarRegistration.model';
import User from '../models/user.model';
import { getTrainerCalendarState, syncWebinarCalendarEvent } from '../utils/webinar.calendar';
import {
    createRazorpayOrder,
    fetchRazorpayPayment,
    type RazorpayPaymentResponse,
    verifyRazorpayPaymentSignature,
} from '../utils/razorpay';

const successfulPaymentStatuses = ['authorized', 'captured'] as const;

const normalizeCurrency = (currency?: string) => String(currency || 'INR').trim().toUpperCase();

const isSuccessfulPaymentStatus = (status?: string) =>
    successfulPaymentStatuses.includes(String(status ?? '').trim().toLowerCase() as (typeof successfulPaymentStatuses)[number]);

const syncAttemptWithPayment = (
    attempt: IWebinarPaymentAttempt,
    payment: Partial<RazorpayPaymentResponse>,
    options?: {
        signature?: string;
        status?: 'paid' | 'failed' | 'cancelled';
        failureReason?: string;
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
    if (options?.failureReason) attempt.failureReason = options.failureReason;

    if (options?.status === 'paid') {
        attempt.status = 'paid';
        attempt.paidAt = attempt.paidAt || new Date();
    } else if (options?.status) {
        attempt.status = options.status;
    }
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
    || 'Payment failed before webinar registration verification could complete.';

const findExistingRegistration = async (userId: unknown, webinarId: unknown) =>
    WebinarRegistration.findOne({ userId, webinarId } as any);

const syncWebinarRegistrationCalendar = async (webinarId: unknown) => {
    const webinar = await Webinar.findById(webinarId);

    if (!webinar) {
        throw new Error('Webinar not found.');
    }

    const trainerState = await getTrainerCalendarState(webinar.trainerId);
    if (!trainerState.trainer || !trainerState.connected) {
        throw new Error('Assigned trainer must connect Google Calendar before webinar approvals can be completed.');
    }

    await syncWebinarCalendarEvent(webinar, {
        previousTrainerId: webinar.trainerId,
        previousEventId: webinar.googleCalendarEventId || null,
    });

    await webinar.save();
    return webinar;
};

const upsertRegistrationFromAttempt = async (attempt: IWebinarPaymentAttempt) => {
    const existingRegistration = await findExistingRegistration(attempt.userId, attempt.webinarId);

    if (!existingRegistration) {
        return WebinarRegistration.create({
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

    existingRegistration.paymentAttemptId = attempt._id as any;
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

    await existingRegistration.save();
    return existingRegistration;
};

export const createWebinarCheckout = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({ message: 'Please log in to continue with webinar payment.' });
        }

        const webinarId = String(req.body?.webinarId ?? '').trim();
        if (!webinarId) {
            return res.status(400).json({ message: 'webinarId is required.' });
        }

        const webinar = await Webinar.findById(webinarId);
        if (!webinar || !webinar.isActive) {
            return res.status(404).json({ message: 'The selected webinar is no longer available.' });
        }

        const existingRegistration = await findExistingRegistration(user._id, webinar._id);
        if (existingRegistration && ['submitted', 'accepted'].includes(existingRegistration.status)) {
            return res.status(409).json({ message: 'You have already registered for this webinar or your registration is pending approval.' });
        }

        await WebinarPaymentAttempt.updateMany(
            {
                userId: user._id,
                webinarId: webinar._id,
                status: 'created',
            },
            {
                $set: {
                    status: 'cancelled',
                    failureReason: 'Superseded by a newer checkout attempt.',
                },
            }
        );

        const amount = Math.round(Number(webinar.price) * 100);
        const attempt = await WebinarPaymentAttempt.create({
            userId: user._id,
            webinarId: webinar._id,
            webinarTitle: webinar.title,
            scheduledAt: webinar.scheduledAt,
            amount,
            currency: normalizeCurrency(webinar.currency),
        });

        const order = await createRazorpayOrder({
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
        await attempt.save();

        return res.status(201).json({
            message: 'Webinar checkout created successfully.',
            checkout: {
                keyId: env.RAZORPAY_KEY_ID,
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
    } catch (error: any) {
        console.error('Webinar checkout creation error:', error);
        return res.status(500).json({ message: error?.message || 'Failed to start webinar checkout.' });
    }
};

export const verifyWebinarPayment = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({ message: 'Please log in to verify webinar payment.' });
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

        const attempt = await WebinarPaymentAttempt.findOne({
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
            const existingRegistration = await findExistingRegistration(user._id, attempt.webinarId);
            if (existingRegistration) {
                return res.status(200).json({
                    message: 'Payment already verified for this webinar registration.',
                    registration: existingRegistration,
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

        const registration = await upsertRegistrationFromAttempt(attempt);

        return res.status(200).json({
            message: 'Payment verified and webinar registration submitted successfully.',
            registration,
        });
    } catch (error) {
        console.error('Webinar payment verification error:', error);
        return res.status(500).json({ message: 'Failed to verify webinar payment.' });
    }
};

export const recordWebinarPaymentFailure = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({ message: 'Please log in to update webinar payment status.' });
        }

        const { attemptId, status, reason, error } = req.body || {};
        const normalizedStatus = String(status ?? '').trim().toLowerCase();

        if (!attemptId || !['failed', 'cancelled'].includes(normalizedStatus)) {
            return res.status(400).json({ message: 'A valid payment attempt and failure status are required.' });
        }

        const attempt = await WebinarPaymentAttempt.findOne({
            _id: attemptId,
            userId: user._id,
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
        console.error('Recording webinar payment failure failed:', error);
        return res.status(500).json({ message: 'Failed to update webinar payment status.' });
    }
};

export const getAdminWebinarRegistrations = async (req: Request, res: Response) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
        const search = String(req.query.search ?? '').trim();
        const status = String(req.query.status ?? '').trim().toLowerCase();

        const filters: Record<string, any> = {};
        if (['submitted', 'accepted', 'rejected'].includes(status)) {
            filters.status = status;
        }

        if (search) {
            const matchingUserIds = await User.find({
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

        const totalRegistrations = await WebinarRegistration.countDocuments(filters);
        const totalPages = Math.max(1, Math.ceil(totalRegistrations / limit));
        const currentPage = Math.min(page, totalPages);

        const registrations = await WebinarRegistration.find(filters)
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
    } catch (error) {
        console.error('Fetching webinar registrations failed:', error);
        return res.status(500).json({ message: 'Failed to fetch webinar registrations.' });
    }
};

export const updateWebinarRegistrationStatus = async (req: Request, res: Response) => {
    try {
        const requestedStatus = String(req.body.status ?? '').trim().toLowerCase();
        if (!['accepted', 'rejected'].includes(requestedStatus)) {
            return res.status(400).json({ message: 'Status must be accepted or rejected.' });
        }

        const registration = await WebinarRegistration.findById(req.params.id)
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
        registration.status = requestedStatus as 'accepted' | 'rejected';
        await registration.save();

        if (previousStatus === 'accepted' || requestedStatus === 'accepted') {
            try {
                await syncWebinarRegistrationCalendar((registration.webinarId as any)?._id || registration.webinarId);
            } catch (calendarError: any) {
                registration.status = previousStatus;
                await registration.save();
                return res.status(400).json({
                    message: calendarError?.message || 'Failed to update webinar calendar attendees.',
                });
            }
        }

        const refreshedRegistration = await WebinarRegistration.findById(req.params.id)
            .populate('userId', 'name email phoneNumber avatar role')
            .populate('webinarId', 'title scheduledAt joinLink isActive trainerId calendarSyncStatus');

        return res.status(200).json({
            message: 'Webinar registration status updated successfully.',
            registration: refreshedRegistration,
        });
    } catch (error) {
        console.error('Updating webinar registration status failed:', error);
        return res.status(500).json({ message: 'Failed to update webinar registration status.' });
    }
};

export const getMyApprovedWebinars = async (req: Request, res: Response) => {
    try {
        if (!(req as any).user) {
            return res.status(401).json({ message: 'Please log in to view your approved webinars.' });
        }

        const registrations = await WebinarRegistration.find({
            userId: (req as any).user._id,
            status: 'accepted',
        })
            .populate('webinarId', 'title scheduledAt joinLink isActive')
            .sort({ scheduledAt: 1, createdAt: -1 });

        const webinars = registrations.map((registration: any) => {
            const webinar = registration.webinarId;

            return {
                _id: registration._id,
                webinarId: webinar?._id || registration.webinarId,
                title: webinar?.title || registration.webinarTitle,
                scheduledAt: webinar?.scheduledAt || registration.scheduledAt,
                joinLink: webinar?.joinLink || null,
                price: registration.price,
                currency: registration.currency,
                referenceCode: registration.referenceCode,
                status: registration.status,
                createdAt: registration.createdAt,
            };
        });

        return res.status(200).json({ registrations: webinars });
    } catch (error) {
        console.error('Fetching approved webinars failed:', error);
        return res.status(500).json({ message: 'Failed to fetch approved webinars.' });
    }
};
