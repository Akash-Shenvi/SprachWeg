import express from 'express';
import { getStudents, getStudentDetails } from '../controllers/student.controller';
import { protect, isAdmin } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/students', protect, isAdmin, getStudents);
router.get('/students/:id/details', protect, isAdmin, getStudentDetails);

export default router;
