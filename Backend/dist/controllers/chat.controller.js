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
exports.getChatHistory = void 0;
const chat_message_model_1 = __importDefault(require("../models/chat.message.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const chat_access_1 = require("../utils/chat-access");
const roles_1 = require("../utils/roles");
// GET /api/chat/:studentId  — load last 50 messages in a private conversation
const getChatHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { studentId } = req.params;
        const requesterId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
        const requesterRole = (_c = req.user) === null || _c === void 0 ? void 0 : _c.role;
        const requestedTrainerId = typeof req.query.trainerId === 'string' ? req.query.trainerId : null;
        let trainerId;
        let trainerName = 'Trainer';
        let studentName = 'Student';
        if ((0, roles_1.isLearnerRole)(requesterRole)) {
            // Student can only fetch their own chat
            if (requesterId !== studentId) {
                return res.status(403).json({ message: 'Not authorized to view this chat' });
            }
            const trainerResolution = yield (0, chat_access_1.resolveTrainerIdForStudentChat)(studentId, requestedTrainerId);
            if (!trainerResolution.trainerId) {
                return res.status(trainerResolution.status).json({ message: trainerResolution.message });
            }
            trainerId = trainerResolution.trainerId;
            // Fetch trainer name for chat header
            const trainer = yield user_model_1.default.findById(trainerId).select('name');
            if (trainer)
                trainerName = trainer.name;
        }
        else if (requesterRole === 'trainer') {
            const batch = yield (0, chat_access_1.findAssignedBatchForChat)(studentId, requesterId);
            if (!batch) {
                return res.status(403).json({ message: 'Not authorized: this student is not in your batch' });
            }
            trainerId = requesterId;
            // Fetch student name for chat header
            const student = yield user_model_1.default.findById(studentId).select('name');
            if (student)
                studentName = student.name;
        }
        else {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const messages = yield chat_message_model_1.default.find({ studentId, trainerId })
            .sort({ createdAt: 1 })
            .limit(50)
            .populate('senderId', 'name avatar _id');
        res.json({ messages, trainerId, trainerName, studentName });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching chat history', error });
    }
});
exports.getChatHistory = getChatHistory;
