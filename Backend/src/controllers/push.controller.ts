import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware';
import {
    deletePushSubscriptionForUser,
    getWebPushPublicKey,
    isWebPushConfigured,
    upsertPushSubscriptionForUser,
} from '../services/push.service';

export const getPushPublicKey = async (_req: AuthRequest, res: Response) => {
    return res.status(200).json({
        configured: isWebPushConfigured(),
        publicKey: isWebPushConfigured() ? getWebPushPublicKey() : null,
    });
};

export const savePushSubscription = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const savedSubscription = await upsertPushSubscriptionForUser({
            userId,
            subscription: req.body?.subscription,
            userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
        });

        return res.status(200).json({ subscription: savedSubscription });
    } catch (error) {
        console.error('Failed to save push subscription:', error);
        return res.status(400).json({ message: 'Failed to save push subscription' });
    }
};

export const removePushSubscription = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const deletedCount = await deletePushSubscriptionForUser({
            userId,
            endpoint: req.body?.endpoint,
        });

        return res.status(200).json({ deletedCount });
    } catch (error) {
        console.error('Failed to remove push subscription:', error);
        return res.status(400).json({ message: 'Failed to remove push subscription' });
    }
};
