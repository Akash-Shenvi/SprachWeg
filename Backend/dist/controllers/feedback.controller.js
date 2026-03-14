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
exports.markFeedbackAsSolved = exports.getAllFeedback = exports.submitFeedback = void 0;
const feedback_model_1 = require("../models/feedback.model");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// @desc    Submit new feedback
// @route   POST /api/feedback
// @access  Public
const submitFeedback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, problem } = req.body;
        let imageUrl = '';
        if (req.file) {
            // Reconstruct logic consistent with upload middleware 
            // The upload middleware puts it in a specific folder, we store the relative path or filename
            imageUrl = `/materials/${req.file.filename}`;
        }
        if (!name || !email || !problem) {
            res.status(400).json({ success: false, message: 'Please provide all required fields (name, email, problem).' });
            return;
        }
        const newFeedback = yield feedback_model_1.Feedback.create({
            name,
            email,
            problem,
            imageUrl
        });
        res.status(201).json({ success: true, message: 'Feedback submitted successfully', data: newFeedback });
    }
    catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ success: false, message: 'Failed to submit feedback' });
    }
});
exports.submitFeedback = submitFeedback;
// @desc    Get all feedback
// @route   GET /api/feedback
// @access  Private (Admin)
const getAllFeedback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const feedbacks = yield feedback_model_1.Feedback.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: feedbacks.length, data: feedbacks });
    }
    catch (error) {
        console.error('Error fetching feedbacks:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch feedbacks' });
    }
});
exports.getAllFeedback = getAllFeedback;
// @desc    Delete (Mark as Solved) feedback
// @route   DELETE /api/feedback/:id
// @access  Private (Admin)
const markFeedbackAsSolved = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const feedback = yield feedback_model_1.Feedback.findById(req.params.id);
        if (!feedback) {
            res.status(404).json({ success: false, message: 'Feedback not found' });
            return;
        }
        // Delete the associated image file if it exists
        if (feedback.imageUrl) {
            const filename = feedback.imageUrl.replace('/materials/', '');
            const uploadDir = '/home/sovirtraining/file_serve/materials';
            const filePath = path_1.default.join(uploadDir, filename);
            try {
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                }
            }
            catch (fileError) {
                console.error('Error deleting image file:', fileError);
                // We shouldn't stop the feedback deletion just because file deletion failed
            }
        }
        yield feedback.deleteOne();
        res.status(200).json({ success: true, message: 'Feedback marked as solved and deleted' });
    }
    catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({ success: false, message: 'Failed to solve/delete feedback' });
    }
});
exports.markFeedbackAsSolved = markFeedbackAsSolved;
