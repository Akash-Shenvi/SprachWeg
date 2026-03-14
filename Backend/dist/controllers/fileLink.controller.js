"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.getFiles = exports.uploadFile = void 0;
const fileLink_model_1 = __importDefault(require("../models/fileLink.model"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uploadFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }
        // In app.ts: app.use('/api/uploads', express.static('/home/sovirtraining/file_serve'));
        // If file goes to /home/sovirtraining/file_serve/admin_files/filename.ext
        // The URL should be /api/uploads/admin_files/filename.ext
        const fileUrl = `/api/uploads/admin_files/${req.file.filename}`;
        const newFileLink = new fileLink_model_1.default({
            title,
            fileUrl,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size
        });
        yield newFileLink.save();
        res.status(201).json(newFileLink);
    }
    catch (error) {
        console.error('Error in uploadFile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.uploadFile = uploadFile;
const getFiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const files = yield fileLink_model_1.default.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
        const total = yield fileLink_model_1.default.countDocuments();
        res.status(200).json({
            files,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalItems: total
        });
    }
    catch (error) {
        console.error('Error in getFiles:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getFiles = getFiles;
const deleteFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const fileLink = yield fileLink_model_1.default.findById(id);
        if (!fileLink) {
            return res.status(404).json({ message: 'File link not found' });
        }
        // The URL is like /api/uploads/admin_files/filename.ext
        const filename = fileLink.fileUrl.split('/').pop();
        if (filename) {
            const uploadDir = '/home/sovirtraining/file_serve/admin_files';
            const filePath = path_1.default.join(uploadDir, filename);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
        }
        yield fileLink_model_1.default.findByIdAndDelete(id);
        res.status(200).json({ message: 'File deleted successfully' });
    }
    catch (error) {
        console.error('Error in deleteFile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.deleteFile = deleteFile;
