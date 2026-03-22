import express from 'express';
import {
    approveInstitutionRequest,
    deleteRejectedInstitutionRequest,
    getAdminInstitutionRequests,
    rejectInstitutionRequest,
} from '../controllers/institution.controller';
import { protect, isAdmin } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(protect, isAdmin);

router.get('/requests', getAdminInstitutionRequests);
router.post('/requests/:id/approve', approveInstitutionRequest);
router.post('/requests/:id/reject', rejectInstitutionRequest);
router.delete('/requests/:id', deleteRejectedInstitutionRequest);

export default router;
