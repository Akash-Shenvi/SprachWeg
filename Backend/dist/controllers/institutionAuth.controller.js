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
exports.loginInstitution = exports.resendInstitutionOtp = exports.verifyInstitutionOtp = exports.registerInstitution = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const auth_dto_1 = require("../dtos/auth.dto");
const user_model_1 = __importDefault(require("../models/user.model"));
const email_service_1 = require("../utils/email.service");
const auth_user_1 = require("../utils/auth-user");
const emailService = new email_service_1.EmailService();
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const buildInstitutionUserPayload = (registerDto) => __awaiter(void 0, void 0, void 0, function* () {
    const salt = yield bcryptjs_1.default.genSalt(10);
    const hashedPassword = yield bcryptjs_1.default.hash(registerDto.password, salt);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = yield bcryptjs_1.default.hash(otp, salt);
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);
    return {
        hashedPassword,
        otp,
        otpHash,
        otpExpires,
    };
});
const registerInstitution = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const registerDto = (0, class_transformer_1.plainToClass)(auth_dto_1.InstitutionRegisterDto, req.body);
    const errors = yield (0, class_validator_1.validate)(registerDto);
    if (errors.length > 0)
        return res.status(400).json({ errors });
    const normalizedEmail = normalizeEmail(registerDto.email);
    try {
        let user = yield user_model_1.default.findOne({ email: normalizedEmail });
        if (user && user.isVerified && user.role !== 'institution') {
            return res.status(400).json({ message: 'This email is already registered in another portal.' });
        }
        if (user && user.role !== 'institution') {
            return res.status(400).json({ message: 'This email is already registered in another portal.' });
        }
        const { hashedPassword, otp, otpHash, otpExpires } = yield buildInstitutionUserPayload(registerDto);
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
            yield user.save();
        }
        else {
            user = new user_model_1.default({
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
            yield user.save();
        }
        yield emailService.sendOtp(normalizedEmail, otp, registerDto.institutionName.trim(), 'Institution Portal Verification');
        return res.status(201).json({ message: 'OTP sent to email' });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.registerInstitution = registerInstitution;
const verifyInstitutionOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const verifyDto = (0, class_transformer_1.plainToClass)(auth_dto_1.VerifyOtpDto, req.body);
    const errors = yield (0, class_validator_1.validate)(verifyDto);
    if (errors.length > 0)
        return res.status(400).json({ errors });
    try {
        const user = yield user_model_1.default.findOne({ email: normalizeEmail(verifyDto.email) });
        if (!user || user.role !== 'institution') {
            return res.status(400).json({ message: 'Institution account not found' });
        }
        if (user.isVerified) {
            return res.status(400).json({ message: 'Institution account already verified' });
        }
        if (!user.otp || !user.otpExpires || user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'OTP expired or invalid' });
        }
        const isMatch = yield bcryptjs_1.default.compare(verifyDto.otp, user.otp);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        yield user.save();
        return res.status(200).json({
            token: (0, auth_user_1.signAuthToken)(user),
            user: (0, auth_user_1.buildAuthUser)(user),
        });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.verifyInstitutionOtp = verifyInstitutionOtp;
const resendInstitutionOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const resendDto = (0, class_transformer_1.plainToClass)(auth_dto_1.ResendOtpDto, req.body);
    const errors = yield (0, class_validator_1.validate)(resendDto);
    if (errors.length > 0)
        return res.status(400).json({ errors });
    try {
        const user = yield user_model_1.default.findOne({ email: normalizeEmail(resendDto.email) });
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
        const salt = yield bcryptjs_1.default.genSalt(10);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = yield bcryptjs_1.default.hash(otp, salt);
        user.otp = otpHash;
        user.otpExpires = new Date(Date.now() + 3 * 60 * 1000);
        user.lastOtpSent = new Date();
        yield user.save();
        yield emailService.sendOtp(user.email, otp, user.institutionName || user.name, 'Institution Portal Verification');
        return res.status(200).json({ message: 'OTP resent to email' });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.resendInstitutionOtp = resendInstitutionOtp;
const loginInstitution = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const loginDto = (0, class_transformer_1.plainToClass)(auth_dto_1.LoginDto, req.body);
    const errors = yield (0, class_validator_1.validate)(loginDto);
    if (errors.length > 0)
        return res.status(400).json({ errors });
    try {
        const user = yield user_model_1.default.findOne({ email: normalizeEmail(loginDto.email) });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        if (user.role !== 'institution') {
            return res.status(400).json({ message: 'This account does not belong to the institution portal.' });
        }
        if (!user.isVerified) {
            return res.status(400).json({ message: 'Institution account not verified' });
        }
        const isMatch = yield bcryptjs_1.default.compare(loginDto.password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        return res.status(200).json({
            token: (0, auth_user_1.signAuthToken)(user),
            user: (0, auth_user_1.buildAuthUser)(user),
        });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.loginInstitution = loginInstitution;
