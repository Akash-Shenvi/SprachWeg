"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const languageCourse_controller_1 = require("../controllers/languageCourse.controller");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// Multer setup for image upload
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/home/sovirtraining/file_serve/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage });
// Public Routes
router.get('/', languageCourse_controller_1.getAllLanguages);
router.get('/:id', languageCourse_controller_1.getLanguageById);
// Admin Routes
router.post('/', auth_middleware_1.protect, auth_middleware_1.isAdmin, upload.single('image'), languageCourse_controller_1.createLanguage);
router.put('/:id', auth_middleware_1.protect, auth_middleware_1.isAdmin, upload.single('image'), languageCourse_controller_1.updateLanguage);
router.delete('/:id', auth_middleware_1.protect, auth_middleware_1.isAdmin, languageCourse_controller_1.deleteLanguage);
exports.default = router;
