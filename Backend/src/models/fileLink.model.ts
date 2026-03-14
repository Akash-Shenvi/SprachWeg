import mongoose, { Schema, Document } from 'mongoose';

export interface IFileLink extends Document {
  title: string;
  fileUrl: string;
  originalName: string;
  mimeType: string;
  size: number;
}

const FileLinkSchema: Schema = new Schema({
  title: { type: String, required: true },
  fileUrl: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String },
  size: { type: Number },
}, { timestamps: true });

export default mongoose.model<IFileLink>('FileLink', FileLinkSchema);
