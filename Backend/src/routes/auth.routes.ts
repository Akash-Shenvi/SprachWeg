import express from 'express';
import { register, verifyOtp, resendOtp, login, googleLogin, getMe, forgotPassword, resetPassword } from '../controllers/auth.controller';
import {
    loginInstitution,
    registerInstitution,
    resendInstitutionOtp,
    verifyInstitutionOtp,
} from '../controllers/institutionAuth.controller';
import { connectGoogle, googleCallback } from '../controllers/auth.google.controller';
import { updateProfile } from '../controllers/user.controller';
import { protect } from '../middlewares/auth.middleware';
import { upload } from '../config/multer';
import { institutionBrandUpload } from '../config/institutionBrandUpload';

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.post('/institution/register', institutionBrandUpload.single('logo'), registerInstitution);
router.post('/institution/verify-otp', verifyInstitutionOtp);
router.post('/institution/resend-otp', resendInstitutionOtp);
router.post('/institution/login', loginInstitution);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/google/url', protect, connectGoogle);
router.post('/google', googleLogin);
router.post('/google/callback', protect, googleCallback);
router.get('/me', protect, getMe);
router.put('/profile/complete', protect, upload.single('avatar'), updateProfile);

export default router;
