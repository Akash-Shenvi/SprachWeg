import express from 'express';
import { authorize, protect } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import {
    addTrainerBatchAnnouncement,
    addTrainerBatchMaterial,
    createTrainerBatchAssessment,
    deleteTrainerBatchAnnouncement,
    deleteTrainerBatchClass,
    deleteTrainerBatchMaterial,
    endTrainerBatchClass,
    getTrainerBatchAssessmentDetail,
    getTrainerBatchAssessments,
    getTrainerBatchAnnouncements,
    getTrainerBatchClasses,
    getTrainerBatchDetails,
    getTrainerBatchMaterials,
    getTrainerBatchStudents,
    getTrainerBatches,
    joinTrainerBatchClass,
    scheduleTrainerBatchClass,
    submitTrainerBatchAssessment,
    updateTrainerBatchAttendance,
} from '../controllers/trainer.batch.controller';

const router = express.Router();

router.use(protect);

router.get('/mine', authorize('trainer'), getTrainerBatches);
router.get('/:trainingType/:batchId', getTrainerBatchDetails);
router.get('/:trainingType/:batchId/announcements', getTrainerBatchAnnouncements);
router.get('/:trainingType/:batchId/materials', getTrainerBatchMaterials);
router.get('/:trainingType/:batchId/students', getTrainerBatchStudents);
router.get('/:trainingType/:batchId/classes', getTrainerBatchClasses);
router.get('/:trainingType/:batchId/assessments', getTrainerBatchAssessments);
router.get('/:trainingType/assessments/:assessmentId', getTrainerBatchAssessmentDetail);

router.post('/:trainingType/announcements', authorize('trainer', 'admin'), addTrainerBatchAnnouncement);
router.delete('/:trainingType/announcements/:announcementId', authorize('trainer'), deleteTrainerBatchAnnouncement);
router.post('/:trainingType/materials', authorize('trainer', 'admin'), upload.single('file'), addTrainerBatchMaterial);
router.delete('/:trainingType/materials/:materialId', authorize('trainer'), deleteTrainerBatchMaterial);
router.post('/:trainingType/classes', authorize('trainer', 'admin'), scheduleTrainerBatchClass);
router.post('/:trainingType/assessments', authorize('trainer', 'admin'), createTrainerBatchAssessment);
router.post('/:trainingType/assessments/:assessmentId/submit', submitTrainerBatchAssessment);
router.delete('/:trainingType/classes/:classId', authorize('trainer'), deleteTrainerBatchClass);
router.post('/:trainingType/classes/:classId/end', authorize('trainer'), endTrainerBatchClass);
router.put('/:trainingType/classes/:classId/attendance', authorize('trainer'), updateTrainerBatchAttendance);
router.post('/:trainingType/classes/:classId/join', joinTrainerBatchClass);

export default router;
