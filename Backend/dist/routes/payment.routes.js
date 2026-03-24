"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payu_controller_1 = require("../controllers/payu.controller");
const router = express_1.default.Router();
router.post('/payu/callback', payu_controller_1.handlePayUCallback);
router.post('/payu/webhook', payu_controller_1.handlePayUWebhook);
exports.default = router;
