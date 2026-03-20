import { Request, Response } from 'express';
import { env } from '../config/env';
import LanguageEnrollment from '../models/language.enrollment.model';
import SkillEnrollment from '../models/enrollment.model';
import LanguageCourse from '../models/languageCourse.model';
import SkillCourse from '../models/skillCourse.model';
import SkillTrainingDetail from '../models/skillTrainingDetail.model';
import TrainingPaymentAttempt, { type ITrainingPaymentAttempt } from '../models/trainingPaymentAttempt.model';
import { EmailService } from '../utils/email.service';
import {
    createRazorpayOrder,
    fetchRazorpayPayment,
    type RazorpayPaymentResponse,
    verifyRazorpayPaymentSignature,
} from '../utils/razorpay';

const emailService = new EmailService();
const successfulPaymentStatuses = ['authorized', 'captured'] as const;
const trainingPortalBaseUrl = 'https://training.sovirtechnologies.in';

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

const isSuccessfulPaymentStatus = (status?: string) =>
    successfulPaymentStatuses.includes(String(status ?? '').trim().toLowerCase() as (typeof successfulPaymentStatuses)[number]);

const syncAttemptWithPayment = (
    attempt: ITrainingPaymentAttempt,
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

export const createTrainingCheckout = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({ message: 'Please log in to continue with payment.' });
        }

        const origin = normalizeOrigin(req.body?.origin);
        const selectedLevel = String(req.body?.selectedLevel ?? '').trim();

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

        const attempt = await TrainingPaymentAttempt.create({
            userId: user._id,
            trainingType: resolvedSelection.trainingType,
            origin: resolvedSelection.origin,
            courseTitle: resolvedSelection.courseTitle,
            levelName: resolvedSelection.trainingType === 'language' ? resolvedSelection.levelName : undefined,
            skillCourseId: resolvedSelection.trainingType === 'skill' ? resolvedSelection.skillCourseId : undefined,
            amount: resolvedSelection.amount,
            currency: resolvedSelection.currency,
        });

        const order = await createRazorpayOrder({
            amount: resolvedSelection.amount,
            currency: resolvedSelection.currency,
            receipt: `training_${String(attempt._id)}`.slice(0, 40),
            notes: {
                userId: String(user._id),
                attemptId: String(attempt._id),
                trainingType: resolvedSelection.trainingType,
                origin: resolvedSelection.origin,
            },
        });

        attempt.razorpayOrderId = order.id;
        attempt.paymentStatus = order.status;
        await attempt.save();

        return res.status(201).json({
            message: 'Checkout created successfully.',
            checkout: {
                keyId: env.RAZORPAY_KEY_ID,
                attemptId: attempt._id,
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                trainingType: resolvedSelection.trainingType,
                courseTitle: resolvedSelection.courseTitle,
                displayCourseTitle: resolvedSelection.displayCourseTitle,
                levelName: resolvedSelection.trainingType === 'language' ? resolvedSelection.levelName : undefined,
                applicant: {
                    name: user.name,
                    email: user.email,
                    contact: user.phoneNumber,
                },
            },
        });
    } catch (error: any) {
        console.error('Training checkout creation error:', error);
        return res.status(500).json({ message: error?.message || 'Failed to start training checkout.' });
    }
};

export const verifyTrainingPayment = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
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

        const attempt = await TrainingPaymentAttempt.findOne({
            _id: attemptId,
            userId: user._id,
        });

        if (!attempt) {
            return res.status(404).json({ message: 'Payment attempt not found.' });
        }

        if (!attempt.razorpayOrderId || attempt.razorpayOrderId !== razorpayOrderId) {
            return res.status(400).json({ message: 'The payment order does not match this checkout attempt.' });
        }

        if (attempt.status === 'paid') {
            const existingEnrollment = await findExistingPaidEnrollment(attempt);
            if (existingEnrollment) {
                return res.status(200).json({
                    message: 'Payment already verified for this training enrollment.',
                    enrollment: existingEnrollment,
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
            await sendPaymentFailureEmailIfNeeded(attempt, user);
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
            await sendPaymentFailureEmailIfNeeded(attempt, user);
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
            await sendPaymentFailureEmailIfNeeded(attempt, user);
            return res.status(400).json({ message: 'Payment was not completed successfully.' });
        }

        syncAttemptWithPayment(attempt, payment, {
            status: 'paid',
            signature: razorpaySignature,
        });
        await attempt.save();

        const { enrollment, shouldSendEnrollmentEmail, enrollmentEmailCourseTitle } = await upsertEnrollmentFromAttempt(attempt);

        if (shouldSendEnrollmentEmail) {
            await emailService.sendEnrollmentEmail(
                user.email,
                user.name,
                enrollmentEmailCourseTitle,
                'PENDING',
                {
                    amount: toDisplayAmount(attempt.amount),
                    currency: attempt.currency,
                    paymentStatus: attempt.paymentStatus || attempt.status || 'paid',
                    paymentMethod: attempt.paymentMethod,
                    razorpayOrderId: attempt.razorpayOrderId,
                    razorpayPaymentId: attempt.razorpayPaymentId,
                    paidAt: attempt.paidAt,
                }
            );
        }

        return res.status(200).json({
            message: 'Payment verified and enrollment submitted successfully.',
            enrollment,
        });
    } catch (error) {
        console.error('Training payment verification error:', error);
        return res.status(500).json({ message: 'Failed to verify training payment.' });
    }
};

export const recordTrainingPaymentFailure = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({ message: 'Please log in to update payment status.' });
        }

        const { attemptId, status, reason, error } = req.body || {};
        const normalizedStatus = String(status ?? '').trim().toLowerCase();

        if (!attemptId || !['failed', 'cancelled'].includes(normalizedStatus)) {
            return res.status(400).json({ message: 'A valid payment attempt and failure status are required.' });
        }

        const attempt = await TrainingPaymentAttempt.findOne({
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
        await sendPaymentFailureEmailIfNeeded(attempt, user);

        return res.status(200).json({
            message: `Payment attempt marked as ${normalizedStatus}.`,
            paymentAttempt: attempt,
        });
    } catch (error) {
        console.error('Recording training payment failure failed:', error);
        return res.status(500).json({ message: 'Failed to update training payment status.' });
    }
};
