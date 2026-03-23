import mongoose, { Document, Schema } from 'mongoose';
import type { AssessmentQuestionType, AssessmentTrainingType } from './assessment.model';

export type AssessmentAttemptStatus = 'passed' | 'failed';

export interface IAssessmentAttemptAnswer extends mongoose.Types.Subdocument {
    questionId: mongoose.Types.ObjectId;
    questionType: AssessmentQuestionType;
    selectedOptionIndex?: number;
    booleanAnswer?: boolean;
    textAnswer?: string;
    isCorrect: boolean;
}

export interface IAssessmentAttempt extends Document {
    assessmentId: mongoose.Types.ObjectId;
    trainingType: AssessmentTrainingType;
    batchId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    attemptNumber: number;
    answers: mongoose.Types.DocumentArray<IAssessmentAttemptAnswer>;
    correctCount: number;
    totalQuestions: number;
    scorePercentage: number;
    status: AssessmentAttemptStatus;
    createdAt: Date;
    updatedAt: Date;
}

const AssessmentAttemptAnswerSchema = new Schema<IAssessmentAttemptAnswer>(
    {
        questionId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        questionType: {
            type: String,
            enum: ['mcq', 'true_false', 'fill_blank'],
            required: true,
        },
        selectedOptionIndex: {
            type: Number,
        },
        booleanAnswer: {
            type: Boolean,
        },
        textAnswer: {
            type: String,
            trim: true,
        },
        isCorrect: {
            type: Boolean,
            required: true,
        },
    },
    { _id: false }
);

const AssessmentAttemptSchema = new Schema<IAssessmentAttempt>(
    {
        assessmentId: {
            type: Schema.Types.ObjectId,
            ref: 'Assessment',
            required: true,
            index: true,
        },
        trainingType: {
            type: String,
            enum: ['language', 'skill'],
            required: true,
        },
        batchId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        attemptNumber: {
            type: Number,
            required: true,
            min: 1,
        },
        answers: {
            type: [AssessmentAttemptAnswerSchema],
            default: [],
        },
        correctCount: {
            type: Number,
            required: true,
            min: 0,
        },
        totalQuestions: {
            type: Number,
            required: true,
            min: 1,
        },
        scorePercentage: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        status: {
            type: String,
            enum: ['passed', 'failed'],
            required: true,
        },
    },
    { timestamps: true }
);

AssessmentAttemptSchema.index({ assessmentId: 1, studentId: 1, attemptNumber: 1 }, { unique: true });
AssessmentAttemptSchema.index({ assessmentId: 1, status: 1, studentId: 1 });

export default mongoose.model<IAssessmentAttempt>('AssessmentAttempt', AssessmentAttemptSchema);
