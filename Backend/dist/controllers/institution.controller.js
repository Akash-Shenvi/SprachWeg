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
exports.rejectInstitutionRequest = exports.approveInstitutionRequest = exports.getAdminInstitutionRequests = exports.createInstitutionSubmission = exports.getInstitutionSubmissions = exports.getInstitutionDashboard = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = __importDefault(require("mongoose"));
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const institution_dto_1 = require("../dtos/institution.dto");
const languageCourse_model_1 = __importDefault(require("../models/languageCourse.model"));
const institutionEnrollmentRequest_model_1 = __importDefault(require("../models/institutionEnrollmentRequest.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const language_batch_model_1 = __importDefault(require("../models/language.batch.model"));
const language_enrollment_model_1 = __importDefault(require("../models/language.enrollment.model"));
const email_service_1 = require("../utils/email.service");
const emailService = new email_service_1.EmailService();
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const normalizeText = (value) => String(value || '').trim();
const getGermanCourse = () => languageCourse_model_1.default.findOne({
    title: { $regex: 'german', $options: 'i' },
});
const sanitizeInstitutionRequest = (request) => ({
    _id: String(request._id),
    institutionId: request.institutionId && typeof request.institutionId === 'object'
        ? {
            _id: String(request.institutionId._id),
            name: request.institutionId.name,
            email: request.institutionId.email,
            phoneNumber: request.institutionId.phoneNumber,
            institutionName: request.institutionId.institutionName,
            contactPersonName: request.institutionId.contactPersonName,
            city: request.institutionId.city,
            state: request.institutionId.state,
            address: request.institutionId.address,
        }
        : String(request.institutionId),
    language: request.language,
    courseTitle: request.courseTitle,
    levelName: request.levelName,
    status: request.status,
    approvedBatchId: request.approvedBatchId ? String(request.approvedBatchId) : null,
    adminDecisionAt: request.adminDecisionAt,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    rejectionReason: request.rejectionReason || null,
    studentCount: Array.isArray(request.students) ? request.students.length : 0,
    students: Array.isArray(request.students)
        ? request.students.map((student) => ({
            name: student.name,
            email: student.email,
            createdUserId: student.createdUserId ? String(student.createdUserId) : null,
        }))
        : [],
});
const validateGermanSelection = (courseTitle, levelName) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const germanCourse = yield getGermanCourse();
    if (!germanCourse) {
        return { error: 'German course is not configured in the backend catalog.', germanCourse: null };
    }
    if (normalizeText(germanCourse.title) !== normalizeText(courseTitle)) {
        return { error: 'Selected German course is invalid.', germanCourse: null };
    }
    const matchingLevel = (_a = germanCourse.levels) === null || _a === void 0 ? void 0 : _a.find((level) => normalizeText(level.name) === normalizeText(levelName));
    if (!matchingLevel) {
        return { error: 'Selected German level is invalid.', germanCourse: null };
    }
    return { error: null, germanCourse };
});
const findDuplicateEmails = (emails) => {
    const seen = new Set();
    const duplicates = new Set();
    for (const email of emails) {
        if (seen.has(email)) {
            duplicates.add(email);
        }
        seen.add(email);
    }
    return [...duplicates];
};
const createOrLoadBatch = (courseTitle, levelName, session) => __awaiter(void 0, void 0, void 0, function* () {
    const batchQuery = language_batch_model_1.default.findOne({
        courseTitle,
        name: levelName,
    });
    if (session) {
        batchQuery.session(session);
    }
    let batch = yield batchQuery;
    if (!batch) {
        batch = new language_batch_model_1.default({
            courseTitle,
            name: levelName,
            students: [],
        });
        if (session) {
            yield batch.save({ session });
        }
        else {
            yield batch.save();
        }
    }
    return batch;
});
const isTransactionUnsupportedError = (error) => {
    const message = String((error === null || error === void 0 ? void 0 : error.message) || '');
    return message.includes('Transaction numbers are only allowed on a replica set member or mongos');
};
const rollbackNonTransactionalApproval = (params) => __awaiter(void 0, void 0, void 0, function* () {
    if (params.createdEnrollmentIds.length > 0) {
        yield language_enrollment_model_1.default.deleteMany({
            _id: { $in: params.createdEnrollmentIds },
        });
    }
    if (params.createdUserIds.length > 0) {
        yield user_model_1.default.deleteMany({
            _id: { $in: params.createdUserIds },
        });
    }
    if (params.batchId) {
        yield language_batch_model_1.default.findByIdAndUpdate(params.batchId, { $set: { students: params.originalBatchStudentIds } });
    }
});
const processInstitutionApproval = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { requestId, adminUserId, session } = params;
    const approvalArtifacts = {
        createdStudentsForEmail: [],
    };
    const requestQuery = institutionEnrollmentRequest_model_1.default.findById(requestId);
    if (session) {
        requestQuery.session(session);
    }
    const request = yield requestQuery;
    if (!request || request.status !== 'PENDING') {
        throw new Error('Invalid institution request');
    }
    const validation = yield validateGermanSelection(request.courseTitle, request.levelName);
    if (validation.error) {
        throw new Error(validation.error);
    }
    const normalizedEmails = request.students.map((student) => normalizeEmail(student.email));
    const duplicateEmails = findDuplicateEmails(normalizedEmails);
    if (duplicateEmails.length > 0) {
        throw new Error('Duplicate student emails are not allowed in the same request.');
    }
    const existingUsersQuery = user_model_1.default.find({
        email: { $in: normalizedEmails },
    });
    if (session) {
        existingUsersQuery.session(session);
    }
    const existingUsers = yield existingUsersQuery;
    if (existingUsers.length > 0) {
        throw new Error('One or more student emails are already registered.');
    }
    const institutionQuery = user_model_1.default.findById(request.institutionId);
    if (session) {
        institutionQuery.session(session);
    }
    const institution = yield institutionQuery;
    if (!institution) {
        throw new Error('Institution account not found.');
    }
    const batch = yield createOrLoadBatch(request.courseTitle, request.levelName, session);
    const originalBatchStudentIds = [...batch.students];
    const createdUserIds = [];
    const createdEnrollmentIds = [];
    try {
        for (let index = 0; index < request.students.length; index += 1) {
            const studentEntry = request.students[index];
            const studentUser = new user_model_1.default({
                name: normalizeText(studentEntry.name),
                email: normalizeEmail(studentEntry.email),
                password: studentEntry.passwordHash,
                role: 'student',
                isVerified: true,
            });
            if (session) {
                yield studentUser.save({ session });
            }
            else {
                yield studentUser.save();
            }
            createdUserIds.push(studentUser._id);
            const createdEnrollments = yield language_enrollment_model_1.default.create([{
                    userId: studentUser._id,
                    courseTitle: request.courseTitle,
                    name: request.levelName,
                    status: 'APPROVED',
                    batchId: batch._id,
                }], session ? { session } : undefined);
            createdEnrollmentIds.push(createdEnrollments[0]._id);
            if (!batch.students.some((studentId) => studentId.equals(studentUser._id))) {
                batch.students.push(studentUser._id);
            }
            request.students[index].createdUserId = studentUser._id;
            approvalArtifacts.createdStudentsForEmail.push({
                name: studentUser.name,
                email: studentUser.email,
                courseTitle: request.courseTitle,
                levelName: request.levelName,
            });
        }
        request.status = 'APPROVED';
        request.adminDecisionBy = adminUserId;
        request.adminDecisionAt = new Date();
        request.rejectionReason = null;
        request.approvedBatchId = batch._id;
        if (session) {
            yield batch.save({ session });
            yield request.save({ session });
        }
        else {
            yield batch.save();
            yield request.save();
        }
        approvalArtifacts.institutionEmailPayload = {
            email: institution.email,
            institutionName: institution.institutionName || institution.name,
            courseTitle: request.courseTitle,
            levelName: request.levelName,
            studentCount: request.students.length,
        };
        return approvalArtifacts;
    }
    catch (error) {
        if (!session) {
            yield rollbackNonTransactionalApproval({
                createdEnrollmentIds,
                createdUserIds,
                batchId: batch._id,
                originalBatchStudentIds,
            });
        }
        throw error;
    }
});
const getInstitutionDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const institutionId = String(((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || '');
        const [institution, germanCourse, submissions] = yield Promise.all([
            user_model_1.default.findById(institutionId).select('name email role phoneNumber institutionName contactPersonName city state address'),
            getGermanCourse(),
            institutionEnrollmentRequest_model_1.default.find({ institutionId })
                .sort({ createdAt: -1 })
                .limit(10),
        ]);
        if (!institution) {
            return res.status(404).json({ message: 'Institution account not found' });
        }
        return res.status(200).json({
            institution: {
                _id: String(institution._id),
                name: institution.name,
                email: institution.email,
                role: institution.role,
                phoneNumber: institution.phoneNumber,
                institutionName: institution.institutionName,
                contactPersonName: institution.contactPersonName,
                city: institution.city,
                state: institution.state,
                address: institution.address,
            },
            language: 'German',
            course: germanCourse
                ? {
                    _id: String(germanCourse._id),
                    title: germanCourse.title,
                    levels: germanCourse.levels.map((level) => ({
                        name: level.name,
                        duration: level.duration,
                        price: level.price,
                        outcome: level.outcome,
                    })),
                }
                : null,
            submissions: submissions.map((submission) => sanitizeInstitutionRequest(submission.toObject())),
        });
    }
    catch (error) {
        console.error('Failed to load institution dashboard:', error);
        return res.status(500).json({ message: 'Failed to load institution dashboard' });
    }
});
exports.getInstitutionDashboard = getInstitutionDashboard;
const getInstitutionSubmissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const institutionId = String(((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || '');
        const submissions = yield institutionEnrollmentRequest_model_1.default.find({ institutionId })
            .sort({ createdAt: -1 });
        return res.status(200).json({
            submissions: submissions.map((submission) => sanitizeInstitutionRequest(submission.toObject())),
        });
    }
    catch (error) {
        console.error('Failed to fetch institution submissions:', error);
        return res.status(500).json({ message: 'Failed to fetch institution submissions' });
    }
});
exports.getInstitutionSubmissions = getInstitutionSubmissions;
const createInstitutionSubmission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const createDto = (0, class_transformer_1.plainToClass)(institution_dto_1.CreateInstitutionSubmissionDto, req.body);
    const errors = yield (0, class_validator_1.validate)(createDto);
    if (errors.length > 0)
        return res.status(400).json({ errors });
    const institutionId = String(((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || '');
    const normalizedCourseTitle = normalizeText(createDto.courseTitle);
    const normalizedLevelName = normalizeText(createDto.levelName);
    const normalizedStudents = createDto.students.map((student) => ({
        name: normalizeText(student.name),
        email: normalizeEmail(student.email),
        password: student.password,
    }));
    const duplicateEmails = findDuplicateEmails(normalizedStudents.map((student) => student.email));
    if (duplicateEmails.length > 0) {
        return res.status(400).json({
            message: 'Duplicate student emails are not allowed in the same request.',
            duplicateEmails,
        });
    }
    try {
        const [{ error }, existingUsers] = yield Promise.all([
            validateGermanSelection(normalizedCourseTitle, normalizedLevelName),
            user_model_1.default.find({
                email: { $in: normalizedStudents.map((student) => student.email) },
            }).select('email'),
        ]);
        if (error) {
            return res.status(400).json({ message: error });
        }
        if (existingUsers.length > 0) {
            return res.status(400).json({
                message: 'Some student emails are already registered.',
                existingEmails: existingUsers.map((user) => user.email),
            });
        }
        const students = yield Promise.all(normalizedStudents.map((student) => __awaiter(void 0, void 0, void 0, function* () {
            return ({
                name: student.name,
                email: student.email,
                passwordHash: yield bcryptjs_1.default.hash(student.password, 10),
            });
        })));
        const submission = yield institutionEnrollmentRequest_model_1.default.create({
            institutionId,
            language: 'German',
            courseTitle: normalizedCourseTitle,
            levelName: normalizedLevelName,
            students,
        });
        return res.status(201).json({
            message: 'Institution enrollment request submitted for admin review.',
            submission: sanitizeInstitutionRequest(submission.toObject()),
        });
    }
    catch (error) {
        console.error('Failed to create institution submission:', error);
        return res.status(500).json({ message: 'Failed to create institution submission' });
    }
});
exports.createInstitutionSubmission = createInstitutionSubmission;
const getAdminInstitutionRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const status = normalizeText(String(req.query.status || ''));
        const search = normalizeText(String(req.query.search || ''));
        const filter = {};
        if (status && status !== 'All') {
            filter.status = status.toUpperCase();
        }
        let matchingInstitutionIds = [];
        if (search) {
            const matchingInstitutions = yield user_model_1.default.find({
                role: 'institution',
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { institutionName: { $regex: search, $options: 'i' } },
                    { contactPersonName: { $regex: search, $options: 'i' } },
                    { phoneNumber: { $regex: search, $options: 'i' } },
                ],
            }).select('_id');
            matchingInstitutionIds = matchingInstitutions.map((institution) => institution._id);
            filter.$or = [
                { courseTitle: { $regex: search, $options: 'i' } },
                { levelName: { $regex: search, $options: 'i' } },
                { institutionId: { $in: matchingInstitutionIds } },
                { 'students.name': { $regex: search, $options: 'i' } },
                { 'students.email': { $regex: search, $options: 'i' } },
            ];
        }
        const requests = yield institutionEnrollmentRequest_model_1.default.find(filter)
            .populate('institutionId', 'name email phoneNumber institutionName contactPersonName city state address')
            .sort({ createdAt: -1 });
        const availableStatuses = ['All', 'PENDING', 'APPROVED', 'REJECTED'];
        return res.status(200).json({
            requests: requests.map((request) => sanitizeInstitutionRequest(request.toObject())),
            availableStatuses,
        });
    }
    catch (error) {
        console.error('Failed to fetch institution admin requests:', error);
        return res.status(500).json({ message: 'Failed to fetch institution admin requests' });
    }
});
exports.getAdminInstitutionRequests = getAdminInstitutionRequests;
const approveInstitutionRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const requestId = String(req.params.id || '').trim();
    if (!requestId) {
        return res.status(400).json({ message: 'Institution request id is required' });
    }
    const session = yield mongoose_1.default.startSession();
    try {
        let approvalArtifacts;
        try {
            yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
                var _a;
                approvalArtifacts = yield processInstitutionApproval({
                    requestId,
                    adminUserId: ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || null,
                    session,
                });
            }));
        }
        catch (error) {
            if (!isTransactionUnsupportedError(error)) {
                throw error;
            }
            console.warn('MongoDB transactions are unavailable. Falling back to non-transactional institution approval.');
            approvalArtifacts = yield processInstitutionApproval({
                requestId,
                adminUserId: ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || null,
                session: null,
            });
        }
        finally {
            session.endSession();
        }
        const decisionEmailPayload = approvalArtifacts.institutionEmailPayload;
        if (decisionEmailPayload) {
            yield emailService.sendInstitutionSubmissionDecisionEmail({
                to: decisionEmailPayload.email,
                institutionName: decisionEmailPayload.institutionName,
                status: 'APPROVED',
                courseTitle: decisionEmailPayload.courseTitle,
                levelName: decisionEmailPayload.levelName,
                studentCount: decisionEmailPayload.studentCount,
            });
        }
        yield Promise.all(approvalArtifacts.createdStudentsForEmail.map((student) => emailService.sendInstitutionStudentWelcomeEmail({
            to: student.email,
            studentName: student.name,
            courseTitle: student.courseTitle,
            levelName: student.levelName,
        })));
        const approvedRequest = yield institutionEnrollmentRequest_model_1.default.findById(requestId)
            .populate('institutionId', 'name email phoneNumber institutionName contactPersonName city state address');
        return res.status(200).json({
            message: 'Institution request approved successfully.',
            request: approvedRequest ? sanitizeInstitutionRequest(approvedRequest.toObject()) : null,
        });
    }
    catch (error) {
        console.error('Failed to approve institution request:', error);
        return res.status(400).json({ message: error.message || 'Failed to approve institution request' });
    }
});
exports.approveInstitutionRequest = approveInstitutionRequest;
const rejectInstitutionRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const rejectDto = (0, class_transformer_1.plainToClass)(institution_dto_1.RejectInstitutionSubmissionDto, req.body);
    const errors = yield (0, class_validator_1.validate)(rejectDto);
    if (errors.length > 0)
        return res.status(400).json({ errors });
    try {
        const request = yield institutionEnrollmentRequest_model_1.default.findById(req.params.id);
        if (!request || request.status !== 'PENDING') {
            return res.status(400).json({ message: 'Invalid institution request' });
        }
        request.status = 'REJECTED';
        request.adminDecisionBy = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || null;
        request.adminDecisionAt = new Date();
        request.rejectionReason = ((_b = rejectDto.reason) === null || _b === void 0 ? void 0 : _b.trim()) || null;
        yield request.save();
        const institution = yield user_model_1.default.findById(request.institutionId).select('email institutionName name');
        if (institution) {
            yield emailService.sendInstitutionSubmissionDecisionEmail({
                to: institution.email,
                institutionName: institution.institutionName || institution.name,
                status: 'REJECTED',
                courseTitle: request.courseTitle,
                levelName: request.levelName,
                studentCount: request.students.length,
            });
        }
        return res.status(200).json({
            message: 'Institution request rejected successfully.',
            request: sanitizeInstitutionRequest(request.toObject()),
        });
    }
    catch (error) {
        console.error('Failed to reject institution request:', error);
        return res.status(500).json({ message: 'Failed to reject institution request' });
    }
});
exports.rejectInstitutionRequest = rejectInstitutionRequest;
