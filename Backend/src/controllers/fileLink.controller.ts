import { Request, Response } from 'express';
import FileLink from '../models/fileLink.model';
import fs from 'fs';
import path from 'path';

export const uploadFile = async (req: Request, res: Response) => {
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

        const newFileLink = new FileLink({
            title,
            fileUrl,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size
        });

        await newFileLink.save();

        res.status(201).json(newFileLink);
    } catch (error) {
        console.error('Error in uploadFile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getFiles = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const files = await FileLink.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
        const total = await FileLink.countDocuments();

        res.status(200).json({
            files,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalItems: total
        });
    } catch (error) {
        console.error('Error in getFiles:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteFile = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const fileLink = await FileLink.findById(id);

        if (!fileLink) {
            return res.status(404).json({ message: 'File link not found' });
        }

        // The URL is like /api/uploads/admin_files/filename.ext
        const filename = fileLink.fileUrl.split('/').pop();
        if (filename) {
            const uploadDir = '/home/sovirtraining/file_serve/admin_files';
            const filePath = path.join(uploadDir, filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await FileLink.findByIdAndDelete(id);

        res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error in deleteFile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
