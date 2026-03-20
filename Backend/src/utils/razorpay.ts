import crypto from 'crypto';
import { env } from '../config/env';

const RAZORPAY_API_BASE_URL = 'https://api.razorpay.com/v1';

interface RazorpayOrderNotes {
    [key: string]: string;
}

interface CreateRazorpayOrderParams {
    amount: number;
    currency: string;
    receipt: string;
    notes?: RazorpayOrderNotes;
}

export interface RazorpayOrderResponse {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    attempts: number;
    notes?: RazorpayOrderNotes;
    created_at: number;
}

export interface RazorpayPaymentResponse {
    id: string;
    entity: string;
    amount: number;
    currency: string;
    status: string;
    order_id: string;
    method?: string;
    email?: string;
    contact?: string;
    description?: string;
    error_code?: string;
    error_description?: string;
    error_source?: string;
    error_step?: string;
    error_reason?: string;
    created_at?: number;
}

const ensureRazorpayConfigured = () => {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay is not configured on the server.');
    }
};

const getRazorpayAuthHeader = () => {
    ensureRazorpayConfigured();
    const credentials = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
    return `Basic ${credentials}`;
};

const compareSignatures = (left: string, right: string) => {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const razorpayRequest = async <TResponse>(path: string, init?: RequestInit): Promise<TResponse> => {
    const response = await fetch(`${RAZORPAY_API_BASE_URL}${path}`, {
        ...init,
        headers: {
            Authorization: getRazorpayAuthHeader(),
            'Content-Type': 'application/json',
            ...(init?.headers || {}),
        },
    });

    if (!response.ok) {
        const rawError = await response.text();
        throw new Error(rawError || `Razorpay request failed with status ${response.status}`);
    }

    return response.json() as Promise<TResponse>;
};

export const createRazorpayOrder = async (params: CreateRazorpayOrderParams) =>
    razorpayRequest<RazorpayOrderResponse>('/orders', {
        method: 'POST',
        body: JSON.stringify(params),
    });

export const fetchRazorpayPayment = async (paymentId: string) =>
    razorpayRequest<RazorpayPaymentResponse>(`/payments/${paymentId}`, {
        method: 'GET',
    });

export const verifyRazorpayPaymentSignature = (params: {
    orderId: string;
    paymentId: string;
    signature: string;
}) => {
    ensureRazorpayConfigured();
    const generatedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${params.orderId}|${params.paymentId}`)
        .digest('hex');

    return compareSignatures(generatedSignature, params.signature);
};

export const verifyRazorpayWebhookSignature = (payload: Buffer | string, signature: string) => {
    if (!env.RAZORPAY_WEBHOOK_SECRET) {
        throw new Error('Razorpay webhook secret is not configured on the server.');
    }

    const generatedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

    return compareSignatures(generatedSignature, signature);
};
