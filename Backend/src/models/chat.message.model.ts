import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
    studentId: mongoose.Types.ObjectId;
    trainerId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
    {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        senderId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        content:   { type: String, required: true, trim: true, maxlength: 2000 },
        createdAt: { type: Date, default: Date.now }
    },
    { timestamps: false }
);

// TTL index: MongoDB will automatically delete messages after 7 days
ChatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// Compound index for efficient room-based queries
ChatMessageSchema.index({ studentId: 1, trainerId: 1, createdAt: -1 });

const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
export default ChatMessage;
