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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPayUPayloadValue = exports.buildPayUTransactionId = exports.compareExpectedAmount = exports.verifyPayUResponseHash = exports.verifyPayUTransaction = exports.mapPayUStatusToInternal = exports.createPayUHostedCheckout = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const payuEnv = String(env_1.env.PAYU_ENV || 'test').trim().toLowerCase();
const isProductionEnv = payuEnv === 'production' || payuEnv === 'prod' || payuEnv === 'live';
const PAYU_PAYMENTS_URL = isProductionEnv
    ? 'https://api.payu.in/v2/payments'
    : 'https://apitest.payu.in/v2/payments';
const PAYU_VERIFY_URL = isProductionEnv
    ? 'https://info.payu.in/v3/transaction'
    : 'https://test.payu.in/v3/transaction';
const trimToNull = (value) => {
    const normalizedValue = String(value !== null && value !== void 0 ? value : '').trim();
    return normalizedValue || null;
};
const ensurePayUConfigured = () => {
    if (!env_1.env.PAYU_ACCOUNT_ID || !env_1.env.PAYU_MERCHANT_SECRET || !env_1.env.PAYU_SALT) {
        throw new Error('PayU is not configured on the server.');
    }
};
const createAuthorizationHeader = (body, date) => {
    ensurePayUConfigured();
    const signature = crypto_1.default
        .createHash('sha512')
        .update(`${body}|${date}|${env_1.env.PAYU_MERCHANT_SECRET}`)
        .digest('hex');
    return `hmac username="${env_1.env.PAYU_ACCOUNT_ID}", algorithm="sha512", headers="date", signature="${signature}"`;
};
const payuJsonRequest = (url, body, extraHeaders) => __awaiter(void 0, void 0, void 0, function* () {
    ensurePayUConfigured();
    const date = new Date().toUTCString();
    const serializedBody = JSON.stringify(body);
    const response = yield fetch(url, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json', date, authorization: createAuthorizationHeader(serializedBody, date) }, (extraHeaders || {})),
        body: serializedBody,
    });
    if (!response.ok) {
        const rawError = yield response.text();
        throw new Error(rawError || `PayU request failed with status ${response.status}`);
    }
    return response.json();
});
const toMajorAmount = (amountInSubunits) => Number((amountInSubunits / 100).toFixed(2));
const createPayUHostedCheckout = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const requestBody = {
        accountId: env_1.env.PAYU_ACCOUNT_ID,
        txnId: params.transactionId,
        referenceId: params.referenceId,
        order: {
            productInfo: params.productInfo,
            paymentChargeSpecification: {
                price: toMajorAmount(params.amount),
            },
            userDefinedFields: Object.assign({ udf1: params.flow, udf2: params.referenceId }, (params.userDefinedFields || {})),
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
    const response = yield payuJsonRequest(PAYU_PAYMENTS_URL, requestBody);
    const redirectUrl = trimToNull((_a = response === null || response === void 0 ? void 0 : response.result) === null || _a === void 0 ? void 0 : _a.checkoutUrl) || trimToNull(response === null || response === void 0 ? void 0 : response.redirectUrl);
    if (!redirectUrl) {
        throw new Error('PayU did not return a checkout URL.');
    }
    return {
        redirectUrl,
        status: trimToNull((_b = response === null || response === void 0 ? void 0 : response.result) === null || _b === void 0 ? void 0 : _b.status) || trimToNull(response === null || response === void 0 ? void 0 : response.status) || 'pending',
        raw: response,
    };
});
exports.createPayUHostedCheckout = createPayUHostedCheckout;
const findTransactionResult = (payload, transactionId) => {
    const normalizedTransactionId = String(transactionId).trim();
    const result = payload === null || payload === void 0 ? void 0 : payload.result;
    if (Array.isArray(result)) {
        return result.find((item) => [item === null || item === void 0 ? void 0 : item.txnId, item === null || item === void 0 ? void 0 : item.txnid, item === null || item === void 0 ? void 0 : item.transactionId].some((value) => String(value !== null && value !== void 0 ? value : '').trim() === normalizedTransactionId)) || null;
    }
    if (result && typeof result === 'object') {
        if (result[normalizedTransactionId]) {
            return result[normalizedTransactionId];
        }
        const resultValues = Object.values(result);
        return resultValues.find((item) => [item === null || item === void 0 ? void 0 : item.txnId, item === null || item === void 0 ? void 0 : item.txnid, item === null || item === void 0 ? void 0 : item.transactionId].some((value) => String(value !== null && value !== void 0 ? value : '').trim() === normalizedTransactionId)) || null;
    }
    return null;
};
const mapPayUStatusToInternal = (status, resultHint) => {
    const normalizedStatus = String(status !== null && status !== void 0 ? status : '').trim().toLowerCase();
    if (normalizedStatus === 'success') {
        return 'paid';
    }
    if (normalizedStatus === 'pending') {
        return 'pending';
    }
    if (normalizedStatus === 'cancel' || normalizedStatus === 'cancelled') {
        return 'cancelled';
    }
    if (normalizedStatus.includes('cancel')) {
        return 'cancelled';
    }
    if (resultHint === 'cancel') {
        return 'cancelled';
    }
    return 'failed';
};
exports.mapPayUStatusToInternal = mapPayUStatusToInternal;
const verifyPayUTransaction = (transactionId, resultHint) => __awaiter(void 0, void 0, void 0, function* () {
    const requestBody = {
        txnId: [transactionId],
    };
    const response = yield payuJsonRequest(PAYU_VERIFY_URL, requestBody, {
        'Info-Command': 'verify_payment',
    });
    const transaction = findTransactionResult(response, transactionId);
    if (!transaction) {
        throw new Error('PayU verification did not return a matching transaction.');
    }
    const rawStatus = trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.status);
    const paymentStatus = trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.unmappedStatus) || rawStatus;
    return {
        transactionId,
        status: rawStatus || 'failed',
        internalStatus: (0, exports.mapPayUStatusToInternal)(rawStatus, resultHint),
        paymentId: trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.mihpayId) || trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.mihpayid) || trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.paymentId),
        paymentMethod: trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.mode),
        paymentStatus,
        bankReferenceNumber: trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.bankReferenceNumber) || trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.bank_ref_num),
        amount: Number.isFinite(Number(transaction === null || transaction === void 0 ? void 0 : transaction.amount)) ? Number(transaction.amount) : null,
        currency: trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.originalCurrency) || trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.currency),
        errorMessage: trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.error_Message)
            || trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.errorMessage)
            || trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.error)
            || trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.field9),
        raw: transaction,
    };
});
exports.verifyPayUTransaction = verifyPayUTransaction;
const buildReverseHashString = (payload) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    ensurePayUConfigured();
    const status = String((_a = payload.status) !== null && _a !== void 0 ? _a : '').trim();
    const key = String((_b = payload.key) !== null && _b !== void 0 ? _b : env_1.env.PAYU_ACCOUNT_ID).trim();
    const txnId = String((_d = (_c = payload.txnid) !== null && _c !== void 0 ? _c : payload.txnId) !== null && _d !== void 0 ? _d : '').trim();
    const amount = String((_e = payload.amount) !== null && _e !== void 0 ? _e : '').trim();
    const productInfo = String((_g = (_f = payload.productinfo) !== null && _f !== void 0 ? _f : payload.productInfo) !== null && _g !== void 0 ? _g : '').trim();
    const firstName = String((_j = (_h = payload.firstname) !== null && _h !== void 0 ? _h : payload.firstName) !== null && _j !== void 0 ? _j : '').trim();
    const email = String((_k = payload.email) !== null && _k !== void 0 ? _k : '').trim();
    const udf1 = String((_l = payload.udf1) !== null && _l !== void 0 ? _l : '').trim();
    const udf2 = String((_m = payload.udf2) !== null && _m !== void 0 ? _m : '').trim();
    const udf3 = String((_o = payload.udf3) !== null && _o !== void 0 ? _o : '').trim();
    const udf4 = String((_p = payload.udf4) !== null && _p !== void 0 ? _p : '').trim();
    const udf5 = String((_q = payload.udf5) !== null && _q !== void 0 ? _q : '').trim();
    const additionalCharges = trimToNull(payload.additionalCharges);
    const reverseHashBase = [
        env_1.env.PAYU_SALT,
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
const verifyPayUResponseHash = (payload) => {
    const receivedHash = trimToNull(payload.hash);
    if (!receivedHash) {
        return true;
    }
    const generatedHash = crypto_1.default
        .createHash('sha512')
        .update(buildReverseHashString(payload))
        .digest('hex')
        .toLowerCase();
    return generatedHash === receivedHash.toLowerCase();
};
exports.verifyPayUResponseHash = verifyPayUResponseHash;
const compareExpectedAmount = (amountInSubunits, verifiedAmount) => {
    if (verifiedAmount === null) {
        return true;
    }
    return toMajorAmount(amountInSubunits) === Number(verifiedAmount.toFixed(2));
};
exports.compareExpectedAmount = compareExpectedAmount;
const buildPayUTransactionId = (prefix, attemptId) => {
    const sanitizedPrefix = String(prefix).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 10) || 'payu';
    const sanitizedAttemptId = String(attemptId).replace(/[^a-zA-Z0-9_-]/g, '');
    return `${sanitizedPrefix}_${sanitizedAttemptId}`.slice(0, 50);
};
exports.buildPayUTransactionId = buildPayUTransactionId;
const extractPayUPayloadValue = (payload, ...keys) => {
    for (const key of keys) {
        const value = trimToNull(payload[key]);
        if (value) {
            return value;
        }
    }
    return null;
};
exports.extractPayUPayloadValue = extractPayUPayloadValue;
