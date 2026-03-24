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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePayUWebhook = exports.handlePayUCallback = exports.launchPayUCheckout = void 0;
const internshipApplication_controller_1 = require("./internshipApplication.controller");
const trainingCheckout_controller_1 = require("./trainingCheckout.controller");
const webinarRegistration_controller_1 = require("./webinarRegistration.controller");
const payu_1 = require("../utils/payu");
const payment_urls_1 = require("../utils/payment.urls");
const getPayload = (req) => {
    if (req.body && typeof req.body === 'object') {
        return req.body;
    }
    return {};
};
const getContext = (req) => {
    const payload = getPayload(req);
    const transactionId = (0, payu_1.extractPayUPayloadValue)(payload, 'txnid', 'txnId', 'transactionId');
    const attemptId = (0, payu_1.extractPayUPayloadValue)(payload, 'udf2', 'referenceId');
    const flow = (0, payment_urls_1.inferPaymentFlow)((0, payu_1.extractPayUPayloadValue)(payload, 'udf1') || transactionId);
    const resultHint = (0, payment_urls_1.normalizePaymentResult)(req.query.result)
        || (0, payment_urls_1.normalizePaymentResult)((0, payu_1.extractPayUPayloadValue)(payload, 'status'));
    return {
        payload,
        flow,
        attemptId,
        transactionId,
        resultHint,
    };
};
const dispatchPayUFlow = (context, source) => __awaiter(void 0, void 0, void 0, function* () {
    if (context.flow === 'training') {
        return (0, trainingCheckout_controller_1.processTrainingPayUPayment)({
            attemptId: context.attemptId,
            transactionId: context.transactionId,
            payload: context.payload,
            resultHint: context.resultHint,
        });
    }
    if (context.flow === 'internship') {
        return (0, internshipApplication_controller_1.processInternshipPayUPayment)({
            attemptId: context.attemptId,
            transactionId: context.transactionId,
            payload: context.payload,
            resultHint: context.resultHint,
            source,
        });
    }
    if (context.flow === 'webinar') {
        return (0, webinarRegistration_controller_1.processWebinarPayUPayment)({
            attemptId: context.attemptId,
            transactionId: context.transactionId,
            payload: context.payload,
            resultHint: context.resultHint,
        });
    }
    throw new Error('Unable to determine which payment flow this PayU event belongs to.');
});
const buildFailureRedirect = (context, message) => (0, payment_urls_1.buildFrontendPaymentResultUrl)({
    flow: context.flow || (0, payment_urls_1.inferPaymentFlow)(context.transactionId) || 'training',
    result: 'failure',
    attemptId: context.attemptId,
    transactionId: context.transactionId,
    message,
});
const buildLaunchFailureRedirect = (params) => (0, payment_urls_1.buildFrontendPaymentResultUrl)({
    flow: params.flow || 'training',
    result: 'failure',
    attemptId: params.attemptId,
    message: params.message,
});
const escapeHtml = (value) => String(value !== null && value !== void 0 ? value : '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
const buildHostedCheckoutPage = (params) => {
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
            <button type="submit" style="padding: 12px 16px; border: 0; border-radius: 10px; background: #0f172a; color: white; cursor: pointer;">Continue to PayU</button>
        </form>
        <p style="margin: 16px 0 0; color: #64748b; font-size: 14px;">If you are not redirected automatically, click the button above.</p>
    </div>
    <script>
        window.addEventListener('load', function () {
            var form = document.getElementById('payu-checkout-form');
            if (form) {
                form.submit();
            }
        });
    </script>
</body>
</html>`;
};
const launchPayUCheckout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const flow = (0, payment_urls_1.inferPaymentFlow)(req.query.flow);
    const attemptId = String((_a = req.query.attemptId) !== null && _a !== void 0 ? _a : '').trim() || null;
    if (!flow || !attemptId) {
        return res.redirect(303, buildLaunchFailureRedirect({
            flow,
            attemptId,
            message: 'The PayU checkout link is incomplete.',
        }));
    }
    try {
        const checkoutParams = flow === 'training'
            ? yield (0, trainingCheckout_controller_1.buildTrainingPayUCheckoutLaunch)(attemptId, req)
            : flow === 'internship'
                ? yield (0, internshipApplication_controller_1.buildInternshipPayUCheckoutLaunch)(attemptId, req)
                : yield (0, webinarRegistration_controller_1.buildWebinarPayUCheckoutLaunch)(attemptId, req);
        const checkoutForm = (0, payu_1.buildPayUHostedCheckoutForm)(checkoutParams);
        return res
            .status(200)
            .type('html')
            .set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; form-action 'self' https://test.payu.in https://secure.payu.in; base-uri 'none'; object-src 'none'; frame-ancestors 'self'")
            .set('Cache-Control', 'no-store')
            .send(buildHostedCheckoutPage(checkoutForm));
    }
    catch (error) {
        console.error('PayU hosted checkout launch failed:', error);
        return res.redirect(303, buildLaunchFailureRedirect({
            flow,
            attemptId,
            message: (error === null || error === void 0 ? void 0 : error.message) || 'Failed to launch PayU checkout.',
        }));
    }
});
exports.launchPayUCheckout = launchPayUCheckout;
const handlePayUCallback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const context = getContext(req);
    if (!(0, payu_1.verifyPayUResponseHash)(context.payload)) {
        return res.redirect(303, buildFailureRedirect(context, 'PayU response validation failed.'));
    }
    try {
        const outcome = yield dispatchPayUFlow(context, 'callback');
        const referenceCode = ((_a = outcome === null || outcome === void 0 ? void 0 : outcome.application) === null || _a === void 0 ? void 0 : _a.referenceCode)
            || ((_b = outcome === null || outcome === void 0 ? void 0 : outcome.registration) === null || _b === void 0 ? void 0 : _b.referenceCode)
            || null;
        const redirectUrl = (0, payment_urls_1.buildFrontendPaymentResultUrl)({
            flow: context.flow || (0, payment_urls_1.inferPaymentFlow)(context.transactionId) || 'training',
            result: outcome.result,
            attemptId: outcome.attempt ? String(outcome.attempt._id) : context.attemptId,
            transactionId: ((_c = outcome.attempt) === null || _c === void 0 ? void 0 : _c.transactionId) || context.transactionId,
            referenceCode,
            message: outcome.message,
        });
        return res.redirect(303, redirectUrl);
    }
    catch (error) {
        console.error('PayU callback handling failed:', error);
        return res.redirect(303, buildFailureRedirect(context, (error === null || error === void 0 ? void 0 : error.message) || 'Failed to process PayU callback.'));
    }
});
exports.handlePayUCallback = handlePayUCallback;
const handlePayUWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const context = getContext(req);
    if (!(0, payu_1.verifyPayUResponseHash)(context.payload)) {
        return res.status(400).json({ message: 'PayU response validation failed.' });
    }
    try {
        const outcome = yield dispatchPayUFlow(context, 'webhook');
        return res.status(200).json({
            received: true,
            flow: context.flow,
            result: outcome.result,
            message: outcome.message,
            attemptId: outcome.attempt ? String(outcome.attempt._id) : context.attemptId,
            transactionId: ((_a = outcome.attempt) === null || _a === void 0 ? void 0 : _a.transactionId) || context.transactionId,
        });
    }
    catch (error) {
        console.error('PayU webhook handling failed:', error);
        return res.status(500).json({ message: (error === null || error === void 0 ? void 0 : error.message) || 'Failed to process PayU webhook.' });
    }
});
exports.handlePayUWebhook = handlePayUWebhook;
