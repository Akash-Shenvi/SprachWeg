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
const InternshipPaymentAttemptSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    applicationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'InternshipApplication' },
    accountName: { type: String, required: true, trim: true },
    accountEmail: { type: String, required: true, trim: true, lowercase: true },
    accountPhoneNumber: { type: String, trim: true },
    internshipSlug: { type: String, required: true, trim: true, lowercase: true, index: true },
    internshipTitle: { type: String, required: true, trim: true },
    internshipPrice: { type: Number, required: true, min: 0 },
    internshipMode: { type: String, enum: ['remote', 'online', 'hybrid', 'onsite'], required: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, trim: true, uppercase: true, default: 'INR' },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    whatsapp: { type: String, required: true, trim: true },
    college: { type: String, required: true, trim: true },
    registration: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    semester: { type: String, required: true, trim: true },
    passingYear: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    source: { type: String, required: true, trim: true },
    resumeUrl: { type: String, required: true, trim: true },
    resumeOriginalName: { type: String, required: true, trim: true },
    status: {
        type: String,
        enum: ['created', 'paid', 'failed', 'cancelled'],
        default: 'created',
        index: true,
    },
    paymentGateway: {
        type: String,
        enum: ['razorpay'],
        default: 'razorpay',
        required: true,
    },
    paymentStatus: { type: String, trim: true },
    paymentMethod: { type: String, trim: true },
    razorpayOrderId: { type: String, trim: true, index: true, sparse: true },
    razorpayPaymentId: { type: String, trim: true, index: true, sparse: true },
    razorpaySignature: { type: String, trim: true },
    paymentEmail: { type: String, trim: true, lowercase: true },
    paymentContact: { type: String, trim: true },
    failureReason: { type: String, trim: true },
    paymentErrorCode: { type: String, trim: true },
    paymentErrorDescription: { type: String, trim: true },
    paymentErrorSource: { type: String, trim: true },
    paymentErrorStep: { type: String, trim: true },
    paymentErrorReason: { type: String, trim: true },
    lastWebhookEvent: { type: String, trim: true },
    paidAt: { type: Date },
}, {
    timestamps: true,
});
InternshipPaymentAttemptSchema.index({ userId: 1, internshipSlug: 1, status: 1, createdAt: -1 });
exports.default = mongoose_1.default.model('InternshipPaymentAttempt', InternshipPaymentAttemptSchema);
