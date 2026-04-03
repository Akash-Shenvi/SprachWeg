"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '/home/sovirtraining/.env' });
exports.env = {
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/sprachweg',
    NODE_ENV: process.env.NODE_ENV || 'development',
    JWT_SECRET: process.env.JWT_SECRET || 'secret123',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
    EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
    EMAIL_PORT: Number(process.env.EMAIL_PORT) || 587,
    EMAIL_USER: process.env.EMAIL_USER || '',
    EMAIL_PASS: process.env.EMAIL_PASS || '',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE',
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    // PayU expects the merchant "key" in payment requests and hash generation.
    // Keep PAYU_ACCOUNT_ID for backward compatibility, but also accept the common names.
    PAYU_ACCOUNT_ID: process.env.PAYU_ACCOUNT_ID || process.env.PAYU_KEY || process.env.PAYU_MERCHANT_KEY || '',
    PAYU_SALT: process.env.PAYU_SALT || process.env.PAYU_MERCHANT_SALT || '',
    PAYU_ENV: process.env.PAYU_ENV || 'test',
    BACKEND_PUBLIC_BASE_URL: process.env.BACKEND_PUBLIC_BASE_URL || '',
    FRONTEND_BASE_URL: process.env.FRONTEND_BASE_URL || 'http://localhost:5173',
    WEB_PUSH_PUBLIC_KEY: process.env.WEB_PUSH_PUBLIC_KEY || '',
    WEB_PUSH_PRIVATE_KEY: process.env.WEB_PUSH_PRIVATE_KEY || '',
    WEB_PUSH_SUBJECT: process.env.WEB_PUSH_SUBJECT || '',
};
