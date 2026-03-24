import type { Request } from 'express';
import { env } from '../config/env';

export type PaymentFlow = 'training' | 'internship' | 'webinar';
export type PaymentResult = 'success' | 'failure' | 'cancel' | 'pending';

const trimToNull = (value: unknown) => {
    const normalizedValue = String(value ?? '').trim();
    return normalizedValue || null;
};

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

export const getRequestOrigin = (req: Request) => {
    const configuredBaseUrl = String(env.BACKEND_PUBLIC_BASE_URL || '').trim();
    if (configuredBaseUrl) {
        return normalizeBaseUrl(configuredBaseUrl);
    }

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

export const buildPayUCallbackUrl = (req: Request, result: PaymentResult) =>
    `${normalizeBaseUrl(getRequestOrigin(req))}/api/payments/payu/callback?result=${encodeURIComponent(result)}`;

export const buildPayULaunchUrl = (req: Request, flow: PaymentFlow, attemptId: string) =>
    `${normalizeBaseUrl(getRequestOrigin(req))}/api/payments/payu/launch?flow=${encodeURIComponent(flow)}&attemptId=${encodeURIComponent(attemptId)}`;

export const buildFrontendPaymentResultUrl = (params: {
    flow: PaymentFlow;
    result: PaymentResult;
    attemptId?: string | null;
    transactionId?: string | null;
    referenceCode?: string | null;
    message?: string | null;
}) => {
    const url = new URL('/payment-result', normalizeBaseUrl(env.FRONTEND_BASE_URL));

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

export const inferPaymentFlow = (value: unknown): PaymentFlow | null => {
    const normalizedValue = String(value ?? '').trim().toLowerCase();

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

export const normalizePaymentResult = (value: unknown): PaymentResult | null => {
    const normalizedValue = String(value ?? '').trim().toLowerCase();

    if (normalizedValue === 'success') return 'success';
    if (normalizedValue === 'pending') return 'pending';
    if (normalizedValue === 'cancel' || normalizedValue === 'cancelled') return 'cancel';
    if (normalizedValue === 'failure' || normalizedValue === 'failed') return 'failure';

    return null;
};

export const mapInternalStatusToPaymentResult = (status: 'paid' | 'failed' | 'cancelled' | 'pending'): PaymentResult => {
    if (status === 'paid') return 'success';
    if (status === 'pending') return 'pending';
    if (status === 'cancelled') return 'cancel';
    return 'failure';
};
