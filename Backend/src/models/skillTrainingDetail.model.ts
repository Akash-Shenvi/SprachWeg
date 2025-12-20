import mongoose, { Schema, Document } from 'mongoose';

export interface ISkillTrainingDetail extends Document {
    skillCourseId: mongoose.Types.ObjectId;
    deliveryMode: string;
    classTimings: string;
    fees: string;
}

const SkillTrainingDetailSchema: Schema = new Schema(
    {
        skillCourseId: { type: Schema.Types.ObjectId, ref: 'SkillCourse', required: true, unique: true },
        deliveryMode: { type: String, default: 'On-site / Online / Hybrid' },
        classTimings: { type: String, default: 'Customized Schedule' },
        fees: { type: String, default: '₹28,000' },
    },
    { timestamps: true }
);

export default mongoose.model<ISkillTrainingDetail>('SkillTrainingDetail', SkillTrainingDetailSchema);
