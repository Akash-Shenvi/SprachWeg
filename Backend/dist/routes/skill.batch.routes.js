"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const skill_batch_controller_1 = require("../controllers/skill.batch.controller");
const router = express_1.default.Router();
router.use(auth_middleware_1.protect);
router.get('/:batchId', skill_batch_controller_1.getSkillBatchDetails);
router.get('/:batchId/announcements', skill_batch_controller_1.getSkillBatchAnnouncements);
router.get('/:batchId/materials', skill_batch_controller_1.getSkillBatchMaterials);
router.get('/:batchId/students', skill_batch_controller_1.getSkillBatchStudents);
router.get('/:batchId/classes', skill_batch_controller_1.getSkillBatchClasses);
exports.default = router;
