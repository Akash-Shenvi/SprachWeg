"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_KINDS = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.NOTIFICATION_KINDS = [
    'announcement',
    'material',
    'class',
    'assessment',
    'enrollment_approved',
    'institution_access_approved',
    'chat_message',
];
const NotificationSchema = new mongoose_1.Schema({
    recipientUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    kind: {
        type: String,
        enum: [...exports.NOTIFICATION_KINDS],
        required: true,
    },
    trainingType: {
        type: String,
        enum: ['language', 'skill'],
        default: undefined,
    },
    batchId: { type: mongoose_1.Schema.Types.ObjectId, default: null },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    linkPath: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: undefined },
}, {
    timestamps: true,
});
NotificationSchema.index({ recipientUserId: 1, createdAt: -1 });
NotificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });
exports.default = mongoose_1.default.model('Notification', NotificationSchema);
