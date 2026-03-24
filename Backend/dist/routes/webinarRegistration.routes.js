"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const webinarRegistration_controller_1 = require("../controllers/webinarRegistration.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.post('/checkout', auth_middleware_1.isAuth, webinarRegistration_controller_1.createWebinarCheckout);
router.get('/me/approved', auth_middleware_1.isAuth, webinarRegistration_controller_1.getMyApprovedWebinars);
router.get('/admin', auth_middleware_1.isAuth, auth_middleware_1.isAdmin, webinarRegistration_controller_1.getAdminWebinarRegistrations);
router.patch('/admin/:id/status', auth_middleware_1.isAuth, auth_middleware_1.isAdmin, webinarRegistration_controller_1.updateWebinarRegistrationStatus);
exports.default = router;
