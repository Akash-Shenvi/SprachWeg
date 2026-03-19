import { Request, Response } from 'express';
import FileLink from '../models/fileLink.model';
import fs from 'fs';
import path from 'path';

export const uploadFile = async (req: Request, res: Response) => {
    try {
        const filesFromFields = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const uploadedFiles = filesFromFields
            ? [...(filesFromFields.files ?? []), ...(filesFromFields.file ?? [])]
            : req.file
                ? [req.file]
                : [];

        if (uploadedFiles.length === 0) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const providedTitle = String(req.body.title ?? '').trim();

        const fileLinks = uploadedFiles.map((file, index) => {
            const fileUrl = `/api/uploads/admin_files/${file.filename}`;
            const derivedTitle = path.parse(file.originalname).name.trim() || `File ${index + 1}`;
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

        const savedFileLinks = await FileLink.insertMany(fileLinks);

        res.status(201).json({
            message: uploadedFiles.length === 1 ? 'File uploaded successfully' : 'Files uploaded successfully',
            files: savedFileLinks,
            uploadedCount: savedFileLinks.length,
        });
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
