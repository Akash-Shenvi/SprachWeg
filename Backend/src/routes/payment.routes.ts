import express from 'express';
import { handlePayUCallback, handlePayUWebhook } from '../controllers/payu.controller';

const router = express.Router();

router.post('/payu/callback', handlePayUCallback);
router.post('/payu/webhook', handlePayUWebhook);

export default router;
