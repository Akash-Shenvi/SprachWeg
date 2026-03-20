import express from 'express';
import { authorize, protect } from '../middlewares/auth.middleware';
import { enrollStudent, getPendingEnrollments, acceptEnrollment, rejectEnrollment } from '../controllers/enrollment.controller';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.post('/enroll', enrollStudent);
router.get('/pending', authorize('admin', 'trainer'), getPendingEnrollments);
router.post('/accept', authorize('admin', 'trainer'), acceptEnrollment);
router.post('/reject', authorize('admin', 'trainer'), rejectEnrollment);

export default router;
