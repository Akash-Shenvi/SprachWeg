import express from 'express';
import multer from 'multer';
import {
    getAllInternshipApplications,
    getMyInternshipApplications,
    submitInternshipApplication,
} from '../controllers/internshipApplication.controller';
import { protect, isAdmin } from '../middlewares/auth.middleware';
import { uploadInternshipResume } from '../middlewares/uploadInternshipResume.middleware';

const router = express.Router();

const handleResumeUpload: express.RequestHandler = (req, res, next) => {
    uploadInternshipResume.single('resume')(req, res, (err) => {
        if (!err) {
            next();
            return;
        }

        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({ message: 'Resume must be 5 MB or less.' });
            return;
        }

        res.status(400).json({ message: err.message || 'Resume upload failed.' });
    });
};

router.post('/', protect, handleResumeUpload, submitInternshipApplication);
router.get('/me', protect, getMyInternshipApplications);
router.get('/admin', protect, isAdmin, getAllInternshipApplications);

export default router;
