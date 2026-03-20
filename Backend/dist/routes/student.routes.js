"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const student_controller_1 = require("../controllers/student.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.get('/enrollments/pending', auth_middleware_1.protect, auth_middleware_1.isAdmin, student_controller_1.getPendingAdminEnrollments);
router.get('/students', auth_middleware_1.protect, auth_middleware_1.isAdmin, student_controller_1.getStudents);
router.get('/students/:id/details', auth_middleware_1.protect, auth_middleware_1.isAdmin, student_controller_1.getStudentDetails);
exports.default = router;
