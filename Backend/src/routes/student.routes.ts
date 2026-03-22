import express from 'express';
import {
    assignActiveClassTrainer,
    deleteActiveClass,
    deleteUser,
    getActiveClassStudents,
    getActiveClasses,
    getPendingAdminEnrollments,
    getStudents,
    getStudentDetails,
    removeStudentFromActiveClass,
} from '../controllers/student.controller';
import { protect, isAdmin } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/enrollments/pending', protect, isAdmin, getPendingAdminEnrollments);
router.get('/active-classes', protect, isAdmin, getActiveClasses);
router.get('/active-classes/:id/students', protect, isAdmin, getActiveClassStudents);
router.put('/active-classes/:id/assign-trainer', protect, isAdmin, assignActiveClassTrainer);
router.delete('/active-classes/:id/students/:studentId', protect, isAdmin, removeStudentFromActiveClass);
router.delete('/active-classes/:id', protect, isAdmin, deleteActiveClass);
router.get('/users', protect, isAdmin, getStudents);
router.get('/students', protect, isAdmin, getStudents);
router.delete('/users/:id', protect, isAdmin, deleteUser);
router.get('/users/:id/details', protect, isAdmin, getStudentDetails);
router.get('/students/:id/details', protect, isAdmin, getStudentDetails);

export default router;
