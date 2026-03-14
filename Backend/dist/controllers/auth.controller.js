"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.googleLogin = exports.login = exports.resetPassword = exports.forgotPassword = exports.resendOtp = exports.verifyOtp = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const email_service_1 = require("../utils/email.service");
const env_1 = require("../config/env");
const auth_dto_1 = require("../dtos/auth.dto");
const google_auth_library_1 = require("google-auth-library");
const client = new google_auth_library_1.OAuth2Client(env_1.env.GOOGLE_CLIENT_ID);
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const emailService = new email_service_1.EmailService();
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const registerDto = (0, class_transformer_1.plainToClass)(auth_dto_1.RegisterDto, req.body);
    const errors = yield (0, class_validator_1.validate)(registerDto);
    if (errors.length > 0)
        return res.status(400).json({ errors });
    try {
        let user = yield user_model_1.default.findOne({ email: registerDto.email });
        if (user && user.isVerified) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(registerDto.password, salt);
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = yield bcryptjs_1.default.hash(otp, salt);
        const otpExpires = new Date(Date.now() + 3 * 60 * 1000); // 3 mins
        if (user) {
            // Update unverified user
            user.name = registerDto.name;
            user.password = hashedPassword;
            user.otp = otpHash;
            user.otpExpires = otpExpires;
            user.lastOtpSent = new Date();
            yield user.save();
        }
        else {
            // Create new user
            user = new user_model_1.default({
                name: registerDto.name,
                email: registerDto.email,
                password: hashedPassword,
                phoneNumber: registerDto.phoneNumber,
                germanLevel: registerDto.germanLevel,
                otp: otpHash,
                otpExpires,
                lastOtpSent: new Date(),
            });
            yield user.save();
        }
        yield emailService.sendOtp(user.email, otp, user.name, "Registration Verification");
        res.status(201).json({ message: 'OTP sent to email' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.register = register;
const verifyOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const verifyDto = (0, class_transformer_1.plainToClass)(auth_dto_1.VerifyOtpDto, req.body);
    const errors = yield (0, class_validator_1.validate)(verifyDto);
    if (errors.length > 0)
        return res.status(400).json({ errors });
    try {
        const user = yield user_model_1.default.findOne({ email: verifyDto.email });
        if (!user)
            return res.status(400).json({ message: 'User not found' });
        if (user.isVerified)
            return res.status(400).json({ message: 'User already verified' });
        if (!user.otp || !user.otpExpires || user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'OTP expired or invalid' });
        }
        const isMatch = yield bcryptjs_1.default.compare(verifyDto.otp, user.otp);
        if (!isMatch)
            return res.status(400).json({ message: 'Invalid OTP' });
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        yield user.save();
        const payload = { id: user._id, role: user.role };
        const token = jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRE });
        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isProfileComplete: user.isProfileComplete,
                phoneNumber: user.phoneNumber,
                guardianName: user.guardianName,
                guardianPhone: user.guardianPhone,
                qualification: user.qualification,
                dateOfBirth: user.dateOfBirth
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.verifyOtp = verifyOtp;
const resendOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const resendDto = (0, class_transformer_1.plainToClass)(auth_dto_1.ResendOtpDto, req.body);
    const errors = yield (0, class_validator_1.validate)(resendDto);
    if (errors.length > 0)
        return res.status(400).json({ errors });
    try {
        const user = yield user_model_1.default.findOne({ email: resendDto.email });
        if (!user)
            return res.status(400).json({ message: 'User not found' });
        if (user.isVerified)
            return res.status(400).json({ message: 'User already verified' });
        // Check for 3 minute wait
        if (user.lastOtpSent) {
            const timeDiff = Date.now() - user.lastOtpSent.getTime();
            if (timeDiff < 3 * 60 * 1000) {
                return res.status(429).json({ message: 'Please wait 3 minutes before resending OTP' });
            }
        }
        const salt = yield bcryptjs_1.default.genSalt(10);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = yield bcryptjs_1.default.hash(otp, salt);
        user.otp = otpHash;
        user.otpExpires = new Date(Date.now() + 3 * 60 * 1000); // 3 mins
        user.lastOtpSent = new Date();
        yield user.save();
        yield emailService.sendOtp(user.email, otp, user.name, "Verification");
        res.status(200).json({ message: 'OTP resent to email' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.resendOtp = resendOtp;
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ message: 'Email is required' });
        const user = yield user_model_1.default.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const salt = yield bcryptjs_1.default.genSalt(10);
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = yield bcryptjs_1.default.hash(otp, salt);
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins for password reset
        user.otp = otpHash;
        user.otpExpires = otpExpires;
        yield user.save();
        yield emailService.sendOtp(user.email, otp, user.name, "Password Reset");
        res.json({ message: 'OTP sent to email' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.forgotPassword = forgotPassword;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Email, OTP, and new password are required' });
        }
        const user = yield user_model_1.default.findOne({ email });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        if (!user.otp || !user.otpExpires || user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'OTP expired or invalid' });
        }
        const isMatch = yield bcryptjs_1.default.compare(otp, user.otp);
        if (!isMatch)
            return res.status(400).json({ message: 'Invalid OTP' });
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, salt);
        user.password = hashedPassword;
        user.otp = undefined;
        user.otpExpires = undefined;
        yield user.save();
        res.json({ message: 'Password reset successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.resetPassword = resetPassword;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const loginDto = (0, class_transformer_1.plainToClass)(auth_dto_1.LoginDto, req.body);
    const errors = yield (0, class_validator_1.validate)(loginDto);
    if (errors.length > 0)
        return res.status(400).json({ errors });
    try {
        const user = yield user_model_1.default.findOne({ email: loginDto.email });
        if (!user)
            return res.status(400).json({ message: 'Invalid credentials' });
        if (!user.isVerified)
            return res.status(400).json({ message: 'Account not verified' });
        const isMatch = yield bcryptjs_1.default.compare(loginDto.password, user.password);
        if (!isMatch)
            return res.status(400).json({ message: 'Invalid credentials' });
        const payload = { id: user._id, role: user.role };
        const token = jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRE });
        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isProfileComplete: user.isProfileComplete,
                phoneNumber: user.phoneNumber,
                guardianName: user.guardianName,
                guardianPhone: user.guardianPhone,
                qualification: user.qualification,
                dateOfBirth: user.dateOfBirth
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.login = login;
const googleLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const googleDto = (0, class_transformer_1.plainToClass)(auth_dto_1.GoogleLoginDto, req.body);
    const errors = yield (0, class_validator_1.validate)(googleDto);
    if (errors.length > 0)
        return res.status(400).json({ errors });
    try {
        // Fetch user info using the access token
        const response = yield fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${googleDto.token}` }
        });
        if (!response.ok) {
            return res.status(400).json({ message: 'Invalid Google Token' });
        }
        const payload = yield response.json();
        const { email, name, picture, sub: googleId } = payload;
        let user = yield user_model_1.default.findOne({ email });
        if (!user) {
            // Create new user if not found
            user = new user_model_1.default({
                name,
                email,
                googleId,
                isVerified: true, // Google users are considered verified
            });
            yield user.save();
        }
        else if (!user.googleId) {
            // Link Google account if user exists but not linked
            user.googleId = googleId;
            user.isVerified = true;
            yield user.save();
        }
        const jwtPayload = { id: user._id, role: user.role };
        const token = jsonwebtoken_1.default.sign(jwtPayload, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRE });
        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isProfileComplete: user.isProfileComplete,
                phoneNumber: user.phoneNumber,
                guardianName: user.guardianName,
                guardianPhone: user.guardianPhone,
                qualification: user.qualification,
                dateOfBirth: user.dateOfBirth
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.googleLogin = googleLogin;
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch fresh user data including the private googleRefreshToken field
        const user = yield user_model_1.default.findById(req.user.id).select('+googleRefreshToken');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isProfileComplete: user.isProfileComplete,
            phoneNumber: user.phoneNumber,
            guardianName: user.guardianName,
            guardianPhone: user.guardianPhone,
            qualification: user.qualification,
            dateOfBirth: user.dateOfBirth,
            googleRefreshToken: !!user.googleRefreshToken // Return boolean status
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getMe = getMe;
