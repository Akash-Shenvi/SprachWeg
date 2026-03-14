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
exports.deleteTrialRequest = exports.getTrialRequests = exports.createTrialRequest = void 0;
const trialRequest_model_1 = __importDefault(require("../models/trialRequest.model"));
// Import EmailService
const email_service_1 = require("../utils/email.service");
const emailService = new email_service_1.EmailService();
// Create a new trial request
const createTrialRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fullName, email, phone, countryCode, interest, language, course, prepLevel, skillCourses, comments } = req.body;
        const newRequest = new trialRequest_model_1.default({
            fullName,
            email,
            phone,
            countryCode,
            interest,
            language,
            course,
            prepLevel,
            skillCourses,
            comments
        });
        yield newRequest.save();
        // Send Email Notification
        if (email) {
            yield emailService.sendTrialEmail(email, fullName);
        }
        res.status(201).json({ message: 'Trial request submitted successfully', data: newRequest });
    }
    catch (error) {
        console.error('Error creating trial request:', error);
        res.status(500).json({ message: 'Failed to submit trial request', error: error.message });
    }
});
exports.createTrialRequest = createTrialRequest;
// Get all trial requests (Admin)
const getTrialRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requests = yield trialRequest_model_1.default.find().sort({ createdAt: -1 });
        res.status(200).json(requests);
    }
    catch (error) {
        console.error('Error fetching trial requests:', error);
        res.status(500).json({ message: 'Failed to fetch trial requests', error: error.message });
    }
});
exports.getTrialRequests = getTrialRequests;
// Delete a trial request (Admin)
const deleteTrialRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deleted = yield trialRequest_model_1.default.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Trial request not found' });
        }
        res.status(200).json({ message: 'Trial request deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting trial request:', error);
        res.status(500).json({ message: 'Failed to delete trial request', error: error.message });
    }
});
exports.deleteTrialRequest = deleteTrialRequest;
