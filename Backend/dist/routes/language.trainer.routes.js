"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const language_trainer_controller_1 = require("../controllers/language.trainer.controller");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.protect); // All routes require login
// Trainer Routes
router.get('/batches', (0, auth_middleware_1.authorize)('trainer'), language_trainer_controller_1.getTrainerBatches);
router.post('/materials', (0, auth_middleware_1.authorize)('trainer'), upload_middleware_1.upload.single('file'), language_trainer_controller_1.addMaterial);
router.delete('/materials/:materialId', (0, auth_middleware_1.authorize)('trainer'), language_trainer_controller_1.deleteMaterial);
router.post('/announcements', (0, auth_middleware_1.authorize)('trainer'), language_trainer_controller_1.addAnnouncement);
router.delete('/announcements/:announcementId', (0, auth_middleware_1.authorize)('trainer'), language_trainer_controller_1.deleteAnnouncement);
router.post('/classes', (0, auth_middleware_1.authorize)('trainer'), language_trainer_controller_1.scheduleClass);
router.delete('/classes/:classId', (0, auth_middleware_1.authorize)('trainer'), language_trainer_controller_1.deleteClass);
router.post('/classes/:classId/end', (0, auth_middleware_1.authorize)('trainer'), language_trainer_controller_1.endClass);
router.put('/classes/:classId/attendance', (0, auth_middleware_1.authorize)('trainer'), language_trainer_controller_1.updateAttendance);
// Student Routes
router.get('/student/batches', language_trainer_controller_1.getStudentBatches);
// Shared Routes (Student & Trainer)
router.get('/batch/:batchId', language_trainer_controller_1.getBatchDetails);
router.post('/classes/:classId/join', language_trainer_controller_1.joinClass);
// Paginated tab routes (Student & Trainer)
router.get('/batch/:batchId/announcements', language_trainer_controller_1.getBatchAnnouncements);
router.get('/batch/:batchId/materials', language_trainer_controller_1.getBatchMaterials);
router.get('/batch/:batchId/students', language_trainer_controller_1.getBatchStudents);
router.get('/batch/:batchId/classes', language_trainer_controller_1.getBatchClasses);
exports.default = router;
