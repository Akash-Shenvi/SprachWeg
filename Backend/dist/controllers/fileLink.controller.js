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
    var _a, _b, _c;
    try {
        const filesFromFields = req.files;
        const uploadedFiles = filesFromFields
            ? [...((_a = filesFromFields.files) !== null && _a !== void 0 ? _a : []), ...((_b = filesFromFields.file) !== null && _b !== void 0 ? _b : [])]
            : req.file
                ? [req.file]
                : [];
        if (uploadedFiles.length === 0) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const providedTitle = String((_c = req.body.title) !== null && _c !== void 0 ? _c : '').trim();
        const fileLinks = uploadedFiles.map((file, index) => {
            const fileUrl = `/api/uploads/admin_files/${file.filename}`;
            const derivedTitle = path_1.default.parse(file.originalname).name.trim() || `File ${index + 1}`;
            const title = providedTitle
                ? uploadedFiles.length === 1
                    ? providedTitle
                    : `${providedTitle} - ${derivedTitle}`
                : derivedTitle;
            return {
                title,
                fileUrl,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
            };
        });
        const savedFileLinks = yield fileLink_model_1.default.insertMany(fileLinks);
        res.status(201).json({
            message: uploadedFiles.length === 1 ? 'File uploaded successfully' : 'Files uploaded successfully',
            files: savedFileLinks,
            uploadedCount: savedFileLinks.length,
        });
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
