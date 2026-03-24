import crypto from 'crypto';
import { env } from '../config/env';

type PayUResultHint = 'success' | 'failure' | 'cancel' | 'pending';

type PayURequestHeaders = Record<string, string>;

type PayUCreateCheckoutParams = {
    transactionId: string;
    referenceId: string;
    amount: number;
    productInfo: string;
    firstName: string;
    lastName?: string;
    email: string;
    phone: string;
    flow: 'training' | 'internship' | 'webinar';
    userDefinedFields?: Record<string, string>;
    successAction: string;
    failureAction: string;
    cancelAction: string;
};

type PayUCheckoutResponse = {
    redirectUrl: string;
    status: string;
    raw: any;
};

export type PayUVerificationResult = {
    transactionId: string;
    status: string;
    internalStatus: 'paid' | 'failed' | 'cancelled' | 'pending';
    paymentId: string | null;
    paymentMethod: string | null;
    paymentStatus: string | null;
    bankReferenceNumber: string | null;
    amount: number | null;
    currency: string | null;
    errorMessage: string | null;
    raw: any;
};

const payuEnv = String(env.PAYU_ENV || 'test').trim().toLowerCase();
const isProductionEnv = payuEnv === 'production' || payuEnv === 'prod' || payuEnv === 'live';

const PAYU_PAYMENTS_URL = isProductionEnv
    ? 'https://api.payu.in/v2/payments'
    : 'https://apitest.payu.in/v2/payments';

const PAYU_VERIFY_URL = isProductionEnv
    ? 'https://info.payu.in/v3/transaction'
    : 'https://test.payu.in/v3/transaction';

const trimToNull = (value: unknown) => {
    const normalizedValue = String(value ?? '').trim();
    return normalizedValue || null;
};

const ensurePayUConfigured = () => {
    if (!env.PAYU_ACCOUNT_ID || !env.PAYU_MERCHANT_SECRET || !env.PAYU_SALT) {
        throw new Error('PayU is not configured on the server.');
    }
};

const createAuthorizationHeader = (body: string, date: string) => {
    ensurePayUConfigured();

    const signature = crypto
        .createHash('sha512')
        .update(`${body}|${date}|${env.PAYU_MERCHANT_SECRET}`)
        .digest('hex');

    return `hmac username="${env.PAYU_ACCOUNT_ID}", algorithm="sha512", headers="date", signature="${signature}"`;
};

const payuJsonRequest = async <TResponse>(
    url: string,
    body: Record<string, unknown>,
    extraHeaders?: PayURequestHeaders
): Promise<TResponse> => {
    ensurePayUConfigured();

    const date = new Date().toUTCString();
    const serializedBody = JSON.stringify(body);
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            date,
            authorization: createAuthorizationHeader(serializedBody, date),
            ...(extraHeaders || {}),
        },
        body: serializedBody,
    });

    if (!response.ok) {
        const rawError = await response.text();
        throw new Error(rawError || `PayU request failed with status ${response.status}`);
    }

    return response.json() as Promise<TResponse>;
};

const toMajorAmount = (amountInSubunits: number) => Number((amountInSubunits / 100).toFixed(2));

export const createPayUHostedCheckout = async (params: PayUCreateCheckoutParams): Promise<PayUCheckoutResponse> => {
    const requestBody = {
        accountId: env.PAYU_ACCOUNT_ID,
        txnId: params.transactionId,
        referenceId: params.referenceId,
        order: {
            productInfo: params.productInfo,
            paymentChargeSpecification: {
                price: toMajorAmount(params.amount),
            },
            userDefinedFields: {
                udf1: params.flow,
                udf2: params.referenceId,
                ...(params.userDefinedFields || {}),
            },
        },
        additionalInfo: {
            txnFlow: 'nonseamless',
        },
        callBackActions: {
            successAction: params.successAction,
            failureAction: params.failureAction,
            cancelAction: params.cancelAction,
        },
        billingDetails: {
            firstName: params.firstName,
            lastName: params.lastName || '',
            email: params.email,
            phone: params.phone,
        },
    };

    const response = await payuJsonRequest<any>(PAYU_PAYMENTS_URL, requestBody);
    const redirectUrl = trimToNull(response?.result?.checkoutUrl) || trimToNull(response?.redirectUrl);

    if (!redirectUrl) {
        throw new Error('PayU did not return a checkout URL.');
    }

    return {
        redirectUrl,
        status: trimToNull(response?.result?.status) || trimToNull(response?.status) || 'pending',
        raw: response,
    };
};

const findTransactionResult = (payload: any, transactionId: string) => {
    const normalizedTransactionId = String(transactionId).trim();
    const result = payload?.result;

    if (Array.isArray(result)) {
        return result.find((item) =>
            [item?.txnId, item?.txnid, item?.transactionId].some((value) => String(value ?? '').trim() === normalizedTransactionId)
        ) || null;
    }

    if (result && typeof result === 'object') {
        if (result[normalizedTransactionId]) {
            return result[normalizedTransactionId];
        }

        const resultValues = Object.values(result);
        return resultValues.find((item: any) =>
            [item?.txnId, item?.txnid, item?.transactionId].some((value) => String(value ?? '').trim() === normalizedTransactionId)
        ) || null;
    }

    return null;
};

