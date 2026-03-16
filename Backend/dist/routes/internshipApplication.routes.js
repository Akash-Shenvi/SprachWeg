"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const internshipApplication_controller_1 = require("../controllers/internshipApplication.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const uploadInternshipResume_middleware_1 = require("../middlewares/uploadInternshipResume.middleware");
const router = express_1.default.Router();
const handleResumeUpload = (req, res, next) => {
    uploadInternshipResume_middleware_1.uploadInternshipResume.single('resume')(req, res, (err) => {
        if (!err) {
            next();
            return;
        }
        if (err instanceof multer_1.default.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({ message: 'Resume must be 5 MB or less.' });
            return;
        }
        res.status(400).json({ message: err.message || 'Resume upload failed.' });
    });
};
router.post('/', auth_middleware_1.protect, handleResumeUpload, internshipApplication_controller_1.submitInternshipApplication);
router.get('/me', auth_middleware_1.protect, internshipApplication_controller_1.getMyInternshipApplications);
router.get('/admin', auth_middleware_1.protect, auth_middleware_1.isAdmin, internshipApplication_controller_1.getAllInternshipApplications);
exports.default = router;
