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
exports.deleteRejectedInternshipApplication = exports.updateInternshipApplicationStatus = exports.getAllInternshipApplications = exports.getMyEnrolledInternships = exports.getMyInternshipApplications = exports.submitInternshipApplication = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const internshipApplication_model_1 = __importDefault(require("../models/internshipApplication.model"));
const internshipListing_model_1 = __importDefault(require("../models/internshipListing.model"));
const email_service_1 = require("../utils/email.service");
const fileServeRoot = '/home/sovirtraining/file_serve';
const adminDecisionStatuses = ['accepted', 'rejected'];
const internshipModes = ['online', 'hybrid', 'onsite'];
const emailService = new email_service_1.EmailService();
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
        const { internshipSlug, internshipTitle, internshipMode, firstName, lastName, dob, email, whatsapp, college, registration, department, semester, passingYear, address, source, } = req.body;
        const requiredFields = {
            internshipMode,
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
        let selectedInternship = null;
        const normalizedInternshipSlug = String(internshipSlug !== null && internshipSlug !== void 0 ? internshipSlug : '').trim().toLowerCase();
        const normalizedRequestedTitle = String(internshipTitle !== null && internshipTitle !== void 0 ? internshipTitle : '').trim();
        if (normalizedInternshipSlug) {
            selectedInternship = yield internshipListing_model_1.default.findOne({
                slug: normalizedInternshipSlug,
                isActive: true,
            });
        }
        else if (normalizedRequestedTitle) {
            selectedInternship = yield internshipListing_model_1.default.findOne({
                title: normalizedRequestedTitle,
                isActive: true,
            });
        }
        if (!selectedInternship && !normalizedRequestedTitle) {
            return res.status(400).json({ message: 'internshipSlug is required.' });
        }
        if (!selectedInternship) {
            return res.status(404).json({ message: 'Selected internship is no longer available.' });
        }
        const normalizedMode = String(internshipMode).trim().toLowerCase();
        if (!internshipModes.includes(normalizedMode)) {
            return res.status(400).json({ message: 'Internship mode must be online, hybrid, or onsite.' });
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
            internshipSlug: selectedInternship.slug,
            internshipTitle: selectedInternship.title,
            internshipPrice: selectedInternship.price,
            internshipMode: normalizedMode,
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
        const existingApplication = yield internshipApplication_model_1.default.findOne(Object.assign({ userId: req.user._id }, (applicationData.internshipSlug
            ? {
                $or: [
                    { internshipSlug: applicationData.internshipSlug },
                    { internshipTitle: applicationData.internshipTitle },
                ],
            }
            : { internshipTitle: applicationData.internshipTitle })));
        if (existingApplication) {
            if (existingApplication.status !== 'rejected') {
                removeStoredResume(applicationData.resumeUrl);
                return res.status(409).json({
                    message: 'You have already applied for this internship.',
                    application: existingApplication,
                });
            }
            const previousResumeUrl = existingApplication.resumeUrl;
            existingApplication.set(Object.assign(Object.assign({}, applicationData), { status: 'submitted' }));
            yield existingApplication.save();
            if (previousResumeUrl !== applicationData.resumeUrl) {
                removeStoredResume(previousResumeUrl);
            }
            yield emailService.sendInternshipApplicationEmail(existingApplication.email, `${existingApplication.firstName} ${existingApplication.lastName}`.trim(), existingApplication.internshipTitle, existingApplication.referenceCode, existingApplication.internshipMode);
            return res.status(200).json({
                message: 'Internship application updated successfully.',
                application: existingApplication,
            });
        }
        const application = yield internshipApplication_model_1.default.create(applicationData);
        yield emailService.sendInternshipApplicationEmail(application.email, `${application.firstName} ${application.lastName}`.trim(), application.internshipTitle, application.referenceCode, application.internshipMode);
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
const getMyEnrolledInternships = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Please log in to view your enrolled internships.' });
        }
        const internships = yield internshipApplication_model_1.default.find({
            userId: req.user._id,
            status: 'accepted',
        })
            .select('internshipSlug internshipTitle internshipPrice internshipMode referenceCode status createdAt')
            .sort({ createdAt: -1 });
        return res.status(200).json({ internships });
    }
    catch (error) {
        console.error('Fetching enrolled internships failed:', error);
        return res.status(500).json({ message: 'Failed to fetch enrolled internships.' });
    }
});
exports.getMyEnrolledInternships = getMyEnrolledInternships;
const getAllInternshipApplications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const applications = yield internshipApplication_model_1.default.find()
            .populate('userId', 'name email phoneNumber role avatar')
            .sort({ createdAt: -1 });
        return res.status(200).json({ applications });
    }
    catch (error) {
        console.error('Fetching all internship applications failed:', error);
        return res.status(500).json({ message: 'Failed to fetch internship applications.' });
    }
});
exports.getAllInternshipApplications = getAllInternshipApplications;
const updateInternshipApplicationStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const requestedStatus = String((_a = req.body.status) !== null && _a !== void 0 ? _a : '').trim().toLowerCase();
        if (!adminDecisionStatuses.includes(requestedStatus)) {
            return res.status(400).json({ message: 'Status must be accepted or rejected.' });
        }
        const application = yield internshipApplication_model_1.default.findById(id).populate('userId', 'name email phoneNumber role avatar');
        if (!application) {
            return res.status(404).json({ message: 'Internship application not found.' });
        }
        application.status = requestedStatus;
        yield application.save();
        yield emailService.sendInternshipStatusEmail(application.email, `${application.firstName} ${application.lastName}`.trim(), application.internshipTitle, application.referenceCode, application.internshipMode, requestedStatus);
        return res.status(200).json({
            message: `Internship application ${requestedStatus} successfully.`,
            application,
        });
    }
    catch (error) {
        console.error('Updating internship application status failed:', error);
        return res.status(500).json({ message: 'Failed to update internship application status.' });
    }
});
exports.updateInternshipApplicationStatus = updateInternshipApplicationStatus;
const deleteRejectedInternshipApplication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const application = yield internshipApplication_model_1.default.findById(id);
        if (!application) {
            return res.status(404).json({ message: 'Internship application not found.' });
        }
        if (application.status !== 'rejected') {
            return res.status(400).json({ message: 'Only rejected internship applications can be deleted.' });
        }
        removeStoredResume(application.resumeUrl);
        yield application.deleteOne();
        return res.status(200).json({ message: 'Rejected internship application deleted successfully.' });
    }
    catch (error) {
        console.error('Deleting rejected internship application failed:', error);
        return res.status(500).json({ message: 'Failed to delete internship application.' });
    }
});
exports.deleteRejectedInternshipApplication = deleteRejectedInternshipApplication;
