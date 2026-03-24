"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withResolvedPaymentFields = exports.buildPaymentSnapshot = exports.applyGenericPaymentUpdate = exports.resolveBankReferenceNumber = exports.resolveGatewaySignature = exports.resolvePaymentId = exports.resolveTransactionId = exports.resolvePaymentGateway = void 0;
const trimToNull = (value) => {
    const normalizedValue = String(value !== null && value !== void 0 ? value : '').trim();
    return normalizedValue || null;
};
const lowerTrimToNull = (value) => {
    const normalizedValue = trimToNull(value);
    return normalizedValue ? normalizedValue.toLowerCase() : null;
};
const resolvePaymentGateway = (value, fallback) => trimToNull(String(value !== null && value !== void 0 ? value : '')) || trimToNull(fallback) || 'payu';
exports.resolvePaymentGateway = resolvePaymentGateway;
const resolveTransactionId = (source) => trimToNull(source === null || source === void 0 ? void 0 : source.transactionId) || trimToNull(source === null || source === void 0 ? void 0 : source.razorpayOrderId);
exports.resolveTransactionId = resolveTransactionId;
const resolvePaymentId = (source) => trimToNull(source === null || source === void 0 ? void 0 : source.paymentId) || trimToNull(source === null || source === void 0 ? void 0 : source.razorpayPaymentId);
exports.resolvePaymentId = resolvePaymentId;
const resolveGatewaySignature = (source) => trimToNull(source === null || source === void 0 ? void 0 : source.gatewaySignature) || trimToNull(source === null || source === void 0 ? void 0 : source.razorpaySignature);
exports.resolveGatewaySignature = resolveGatewaySignature;
const resolveBankReferenceNumber = (source) => trimToNull(source === null || source === void 0 ? void 0 : source.bankReferenceNumber);
exports.resolveBankReferenceNumber = resolveBankReferenceNumber;
const hasLegacyRazorpayFields = (source) => Boolean(trimToNull(source === null || source === void 0 ? void 0 : source.razorpayOrderId) ||
    trimToNull(source === null || source === void 0 ? void 0 : source.razorpayPaymentId) ||
    trimToNull(source === null || source === void 0 ? void 0 : source.razorpaySignature));
const applyGenericPaymentUpdate = (target, payment, options) => {
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
    const failureReason = trimToNull(options === null || options === void 0 ? void 0 : options.failureReason);
    if (transactionId)
        target.transactionId = transactionId;
    if (paymentId)
        target.paymentId = paymentId;
    if (paymentStatus)
        target.paymentStatus = paymentStatus;
    if (paymentMethod)
        target.paymentMethod = paymentMethod;
    if (paymentEmail)
        target.paymentEmail = paymentEmail;
    if (paymentContact)
        target.paymentContact = paymentContact;
    if (paymentErrorCode)
        target.paymentErrorCode = paymentErrorCode;
    if (paymentErrorDescription)
        target.paymentErrorDescription = paymentErrorDescription;
    if (paymentErrorSource)
        target.paymentErrorSource = paymentErrorSource;
    if (paymentErrorStep)
        target.paymentErrorStep = paymentErrorStep;
    if (paymentErrorReason)
        target.paymentErrorReason = paymentErrorReason;
    if (gatewaySignature)
        target.gatewaySignature = gatewaySignature;
    if (bankReferenceNumber)
        target.bankReferenceNumber = bankReferenceNumber;
    if (failureReason)
        target.failureReason = failureReason;
    if ((options === null || options === void 0 ? void 0 : options.status) === 'paid') {
        target.status = 'paid';
        target.paidAt = target.paidAt || new Date();
    }
    else if (options === null || options === void 0 ? void 0 : options.status) {
        target.status = options.status;
    }
};
exports.applyGenericPaymentUpdate = applyGenericPaymentUpdate;
const buildPaymentSnapshot = (attempt) => ({
    status: String((attempt === null || attempt === void 0 ? void 0 : attempt.paymentStatus) || (attempt === null || attempt === void 0 ? void 0 : attempt.status) || '').trim(),
    amount: Number.isFinite(Number(attempt === null || attempt === void 0 ? void 0 : attempt.amount))
        ? Number((Number(attempt.amount) / 100).toFixed(2))
        : null,
    currency: String((attempt === null || attempt === void 0 ? void 0 : attempt.currency) || 'INR').trim().toUpperCase(),
    method: trimToNull(attempt === null || attempt === void 0 ? void 0 : attempt.paymentMethod),
    gateway: (0, exports.resolvePaymentGateway)(attempt === null || attempt === void 0 ? void 0 : attempt.paymentGateway, hasLegacyRazorpayFields(attempt) ? 'razorpay' : 'payu'),
    transactionId: (0, exports.resolveTransactionId)(attempt),
    paymentId: (0, exports.resolvePaymentId)(attempt),
    bankReferenceNumber: (0, exports.resolveBankReferenceNumber)(attempt),
    paidAt: (attempt === null || attempt === void 0 ? void 0 : attempt.paidAt) || (attempt === null || attempt === void 0 ? void 0 : attempt.createdAt) || null,
});
exports.buildPaymentSnapshot = buildPaymentSnapshot;
const withResolvedPaymentFields = (source) => (Object.assign(Object.assign({}, source), { paymentGateway: (0, exports.resolvePaymentGateway)(source === null || source === void 0 ? void 0 : source.paymentGateway, hasLegacyRazorpayFields(source) ? 'razorpay' : 'payu'), transactionId: (0, exports.resolveTransactionId)(source), paymentId: (0, exports.resolvePaymentId)(source), gatewaySignature: (0, exports.resolveGatewaySignature)(source), bankReferenceNumber: (0, exports.resolveBankReferenceNumber)(source) }));
exports.withResolvedPaymentFields = withResolvedPaymentFields;
