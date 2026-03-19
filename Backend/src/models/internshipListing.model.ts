import mongoose, { Document, Schema } from 'mongoose';

export interface IInternshipListing extends Document {
    title: string;
    slug: string;
    shortDescription: string;
    description: string;
    responsibilities: string[];
    benefits: string[];
    duration: string;
    location: string;
    price: number;
    currency: string;
    tags: string[];
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

const InternshipListingSchema = new Schema<IInternshipListing>({
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    shortDescription: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    responsibilities: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    duration: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', trim: true, uppercase: true },
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
}, {
    timestamps: true,
});

InternshipListingSchema.index({ isActive: 1, sortOrder: 1, createdAt: 1 });

export default mongoose.model<IInternshipListing>('InternshipListing', InternshipListingSchema);
