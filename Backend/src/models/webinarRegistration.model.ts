import mongoose, { Document, Schema } from 'mongoose';

export type WebinarRegistrationStatus = 'submitted' | 'accepted' | 'rejected';

export interface IWebinarRegistration extends Document {
    userId: mongoose.Types.ObjectId;
    webinarId: mongoose.Types.ObjectId;
    paymentAttemptId?: mongoose.Types.ObjectId;
    webinarTitle: string;
    scheduledAt: Date;
    price: number;
    currency: string;
    paymentGateway?: 'razorpay' | 'payu';
    paymentStatus?: string;
    paymentAmount?: number;
    paymentCurrency?: string;
    paymentMethod?: string;
    transactionId?: string;
    paymentId?: string;
    bankReferenceNumber?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    paidAt?: Date;
    status: WebinarRegistrationStatus;
    referenceCode: string;
    createdAt: Date;
    updatedAt: Date;
}

const generateReferenceCode = () =>
    `WEB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const WebinarRegistrationSchema = new Schema<IWebinarRegistration>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    webinarId: { type: Schema.Types.ObjectId, ref: 'Webinar', required: true, index: true },
    paymentAttemptId: { type: Schema.Types.ObjectId, ref: 'WebinarPaymentAttempt' },
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

export default mongoose.model<IWebinarRegistration>('WebinarRegistration', WebinarRegistrationSchema);
