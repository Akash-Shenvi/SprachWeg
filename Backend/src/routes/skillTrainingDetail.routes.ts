import { Router } from 'express';
import { createOrUpdateDetail, getDetailByCourseId } from '../controllers/skillTrainingDetail.controller';

const router = Router();

// Route to create or update details
router.post('/', createOrUpdateDetail);

// Route to get details by skillCourseId
router.get('/:courseId', getDetailByCourseId);

export default router;
