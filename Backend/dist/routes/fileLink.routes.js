"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fileLink_controller_1 = require("../controllers/fileLink.controller");
const uploadAny_middleware_1 = require("../middlewares/uploadAny.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// Only admin should be able to upload, list and delete file links
router.post('/upload', auth_middleware_1.protect, auth_middleware_1.isAdmin, uploadAny_middleware_1.uploadAny.fields([
    { name: 'files', maxCount: 20 },
    { name: 'file', maxCount: 1 },
]), fileLink_controller_1.uploadFile);
router.get('/', auth_middleware_1.protect, auth_middleware_1.isAdmin, fileLink_controller_1.getFiles);
router.delete('/:id', auth_middleware_1.protect, auth_middleware_1.isAdmin, fileLink_controller_1.deleteFile);
exports.default = router;
