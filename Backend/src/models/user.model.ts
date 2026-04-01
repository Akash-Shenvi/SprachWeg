import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    googleId?: string;
    avatar?: string;
    phoneNumber?: string;
    germanLevel?: string;
    guardianName?: string;
    guardianPhone?: string;
    qualification?: string;
    dateOfBirth?: Date;
    role: string;
    institutionId?: mongoose.Types.ObjectId;
    institutionName?: string;
    institutionLogo?: string;
    institutionTagline?: string;
    contactPersonName?: string;
    city?: string;
    state?: string;
    address?: string;
    isVerified: boolean;
    otp?: string;
    otpExpires?: Date;
    lastOtpSent?: Date;
    googleRefreshToken?: string;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for Google Auth users
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String },
    phoneNumber: { type: String },
    germanLevel: { type: String },
    guardianName: { type: String },
    guardianPhone: { type: String },
    qualification: { type: String },
    dateOfBirth: { type: Date },
    role: {
        type: String,
        enum: ['student', 'institution_student', 'trainer', 'admin', 'institution'],
        default: 'student'
    },
    institutionId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    institutionName: { type: String },
    institutionLogo: { type: String },
    institutionTagline: { type: String },
    contactPersonName: { type: String },
    city: { type: String },
    state: { type: String },
    address: { type: String },
    isVerified: { type: Boolean, default: false },
    otp: { type: String }, // Hashed
    otpExpires: { type: Date },
    lastOtpSent: { type: Date },
    googleRefreshToken: { type: String, select: false } // Store securely, don't return by default
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual property to check if profile is complete
UserSchema.virtual('isProfileComplete').get(function (this: IUser) {
    if (this.role === 'institution') {
        return !!(
            this.institutionName
            && this.contactPersonName
            && this.phoneNumber
            && this.city
            && this.state
            && this.address
        );
    }

    if (this.role === 'institution_student') {
        return true;
    }

    return !!(this.phoneNumber && this.guardianName && this.guardianPhone && this.qualification && this.avatar);
});

export default mongoose.model<IUser>('User', UserSchema);
