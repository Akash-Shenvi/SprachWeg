import { Response } from 'express';
import ChatMessage from '../models/chat.message.model';
import LanguageBatch from '../models/language.batch.model';
import User from '../models/user.model';
import { AuthRequest } from '../middlewares/auth.middleware';

// GET /api/chat/:studentId  — load last 50 messages in a private conversation
export const getChatHistory = async (req: AuthRequest, res: Response) => {
    try {
        const { studentId } = req.params;
        const requesterId = req.user?._id?.toString();
        const requesterRole = (req.user as any)?.role;

        let trainerId: string;
        let trainerName = 'Trainer';
        let studentName = 'Student';

        if (requesterRole === 'student') {
            // Student can only fetch their own chat
            if (requesterId !== studentId) {
                return res.status(403).json({ message: 'Not authorized to view this chat' });
            }
            // Find the student's assigned trainer via batch
            const batch = await LanguageBatch.findOne({ students: studentId, trainerId: { $exists: true, $ne: null } });
            if (!batch || !batch.trainerId) {
                return res.status(404).json({ message: 'No trainer assigned to this student yet' });
            }
            trainerId = batch.trainerId.toString();
            // Fetch trainer name for chat header
            const trainer = await User.findById(trainerId).select('name');
            if (trainer) trainerName = trainer.name;

        } else if (requesterRole === 'trainer' || requesterRole === 'admin') {
            if (requesterRole === 'trainer') {
                const batch = await LanguageBatch.findOne({ students: studentId, trainerId: requesterId });
                if (!batch) {
                    return res.status(403).json({ message: 'Not authorized: this student is not in your batch' });
                }
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
