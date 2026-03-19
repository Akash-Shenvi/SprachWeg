import express from 'express';
import { uploadFile, getFiles, deleteFile } from '../controllers/fileLink.controller';
import { uploadAny } from '../middlewares/uploadAny.middleware';
import { protect, isAdmin } from '../middlewares/auth.middleware';

const router = express.Router();

// Only admin should be able to upload, list and delete file links
router.post(
    '/upload',
    protect,
    isAdmin,
    uploadAny.fields([
        { name: 'files', maxCount: 20 },
        { name: 'file', maxCount: 1 },
    ]),
    uploadFile
);
router.get('/', protect, isAdmin, getFiles);
router.delete('/:id', protect, isAdmin, deleteFile);

export default router;
