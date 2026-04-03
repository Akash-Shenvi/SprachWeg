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
exports.removePushSubscription = exports.savePushSubscription = exports.getPushPublicKey = void 0;
const push_service_1 = require("../services/push.service");
const getPushPublicKey = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return res.status(200).json({
        configured: (0, push_service_1.isWebPushConfigured)(),
        publicKey: (0, push_service_1.isWebPushConfigured)() ? (0, push_service_1.getWebPushPublicKey)() : null,
    });
});
exports.getPushPublicKey = getPushPublicKey;
const savePushSubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        const savedSubscription = yield (0, push_service_1.upsertPushSubscriptionForUser)({
            userId,
            subscription: (_b = req.body) === null || _b === void 0 ? void 0 : _b.subscription,
            userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
        });
        return res.status(200).json({ subscription: savedSubscription });
    }
    catch (error) {
        console.error('Failed to save push subscription:', error);
        return res.status(400).json({ message: 'Failed to save push subscription' });
    }
});
exports.savePushSubscription = savePushSubscription;
const removePushSubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        const deletedCount = yield (0, push_service_1.deletePushSubscriptionForUser)({
            userId,
            endpoint: (_b = req.body) === null || _b === void 0 ? void 0 : _b.endpoint,
        });
        return res.status(200).json({ deletedCount });
    }
    catch (error) {
        console.error('Failed to remove push subscription:', error);
        return res.status(400).json({ message: 'Failed to remove push subscription' });
    }
});
exports.removePushSubscription = removePushSubscription;
