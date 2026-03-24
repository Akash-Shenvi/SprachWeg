import { Request, Response } from 'express';
import Webinar from '../models/webinar.model';
import WebinarPaymentAttempt, { type IWebinarPaymentAttempt } from '../models/webinarPaymentAttempt.model';
import WebinarRegistration from '../models/webinarRegistration.model';
import User from '../models/user.model';
import { applyGenericPaymentUpdate, withResolvedPaymentFields } from '../utils/payment.helpers';
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
import { getTrainerCalendarState, syncWebinarCalendarEvent } from '../utils/webinar.calendar';
import { buildDisplayPaymentPricing, buildPaymentPricingBreakdown } from '../utils/payment.pricing';

const normalizeCurrency = (currency?: string) => String(currency || 'INR').trim().toUpperCase();

const normalizePhoneNumber = (value: unknown) => {
    const digitsOnly = String(value ?? '').replace(/\D/g, '');
    if (!digitsOnly) {
        return '9999999999';
    }

    return digitsOnly.slice(-10) || digitsOnly;
};

const splitName = (value: unknown) => {
    const parts = String(value ?? '').trim().split(/\s+/).filter(Boolean);
    return {
        firstName: parts[0] || 'Student',
        lastName: parts.slice(1).join(' '),
    };
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
            transactionId: attempt.transactionId,
            paymentId: attempt.paymentId,
            bankReferenceNumber: attempt.bankReferenceNumber,
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
    existingRegistration.transactionId = attempt.transactionId;
    existingRegistration.paymentId = attempt.paymentId;
    existingRegistration.bankReferenceNumber = attempt.bankReferenceNumber;
    existingRegistration.paidAt = attempt.paidAt;

    if (existingRegistration.status === 'rejected') {
        existingRegistration.status = 'submitted';
    }

    await existingRegistration.save();
    return existingRegistration;
};

type WebinarPayUPaymentProcessResult = {
    result: PaymentResult;
    message: string;
    attempt: IWebinarPaymentAttempt | null;
    registration?: any;
};

const findWebinarAttempt = async (attemptId?: string | null, transactionId?: string | null) => {
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

    return WebinarPaymentAttempt.findOne({ $or: orConditions });
};

export const processWebinarPayUPayment = async (params: {
    attemptId?: string | null;
    transactionId?: string | null;
    payload: Record<string, unknown>;
    resultHint?: PaymentResult | null;
}): Promise<WebinarPayUPaymentProcessResult> => {
    const attempt = await findWebinarAttempt(params.attemptId, params.transactionId);

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
        applyGenericPaymentUpdate(
            attempt,
            {
                transactionId,
                gatewaySignature: extractPayUPayloadValue(params.payload, 'hash'),
            },
            {
                status: 'failed',
                failureReason: 'The PayU transaction ID does not match this webinar checkout attempt.',
            }
        );
        attempt.paymentGateway = 'payu';
        await attempt.save();

        return {
            result: 'failure',
            message: 'The PayU transaction did not match this webinar checkout attempt.',
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
            failureReason: 'The verified PayU amount did not match this webinar checkout attempt.',
        });
        attempt.paymentGateway = 'payu';
        await attempt.save();

        return {
            result: 'failure',
            message: 'The verified payment amount did not match this webinar checkout attempt.',
            attempt,
        };
    }

    if (verification.currency && normalizeCurrency(verification.currency) !== attempt.currency) {
        applyGenericPaymentUpdate(attempt, paymentUpdate, {
            status: 'failed',
            failureReason: 'The verified PayU currency did not match this webinar checkout attempt.',
        });
        attempt.paymentGateway = 'payu';
        await attempt.save();

        return {
            result: 'failure',
            message: 'The verified payment currency did not match this webinar checkout attempt.',
            attempt,
        };
    }

    attempt.paymentGateway = 'payu';

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
        applyGenericPaymentUpdate(attempt, paymentUpdate, {
            status: verification.internalStatus === 'cancelled' ? 'cancelled' : 'failed',
            failureReason: verification.internalStatus === 'cancelled'
                ? 'Payment was cancelled before completion.'
                : buildPaymentFailureReason({
                    reason: verification.errorMessage || 'Payment was not completed successfully.',
                }),
        });
        await attempt.save();

        return {
            result: mapInternalStatusToPaymentResult(verification.internalStatus),
            message: verification.internalStatus === 'cancelled'
                ? 'Payment was cancelled before completion.'
                : 'Payment was not completed successfully.',
            attempt,
        };
    }

    applyGenericPaymentUpdate(attempt, paymentUpdate, { status: 'paid' });
    await attempt.save();

    const registration = await upsertRegistrationFromAttempt(attempt);

    return {
        result: 'success',
        message: 'Payment verified and webinar registration submitted successfully.',
        attempt,
        registration,
    };
};

