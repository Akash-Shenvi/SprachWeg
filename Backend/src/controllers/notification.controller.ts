import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware';
import {
    getUnreadNotificationCount,
    listNotificationsForUser,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from '../services/notification.service';

const DEFAULT_PAGE_LIMIT = 10;
const MAX_PAGE_LIMIT = 50;

const getPagination = (req: AuthRequest) => {
    const parsedPage = Number.parseInt(String(req.query.page || ''), 10);
    const parsedLimit = Number.parseInt(String(req.query.limit || ''), 10);
    const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
    const limit = Number.isNaN(parsedLimit)
        ? DEFAULT_PAGE_LIMIT
        : Math.min(MAX_PAGE_LIMIT, Math.max(1, parsedLimit));

    return { page, limit };
};

export const getNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const { page, limit } = getPagination(req);
        const response = await listNotificationsForUser({ userId, page, limit });

        return res.status(200).json(response);
    } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return res.status(500).json({ message: 'Failed to fetch notifications' });
    }
};

export const getNotificationUnreadCount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const unreadCount = await getUnreadNotificationCount(userId);
        return res.status(200).json({ unreadCount });
    } catch (error) {
        console.error('Failed to fetch unread notification count:', error);
        return res.status(500).json({ message: 'Failed to fetch unread notification count' });
    }
};

export const readNotification = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const notification = await markNotificationAsRead({
            notificationId: String(req.params.notificationId || '').trim(),
            userId,
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        return res.status(200).json({ notification });
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
        return res.status(500).json({ message: 'Failed to mark notification as read' });
    }
};

export const readAllNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const modifiedCount = await markAllNotificationsAsRead(userId);
        return res.status(200).json({ modifiedCount });
    } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
        return res.status(500).json({ message: 'Failed to mark all notifications as read' });
    }
};
