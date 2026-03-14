"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const feedback_controller_1 = require("../controllers/feedback.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
// Public route to submit feedback
// Using 'upload.single("image")' to allow exactly 1 image upload
router.post('/', upload_middleware_1.upload.single('image'), feedback_controller_1.submitFeedback);
// Admin only routes
router.use(auth_middleware_1.protect);
router.use((0, auth_middleware_1.authorize)('admin'));
router.get('/', feedback_controller_1.getAllFeedback);
router.delete('/:id', feedback_controller_1.markFeedbackAsSolved);
exports.default = router;
