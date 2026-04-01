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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.canAccessChatPair = exports.resolveTrainerIdForStudentChat = exports.getAssignedTrainerIdsForStudent = exports.findAssignedBatchForChat = void 0;
const language_batch_model_1 = __importDefault(require("../models/language.batch.model"));
const batch_model_1 = __importDefault(require("../models/batch.model"));
const roles_1 = require("./roles");
const findAssignedBatchForChat = (studentId, trainerId) => __awaiter(void 0, void 0, void 0, function* () {
    const [languageBatch, skillBatch] = yield Promise.all([
        language_batch_model_1.default.findOne({ students: studentId, trainerId }),
        batch_model_1.default.findOne({ students: studentId, trainerId, isActive: true }),
    ]);
    return languageBatch || skillBatch;
});
exports.findAssignedBatchForChat = findAssignedBatchForChat;
const getAssignedTrainerIdsForStudent = (studentId) => __awaiter(void 0, void 0, void 0, function* () {
    const [languageBatches, skillBatches] = yield Promise.all([
        language_batch_model_1.default.find({
            students: studentId,
            trainerId: { $exists: true, $ne: null }
        }).select('trainerId'),
        batch_model_1.default.find({
            students: studentId,
            trainerId: { $exists: true, $ne: null },
            isActive: true,
        }).select('trainerId'),
    ]);
    return [...new Set([...languageBatches, ...skillBatches]
            .map(batch => { var _a; return (_a = batch.trainerId) === null || _a === void 0 ? void 0 : _a.toString(); })
            .filter((trainerId) => Boolean(trainerId)))];
});
exports.getAssignedTrainerIdsForStudent = getAssignedTrainerIdsForStudent;
const resolveTrainerIdForStudentChat = (studentId, requestedTrainerId) => __awaiter(void 0, void 0, void 0, function* () {
    const assignedTrainerIds = yield (0, exports.getAssignedTrainerIdsForStudent)(studentId);
    if (requestedTrainerId) {
        if (!assignedTrainerIds.includes(requestedTrainerId)) {
            return {
                trainerId: null,
                status: 403,
                message: 'Not authorized: this trainer is not assigned to this student'
            };
        }
        return { trainerId: requestedTrainerId, status: 200, message: '' };
    }
    if (assignedTrainerIds.length === 0) {
        return {
            trainerId: null,
            status: 404,
            message: 'No trainer assigned to this student yet'
        };
    }
    if (assignedTrainerIds.length > 1) {
        return {
            trainerId: null,
            status: 400,
            message: 'Multiple trainers found for this student. Please open chat from the correct course.'
        };
    }
    return { trainerId: assignedTrainerIds[0], status: 200, message: '' };
});
exports.resolveTrainerIdForStudentChat = resolveTrainerIdForStudentChat;
const canAccessChatPair = (userId, userRole, studentId, trainerId) => __awaiter(void 0, void 0, void 0, function* () {
    if ((0, roles_1.isLearnerRole)(userRole)) {
        if (userId !== studentId)
            return false;
        return Boolean(yield (0, exports.findAssignedBatchForChat)(studentId, trainerId));
    }
    if (userRole === 'trainer') {
        if (userId !== trainerId)
            return false;
        return Boolean(yield (0, exports.findAssignedBatchForChat)(studentId, trainerId));
    }
    return false;
});
exports.canAccessChatPair = canAccessChatPair;
