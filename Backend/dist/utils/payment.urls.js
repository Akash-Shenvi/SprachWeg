"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapInternalStatusToPaymentResult = exports.normalizePaymentResult = exports.inferPaymentFlow = exports.buildFrontendPaymentResultUrl = exports.buildPayULaunchUrl = exports.buildPayUCallbackUrl = exports.getRequestOrigin = void 0;
const env_1 = require("../config/env");
const trimToNull = (value) => {
    const normalizedValue = String(value !== null && value !== void 0 ? value : '').trim();
    return normalizedValue || null;
};
const normalizeBaseUrl = (value) => value.replace(/\/+$/, '');
const getRequestOrigin = (req) => {
    const forwardedProtoHeader = req.headers['x-forwarded-proto'];
    const forwardedHostHeader = req.headers['x-forwarded-host'];
    const protocol = Array.isArray(forwardedProtoHeader)
        ? forwardedProtoHeader[0]
        : String(forwardedProtoHeader || req.protocol || 'http').split(',')[0].trim();
    const host = Array.isArray(forwardedHostHeader)
        ? forwardedHostHeader[0]
        : String(forwardedHostHeader || req.get('host') || '').split(',')[0].trim();
    if (!host) {
        throw new Error('Unable to determine the public request host for payment callbacks.');
    }
    return `${protocol || 'http'}://${host}`;
};
exports.getRequestOrigin = getRequestOrigin;
const buildPayUCallbackUrl = (req, result) => `${normalizeBaseUrl((0, exports.getRequestOrigin)(req))}/api/payments/payu/callback?result=${encodeURIComponent(result)}`;
exports.buildPayUCallbackUrl = buildPayUCallbackUrl;
const buildPayULaunchUrl = (req, flow, attemptId) => `${normalizeBaseUrl((0, exports.getRequestOrigin)(req))}/api/payments/payu/launch?flow=${encodeURIComponent(flow)}&attemptId=${encodeURIComponent(attemptId)}`;
exports.buildPayULaunchUrl = buildPayULaunchUrl;
const buildFrontendPaymentResultUrl = (params) => {
    const url = new URL('/payment-result', normalizeBaseUrl(env_1.env.FRONTEND_BASE_URL));
    url.searchParams.set('flow', params.flow);
    url.searchParams.set('result', params.result);
    const attemptId = trimToNull(params.attemptId);
    const transactionId = trimToNull(params.transactionId);
    const referenceCode = trimToNull(params.referenceCode);
    const message = trimToNull(params.message);
    if (attemptId) {
        url.searchParams.set('attemptId', attemptId);
    }
    if (transactionId) {
        url.searchParams.set('transactionId', transactionId);
    }
    if (referenceCode) {
        url.searchParams.set('referenceCode', referenceCode);
    }
    if (message) {
        url.searchParams.set('message', message);
    }
    return url.toString();
};
exports.buildFrontendPaymentResultUrl = buildFrontendPaymentResultUrl;
const inferPaymentFlow = (value) => {
    const normalizedValue = String(value !== null && value !== void 0 ? value : '').trim().toLowerCase();
    if (normalizedValue === 'training' || normalizedValue === 'internship' || normalizedValue === 'webinar') {
        return normalizedValue;
    }
    if (normalizedValue.startsWith('training_')) {
        return 'training';
    }
    if (normalizedValue.startsWith('internship_')) {
        return 'internship';
    }
    if (normalizedValue.startsWith('webinar_')) {
        return 'webinar';
    }
    return null;
};
exports.inferPaymentFlow = inferPaymentFlow;
const normalizePaymentResult = (value) => {
    const normalizedValue = String(value !== null && value !== void 0 ? value : '').trim().toLowerCase();
    if (normalizedValue === 'success')
        return 'success';
    if (normalizedValue === 'pending')
        return 'pending';
    if (normalizedValue === 'cancel' || normalizedValue === 'cancelled')
        return 'cancel';
    if (normalizedValue === 'failure' || normalizedValue === 'failed')
        return 'failure';
    return null;
};
exports.normalizePaymentResult = normalizePaymentResult;
const mapInternalStatusToPaymentResult = (status) => {
    if (status === 'paid')
        return 'success';
    if (status === 'pending')
        return 'pending';
    if (status === 'cancelled')
        return 'cancel';
    return 'failure';
};
exports.mapInternalStatusToPaymentResult = mapInternalStatusToPaymentResult;
