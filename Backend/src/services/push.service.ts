import mongoose from 'mongoose';
import webpush from 'web-push';
import { env } from '../config/env';
import PushSubscription from '../models/push.subscription.model';

type BrowserPushKeys = {
    p256dh: string;
    auth: string;
};

export type BrowserPushSubscriptionPayload = {
    endpoint: string;
    keys: BrowserPushKeys;
};

type UpsertPushSubscriptionInput = {
    userId: string | mongoose.Types.ObjectId;
    subscription: BrowserPushSubscriptionPayload;
    userAgent?: string | null;
};

type DeletePushSubscriptionInput = {
    userId: string | mongoose.Types.ObjectId;
    endpoint: string;
};

type PushNotificationPayload = {
    notificationId: string;
    recipientUserId: string;
    title: string;
    body: string;
    linkPath: string;
    kind: string;
    metadata?: Record<string, unknown> | null;
};

let vapidConfigured = false;

const configureWebPush = () => {
    if (vapidConfigured || !isWebPushConfigured()) {
        return;
    }

    webpush.setVapidDetails(
        env.WEB_PUSH_SUBJECT,
        env.WEB_PUSH_PUBLIC_KEY,
        env.WEB_PUSH_PRIVATE_KEY
    );

    vapidConfigured = true;
};

export const isWebPushConfigured = () => Boolean(
    env.WEB_PUSH_PUBLIC_KEY
    && env.WEB_PUSH_PRIVATE_KEY
    && env.WEB_PUSH_SUBJECT
);

export const getWebPushPublicKey = () => env.WEB_PUSH_PUBLIC_KEY || '';

export const upsertPushSubscriptionForUser = async ({
    userId,
    subscription,
    userAgent,
}: UpsertPushSubscriptionInput) => {
    const endpoint = String(subscription.endpoint || '').trim();
    const p256dhKey = String(subscription.keys?.p256dh || '').trim();
    const authKey = String(subscription.keys?.auth || '').trim();

    if (!endpoint || !p256dhKey || !authKey) {
        throw new Error('Invalid push subscription payload');
    }

    const now = new Date();

    const savedSubscription = await PushSubscription.findOneAndUpdate(
        { endpoint },
        {
            $set: {
                userId,
                endpoint,
                p256dhKey,
                authKey,
                userAgent: userAgent ? String(userAgent).trim() : null,
                lastSeenAt: now,
            },
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        }
    );

    return {
        endpoint: savedSubscription.endpoint,
        lastSeenAt: savedSubscription.lastSeenAt,
    };
};

export const deletePushSubscriptionForUser = async ({
    userId,
    endpoint,
}: DeletePushSubscriptionInput) => {
    const normalizedEndpoint = String(endpoint || '').trim();

    if (!normalizedEndpoint) {
        return 0;
    }

    const result = await PushSubscription.deleteOne({
        userId,
        endpoint: normalizedEndpoint,
    });

    return result.deletedCount || 0;
};

const serializePushPayload = (payload: PushNotificationPayload) => JSON.stringify({
    notificationId: payload.notificationId,
    title: payload.title,
    body: payload.body,
    linkPath: payload.linkPath,
    kind: payload.kind,
    metadata: payload.metadata || null,
});

const sendPushNotificationToSubscription = async (
    subscription: {
        _id: mongoose.Types.ObjectId;
        endpoint: string;
        p256dhKey: string;
        authKey: string;
    },
    payload: PushNotificationPayload
) => {
    try {
        await webpush.sendNotification(
            {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.p256dhKey,
                    auth: subscription.authKey,
                },
            },
            serializePushPayload(payload)
        );
    } catch (error: any) {
        const statusCode = Number(error?.statusCode || 0);

        if (statusCode === 404 || statusCode === 410) {
            await PushSubscription.deleteOne({ _id: subscription._id });
            return;
        }

        console.error('Failed to deliver browser push notification:', error);
    }
};

export const sendPushNotifications = async (notifications: PushNotificationPayload[]) => {
    if (!isWebPushConfigured() || notifications.length === 0) {
        return;
    }

    configureWebPush();

    const recipientUserIds = [...new Set(
        notifications
            .map((notification) => String(notification.recipientUserId || '').trim())
            .filter(Boolean)
    )];

    if (recipientUserIds.length === 0) {
        return;
    }

    const subscriptions = await PushSubscription.find({
        userId: { $in: recipientUserIds },
    })
        .select('_id userId endpoint p256dhKey authKey')
        .lean();

    const subscriptionsByUser = new Map<string, typeof subscriptions>();

    subscriptions.forEach((subscription) => {
        const recipientKey = String(subscription.userId);
        const currentSubscriptions = subscriptionsByUser.get(recipientKey) || [];
        currentSubscriptions.push(subscription);
        subscriptionsByUser.set(recipientKey, currentSubscriptions);
    });

    await Promise.allSettled(
        notifications.flatMap((notification) => (
            subscriptionsByUser.get(notification.recipientUserId)?.map((subscription) => (
                sendPushNotificationToSubscription(subscription, notification)
            )) || []
        ))
    );
};
