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
const chat_access_1 = require("./utils/chat-access");
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, database_1.connectDB)();
    const httpServer = http_1.default.createServer(app_1.default);
    const io = new socket_io_1.Server(httpServer, {
        path: '/api/socket.io', // must match nginx /api/* proxy rule
        cors: {
            origin: [
                'https://training.sovirtechnologies.in'
            ],
            credentials: true,
        }
    });
    // ─── Socket.IO JWT Auth Middleware ───────────────────────────────────────────
    io.use((socket, next) => {
        var _a;
        const token = (_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token;
        if (!token)
            return next(new Error('Authentication error: no token'));
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.userRole = decoded.role;
            next();
        }
        catch (_b) {
            next(new Error('Authentication error: invalid token'));
        }
    });
    // ─── Socket.IO Connection Handler ────────────────────────────────────────────
    io.on('connection', (socket) => {
        const userId = socket.userId;
        const userRole = socket.userRole;
        // Client joins their private 1-on-1 room
        socket.on('joinRoom', (_a) => __awaiter(void 0, [_a], void 0, function* ({ studentId, trainerId }) {
            const sId = String(studentId);
            const tId = String(trainerId);
            const isAuthorized = yield (0, chat_access_1.canAccessChatPair)(userId, userRole, sId, tId);
            if (!isAuthorized) {
                socket.emit('error', { message: 'Not authorized for this chat room' });
                return;
            }
            const room = `chat_${sId}_${tId}`;
            socket.join(room);
            console.log(`[Socket] User ${userId} (${userRole}) joined room: ${room}`);
        }));
        // Client sends a message
        socket.on('sendMessage', (_a) => __awaiter(void 0, [_a], void 0, function* ({ studentId, trainerId, content }) {
            if (!(content === null || content === void 0 ? void 0 : content.trim()))
                return;
            const sId = String(studentId);
            const tId = String(trainerId);
            const isAuthorized = yield (0, chat_access_1.canAccessChatPair)(userId, userRole, sId, tId);
            if (!isAuthorized) {
                socket.emit('error', { message: 'Not authorized to send messages in this chat' });
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
                const room = `chat_${sId}_${tId}`;
                io.to(room).emit('newMessage', populated);
                console.log(`[Socket] Message sent in room: ${room}`);
            }
            catch (err) {
                console.error('[Socket] Failed to save message:', err);
                socket.emit('error', { message: 'Failed to send message' });
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
