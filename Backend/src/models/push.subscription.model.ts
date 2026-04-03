import mongoose, { Document, Schema } from 'mongoose';

export interface IPushSubscription extends Document {
    userId: mongoose.Types.ObjectId;
    endpoint: string;
    p256dhKey: string;
    authKey: string;
    userAgent?: string | null;
    lastSeenAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        endpoint: { type: String, required: true, unique: true, trim: true },
        p256dhKey: { type: String, required: true, trim: true },
        authKey: { type: String, required: true, trim: true },
        userAgent: { type: String, default: null, trim: true },
        lastSeenAt: { type: Date, required: true },
    },
    {
        timestamps: true,
    }
);

PushSubscriptionSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);
