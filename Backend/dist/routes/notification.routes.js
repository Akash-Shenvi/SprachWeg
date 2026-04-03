"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.protect);
router.use((0, auth_middleware_1.authorize)('trainer', 'student', 'institution_student'));
router.get('/', notification_controller_1.getNotifications);
router.get('/unread-count', notification_controller_1.getNotificationUnreadCount);
router.patch('/read-all', notification_controller_1.readAllNotifications);
router.patch('/:notificationId/read', notification_controller_1.readNotification);
exports.default = router;
