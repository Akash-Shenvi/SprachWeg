import { Response } from 'express';
import ChatMessage from '../models/chat.message.model';
import User from '../models/user.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { findAssignedBatchForChat, resolveTrainerIdForStudentChat } from '../utils/chat-access';

// GET /api/chat/:studentId  — load last 50 messages in a private conversation
export const getChatHistory = async (req: AuthRequest, res: Response) => {
    try {
        const { studentId } = req.params;
        const requesterId = req.user?._id?.toString();
        const requesterRole = (req.user as any)?.role;
        const requestedTrainerId = typeof req.query.trainerId === 'string' ? req.query.trainerId : null;

        let trainerId: string;
        let trainerName = 'Trainer';
        let studentName = 'Student';

        if (requesterRole === 'student') {
            // Student can only fetch their own chat
            if (requesterId !== studentId) {
                return res.status(403).json({ message: 'Not authorized to view this chat' });
            }

            const trainerResolution = await resolveTrainerIdForStudentChat(studentId, requestedTrainerId);
            if (!trainerResolution.trainerId) {
                return res.status(trainerResolution.status).json({ message: trainerResolution.message });
            }

            trainerId = trainerResolution.trainerId;
            // Fetch trainer name for chat header
            const trainer = await User.findById(trainerId).select('name');
            if (trainer) trainerName = trainer.name;

        } else if (requesterRole === 'trainer') {
            const batch = await findAssignedBatchForChat(studentId, requesterId!);
            if (!batch) {
                return res.status(403).json({ message: 'Not authorized: this student is not in your batch' });
            }

            trainerId = requesterId!;
            // Fetch student name for chat header
            const student = await User.findById(studentId).select('name');
            if (student) studentName = student.name;
        } else {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const messages = await ChatMessage.find({ studentId, trainerId })
            .sort({ createdAt: 1 })
            .limit(50)
            .populate('senderId', 'name avatar _id');

        res.json({ messages, trainerId, trainerName, studentName });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching chat history', error });
    }
};
