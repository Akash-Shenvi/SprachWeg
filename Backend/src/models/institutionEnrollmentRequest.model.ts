import mongoose, { Document, Schema } from 'mongoose';

export interface IInstitutionEnrollmentStudent {
    name: string;
    email: string;
    passwordHash: string;
    createdUserId?: mongoose.Types.ObjectId | null;
}

export interface IInstitutionEnrollmentRequest extends Document {
    institutionId: mongoose.Types.ObjectId;
    language: 'German';
    courseTitle: string;
    levelName: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    students: IInstitutionEnrollmentStudent[];
    adminDecisionBy?: mongoose.Types.ObjectId | null;
    adminDecisionAt?: Date | null;
    rejectionReason?: string | null;
    approvedBatchId?: mongoose.Types.ObjectId | null;
}

const InstitutionEnrollmentStudentSchema = new Schema<IInstitutionEnrollmentStudent>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        passwordHash: { type: String, required: true },
        createdUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { _id: false }
);

const InstitutionEnrollmentRequestSchema = new Schema<IInstitutionEnrollmentRequest>(
    {
        institutionId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        language: {
            type: String,
            enum: ['German'],
            default: 'German',
            required: true,
        },
        courseTitle: { type: String, required: true, trim: true },
        levelName: { type: String, required: true, trim: true },
        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            default: 'PENDING',
            index: true,
        },
        students: {
            type: [InstitutionEnrollmentStudentSchema],
            default: [],
            validate: {
                validator: (value: IInstitutionEnrollmentStudent[]) => Array.isArray(value) && value.length > 0,
                message: 'At least one student is required.',
            },
        },
        adminDecisionBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        adminDecisionAt: { type: Date, default: null },
        rejectionReason: { type: String, default: null },
        approvedBatchId: { type: Schema.Types.ObjectId, ref: 'LanguageBatch', default: null },
    },
    {
        timestamps: true,
    }
);

InstitutionEnrollmentRequestSchema.index({ institutionId: 1, createdAt: -1 });

export default mongoose.model<IInstitutionEnrollmentRequest>(
    'InstitutionEnrollmentRequest',
    InstitutionEnrollmentRequestSchema
);
