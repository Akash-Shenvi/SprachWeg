import mongoose, { Document, Schema } from 'mongoose';

export type InternshipMode = 'remote' | 'online' | 'hybrid' | 'onsite';

export interface IInternshipApplication extends Document {
    userId: mongoose.Types.ObjectId;
    paymentAttemptId?: mongoose.Types.ObjectId;
    accountName: string;
    accountEmail: string;
    accountPhoneNumber?: string;
    internshipSlug?: string;
    internshipTitle: string;
    internshipPrice?: number;
    internshipMode?: InternshipMode;
    paymentGateway?: 'razorpay' | 'free';
    paymentStatus?: string;
    paymentAmount?: number;
    paymentCurrency?: string;
    paymentMethod?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    paidAt?: Date;
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
    status: 'submitted' | 'accepted' | 'rejected' | 'reviewed' | 'shortlisted';
    referenceCode: string;
    createdAt: Date;
    updatedAt: Date;
}

const generateReferenceCode = () =>
    `SOV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const InternshipApplicationSchema = new Schema<IInternshipApplication>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    paymentAttemptId: { type: Schema.Types.ObjectId, ref: 'InternshipPaymentAttempt' },
    accountName: { type: String, required: true, trim: true },
    accountEmail: { type: String, required: true, trim: true, lowercase: true },
    accountPhoneNumber: { type: String, trim: true },
    internshipSlug: { type: String, trim: true, lowercase: true },
    internshipTitle: { type: String, required: true, trim: true },
    internshipPrice: { type: Number, min: 0 },
    internshipMode: { type: String, enum: ['remote', 'online', 'hybrid', 'onsite'], trim: true },
    paymentGateway: { type: String, enum: ['razorpay', 'free'], trim: true },
    paymentStatus: { type: String, trim: true },
    paymentAmount: { type: Number, min: 0 },
    paymentCurrency: { type: String, trim: true, uppercase: true },
    paymentMethod: { type: String, trim: true },
    razorpayOrderId: { type: String, trim: true, sparse: true },
    razorpayPaymentId: { type: String, trim: true, sparse: true },
    paidAt: { type: Date },
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
        enum: ['submitted', 'accepted', 'rejected', 'reviewed', 'shortlisted'],
        default: 'submitted',
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

InternshipApplicationSchema.index({ userId: 1, internshipTitle: 1 }, { unique: true });
InternshipApplicationSchema.index(
    { userId: 1, internshipSlug: 1 },
    {
        unique: true,
        partialFilterExpression: {
            internshipSlug: { $exists: true, $type: 'string' },
        },
    }
);

export default mongoose.model<IInternshipApplication>('InternshipApplication', InternshipApplicationSchema);
