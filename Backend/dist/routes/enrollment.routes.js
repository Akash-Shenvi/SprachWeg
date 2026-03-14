"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const enrollment_controller_1 = require("../controllers/enrollment.controller");
const router = express_1.default.Router();
// Apply auth middleware to all routes
router.use(auth_middleware_1.protect);
router.post('/enroll', enrollment_controller_1.enrollStudent);
router.get('/pending', enrollment_controller_1.getPendingEnrollments);
router.post('/accept', enrollment_controller_1.acceptEnrollment);
router.post('/reject', enrollment_controller_1.rejectEnrollment);
exports.default = router;
