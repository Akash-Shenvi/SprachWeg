"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getUnreadNotificationCount = exports.listNotificationsForUser = exports.createNotifications = exports.truncateNotificationText = exports.formatNotificationDateTime = exports.buildBatchNotificationLink = void 0;
const notification_model_1 = __importDefault(require("../models/notification.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const push_service_1 = require("./push.service");
const socket_1 = require("../socket");
const roles_1 = require("../utils/roles");
const toObjectIdString = (value) => {
    if (!value) {
        return '';
    }
    if (typeof value === 'object' && '_id' in value && value._id) {
        return String(value._id).trim();
    }
    return String(value).trim();
};
const uniqueRecipientIds = (values) => ([...new Set(values.map(toObjectIdString).filter(Boolean))]);
const buildBatchNotificationLink = (trainingType, batchId, tab) => {
    const basePath = trainingType === 'language' ? '/language-batch' : '/skill-batch';
    const normalizedBatchId = String(batchId || '').trim();
    const searchSuffix = tab ? `?tab=${encodeURIComponent(tab)}` : '';
    return `${basePath}/${normalizedBatchId}${searchSuffix}`;
};
exports.buildBatchNotificationLink = buildBatchNotificationLink;
const formatNotificationDateTime = (value) => {
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
exports.formatNotificationDateTime = formatNotificationDateTime;
const truncateNotificationText = (value, maxLength = 120) => {
    const normalizedValue = String(value || '').trim().replace(/\s+/g, ' ');
    if (!normalizedValue) {
        return '';
    }
    if (normalizedValue.length <= maxLength) {
        return normalizedValue;
    }
    return `${normalizedValue.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
};
exports.truncateNotificationText = truncateNotificationText;
const serializeNotification = (notification) => ({
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
const resolveRecipientIds = (recipientUserIds, allowedRoles) => __awaiter(void 0, void 0, void 0, function* () {
    const candidateIds = uniqueRecipientIds(recipientUserIds);
    if (candidateIds.length === 0) {
        return [];
    }
    const recipients = yield user_model_1.default.find({
        _id: { $in: candidateIds },
        role: { $in: allowedRoles },
    })
        .select('_id')
        .lean();
    return recipients.map((recipient) => String(recipient._id));
});
const createNotifications = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const recipientIds = yield resolveRecipientIds(input.recipientUserIds, input.allowedRoles && input.allowedRoles.length > 0
        ? input.allowedRoles
        : [...roles_1.LEARNER_ROLES]);
    if (recipientIds.length === 0) {
        return [];
    }
    const now = new Date();
    const insertedNotifications = yield notification_model_1.default.insertMany(recipientIds.map((recipientUserId) => ({
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
    })));
    const serializedNotifications = insertedNotifications.map((notification) => serializeNotification(notification));
    serializedNotifications.forEach((notification) => {
        (0, socket_1.emitToUserRoom)(notification.recipientUserId, 'notification:new', notification);
    });
    void (0, push_service_1.sendPushNotifications)(serializedNotifications.map((notification) => ({
        notificationId: notification._id,
        recipientUserId: notification.recipientUserId,
        title: String(notification.title || ''),
        body: String(notification.body || ''),
        linkPath: String(notification.linkPath || ''),
        kind: String(notification.kind || ''),
        metadata: notification.metadata || null,
    }))).catch((error) => {
        console.error('Failed to fan out browser push notifications:', error);
    });
    return serializedNotifications;
});
exports.createNotifications = createNotifications;
const listNotificationsForUser = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = { recipientUserId: params.userId };
    const skip = (params.page - 1) * params.limit;
    const [total, notifications] = yield Promise.all([
        notification_model_1.default.countDocuments(filter),
        notification_model_1.default.find(filter)
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
});
exports.listNotificationsForUser = listNotificationsForUser;
const getUnreadNotificationCount = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const unreadCount = yield notification_model_1.default.countDocuments({
        recipientUserId: userId,
        isRead: false,
    });
    return unreadCount;
});
exports.getUnreadNotificationCount = getUnreadNotificationCount;
const markNotificationAsRead = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const notification = yield notification_model_1.default.findOneAndUpdate({
        _id: params.notificationId,
        recipientUserId: params.userId,
    }, {
        $set: {
            isRead: true,
            readAt: new Date(),
        },
    }, {
        new: true,
    });
    return notification ? serializeNotification(notification) : null;
});
exports.markNotificationAsRead = markNotificationAsRead;
const markAllNotificationsAsRead = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const updateResult = yield notification_model_1.default.updateMany({
        recipientUserId: userId,
        isRead: false,
    }, {
        $set: {
            isRead: true,
            readAt: new Date(),
        },
    });
    return updateResult.modifiedCount || 0;
});
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
