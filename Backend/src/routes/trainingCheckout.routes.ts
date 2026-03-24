import express from 'express';
import {
    createTrainingCheckout,
    deleteTrainingPaymentAttempt,
    getAllTrainingPaymentAttempts,
} from '../controllers/trainingCheckout.controller';
import { isAdmin, isAuth } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/create', isAuth, createTrainingCheckout);
router.get('/admin/payment-attempts', isAuth, isAdmin, getAllTrainingPaymentAttempts);
router.delete('/admin/payment-attempts/:id', isAuth, isAdmin, deleteTrainingPaymentAttempt);

export default router;
