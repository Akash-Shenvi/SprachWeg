"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const skillTrainingDetail_controller_1 = require("../controllers/skillTrainingDetail.controller");
const router = (0, express_1.Router)();
// Route to create or update details
router.post('/', skillTrainingDetail_controller_1.createOrUpdateDetail);
// Route to get details by skillCourseId
router.get('/:courseId', skillTrainingDetail_controller_1.getDetailByCourseId);
exports.default = router;
