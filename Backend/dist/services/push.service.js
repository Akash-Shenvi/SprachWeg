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
exports.sendPushNotifications = exports.deletePushSubscriptionForUser = exports.upsertPushSubscriptionForUser = exports.getWebPushPublicKey = exports.isWebPushConfigured = void 0;
const web_push_1 = __importDefault(require("web-push"));
const env_1 = require("../config/env");
const push_subscription_model_1 = __importDefault(require("../models/push.subscription.model"));
let vapidConfigured = false;
const configureWebPush = () => {
    if (vapidConfigured || !(0, exports.isWebPushConfigured)()) {
        return;
    }
    web_push_1.default.setVapidDetails(env_1.env.WEB_PUSH_SUBJECT, env_1.env.WEB_PUSH_PUBLIC_KEY, env_1.env.WEB_PUSH_PRIVATE_KEY);
    vapidConfigured = true;
};
const isWebPushConfigured = () => Boolean(env_1.env.WEB_PUSH_PUBLIC_KEY
    && env_1.env.WEB_PUSH_PRIVATE_KEY
    && env_1.env.WEB_PUSH_SUBJECT);
exports.isWebPushConfigured = isWebPushConfigured;
const getWebPushPublicKey = () => env_1.env.WEB_PUSH_PUBLIC_KEY || '';
exports.getWebPushPublicKey = getWebPushPublicKey;
const upsertPushSubscriptionForUser = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, subscription, userAgent, }) {
    var _b, _c;
    const endpoint = String(subscription.endpoint || '').trim();
    const p256dhKey = String(((_b = subscription.keys) === null || _b === void 0 ? void 0 : _b.p256dh) || '').trim();
    const authKey = String(((_c = subscription.keys) === null || _c === void 0 ? void 0 : _c.auth) || '').trim();
    if (!endpoint || !p256dhKey || !authKey) {
        throw new Error('Invalid push subscription payload');
    }
    const now = new Date();
    const savedSubscription = yield push_subscription_model_1.default.findOneAndUpdate({ endpoint }, {
        $set: {
            userId,
            endpoint,
            p256dhKey,
            authKey,
            userAgent: userAgent ? String(userAgent).trim() : null,
            lastSeenAt: now,
        },
    }, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
    });
    return {
        endpoint: savedSubscription.endpoint,
        lastSeenAt: savedSubscription.lastSeenAt,
    };
});
exports.upsertPushSubscriptionForUser = upsertPushSubscriptionForUser;
const deletePushSubscriptionForUser = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, endpoint, }) {
    const normalizedEndpoint = String(endpoint || '').trim();
    if (!normalizedEndpoint) {
        return 0;
    }
    const result = yield push_subscription_model_1.default.deleteOne({
        userId,
        endpoint: normalizedEndpoint,
    });
    return result.deletedCount || 0;
});
exports.deletePushSubscriptionForUser = deletePushSubscriptionForUser;
const serializePushPayload = (payload) => JSON.stringify({
    notificationId: payload.notificationId,
    title: payload.title,
    body: payload.body,
    linkPath: payload.linkPath,
    kind: payload.kind,
    metadata: payload.metadata || null,
});
const sendPushNotificationToSubscription = (subscription, payload) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield web_push_1.default.sendNotification({
            endpoint: subscription.endpoint,
            keys: {
                p256dh: subscription.p256dhKey,
                auth: subscription.authKey,
            },
        }, serializePushPayload(payload));
    }
    catch (error) {
        const statusCode = Number((error === null || error === void 0 ? void 0 : error.statusCode) || 0);
        if (statusCode === 404 || statusCode === 410) {
            yield push_subscription_model_1.default.deleteOne({ _id: subscription._id });
            return;
        }
        console.error('Failed to deliver browser push notification:', error);
    }
});
const sendPushNotifications = (notifications) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(0, exports.isWebPushConfigured)() || notifications.length === 0) {
        return;
    }
    configureWebPush();
    const recipientUserIds = [...new Set(notifications
            .map((notification) => String(notification.recipientUserId || '').trim())
            .filter(Boolean))];
    if (recipientUserIds.length === 0) {
        return;
    }
    const subscriptions = yield push_subscription_model_1.default.find({
        userId: { $in: recipientUserIds },
    })
        .select('_id userId endpoint p256dhKey authKey')
        .lean();
    const subscriptionsByUser = new Map();
    subscriptions.forEach((subscription) => {
        const recipientKey = String(subscription.userId);
        const currentSubscriptions = subscriptionsByUser.get(recipientKey) || [];
        currentSubscriptions.push(subscription);
        subscriptionsByUser.set(recipientKey, currentSubscriptions);
    });
    yield Promise.allSettled(notifications.flatMap((notification) => {
        var _a;
        return (((_a = subscriptionsByUser.get(notification.recipientUserId)) === null || _a === void 0 ? void 0 : _a.map((subscription) => (sendPushNotificationToSubscription(subscription, notification)))) || []);
    }));
});
exports.sendPushNotifications = sendPushNotifications;
