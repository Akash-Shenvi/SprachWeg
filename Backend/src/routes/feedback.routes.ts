import { Router } from 'express';
import { submitFeedback, getAllFeedback, markFeedbackAsSolved } from '../controllers/feedback.controller';
import { protect, authorize } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// Public route to submit feedback
// Using 'upload.single("image")' to allow exactly 1 image upload
router.post('/', upload.single('image'), submitFeedback);

// Admin only routes
router.use(protect);
router.use(authorize('admin'));

router.get('/', getAllFeedback);
router.delete('/:id', markFeedbackAsSolved);

export default router;
