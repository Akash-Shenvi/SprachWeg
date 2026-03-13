import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
  name: string;
  email: string;
  problem: string;
  imageUrl?: string;
  createdAt: Date;
}

const feedbackSchema = new Schema<IFeedback>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  problem: { type: String, required: true },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Feedback = mongoose.model<IFeedback>('Feedback', feedbackSchema);
