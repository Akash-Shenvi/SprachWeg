import express from 'express';
import { protect, authorize } from '../middlewares/auth.middleware';
import {
    getTrainerBatches,
    addMaterial,
    addAnnouncement,
    getBatchDetails,
    getStudentBatches,
    deleteMaterial,
    deleteAnnouncement,
    scheduleClass,
    deleteClass,
    joinClass,
    endClass,
    updateAttendance,
    getBatchAnnouncements,
    getBatchMaterials,
    getBatchStudents,
    getBatchClasses
} from '../controllers/language.trainer.controller';
import { upload } from '../middlewares/upload.middleware';

const router = express.Router();

router.use(protect); // All routes require login

// Trainer Routes
router.get('/batches', authorize('trainer'), getTrainerBatches);
router.post('/materials', authorize('trainer'), upload.single('file'), addMaterial);
router.delete('/materials/:materialId', authorize('trainer'), deleteMaterial);
router.post('/announcements', authorize('trainer'), addAnnouncement);
router.delete('/announcements/:announcementId', authorize('trainer'), deleteAnnouncement);
router.post('/classes', authorize('trainer'), scheduleClass);
router.delete('/classes/:classId', authorize('trainer'), deleteClass);
router.post('/classes/:classId/end', authorize('trainer'), endClass);
router.put('/classes/:classId/attendance', authorize('trainer'), updateAttendance);

// Student Routes
router.get('/student/batches', getStudentBatches);

// Shared Routes (Student & Trainer)
router.get('/batch/:batchId', getBatchDetails);
router.post('/classes/:classId/join', joinClass);

// Paginated tab routes (Student & Trainer)
router.get('/batch/:batchId/announcements', getBatchAnnouncements);
router.get('/batch/:batchId/materials', getBatchMaterials);
router.get('/batch/:batchId/students', getBatchStudents);
router.get('/batch/:batchId/classes', getBatchClasses);

export default router;
