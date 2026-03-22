import express from 'express';
import {
    createInstitutionSubmission,
    getInstitutionDashboard,
    getInstitutionSubmissions,
} from '../controllers/institution.controller';
import { protect, authorize } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(protect, authorize('institution'));

router.get('/dashboard', getInstitutionDashboard);
router.get('/submissions', getInstitutionSubmissions);
router.post('/submissions', createInstitutionSubmission);

export default router;
