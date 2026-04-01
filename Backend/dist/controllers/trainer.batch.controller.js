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
exports.joinTrainerBatchClass = exports.updateTrainerBatchAttendance = exports.endTrainerBatchClass = exports.deleteTrainerBatchClass = exports.scheduleTrainerBatchClass = exports.deleteTrainerBatchMaterial = exports.addTrainerBatchMaterial = exports.deleteTrainerBatchAnnouncement = exports.addTrainerBatchAnnouncement = exports.submitTrainerBatchAssessment = exports.getTrainerBatchAssessmentDetail = exports.createTrainerBatchAssessment = exports.getTrainerBatchAssessments = exports.getTrainerBatchClasses = exports.getTrainerBatchStudents = exports.getTrainerBatchMaterials = exports.getTrainerBatchAnnouncements = exports.getTrainerBatchDetails = exports.getTrainerBatches = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const announcement_model_1 = __importDefault(require("../models/announcement.model"));
const assessment_model_1 = __importDefault(require("../models/assessment.model"));
const assessmentAttempt_model_1 = __importDefault(require("../models/assessmentAttempt.model"));
const assignment_model_1 = __importDefault(require("../models/assignment.model"));
const attendance_model_1 = __importDefault(require("../models/attendance.model"));
const batch_model_1 = __importDefault(require("../models/batch.model"));
const classSession_model_1 = __importDefault(require("../models/classSession.model"));
const language_batch_model_1 = __importDefault(require("../models/language.batch.model"));
const skill_material_model_1 = __importDefault(require("../models/skill.material.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const google_calendar_service_1 = require("../services/google.calendar.service");
const language_trainer_controller_1 = require("./language.trainer.controller");
const roles_1 = require("../utils/roles");
const googleService = new google_calendar_service_1.GoogleCalendarService();
const DEFAULT_PAGE_LIMIT = 10;
const MAX_PAGE_LIMIT = 50;
const FILE_SERVE_DIR = '/home/sovirtraining/file_serve';
const getObjectIdString = (value) => {
    if (!value)
        return null;
    if (typeof value === 'string')
        return value;
    if (value._id)
        return String(value._id);
    if (typeof value.toString === 'function')
        return String(value.toString());
    return null;
};
const normalizeTrainingType = (value) => {
    if (String(value).trim().toLowerCase() === 'language')
        return 'language';
    if (String(value).trim().toLowerCase() === 'skill')
        return 'skill';
    return null;
};
const getPagination = (req) => {
    const parsedPage = Number.parseInt(String(req.query.page || ''), 10);
    const parsedLimit = Number.parseInt(String(req.query.limit || ''), 10);
    const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
    const limit = Number.isNaN(parsedLimit)
        ? DEFAULT_PAGE_LIMIT
        : Math.min(MAX_PAGE_LIMIT, Math.max(1, parsedLimit));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
const delegateLanguageHandler = (handler, req, res) => __awaiter(void 0, void 0, void 0, function* () { return handler(req, res); });
const deleteUploadedFile = (fileUrl) => {
    if (!fileUrl) {
        return;
    }
    try {
        const relativePath = fileUrl.replace('/uploads', '');
        const filePath = path_1.default.join(FILE_SERVE_DIR, relativePath);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
    }
    catch (error) {
        console.error('Failed to delete uploaded trainer material file:', error);
    }
};
const getSkillBatchAccess = (req, batchId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const batch = yield batch_model_1.default.findById(batchId)
        .populate('courseId')
        .populate('trainerId', 'name email')
        .populate('students', 'name email phoneNumber avatar germanLevel guardianName guardianPhone qualification dateOfBirth');
    if (!batch) {
        return null;
    }
    const userId = getObjectIdString((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
    const trainer = batch.trainerId;
    const trainerId = getObjectIdString(trainer);
    const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'admin';
    const isTrainer = !!userId && !!trainerId && userId === trainerId;
    const isStudent = !!userId && batch.students.some((student) => getObjectIdString(student) === userId);
    if (!isAdmin && !isTrainer && !isStudent) {
        return null;
    }
    return {
        batch,
        course: batch.courseId,
        trainer,
        isAdmin,
        isTrainer,
        isStudent,
    };
});
const getLanguageBatchAccess = (req, batchId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const batch = yield language_batch_model_1.default.findById(batchId)
        .populate('trainerId', 'name email')
        .populate('students', 'name email phoneNumber avatar germanLevel guardianName guardianPhone qualification dateOfBirth');
    if (!batch) {
        return null;
    }
    const userId = getObjectIdString((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
    const trainer = batch.trainerId;
    const trainerId = getObjectIdString(trainer);
    const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'admin';
    const isTrainer = !!userId && !!trainerId && userId === trainerId;
    const isStudent = !!userId && batch.students.some((student) => getObjectIdString(student) === userId);
    if (!isAdmin && !isTrainer && !isStudent) {
        return null;
    }
    return {
        batch,
        trainer,
        isAdmin,
        isTrainer,
        isStudent,
    };
});
const getSharedBatchAccess = (req, trainingType, batchId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (trainingType === 'language') {
        const access = yield getLanguageBatchAccess(req, batchId);
        if (!access) {
            return null;
        }
        return Object.assign(Object.assign({}, access), { studentCount: Array.isArray(access.batch.students) ? access.batch.students.length : 0, courseTitle: String(access.batch.courseTitle || '').trim() || 'Language Training', batchName: String(access.batch.name || '').trim() });
    }
    const access = yield getSkillBatchAccess(req, batchId);
    if (!access) {
        return null;
    }
    return Object.assign(Object.assign({}, access), { studentCount: Array.isArray(access.batch.students) ? access.batch.students.length : 0, courseTitle: String(((_a = access.course) === null || _a === void 0 ? void 0 : _a.title) || 'Skill Training').trim(), batchName: String(access.batch.name || '').trim() });
});
const mapSkillStudent = (student, includePrivateFields) => {
    if (!student) {
        return null;
    }
    if (!includePrivateFields) {
        return {
            _id: String(student._id),
            name: student.name,
            avatar: student.avatar || '',
        };
    }
    return {
        _id: String(student._id),
        name: student.name,
        email: student.email || '',
        phoneNumber: student.phoneNumber || '',
        avatar: student.avatar || '',
        germanLevel: student.germanLevel || '',
        guardianName: student.guardianName || '',
        guardianPhone: student.guardianPhone || '',
        qualification: student.qualification || '',
        dateOfBirth: student.dateOfBirth || null,
        isProfileComplete: !!(student.phoneNumber
            && student.guardianName
            && student.guardianPhone
            && student.qualification),
    };
};
const loadSkillAttendanceMap = (classIds) => __awaiter(void 0, void 0, void 0, function* () {
    if (classIds.length === 0) {
        return new Map();
    }
    const attendances = yield attendance_model_1.default.find({
        classSessionId: { $in: classIds },
        status: { $in: ['present', 'late'] },
    }).sort({ updatedAt: -1, createdAt: -1 });
    const attendanceMap = new Map();
    attendances.forEach((attendance) => {
        const classId = String(attendance.classSessionId);
        const entries = attendanceMap.get(classId) || [];
        entries.push({
            studentId: String(attendance.studentId),
            joinedAt: attendance.updatedAt || attendance.createdAt,
        });
        attendanceMap.set(classId, entries);
    });
    return attendanceMap;
});
const mapSkillClassForView = (skillClass, attendees) => ({
    _id: String(skillClass._id),
    topic: skillClass.topic,
    startTime: skillClass.startTime,
    meetLink: skillClass.meetingLink || '',
    attendees,
    status: skillClass.status,
});
const buildSkillMaterials = (batchId) => __awaiter(void 0, void 0, void 0, function* () {
    const [uploadedMaterials, assignments, classSessions] = yield Promise.all([
        skill_material_model_1.default.find({ batchId }).sort({ createdAt: -1 }),
        assignment_model_1.default.find({ batchId }).sort({ createdAt: -1 }),
        classSession_model_1.default.find({ batchId }).sort({ createdAt: -1 }),
    ]);
    const uploaded = uploadedMaterials.map((material) => ({
        _id: String(material._id),
        title: material.title,
        subtitle: material.subtitle || '',
        description: material.description || '',
        fileUrl: material.fileUrl || '',
        attachments: material.fileUrl ? [material.fileUrl] : [],
        createdAt: material.createdAt,
        materialType: 'uploaded',
        isSystemMaterial: false,
    }));
    const assignmentBacked = assignments.map((assignment) => ({
        _id: `assignment-${String(assignment._id)}`,
        title: assignment.title,
        subtitle: assignment.maxScore ? `Assignment - ${assignment.maxScore} points` : 'Assignment',
        description: assignment.description || 'Assignment shared by your trainer.',
        fileUrl: Array.isArray(assignment.attachments) && assignment.attachments.length > 0
            ? assignment.attachments[0]
            : '',
        attachments: Array.isArray(assignment.attachments) ? assignment.attachments : [],
        createdAt: assignment.createdAt,
        materialType: 'assignment',
        isSystemMaterial: true,
    }));
    const classResources = classSessions
        .filter((skillClass) => ((Array.isArray(skillClass.resources) && skillClass.resources.length > 0)
        || (Array.isArray(skillClass.recordings) && skillClass.recordings.length > 0)))
        .map((skillClass) => {
        const attachments = [
            ...(Array.isArray(skillClass.resources) ? skillClass.resources : []),
            ...(Array.isArray(skillClass.recordings) ? skillClass.recordings : []),
        ];
        return {
            _id: `class-resource-${String(skillClass._id)}`,
            title: skillClass.topic,
            subtitle: 'Class Resources',
            description: 'Trainer-shared files and recordings from this skill session.',
            fileUrl: attachments[0] || '',
            attachments,
            createdAt: skillClass.updatedAt || skillClass.createdAt,
            materialType: 'class-resource',
            isSystemMaterial: true,
        };
    });
    return [...uploaded, ...assignmentBacked, ...classResources].sort((left, right) => {
        const leftTime = new Date(left.createdAt || 0).getTime();
        const rightTime = new Date(right.createdAt || 0).getTime();
        return rightTime - leftTime;
    });
});
const buildPaginationResponse = (items, page, limit) => {
    const total = items.length;
    const data = items.slice((page - 1) * limit, (page - 1) * limit + limit);
    return {
        data,
        total,
        page,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total,
    };
};
const normalizeBlankAnswer = (value) => String(value || '').trim().toLowerCase();
const normalizeAssessmentQuestions = (input) => {
    if (!Array.isArray(input) || input.length === 0) {
        return {
            error: 'At least one question is required.',
            questions: [],
        };
    }
    const questions = [];
    for (let index = 0; index < input.length; index += 1) {
        const rawQuestion = input[index];
        const type = String((rawQuestion === null || rawQuestion === void 0 ? void 0 : rawQuestion.type) || '').trim();
        const prompt = String((rawQuestion === null || rawQuestion === void 0 ? void 0 : rawQuestion.prompt) || '').trim();
        if (!['mcq', 'true_false', 'fill_blank'].includes(type)) {
            return {
                error: `Question ${index + 1} has an invalid type.`,
                questions: [],
            };
        }
        if (!prompt) {
            return {
                error: `Question ${index + 1} must include a prompt.`,
                questions: [],
            };
        }
        if (type === 'mcq') {
            const options = Array.isArray(rawQuestion === null || rawQuestion === void 0 ? void 0 : rawQuestion.options)
                ? rawQuestion.options.map((option) => String(option || '').trim()).filter(Boolean)
                : [];
            const correctOptionIndex = Number(rawQuestion === null || rawQuestion === void 0 ? void 0 : rawQuestion.correctOptionIndex);
            if (options.length < 2) {
                return {
                    error: `Question ${index + 1} must have at least two options.`,
                    questions: [],
                };
            }
            if (!Number.isInteger(correctOptionIndex) || correctOptionIndex < 0 || correctOptionIndex >= options.length) {
                return {
                    error: `Question ${index + 1} must have exactly one valid correct option.`,
                    questions: [],
                };
            }
            questions.push({
                type,
                prompt,
                options,
                correctOptionIndex,
            });
            continue;
        }
        if (type === 'true_false') {
            if (typeof (rawQuestion === null || rawQuestion === void 0 ? void 0 : rawQuestion.correctBoolean) !== 'boolean') {
                return {
                    error: `Question ${index + 1} must have a true or false answer.`,
                    questions: [],
                };
            }
            questions.push({
                type,
                prompt,
                options: [],
                correctBoolean: rawQuestion.correctBoolean,
            });
            continue;
        }
        const blankAnswer = String((rawQuestion === null || rawQuestion === void 0 ? void 0 : rawQuestion.blankAnswer) || '').trim();
        if (!blankAnswer) {
            return {
                error: `Question ${index + 1} must have a fill-in-the-blank answer.`,
                questions: [],
            };
        }
        questions.push({
            type,
            prompt,
            options: [],
            blankAnswer,
        });
    }
    return {
        questions,
        error: '',
    };
};
const mapAssessmentQuestionForResponse = (question, includeAnswerKey) => {
    const response = {
        _id: String(question._id),
        type: question.type,
        prompt: question.prompt,
    };
    if (question.type === 'mcq') {
        response.options = Array.isArray(question.options) ? question.options : [];
    }
    if (!includeAnswerKey) {
        return response;
    }
    if (question.type === 'mcq') {
        response.correctOptionIndex = question.correctOptionIndex;
    }
    else if (question.type === 'true_false') {
        response.correctBoolean = question.correctBoolean;
    }
    else if (question.type === 'fill_blank') {
        response.blankAnswer = question.blankAnswer || '';
    }
    return response;
};
const mapAssessmentAttemptSummary = (attempt) => ({
    _id: String(attempt._id),
    attemptNumber: attempt.attemptNumber,
    correctCount: attempt.correctCount,
    totalQuestions: attempt.totalQuestions,
    scorePercentage: attempt.scorePercentage,
    status: attempt.status,
    createdAt: attempt.createdAt,
});
const buildTrainerAssessmentSummary = (attempts, studentCount) => {
    const passedStudentIds = new Set(attempts
        .filter((attempt) => attempt.status === 'passed')
        .map((attempt) => String(attempt.studentId)));
    return {
        attemptCount: attempts.length,
        passedStudents: passedStudentIds.size,
        studentsPendingPass: Math.max(studentCount - passedStudentIds.size, 0),
    };
};
const buildStudentAssessmentProgress = (attempts) => {
    const sortedAttempts = [...attempts].sort((left, right) => {
        if (right.attemptNumber !== left.attemptNumber) {
            return right.attemptNumber - left.attemptNumber;
        }
        return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
    });
    const latestAttempt = sortedAttempts[0] || null;
    const passedAttempt = sortedAttempts.find((attempt) => attempt.status === 'passed') || null;
    return {
        attemptCount: sortedAttempts.length,
        latestAttempt: latestAttempt ? mapAssessmentAttemptSummary(latestAttempt) : null,
        latestScore: latestAttempt ? latestAttempt.scorePercentage : null,
        passed: !!passedAttempt,
        finalized: !!passedAttempt,
        canRetry: !passedAttempt,
        attempts: sortedAttempts.map(mapAssessmentAttemptSummary),
    };
};
const gradeAssessmentQuestion = (question, submittedAnswer) => {
    if (question.type === 'mcq') {
        const selectedOptionIndex = typeof (submittedAnswer === null || submittedAnswer === void 0 ? void 0 : submittedAnswer.selectedOptionIndex) === 'number'
            ? submittedAnswer.selectedOptionIndex
            : undefined;
        return {
            questionId: question._id,
            questionType: question.type,
            selectedOptionIndex,
            isCorrect: selectedOptionIndex === question.correctOptionIndex,
        };
    }
    if (question.type === 'true_false') {
        const booleanAnswer = typeof (submittedAnswer === null || submittedAnswer === void 0 ? void 0 : submittedAnswer.booleanAnswer) === 'boolean'
            ? submittedAnswer.booleanAnswer
            : undefined;
        return {
            questionId: question._id,
            questionType: question.type,
            booleanAnswer,
            isCorrect: booleanAnswer === question.correctBoolean,
        };
    }
    const textAnswer = typeof (submittedAnswer === null || submittedAnswer === void 0 ? void 0 : submittedAnswer.textAnswer) === 'string'
        ? submittedAnswer.textAnswer.trim()
        : '';
    return {
        questionId: question._id,
        questionType: question.type,
        textAnswer,
        isCorrect: normalizeBlankAnswer(textAnswer) === normalizeBlankAnswer(question.blankAnswer || ''),
    };
};
const getTrainerEventAttendees = (batch, trainerId) => __awaiter(void 0, void 0, void 0, function* () {
    const trainer = yield user_model_1.default.findById(trainerId).select('+googleRefreshToken email');
    const attendeeEmails = batch.students
        .map((student) => student.email)
        .filter(Boolean);
    if (trainer === null || trainer === void 0 ? void 0 : trainer.email) {
        attendeeEmails.push(trainer.email);
    }
    return {
        trainer,
        attendeeEmails,
    };
});
const getTrainerBatches = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const trainerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const [languageBatches, skillBatches] = yield Promise.all([
            language_batch_model_1.default.find({ trainerId })
                .populate('students', '_id')
                .sort({ createdAt: -1 }),
            batch_model_1.default.find({ trainerId, isActive: true })
                .populate('courseId', 'title')
                .populate('students', '_id')
                .sort({ createdAt: -1 }),
        ]);
        const normalizedBatches = [
            ...languageBatches.map((batch) => ({
                _id: String(batch._id),
                courseTitle: String(batch.courseTitle || '').trim(),
                name: String(batch.name || '').trim(),
                studentCount: Array.isArray(batch.students) ? batch.students.length : 0,
                trainingType: 'language',
                createdAt: batch.createdAt || null,
            })),
            ...skillBatches.map((batch) => {
                var _a;
                return ({
                    _id: String(batch._id),
                    courseTitle: String(((_a = batch.courseId) === null || _a === void 0 ? void 0 : _a.title) || 'Skill Training').trim(),
                    name: String(batch.name || '').trim(),
                    studentCount: Array.isArray(batch.students) ? batch.students.length : 0,
                    trainingType: 'skill',
                    createdAt: batch.createdAt || null,
                });
            }),
        ].sort((left, right) => {
            const leftTime = new Date(left.createdAt || 0).getTime();
            const rightTime = new Date(right.createdAt || 0).getTime();
            return rightTime - leftTime;
        });
        return res.status(200).json(normalizedBatches);
    }
    catch (error) {
        console.error('Failed to fetch trainer batches:', error);
        return res.status(500).json({ message: 'Failed to fetch trainer batches', error });
    }
});
exports.getTrainerBatches = getTrainerBatches;
const getTrainerBatchDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const trainingType = normalizeTrainingType(req.params.trainingType);
    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }
    if (trainingType === 'language') {
        return delegateLanguageHandler(language_trainer_controller_1.getBatchDetails, req, res);
    }
    try {
        const access = yield getSkillBatchAccess(req, req.params.batchId);
        if (!access) {
            return res.status(404).json({ message: 'Skill batch not found or access denied' });
        }
        const { batch, course, trainer, isAdmin, isTrainer } = access;
        const classes = yield classSession_model_1.default.find({ batchId: batch._id }).sort({ startTime: -1 });
        const attendanceMap = yield loadSkillAttendanceMap(classes.map((skillClass) => String(skillClass._id)));
        return res.status(200).json({
            _id: String(batch._id),
            name: batch.name,
            courseTitle: (course === null || course === void 0 ? void 0 : course.title) || 'Skill Training',
            trainerId: getObjectIdString(trainer),
            announcements: [],
            materials: [],
            students: batch.students
                .map((student) => mapSkillStudent(student, isAdmin || isTrainer))
                .filter(Boolean),
            classes: classes.map((skillClass) => (mapSkillClassForView(skillClass, attendanceMap.get(String(skillClass._id)) || []))),
        });
    }
    catch (error) {
        console.error('Failed to fetch trainer batch details:', error);
        return res.status(500).json({ message: 'Failed to fetch trainer batch details', error });
    }
});
exports.getTrainerBatchDetails = getTrainerBatchDetails;
const getTrainerBatchAnnouncements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const trainingType = normalizeTrainingType(req.params.trainingType);
    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }
    if (trainingType === 'language') {
        return delegateLanguageHandler(language_trainer_controller_1.getBatchAnnouncements, req, res);
    }
    try {
        const access = yield getSkillBatchAccess(req, req.params.batchId);
        if (!access) {
            return res.status(404).json({ message: 'Skill batch not found or access denied' });
        }
        const { page, limit } = getPagination(req);
        const announcements = yield announcement_model_1.default.find({ batchId: req.params.batchId }).sort({ createdAt: -1 });
        return res.status(200).json(buildPaginationResponse(announcements.map((announcement) => ({
            _id: String(announcement._id),
            title: announcement.title,
            content: announcement.content,
            createdAt: announcement.createdAt,
        })), page, limit));
    }
    catch (error) {
        console.error('Failed to fetch trainer batch announcements:', error);
        return res.status(500).json({ message: 'Failed to fetch trainer batch announcements', error });
    }
});
exports.getTrainerBatchAnnouncements = getTrainerBatchAnnouncements;
const getTrainerBatchMaterials = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const trainingType = normalizeTrainingType(req.params.trainingType);
    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }
    if (trainingType === 'language') {
        return delegateLanguageHandler(language_trainer_controller_1.getBatchMaterials, req, res);
    }
    try {
        const access = yield getSkillBatchAccess(req, req.params.batchId);
        if (!access) {
            return res.status(404).json({ message: 'Skill batch not found or access denied' });
        }
        const { page, limit } = getPagination(req);
        const materials = yield buildSkillMaterials(req.params.batchId);
        return res.status(200).json(buildPaginationResponse(materials, page, limit));
    }
    catch (error) {
        console.error('Failed to fetch trainer batch materials:', error);
        return res.status(500).json({ message: 'Failed to fetch trainer batch materials', error });
    }
});
exports.getTrainerBatchMaterials = getTrainerBatchMaterials;
const getTrainerBatchStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const trainingType = normalizeTrainingType(req.params.trainingType);
    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }
    if (trainingType === 'language') {
        return delegateLanguageHandler(language_trainer_controller_1.getBatchStudents, req, res);
    }
    try {
        const access = yield getSkillBatchAccess(req, req.params.batchId);
        if (!access) {
            return res.status(404).json({ message: 'Skill batch not found or access denied' });
        }
        const { page, limit } = getPagination(req);
        const { batch, isAdmin, isTrainer } = access;
        const students = batch.students
            .map((student) => mapSkillStudent(student, isAdmin || isTrainer))
            .filter(Boolean);
        return res.status(200).json(buildPaginationResponse(students, page, limit));
    }
    catch (error) {
        console.error('Failed to fetch trainer batch students:', error);
        return res.status(500).json({ message: 'Failed to fetch trainer batch students', error });
    }
});
exports.getTrainerBatchStudents = getTrainerBatchStudents;
const getTrainerBatchClasses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const trainingType = normalizeTrainingType(req.params.trainingType);
    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }
    if (trainingType === 'language') {
        return delegateLanguageHandler(language_trainer_controller_1.getBatchClasses, req, res);
    }
    try {
        const access = yield getSkillBatchAccess(req, req.params.batchId);
        if (!access) {
            return res.status(404).json({ message: 'Skill batch not found or access denied' });
        }
        const { page, limit, skip } = getPagination(req);
        const classes = yield classSession_model_1.default.find({ batchId: req.params.batchId })
            .sort({ startTime: -1 })
            .skip(skip)
            .limit(limit);
        const total = yield classSession_model_1.default.countDocuments({ batchId: req.params.batchId });
        const attendanceMap = yield loadSkillAttendanceMap(classes.map((skillClass) => String(skillClass._id)));
        return res.status(200).json({
            data: classes.map((skillClass) => (mapSkillClassForView(skillClass, attendanceMap.get(String(skillClass._id)) || []))),
            total,
            page,
            pages: Math.ceil(total / limit),
            hasMore: skip + classes.length < total,
        });
    }
    catch (error) {
        console.error('Failed to fetch trainer batch classes:', error);
        return res.status(500).json({ message: 'Failed to fetch trainer batch classes', error });
    }
});
exports.getTrainerBatchClasses = getTrainerBatchClasses;
const getTrainerBatchAssessments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const trainingType = normalizeTrainingType(req.params.trainingType);
    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }
    try {
        const access = yield getSharedBatchAccess(req, trainingType, req.params.batchId);
        if (!access) {
            return res.status(404).json({ message: 'Batch not found or access denied' });
        }
        const { page, limit, skip } = getPagination(req);
        const filter = { trainingType, batchId: req.params.batchId };
        const [assessments, total] = yield Promise.all([
            assessment_model_1.default.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            assessment_model_1.default.countDocuments(filter),
        ]);
        const assessmentIds = assessments.map((assessment) => assessment._id);
        if (assessmentIds.length === 0) {
            return res.status(200).json({
                data: [],
                total,
                page,
                pages: Math.ceil(total / limit),
                hasMore: false,
            });
        }
        if (access.isTrainer || access.isAdmin) {
            const attempts = yield assessmentAttempt_model_1.default.find({ assessmentId: { $in: assessmentIds } })
                .select('assessmentId studentId status');
            const attemptsByAssessmentId = new Map();
            attempts.forEach((attempt) => {
                const assessmentId = String(attempt.assessmentId);
                const existingAttempts = attemptsByAssessmentId.get(assessmentId) || [];
                existingAttempts.push(attempt);
                attemptsByAssessmentId.set(assessmentId, existingAttempts);
            });
            return res.status(200).json({
                data: assessments.map((assessment) => {
                    const summary = buildTrainerAssessmentSummary(attemptsByAssessmentId.get(String(assessment._id)) || [], access.studentCount);
                    return Object.assign({ _id: String(assessment._id), batchId: String(assessment.batchId), trainingType, title: assessment.title, description: assessment.description || '', passPercentage: assessment.passPercentage, publishedAt: assessment.publishedAt, createdAt: assessment.createdAt, questionCount: assessment.questions.length }, summary);
                }),
                total,
                page,
                pages: Math.ceil(total / limit),
                hasMore: skip + assessments.length < total,
            });
        }
        const attempts = yield assessmentAttempt_model_1.default.find({
            assessmentId: { $in: assessmentIds },
            studentId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
        }).sort({ attemptNumber: -1, createdAt: -1 });
        const attemptsByAssessmentId = new Map();
        attempts.forEach((attempt) => {
            const assessmentId = String(attempt.assessmentId);
            const existingAttempts = attemptsByAssessmentId.get(assessmentId) || [];
            existingAttempts.push(attempt);
            attemptsByAssessmentId.set(assessmentId, existingAttempts);
        });
        return res.status(200).json({
            data: assessments.map((assessment) => {
                var _a;
                const progress = buildStudentAssessmentProgress(attemptsByAssessmentId.get(String(assessment._id)) || []);
                return {
                    _id: String(assessment._id),
                    batchId: String(assessment.batchId),
                    trainingType,
                    title: assessment.title,
                    description: assessment.description || '',
                    passPercentage: assessment.passPercentage,
                    publishedAt: assessment.publishedAt,
                    createdAt: assessment.createdAt,
                    questionCount: assessment.questions.length,
                    attemptCount: progress.attemptCount,
                    latestScore: progress.latestScore,
                    latestStatus: ((_a = progress.latestAttempt) === null || _a === void 0 ? void 0 : _a.status) || null,
                    passed: progress.passed,
                    finalized: progress.finalized,
                    canRetry: progress.canRetry,
                    canStart: progress.attemptCount === 0,
                };
            }),
            total,
            page,
            pages: Math.ceil(total / limit),
            hasMore: skip + assessments.length < total,
        });
    }
    catch (error) {
        console.error('Failed to fetch trainer batch assessments:', error);
        return res.status(500).json({ message: 'Failed to fetch trainer batch assessments', error });
    }
});
exports.getTrainerBatchAssessments = getTrainerBatchAssessments;
const createTrainerBatchAssessment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const trainingType = normalizeTrainingType(req.params.trainingType);
    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }
    try {
        const { batchId, title, description, questions } = req.body;
        const normalizedTitle = String(title || '').trim();
        if (!batchId) {
            return res.status(400).json({ message: 'batchId is required.' });
        }
        if (!normalizedTitle) {
            return res.status(400).json({ message: 'Assessment title is required.' });
        }
        const access = yield getSharedBatchAccess(req, trainingType, String(batchId));
        if (!access || (!access.isTrainer && !access.isAdmin)) {
            return res.status(403).json({ message: 'Not authorized to create assessments for this batch' });
        }
        const normalizedQuestions = normalizeAssessmentQuestions(questions);
        if (normalizedQuestions.error) {
            return res.status(400).json({ message: normalizedQuestions.error });
        }
        const assessment = yield assessment_model_1.default.create({
            trainingType,
            batchId,
            title: normalizedTitle,
            description: String(description || '').trim() || undefined,
            passPercentage: 40,
            createdBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            publishedAt: new Date(),
            questions: normalizedQuestions.questions,
        });
        return res.status(201).json({
            _id: String(assessment._id),
            batchId: String(assessment.batchId),
            trainingType,
            title: assessment.title,
            description: assessment.description || '',
            passPercentage: assessment.passPercentage,
            publishedAt: assessment.publishedAt,
            createdAt: assessment.createdAt,
            questionCount: assessment.questions.length,
            attemptCount: 0,
            passedStudents: 0,
            studentsPendingPass: access.studentCount,
        });
    }
    catch (error) {
        console.error('Failed to create trainer batch assessment:', error);
        return res.status(500).json({ message: 'Failed to create trainer batch assessment', error });
    }
});
exports.createTrainerBatchAssessment = createTrainerBatchAssessment;
const getTrainerBatchAssessmentDetail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const trainingType = normalizeTrainingType(req.params.trainingType);
    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }
    try {
        const assessment = yield assessment_model_1.default.findOne({
            _id: req.params.assessmentId,
            trainingType,
        });
        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }
        const access = yield getSharedBatchAccess(req, trainingType, String(assessment.batchId));
        if (!access) {
            return res.status(404).json({ message: 'Batch not found or access denied' });
        }
        const includeAnswerKey = access.isTrainer || access.isAdmin;
        const basePayload = {
            _id: String(assessment._id),
            batchId: String(assessment.batchId),
            trainingType,
            title: assessment.title,
            description: assessment.description || '',
            passPercentage: assessment.passPercentage,
            publishedAt: assessment.publishedAt,
            createdAt: assessment.createdAt,
            courseTitle: access.courseTitle,
            batchName: access.batchName,
            questionCount: assessment.questions.length,
            questions: assessment.questions.map((question) => (mapAssessmentQuestionForResponse(question, includeAnswerKey))),
        };
        if (includeAnswerKey) {
            const attempts = yield assessmentAttempt_model_1.default.find({ assessmentId: assessment._id })
                .select('assessmentId studentId status');
            return res.status(200).json(Object.assign(Object.assign({}, basePayload), { summary: buildTrainerAssessmentSummary(attempts, access.studentCount) }));
        }
        const studentAttempts = yield assessmentAttempt_model_1.default.find({
            assessmentId: assessment._id,
            studentId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
        }).sort({ attemptNumber: -1, createdAt: -1 });
        return res.status(200).json(Object.assign(Object.assign({}, basePayload), { studentProgress: buildStudentAssessmentProgress(studentAttempts) }));
    }
    catch (error) {
        console.error('Failed to fetch trainer batch assessment detail:', error);
        return res.status(500).json({ message: 'Failed to fetch trainer batch assessment detail', error });
    }
});
exports.getTrainerBatchAssessmentDetail = getTrainerBatchAssessmentDetail;
const submitTrainerBatchAssessment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const trainingType = normalizeTrainingType(req.params.trainingType);
    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }
    try {
        const assessment = yield assessment_model_1.default.findOne({
            _id: req.params.assessmentId,
            trainingType,
        });
        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }
        const access = yield getSharedBatchAccess(req, trainingType, String(assessment.batchId));
        if (!access || !access.isStudent || !(0, roles_1.isLearnerRole)((_a = req.user) === null || _a === void 0 ? void 0 : _a.role)) {
            return res.status(403).json({ message: 'Only enrolled students can submit this assessment' });
        }
        const existingPassedAttempt = yield assessmentAttempt_model_1.default.findOne({
            assessmentId: assessment._id,
            studentId: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
            status: 'passed',
        }).select('_id');
        if (existingPassedAttempt) {
            return res.status(400).json({ message: 'Assessment already passed and finalized.' });
        }
        const rawAnswers = Array.isArray((_c = req.body) === null || _c === void 0 ? void 0 : _c.answers) ? req.body.answers : [];
        const answersByQuestionId = new Map();
        rawAnswers.forEach((rawAnswer) => {
            const questionId = String((rawAnswer === null || rawAnswer === void 0 ? void 0 : rawAnswer.questionId) || '').trim();
            if (!questionId || answersByQuestionId.has(questionId)) {
                return;
            }
            const normalizedAnswer = { questionId };
            const answerRecord = rawAnswer;
            const parsedOptionIndex = Number(answerRecord === null || answerRecord === void 0 ? void 0 : answerRecord.selectedOptionIndex);
            if (Number.isInteger(parsedOptionIndex)) {
                normalizedAnswer.selectedOptionIndex = parsedOptionIndex;
            }
            if (typeof (answerRecord === null || answerRecord === void 0 ? void 0 : answerRecord.booleanAnswer) === 'boolean') {
                normalizedAnswer.booleanAnswer = answerRecord.booleanAnswer;
            }
            if (typeof (answerRecord === null || answerRecord === void 0 ? void 0 : answerRecord.textAnswer) === 'string') {
                normalizedAnswer.textAnswer = answerRecord.textAnswer;
            }
            answersByQuestionId.set(questionId, normalizedAnswer);
        });
        const gradedAnswers = assessment.questions.map((question) => (gradeAssessmentQuestion(question, answersByQuestionId.get(String(question._id)) || null)));
        const correctCount = gradedAnswers.filter((answer) => answer.isCorrect).length;
        const totalQuestions = assessment.questions.length;
        const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
        const status = scorePercentage >= assessment.passPercentage ? 'passed' : 'failed';
        const attemptNumber = (yield assessmentAttempt_model_1.default.countDocuments({
            assessmentId: assessment._id,
            studentId: (_d = req.user) === null || _d === void 0 ? void 0 : _d._id,
        })) + 1;
        const attempt = yield assessmentAttempt_model_1.default.create({
            assessmentId: assessment._id,
            trainingType,
            batchId: assessment.batchId,
            studentId: (_e = req.user) === null || _e === void 0 ? void 0 : _e._id,
            attemptNumber,
            answers: gradedAnswers,
            correctCount,
            totalQuestions,
            scorePercentage,
            status,
        });
        return res.status(201).json({
            message: status === 'passed' ? 'Assessment passed and finalized.' : 'Assessment failed. Retry is available.',
            attempt: mapAssessmentAttemptSummary(attempt),
            passed: status === 'passed',
            finalized: status === 'passed',
            canRetry: status !== 'passed',
        });
    }
    catch (error) {
        console.error('Failed to submit trainer batch assessment:', error);
        return res.status(500).json({ message: 'Failed to submit trainer batch assessment', error });
    }
});
exports.submitTrainerBatchAssessment = submitTrainerBatchAssessment;
const addTrainerBatchAnnouncement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const trainingType = normalizeTrainingType(req.params.trainingType);
    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }
    if (trainingType === 'language') {
        return delegateLanguageHandler(language_trainer_controller_1.addAnnouncement, req, res);
    }
    try {
        const { batchId, title, content } = req.body;
        const trainerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'admin';
        const batch = isAdmin
            ? yield batch_model_1.default.findById(batchId)
            : yield batch_model_1.default.findOne({ _id: batchId, trainerId });
        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to add announcement to this batch' });
        }
        const announcement = yield announcement_model_1.default.create({
            batchId,
            senderId: trainerId,
            title,
            content,
        });
        return res.status(201).json(announcement);
    }
    catch (error) {
        console.error('Failed to add trainer batch announcement:', error);
        return res.status(500).json({ message: 'Failed to add trainer batch announcement', error });
    }
});
exports.addTrainerBatchAnnouncement = addTrainerBatchAnnouncement;
const deleteTrainerBatchAnnouncement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const trainingType = normalizeTrainingType(req.params.trainingType);
    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }
    if (trainingType === 'language') {
        return delegateLanguageHandler(language_trainer_controller_1.deleteAnnouncement, req, res);
    }
    try {
        const trainerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const announcement = yield announcement_model_1.default.findById(req.params.announcementId);
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }
        const batch = yield batch_model_1.default.findOne({ _id: announcement.batchId, trainerId });
        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to delete this announcement' });
        }
        yield announcement.deleteOne();
        return res.status(200).json({ message: 'Announcement deleted successfully' });
    }
    catch (error) {
        console.error('Failed to delete trainer batch announcement:', error);
        return res.status(500).json({ message: 'Failed to delete trainer batch announcement', error });
    }
});
exports.deleteTrainerBatchAnnouncement = deleteTrainerBatchAnnouncement;
const addTrainerBatchMaterial = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const trainingType = normalizeTrainingType(req.params.trainingType);
    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }
    if (trainingType === 'language') {
        return delegateLanguageHandler(language_trainer_controller_1.addMaterial, req, res);
    }
    try {
        const { batchId, title, subtitle, description } = req.body;
        const trainerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'admin';
        const batch = isAdmin
            ? yield batch_model_1.default.findById(batchId)
            : yield batch_model_1.default.findOne({ _id: batchId, trainerId });
        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to add material to this batch' });
        }
        const material = yield skill_material_model_1.default.create({
            batchId,
            title,
            subtitle,
            description,
            fileUrl: req.file ? `/uploads/materials/${req.file.filename}` : '',
            uploadedBy: trainerId,
        });
        return res.status(201).json(material);
    }
    catch (error) {
        console.error('Failed to add trainer batch material:', error);
        return res.status(500).json({ message: 'Failed to add trainer batch material', error });
    }
});
exports.addTrainerBatchMaterial = addTrainerBatchMaterial;
const deleteTrainerBatchMaterial = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const trainingType = normalizeTrainingType(req.params.trainingType);
    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }
    if (trainingType === 'language') {
        return delegateLanguageHandler(language_trainer_controller_1.deleteMaterial, req, res);
    }
    try {
        const trainerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const material = yield skill_material_model_1.default.findById(req.params.materialId);
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }
        const batch = yield batch_model_1.default.findOne({ _id: material.batchId, trainerId });
        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to delete this material' });
        }
        deleteUploadedFile(material.fileUrl);
        yield material.deleteOne();
        return res.status(200).json({ message: 'Material deleted successfully' });
    }
    catch (error) {
        console.error('Failed to delete trainer batch material:', error);
        return res.status(500).json({ message: 'Failed to delete trainer batch material', error });
    }
});
exports.deleteTrainerBatchMaterial = deleteTrainerBatchMaterial;
const scheduleTrainerBatchClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const trainingType = normalizeTrainingType(req.params.trainingType);
    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }
    if (trainingType === 'language') {
        return delegateLanguageHandler(language_trainer_controller_1.scheduleClass, req, res);
    }
    try {
        const { batchId, topic, startTime } = req.body;
        const isAdmin = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'admin';
        const trainerId = String(((_b = req.user) === null || _b === void 0 ? void 0 : _b._id) || '');
        const batch = isAdmin
            ? yield batch_model_1.default.findById(batchId).populate('students', 'email')
            : yield batch_model_1.default.findOne({ _id: batchId, trainerId }).populate('students', 'email');
        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to schedule class for this batch' });
        }
        const actualTrainerId = String(batch.trainerId);
        const { trainer, attendeeEmails } = yield getTrainerEventAttendees(batch, actualTrainerId);
        let meetingLink = '';
        let eventId = '';
        if (trainer === null || trainer === void 0 ? void 0 : trainer.googleRefreshToken) {
            googleService.setCredentials(trainer.googleRefreshToken);
            const event = yield googleService.createMeeting(`Class: ${topic}`, `Live class for ${((_c = batch.courseId) === null || _c === void 0 ? void 0 : _c.title) || 'Skill Training'} - ${batch.name}`, new Date(startTime), 60, attendeeEmails);
            meetingLink = event.meetLink;
            eventId = event.eventId;
        }
        else if (req.body.meetLink) {
            meetingLink = req.body.meetLink;
        }
        else {
            return res.status(400).json({ message: 'Google Calendar not connected. Please connect or provide a link manually.' });
        }
        const newClass = yield classSession_model_1.default.create({
            batchId,
            trainerId: actualTrainerId,
            topic,
            startTime,
            endTime: new Date(new Date(startTime).getTime() + 60 * 60 * 1000),
            meetingLink,
            eventId,
            status: 'scheduled',
        });
        return res.status(201).json(mapSkillClassForView(newClass, []));
    }
    catch (error) {
        console.error('Failed to schedule trainer batch class:', error);
        return res.status(500).json({ message: 'Failed to schedule trainer batch class', error });
    }
});
exports.scheduleTrainerBatchClass = scheduleTrainerBatchClass;
const deleteTrainerBatchClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const trainingType = normalizeTrainingType(req.params.trainingType);
    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }
    if (trainingType === 'language') {
        return delegateLanguageHandler(language_trainer_controller_1.deleteClass, req, res);
    }
    try {
        const trainerId = String(((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || '');
        const skillClass = yield classSession_model_1.default.findById(req.params.classId);
        if (!skillClass) {
            return res.status(404).json({ message: 'Class not found' });
        }
        const batch = yield batch_model_1.default.findOne({ _id: skillClass.batchId, trainerId });
        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to delete this class' });
        }
        if (skillClass.eventId) {
            const trainer = yield user_model_1.default.findById(trainerId).select('+googleRefreshToken');
            if (trainer === null || trainer === void 0 ? void 0 : trainer.googleRefreshToken) {
                googleService.setCredentials(trainer.googleRefreshToken);
                yield googleService.deleteEvent(skillClass.eventId);
            }
        }
        yield attendance_model_1.default.deleteMany({ classSessionId: skillClass._id });
        yield skillClass.deleteOne();
        return res.status(200).json({ message: 'Class deleted successfully' });
    }
    catch (error) {
        console.error('Failed to delete trainer batch class:', error);
        return res.status(500).json({ message: 'Failed to delete trainer batch class', error });
    }
});
exports.deleteTrainerBatchClass = deleteTrainerBatchClass;
const endTrainerBatchClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const trainingType = normalizeTrainingType(req.params.trainingType);
    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }
    if (trainingType === 'language') {
        return delegateLanguageHandler(language_trainer_controller_1.endClass, req, res);
    }
    try {
        const trainerId = String(((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || '');
        const skillClass = yield classSession_model_1.default.findById(req.params.classId);
        if (!skillClass) {
            return res.status(404).json({ message: 'Class not found' });
        }
        if (String(skillClass.trainerId) !== trainerId) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (skillClass.eventId) {
            const trainer = yield user_model_1.default.findById(trainerId).select('+googleRefreshToken');
            if (trainer === null || trainer === void 0 ? void 0 : trainer.googleRefreshToken) {
                googleService.setCredentials(trainer.googleRefreshToken);
                yield googleService.deleteEvent(skillClass.eventId);
            }
        }
        skillClass.status = 'completed';
        yield skillClass.save();
        return res.status(200).json({
            message: 'Class ended successfully',
            class: mapSkillClassForView(skillClass, yield loadSkillAttendanceMap([String(skillClass._id)]).then((attendanceMap) => attendanceMap.get(String(skillClass._id)) || [])),
        });
    }
    catch (error) {
        console.error('Failed to end trainer batch class:', error);
        return res.status(500).json({ message: 'Failed to end trainer batch class', error });
    }
});
exports.endTrainerBatchClass = endTrainerBatchClass;
const updateTrainerBatchAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const trainingType = normalizeTrainingType(req.params.trainingType);
    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }
    if (trainingType === 'language') {
        return delegateLanguageHandler(language_trainer_controller_1.updateAttendance, req, res);
    }
    try {
        const trainerId = String(((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || '');
        const { studentId, attended } = req.body;
        const skillClass = yield classSession_model_1.default.findById(req.params.classId);
        if (!skillClass) {
            return res.status(404).json({ message: 'Class not found' });
        }
        if (String(skillClass.trainerId) !== trainerId) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (attended) {
            yield attendance_model_1.default.findOneAndUpdate({ classSessionId: skillClass._id, studentId }, { $set: { status: 'present' } }, { upsert: true, new: true, setDefaultsOnInsert: true });
        }
        else {
            yield attendance_model_1.default.deleteOne({ classSessionId: skillClass._id, studentId });
        }
        const attendanceMap = yield loadSkillAttendanceMap([String(skillClass._id)]);
        return res.status(200).json({
            message: 'Attendance updated',
            attendees: attendanceMap.get(String(skillClass._id)) || [],
        });
    }
    catch (error) {
        console.error('Failed to update trainer batch attendance:', error);
        return res.status(500).json({ message: 'Failed to update trainer batch attendance', error });
    }
});
exports.updateTrainerBatchAttendance = updateTrainerBatchAttendance;
const joinTrainerBatchClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const trainingType = normalizeTrainingType(req.params.trainingType);
    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }
    if (trainingType === 'language') {
        return delegateLanguageHandler(language_trainer_controller_1.joinClass, req, res);
    }
    try {
        const userId = String(((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || '');
        const skillClass = yield classSession_model_1.default.findById(req.params.classId);
        if (!skillClass) {
            return res.status(404).json({ message: 'Class not found' });
        }
        const batch = yield batch_model_1.default.findById(skillClass.batchId);
        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }
        const isTrainer = String(skillClass.trainerId) === userId;
        const isStudent = batch.students.some((studentId) => String(studentId) === userId);
        const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'admin';
        if (!isTrainer && !isStudent && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to join this class' });
        }
        if (isAdmin) {
            return res.status(200).json({
                message: 'Admin monitoring — attendance not recorded',
                link: skillClass.meetingLink || '',
            });
        }
        if (isStudent) {
            yield attendance_model_1.default.findOneAndUpdate({ classSessionId: skillClass._id, studentId: userId }, { $set: { status: 'present' } }, { upsert: true, new: true, setDefaultsOnInsert: true });
        }
        return res.status(200).json({
            message: 'Attendance recorded',
            link: skillClass.meetingLink || '',
        });
    }
    catch (error) {
        console.error('Failed to join trainer batch class:', error);
        return res.status(500).json({ message: 'Failed to join trainer batch class', error });
    }
});
exports.joinTrainerBatchClass = joinTrainerBatchClass;
