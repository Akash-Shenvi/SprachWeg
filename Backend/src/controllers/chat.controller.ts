import { Response } from 'express';
import ChatMessage from '../models/chat.message.model';
import User from '../models/user.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { listUnreadConversationsForUser, markConversationAsRead } from '../services/chat.conversation.service';
import { findAssignedBatchForChat, resolveTrainerIdForStudentChat } from '../utils/chat-access';
import { isLearnerRole } from '../utils/roles';

const resolveChatPairForRequest = async (req: AuthRequest, studentId: string, requestedTrainerId?: string | null) => {
    const requesterId = req.user?._id?.toString();
    const requesterRole = (req.user as any)?.role;

    if (!requesterId) {
        return { status: 401, message: 'Not authorized' } as const;
    }

    if (isLearnerRole(requesterRole)) {
        if (requesterId !== studentId) {
            return { status: 403, message: 'Not authorized to view this chat' } as const;
        }

        const trainerResolution = await resolveTrainerIdForStudentChat(studentId, requestedTrainerId);
        if (!trainerResolution.trainerId) {
            return { status: trainerResolution.status, message: trainerResolution.message } as const;
        }

        return {
            requesterId,
            requesterRole,
            studentId,
            trainerId: trainerResolution.trainerId,
        } as const;
    }

    if (requesterRole === 'trainer') {
        const batch = await findAssignedBatchForChat(studentId, requesterId);
        if (!batch) {
            return { status: 403, message: 'Not authorized: this student is not in your batch' } as const;
        }

        return {
            requesterId,
            requesterRole,
            studentId,
            trainerId: requesterId,
        } as const;
    }

    return { status: 403, message: 'Not authorized' } as const;
};

// GET /api/chat/:studentId - load last 50 messages in a private conversation
export const getChatHistory = async (req: AuthRequest, res: Response) => {
    try {
        const { studentId } = req.params;
        const requestedTrainerId = typeof req.query.trainerId === 'string' ? req.query.trainerId : null;
        const chatPair = await resolveChatPairForRequest(req, studentId, requestedTrainerId);
        let trainerName = 'Trainer';
        let studentName = 'Student';

        if ('status' in chatPair && typeof chatPair.status === 'number') {
            return res.status(chatPair.status).json({ message: chatPair.message });
        }

        if (isLearnerRole(chatPair.requesterRole)) {
            const trainer = await User.findById(chatPair.trainerId).select('name');
            if (trainer) {
                trainerName = trainer.name;
            }
        } else {
            const student = await User.findById(studentId).select('name');
            if (student) {
                studentName = student.name;
            }
        }

        const messages = await ChatMessage.find({ studentId, trainerId: chatPair.trainerId })
            .sort({ createdAt: 1 })
            .limit(50)
            .populate('senderId', 'name avatar _id');

        return res.json({
            messages,
            trainerId: chatPair.trainerId,
            trainerName,
            studentName,
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching chat history', error });
    }
};

export const getUnreadChatConversations = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id?.toString();
        const userRole = (req.user as any)?.role;

        if (!userId || (!isLearnerRole(userRole) && userRole !== 'trainer')) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const conversations = await listUnreadConversationsForUser({ userId, userRole });
        return res.status(200).json({ data: conversations });
    } catch (error) {
        console.error('Failed to fetch unread chat conversations:', error);
        return res.status(500).json({ message: 'Failed to fetch unread chat conversations' });
    }
};

export const readChatConversation = async (req: AuthRequest, res: Response) => {
    try {
        const { studentId } = req.params;
        const requestedTrainerId = typeof req.body?.trainerId === 'string'
            ? req.body.trainerId
            : (typeof req.query.trainerId === 'string' ? req.query.trainerId : null);
        const chatPair = await resolveChatPairForRequest(req, studentId, requestedTrainerId);

        if ('status' in chatPair && typeof chatPair.status === 'number') {
            return res.status(chatPair.status).json({ message: chatPair.message });
        }

        const conversation = await markConversationAsRead({
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
    } catch (error) {
        console.error('Failed to mark chat conversation as read:', error);
        return res.status(500).json({ message: 'Failed to mark chat conversation as read' });
    }
};
