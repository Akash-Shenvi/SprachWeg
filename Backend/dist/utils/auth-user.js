"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAuthToken = exports.buildAuthUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const buildAuthUser = (user) => ({
    _id: String(user._id),
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    isProfileComplete: Boolean(user.isProfileComplete),
    phoneNumber: user.phoneNumber,
    guardianName: user.guardianName,
    guardianPhone: user.guardianPhone,
    qualification: user.qualification,
    dateOfBirth: user.dateOfBirth,
    avatar: user.avatar,
    institutionId: user.institutionId ? String(user.institutionId) : undefined,
    institutionName: user.institutionName,
    institutionLogo: user.institutionLogo,
    institutionTagline: user.institutionTagline,
    contactPersonName: user.contactPersonName,
    city: user.city,
    state: user.state,
    address: user.address,
});
exports.buildAuthUser = buildAuthUser;
const signAuthToken = (user) => jsonwebtoken_1.default.sign({ id: String(user._id), role: user.role }, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRE });
exports.signAuthToken = signAuthToken;
