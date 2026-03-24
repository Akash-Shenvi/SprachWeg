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
exports.handlePayUWebhook = exports.handlePayUCallback = void 0;
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
