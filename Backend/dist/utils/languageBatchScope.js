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
exports.isInstitutionScopedLanguageBatch = exports.buildLanguageBatchScopeLabel = exports.findOrCreateLanguageBatch = exports.applyLanguageInstitutionScope = exports.buildLanguageBatchQuery = exports.getLanguageEnrollmentInstitutionScope = exports.getLanguageInstitutionScope = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const language_batch_model_1 = __importDefault(require("../models/language.batch.model"));
const normalizeInstitutionId = (value) => {
    if (!value) {
        return null;
    }
    if (value instanceof mongoose_1.default.Types.ObjectId) {
        return value;
    }
    if (typeof value === 'object' && value !== null && '_id' in value) {
        return normalizeInstitutionId(value._id);
    }
    const normalizedValue = String(value).trim();
    if (!normalizedValue || !mongoose_1.default.Types.ObjectId.isValid(normalizedValue)) {
        return null;
    }
    return new mongoose_1.default.Types.ObjectId(normalizedValue);
};
const normalizeInstitutionName = (value) => {
    const normalizedValue = String(value !== null && value !== void 0 ? value : '').trim();
    return normalizedValue || null;
};
const normalizeRole = (value) => String(value !== null && value !== void 0 ? value : '').trim().toLowerCase();
const getLanguageInstitutionScope = (params) => {
    const institutionId = normalizeInstitutionId(params.institutionId);
    return {
        institutionId,
        institutionName: institutionId ? normalizeInstitutionName(params.institutionName) : null,
    };
};
exports.getLanguageInstitutionScope = getLanguageInstitutionScope;
const getLanguageEnrollmentInstitutionScope = (user) => {
    if (normalizeRole(user === null || user === void 0 ? void 0 : user.role) !== 'institution_student') {
        return {
            institutionId: null,
            institutionName: null,
        };
    }
    return (0, exports.getLanguageInstitutionScope)({
        institutionId: user === null || user === void 0 ? void 0 : user.institutionId,
        institutionName: user === null || user === void 0 ? void 0 : user.institutionName,
    });
};
exports.getLanguageEnrollmentInstitutionScope = getLanguageEnrollmentInstitutionScope;
const buildLanguageBatchQuery = (courseTitle, levelName, scope) => ({
    courseTitle,
    name: levelName,
    institutionId: scope.institutionId,
});
exports.buildLanguageBatchQuery = buildLanguageBatchQuery;
const applyLanguageInstitutionScope = (target, scope) => {
    target.institutionId = scope.institutionId;
    target.institutionName = scope.institutionId ? scope.institutionName : null;
    return target;
};
exports.applyLanguageInstitutionScope = applyLanguageInstitutionScope;
const findOrCreateLanguageBatch = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const batchQuery = language_batch_model_1.default.findOne((0, exports.buildLanguageBatchQuery)(params.courseTitle, params.levelName, params.scope));
    if (params.session) {
        batchQuery.session(params.session);
    }
    let batch = yield batchQuery;
    if (!batch) {
        batch = new language_batch_model_1.default({
            courseTitle: params.courseTitle,
            name: params.levelName,
            students: [],
        });
        (0, exports.applyLanguageInstitutionScope)(batch, params.scope);
        if (params.session) {
            yield batch.save({ session: params.session });
        }
        else {
            yield batch.save();
        }
        return batch;
    }
    (0, exports.applyLanguageInstitutionScope)(batch, params.scope);
    return batch;
});
exports.findOrCreateLanguageBatch = findOrCreateLanguageBatch;
const buildLanguageBatchScopeLabel = (scope) => {
    const normalizedScope = (0, exports.getLanguageInstitutionScope)(scope || {});
    return normalizedScope.institutionName || 'General Pool';
};
exports.buildLanguageBatchScopeLabel = buildLanguageBatchScopeLabel;
const isInstitutionScopedLanguageBatch = (batch) => !!(0, exports.getLanguageInstitutionScope)({
    institutionId: batch === null || batch === void 0 ? void 0 : batch.institutionId,
    institutionName: batch === null || batch === void 0 ? void 0 : batch.institutionName,
}).institutionId;
exports.isInstitutionScopedLanguageBatch = isInstitutionScopedLanguageBatch;
