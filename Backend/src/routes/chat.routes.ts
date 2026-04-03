import express from 'express';
import { getChatHistory, getUnreadChatConversations, readChatConversation } from '../controllers/chat.controller';
import { protect } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/conversations/unread', protect, getUnreadChatConversations);
router.patch('/:studentId/read', protect, readChatConversation);

// GET /api/chat/:studentId — fetch last 50 messages for a student-trainer conversation
router.get('/:studentId', protect, getChatHistory);

export default router;
