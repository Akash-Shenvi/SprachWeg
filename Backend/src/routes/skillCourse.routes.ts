import { Router } from 'express';
import { createCourse, getAllCourses, updateCourse, deleteCourse } from '../controllers/skillCourse.controller';
import { upload } from '../config/multer';
// Import auth middleware if you have one, e.g. verifyToken
// import { verifyToken, isAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/', getAllCourses);

// Protected routes (Add middleware when available)
// For now, assuming anyone can add for development or if auth middleware is ready use it
// router.post('/', verifyToken, isAdmin, upload.single('image'), createCourse);
router.post('/', upload.single('image'), createCourse);
router.put('/:id', upload.single('image'), updateCourse);
router.delete('/:id', deleteCourse);

export default router;
