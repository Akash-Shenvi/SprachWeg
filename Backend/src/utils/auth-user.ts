import jwt from 'jsonwebtoken';
import type { IUser } from '../models/user.model';
import { env } from '../config/env';

export const buildAuthUser = (user: IUser) => ({
    _id: String((user as any)._id),
    id: String((user as any)._id),
    name: user.name,
    email: user.email,
    role: user.role,
    isProfileComplete: Boolean((user as any).isProfileComplete),
    phoneNumber: user.phoneNumber,
    guardianName: user.guardianName,
    guardianPhone: user.guardianPhone,
    qualification: user.qualification,
    dateOfBirth: user.dateOfBirth,
    avatar: user.avatar,
    institutionName: user.institutionName,
    contactPersonName: user.contactPersonName,
    city: user.city,
    state: user.state,
    address: user.address,
});

export const signAuthToken = (user: IUser) => jwt.sign(
    { id: String((user as any)._id), role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRE } as jwt.SignOptions
);
