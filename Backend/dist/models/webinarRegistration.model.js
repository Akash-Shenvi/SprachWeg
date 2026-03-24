"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const generateReferenceCode = () => `WEB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
const WebinarRegistrationSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    webinarId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Webinar', required: true, index: true },
    paymentAttemptId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'WebinarPaymentAttempt' },
    webinarTitle: { type: String, required: true, trim: true },
    scheduledAt: { type: Date, required: true },
    price: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, trim: true, uppercase: true, default: 'INR' },
    paymentGateway: { type: String, enum: ['razorpay', 'payu'], trim: true },
    paymentStatus: { type: String, trim: true },
    paymentAmount: { type: Number, min: 1 },
    paymentCurrency: { type: String, trim: true, uppercase: true },
    paymentMethod: { type: String, trim: true },
    transactionId: { type: String, trim: true, sparse: true },
    paymentId: { type: String, trim: true, sparse: true },
    bankReferenceNumber: { type: String, trim: true },
    razorpayOrderId: { type: String, trim: true, sparse: true },
    razorpayPaymentId: { type: String, trim: true, sparse: true },
    paidAt: { type: Date },
    status: {
        type: String,
        enum: ['submitted', 'accepted', 'rejected'],
        default: 'submitted',
        index: true,
    },
    referenceCode: {
        type: String,
        required: true,
        unique: true,
        default: generateReferenceCode,
    },
}, {
    timestamps: true,
});
WebinarRegistrationSchema.index({ userId: 1, webinarId: 1 }, { unique: true });
WebinarRegistrationSchema.index({ status: 1, createdAt: -1 });
exports.default = mongoose_1.default.model('WebinarRegistration', WebinarRegistrationSchema);
