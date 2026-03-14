import express from 'express';
import { getChatHistory } from '../controllers/chat.controller';
import { protect } from '../middlewares/auth.middleware';

const router = express.Router();

// GET /api/chat/:studentId — fetch last 50 messages for a student-trainer conversation
router.get('/:studentId', protect, getChatHistory);

export default router;
