import 'reflect-metadata';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import app from './app';
import { connectDB } from './config/database';
import { env } from './config/env';
import ChatMessage from './models/chat.message.model';
import LanguageBatch from './models/language.batch.model';

const startServer = async () => {
    await connectDB();

    const httpServer = http.createServer(app);

    const io = new SocketIOServer(httpServer, {
        path: '/api/socket.io',   // must match nginx /api/* proxy rule
        cors: {
            origin: [
                'https://training.sovirtechnologies.in'
            ],
            credentials: true,
        }
    });

    // ─── Socket.IO JWT Auth Middleware ───────────────────────────────────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication error: no token'));
        try {
            const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; role: string };
            (socket as any).userId = decoded.id;
            (socket as any).userRole = decoded.role;
            next();
        } catch {
            next(new Error('Authentication error: invalid token'));
        }
    });

    // ─── Socket.IO Connection Handler ────────────────────────────────────────────
    io.on('connection', (socket) => {
        const userId = (socket as any).userId as string;
        const userRole = (socket as any).userRole as string;

        // Client joins their private 1-on-1 room
        socket.on('joinRoom', async ({ studentId, trainerId }: { studentId: string; trainerId: string }) => {
            const isStudent = userRole === 'student' && userId === studentId;
            const isTrainer = (userRole === 'trainer' || userRole === 'admin') && userId === trainerId;
            if (!isStudent && !isTrainer) {
                socket.emit('error', { message: 'Not authorized for this chat room' });
                return;
            }
            const room = `chat_${studentId}_${trainerId}`;
            socket.join(room);
            console.log(`[Socket] User ${userId} (${userRole}) joined room: ${room}`);
        });

        // Client sends a message
        socket.on('sendMessage', async ({ studentId, trainerId, content }: { studentId: string; trainerId: string; content: string }) => {
            if (!content?.trim()) return;

            const isStudent = userRole === 'student' && userId === studentId;
            const isTrainer = (userRole === 'trainer' || userRole === 'admin') && userId === trainerId;

            if (!isStudent && !isTrainer) {
                socket.emit('error', { message: 'Not authorized to send messages in this chat' });
                return;
            }

            // For student: verify trainer is actually assigned to their batch
            if (isStudent) {
                const batch = await LanguageBatch.findOne({ students: studentId, trainerId });
                if (!batch) {
                    socket.emit('error', { message: 'No batch found linking you to this trainer' });
                    return;
                }
            }

            try {
                const message = await ChatMessage.create({
                    studentId,
                    trainerId,
                    senderId: userId,
                    content: content.trim(),
                    createdAt: new Date()
                });

                const populated = await message.populate('senderId', 'name avatar _id');

                const room = `chat_${studentId}_${trainerId}`;
                io.to(room).emit('newMessage', populated);
                console.log(`[Socket] Message sent in room: ${room}`);
            } catch (err) {
                console.error('[Socket] Failed to save message:', err);
                socket.emit('error', { message: 'Failed to send message' });
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
