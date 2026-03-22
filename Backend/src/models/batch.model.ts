import mongoose, { Schema, Document } from 'mongoose';

export interface IBatch extends Document {
    name: string;
    courseId: mongoose.Types.ObjectId;
    trainerId?: mongoose.Types.ObjectId;
    schedule: {
        days: string[]; // e.g., ["Mon", "Wed", "Fri"]
        startTime: string; // e.g., "10:00"
        endTime: string; // e.g., "11:30"
    };
    startDate: Date;
    endDate: Date;
    students: mongoose.Types.ObjectId[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BatchSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        courseId: { type: Schema.Types.ObjectId, ref: 'SkillCourse', required: true },
        trainerId: { type: Schema.Types.ObjectId, ref: 'User' },
        schedule: {
            days: [{ type: String }],
            startTime: { type: String },
            endTime: { type: String },
        },
        startDate: { type: Date },
        endDate: { type: Date },
        students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

BatchSchema.virtual('announcements', {
    ref: 'Announcement',
    localField: '_id',
    foreignField: 'batchId',
});

BatchSchema.virtual('materials', {
    ref: 'SkillMaterial',
    localField: '_id',
    foreignField: 'batchId',
});

BatchSchema.virtual('classes', {
    ref: 'ClassSession',
    localField: '_id',
    foreignField: 'batchId',
});

export default mongoose.model<IBatch>('Batch', BatchSchema);
