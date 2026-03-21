"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const webinar_controller_1 = require("../controllers/webinar.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.get('/', webinar_controller_1.getPublicWebinars);
router.get('/admin', auth_middleware_1.isAuth, auth_middleware_1.isAdmin, webinar_controller_1.getAdminWebinars);
router.get('/trainer/assigned', auth_middleware_1.isAuth, (0, auth_middleware_1.authorize)('trainer'), webinar_controller_1.getTrainerAssignedWebinars);
router.post('/admin', auth_middleware_1.isAuth, auth_middleware_1.isAdmin, webinar_controller_1.createWebinar);
router.put('/admin/:id', auth_middleware_1.isAuth, auth_middleware_1.isAdmin, webinar_controller_1.updateWebinar);
router.get('/:slug', webinar_controller_1.getWebinarBySlug);
exports.default = router;
