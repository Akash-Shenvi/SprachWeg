import mongoose, { Schema, Document } from "mongoose";

export interface IEnrollment extends Document {
  userId: mongoose.Types.ObjectId;
  courseTitle: string;   // "English"
  name: string;          // "A1" (was levelName)
  status: "PENDING" | "APPROVED" | "REJECTED";
  batchId?: mongoose.Types.ObjectId | null;
  institutionId?: mongoose.Types.ObjectId | null;
  institutionName?: string | null;
}

const EnrollmentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    courseTitle: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    institutionId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    institutionName: {
      type: String,
      default: null,
      trim: true,
    },

    batchId: {
      type: Schema.Types.ObjectId,
      ref: "LanguageBatch",
      default: null,
    },
  },
  { timestamps: true }
);

EnrollmentSchema.index(
  { userId: 1, courseTitle: 1, name: 1 },
  { unique: true }
);

export default mongoose.model<IEnrollment>("LanguageEnrollment", EnrollmentSchema);
