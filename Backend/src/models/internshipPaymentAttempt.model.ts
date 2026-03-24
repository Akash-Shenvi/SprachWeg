import mongoose, { Document, Schema } from 'mongoose';
import type { InternshipMode } from './internshipApplication.model';

export type InternshipPaymentAttemptStatus = 'created' | 'paid' | 'failed' | 'cancelled';

export interface IInternshipPaymentAttempt extends Document {
    userId: mongoose.Types.ObjectId;
    applicationId?: mongoose.Types.ObjectId;
    accountName: string;
    accountEmail: string;
    accountPhoneNumber?: string;
    internshipSlug: string;
    internshipTitle: string;
    internshipPrice: number;
    internshipMode: InternshipMode;
    amount: number;
    currency: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    email: string;
    whatsapp: string;
    college: string;
    registration: string;
    department: string;
    semester: string;
    passingYear: string;
    address: string;
    source: string;
    resumeUrl: string;
    resumeOriginalName: string;
    status: InternshipPaymentAttemptStatus;
    paymentGateway: 'razorpay' | 'payu';
    paymentStatus?: string;
    paymentMethod?: string;
    transactionId?: string;
    paymentId?: string;
    gatewaySignature?: string;
    bankReferenceNumber?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    paymentEmail?: string;
    paymentContact?: string;
    failureReason?: string;
    paymentErrorCode?: string;
    paymentErrorDescription?: string;
    paymentErrorSource?: string;
    paymentErrorStep?: string;
    paymentErrorReason?: string;
    lastWebhookEvent?: string;
    paymentFailureEmailSentAt?: Date;
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const InternshipPaymentAttemptSchema = new Schema<IInternshipPaymentAttempt>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'InternshipApplication' },
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
        enum: ['razorpay', 'payu'],
        default: 'payu',
        required: true,
    },
    paymentStatus: { type: String, trim: true },
    paymentMethod: { type: String, trim: true },
    transactionId: { type: String, trim: true, index: true, sparse: true },
    paymentId: { type: String, trim: true, index: true, sparse: true },
    gatewaySignature: { type: String, trim: true },
    bankReferenceNumber: { type: String, trim: true },
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
    paymentFailureEmailSentAt: { type: Date },
    paidAt: { type: Date },
}, {
    timestamps: true,
});

InternshipPaymentAttemptSchema.index({ userId: 1, internshipSlug: 1, status: 1, createdAt: -1 });

export default mongoose.model<IInternshipPaymentAttempt>('InternshipPaymentAttempt', InternshipPaymentAttemptSchema);
