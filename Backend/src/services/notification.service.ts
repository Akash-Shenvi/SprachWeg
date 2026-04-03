import mongoose from 'mongoose';
import Notification, { type INotification, type NotificationKind, type NotificationTrainingType } from '../models/notification.model';
import User from '../models/user.model';
import { sendPushNotifications } from './push.service';
import { emitToUserRoom } from '../socket';
import { LEARNER_ROLES } from '../utils/roles';

type NotificationRecipient = string | mongoose.Types.ObjectId | { _id?: string | mongoose.Types.ObjectId } | null | undefined;

type CreateNotificationsInput = {
    recipientUserIds: NotificationRecipient[];
    actorUserId?: string | mongoose.Types.ObjectId | null;
    kind: NotificationKind;
    trainingType?: NotificationTrainingType;
    batchId?: string | mongoose.Types.ObjectId | null;
    title: string;
    body: string;
    linkPath: string;
    metadata?: Record<string, unknown>;
    allowedRoles?: string[];
};

const toObjectIdString = (value: NotificationRecipient) => {
    if (!value) {
        return '';
    }

    if (typeof value === 'object' && '_id' in value && value._id) {
        return String(value._id).trim();
    }

    return String(value).trim();
};

const uniqueRecipientIds = (values: NotificationRecipient[]) => (
    [...new Set(values.map(toObjectIdString).filter(Boolean))]
);

export const buildBatchNotificationLink = (
    trainingType: NotificationTrainingType,
    batchId: string | mongoose.Types.ObjectId,
    tab?: 'announcements' | 'materials' | 'classes' | 'assessments'
) => {
    const basePath = trainingType === 'language' ? '/language-batch' : '/skill-batch';
    const normalizedBatchId = String(batchId || '').trim();
    const searchSuffix = tab ? `?tab=${encodeURIComponent(tab)}` : '';
    return `${basePath}/${normalizedBatchId}${searchSuffix}`;
};

export const formatNotificationDateTime = (value: string | number | Date) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'the scheduled time';
    }

    return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};

export const truncateNotificationText = (value: string, maxLength: number = 120) => {
    const normalizedValue = String(value || '').trim().replace(/\s+/g, ' ');

    if (!normalizedValue) {
        return '';
    }

    if (normalizedValue.length <= maxLength) {
        return normalizedValue;
    }

    return `${normalizedValue.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
};

const serializeNotification = (notification: INotification | (Record<string, unknown> & { _id: unknown })) => ({
    _id: String(notification._id),
    recipientUserId: String(notification.recipientUserId || ''),
    actorUserId: notification.actorUserId ? String(notification.actorUserId) : null,
    kind: notification.kind,
    trainingType: notification.trainingType || null,
    batchId: notification.batchId ? String(notification.batchId) : null,
    title: notification.title,
    body: notification.body,
    linkPath: notification.linkPath,
    isRead: Boolean(notification.isRead),
    readAt: notification.readAt || null,
    metadata: notification.metadata || null,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
});

const resolveRecipientIds = async (
    recipientUserIds: NotificationRecipient[],
    allowedRoles: string[]
) => {
    const candidateIds = uniqueRecipientIds(recipientUserIds);

    if (candidateIds.length === 0) {
        return [];
    }

    const recipients = await User.find({
        _id: { $in: candidateIds },
        role: { $in: allowedRoles },
    })
        .select('_id')
        .lean();

    return recipients.map((recipient) => String(recipient._id));
};

export const createNotifications = async (input: CreateNotificationsInput) => {
    const recipientIds = await resolveRecipientIds(
        input.recipientUserIds,
        input.allowedRoles && input.allowedRoles.length > 0
            ? input.allowedRoles
            : [...LEARNER_ROLES]
    );

    if (recipientIds.length === 0) {
        return [];
    }

    const now = new Date();
    const insertedNotifications = await Notification.insertMany(
        recipientIds.map((recipientUserId) => ({
            recipientUserId,
            actorUserId: input.actorUserId || null,
            kind: input.kind,
            trainingType: input.trainingType,
            batchId: input.batchId || null,
            title: String(input.title || '').trim(),
            body: String(input.body || '').trim(),
            linkPath: String(input.linkPath || '').trim(),
            metadata: input.metadata,
            isRead: false,
            readAt: null,
            createdAt: now,
            updatedAt: now,
        }))
    );

    const serializedNotifications = insertedNotifications.map((notification) => serializeNotification(notification));

    serializedNotifications.forEach((notification) => {
        emitToUserRoom(notification.recipientUserId, 'notification:new', notification);
    });

    void sendPushNotifications(
        serializedNotifications.map((notification) => ({
            notificationId: notification._id,
            recipientUserId: notification.recipientUserId,
            title: String(notification.title || ''),
            body: String(notification.body || ''),
            linkPath: String(notification.linkPath || ''),
            kind: String(notification.kind || ''),
            metadata: (notification.metadata as Record<string, unknown> | null | undefined) || null,
        }))
    ).catch((error) => {
        console.error('Failed to fan out browser push notifications:', error);
    });

    return serializedNotifications;
};

export const listNotificationsForUser = async (params: {
    userId: string | mongoose.Types.ObjectId;
    page: number;
    limit: number;
}) => {
    const filter = { recipientUserId: params.userId };
    const skip = (params.page - 1) * params.limit;

    const [total, notifications] = await Promise.all([
        Notification.countDocuments(filter),
        Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(params.limit),
    ]);

    return {
        data: notifications.map((notification) => serializeNotification(notification)),
        total,
        page: params.page,
        pages: Math.ceil(total / params.limit),
        hasMore: params.page * params.limit < total,
    };
};

export const getUnreadNotificationCount = async (userId: string | mongoose.Types.ObjectId) => {
    const unreadCount = await Notification.countDocuments({
        recipientUserId: userId,
        isRead: false,
    });

    return unreadCount;
};

export const markNotificationAsRead = async (params: {
    notificationId: string;
    userId: string | mongoose.Types.ObjectId;
}) => {
    const notification = await Notification.findOneAndUpdate(
        {
            _id: params.notificationId,
            recipientUserId: params.userId,
        },
        {
            $set: {
                isRead: true,
                readAt: new Date(),
            },
        },
        {
            new: true,
        }
    );

    return notification ? serializeNotification(notification) : null;
};

export const markAllNotificationsAsRead = async (userId: string | mongoose.Types.ObjectId) => {
    const updateResult = await Notification.updateMany(
        {
            recipientUserId: userId,
            isRead: false,
        },
        {
            $set: {
                isRead: true,
                readAt: new Date(),
            },
        }
    );

    return updateResult.modifiedCount || 0;
};
