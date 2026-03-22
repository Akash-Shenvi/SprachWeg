import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { InstitutionRegisterDto, LoginDto, ResendOtpDto, VerifyOtpDto } from '../dtos/auth.dto';
import User from '../models/user.model';
import { EmailService } from '../utils/email.service';
import { buildAuthUser, signAuthToken } from '../utils/auth-user';

const emailService = new EmailService();

const normalizeEmail = (value: string) => String(value || '').trim().toLowerCase();

const buildInstitutionUserPayload = async (registerDto: InstitutionRegisterDto) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, salt);
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

    return {
        hashedPassword,
        otp,
        otpHash,
        otpExpires,
    };
};

export const registerInstitution = async (req: Request, res: Response) => {
    const registerDto = plainToClass(InstitutionRegisterDto, req.body);
    const errors = await validate(registerDto);
    if (errors.length > 0) return res.status(400).json({ errors });

    const normalizedEmail = normalizeEmail(registerDto.email);

    try {
        let user = await User.findOne({ email: normalizedEmail });

        if (user && user.isVerified && user.role !== 'institution') {
            return res.status(400).json({ message: 'This email is already registered in another portal.' });
        }

        if (user && user.role !== 'institution') {
            return res.status(400).json({ message: 'This email is already registered in another portal.' });
        }

        const { hashedPassword, otp, otpHash, otpExpires } = await buildInstitutionUserPayload(registerDto);

        if (user) {
            user.name = registerDto.institutionName.trim();
            user.institutionName = registerDto.institutionName.trim();
            user.contactPersonName = registerDto.contactPersonName.trim();
            user.email = normalizedEmail;
            user.password = hashedPassword;
            user.phoneNumber = registerDto.phoneNumber.trim();
            user.city = registerDto.city.trim();
            user.state = registerDto.state.trim();
            user.address = registerDto.address.trim();
            user.role = 'institution';
            user.otp = otpHash;
            user.otpExpires = otpExpires;
            user.lastOtpSent = new Date();
            user.isVerified = false;
            await user.save();
        } else {
            user = new User({
                name: registerDto.institutionName.trim(),
                institutionName: registerDto.institutionName.trim(),
                contactPersonName: registerDto.contactPersonName.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                phoneNumber: registerDto.phoneNumber.trim(),
                city: registerDto.city.trim(),
                state: registerDto.state.trim(),
                address: registerDto.address.trim(),
                role: 'institution',
                otp: otpHash,
                otpExpires,
                lastOtpSent: new Date(),
            });
            await user.save();
        }

        await emailService.sendOtp(normalizedEmail, otp, registerDto.institutionName.trim(), 'Institution Portal Verification');

        return res.status(201).json({ message: 'OTP sent to email' });
    } catch (error) {
        return res.status(500).json({ message: (error as Error).message });
    }
};

export const verifyInstitutionOtp = async (req: Request, res: Response) => {
    const verifyDto = plainToClass(VerifyOtpDto, req.body);
    const errors = await validate(verifyDto);
    if (errors.length > 0) return res.status(400).json({ errors });

    try {
        const user = await User.findOne({ email: normalizeEmail(verifyDto.email) });
        if (!user || user.role !== 'institution') {
            return res.status(400).json({ message: 'Institution account not found' });
        }
        if (user.isVerified) {
            return res.status(400).json({ message: 'Institution account already verified' });
        }
        if (!user.otp || !user.otpExpires || user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'OTP expired or invalid' });
        }

        const isMatch = await bcrypt.compare(verifyDto.otp, user.otp);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        return res.status(200).json({
            token: signAuthToken(user),
            user: buildAuthUser(user),
        });
    } catch (error) {
        return res.status(500).json({ message: (error as Error).message });
    }
};

export const resendInstitutionOtp = async (req: Request, res: Response) => {
    const resendDto = plainToClass(ResendOtpDto, req.body);
    const errors = await validate(resendDto);
    if (errors.length > 0) return res.status(400).json({ errors });

    try {
        const user = await User.findOne({ email: normalizeEmail(resendDto.email) });
        if (!user || user.role !== 'institution') {
            return res.status(400).json({ message: 'Institution account not found' });
        }
        if (user.isVerified) {
            return res.status(400).json({ message: 'Institution account already verified' });
        }

        if (user.lastOtpSent) {
            const timeDiff = Date.now() - user.lastOtpSent.getTime();
            if (timeDiff < 3 * 60 * 1000) {
                return res.status(429).json({ message: 'Please wait 3 minutes before resending OTP' });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, salt);

        user.otp = otpHash;
        user.otpExpires = new Date(Date.now() + 3 * 60 * 1000);
        user.lastOtpSent = new Date();
        await user.save();

        await emailService.sendOtp(user.email, otp, user.institutionName || user.name, 'Institution Portal Verification');
        return res.status(200).json({ message: 'OTP resent to email' });
    } catch (error) {
        return res.status(500).json({ message: (error as Error).message });
    }
};

export const loginInstitution = async (req: Request, res: Response) => {
    const loginDto = plainToClass(LoginDto, req.body);
    const errors = await validate(loginDto);
    if (errors.length > 0) return res.status(400).json({ errors });

    try {
        const user = await User.findOne({ email: normalizeEmail(loginDto.email) });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        if (user.role !== 'institution') {
            return res.status(400).json({ message: 'This account does not belong to the institution portal.' });
        }
        if (!user.isVerified) {
            return res.status(400).json({ message: 'Institution account not verified' });
        }

        const isMatch = await bcrypt.compare(loginDto.password, user.password as string);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        return res.status(200).json({
            token: signAuthToken(user),
            user: buildAuthUser(user),
        });
    } catch (error) {
        return res.status(500).json({ message: (error as Error).message });
    }
};
