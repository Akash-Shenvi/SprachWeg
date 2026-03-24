import { Request, Response } from 'express';
import { processInternshipPayUPayment } from './internshipApplication.controller';
import { processTrainingPayUPayment } from './trainingCheckout.controller';
import { processWebinarPayUPayment } from './webinarRegistration.controller';
import { extractPayUPayloadValue, verifyPayUResponseHash } from '../utils/payu';
import {
    buildFrontendPaymentResultUrl,
    inferPaymentFlow,
    normalizePaymentResult,
    type PaymentFlow,
    type PaymentResult,
} from '../utils/payment.urls';

type PayUContext = {
    payload: Record<string, unknown>;
    flow: PaymentFlow | null;
    attemptId: string | null;
    transactionId: string | null;
    resultHint: PaymentResult | null;
};

const getPayload = (req: Request): Record<string, unknown> => {
    if (req.body && typeof req.body === 'object') {
        return req.body as Record<string, unknown>;
    }

    return {};
};

const getContext = (req: Request): PayUContext => {
    const payload = getPayload(req);
    const transactionId = extractPayUPayloadValue(payload, 'txnid', 'txnId', 'transactionId');
    const attemptId = extractPayUPayloadValue(payload, 'udf2', 'referenceId');
    const flow = inferPaymentFlow(extractPayUPayloadValue(payload, 'udf1') || transactionId);
    const resultHint =
        normalizePaymentResult(req.query.result)
        || normalizePaymentResult(extractPayUPayloadValue(payload, 'status'));

    return {
        payload,
        flow,
        attemptId,
        transactionId,
        resultHint,
    };
};

const dispatchPayUFlow = async (context: PayUContext, source: 'callback' | 'webhook') => {
    if (context.flow === 'training') {
        return processTrainingPayUPayment({
            attemptId: context.attemptId,
            transactionId: context.transactionId,
            payload: context.payload,
            resultHint: context.resultHint,
        });
    }

    if (context.flow === 'internship') {
        return processInternshipPayUPayment({
            attemptId: context.attemptId,
            transactionId: context.transactionId,
            payload: context.payload,
            resultHint: context.resultHint,
            source,
        });
    }

    if (context.flow === 'webinar') {
        return processWebinarPayUPayment({
            attemptId: context.attemptId,
            transactionId: context.transactionId,
            payload: context.payload,
            resultHint: context.resultHint,
        });
    }

    throw new Error('Unable to determine which payment flow this PayU event belongs to.');
};

const buildFailureRedirect = (context: PayUContext, message: string) =>
    buildFrontendPaymentResultUrl({
        flow: context.flow || inferPaymentFlow(context.transactionId) || 'training',
        result: 'failure',
        attemptId: context.attemptId,
        transactionId: context.transactionId,
        message,
    });

export const handlePayUCallback = async (req: Request, res: Response) => {
    const context = getContext(req);

    if (!verifyPayUResponseHash(context.payload)) {
        return res.redirect(303, buildFailureRedirect(context, 'PayU response validation failed.'));
    }

    try {
        const outcome = await dispatchPayUFlow(context, 'callback');
        const referenceCode =
            (outcome as any)?.application?.referenceCode
            || (outcome as any)?.registration?.referenceCode
            || null;

        const redirectUrl = buildFrontendPaymentResultUrl({
            flow: context.flow || inferPaymentFlow(context.transactionId) || 'training',
            result: outcome.result,
            attemptId: outcome.attempt ? String(outcome.attempt._id) : context.attemptId,
            transactionId: outcome.attempt?.transactionId || context.transactionId,
            referenceCode,
            message: outcome.message,
        });

        return res.redirect(303, redirectUrl);
    } catch (error: any) {
        console.error('PayU callback handling failed:', error);
        return res.redirect(303, buildFailureRedirect(context, error?.message || 'Failed to process PayU callback.'));
    }
};

export const handlePayUWebhook = async (req: Request, res: Response) => {
    const context = getContext(req);

    if (!verifyPayUResponseHash(context.payload)) {
        return res.status(400).json({ message: 'PayU response validation failed.' });
    }

    try {
        const outcome = await dispatchPayUFlow(context, 'webhook');

        return res.status(200).json({
            received: true,
            flow: context.flow,
            result: outcome.result,
            message: outcome.message,
            attemptId: outcome.attempt ? String(outcome.attempt._id) : context.attemptId,
            transactionId: outcome.attempt?.transactionId || context.transactionId,
        });
    } catch (error: any) {
        console.error('PayU webhook handling failed:', error);
        return res.status(500).json({ message: error?.message || 'Failed to process PayU webhook.' });
    }
};
