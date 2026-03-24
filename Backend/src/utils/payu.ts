import crypto from 'crypto';
import { env } from '../config/env';

type PayUResultHint = 'success' | 'failure' | 'cancel' | 'pending';

export type PayUHostedCheckoutParams = {
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

export type PayUHostedCheckoutForm = {
    actionUrl: string;
    fields: Record<string, string>;
    status: 'created';
    raw: Record<string, string>;
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

const PAYU_PAYMENT_PAGE_URL = isProductionEnv
    ? 'https://secure.payu.in/_payment'
    : 'https://test.payu.in/_payment';

const PAYU_VERIFY_URL = isProductionEnv
    ? 'https://info.payu.in/merchant/postservice.php?form=2'
    : 'https://test.payu.in/merchant/postservice.php?form=2';

const trimToNull = (value: unknown) => {
    const normalizedValue = String(value ?? '').trim();
    return normalizedValue || null;
};

const getPayloadValue = (payload: Record<string, unknown>, ...keys: string[]) => {
    for (const key of keys) {
        const value = trimToNull(payload[key]);
        if (value) {
            return value;
        }
    }

    return null;
};

const ensurePayUConfigured = () => {
    if (!env.PAYU_ACCOUNT_ID || !env.PAYU_SALT) {
        throw new Error('PayU is not configured on the server.');
    }
};

const toMajorAmountString = (amountInSubunits: number) => (amountInSubunits / 100).toFixed(2);

const sha512 = (value: string) => crypto.createHash('sha512').update(value).digest('hex').toLowerCase();

const buildPaymentRequestHash = (params: Record<string, string>) => sha512([
    env.PAYU_ACCOUNT_ID,
    params.txnid,
    params.amount,
    params.productinfo,
    params.firstname,
    params.email,
    params.udf1 || '',
    params.udf2 || '',
    params.udf3 || '',
    params.udf4 || '',
    params.udf5 || '',
    '',
    '',
    '',
    '',
    '',
    env.PAYU_SALT,
].join('|'));

const buildGeneralApiHash = (command: string, var1: string) => sha512([
    env.PAYU_ACCOUNT_ID,
    command,
    var1,
    env.PAYU_SALT,
].join('|'));

const parseJsonResponse = <TResponse>(rawResponse: string): TResponse => {
    try {
        return JSON.parse(rawResponse) as TResponse;
    } catch {
        throw new Error(rawResponse || 'PayU returned an invalid response.');
    }
};

const payuFormRequest = async <TResponse>(body: Record<string, string>): Promise<TResponse> => {
    ensurePayUConfigured();

    const response = await fetch(PAYU_VERIFY_URL, {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(body).toString(),
    });

    const rawResponse = await response.text();

    if (!response.ok) {
        throw new Error(rawResponse || `PayU request failed with status ${response.status}`);
    }

    return parseJsonResponse<TResponse>(rawResponse);
};

export const buildPayUHostedCheckoutForm = (params: PayUHostedCheckoutParams): PayUHostedCheckoutForm => {
    ensurePayUConfigured();

    const fields: Record<string, string> = {
        key: env.PAYU_ACCOUNT_ID,
        txnid: params.transactionId,
        amount: toMajorAmountString(params.amount),
        productinfo: params.productInfo,
        firstname: params.firstName,
        lastname: params.lastName || '',
        email: params.email,
        phone: params.phone,
        surl: params.successAction,
        furl: params.failureAction,
        udf1: params.flow,
        udf2: params.referenceId,
        udf3: String(params.userDefinedFields?.udf3 || '').trim(),
        udf4: String(params.userDefinedFields?.udf4 || '').trim(),
        udf5: String(params.userDefinedFields?.udf5 || '').trim(),
    };

    fields.hash = buildPaymentRequestHash(fields);

    return {
        actionUrl: PAYU_PAYMENT_PAGE_URL,
        fields,
        status: 'created',
        raw: fields,
    };
};

const findTransactionResult = (payload: any, transactionId: string) => {
    const normalizedTransactionId = String(transactionId).trim();
    const transactionDetails = payload?.transaction_details;

    if (transactionDetails && typeof transactionDetails === 'object') {
        if (transactionDetails[normalizedTransactionId]) {
            return transactionDetails[normalizedTransactionId];
        }

        return Object.values(transactionDetails).find((item: any) =>
            String(item?.txnid ?? '').trim() === normalizedTransactionId
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
    const response = await payuFormRequest<any>({
        key: env.PAYU_ACCOUNT_ID,
        command: 'verify_payment',
        var1: transactionId,
        hash: buildGeneralApiHash('verify_payment', transactionId),
    });

    const transaction = findTransactionResult(response, transactionId);
    if (!transaction) {
        throw new Error('PayU verification did not return a matching transaction.');
    }

    const rawStatus = trimToNull(transaction?.status);
    const paymentStatus = trimToNull(transaction?.unmappedstatus) || rawStatus;

    return {
        transactionId,
        status: rawStatus || 'failed',
        internalStatus: mapPayUStatusToInternal(rawStatus, resultHint),
        paymentId: trimToNull(transaction?.mihpayid) || trimToNull(transaction?.mihpayId),
        paymentMethod: trimToNull(transaction?.mode),
        paymentStatus,
        bankReferenceNumber: trimToNull(transaction?.bank_ref_num) || trimToNull(transaction?.bankReferenceNumber),
        amount: Number.isFinite(Number(transaction?.amt))
            ? Number(transaction.amt)
            : Number.isFinite(Number(transaction?.amount))
                ? Number(transaction.amount)
                : Number.isFinite(Number(transaction?.transaction_amount))
                    ? Number(transaction.transaction_amount)
                    : null,
        currency: trimToNull(transaction?.currency),
        errorMessage:
            trimToNull(transaction?.error_Message)
            || trimToNull(transaction?.error)
            || trimToNull(transaction?.field9)
            || trimToNull(response?.msg),
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
    const additionalCharges = getPayloadValue(payload, 'additional_charges', 'additionalCharges');
    const splitInfo = getPayloadValue(payload, 'splitInfo');

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

    if (additionalCharges && splitInfo) {
        return `${additionalCharges}|${reverseHashBase}|${splitInfo}`;
    }

    if (additionalCharges) {
        return `${additionalCharges}|${reverseHashBase}`;
    }

    if (splitInfo) {
        return `${reverseHashBase}|${splitInfo}`;
    }

    return reverseHashBase;
};

export const verifyPayUResponseHash = (payload: Record<string, unknown>) => {
    const receivedHash = trimToNull(payload.hash);

    if (!receivedHash) {
        return true;
    }

    const generatedHash = sha512(buildReverseHashString(payload));
    return generatedHash === receivedHash.toLowerCase();
};

export const compareExpectedAmount = (amountInSubunits: number, verifiedAmount: number | null) => {
    if (verifiedAmount === null) {
        return true;
    }

    return Number(toMajorAmountString(amountInSubunits)) === Number(verifiedAmount.toFixed(2));
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
