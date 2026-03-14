"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const skillCourse_controller_1 = require("../controllers/skillCourse.controller");
const multer_1 = require("../config/multer");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get('/', skillCourse_controller_1.getAllCourses);
// Protected routes (Only Admin)
router.post('/', auth_middleware_1.protect, auth_middleware_1.isAdmin, multer_1.upload.single('image'), skillCourse_controller_1.createCourse);
router.put('/:id', auth_middleware_1.protect, auth_middleware_1.isAdmin, multer_1.upload.single('image'), skillCourse_controller_1.updateCourse);
router.delete('/:id', auth_middleware_1.protect, auth_middleware_1.isAdmin, skillCourse_controller_1.deleteCourse);
exports.default = router;
