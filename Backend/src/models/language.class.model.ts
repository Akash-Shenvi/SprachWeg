import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendee {
    studentId: mongoose.Types.ObjectId;
    joinedAt: Date;
}

export interface ILanguageClass extends Document {
    batchId: mongoose.Types.ObjectId;
    trainerId: mongoose.Types.ObjectId;
    topic: string;
    startTime: Date;
    meetLink: string;
    eventId?: string;
    attendees: IAttendee[];
    status: 'scheduled' | 'completed' | 'cancelled';
    createdAt: Date;
}

const LanguageClassSchema: Schema = new Schema(
    {
        batchId: { type: Schema.Types.ObjectId, ref: 'LanguageBatch', required: true },
        trainerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        topic: { type: String, required: true },
        startTime: { type: Date, required: true },
        meetLink: { type: String, required: true },
        eventId: { type: String },
        attendees: [
            {
                studentId: { type: Schema.Types.ObjectId, ref: 'User' },
                joinedAt: { type: Date, default: Date.now }
            }
        ],
        status: {
            type: String,
            enum: ['scheduled', 'completed', 'cancelled'],
            default: 'scheduled'
        }
    },
    { timestamps: true }
);

export default mongoose.model<ILanguageClass>('LanguageClass', LanguageClassSchema);
