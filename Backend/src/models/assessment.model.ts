import mongoose, { Document, Schema } from 'mongoose';

export type AssessmentTrainingType = 'language' | 'skill';
export type AssessmentQuestionType = 'mcq' | 'true_false' | 'fill_blank';

export interface IAssessmentQuestion extends mongoose.Types.Subdocument {
    type: AssessmentQuestionType;
    prompt: string;
    options: string[];
    correctOptionIndex?: number;
    correctBoolean?: boolean;
    blankAnswer?: string;
}

export interface IAssessment extends Document {
    trainingType: AssessmentTrainingType;
    batchId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    passPercentage: number;
    createdBy: mongoose.Types.ObjectId;
    publishedAt: Date;
    questions: mongoose.Types.DocumentArray<IAssessmentQuestion>;
    createdAt: Date;
    updatedAt: Date;
}

const AssessmentQuestionSchema = new Schema<IAssessmentQuestion>(
    {
        type: {
            type: String,
            enum: ['mcq', 'true_false', 'fill_blank'],
            required: true,
        },
        prompt: {
            type: String,
            required: true,
            trim: true,
        },
        options: {
            type: [String],
            default: [],
        },
        correctOptionIndex: {
            type: Number,
        },
        correctBoolean: {
            type: Boolean,
        },
        blankAnswer: {
            type: String,
            trim: true,
        },
    },
    { _id: true }
);

const AssessmentSchema = new Schema<IAssessment>(
    {
        trainingType: {
            type: String,
            enum: ['language', 'skill'],
            required: true,
        },
        batchId: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        passPercentage: {
            type: Number,
            default: 40,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        publishedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
        questions: {
            type: [AssessmentQuestionSchema],
            required: true,
            default: [],
        },
    },
    { timestamps: true }
);

AssessmentSchema.index({ trainingType: 1, batchId: 1, createdAt: -1 });

export default mongoose.model<IAssessment>('Assessment', AssessmentSchema);
