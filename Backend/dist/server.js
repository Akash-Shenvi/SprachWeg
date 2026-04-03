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
require("reflect-metadata");
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const env_1 = require("./config/env");
const chat_message_model_1 = __importDefault(require("./models/chat.message.model"));
const user_model_1 = __importDefault(require("./models/user.model"));
const chat_conversation_service_1 = require("./services/chat.conversation.service");
const notification_service_1 = require("./services/notification.service");
const socket_1 = require("./socket");
const chat_access_1 = require("./utils/chat-access");
const socketAllowedOrigins = Array.from(new Set([
    env_1.env.FRONTEND_BASE_URL,
    'https://training.sovirtechnologies.in',
]
    .map((value) => {
    try {
        return new URL(value).origin;
    }
    catch (_a) {
        return '';
    }
})
    .filter(Boolean)));
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, database_1.connectDB)();
    const httpServer = http_1.default.createServer(app_1.default);
    const io = new socket_io_1.Server(httpServer, {
        path: '/api/socket.io', // must match nginx /api/* proxy rule
        cors: {
            origin: socketAllowedOrigins,
            credentials: true,
        }
    });
    (0, socket_1.setSocketServer)(io);
    // ─── Socket.IO JWT Auth Middleware ───────────────────────────────────────────
    io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const token = (_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token;
        if (!token)
            return next(new Error('Authentication error: no token'));
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
            const user = yield user_model_1.default.findById(decoded.id).select('_id role');
            if (!user) {
                return next(new Error('Authentication error: user not found'));
            }
            socket.userId = String(user._id);
            socket.userRole = user.role;
            next();
        }
        catch (_b) {
            next(new Error('Authentication error: invalid token'));
        }
    }));
    // ─── Socket.IO Connection Handler ────────────────────────────────────────────
    io.on('connection', (socket) => {
        const userId = socket.userId;
        const userRole = socket.userRole;
        socket.join((0, socket_1.getUserSocketRoom)(userId));
        // Client joins their private 1-on-1 room
        socket.on('joinRoom', (_a, ack_1) => __awaiter(void 0, [_a, ack_1], void 0, function* ({ studentId, trainerId }, ack) {
            const sId = String(studentId);
            const tId = String(trainerId);
            const isAuthorized = yield (0, chat_access_1.canAccessChatPair)(userId, userRole, sId, tId);
            if (!isAuthorized) {
                const message = 'Not authorized for this chat room';
                socket.emit('error', { message });
                ack === null || ack === void 0 ? void 0 : ack({ ok: false, message });
                return;
            }
            const room = `chat_${sId}_${tId}`;
            socket.join(room);
            ack === null || ack === void 0 ? void 0 : ack({ ok: true, room });
            console.log(`[Socket] User ${userId} (${userRole}) joined room: ${room}`);
        }));
        // Client sends a message
        socket.on('sendMessage', (_a, ack_1) => __awaiter(void 0, [_a, ack_1], void 0, function* ({ studentId, trainerId, content }, ack) {
            var _b;
            if (!(content === null || content === void 0 ? void 0 : content.trim())) {
                ack === null || ack === void 0 ? void 0 : ack({ ok: false, message: 'Message cannot be empty.' });
                return;
            }
            const sId = String(studentId);
            const tId = String(trainerId);
            const isAuthorized = yield (0, chat_access_1.canAccessChatPair)(userId, userRole, sId, tId);
            if (!isAuthorized) {
                const message = 'Not authorized to send messages in this chat';
                socket.emit('error', { message });
                ack === null || ack === void 0 ? void 0 : ack({ ok: false, message });
                return;
            }
            try {
                const message = yield chat_message_model_1.default.create({
                    studentId: sId,
                    trainerId: tId,
                    senderId: userId,
                    content: content.trim(),
                    createdAt: new Date()
                });
                const populated = yield message.populate('senderId', 'name avatar _id');
                const serializedMessage = typeof populated.toObject === 'function' ? populated.toObject() : populated;
                const senderName = String(((_b = serializedMessage === null || serializedMessage === void 0 ? void 0 : serializedMessage.senderId) === null || _b === void 0 ? void 0 : _b.name) || 'New message').trim();
                const sentAt = message.createdAt instanceof Date ? message.createdAt : new Date(message.createdAt);
                const recipientUserId = userRole === 'trainer' ? sId : tId;
                const linkPath = recipientUserId === sId
                    ? `/chat/${encodeURIComponent(sId)}?trainerId=${encodeURIComponent(tId)}`
                    : `/chat/${encodeURIComponent(sId)}`;
                yield (0, chat_conversation_service_1.upsertConversationStateOnMessage)({
                    studentId: sId,
                    trainerId: tId,
                    senderId: userId,
                    senderRole: userRole,
                    sentAt,
                });
                const room = `chat_${sId}_${tId}`;
                io.to(room).emit('newMessage', serializedMessage);
                (0, chat_conversation_service_1.emitChatConversationStateToUser)({
                    recipientUserId: userId,
                    studentId: sId,
                    trainerId: tId,
                    hasUnread: false,
                    lastMessageAt: sentAt,
                });
                (0, chat_conversation_service_1.emitChatConversationStateToUser)({
                    recipientUserId,
                    studentId: sId,
                    trainerId: tId,
                    hasUnread: true,
                    lastMessageAt: sentAt,
                });
                yield (0, notification_service_1.createNotifications)({
                    recipientUserIds: [recipientUserId],
                    actorUserId: userId,
                    kind: 'chat_message',
                    title: `New message from ${senderName}`,
                    body: (0, notification_service_1.truncateNotificationText)(content.trim(), 140),
                    linkPath,
                    metadata: {
                        messageId: String((serializedMessage === null || serializedMessage === void 0 ? void 0 : serializedMessage._id) || message._id),
                        studentId: sId,
                        trainerId: tId,
                        senderId: userId,
                        senderName,
                    },
                    allowedRoles: ['trainer', 'student', 'institution_student'],
                });
                ack === null || ack === void 0 ? void 0 : ack({ ok: true, chatMessage: serializedMessage });
                console.log(`[Socket] Message sent in room: ${room}`);
            }
            catch (err) {
                console.error('[Socket] Failed to save message:', err);
                const message = 'Failed to send message';
                socket.emit('error', { message });
                ack === null || ack === void 0 ? void 0 : ack({ ok: false, message });
            }
        }));
        socket.on('disconnect', () => {
            console.log(`[Socket] User ${userId} disconnected`);
        });
    });
    httpServer.listen(env_1.env.PORT, () => {
        console.log(`Server running in ${env_1.env.NODE_ENV} mode on port ${env_1.env.PORT}`);
    });
});
startServer();
