import express from 'express';
import {
    createTrainingCheckout,
    verifyTrainingPayment,
    recordTrainingPaymentFailure,
} from '../controllers/trainingCheckout.controller';
import { isAuth } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/create', isAuth, createTrainingCheckout);
router.post('/verify', isAuth, verifyTrainingPayment);
router.post('/failure', isAuth, recordTrainingPaymentFailure);

export default router;
