import express from 'express';
import multer from 'multer';
import {
    deleteInternshipPaymentAttempt,
    deleteRejectedInternshipApplication,
    getAllInternshipApplications,
    getAllInternshipPaymentAttempts,
    getMyEnrolledInternships,
    getMyInternshipApplications,
    handleInternshipPaymentWebhook,
    recordInternshipPaymentFailure,
    submitInternshipApplication,
    verifyInternshipPayment,
    updateInternshipApplicationStatus,
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

router.post('/webhook', handleInternshipPaymentWebhook);
router.post('/', protect, handleResumeUpload, submitInternshipApplication);
router.post('/verify-payment', protect, verifyInternshipPayment);
router.post('/payment-failure', protect, recordInternshipPaymentFailure);
router.get('/me', protect, getMyInternshipApplications);
router.get('/me/enrolled', protect, getMyEnrolledInternships);
router.get('/admin', protect, isAdmin, getAllInternshipApplications);
router.get('/admin/payment-attempts', protect, isAdmin, getAllInternshipPaymentAttempts);
router.delete('/admin/payment-attempts/:id', protect, isAdmin, deleteInternshipPaymentAttempt);
router.patch('/admin/:id/status', protect, isAdmin, updateInternshipApplicationStatus);
router.delete('/admin/:id', protect, isAdmin, deleteRejectedInternshipApplication);

export default router;
