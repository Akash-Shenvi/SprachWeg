type MaybeString = string | null | undefined;

const trimToNull = (value: MaybeString) => {
    const normalizedValue = String(value ?? '').trim();
    return normalizedValue || null;
};

const lowerTrimToNull = (value: MaybeString) => {
    const normalizedValue = trimToNull(value);
    return normalizedValue ? normalizedValue.toLowerCase() : null;
};

export const resolvePaymentGateway = (value: unknown, fallback?: string | null) =>
    trimToNull(String(value ?? '')) || trimToNull(fallback) || 'payu';

export const resolveTransactionId = (source: any) =>
    trimToNull(source?.transactionId) || trimToNull(source?.razorpayOrderId);

export const resolvePaymentId = (source: any) =>
    trimToNull(source?.paymentId) || trimToNull(source?.razorpayPaymentId);

export const resolveGatewaySignature = (source: any) =>
    trimToNull(source?.gatewaySignature) || trimToNull(source?.razorpaySignature);

export const resolveBankReferenceNumber = (source: any) =>
    trimToNull(source?.bankReferenceNumber);

const hasLegacyRazorpayFields = (source: any) =>
    Boolean(
        trimToNull(source?.razorpayOrderId) ||
        trimToNull(source?.razorpayPaymentId) ||
        trimToNull(source?.razorpaySignature)
    );

export type GenericPaymentUpdate = {
    transactionId?: string | null;
    paymentId?: string | null;
    paymentStatus?: string | null;
    paymentMethod?: string | null;
    paymentEmail?: string | null;
    paymentContact?: string | null;
    paymentErrorCode?: string | null;
    paymentErrorDescription?: string | null;
    paymentErrorSource?: string | null;
    paymentErrorStep?: string | null;
    paymentErrorReason?: string | null;
    gatewaySignature?: string | null;
    bankReferenceNumber?: string | null;
};

export const applyGenericPaymentUpdate = (
    target: any,
    payment: GenericPaymentUpdate,
    options?: {
        status?: 'created' | 'paid' | 'failed' | 'cancelled';
        failureReason?: string;
    }
) => {
    const transactionId = trimToNull(payment.transactionId);
    const paymentId = trimToNull(payment.paymentId);
    const paymentStatus = trimToNull(payment.paymentStatus);
    const paymentMethod = trimToNull(payment.paymentMethod);
    const paymentEmail = lowerTrimToNull(payment.paymentEmail);
    const paymentContact = trimToNull(payment.paymentContact);
    const paymentErrorCode = trimToNull(payment.paymentErrorCode);
    const paymentErrorDescription = trimToNull(payment.paymentErrorDescription);
    const paymentErrorSource = trimToNull(payment.paymentErrorSource);
    const paymentErrorStep = trimToNull(payment.paymentErrorStep);
    const paymentErrorReason = trimToNull(payment.paymentErrorReason);
    const gatewaySignature = trimToNull(payment.gatewaySignature);
    const bankReferenceNumber = trimToNull(payment.bankReferenceNumber);
    const failureReason = trimToNull(options?.failureReason);

    if (transactionId) target.transactionId = transactionId;
    if (paymentId) target.paymentId = paymentId;
    if (paymentStatus) target.paymentStatus = paymentStatus;
    if (paymentMethod) target.paymentMethod = paymentMethod;
    if (paymentEmail) target.paymentEmail = paymentEmail;
    if (paymentContact) target.paymentContact = paymentContact;
    if (paymentErrorCode) target.paymentErrorCode = paymentErrorCode;
    if (paymentErrorDescription) target.paymentErrorDescription = paymentErrorDescription;
    if (paymentErrorSource) target.paymentErrorSource = paymentErrorSource;
    if (paymentErrorStep) target.paymentErrorStep = paymentErrorStep;
    if (paymentErrorReason) target.paymentErrorReason = paymentErrorReason;
    if (gatewaySignature) target.gatewaySignature = gatewaySignature;
    if (bankReferenceNumber) target.bankReferenceNumber = bankReferenceNumber;
    if (failureReason) target.failureReason = failureReason;

    if (options?.status === 'paid') {
        target.status = 'paid';
        target.paidAt = target.paidAt || new Date();
    } else if (options?.status) {
        target.status = options.status;
    }
};

export const buildPaymentSnapshot = (attempt: any) => ({
    status: String(attempt?.paymentStatus || attempt?.status || '').trim(),
    amount: Number.isFinite(Number(attempt?.amount))
        ? Number((Number(attempt.amount) / 100).toFixed(2))
        : null,
    currency: String(attempt?.currency || 'INR').trim().toUpperCase(),
    method: trimToNull(attempt?.paymentMethod),
    gateway: resolvePaymentGateway(attempt?.paymentGateway, hasLegacyRazorpayFields(attempt) ? 'razorpay' : 'payu'),
    transactionId: resolveTransactionId(attempt),
    paymentId: resolvePaymentId(attempt),
    bankReferenceNumber: resolveBankReferenceNumber(attempt),
    paidAt: attempt?.paidAt || attempt?.createdAt || null,
});

export const withResolvedPaymentFields = <T extends Record<string, any>>(source: T) => ({
    ...source,
    paymentGateway: resolvePaymentGateway(source?.paymentGateway, hasLegacyRazorpayFields(source) ? 'razorpay' : 'payu'),
    transactionId: resolveTransactionId(source),
    paymentId: resolvePaymentId(source),
    gatewaySignature: resolveGatewaySignature(source),
    bankReferenceNumber: resolveBankReferenceNumber(source),
});
