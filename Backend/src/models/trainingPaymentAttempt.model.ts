import mongoose, { Document, Schema } from 'mongoose';

export type TrainingPaymentAttemptStatus = 'created' | 'paid' | 'failed' | 'cancelled';
export type TrainingType = 'language' | 'skill';

export interface ITrainingPaymentAttempt extends Document {
    userId: mongoose.Types.ObjectId;
    trainingType: TrainingType;
    origin: string;
    courseTitle: string;
    levelName?: string;
    skillCourseId?: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    status: TrainingPaymentAttemptStatus;
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

const TrainingPaymentAttemptSchema = new Schema<ITrainingPaymentAttempt>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    trainingType: {
        type: String,
        enum: ['language', 'skill'],
        required: true,
        trim: true,
        index: true,
    },
    origin: { type: String, required: true, trim: true, lowercase: true, index: true },
    courseTitle: { type: String, required: true, trim: true },
    levelName: { type: String, trim: true },
    skillCourseId: { type: Schema.Types.ObjectId, ref: 'SkillCourse' },
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

TrainingPaymentAttemptSchema.index({ userId: 1, trainingType: 1, origin: 1, status: 1, createdAt: -1 });

export default mongoose.model<ITrainingPaymentAttempt>('TrainingPaymentAttempt', TrainingPaymentAttemptSchema);
