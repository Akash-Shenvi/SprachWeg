import express from 'express';
import {
    createWebinarCheckout,
    getAdminWebinarRegistrations,
    getMyApprovedWebinars,
    recordWebinarPaymentFailure,
    updateWebinarRegistrationStatus,
    verifyWebinarPayment,
} from '../controllers/webinarRegistration.controller';
import { isAdmin, isAuth } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/checkout', isAuth, createWebinarCheckout);
router.post('/verify-payment', isAuth, verifyWebinarPayment);
router.post('/payment-failure', isAuth, recordWebinarPaymentFailure);
router.get('/me/approved', isAuth, getMyApprovedWebinars);
router.get('/admin', isAuth, isAdmin, getAdminWebinarRegistrations);
router.patch('/admin/:id/status', isAuth, isAdmin, updateWebinarRegistrationStatus);

export default router;
