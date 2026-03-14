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
exports.deleteMessage = exports.markAsRead = exports.getAllMessages = exports.submitContactForm = void 0;
const contact_model_1 = __importDefault(require("../models/contact.model"));
const email_service_1 = require("../utils/email.service");
const emailService = new email_service_1.EmailService();
// POST /api/contact
const submitContactForm = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const contact = yield contact_model_1.default.create({
            name,
            email,
            subject,
            message
        });
        // Forward to admin email
        yield emailService.forwardContactMessage({ name, email, subject, message });
        // Send auto-reply to user
        yield emailService.sendContactAutoReply(email);
        res.status(201).json({ message: 'Message sent successfully', contact });
    }
    catch (error) {
        console.error('Contact submission error:', error);
        res.status(500).json({ message: 'Failed to send message' });
    }
});
exports.submitContactForm = submitContactForm;
// GET /api/contact/admin/messages
const getAllMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const messages = yield contact_model_1.default.find().sort({ createdAt: -1 });
        res.json(messages);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
});
exports.getAllMessages = getAllMessages;
// PATCH /api/contact/admin/messages/:id/read
const markAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const contact = yield contact_model_1.default.findByIdAndUpdate(id, { isRead: true }, { new: true });
        if (!contact) {
            return res.status(404).json({ message: 'Message not found' });
        }
        res.json(contact);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update message' });
    }
});
exports.markAsRead = markAsRead;
// DELETE /api/contact/admin/messages/:id
const deleteMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const contact = yield contact_model_1.default.findByIdAndDelete(id);
        if (!contact) {
            return res.status(404).json({ message: 'Message not found' });
        }
        res.json({ message: 'Message deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to delete message' });
    }
});
exports.deleteMessage = deleteMessage;
