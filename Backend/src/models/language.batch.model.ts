import mongoose, { Schema, Document } from "mongoose";

export interface IBatch extends Document {
  courseTitle: string;   // English
  name: string;          // e.g. A1, N5 (was levelName)
  trainerId?: mongoose.Types.ObjectId | null;
  institutionId?: mongoose.Types.ObjectId | null;
  institutionName?: string | null;
  students: mongoose.Types.ObjectId[];
}

const BatchSchema = new Schema(
  {
    courseTitle: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
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

    trainerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

BatchSchema.index(
  { courseTitle: 1, name: 1, institutionId: 1 },
  { unique: true }
);

// Virtual for announcements
BatchSchema.virtual('announcements', {
  ref: 'LanguageAnnouncement',
  localField: '_id',
  foreignField: 'batchId'
});

// Virtual for materials
BatchSchema.virtual('materials', {
  ref: 'LanguageMaterial',
  localField: '_id',
  foreignField: 'batchId'
});

// Virtual for classes
BatchSchema.virtual('classes', {
  ref: 'LanguageClass',
  localField: '_id',
  foreignField: 'batchId'
});

export default mongoose.model<IBatch>("LanguageBatch", BatchSchema);
