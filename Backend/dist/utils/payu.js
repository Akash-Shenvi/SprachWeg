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
exports.extractPayUPayloadValue = exports.buildPayUTransactionId = exports.compareExpectedAmount = exports.verifyPayUResponseHash = exports.verifyPayUTransaction = exports.mapPayUStatusToInternal = exports.buildPayUHostedCheckoutForm = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const payuEnv = String(env_1.env.PAYU_ENV || 'test').trim().toLowerCase();
const isProductionEnv = payuEnv === 'production' || payuEnv === 'prod' || payuEnv === 'live';
const PAYU_PAYMENT_PAGE_URL = isProductionEnv
    ? 'https://secure.payu.in/_payment'
    : 'https://test.payu.in/_payment';
const PAYU_VERIFY_URL = isProductionEnv
    ? 'https://info.payu.in/merchant/postservice.php?form=2'
    : 'https://test.payu.in/merchant/postservice.php?form=2';
const trimToNull = (value) => {
    const normalizedValue = String(value !== null && value !== void 0 ? value : '').trim();
    return normalizedValue || null;
};
const getPayloadValue = (payload, ...keys) => {
    for (const key of keys) {
        const value = trimToNull(payload[key]);
        if (value) {
            return value;
        }
    }
    return null;
};
const ensurePayUConfigured = () => {
    if (!env_1.env.PAYU_ACCOUNT_ID || !env_1.env.PAYU_SALT) {
        throw new Error('PayU is not configured on the server.');
    }
};
const toMajorAmountString = (amountInSubunits) => (amountInSubunits / 100).toFixed(2);
const sha512 = (value) => crypto_1.default.createHash('sha512').update(value).digest('hex').toLowerCase();
const buildPaymentRequestHash = (params) => sha512([
    env_1.env.PAYU_ACCOUNT_ID,
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
    env_1.env.PAYU_SALT,
].join('|'));
const buildGeneralApiHash = (command, var1) => sha512([
    env_1.env.PAYU_ACCOUNT_ID,
    command,
    var1,
    env_1.env.PAYU_SALT,
].join('|'));
const parseJsonResponse = (rawResponse) => {
    try {
        return JSON.parse(rawResponse);
    }
    catch (_a) {
        throw new Error(rawResponse || 'PayU returned an invalid response.');
    }
};
const payuFormRequest = (body) => __awaiter(void 0, void 0, void 0, function* () {
    ensurePayUConfigured();
    const response = yield fetch(PAYU_VERIFY_URL, {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(body).toString(),
    });
    const rawResponse = yield response.text();
    if (!response.ok) {
        throw new Error(rawResponse || `PayU request failed with status ${response.status}`);
    }
    return parseJsonResponse(rawResponse);
});
const buildPayUHostedCheckoutForm = (params) => {
    var _a, _b, _c;
    ensurePayUConfigured();
    const fields = {
        key: env_1.env.PAYU_ACCOUNT_ID,
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
        udf3: String(((_a = params.userDefinedFields) === null || _a === void 0 ? void 0 : _a.udf3) || '').trim(),
        udf4: String(((_b = params.userDefinedFields) === null || _b === void 0 ? void 0 : _b.udf4) || '').trim(),
        udf5: String(((_c = params.userDefinedFields) === null || _c === void 0 ? void 0 : _c.udf5) || '').trim(),
    };
    fields.hash = buildPaymentRequestHash(fields);
    return {
        actionUrl: PAYU_PAYMENT_PAGE_URL,
        fields,
        status: 'created',
        raw: fields,
    };
};
exports.buildPayUHostedCheckoutForm = buildPayUHostedCheckoutForm;
const findTransactionResult = (payload, transactionId) => {
    const normalizedTransactionId = String(transactionId).trim();
    const transactionDetails = payload === null || payload === void 0 ? void 0 : payload.transaction_details;
    if (transactionDetails && typeof transactionDetails === 'object') {
        if (transactionDetails[normalizedTransactionId]) {
            return transactionDetails[normalizedTransactionId];
        }
        return Object.values(transactionDetails).find((item) => { var _a; return String((_a = item === null || item === void 0 ? void 0 : item.txnid) !== null && _a !== void 0 ? _a : '').trim() === normalizedTransactionId; }) || null;
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
    const response = yield payuFormRequest({
        key: env_1.env.PAYU_ACCOUNT_ID,
        command: 'verify_payment',
        var1: transactionId,
        hash: buildGeneralApiHash('verify_payment', transactionId),
    });
    const transaction = findTransactionResult(response, transactionId);
    if (!transaction) {
        throw new Error('PayU verification did not return a matching transaction.');
    }
    const rawStatus = trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.status);
    const paymentStatus = trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.unmappedstatus) || rawStatus;
    return {
        transactionId,
        status: rawStatus || 'failed',
        internalStatus: (0, exports.mapPayUStatusToInternal)(rawStatus, resultHint),
        paymentId: trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.mihpayid) || trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.mihpayId),
        paymentMethod: trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.mode),
        paymentStatus,
        bankReferenceNumber: trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.bank_ref_num) || trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.bankReferenceNumber),
        amount: Number.isFinite(Number(transaction === null || transaction === void 0 ? void 0 : transaction.amt))
            ? Number(transaction.amt)
            : Number.isFinite(Number(transaction === null || transaction === void 0 ? void 0 : transaction.amount))
                ? Number(transaction.amount)
                : Number.isFinite(Number(transaction === null || transaction === void 0 ? void 0 : transaction.transaction_amount))
                    ? Number(transaction.transaction_amount)
                    : null,
        currency: trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.currency),
        errorMessage: trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.error_Message)
            || trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.error)
            || trimToNull(transaction === null || transaction === void 0 ? void 0 : transaction.field9)
            || trimToNull(response === null || response === void 0 ? void 0 : response.msg),
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
    const additionalCharges = getPayloadValue(payload, 'additional_charges', 'additionalCharges');
    const splitInfo = getPayloadValue(payload, 'splitInfo');
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
const verifyPayUResponseHash = (payload) => {
    const receivedHash = trimToNull(payload.hash);
    if (!receivedHash) {
        return true;
    }
    const generatedHash = sha512(buildReverseHashString(payload));
    return generatedHash === receivedHash.toLowerCase();
};
exports.verifyPayUResponseHash = verifyPayUResponseHash;
const compareExpectedAmount = (amountInSubunits, verifiedAmount) => {
    if (verifiedAmount === null) {
        return true;
    }
    return Number(toMajorAmountString(amountInSubunits)) === Number(verifiedAmount.toFixed(2));
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
