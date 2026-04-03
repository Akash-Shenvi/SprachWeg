import express from 'express';
import {
    getPushPublicKey,
    removePushSubscription,
    savePushSubscription,
} from '../controllers/push.controller';
import { authorize, protect } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(protect);
router.use(authorize('trainer', 'student', 'institution_student'));

router.get('/public-key', getPushPublicKey);
router.post('/subscriptions', savePushSubscription);
router.delete('/subscriptions', removePushSubscription);

export default router;
