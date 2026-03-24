import { Request, Response } from 'express';
import { env } from '../config/env';
import LanguageEnrollment from '../models/language.enrollment.model';
import SkillEnrollment from '../models/enrollment.model';
import LanguageCourse from '../models/languageCourse.model';
import SkillCourse from '../models/skillCourse.model';
import SkillTrainingDetail from '../models/skillTrainingDetail.model';
import TrainingPaymentAttempt, { type ITrainingPaymentAttempt } from '../models/trainingPaymentAttempt.model';
import User from '../models/user.model';
import { EmailService } from '../utils/email.service';
import {
    applyGenericPaymentUpdate,
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

const emailService = new EmailService();
const trainingPortalBaseUrl = String(env.FRONTEND_BASE_URL || 'http://localhost:5173').replace(/\/+$/, '');

const extractNumericPrice = (value: string | number | null | undefined) => {
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

const extractSingleAmount = (value: string | number | null | undefined) => {
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

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeOrigin = (value: unknown) => String(value ?? '').trim().toLowerCase();

const normalizeCurrency = (currency?: string) => String(currency || 'INR').trim().toUpperCase();

const toDisplayAmount = (subunits: number) => Number((subunits / 100).toFixed(2));

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
    || 'Payment failed before enrollment verification could complete.';

const trainingRetryPathByOrigin: Record<string, string> = {
    english: '/training/english',
    german: '/training/german',
    japanese: '/training/japanese',
    'plc-automation': '/skill-training/plc',
    'scada-hmi': '/skill-training/scada',
    'industrial-drives': '/skill-training/drives',
    'industry-4.0': '/skill-training/industry4',
    'corporate-training': '/skill-training/corporate',
};

const getTrainingRetryUrl = (attempt: ITrainingPaymentAttempt) => {
    const retryPath = trainingRetryPathByOrigin[normalizeOrigin(attempt.origin)];

    if (retryPath) {
        return `${trainingPortalBaseUrl}${retryPath}`;
    }

    return attempt.trainingType === 'language'
        ? `${trainingPortalBaseUrl}/language-training`
        : `${trainingPortalBaseUrl}/skill-training`;
};

const shouldSendPaymentFailureEmail = (attempt: ITrainingPaymentAttempt) => {
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

const sendPaymentFailureEmailIfNeeded = async (attempt: ITrainingPaymentAttempt, user: any) => {
    if (!shouldSendPaymentFailureEmail(attempt)) {
        return;
    }

    const recipientEmail = String(user?.email || attempt.paymentEmail || '').trim();
    if (!recipientEmail) {
        return;
    }

    const emailSent = await emailService.sendTrainingPaymentFailureEmail({
        to: recipientEmail,
        name: String(user?.name || 'Student').trim(),
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
    await attempt.save();
};

export const getAllTrainingPaymentAttempts = async (req: Request, res: Response) => {
    try {
        const rawPage = Math.max(1, parseInt(req.query.page as string, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 6));
        const issuesOnly = String(req.query.issuesOnly ?? '').trim().toLowerCase() === 'true';
        const status = String(req.query.status ?? '').trim().toLowerCase();

        const filters: Record<string, any> = {};

        if (issuesOnly || status === 'issues') {
            filters.status = { $in: ['failed', 'cancelled'] };
        } else if (['created', 'paid', 'failed', 'cancelled'].includes(status)) {
            filters.status = status;
        }

        const totalItems = await TrainingPaymentAttempt.countDocuments(filters);
        const totalPages = Math.max(1, Math.ceil(totalItems / limit));
        const page = Math.min(rawPage, totalPages);

        const paymentAttempts = await TrainingPaymentAttempt.find(filters)
            .populate('userId', 'name email phoneNumber role avatar')
            .populate('skillCourseId', 'title')
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
        console.error('Fetching training payment attempts failed:', error);
        return res.status(500).json({ message: 'Failed to fetch training payment attempts.' });
    }
};

export const deleteTrainingPaymentAttempt = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const paymentAttempt = await TrainingPaymentAttempt.findById(id);

        if (!paymentAttempt) {
            return res.status(404).json({ message: 'Training payment attempt not found.' });
        }

        if (paymentAttempt.status !== 'failed' && paymentAttempt.status !== 'cancelled') {
            return res.status(400).json({ message: 'Only failed or cancelled payment attempts can be deleted.' });
        }

        await paymentAttempt.deleteOne();

        return res.status(200).json({ message: 'Training payment attempt deleted successfully.' });
    } catch (error) {
        console.error('Deleting training payment attempt failed:', error);
        return res.status(500).json({ message: 'Failed to delete training payment attempt.' });
    }
};

const languageOriginMap: Record<string, { keyword: string; courseTitle: string }> = {
    english: { keyword: 'English', courseTitle: 'English' },
    german: { keyword: 'German', courseTitle: 'German' },
    japanese: { keyword: 'Japanese', courseTitle: 'Japanese' },
};

const skillOriginPatterns: Record<string, RegExp> = {
    'plc-automation': /plc|programmable logic/i,
    'scada-hmi': /scada|hmi/i,
    'industrial-drives': /industrial drives|motion control|drives/i,
    'industry-4.0': /industry\s*4\.0/i,
    'corporate-training': /corporate training/i,
};

const resolveLanguageSelection = async (origin: string, selectedLevel: string) => {
    const mapping = languageOriginMap[origin];
    if (!mapping) {
        return null;
    }

    const course = await LanguageCourse.findOne({
        title: { $regex: mapping.keyword, $options: 'i' },
    });

    if (!course) {
        return null;
    }

    const normalizedSelectedLevel = String(selectedLevel ?? '').trim().toLowerCase();
    const level = course.levels.find(
        (item) => String(item?.name ?? '').trim().toLowerCase() === normalizedSelectedLevel
    );

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
        trainingType: 'language' as const,
        origin,
        courseTitle: mapping.courseTitle,
        displayCourseTitle: course.title,
        levelName: level.name,
        amount: Math.round(resolvedPrice * 100),
        currency: normalizeCurrency(),
    };
};

const resolveSkillSelection = async (origin: string) => {
    const originPattern = new RegExp(`^${escapeRegex(origin)}$`, 'i');

    let detail = await SkillTrainingDetail.findOne({
        origin: { $regex: originPattern },
    }).populate('skillCourseId');

    let populatedSkillCourse = detail?.skillCourseId as any;

    if (!detail) {
        const exactTitleMatch = await SkillCourse.findOne({
            title: { $regex: originPattern },
        });

        if (exactTitleMatch?._id) {
            detail = await SkillTrainingDetail.findOne({ skillCourseId: exactTitleMatch._id }).populate('skillCourseId');
            populatedSkillCourse = detail?.skillCourseId as any;

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

        course = await SkillCourse.findOne({
            title: { $regex: fallbackPattern },
        });
    }

    if (!course) {
        return null;
    }

    const resolvedPrice = extractNumericPrice(course.price) ?? extractSingleAmount(detail?.fees);
    if (resolvedPrice === null || resolvedPrice <= 0) {
        return {
            error: `The payment amount for ${course.title} is not configured correctly. Please set a single course price or a single fee amount in skill details.`,
        };
    }

    return {
        trainingType: 'skill' as const,
        origin,
        courseTitle: String(course.title).trim(),
        displayCourseTitle: String(course.title).trim(),
        skillCourseId: course._id,
        amount: Math.round(resolvedPrice * 100),
        currency: normalizeCurrency(),
    };
};

const findExistingPaidEnrollment = async (attempt: ITrainingPaymentAttempt) => {
    if (attempt.trainingType === 'language' && attempt.levelName) {
        return LanguageEnrollment.findOne({
            userId: attempt.userId,
            courseTitle: attempt.courseTitle,
            name: attempt.levelName,
        });
    }

    if (attempt.trainingType === 'skill' && attempt.skillCourseId) {
        return SkillEnrollment.findOne({
            studentId: attempt.userId,
            courseId: attempt.skillCourseId,
        });
    }

    return null;
};

type UpsertEnrollmentResult = {
    enrollment: any;
    shouldSendEnrollmentEmail: boolean;
    enrollmentEmailCourseTitle: string;
};

const upsertLanguageEnrollment = async (attempt: ITrainingPaymentAttempt): Promise<UpsertEnrollmentResult> => {
    if (!attempt.levelName) {
        throw new Error('Language level details are missing for this payment attempt.');
    }

    const existingEnrollment = await LanguageEnrollment.findOne({
        userId: attempt.userId,
        courseTitle: attempt.courseTitle,
        name: attempt.levelName,
    });

    let shouldSendEnrollmentEmail = false;
    let enrollment = existingEnrollment;

    if (!enrollment) {
        enrollment = await LanguageEnrollment.create({
            userId: attempt.userId,
            courseTitle: attempt.courseTitle,
            name: attempt.levelName,
        });
        shouldSendEnrollmentEmail = true;
    } else if (enrollment.status === 'REJECTED') {
        enrollment.status = 'PENDING';
        enrollment.batchId = undefined as any;
        await enrollment.save();
        shouldSendEnrollmentEmail = true;
    }

    return {
        enrollment,
        shouldSendEnrollmentEmail,
        enrollmentEmailCourseTitle: `${attempt.courseTitle} - ${attempt.levelName}`,
    };
};

const upsertSkillEnrollment = async (attempt: ITrainingPaymentAttempt): Promise<UpsertEnrollmentResult> => {
    if (!attempt.skillCourseId) {
        throw new Error('Skill course details are missing for this payment attempt.');
    }

    const existingEnrollment = await SkillEnrollment.findOne({
        studentId: attempt.userId,
        courseId: attempt.skillCourseId,
    });

    let shouldSendEnrollmentEmail = false;
    let enrollment = existingEnrollment;

    if (!enrollment) {
        enrollment = await SkillEnrollment.create({
            studentId: attempt.userId,
            courseId: attempt.skillCourseId,
            status: 'pending',
            enrollmentDate: new Date(),
            progress: 0,
            completedLessons: [],
        });
        shouldSendEnrollmentEmail = true;
    } else if (enrollment.status === 'dropped') {
        enrollment.status = 'pending';
        enrollment.batchId = undefined as any;
        enrollment.enrollmentDate = new Date();
        enrollment.progress = 0;
        enrollment.completedLessons = [];
        await enrollment.save();
        shouldSendEnrollmentEmail = true;
    }

    return {
        enrollment,
        shouldSendEnrollmentEmail,
        enrollmentEmailCourseTitle: attempt.courseTitle,
    };
};

const upsertEnrollmentFromAttempt = async (attempt: ITrainingPaymentAttempt): Promise<UpsertEnrollmentResult> => {
    if (attempt.trainingType === 'language') {
        return upsertLanguageEnrollment(attempt);
    }

    return upsertSkillEnrollment(attempt);
};

type TrainingPayUPaymentProcessResult = {
    result: PaymentResult;
    message: string;
    attempt: ITrainingPaymentAttempt | null;
    enrollment?: any;
};

const findTrainingAttempt = async (attemptId?: string | null, transactionId?: string | null) => {
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

    return TrainingPaymentAttempt.findOne({ $or: orConditions });
};

export const processTrainingPayUPayment = async (params: {
    attemptId?: string | null;
    transactionId?: string | null;
    payload: Record<string, unknown>;
    resultHint?: PaymentResult | null;
}): Promise<TrainingPayUPaymentProcessResult> => {
    const attempt = await findTrainingAttempt(params.attemptId, params.transactionId);

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
        applyGenericPaymentUpdate(
            attempt,
            {
                transactionId,
                gatewaySignature: extractPayUPayloadValue(params.payload, 'hash'),
            },
            {
                status: 'failed',
                failureReason: 'The PayU transaction ID does not match this checkout attempt.',
            }
        );
        attempt.paymentGateway = 'payu';
        await attempt.save();

        return {
            result: 'failure',
            message: 'The PayU transaction did not match this training checkout attempt.',
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
            failureReason: 'The verified PayU amount did not match this training checkout attempt.',
        });
        attempt.paymentGateway = 'payu';
        await attempt.save();

        return {
            result: 'failure',
            message: 'The verified payment amount did not match this training checkout attempt.',
            attempt,
        };
    }

    if (verification.currency && normalizeCurrency(verification.currency) !== attempt.currency) {
        applyGenericPaymentUpdate(attempt, paymentUpdate, {
            status: 'failed',
            failureReason: 'The verified PayU currency did not match this training checkout attempt.',
        });
        attempt.paymentGateway = 'payu';
        await attempt.save();

        return {
            result: 'failure',
            message: 'The verified payment currency did not match this training checkout attempt.',
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

        const paymentUser = await User.findById(attempt.userId).select('name email').lean().catch(() => null);
        await sendPaymentFailureEmailIfNeeded(attempt, paymentUser);

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

    const { enrollment, shouldSendEnrollmentEmail, enrollmentEmailCourseTitle } = await upsertEnrollmentFromAttempt(attempt);

    if (shouldSendEnrollmentEmail) {
        const paymentUser = await User.findById(attempt.userId).select('name email').lean().catch(() => null);
        await emailService.sendEnrollmentEmail(
            String(paymentUser?.email || attempt.paymentEmail || '').trim(),
            String(paymentUser?.name || 'Student').trim(),
            enrollmentEmailCourseTitle,
            'PENDING',
            {
                amount: toDisplayAmount(attempt.amount),
                currency: attempt.currency,
                paymentStatus: attempt.paymentStatus || attempt.status || 'paid',
                paymentMethod: attempt.paymentMethod,
                transactionId: attempt.transactionId,
                paymentId: attempt.paymentId,
                bankReferenceNumber: attempt.bankReferenceNumber,
                paidAt: attempt.paidAt,
            }
        );
    }

    return {
        result: 'success',
        message: 'Payment verified and enrollment submitted successfully.',
        attempt,
        enrollment,
    };
};

export const buildTrainingPayUCheckoutLaunch = async (
    attemptId: string,
    req: Request
): Promise<PayUHostedCheckoutParams> => {
    const attempt = await TrainingPaymentAttempt.findById(attemptId);

    if (!attempt) {
        throw new Error('Training payment attempt not found.');
    }

    if (attempt.status !== 'created') {
        throw new Error('This training checkout attempt is no longer active.');
    }

    const paymentUser = await User.findById(attempt.userId).select('name email phoneNumber').lean();
    const payerNameParts = splitName(paymentUser?.name || 'Student');
    const payerEmail = String(attempt.paymentEmail || paymentUser?.email || '').trim().toLowerCase();
    const payerPhone = normalizePhoneNumber(attempt.paymentContact || paymentUser?.phoneNumber);

    if (!attempt.transactionId) {
        throw new Error('Training payment transaction ID is missing.');
    }

    if (!payerEmail) {
        throw new Error('Training payment email is missing.');
    }

    return {
        transactionId: attempt.transactionId,
        referenceId: String(attempt._id),
        amount: attempt.amount,
        productInfo: attempt.trainingType === 'language' && attempt.levelName
            ? `${attempt.courseTitle} - ${attempt.levelName}`
            : attempt.courseTitle,
        firstName: payerNameParts.firstName,
        lastName: payerNameParts.lastName,
        email: payerEmail,
        phone: payerPhone,
        flow: 'training',
        userDefinedFields: {
            udf3: attempt.trainingType,
            udf4: attempt.origin,
        },
        successAction: buildPayUCallbackUrl(req, 'success'),
        failureAction: buildPayUCallbackUrl(req, 'failure'),
        cancelAction: buildPayUCallbackUrl(req, 'cancel'),
    };
};

export const createTrainingCheckout = async (req: Request, res: Response) => {
    let attempt: ITrainingPaymentAttempt | null = null;

    try {
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({ message: 'Please log in to continue with payment.' });
        }

        const origin = normalizeOrigin(req.body?.origin);
        const selectedLevel = String(req.body?.selectedLevel ?? '').trim();
        const payerEmail = String(req.body?.payerEmail || user.email || '').trim().toLowerCase();
        const payerPhone = normalizePhoneNumber(req.body?.payerPhone || user.phoneNumber);

        if (!origin) {
            return res.status(400).json({ message: 'A valid training selection is required.' });
        }

        const resolvedSelection = languageOriginMap[origin]
            ? await resolveLanguageSelection(origin, selectedLevel)
            : await resolveSkillSelection(origin);

        if (!resolvedSelection) {
            return res.status(404).json({ message: 'The selected training is no longer available.' });
        }

        if ('error' in resolvedSelection) {
            return res.status(400).json({ message: resolvedSelection.error });
        }

        if (resolvedSelection.trainingType === 'language') {
            const existingEnrollment = await LanguageEnrollment.findOne({
                userId: user._id,
                courseTitle: resolvedSelection.courseTitle,
                name: resolvedSelection.levelName,
            });

            if (existingEnrollment && existingEnrollment.status !== 'REJECTED') {
                return res.status(409).json({ message: 'You are already enrolled in this language course or your request is pending approval.' });
            }
        } else {
            const existingEnrollment = await SkillEnrollment.findOne({
                studentId: user._id,
                courseId: resolvedSelection.skillCourseId,
            });

            if (existingEnrollment && existingEnrollment.status !== 'dropped') {
                return res.status(409).json({ message: 'You are already enrolled in this skill course or your request is pending approval.' });
            }
        }

        await TrainingPaymentAttempt.updateMany(
            {
                userId: user._id,
                status: 'created',
                trainingType: resolvedSelection.trainingType,
                origin: resolvedSelection.origin,
            },
            {
                $set: {
                    status: 'cancelled',
                    failureReason: 'Superseded by a newer checkout attempt.',
                },
            }
        );

        attempt = await TrainingPaymentAttempt.create({
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

        attempt.transactionId = buildPayUTransactionId('training', String(attempt._id));

        attempt.paymentStatus = 'created';
        await attempt.save();

        return res.status(201).json({
            message: 'Checkout created successfully.',
            checkout: {
                attemptId: attempt._id,
                redirectUrl: buildPayULaunchUrl(req, 'training', String(attempt._id)),
                transactionId: attempt.transactionId,
                amount: attempt.amount,
                currency: attempt.currency,
            },
        });
    } catch (error: any) {
        if (attempt) {
            attempt.paymentGateway = 'payu';
            attempt.status = 'failed';
            attempt.failureReason = error?.message || 'Failed to start training checkout.';
            await attempt.save().catch(() => undefined);
        }

        console.error('Training checkout creation error:', error);
        return res.status(500).json({ message: error?.message || 'Failed to start training checkout.' });
    }
};
