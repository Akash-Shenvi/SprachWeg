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
exports.getSkillBatchClasses = exports.getSkillBatchStudents = exports.getSkillBatchMaterials = exports.getSkillBatchAnnouncements = exports.getSkillBatchDetails = void 0;
const announcement_model_1 = __importDefault(require("../models/announcement.model"));
const assignment_model_1 = __importDefault(require("../models/assignment.model"));
const batch_model_1 = __importDefault(require("../models/batch.model"));
const classSession_model_1 = __importDefault(require("../models/classSession.model"));
const submission_model_1 = __importDefault(require("../models/submission.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const DEFAULT_PAGE_LIMIT = 10;
const MAX_PAGE_LIMIT = 50;
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
const getAuthorizedBatch = (req, batchId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const batch = yield batch_model_1.default.findById(batchId)
        .populate('courseId')
        .populate('trainerId', 'name email');
    if (!batch) {
        return null;
    }
    const userId = getObjectIdString((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
    const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'admin';
    const trainerId = getObjectIdString(batch.trainerId);
    const isTrainer = !!userId && !!trainerId && trainerId === userId;
    const isStudent = !!userId && batch.students.some((studentId) => getObjectIdString(studentId) === userId);
    if (!isAdmin && !isTrainer && !isStudent) {
        return null;
    }
    return {
        batch,
        isAdmin,
        isTrainer,
        isStudent,
    };
});
const getSkillBatchDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { batchId } = req.params;
        const access = yield getAuthorizedBatch(req, batchId);
        if (!access) {
            return res.status(404).json({ message: 'Skill batch not found or access denied' });
        }
        const { batch } = access;
        const course = batch.courseId;
        const trainer = batch.trainerId;
        const [announcementCount, assignmentCount, classCount, resourceClasses] = yield Promise.all([
            announcement_model_1.default.countDocuments({ batchId: batch._id }),
            assignment_model_1.default.countDocuments({ batchId: batch._id }),
            classSession_model_1.default.countDocuments({ batchId: batch._id }),
            classSession_model_1.default.find({ batchId: batch._id }).select('resources recordings'),
        ]);
        const classResourceCount = resourceClasses.filter((skillClass) => ((Array.isArray(skillClass.resources) && skillClass.resources.length > 0)
            || (Array.isArray(skillClass.recordings) && skillClass.recordings.length > 0))).length;
        return res.json({
            _id: String(batch._id),
            name: batch.name,
            isActive: !!batch.isActive,
            schedule: batch.schedule || { days: [], startTime: '', endTime: '' },
            startDate: batch.startDate || null,
            endDate: batch.endDate || null,
            studentCount: Array.isArray(batch.students) ? batch.students.length : 0,
            trainer: trainer ? {
                _id: getObjectIdString(trainer),
                name: trainer.name || 'Trainer not assigned',
                email: trainer.email || '',
            } : null,
            course: {
                _id: getObjectIdString(course),
                title: (course === null || course === void 0 ? void 0 : course.title) || 'Skill Training',
                subtitle: (course === null || course === void 0 ? void 0 : course.subtitle) || '',
                description: (course === null || course === void 0 ? void 0 : course.description) || 'Your batch details and learning materials will appear here.',
                level: (course === null || course === void 0 ? void 0 : course.level) || '',
                category: (course === null || course === void 0 ? void 0 : course.category) || '',
                duration: (course === null || course === void 0 ? void 0 : course.duration) || '',
                image: (course === null || course === void 0 ? void 0 : course.image) || '',
                features: Array.isArray(course === null || course === void 0 ? void 0 : course.features) ? course.features.filter(Boolean) : [],
            },
            counts: {
                announcements: announcementCount,
                materials: 1 + assignmentCount + classResourceCount,
                students: Array.isArray(batch.students) ? batch.students.length : 0,
                classes: classCount,
            },
        });
    }
    catch (error) {
        console.error('Failed to fetch skill batch details:', error);
        return res.status(500).json({ message: 'Failed to fetch skill batch details' });
    }
});
exports.getSkillBatchDetails = getSkillBatchDetails;
const getSkillBatchAnnouncements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { batchId } = req.params;
        const access = yield getAuthorizedBatch(req, batchId);
        if (!access) {
            return res.status(404).json({ message: 'Skill batch not found or access denied' });
        }
        const { page, limit, skip } = getPagination(req);
        const total = yield announcement_model_1.default.countDocuments({ batchId });
        const data = yield announcement_model_1.default.find({ batchId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        return res.json({
            data: data.map((announcement) => ({
                _id: String(announcement._id),
                title: announcement.title,
                content: announcement.content,
                isPinned: announcement.isPinned,
                createdAt: announcement.createdAt,
            })),
            total,
            page,
            pages: Math.ceil(total / limit),
            hasMore: skip + data.length < total,
        });
    }
    catch (error) {
        console.error('Failed to fetch skill batch announcements:', error);
        return res.status(500).json({ message: 'Failed to fetch skill batch announcements' });
    }
});
exports.getSkillBatchAnnouncements = getSkillBatchAnnouncements;
const getSkillBatchMaterials = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { batchId } = req.params;
        const access = yield getAuthorizedBatch(req, batchId);
        if (!access) {
            return res.status(404).json({ message: 'Skill batch not found or access denied' });
        }
        const { batch, isStudent } = access;
        const course = batch.courseId;
        const assignments = yield assignment_model_1.default.find({ batchId: batch._id }).sort({ dueDate: 1, createdAt: -1 });
        const classes = yield classSession_model_1.default.find({ batchId: batch._id }).sort({ startTime: -1 });
        const assignmentIds = assignments.map((assignment) => assignment._id);
        const submissions = isStudent && assignmentIds.length > 0
            ? yield submission_model_1.default.find({
                assignmentId: { $in: assignmentIds },
                studentId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            }).select('assignmentId status grade feedback submissionDate')
            : [];
        const submissionByAssignmentId = new Map();
        submissions.forEach((submission) => {
            submissionByAssignmentId.set(String(submission.assignmentId), submission);
        });
        const materials = [
            {
                _id: `course-overview-${getObjectIdString(course) || String(batch._id)}`,
                type: 'overview',
                title: `${(course === null || course === void 0 ? void 0 : course.title) || 'Skill Training'} Course Overview`,
                subtitle: [course === null || course === void 0 ? void 0 : course.level, course === null || course === void 0 ? void 0 : course.category].filter(Boolean).join(' • '),
                description: (course === null || course === void 0 ? void 0 : course.description) || 'Course guidance and trainer-shared resources will appear here.',
                createdAt: batch.createdAt,
                attachments: [],
                highlights: Array.isArray(course === null || course === void 0 ? void 0 : course.features) ? course.features.filter(Boolean) : [],
            },
            ...assignments.map((assignment) => {
                const submission = submissionByAssignmentId.get(String(assignment._id));
                return {
                    _id: String(assignment._id),
                    type: 'assignment',
                    title: assignment.title,
                    subtitle: `Assignment${assignment.maxScore ? ` • ${assignment.maxScore} points` : ''}`,
                    description: assignment.description || 'Assignment shared by your trainer.',
                    createdAt: assignment.createdAt,
                    dueDate: assignment.dueDate,
                    attachments: Array.isArray(assignment.attachments) ? assignment.attachments : [],
                    highlights: [],
                    submissionStatus: (submission === null || submission === void 0 ? void 0 : submission.status) || null,
                    submittedAt: (submission === null || submission === void 0 ? void 0 : submission.submissionDate) || null,
                    grade: typeof (submission === null || submission === void 0 ? void 0 : submission.grade) === 'number' ? submission.grade : null,
                    feedback: (submission === null || submission === void 0 ? void 0 : submission.feedback) || '',
                };
            }),
            ...classes
                .filter((skillClass) => ((Array.isArray(skillClass.resources) && skillClass.resources.length > 0)
                || (Array.isArray(skillClass.recordings) && skillClass.recordings.length > 0)))
                .map((skillClass) => ({
                _id: String(skillClass._id),
                type: 'class-resource',
                title: skillClass.topic,
                subtitle: 'Class resources',
                description: 'Trainer-shared resources and recordings for this class session.',
                createdAt: skillClass.updatedAt || skillClass.createdAt,
                startTime: skillClass.startTime,
                attachments: [
                    ...(Array.isArray(skillClass.resources) ? skillClass.resources : []),
                    ...(Array.isArray(skillClass.recordings) ? skillClass.recordings : []),
                ],
                highlights: [],
            })),
        ];
        const { page, limit, skip } = getPagination(req);
        const data = materials.slice(skip, skip + limit);
        const total = materials.length;
        return res.json({
            data,
            total,
            page,
            pages: Math.ceil(total / limit),
            hasMore: skip + data.length < total,
        });
    }
    catch (error) {
        console.error('Failed to fetch skill batch materials:', error);
        return res.status(500).json({ message: 'Failed to fetch skill batch materials' });
    }
});
exports.getSkillBatchMaterials = getSkillBatchMaterials;
const getSkillBatchStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { batchId } = req.params;
        const access = yield getAuthorizedBatch(req, batchId);
        if (!access) {
            return res.status(404).json({ message: 'Skill batch not found or access denied' });
        }
        const { batch, isAdmin, isTrainer } = access;
        const { page, limit, skip } = getPagination(req);
        const select = isAdmin || isTrainer
            ? 'name email phoneNumber avatar qualification'
            : 'name avatar';
        const total = Array.isArray(batch.students) ? batch.students.length : 0;
        const students = total === 0
            ? []
            : yield user_model_1.default.find({ _id: { $in: batch.students } })
                .select(select)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit);
        return res.json({
            data: students.map((student) => ({
                _id: String(student._id),
                name: student.name,
                email: isAdmin || isTrainer ? student.email : '',
                phoneNumber: isAdmin || isTrainer ? student.phoneNumber || '' : '',
                qualification: isAdmin || isTrainer ? student.qualification || '' : '',
                avatar: student.avatar || '',
            })),
            total,
            page,
            pages: Math.ceil(total / limit),
            hasMore: skip + students.length < total,
        });
    }
    catch (error) {
        console.error('Failed to fetch skill batch students:', error);
        return res.status(500).json({ message: 'Failed to fetch skill batch students' });
    }
});
exports.getSkillBatchStudents = getSkillBatchStudents;
const getSkillBatchClasses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { batchId } = req.params;
        const access = yield getAuthorizedBatch(req, batchId);
        if (!access) {
            return res.status(404).json({ message: 'Skill batch not found or access denied' });
        }
        const { page, limit, skip } = getPagination(req);
        const total = yield classSession_model_1.default.countDocuments({ batchId });
        const classes = yield classSession_model_1.default.find({ batchId })
            .sort({ startTime: -1 })
            .skip(skip)
            .limit(limit);
        return res.json({
            data: classes.map((skillClass) => ({
                _id: String(skillClass._id),
                topic: skillClass.topic,
                startTime: skillClass.startTime,
                endTime: skillClass.endTime,
                meetingLink: skillClass.meetingLink || '',
                status: skillClass.status,
                resources: Array.isArray(skillClass.resources) ? skillClass.resources : [],
                recordings: Array.isArray(skillClass.recordings) ? skillClass.recordings : [],
                createdAt: skillClass.createdAt,
            })),
            total,
            page,
            pages: Math.ceil(total / limit),
            hasMore: skip + classes.length < total,
        });
    }
    catch (error) {
        console.error('Failed to fetch skill batch classes:', error);
        return res.status(500).json({ message: 'Failed to fetch skill batch classes' });
    }
});
exports.getSkillBatchClasses = getSkillBatchClasses;
