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
exports.getAllInternshipApplications = exports.getMyInternshipApplications = exports.submitInternshipApplication = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const internshipApplication_model_1 = __importDefault(require("../models/internshipApplication.model"));
const fileServeRoot = '/home/sovirtraining/file_serve';
const toStoredResumeUrl = (filename) => `/uploads/internship_resumes/${filename}`;
const removeStoredResume = (resumeUrl) => {
    if (!resumeUrl)
        return;
    const relativePath = resumeUrl.replace('/uploads/', '');
    const absolutePath = path_1.default.join(fileServeRoot, relativePath);
    if (fs_1.default.existsSync(absolutePath)) {
        fs_1.default.unlinkSync(absolutePath);
    }
};
const submitInternshipApplication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in to submit an internship application.' });
        }
        if (req.fileValidationError) {
            return res.status(400).json({ message: req.fileValidationError });
        }
        const { internshipTitle, firstName, lastName, dob, email, whatsapp, college, registration, department, semester, passingYear, address, source, } = req.body;
        const requiredFields = {
            internshipTitle,
            firstName,
            lastName,
            dob,
            email,
            whatsapp,
            college,
            registration,
            department,
            semester,
            passingYear,
            address,
            source,
        };
        const missingField = Object.entries(requiredFields).find(([, value]) => !String(value !== null && value !== void 0 ? value : '').trim());
        if (missingField) {
            return res.status(400).json({ message: `${missingField[0]} is required.` });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload your resume to continue.' });
        }
        const parsedDate = new Date(dob);
        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({ message: 'Please provide a valid date of birth.' });
        }
        const applicationData = {
            userId: req.user._id,
            accountName: req.user.name,
            accountEmail: req.user.email,
            accountPhoneNumber: req.user.phoneNumber,
            internshipTitle: String(internshipTitle).trim(),
            firstName: String(firstName).trim(),
            lastName: String(lastName).trim(),
            dateOfBirth: parsedDate,
            email: String(email).trim().toLowerCase(),
            whatsapp: String(whatsapp).trim(),
            college: String(college).trim(),
            registration: String(registration).trim(),
            department: String(department).trim(),
            semester: String(semester).trim(),
            passingYear: String(passingYear).trim(),
            address: String(address).trim(),
            source: String(source).trim(),
            resumeUrl: toStoredResumeUrl(req.file.filename),
            resumeOriginalName: req.file.originalname,
        };
        const existingApplication = yield internshipApplication_model_1.default.findOne({
            userId: req.user._id,
            internshipTitle: applicationData.internshipTitle,
        });
        if (existingApplication) {
            const previousResumeUrl = existingApplication.resumeUrl;
            existingApplication.set(Object.assign(Object.assign({}, applicationData), { status: 'submitted' }));
            yield existingApplication.save();
            if (previousResumeUrl !== applicationData.resumeUrl) {
                removeStoredResume(previousResumeUrl);
            }
            return res.status(200).json({
                message: 'Internship application updated successfully.',
                application: existingApplication,
            });
        }
        const application = yield internshipApplication_model_1.default.create(applicationData);
        return res.status(201).json({
            message: 'Internship application submitted successfully.',
            application,
        });
    }
    catch (error) {
        if (req.file) {
            removeStoredResume(toStoredResumeUrl(req.file.filename));
        }
        if ((error === null || error === void 0 ? void 0 : error.code) === 11000) {
            return res.status(409).json({ message: 'You have already applied for this internship.' });
        }
        console.error('Internship application submission error:', error);
        return res.status(500).json({ message: 'Failed to submit internship application.' });
    }
});
exports.submitInternshipApplication = submitInternshipApplication;
const getMyInternshipApplications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in to view your internship applications.' });
        }
        const applications = yield internshipApplication_model_1.default.find({ userId: req.user._id }).sort({ createdAt: -1 });
        return res.status(200).json({ applications });
    }
    catch (error) {
        console.error('Fetching internship applications failed:', error);
        return res.status(500).json({ message: 'Failed to fetch internship applications.' });
    }
});
exports.getMyInternshipApplications = getMyInternshipApplications;
const getAllInternshipApplications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const applications = yield internshipApplication_model_1.default.find()
            .populate('userId', 'name email phoneNumber role')
            .sort({ createdAt: -1 });
        return res.status(200).json({ applications });
    }
    catch (error) {
        console.error('Fetching all internship applications failed:', error);
        return res.status(500).json({ message: 'Failed to fetch internship applications.' });
    }
});
exports.getAllInternshipApplications = getAllInternshipApplications;
