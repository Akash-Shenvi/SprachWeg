"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const push_controller_1 = require("../controllers/push.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.protect);
router.use((0, auth_middleware_1.authorize)('trainer', 'student', 'institution_student'));
router.get('/public-key', push_controller_1.getPushPublicKey);
router.post('/subscriptions', push_controller_1.savePushSubscription);
router.delete('/subscriptions', push_controller_1.removePushSubscription);
exports.default = router;
