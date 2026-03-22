import mongoose, { Schema, Document } from 'mongoose';

export interface IClassSession extends Document {
    batchId: mongoose.Types.ObjectId;
    trainerId: mongoose.Types.ObjectId;
    topic: string;
    startTime: Date;
    endTime: Date;
    meetingLink?: string; // For online classes
    eventId?: string;
    status: 'scheduled' | 'live' | 'completed' | 'cancelled';
    recordings?: string[]; // URLs
    resources?: string[]; // URLs to materials
    createdAt: Date;
    updatedAt: Date;
}

const ClassSessionSchema: Schema = new Schema(
    {
        batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
        trainerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        topic: { type: String, required: true },
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        meetingLink: { type: String },
        eventId: { type: String },
        status: {
            type: String,
            enum: ['scheduled', 'live', 'completed', 'cancelled'],
            default: 'scheduled',
        },
        recordings: [{ type: String }],
        resources: [{ type: String }],
    },
    { timestamps: true }
);

export default mongoose.model<IClassSession>('ClassSession', ClassSessionSchema);