export const mapPayUStatusToInternal = (status: string | null | undefined, resultHint?: PayUResultHint) => {
    const normalizedStatus = String(status ?? '').trim().toLowerCase();

    if (normalizedStatus === 'success') {
        return 'paid' as const;
    }

    if (normalizedStatus === 'pending') {
        return 'pending' as const;
    }

    if (normalizedStatus === 'cancel' || normalizedStatus === 'cancelled') {
        return 'cancelled' as const;
    }

    if (normalizedStatus.includes('cancel')) {
        return 'cancelled' as const;
    }

    if (resultHint === 'cancel') {
        return 'cancelled' as const;
    }

    return 'failed' as const;
};

export const verifyPayUTransaction = async (
    transactionId: string,
    resultHint?: PayUResultHint
): Promise<PayUVerificationResult> => {
    const requestBody = {
        txnId: [transactionId],
    };

    const response = await payuJsonRequest<any>(PAYU_VERIFY_URL, requestBody, {
        'Info-Command': 'verify_payment',
    });

    const transaction = findTransactionResult(response, transactionId);
    if (!transaction) {
        throw new Error('PayU verification did not return a matching transaction.');
    }

    const rawStatus = trimToNull(transaction?.status);
    const paymentStatus = trimToNull(transaction?.unmappedStatus) || rawStatus;

    return {
        transactionId,
        status: rawStatus || 'failed',
        internalStatus: mapPayUStatusToInternal(rawStatus, resultHint),
        paymentId: trimToNull(transaction?.mihpayId) || trimToNull(transaction?.mihpayid) || trimToNull(transaction?.paymentId),
        paymentMethod: trimToNull(transaction?.mode),
        paymentStatus,
        bankReferenceNumber: trimToNull(transaction?.bankReferenceNumber) || trimToNull(transaction?.bank_ref_num),
        amount: Number.isFinite(Number(transaction?.amount)) ? Number(transaction.amount) : null,
        currency: trimToNull(transaction?.originalCurrency) || trimToNull(transaction?.currency),
        errorMessage:
            trimToNull(transaction?.error_Message)
            || trimToNull(transaction?.errorMessage)
            || trimToNull(transaction?.error)
            || trimToNull(transaction?.field9),
        raw: transaction,
    };
};

const buildReverseHashString = (payload: Record<string, unknown>) => {
    ensurePayUConfigured();

    const status = String(payload.status ?? '').trim();
    const key = String(payload.key ?? env.PAYU_ACCOUNT_ID).trim();
    const txnId = String(payload.txnid ?? payload.txnId ?? '').trim();
    const amount = String(payload.amount ?? '').trim();
    const productInfo = String(payload.productinfo ?? payload.productInfo ?? '').trim();
    const firstName = String(payload.firstname ?? payload.firstName ?? '').trim();
    const email = String(payload.email ?? '').trim();
    const udf1 = String(payload.udf1 ?? '').trim();
    const udf2 = String(payload.udf2 ?? '').trim();
    const udf3 = String(payload.udf3 ?? '').trim();
    const udf4 = String(payload.udf4 ?? '').trim();
    const udf5 = String(payload.udf5 ?? '').trim();
    const additionalCharges = trimToNull(payload.additionalCharges);

    const reverseHashBase = [
        env.PAYU_SALT,
        status,
        '',
        '',
        '',
        '',
        '',
        udf5,
        udf4,
        udf3,
        udf2,
        udf1,
        email,
        firstName,
        productInfo,
        amount,
        txnId,
        key,
    ].join('|');

    return additionalCharges ? `${additionalCharges}|${reverseHashBase}` : reverseHashBase;
};

export const verifyPayUResponseHash = (payload: Record<string, unknown>) => {
    const receivedHash = trimToNull(payload.hash);

    if (!receivedHash) {
        return true;
    }

    const generatedHash = crypto
        .createHash('sha512')
        .update(buildReverseHashString(payload))
        .digest('hex')
        .toLowerCase();

    return generatedHash === receivedHash.toLowerCase();
};

export const compareExpectedAmount = (amountInSubunits: number, verifiedAmount: number | null) => {
    if (verifiedAmount === null) {
        return true;
    }

    return toMajorAmount(amountInSubunits) === Number(verifiedAmount.toFixed(2));
};

export const buildPayUTransactionId = (prefix: string, attemptId: string) => {
    const sanitizedPrefix = String(prefix).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 10) || 'payu';
    const sanitizedAttemptId = String(attemptId).replace(/[^a-zA-Z0-9_-]/g, '');
    return `${sanitizedPrefix}_${sanitizedAttemptId}`.slice(0, 50);
};

export const extractPayUPayloadValue = (payload: Record<string, unknown>, ...keys: string[]) => {
    for (const key of keys) {
        const value = trimToNull(payload[key]);
        if (value) {
            return value;
        }
    }

    return null;
};
