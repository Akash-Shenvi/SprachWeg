"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const contact_controller_1 = require("../controllers/contact.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// Public route
router.post('/', contact_controller_1.submitContactForm);
// Admin routes
router.get('/admin/messages', auth_middleware_1.protect, auth_middleware_1.isAdmin, contact_controller_1.getAllMessages);
router.patch('/admin/messages/:id/read', auth_middleware_1.protect, auth_middleware_1.isAdmin, contact_controller_1.markAsRead);
router.delete('/admin/messages/:id', auth_middleware_1.protect, auth_middleware_1.isAdmin, contact_controller_1.deleteMessage);
exports.default = router;
