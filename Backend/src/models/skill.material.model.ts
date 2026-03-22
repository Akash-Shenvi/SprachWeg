import mongoose, { Schema, Document } from 'mongoose';

export interface ISkillMaterial extends Document {
    batchId: mongoose.Types.ObjectId;
    title: string;
    subtitle?: string;
    description?: string;
    fileUrl?: string;
    uploadedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const SkillMaterialSchema: Schema = new Schema(
    {
        batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
        title: { type: String, required: true },
        subtitle: { type: String },
        description: { type: String },
        fileUrl: { type: String },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

export default mongoose.model<ISkillMaterial>('SkillMaterial', SkillMaterialSchema);
