import mongoose, { Document, Schema } from 'mongoose';

export type WebinarCalendarSyncStatus = 'draft' | 'needs_trainer_connection' | 'scheduled' | 'sync_error';

export interface IWebinar extends Document {
    title: string;
    slug: string;
    shortDescription: string;
    description: string;
    scheduledAt: Date;
    price: number;
    currency: string;
    trainerId?: mongoose.Types.ObjectId;
    joinLink?: string;
    googleCalendarEventId?: string;
    calendarSyncStatus: WebinarCalendarSyncStatus;
    calendarSyncError?: string;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

const WebinarSchema = new Schema<IWebinar>({
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    shortDescription: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    scheduledAt: { type: Date, required: true },
    price: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'INR', trim: true, uppercase: true },
    trainerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    joinLink: { type: String, trim: true },
    googleCalendarEventId: { type: String, trim: true },
    calendarSyncStatus: {
        type: String,
        enum: ['draft', 'needs_trainer_connection', 'scheduled', 'sync_error'],
        default: 'draft',
    },
    calendarSyncError: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
}, {
    timestamps: true,
});

WebinarSchema.index({ isActive: 1, sortOrder: 1, createdAt: 1 });
WebinarSchema.index({ trainerId: 1, scheduledAt: 1 });

export default mongoose.model<IWebinar>('Webinar', WebinarSchema);