export const buildWebinarPayUCheckoutLaunch = async (
    attemptId: string,
    req: Request
): Promise<PayUHostedCheckoutParams> => {
    const attempt = await WebinarPaymentAttempt.findById(attemptId);

    if (!attempt) {
        throw new Error('Webinar payment attempt not found.');
    }

    if (attempt.status !== 'created') {
        throw new Error('This webinar checkout attempt is no longer active.');
    }

    const paymentUser = await User.findById(attempt.userId).select('name email phoneNumber').lean();
    const payerNameParts = splitName(paymentUser?.name || 'Student');
    const payerEmail = String(attempt.paymentEmail || paymentUser?.email || '').trim().toLowerCase();
    const payerPhone = normalizePhoneNumber(attempt.paymentContact || paymentUser?.phoneNumber);

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
        successAction: buildPayUCallbackUrl(req, 'success'),
        failureAction: buildPayUCallbackUrl(req, 'failure'),
        cancelAction: buildPayUCallbackUrl(req, 'cancel'),
    };
};

export const createWebinarCheckout = async (req: Request, res: Response) => {
    let attempt: IWebinarPaymentAttempt | null = null;

    try {
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({ message: 'Please log in to continue with webinar payment.' });
        }

        const webinarId = String(req.body?.webinarId ?? '').trim();
        const payerEmail = String(req.body?.payerEmail || user.email || '').trim().toLowerCase();
        const payerPhone = normalizePhoneNumber(req.body?.payerPhone || user.phoneNumber);
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

        const baseAmount = Math.round(Number(webinar.price) * 100);
        if (!Number.isFinite(baseAmount) || baseAmount <= 0) {
            return res.status(400).json({ message: 'The selected webinar fee is not configured correctly for checkout.' });
        }

        const pricing = buildPaymentPricingBreakdown(baseAmount);
        const amount = pricing.totalAmount;
        attempt = await WebinarPaymentAttempt.create({
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

        attempt.transactionId = buildPayUTransactionId('webinar', String(attempt._id));
        attempt.paymentStatus = 'created';
        await attempt.save();

        return res.status(201).json({
            message: 'Webinar checkout created successfully.',
            checkout: {
                attemptId: attempt._id,
                redirectUrl: buildPayULaunchUrl(req, 'webinar', String(attempt._id)),
                transactionId: attempt.transactionId,
                amount: attempt.amount,
                currency: attempt.currency,
                pricing: buildDisplayPaymentPricing(pricing),
            },
        });
    } catch (error: any) {
        if (attempt) {
            attempt.paymentGateway = 'payu';
            attempt.status = 'failed';
            attempt.failureReason = error?.message || 'Failed to start webinar checkout.';
            await attempt.save().catch(() => undefined);
        }

        console.error('Webinar checkout creation error:', error);
        return res.status(500).json({ message: error?.message || 'Failed to start webinar checkout.' });
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
            registrations: registrations.map((registration) => withResolvedPaymentFields(registration.toObject())),
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
            registration: refreshedRegistration ? withResolvedPaymentFields(refreshedRegistration.toObject()) : null,
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
                ...withResolvedPaymentFields(registration.toObject()),
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
