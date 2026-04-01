"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLearnerRole = exports.LEARNER_ROLES = void 0;
exports.LEARNER_ROLES = ['student', 'institution_student'];
const isLearnerRole = (role) => exports.LEARNER_ROLES.includes(String(role || '').trim().toLowerCase());
exports.isLearnerRole = isLearnerRole;
