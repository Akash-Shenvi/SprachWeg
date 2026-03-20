import mongoose, { Schema, Document } from 'mongoose';

export interface ILanguageCourse extends Document {
    title: string;
    subtitle: string;
    description: string;
    image: string; // URL path to the image
    popular: boolean;
    startingPrice?: number;
    levels: {
        name: string;
        duration: string;
        price: string;
        features: string[];
        outcome: string;
        examPrep?: {
            title: string;
            details: string;
            price: string;
        };
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const LanguageCourseSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        subtitle: { type: String, required: false },
        description: { type: String, required: true },
        image: { type: String, required: false },
        popular: { type: Boolean, default: false },
        startingPrice: { type: Number, min: 0 },
        levels: [{
            name: { type: String, required: true },
            duration: { type: String, required: true },
            price: { type: String, required: true },
            features: { type: [String], default: [] },
            outcome: { type: String, required: true },
            examPrep: {
                title: String,
                details: String,
                price: String
            }
        }],
    },
    { timestamps: true }
);

export default mongoose.model<ILanguageCourse>('LanguageCourse', LanguageCourseSchema);
