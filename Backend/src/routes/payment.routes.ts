import express from 'express';
import { handlePayUCallback, handlePayUWebhook, launchPayUCheckout } from '../controllers/payu.controller';

const router = express.Router();

router.get('/payu/launch', launchPayUCheckout);
router.post('/payu/callback', handlePayUCallback);
router.post('/payu/webhook', handlePayUWebhook);

export default router;
