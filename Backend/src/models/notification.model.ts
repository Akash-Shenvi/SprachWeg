import mongoose, { Document, Schema } from 'mongoose';

export const NOTIFICATION_KINDS = [
    'announcement',
    'material',
    'class',
    'assessment',
    'enrollment_approved',
    'institution_access_approved',
    'chat_message',
] as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];
export type NotificationTrainingType = 'language' | 'skill';

export interface INotification extends Document {
    recipientUserId: mongoose.Types.ObjectId;
    actorUserId?: mongoose.Types.ObjectId | null;
    kind: NotificationKind;
    trainingType?: NotificationTrainingType;
    batchId?: mongoose.Types.ObjectId | null;
    title: string;
    body: string;
    linkPath: string;
    isRead: boolean;
    readAt?: Date | null;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const NOTIFICATION_TTL_SECONDS = 15 * 24 * 60 * 60;

const NotificationSchema = new Schema<INotification>(
    {
        recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        actorUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        kind: {
            type: String,
            enum: [...NOTIFICATION_KINDS],
            required: true,
        },
        trainingType: {
            type: String,
            enum: ['language', 'skill'],
            default: undefined,
        },
        batchId: { type: Schema.Types.ObjectId, default: null },
        title: { type: String, required: true, trim: true },
        body: { type: String, required: true, trim: true },
        linkPath: { type: String, required: true, trim: true },
        isRead: { type: Boolean, default: false, index: true },
        readAt: { type: Date, default: null },
        metadata: { type: Schema.Types.Mixed, default: undefined },
    },
    {
        timestamps: true,
    }
);

NotificationSchema.index({ recipientUserId: 1, createdAt: -1 });
NotificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: NOTIFICATION_TTL_SECONDS });

export default mongoose.model<INotification>('Notification', NotificationSchema);
