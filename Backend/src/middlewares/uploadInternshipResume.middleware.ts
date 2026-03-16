import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = '/home/sovirtraining/file_serve/internship_resumes';

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `internship-resume-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const validMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const validExtension = /\.(pdf|doc|docx)$/i.test(file.originalname);

    if (validMimeTypes.includes(file.mimetype) || validExtension) {
        cb(null, true);
        return;
    }

    req.fileValidationError = 'Only PDF, DOC, and DOCX files are accepted.';
    cb(null, false);
};

export const uploadInternshipResume = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
