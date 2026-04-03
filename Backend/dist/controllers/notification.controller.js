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
Object.defineProperty(exports, "__esModule", { value: true });
exports.readAllNotifications = exports.readNotification = exports.getNotificationUnreadCount = exports.getNotifications = void 0;
const notification_service_1 = require("../services/notification.service");
const DEFAULT_PAGE_LIMIT = 10;
const MAX_PAGE_LIMIT = 50;
const getPagination = (req) => {
    const parsedPage = Number.parseInt(String(req.query.page || ''), 10);
    const parsedLimit = Number.parseInt(String(req.query.limit || ''), 10);
    const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
    const limit = Number.isNaN(parsedLimit)
        ? DEFAULT_PAGE_LIMIT
        : Math.min(MAX_PAGE_LIMIT, Math.max(1, parsedLimit));
    return { page, limit };
};
const getNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        const { page, limit } = getPagination(req);
        const response = yield (0, notification_service_1.listNotificationsForUser)({ userId, page, limit });
        return res.status(200).json(response);
    }
    catch (error) {
        console.error('Failed to fetch notifications:', error);
        return res.status(500).json({ message: 'Failed to fetch notifications' });
    }
});
exports.getNotifications = getNotifications;
const getNotificationUnreadCount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        const unreadCount = yield (0, notification_service_1.getUnreadNotificationCount)(userId);
        return res.status(200).json({ unreadCount });
    }
    catch (error) {
        console.error('Failed to fetch unread notification count:', error);
        return res.status(500).json({ message: 'Failed to fetch unread notification count' });
    }
});
exports.getNotificationUnreadCount = getNotificationUnreadCount;
const readNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        const notification = yield (0, notification_service_1.markNotificationAsRead)({
            notificationId: String(req.params.notificationId || '').trim(),
            userId,
        });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        return res.status(200).json({ notification });
    }
    catch (error) {
        console.error('Failed to mark notification as read:', error);
        return res.status(500).json({ message: 'Failed to mark notification as read' });
    }
});
exports.readNotification = readNotification;
const readAllNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        const modifiedCount = yield (0, notification_service_1.markAllNotificationsAsRead)(userId);
        return res.status(200).json({ modifiedCount });
    }
    catch (error) {
        console.error('Failed to mark all notifications as read:', error);
        return res.status(500).json({ message: 'Failed to mark all notifications as read' });
    }
});
exports.readAllNotifications = readAllNotifications;
