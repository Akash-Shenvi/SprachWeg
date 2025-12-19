import express from "express";
import {
    applyEnrollment,
    getMyEnrollments,
    getEnrollments,
    approveEnrollment,
    rejectEnrollment,
    getBatches,
    removeStudentFromBatch,
    deleteBatch,
    assignTrainer,
    getTrainers,
    promoteToTrainer
} from "../controllers/language.enrolment.controller";
import { isAuth, isAdmin } from "../middlewares/auth.middleware";



const router = express.Router();

router.post("/enroll", isAuth, applyEnrollment);

router.get("/my-enrollments", isAuth, getMyEnrollments);

router.get("/admin/enrollments", isAuth, getEnrollments);
router.post("/admin/enroll/:id/approve", isAuth, approveEnrollment);
router.post("/admin/enroll/:id/reject", isAuth, rejectEnrollment);
router.get("/admin/batches", isAuth, getBatches);
router.get("/admin/trainers", isAuth, getTrainers);
router.put("/admin/batches/:batchId/assign-trainer", isAuth, assignTrainer);
router.post("/admin/promote-trainer", isAuth, promoteToTrainer);
router.delete("/admin/batches/:batchId/students/:studentId", isAuth, removeStudentFromBatch);
router.delete("/admin/batches/:id", isAuth, deleteBatch);

export default router;
