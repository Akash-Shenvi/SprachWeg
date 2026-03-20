"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const trainingCheckout_controller_1 = require("../controllers/trainingCheckout.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.post('/create', auth_middleware_1.isAuth, trainingCheckout_controller_1.createTrainingCheckout);
router.post('/verify', auth_middleware_1.isAuth, trainingCheckout_controller_1.verifyTrainingPayment);
router.post('/failure', auth_middleware_1.isAuth, trainingCheckout_controller_1.recordTrainingPaymentFailure);
exports.default = router;
