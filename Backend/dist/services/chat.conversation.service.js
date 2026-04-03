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
exports.markConversationAsRead = exports.listUnreadConversationsForUser = exports.upsertConversationStateOnMessage = exports.emitChatConversationStateToUser = void 0;
const chat_conversation_state_model_1 = __importDefault(require("../models/chat.conversation.state.model"));
const socket_1 = require("../socket");
const roles_1 = require("../utils/roles");
const getReadFieldForRole = (role) => ((0, roles_1.isLearnerRole)(role) ? 'studentLastReadAt' : 'trainerLastReadAt');
const isConversationUnreadForUser = (conversation, userId, userRole) => {
    if (!userId || conversation.lastSenderId === userId) {
        return false;
    }
    const readAt = (0, roles_1.isLearnerRole)(userRole)
        ? conversation.studentLastReadAt
        : conversation.trainerLastReadAt;
    if (!readAt) {
        return true;
    }
    return conversation.lastMessageAt.getTime() > readAt.getTime();
};
const serializeConversationState = (conversation, hasUnread) => ({
    studentId: String(conversation.studentId),
    trainerId: String(conversation.trainerId),
    hasUnread,
    lastMessageAt: conversation.lastMessageAt || null,
});
const emitChatConversationStateToUser = (params) => {
    (0, socket_1.emitToUserRoom)(params.recipientUserId, 'chat:conversation-state', {
        studentId: params.studentId,
        trainerId: params.trainerId,
        hasUnread: params.hasUnread,
        lastMessageAt: params.lastMessageAt,
    });
};
exports.emitChatConversationStateToUser = emitChatConversationStateToUser;
const upsertConversationStateOnMessage = (_a) => __awaiter(void 0, [_a], void 0, function* ({ studentId, trainerId, senderId, senderRole, sentAt, }) {
    const senderReadField = getReadFieldForRole(senderRole);
    yield chat_conversation_state_model_1.default.findOneAndUpdate({ studentId, trainerId }, {
        $set: {
            lastMessageAt: sentAt,
            lastSenderId: senderId,
            [senderReadField]: sentAt,
        },
        $setOnInsert: {
            studentId,
            trainerId,
            studentLastReadAt: null,
            trainerLastReadAt: null,
        },
    }, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
    });
});
exports.upsertConversationStateOnMessage = upsertConversationStateOnMessage;
const listUnreadConversationsForUser = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = (0, roles_1.isLearnerRole)(params.userRole)
        ? { studentId: params.userId }
        : { trainerId: params.userId };
    const conversations = yield chat_conversation_state_model_1.default.find(filter)
        .sort({ lastMessageAt: -1 })
        .lean();
    return conversations
        .filter((conversation) => isConversationUnreadForUser({
        lastSenderId: String(conversation.lastSenderId),
        lastMessageAt: new Date(conversation.lastMessageAt),
        studentLastReadAt: conversation.studentLastReadAt ? new Date(conversation.studentLastReadAt) : null,
        trainerLastReadAt: conversation.trainerLastReadAt ? new Date(conversation.trainerLastReadAt) : null,
    }, params.userId, params.userRole))
        .map((conversation) => serializeConversationState({
        studentId: conversation.studentId,
        trainerId: conversation.trainerId,
        lastMessageAt: conversation.lastMessageAt,
    }, true));
});
exports.listUnreadConversationsForUser = listUnreadConversationsForUser;
const markConversationAsRead = (_a) => __awaiter(void 0, [_a], void 0, function* ({ studentId, trainerId, userId, userRole, }) {
    const conversation = yield chat_conversation_state_model_1.default.findOne({ studentId, trainerId });
    if (!conversation) {
        return null;
    }
    const readField = getReadFieldForRole(userRole);
    conversation.set(readField, conversation.lastMessageAt);
    yield conversation.save();
    const payload = serializeConversationState(conversation, false);
    (0, exports.emitChatConversationStateToUser)({
        recipientUserId: userId,
        studentId,
        trainerId,
        hasUnread: false,
        lastMessageAt: conversation.lastMessageAt,
    });
    return payload;
});
exports.markConversationAsRead = markConversationAsRead;
