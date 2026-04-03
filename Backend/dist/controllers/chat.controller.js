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
exports.readChatConversation = exports.getUnreadChatConversations = exports.getChatHistory = void 0;
const chat_message_model_1 = __importDefault(require("../models/chat.message.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const chat_conversation_service_1 = require("../services/chat.conversation.service");
const chat_access_1 = require("../utils/chat-access");
const roles_1 = require("../utils/roles");
const resolveChatPairForRequest = (req, studentId, requestedTrainerId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const requesterId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
    const requesterRole = (_c = req.user) === null || _c === void 0 ? void 0 : _c.role;
    if (!requesterId) {
        return { status: 401, message: 'Not authorized' };
    }
    if ((0, roles_1.isLearnerRole)(requesterRole)) {
        if (requesterId !== studentId) {
            return { status: 403, message: 'Not authorized to view this chat' };
        }
        const trainerResolution = yield (0, chat_access_1.resolveTrainerIdForStudentChat)(studentId, requestedTrainerId);
        if (!trainerResolution.trainerId) {
            return { status: trainerResolution.status, message: trainerResolution.message };
        }
        return {
            requesterId,
            requesterRole,
            studentId,
            trainerId: trainerResolution.trainerId,
        };
    }
    if (requesterRole === 'trainer') {
        const batch = yield (0, chat_access_1.findAssignedBatchForChat)(studentId, requesterId);
        if (!batch) {
            return { status: 403, message: 'Not authorized: this student is not in your batch' };
        }
        return {
            requesterId,
            requesterRole,
            studentId,
            trainerId: requesterId,
        };
    }
    return { status: 403, message: 'Not authorized' };
});
// GET /api/chat/:studentId - load last 50 messages in a private conversation
const getChatHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentId } = req.params;
        const requestedTrainerId = typeof req.query.trainerId === 'string' ? req.query.trainerId : null;
        const chatPair = yield resolveChatPairForRequest(req, studentId, requestedTrainerId);
        let trainerName = 'Trainer';
        let studentName = 'Student';
        if ('status' in chatPair && typeof chatPair.status === 'number') {
            return res.status(chatPair.status).json({ message: chatPair.message });
        }
        if ((0, roles_1.isLearnerRole)(chatPair.requesterRole)) {
            const trainer = yield user_model_1.default.findById(chatPair.trainerId).select('name');
            if (trainer) {
                trainerName = trainer.name;
            }
        }
        else {
            const student = yield user_model_1.default.findById(studentId).select('name');
            if (student) {
                studentName = student.name;
            }
        }
        const messages = yield chat_message_model_1.default.find({ studentId, trainerId: chatPair.trainerId })
            .sort({ createdAt: 1 })
            .limit(50)
            .populate('senderId', 'name avatar _id');
        return res.json({
            messages,
            trainerId: chatPair.trainerId,
            trainerName,
            studentName,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching chat history', error });
    }
});
exports.getChatHistory = getChatHistory;
const getUnreadChatConversations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
        const userRole = (_c = req.user) === null || _c === void 0 ? void 0 : _c.role;
        if (!userId || (!(0, roles_1.isLearnerRole)(userRole) && userRole !== 'trainer')) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const conversations = yield (0, chat_conversation_service_1.listUnreadConversationsForUser)({ userId, userRole });
        return res.status(200).json({ data: conversations });
    }
    catch (error) {
        console.error('Failed to fetch unread chat conversations:', error);
        return res.status(500).json({ message: 'Failed to fetch unread chat conversations' });
    }
});
exports.getUnreadChatConversations = getUnreadChatConversations;
const readChatConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { studentId } = req.params;
        const requestedTrainerId = typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.trainerId) === 'string'
            ? req.body.trainerId
            : (typeof req.query.trainerId === 'string' ? req.query.trainerId : null);
        const chatPair = yield resolveChatPairForRequest(req, studentId, requestedTrainerId);
        if ('status' in chatPair && typeof chatPair.status === 'number') {
            return res.status(chatPair.status).json({ message: chatPair.message });
        }
        const conversation = yield (0, chat_conversation_service_1.markConversationAsRead)({
            studentId,
            trainerId: chatPair.trainerId,
            userId: chatPair.requesterId,
            userRole: chatPair.requesterRole,
        });
        return res.status(200).json({
            conversation: conversation || {
                studentId,
                trainerId: chatPair.trainerId,
                hasUnread: false,
                lastMessageAt: null,
            },
        });
    }
    catch (error) {
        console.error('Failed to mark chat conversation as read:', error);
        return res.status(500).json({ message: 'Failed to mark chat conversation as read' });
    }
});
exports.readChatConversation = readChatConversation;
