import 'reflect-metadata';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import app from './app';
import { connectDB } from './config/database';
import { env } from './config/env';
import ChatMessage from './models/chat.message.model';
import User from './models/user.model';
import { emitChatConversationStateToUser, upsertConversationStateOnMessage } from './services/chat.conversation.service';
import { createNotifications, truncateNotificationText } from './services/notification.service';
import { getUserSocketRoom, setSocketServer } from './socket';
import { canAccessChatPair } from './utils/chat-access';

type SocketAck<T> = ((payload: T) => void) | undefined;

const socketAllowedOrigins = Array.from(
    new Set(
        [
            env.FRONTEND_BASE_URL,
            'https://training.sovirtechnologies.in',
        ]
            .map((value) => {
                try {
                    return new URL(value).origin;
                } catch {
                    return '';
                }
            })
            .filter(Boolean)
    )
);

const startServer = async () => {
    await connectDB();

    const httpServer = http.createServer(app);

    const io = new SocketIOServer(httpServer, {
        path: '/api/socket.io',   // must match nginx /api/* proxy rule
        cors: {
            origin: socketAllowedOrigins,
            credentials: true,
        }
    });
    setSocketServer(io);

    // ─── Socket.IO JWT Auth Middleware ───────────────────────────────────────────
    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication error: no token'));
        try {
            const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; role: string };
            const user = await User.findById(decoded.id).select('_id role');
            if (!user) {
                return next(new Error('Authentication error: user not found'));
            }

            (socket as any).userId = String(user._id);
            (socket as any).userRole = user.role;
            next();
        } catch {
            next(new Error('Authentication error: invalid token'));
        }
    });

    // ─── Socket.IO Connection Handler ────────────────────────────────────────────
    io.on('connection', (socket) => {
        const userId = (socket as any).userId as string;
        const userRole = (socket as any).userRole as string;
        socket.join(getUserSocketRoom(userId));

        // Client joins their private 1-on-1 room
        socket.on('joinRoom', async (
            { studentId, trainerId }: { studentId: string; trainerId: string },
            ack?: SocketAck<{ ok: boolean; message?: string; room?: string }>
        ) => {
            const sId = String(studentId);
            const tId = String(trainerId);
            try {
                const isAuthorized = await canAccessChatPair(userId, userRole, sId, tId);

                if (!isAuthorized) {
                    const message = 'Not authorized for this chat room';
                    socket.emit('error', { message });
                    ack?.({ ok: false, message });
                    return;
                }

                const room = `chat_${sId}_${tId}`;
                socket.join(room);
                ack?.({ ok: true, room });
                console.log(`[Socket] User ${userId} (${userRole}) joined room: ${room}`);
            } catch (error) {
                console.error('[Socket] Failed to join chat room:', error);
                const message = 'Failed to join chat room';
                socket.emit('error', { message });
                ack?.({ ok: false, message });
            }
        });

        // Client sends a message
        socket.on('sendMessage', async (
            { studentId, trainerId, content }: { studentId: string; trainerId: string; content: string },
            ack?: SocketAck<{ ok: boolean; message?: string; chatMessage?: unknown }>
        ) => {
            if (!content?.trim()) {
                ack?.({ ok: false, message: 'Message cannot be empty.' });
                return;
            }

            const sId = String(studentId);
            const tId = String(trainerId);
            try {
                const isAuthorized = await canAccessChatPair(userId, userRole, sId, tId);
                if (!isAuthorized) {
                    const message = 'Not authorized to send messages in this chat';
                    socket.emit('error', { message });
                    ack?.({ ok: false, message });
                    return;
                }

                const message = await ChatMessage.create({
                    studentId: sId,
                    trainerId: tId,
                    senderId: userId,
                    content: content.trim(),
                    createdAt: new Date()
                });

                const populated = await message.populate('senderId', 'name avatar _id');
                const serializedMessage = typeof populated.toObject === 'function' ? populated.toObject() : populated;
                const senderName = String((serializedMessage as any)?.senderId?.name || 'New message').trim();
                const sentAt = message.createdAt instanceof Date ? message.createdAt : new Date(message.createdAt);
                const recipientUserId = userRole === 'trainer' ? sId : tId;
                const linkPath = recipientUserId === sId
                    ? `/chat/${encodeURIComponent(sId)}?trainerId=${encodeURIComponent(tId)}`
                    : `/chat/${encodeURIComponent(sId)}`;

                const room = `chat_${sId}_${tId}`;
                io.to(room).emit('newMessage', serializedMessage);
                ack?.({ ok: true, chatMessage: serializedMessage });
                console.log(`[Socket] Message sent in room: ${room}`);

                // Keep message delivery reliable even if metadata/notification side-effects fail.
                void (async () => {
                    try {
                        await upsertConversationStateOnMessage({
                            studentId: sId,
                            trainerId: tId,
                            senderId: userId,
                            senderRole: userRole,
                            sentAt,
                        });

                        emitChatConversationStateToUser({
                            recipientUserId: userId,
                            studentId: sId,
                            trainerId: tId,
                            hasUnread: false,
                            lastMessageAt: sentAt,
                        });

                        emitChatConversationStateToUser({
                            recipientUserId,
                            studentId: sId,
                            trainerId: tId,
                            hasUnread: true,
                            lastMessageAt: sentAt,
                        });
                    } catch (stateError) {
                        console.error('[Socket] Failed to update chat conversation state:', stateError);
                    }

                    try {
                        await createNotifications({
                            recipientUserIds: [recipientUserId],
                            actorUserId: userId,
                            kind: 'chat_message',
                            title: `New message from ${senderName}`,
                            body: truncateNotificationText(content.trim(), 140),
                            linkPath,
                            metadata: {
                                messageId: String((serializedMessage as any)?._id || message._id),
                                studentId: sId,
                                trainerId: tId,
                                senderId: userId,
                                senderName,
                            },
                            allowedRoles: ['trainer', 'student', 'institution_student'],
                        });
                    } catch (notificationError) {
                        console.error('[Socket] Failed to create chat notification:', notificationError);
                    }
                })();
            } catch (err) {
                console.error('[Socket] Failed to save message:', err);
                const message = 'Failed to send message';
                socket.emit('error', { message });
                ack?.({ ok: false, message });
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] User ${userId} disconnected`);
        });
    });

    httpServer.listen(env.PORT, () => {
        console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });
};

startServer();
