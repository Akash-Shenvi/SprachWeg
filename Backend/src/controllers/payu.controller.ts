import { Request, Response } from 'express';
import { buildInternshipPayUCheckoutLaunch, processInternshipPayUPayment } from './internshipApplication.controller';
import { buildTrainingPayUCheckoutLaunch, processTrainingPayUPayment } from './trainingCheckout.controller';
import { buildWebinarPayUCheckoutLaunch, processWebinarPayUPayment } from './webinarRegistration.controller';
import { buildPayUHostedCheckoutForm, extractPayUPayloadValue, verifyPayUResponseHash } from '../utils/payu';
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

const buildLaunchFailureRedirect = (params: {
    flow?: PaymentFlow | null;
    attemptId?: string | null;
    message: string;
}) =>
    buildFrontendPaymentResultUrl({
        flow: params.flow || 'training',
        result: 'failure',
        attemptId: params.attemptId,
        message: params.message,
    });

const escapeHtml = (value: unknown) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

const buildHostedCheckoutPage = (params: ReturnType<typeof buildPayUHostedCheckoutForm>) => {
    const hiddenFields = Object.entries(params.fields)
        .map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`)
        .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Redirecting to PayU</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f8fafc; color: #0f172a;">
    <div style="max-width: 420px; text-align: center; padding: 24px;">
        <h1 style="margin-bottom: 12px; font-size: 24px;">Redirecting to secure payment</h1>
        <p style="margin: 0 0 16px; color: #475569;">Please wait while we transfer you to PayU checkout.</p>
        <form id="payu-checkout-form" method="post" action="${escapeHtml(params.actionUrl)}">
            ${hiddenFields}
            <noscript>
                <button type="submit" style="padding: 12px 16px;">Continue to PayU</button>
            </noscript>
        </form>
    </div>
    <script>
        document.getElementById('payu-checkout-form').submit();
    </script>
</body>
</html>`;
};

export const launchPayUCheckout = async (req: Request, res: Response) => {
    const flow = inferPaymentFlow(req.query.flow);
    const attemptId = String(req.query.attemptId ?? '').trim() || null;

    if (!flow || !attemptId) {
        return res.redirect(303, buildLaunchFailureRedirect({
            flow,
            attemptId,
            message: 'The PayU checkout link is incomplete.',
        }));
    }

    try {
        const checkoutParams = flow === 'training'
            ? await buildTrainingPayUCheckoutLaunch(attemptId, req)
            : flow === 'internship'
                ? await buildInternshipPayUCheckoutLaunch(attemptId, req)
                : await buildWebinarPayUCheckoutLaunch(attemptId, req);

        const checkoutForm = buildPayUHostedCheckoutForm(checkoutParams);

        return res
            .status(200)
            .type('html')
            .set('Cache-Control', 'no-store')
            .send(buildHostedCheckoutPage(checkoutForm));
    } catch (error: any) {
        console.error('PayU hosted checkout launch failed:', error);
        return res.redirect(303, buildLaunchFailureRedirect({
            flow,
            attemptId,
            message: error?.message || 'Failed to launch PayU checkout.',
        }));
    }
};

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
