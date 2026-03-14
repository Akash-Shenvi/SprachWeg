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
exports.getStudentDetails = exports.getStudents = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const language_enrollment_model_1 = __importDefault(require("../models/language.enrollment.model"));
const enrollment_model_1 = __importDefault(require("../models/enrollment.model"));
const getStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const query = { role: 'student' };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        const totalStudents = yield user_model_1.default.countDocuments(query);
        const students = yield user_model_1.default.find(query)
            .select('-password -otp -otpExpires -lastOtpSent')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        res.status(200).json({
            students,
            totalPages: Math.ceil(totalStudents / limit),
            currentPage: page,
            totalStudents
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching students', error });
    }
});
exports.getStudents = getStudents;
const getStudentDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const student = yield user_model_1.default.findById(id).select('-password -otp -otpExpires -lastOtpSent -googleRefreshToken');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        // Fetch Language Enrollments
        const languageEnrollments = yield language_enrollment_model_1.default.find({ userId: id })
            .populate('batchId', 'courseTitle name')
            .sort({ createdAt: -1 });
        // Fetch Skill Enrollments
        const skillEnrollments = yield enrollment_model_1.default.find({ userId: id })
            .populate('skillCourseId', 'title')
            .sort({ createdAt: -1 });
        res.status(200).json({
            student,
            languageEnrollments,
            skillEnrollments
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching student details', error });
    }
});
exports.getStudentDetails = getStudentDetails;
