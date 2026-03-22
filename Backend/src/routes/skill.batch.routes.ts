import express from 'express';
import { protect } from '../middlewares/auth.middleware';
import {
    getSkillBatchAnnouncements,
    getSkillBatchClasses,
    getSkillBatchDetails,
    getSkillBatchMaterials,
    getSkillBatchStudents,
} from '../controllers/skill.batch.controller';

const router = express.Router();

router.use(protect);

router.get('/:batchId', getSkillBatchDetails);
router.get('/:batchId/announcements', getSkillBatchAnnouncements);
router.get('/:batchId/materials', getSkillBatchMaterials);
router.get('/:batchId/students', getSkillBatchStudents);
router.get('/:batchId/classes', getSkillBatchClasses);

export default router;
