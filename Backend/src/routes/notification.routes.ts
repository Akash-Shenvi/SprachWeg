import express from 'express';
import {
    getNotificationUnreadCount,
    getNotifications,
    readAllNotifications,
    readNotification,
} from '../controllers/notification.controller';
import { authorize, protect } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(protect);
router.use(authorize('trainer', 'student', 'institution_student'));

router.get('/', getNotifications);
router.get('/unread-count', getNotificationUnreadCount);
router.patch('/read-all', readAllNotifications);
router.patch('/:notificationId/read', readNotification);

export default router;
