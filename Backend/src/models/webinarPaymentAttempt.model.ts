import mongoose, { Document, Schema } from 'mongoose';

export type WebinarPaymentAttemptStatus = 'created' | 'paid' | 'failed' | 'cancelled';

export interface IWebinarPaymentAttempt extends Document {
    userId: mongoose.Types.ObjectId;
    webinarId: mongoose.Types.ObjectId;
    webinarTitle: string;
    scheduledAt: Date;
    amount: number;
    currency: string;
    status: WebinarPaymentAttemptStatus;
    paymentGateway: 'razorpay';
    paymentStatus?: string;
    paymentMethod?: string;
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
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const WebinarPaymentAttemptSchema = new Schema<IWebinarPaymentAttempt>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    webinarId: { type: Schema.Types.ObjectId, ref: 'Webinar', required: true, index: true },
    webinarTitle: { type: String, required: true, trim: true },
    scheduledAt: { type: Date, required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, trim: true, uppercase: true, default: 'INR' },
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
    paidAt: { type: Date },
}, {
    timestamps: true,
});

WebinarPaymentAttemptSchema.index({ userId: 1, webinarId: 1, status: 1, createdAt: -1 });

export default mongoose.model<IWebinarPaymentAttempt>('WebinarPaymentAttempt', WebinarPaymentAttemptSchema);
