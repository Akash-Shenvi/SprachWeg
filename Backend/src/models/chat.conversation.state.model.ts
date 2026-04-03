import mongoose, { Document, Schema } from 'mongoose';

export interface IChatConversationState extends Document {
    studentId: string;
    trainerId: string;
    lastMessageAt: Date;
    lastSenderId: string;
    studentLastReadAt?: Date | null;
    trainerLastReadAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const ChatConversationStateSchema = new Schema<IChatConversationState>(
    {
        studentId: { type: String, ref: 'User', required: true, index: true },
        trainerId: { type: String, ref: 'User', required: true, index: true },
        lastMessageAt: { type: Date, required: true },
        lastSenderId: { type: String, ref: 'User', required: true },
        studentLastReadAt: { type: Date, default: null },
        trainerLastReadAt: { type: Date, default: null },
    },
    {
        timestamps: true,
    }
);

ChatConversationStateSchema.index({ studentId: 1, trainerId: 1 }, { unique: true });
ChatConversationStateSchema.index({ studentId: 1, lastMessageAt: -1 });
ChatConversationStateSchema.index({ trainerId: 1, lastMessageAt: -1 });

const ChatConversationState = mongoose.model<IChatConversationState>(
    'ChatConversationState',
    ChatConversationStateSchema
);

export default ChatConversationState;
