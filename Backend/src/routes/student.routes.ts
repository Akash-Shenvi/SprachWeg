import express from 'express';
import { getPendingAdminEnrollments, getStudents, getStudentDetails } from '../controllers/student.controller';
import { protect, isAdmin } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/enrollments/pending', protect, isAdmin, getPendingAdminEnrollments);
router.get('/users', protect, isAdmin, getStudents);
router.get('/students', protect, isAdmin, getStudents);
router.get('/users/:id/details', protect, isAdmin, getStudentDetails);
router.get('/students/:id/details', protect, isAdmin, getStudentDetails);

export default router;
