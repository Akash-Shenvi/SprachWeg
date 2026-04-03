"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chat_controller_1 = require("../controllers/chat.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.get('/conversations/unread', auth_middleware_1.protect, chat_controller_1.getUnreadChatConversations);
router.patch('/:studentId/read', auth_middleware_1.protect, chat_controller_1.readChatConversation);
// GET /api/chat/:studentId — fetch last 50 messages for a student-trainer conversation
router.get('/:studentId', auth_middleware_1.protect, chat_controller_1.getChatHistory);
exports.default = router;
