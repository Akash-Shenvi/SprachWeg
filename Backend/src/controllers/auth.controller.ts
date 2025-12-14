import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { EmailService } from '../utils/email.service';
import { env } from '../config/env';
import { RegisterDto, VerifyOtpDto, ResendOtpDto, LoginDto } from '../dtos/auth.dto';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

const emailService = new EmailService();

export const register = async (req: Request, res: Response) => {
    const registerDto = plainToClass(RegisterDto, req.body);
    const errors = await validate(registerDto);
    if (errors.length > 0) return res.status(400).json({ errors });

    try {
        let user = await User.findOne({ email: registerDto.email });
        if (user && user.isVerified) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(registerDto.password, salt);

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, salt);
        const otpExpires = new Date(Date.now() + 3 * 60 * 1000); // 3 mins

        if (user) {
            // Update unverified user
            user.name = registerDto.name;
            user.password = hashedPassword;
            user.otp = otpHash;
            user.otpExpires = otpExpires;
            user.lastOtpSent = new Date();
            await user.save();
        } else {
            // Create new user
            user = new User({
                name: registerDto.name,
                email: registerDto.email,
                password: hashedPassword,
                otp: otpHash,
                otpExpires,
                lastOtpSent: new Date(),
            });
            await user.save();
        }

        await emailService.sendOtp(user.email, otp);
        res.status(201).json({ message: 'OTP sent to email' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    const verifyDto = plainToClass(VerifyOtpDto, req.body);
    const errors = await validate(verifyDto);
    if (errors.length > 0) return res.status(400).json({ errors });

    try {
        const user = await User.findOne({ email: verifyDto.email });
        if (!user) return res.status(400).json({ message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

        if (!user.otp || !user.otpExpires || user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'OTP expired or invalid' });
        }

        const isMatch = await bcrypt.compare(verifyDto.otp, user.otp);
        if (!isMatch) return res.status(400).json({ message: 'Invalid OTP' });

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const payload = { id: (user as any)._id, role: user.role };
        const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRE } as jwt.SignOptions);

        res.status(200).json({ token, user: { id: (user as any)._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const resendOtp = async (req: Request, res: Response) => {
    const resendDto = plainToClass(ResendOtpDto, req.body);
    const errors = await validate(resendDto);
    if (errors.length > 0) return res.status(400).json({ errors });

    try {
        const user = await User.findOne({ email: resendDto.email });
        if (!user) return res.status(400).json({ message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

        // Check for 3 minute wait
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
        user.otpExpires = new Date(Date.now() + 3 * 60 * 1000); // 3 mins
        user.lastOtpSent = new Date();
        await user.save();

        await emailService.sendOtp(user.email, otp);
        res.status(200).json({ message: 'OTP resent to email' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const login = async (req: Request, res: Response) => {
    const loginDto = plainToClass(LoginDto, req.body);
    const errors = await validate(loginDto);
    if (errors.length > 0) return res.status(400).json({ errors });

    try {
        const user = await User.findOne({ email: loginDto.email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });
        if (!user.isVerified) return res.status(400).json({ message: 'Account not verified' });

        const isMatch = await bcrypt.compare(loginDto.password, user.password as string);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const payload = { id: (user as any)._id, role: user.role };
        const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRE } as jwt.SignOptions);

        res.status(200).json({ token, user: { id: (user as any)._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({
            name: user.name,
            email: user.email
        });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
