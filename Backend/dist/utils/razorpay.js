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
exports.verifyRazorpayWebhookSignature = exports.verifyRazorpayPaymentSignature = exports.fetchRazorpayPayment = exports.createRazorpayOrder = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const RAZORPAY_API_BASE_URL = 'https://api.razorpay.com/v1';
const ensureRazorpayConfigured = () => {
    if (!env_1.env.RAZORPAY_KEY_ID || !env_1.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay is not configured on the server.');
    }
};
const getRazorpayAuthHeader = () => {
    ensureRazorpayConfigured();
    const credentials = Buffer.from(`${env_1.env.RAZORPAY_KEY_ID}:${env_1.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    return `Basic ${credentials}`;
};
const compareSignatures = (left, right) => {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }
    return crypto_1.default.timingSafeEqual(leftBuffer, rightBuffer);
};
const razorpayRequest = (path, init) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch(`${RAZORPAY_API_BASE_URL}${path}`, Object.assign(Object.assign({}, init), { headers: Object.assign({ Authorization: getRazorpayAuthHeader(), 'Content-Type': 'application/json' }, ((init === null || init === void 0 ? void 0 : init.headers) || {})) }));
    if (!response.ok) {
        const rawError = yield response.text();
        throw new Error(rawError || `Razorpay request failed with status ${response.status}`);
    }
    return response.json();
});
const createRazorpayOrder = (params) => __awaiter(void 0, void 0, void 0, function* () {
    return razorpayRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(params),
    });
});
exports.createRazorpayOrder = createRazorpayOrder;
const fetchRazorpayPayment = (paymentId) => __awaiter(void 0, void 0, void 0, function* () {
    return razorpayRequest(`/payments/${paymentId}`, {
        method: 'GET',
    });
});
exports.fetchRazorpayPayment = fetchRazorpayPayment;
const verifyRazorpayPaymentSignature = (params) => {
    ensureRazorpayConfigured();
    const generatedSignature = crypto_1.default
        .createHmac('sha256', env_1.env.RAZORPAY_KEY_SECRET)
        .update(`${params.orderId}|${params.paymentId}`)
        .digest('hex');
    return compareSignatures(generatedSignature, params.signature);
};
exports.verifyRazorpayPaymentSignature = verifyRazorpayPaymentSignature;
const verifyRazorpayWebhookSignature = (payload, signature) => {
    if (!env_1.env.RAZORPAY_WEBHOOK_SECRET) {
        throw new Error('Razorpay webhook secret is not configured on the server.');
    }
    const generatedSignature = crypto_1.default
        .createHmac('sha256', env_1.env.RAZORPAY_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
    return compareSignatures(generatedSignature, signature);
};
exports.verifyRazorpayWebhookSignature = verifyRazorpayWebhookSignature;
