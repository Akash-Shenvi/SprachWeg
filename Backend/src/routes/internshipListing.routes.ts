import express from 'express';
import {
    createInternship,
    deleteInternship,
    getAdminInternships,
    getInternshipBySlug,
    getPublicInternships,
    updateInternship,
} from '../controllers/internshipListing.controller';
import { isAdmin, protect } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/', getPublicInternships);
router.get('/admin', protect, isAdmin, getAdminInternships);
router.post('/admin', protect, isAdmin, createInternship);
router.put('/admin/:id', protect, isAdmin, updateInternship);
router.delete('/admin/:id', protect, isAdmin, deleteInternship);
router.get('/:slug', getInternshipBySlug);

export default router;
