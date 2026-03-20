import express from "express";
import {
    applyEnrollment,
    getMyEnrollments,
    getEnrollments,
    approveEnrollment,
    rejectEnrollment,
    getBatches,
    getBatchStudents,
    removeStudentFromBatch,
    deleteBatch,
    assignTrainer,
    getTrainers,
    promoteToTrainer,
    demoteTrainer
} from "../controllers/language.enrolment.controller";
import { isAuth, isAdmin } from "../middlewares/auth.middleware";



const router = express.Router();

router.post("/enroll", isAuth, applyEnrollment);

router.get("/my-enrollments", isAuth, getMyEnrollments);

router.get("/admin/enrollments", isAuth, isAdmin, getEnrollments);
router.post("/admin/enroll/:id/approve", isAuth, isAdmin, approveEnrollment);
router.post("/admin/enroll/:id/reject", isAuth, isAdmin, rejectEnrollment);
router.get("/admin/batches", isAuth, isAdmin, getBatches);
router.get("/admin/batches/:batchId/students", isAuth, isAdmin, getBatchStudents);
router.get("/admin/trainers", isAuth, isAdmin, getTrainers);
router.put("/admin/batches/:batchId/assign-trainer", isAuth, isAdmin, assignTrainer);
router.post("/admin/promote-trainer", isAuth, isAdmin, promoteToTrainer);
router.delete("/admin/trainers/:id", isAuth, isAdmin, demoteTrainer);
router.delete("/admin/batches/:batchId/students/:studentId", isAuth, isAdmin, removeStudentFromBatch);
router.delete("/admin/batches/:id", isAuth, isAdmin, deleteBatch);

export default router;
