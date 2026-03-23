import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import Announcement from '../models/announcement.model';
import Assessment from '../models/assessment.model';
import AssessmentAttempt from '../models/assessmentAttempt.model';
import Assignment from '../models/assignment.model';
import Attendance from '../models/attendance.model';
import Batch from '../models/batch.model';
import ClassSession from '../models/classSession.model';
import LanguageBatch from '../models/language.batch.model';
import SkillMaterial from '../models/skill.material.model';
import User from '../models/user.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { GoogleCalendarService } from '../services/google.calendar.service';
import {
    addAnnouncement as addLanguageAnnouncement,
    addMaterial as addLanguageMaterial,
    deleteAnnouncement as deleteLanguageAnnouncement,
    deleteClass as deleteLanguageClass,
    deleteMaterial as deleteLanguageMaterial,
    endClass as endLanguageClass,
    getBatchAnnouncements as getLanguageBatchAnnouncements,
    getBatchClasses as getLanguageBatchClasses,
    getBatchDetails as getLanguageBatchDetails,
    getBatchMaterials as getLanguageBatchMaterials,
    getBatchStudents as getLanguageBatchStudents,
    scheduleClass as scheduleLanguageClass,
    updateAttendance as updateLanguageAttendance,
    joinClass as joinLanguageClass,
} from './language.trainer.controller';

const googleService = new GoogleCalendarService();
const DEFAULT_PAGE_LIMIT = 10;
const MAX_PAGE_LIMIT = 50;
const FILE_SERVE_DIR = '/home/sovirtraining/file_serve';

type TrainingType = 'language' | 'skill';

type SkillBatchAccess = {
    batch: any;
    course: any;
    trainer: any;
    isAdmin: boolean;
    isTrainer: boolean;
    isStudent: boolean;
};

type LanguageBatchAccess = {
    batch: any;
    trainer: any;
    isAdmin: boolean;
    isTrainer: boolean;
    isStudent: boolean;
};

type SharedBatchAccess = {
    batch: any;
    trainer: any;
    isAdmin: boolean;
    isTrainer: boolean;
    isStudent: boolean;
    studentCount: number;
    courseTitle: string;
    batchName: string;
};

type SkillAttendanceEntry = {
    studentId: string;
    joinedAt: Date;
};

type SubmittedAssessmentAnswer = {
    questionId: string;
    selectedOptionIndex?: number;
    booleanAnswer?: boolean;
    textAnswer?: string;
};

const getObjectIdString = (value: any): string | null => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (value._id) return String(value._id);
    if (typeof value.toString === 'function') return String(value.toString());
    return null;
};

const normalizeTrainingType = (value: unknown): TrainingType | null => {
    if (String(value).trim().toLowerCase() === 'language') return 'language';
    if (String(value).trim().toLowerCase() === 'skill') return 'skill';
    return null;
};

const getPagination = (req: AuthRequest) => {
    const parsedPage = Number.parseInt(String(req.query.page || ''), 10);
    const parsedLimit = Number.parseInt(String(req.query.limit || ''), 10);
    const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
    const limit = Number.isNaN(parsedLimit)
        ? DEFAULT_PAGE_LIMIT
        : Math.min(MAX_PAGE_LIMIT, Math.max(1, parsedLimit));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

const delegateLanguageHandler = async (
    handler: (req: AuthRequest, res: Response) => Promise<any>,
    req: AuthRequest,
    res: Response
) => handler(req, res);

const deleteUploadedFile = (fileUrl?: string | null) => {
    if (!fileUrl) {
        return;
    }

    try {
        const relativePath = fileUrl.replace('/uploads', '');
        const filePath = path.join(FILE_SERVE_DIR, relativePath);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error('Failed to delete uploaded trainer material file:', error);
    }
};

const getSkillBatchAccess = async (req: AuthRequest, batchId: string): Promise<SkillBatchAccess | null> => {
    const batch = await Batch.findById(batchId)
        .populate('courseId')
        .populate('trainerId', 'name email')
        .populate('students', 'name email phoneNumber avatar germanLevel guardianName guardianPhone qualification dateOfBirth');

    if (!batch) {
        return null;
    }

    const userId = getObjectIdString(req.user?._id);
    const trainer = batch.trainerId as any;
    const trainerId = getObjectIdString(trainer);
    const isAdmin = req.user?.role === 'admin';
    const isTrainer = !!userId && !!trainerId && userId === trainerId;
    const isStudent = !!userId && (batch.students as any[]).some((student) => getObjectIdString(student) === userId);

    if (!isAdmin && !isTrainer && !isStudent) {
        return null;
    }

    return {
        batch,
        course: batch.courseId as any,
        trainer,
        isAdmin,
        isTrainer,
        isStudent,
    };
};

const getLanguageBatchAccess = async (req: AuthRequest, batchId: string): Promise<LanguageBatchAccess | null> => {
    const batch = await LanguageBatch.findById(batchId)
        .populate('trainerId', 'name email')
        .populate('students', 'name email phoneNumber avatar germanLevel guardianName guardianPhone qualification dateOfBirth');

    if (!batch) {
        return null;
    }

    const userId = getObjectIdString(req.user?._id);
    const trainer = batch.trainerId as any;
    const trainerId = getObjectIdString(trainer);
    const isAdmin = req.user?.role === 'admin';
    const isTrainer = !!userId && !!trainerId && userId === trainerId;
    const isStudent = !!userId && (batch.students as any[]).some((student) => getObjectIdString(student) === userId);

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
};

const getSharedBatchAccess = async (
    req: AuthRequest,
    trainingType: TrainingType,
    batchId: string
): Promise<SharedBatchAccess | null> => {
    if (trainingType === 'language') {
        const access = await getLanguageBatchAccess(req, batchId);

        if (!access) {
            return null;
        }

        return {
            ...access,
            studentCount: Array.isArray(access.batch.students) ? access.batch.students.length : 0,
            courseTitle: String(access.batch.courseTitle || '').trim() || 'Language Training',
            batchName: String(access.batch.name || '').trim(),
        };
    }

    const access = await getSkillBatchAccess(req, batchId);

    if (!access) {
        return null;
    }

    return {
        ...access,
        studentCount: Array.isArray(access.batch.students) ? access.batch.students.length : 0,
        courseTitle: String((access.course as any)?.title || 'Skill Training').trim(),
        batchName: String(access.batch.name || '').trim(),
    };
};

const mapSkillStudent = (student: any, includePrivateFields: boolean) => {
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
        isProfileComplete: !!(
            student.phoneNumber
            && student.guardianName
            && student.guardianPhone
            && student.qualification
        ),
    };
};

const loadSkillAttendanceMap = async (classIds: string[]) => {
    if (classIds.length === 0) {
        return new Map<string, SkillAttendanceEntry[]>();
    }

    const attendances = await Attendance.find({
        classSessionId: { $in: classIds },
        status: { $in: ['present', 'late'] },
    }).sort({ updatedAt: -1, createdAt: -1 });

    const attendanceMap = new Map<string, SkillAttendanceEntry[]>();

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
};

const mapSkillClassForView = (skillClass: any, attendees: SkillAttendanceEntry[]) => ({
    _id: String(skillClass._id),
    topic: skillClass.topic,
    startTime: skillClass.startTime,
    meetLink: skillClass.meetingLink || '',
    attendees,
    status: skillClass.status,
});

const buildSkillMaterials = async (batchId: string) => {
    const [uploadedMaterials, assignments, classSessions] = await Promise.all([
        SkillMaterial.find({ batchId }).sort({ createdAt: -1 }),
        Assignment.find({ batchId }).sort({ createdAt: -1 }),
        ClassSession.find({ batchId }).sort({ createdAt: -1 }),
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
        .filter((skillClass) => (
            (Array.isArray(skillClass.resources) && skillClass.resources.length > 0)
            || (Array.isArray(skillClass.recordings) && skillClass.recordings.length > 0)
        ))
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
};

const buildPaginationResponse = <T,>(items: T[], page: number, limit: number) => {
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

const normalizeBlankAnswer = (value: string) => String(value || '').trim().toLowerCase();

const normalizeAssessmentQuestions = (input: unknown) => {
    if (!Array.isArray(input) || input.length === 0) {
        return {
            error: 'At least one question is required.',
            questions: [],
        };
    }

    const questions = [] as Array<Record<string, unknown>>;

    for (let index = 0; index < input.length; index += 1) {
        const rawQuestion = input[index] as Record<string, unknown>;
        const type = String(rawQuestion?.type || '').trim();
        const prompt = String(rawQuestion?.prompt || '').trim();

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
            const options = Array.isArray(rawQuestion?.options)
                ? rawQuestion.options.map((option) => String(option || '').trim()).filter(Boolean)
                : [];
            const correctOptionIndex = Number(rawQuestion?.correctOptionIndex);

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
            if (typeof rawQuestion?.correctBoolean !== 'boolean') {
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

        const blankAnswer = String(rawQuestion?.blankAnswer || '').trim();

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

const mapAssessmentQuestionForResponse = (question: any, includeAnswerKey: boolean) => {
    const response: Record<string, unknown> = {
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
    } else if (question.type === 'true_false') {
        response.correctBoolean = question.correctBoolean;
    } else if (question.type === 'fill_blank') {
        response.blankAnswer = question.blankAnswer || '';
    }

    return response;
};

const mapAssessmentAttemptSummary = (attempt: any) => ({
    _id: String(attempt._id),
    attemptNumber: attempt.attemptNumber,
    correctCount: attempt.correctCount,
    totalQuestions: attempt.totalQuestions,
    scorePercentage: attempt.scorePercentage,
    status: attempt.status,
    createdAt: attempt.createdAt,
});

const buildTrainerAssessmentSummary = (attempts: any[], studentCount: number) => {
    const passedStudentIds = new Set(
        attempts
            .filter((attempt) => attempt.status === 'passed')
            .map((attempt) => String(attempt.studentId))
    );

    return {
        attemptCount: attempts.length,
        passedStudents: passedStudentIds.size,
        studentsPendingPass: Math.max(studentCount - passedStudentIds.size, 0),
    };
};

const buildStudentAssessmentProgress = (attempts: any[]) => {
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

const gradeAssessmentQuestion = (question: any, submittedAnswer?: SubmittedAssessmentAnswer | null) => {
    if (question.type === 'mcq') {
        const selectedOptionIndex = typeof submittedAnswer?.selectedOptionIndex === 'number'
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
        const booleanAnswer = typeof submittedAnswer?.booleanAnswer === 'boolean'
            ? submittedAnswer.booleanAnswer
            : undefined;

        return {
            questionId: question._id,
            questionType: question.type,
            booleanAnswer,
            isCorrect: booleanAnswer === question.correctBoolean,
        };
    }

    const textAnswer = typeof submittedAnswer?.textAnswer === 'string'
        ? submittedAnswer.textAnswer.trim()
        : '';

    return {
        questionId: question._id,
        questionType: question.type,
        textAnswer,
        isCorrect: normalizeBlankAnswer(textAnswer) === normalizeBlankAnswer(question.blankAnswer || ''),
    };
};

const getTrainerEventAttendees = async (batch: any, trainerId: string) => {
    const trainer = await User.findById(trainerId).select('+googleRefreshToken email');
    const attendeeEmails = (batch.students as any[])
        .map((student) => student.email)
        .filter(Boolean);

    if (trainer?.email) {
        attendeeEmails.push(trainer.email);
    }

    return {
        trainer,
        attendeeEmails,
    };
};

export const getTrainerBatches = async (req: AuthRequest, res: Response) => {
    try {
        const trainerId = req.user?._id;

        const [languageBatches, skillBatches] = await Promise.all([
            LanguageBatch.find({ trainerId })
                .populate('students', '_id')
                .sort({ createdAt: -1 }),
            Batch.find({ trainerId, isActive: true })
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
                trainingType: 'language' as const,
                createdAt: (batch as any).createdAt || null,
            })),
            ...skillBatches.map((batch) => ({
                _id: String(batch._id),
                courseTitle: String((batch.courseId as any)?.title || 'Skill Training').trim(),
                name: String(batch.name || '').trim(),
                studentCount: Array.isArray(batch.students) ? batch.students.length : 0,
                trainingType: 'skill' as const,
                createdAt: (batch as any).createdAt || null,
            })),
        ].sort((left, right) => {
            const leftTime = new Date(left.createdAt || 0).getTime();
            const rightTime = new Date(right.createdAt || 0).getTime();
            return rightTime - leftTime;
        });

        return res.status(200).json(normalizedBatches);
    } catch (error) {
        console.error('Failed to fetch trainer batches:', error);
        return res.status(500).json({ message: 'Failed to fetch trainer batches', error });
    }
};

export const getTrainerBatchDetails = async (req: AuthRequest, res: Response) => {
    const trainingType = normalizeTrainingType(req.params.trainingType);

    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }

    if (trainingType === 'language') {
        return delegateLanguageHandler(getLanguageBatchDetails, req, res);
    }

    try {
        const access = await getSkillBatchAccess(req, req.params.batchId);

        if (!access) {
            return res.status(404).json({ message: 'Skill batch not found or access denied' });
        }

        const { batch, course, trainer, isAdmin, isTrainer } = access;
        const classes = await ClassSession.find({ batchId: batch._id }).sort({ startTime: -1 });
        const attendanceMap = await loadSkillAttendanceMap(classes.map((skillClass) => String(skillClass._id)));

        return res.status(200).json({
            _id: String(batch._id),
            name: batch.name,
            courseTitle: course?.title || 'Skill Training',
            trainerId: getObjectIdString(trainer),
            announcements: [],
            materials: [],
            students: (batch.students as any[])
                .map((student) => mapSkillStudent(student, isAdmin || isTrainer))
                .filter(Boolean),
            classes: classes.map((skillClass) => (
                mapSkillClassForView(skillClass, attendanceMap.get(String(skillClass._id)) || [])
            )),
        });
    } catch (error) {
        console.error('Failed to fetch trainer batch details:', error);
        return res.status(500).json({ message: 'Failed to fetch trainer batch details', error });
    }
};

export const getTrainerBatchAnnouncements = async (req: AuthRequest, res: Response) => {
    const trainingType = normalizeTrainingType(req.params.trainingType);

    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }

    if (trainingType === 'language') {
        return delegateLanguageHandler(getLanguageBatchAnnouncements, req, res);
    }

    try {
        const access = await getSkillBatchAccess(req, req.params.batchId);

        if (!access) {
            return res.status(404).json({ message: 'Skill batch not found or access denied' });
        }

        const { page, limit } = getPagination(req);
        const announcements = await Announcement.find({ batchId: req.params.batchId }).sort({ createdAt: -1 });

        return res.status(200).json(buildPaginationResponse(
            announcements.map((announcement) => ({
                _id: String(announcement._id),
                title: announcement.title,
                content: announcement.content,
                createdAt: announcement.createdAt,
            })),
            page,
            limit
        ));
    } catch (error) {
        console.error('Failed to fetch trainer batch announcements:', error);
        return res.status(500).json({ message: 'Failed to fetch trainer batch announcements', error });
    }
};

export const getTrainerBatchMaterials = async (req: AuthRequest, res: Response) => {
    const trainingType = normalizeTrainingType(req.params.trainingType);

    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }

    if (trainingType === 'language') {
        return delegateLanguageHandler(getLanguageBatchMaterials, req, res);
    }

    try {
        const access = await getSkillBatchAccess(req, req.params.batchId);

        if (!access) {
            return res.status(404).json({ message: 'Skill batch not found or access denied' });
        }

        const { page, limit } = getPagination(req);
        const materials = await buildSkillMaterials(req.params.batchId);

        return res.status(200).json(buildPaginationResponse(materials, page, limit));
    } catch (error) {
        console.error('Failed to fetch trainer batch materials:', error);
        return res.status(500).json({ message: 'Failed to fetch trainer batch materials', error });
    }
};

export const getTrainerBatchStudents = async (req: AuthRequest, res: Response) => {
    const trainingType = normalizeTrainingType(req.params.trainingType);

    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }

    if (trainingType === 'language') {
        return delegateLanguageHandler(getLanguageBatchStudents, req, res);
    }

    try {
        const access = await getSkillBatchAccess(req, req.params.batchId);

        if (!access) {
            return res.status(404).json({ message: 'Skill batch not found or access denied' });
        }

        const { page, limit } = getPagination(req);
        const { batch, isAdmin, isTrainer } = access;
        const students = (batch.students as any[])
            .map((student) => mapSkillStudent(student, isAdmin || isTrainer))
            .filter(Boolean);

        return res.status(200).json(buildPaginationResponse(students, page, limit));
    } catch (error) {
        console.error('Failed to fetch trainer batch students:', error);
        return res.status(500).json({ message: 'Failed to fetch trainer batch students', error });
    }
};

export const getTrainerBatchClasses = async (req: AuthRequest, res: Response) => {
    const trainingType = normalizeTrainingType(req.params.trainingType);

    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }

    if (trainingType === 'language') {
        return delegateLanguageHandler(getLanguageBatchClasses, req, res);
    }

    try {
        const access = await getSkillBatchAccess(req, req.params.batchId);

        if (!access) {
            return res.status(404).json({ message: 'Skill batch not found or access denied' });
        }

        const { page, limit, skip } = getPagination(req);
        const classes = await ClassSession.find({ batchId: req.params.batchId })
            .sort({ startTime: -1 })
            .skip(skip)
            .limit(limit);
        const total = await ClassSession.countDocuments({ batchId: req.params.batchId });
        const attendanceMap = await loadSkillAttendanceMap(classes.map((skillClass) => String(skillClass._id)));

        return res.status(200).json({
            data: classes.map((skillClass) => (
                mapSkillClassForView(skillClass, attendanceMap.get(String(skillClass._id)) || [])
            )),
            total,
            page,
            pages: Math.ceil(total / limit),
            hasMore: skip + classes.length < total,
        });
    } catch (error) {
        console.error('Failed to fetch trainer batch classes:', error);
        return res.status(500).json({ message: 'Failed to fetch trainer batch classes', error });
    }
};

export const getTrainerBatchAssessments = async (req: AuthRequest, res: Response) => {
    const trainingType = normalizeTrainingType(req.params.trainingType);

    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }

    try {
        const access = await getSharedBatchAccess(req, trainingType, req.params.batchId);

        if (!access) {
            return res.status(404).json({ message: 'Batch not found or access denied' });
        }

        const { page, limit, skip } = getPagination(req);
        const filter = { trainingType, batchId: req.params.batchId };
        const [assessments, total] = await Promise.all([
            Assessment.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Assessment.countDocuments(filter),
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
            const attempts = await AssessmentAttempt.find({ assessmentId: { $in: assessmentIds } })
                .select('assessmentId studentId status');
            const attemptsByAssessmentId = new Map<string, any[]>();

            attempts.forEach((attempt) => {
                const assessmentId = String(attempt.assessmentId);
                const existingAttempts = attemptsByAssessmentId.get(assessmentId) || [];
                existingAttempts.push(attempt);
                attemptsByAssessmentId.set(assessmentId, existingAttempts);
            });

            return res.status(200).json({
                data: assessments.map((assessment) => {
                    const summary = buildTrainerAssessmentSummary(
                        attemptsByAssessmentId.get(String(assessment._id)) || [],
                        access.studentCount
                    );

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
                        ...summary,
                    };
                }),
                total,
                page,
                pages: Math.ceil(total / limit),
                hasMore: skip + assessments.length < total,
            });
        }

        const attempts = await AssessmentAttempt.find({
            assessmentId: { $in: assessmentIds },
            studentId: req.user?._id,
        }).sort({ attemptNumber: -1, createdAt: -1 });
        const attemptsByAssessmentId = new Map<string, any[]>();

        attempts.forEach((attempt) => {
            const assessmentId = String(attempt.assessmentId);
            const existingAttempts = attemptsByAssessmentId.get(assessmentId) || [];
            existingAttempts.push(attempt);
            attemptsByAssessmentId.set(assessmentId, existingAttempts);
        });

        return res.status(200).json({
            data: assessments.map((assessment) => {
                const progress = buildStudentAssessmentProgress(
                    attemptsByAssessmentId.get(String(assessment._id)) || []
                );

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
                    latestStatus: progress.latestAttempt?.status || null,
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
    } catch (error) {
        console.error('Failed to fetch trainer batch assessments:', error);
        return res.status(500).json({ message: 'Failed to fetch trainer batch assessments', error });
    }
};

export const createTrainerBatchAssessment = async (req: AuthRequest, res: Response) => {
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

        const access = await getSharedBatchAccess(req, trainingType, String(batchId));

        if (!access || (!access.isTrainer && !access.isAdmin)) {
            return res.status(403).json({ message: 'Not authorized to create assessments for this batch' });
        }

        const normalizedQuestions = normalizeAssessmentQuestions(questions);

        if (normalizedQuestions.error) {
            return res.status(400).json({ message: normalizedQuestions.error });
        }

        const assessment = await Assessment.create({
            trainingType,
            batchId,
            title: normalizedTitle,
            description: String(description || '').trim() || undefined,
            passPercentage: 40,
            createdBy: req.user?._id,
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
    } catch (error) {
        console.error('Failed to create trainer batch assessment:', error);
        return res.status(500).json({ message: 'Failed to create trainer batch assessment', error });
    }
};

export const getTrainerBatchAssessmentDetail = async (req: AuthRequest, res: Response) => {
    const trainingType = normalizeTrainingType(req.params.trainingType);

    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }

    try {
        const assessment = await Assessment.findOne({
            _id: req.params.assessmentId,
            trainingType,
        });

        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        const access = await getSharedBatchAccess(req, trainingType, String(assessment.batchId));

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
            questions: assessment.questions.map((question) => (
                mapAssessmentQuestionForResponse(question, includeAnswerKey)
            )),
        };

        if (includeAnswerKey) {
            const attempts = await AssessmentAttempt.find({ assessmentId: assessment._id })
                .select('assessmentId studentId status');

            return res.status(200).json({
                ...basePayload,
                summary: buildTrainerAssessmentSummary(attempts, access.studentCount),
            });
        }

        const studentAttempts = await AssessmentAttempt.find({
            assessmentId: assessment._id,
            studentId: req.user?._id,
        }).sort({ attemptNumber: -1, createdAt: -1 });

        return res.status(200).json({
            ...basePayload,
            studentProgress: buildStudentAssessmentProgress(studentAttempts),
        });
    } catch (error) {
        console.error('Failed to fetch trainer batch assessment detail:', error);
        return res.status(500).json({ message: 'Failed to fetch trainer batch assessment detail', error });
    }
};

export const submitTrainerBatchAssessment = async (req: AuthRequest, res: Response) => {
    const trainingType = normalizeTrainingType(req.params.trainingType);

    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }

    try {
        const assessment = await Assessment.findOne({
            _id: req.params.assessmentId,
            trainingType,
        });

        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        const access = await getSharedBatchAccess(req, trainingType, String(assessment.batchId));

        if (!access || !access.isStudent || req.user?.role !== 'student') {
            return res.status(403).json({ message: 'Only enrolled students can submit this assessment' });
        }

        const existingPassedAttempt = await AssessmentAttempt.findOne({
            assessmentId: assessment._id,
            studentId: req.user?._id,
            status: 'passed',
        }).select('_id');

        if (existingPassedAttempt) {
            return res.status(400).json({ message: 'Assessment already passed and finalized.' });
        }

        const rawAnswers = Array.isArray(req.body?.answers) ? req.body.answers : [];
        const answersByQuestionId = new Map<string, SubmittedAssessmentAnswer>();

        rawAnswers.forEach((rawAnswer: unknown) => {
            const questionId = String((rawAnswer as Record<string, unknown>)?.questionId || '').trim();

            if (!questionId || answersByQuestionId.has(questionId)) {
                return;
            }

            const normalizedAnswer: SubmittedAssessmentAnswer = { questionId };
            const answerRecord = rawAnswer as Record<string, unknown>;
            const parsedOptionIndex = Number(answerRecord?.selectedOptionIndex);

            if (Number.isInteger(parsedOptionIndex)) {
                normalizedAnswer.selectedOptionIndex = parsedOptionIndex;
            }

            if (typeof answerRecord?.booleanAnswer === 'boolean') {
                normalizedAnswer.booleanAnswer = answerRecord.booleanAnswer;
            }

            if (typeof answerRecord?.textAnswer === 'string') {
                normalizedAnswer.textAnswer = answerRecord.textAnswer;
            }

            answersByQuestionId.set(questionId, normalizedAnswer);
        });

        const gradedAnswers = assessment.questions.map((question) => (
            gradeAssessmentQuestion(question, answersByQuestionId.get(String(question._id)) || null)
        ));
        const correctCount = gradedAnswers.filter((answer) => answer.isCorrect).length;
        const totalQuestions = assessment.questions.length;
        const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
        const status = scorePercentage >= assessment.passPercentage ? 'passed' : 'failed';
        const attemptNumber = await AssessmentAttempt.countDocuments({
            assessmentId: assessment._id,
            studentId: req.user?._id,
        }) + 1;

        const attempt = await AssessmentAttempt.create({
            assessmentId: assessment._id,
            trainingType,
            batchId: assessment.batchId,
            studentId: req.user?._id,
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
    } catch (error) {
        console.error('Failed to submit trainer batch assessment:', error);
        return res.status(500).json({ message: 'Failed to submit trainer batch assessment', error });
    }
};

export const addTrainerBatchAnnouncement = async (req: AuthRequest, res: Response) => {
    const trainingType = normalizeTrainingType(req.params.trainingType);

    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }

    if (trainingType === 'language') {
        return delegateLanguageHandler(addLanguageAnnouncement, req, res);
    }

    try {
        const { batchId, title, content } = req.body;
        const trainerId = req.user?._id;
        const isAdmin = req.user?.role === 'admin';
        const batch = isAdmin
            ? await Batch.findById(batchId)
            : await Batch.findOne({ _id: batchId, trainerId });

        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to add announcement to this batch' });
        }

        const announcement = await Announcement.create({
            batchId,
            senderId: trainerId,
            title,
            content,
        });

        return res.status(201).json(announcement);
    } catch (error) {
        console.error('Failed to add trainer batch announcement:', error);
        return res.status(500).json({ message: 'Failed to add trainer batch announcement', error });
    }
};

export const deleteTrainerBatchAnnouncement = async (req: AuthRequest, res: Response) => {
    const trainingType = normalizeTrainingType(req.params.trainingType);

    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }

    if (trainingType === 'language') {
        return delegateLanguageHandler(deleteLanguageAnnouncement, req, res);
    }

    try {
        const trainerId = req.user?._id;
        const announcement = await Announcement.findById(req.params.announcementId);

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        const batch = await Batch.findOne({ _id: announcement.batchId, trainerId });
        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to delete this announcement' });
        }

        await announcement.deleteOne();
        return res.status(200).json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error('Failed to delete trainer batch announcement:', error);
        return res.status(500).json({ message: 'Failed to delete trainer batch announcement', error });
    }
};

export const addTrainerBatchMaterial = async (req: AuthRequest, res: Response) => {
    const trainingType = normalizeTrainingType(req.params.trainingType);

    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }

    if (trainingType === 'language') {
        return delegateLanguageHandler(addLanguageMaterial, req, res);
    }

    try {
        const { batchId, title, subtitle, description } = req.body;
        const trainerId = req.user?._id;
        const isAdmin = req.user?.role === 'admin';
        const batch = isAdmin
            ? await Batch.findById(batchId)
            : await Batch.findOne({ _id: batchId, trainerId });

        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to add material to this batch' });
        }

        const material = await SkillMaterial.create({
            batchId,
            title,
            subtitle,
            description,
            fileUrl: req.file ? `/uploads/materials/${req.file.filename}` : '',
            uploadedBy: trainerId,
        });

        return res.status(201).json(material);
    } catch (error) {
        console.error('Failed to add trainer batch material:', error);
        return res.status(500).json({ message: 'Failed to add trainer batch material', error });
    }
};

export const deleteTrainerBatchMaterial = async (req: AuthRequest, res: Response) => {
    const trainingType = normalizeTrainingType(req.params.trainingType);

    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }

    if (trainingType === 'language') {
        return delegateLanguageHandler(deleteLanguageMaterial, req, res);
    }

    try {
        const trainerId = req.user?._id;
        const material = await SkillMaterial.findById(req.params.materialId);

        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        const batch = await Batch.findOne({ _id: material.batchId, trainerId });
        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to delete this material' });
        }

        deleteUploadedFile(material.fileUrl);
        await material.deleteOne();

        return res.status(200).json({ message: 'Material deleted successfully' });
    } catch (error) {
        console.error('Failed to delete trainer batch material:', error);
        return res.status(500).json({ message: 'Failed to delete trainer batch material', error });
    }
};

export const scheduleTrainerBatchClass = async (req: AuthRequest, res: Response) => {
    const trainingType = normalizeTrainingType(req.params.trainingType);

    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }

    if (trainingType === 'language') {
        return delegateLanguageHandler(scheduleLanguageClass, req, res);
    }

    try {
        const { batchId, topic, startTime } = req.body;
        const isAdmin = req.user?.role === 'admin';
        const trainerId = String(req.user?._id || '');
        const batch = isAdmin
            ? await Batch.findById(batchId).populate('students', 'email')
            : await Batch.findOne({ _id: batchId, trainerId }).populate('students', 'email');

        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to schedule class for this batch' });
        }

        const actualTrainerId = String(batch.trainerId);

        const { trainer, attendeeEmails } = await getTrainerEventAttendees(batch, actualTrainerId);
        let meetingLink = '';
        let eventId = '';

        if (trainer?.googleRefreshToken) {
            googleService.setCredentials(trainer.googleRefreshToken);
            const event = await googleService.createMeeting(
                `Class: ${topic}`,
                `Live class for ${(batch.courseId as any)?.title || 'Skill Training'} - ${batch.name}`,
                new Date(startTime),
                60,
                attendeeEmails
            );
            meetingLink = event.meetLink;
            eventId = event.eventId;
        } else if (req.body.meetLink) {
            meetingLink = req.body.meetLink;
        } else {
            return res.status(400).json({ message: 'Google Calendar not connected. Please connect or provide a link manually.' });
        }

        const newClass = await ClassSession.create({
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
    } catch (error) {
        console.error('Failed to schedule trainer batch class:', error);
        return res.status(500).json({ message: 'Failed to schedule trainer batch class', error });
    }
};

export const deleteTrainerBatchClass = async (req: AuthRequest, res: Response) => {
    const trainingType = normalizeTrainingType(req.params.trainingType);

    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }

    if (trainingType === 'language') {
        return delegateLanguageHandler(deleteLanguageClass, req, res);
    }

    try {
        const trainerId = String(req.user?._id || '');
        const skillClass = await ClassSession.findById(req.params.classId);

        if (!skillClass) {
            return res.status(404).json({ message: 'Class not found' });
        }

        const batch = await Batch.findOne({ _id: skillClass.batchId, trainerId });
        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to delete this class' });
        }

        if (skillClass.eventId) {
            const trainer = await User.findById(trainerId).select('+googleRefreshToken');
            if (trainer?.googleRefreshToken) {
                googleService.setCredentials(trainer.googleRefreshToken);
                await googleService.deleteEvent(skillClass.eventId);
            }
        }

        await Attendance.deleteMany({ classSessionId: skillClass._id });
        await skillClass.deleteOne();

        return res.status(200).json({ message: 'Class deleted successfully' });
    } catch (error) {
        console.error('Failed to delete trainer batch class:', error);
        return res.status(500).json({ message: 'Failed to delete trainer batch class', error });
    }
};

export const endTrainerBatchClass = async (req: AuthRequest, res: Response) => {
    const trainingType = normalizeTrainingType(req.params.trainingType);

    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }

    if (trainingType === 'language') {
        return delegateLanguageHandler(endLanguageClass, req, res);
    }

    try {
        const trainerId = String(req.user?._id || '');
        const skillClass = await ClassSession.findById(req.params.classId);

        if (!skillClass) {
            return res.status(404).json({ message: 'Class not found' });
        }

        if (String(skillClass.trainerId) !== trainerId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (skillClass.eventId) {
            const trainer = await User.findById(trainerId).select('+googleRefreshToken');
            if (trainer?.googleRefreshToken) {
                googleService.setCredentials(trainer.googleRefreshToken);
                await googleService.deleteEvent(skillClass.eventId);
            }
        }

        skillClass.status = 'completed';
        await skillClass.save();

        return res.status(200).json({
            message: 'Class ended successfully',
            class: mapSkillClassForView(skillClass, await loadSkillAttendanceMap([String(skillClass._id)]).then(
                (attendanceMap) => attendanceMap.get(String(skillClass._id)) || []
            )),
        });
    } catch (error) {
        console.error('Failed to end trainer batch class:', error);
        return res.status(500).json({ message: 'Failed to end trainer batch class', error });
    }
};

export const updateTrainerBatchAttendance = async (req: AuthRequest, res: Response) => {
    const trainingType = normalizeTrainingType(req.params.trainingType);

    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }

    if (trainingType === 'language') {
        return delegateLanguageHandler(updateLanguageAttendance, req, res);
    }

    try {
        const trainerId = String(req.user?._id || '');
        const { studentId, attended } = req.body;
        const skillClass = await ClassSession.findById(req.params.classId);

        if (!skillClass) {
            return res.status(404).json({ message: 'Class not found' });
        }

        if (String(skillClass.trainerId) !== trainerId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (attended) {
            await Attendance.findOneAndUpdate(
                { classSessionId: skillClass._id, studentId },
                { $set: { status: 'present' } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        } else {
            await Attendance.deleteOne({ classSessionId: skillClass._id, studentId });
        }

        const attendanceMap = await loadSkillAttendanceMap([String(skillClass._id)]);
        return res.status(200).json({
            message: 'Attendance updated',
            attendees: attendanceMap.get(String(skillClass._id)) || [],
        });
    } catch (error) {
        console.error('Failed to update trainer batch attendance:', error);
        return res.status(500).json({ message: 'Failed to update trainer batch attendance', error });
    }
};

export const joinTrainerBatchClass = async (req: AuthRequest, res: Response) => {
    const trainingType = normalizeTrainingType(req.params.trainingType);

    if (!trainingType) {
        return res.status(400).json({ message: 'Invalid trainingType provided.' });
    }

    if (trainingType === 'language') {
        return delegateLanguageHandler(joinLanguageClass, req, res);
    }

    try {
        const userId = String(req.user?._id || '');
        const skillClass = await ClassSession.findById(req.params.classId);

        if (!skillClass) {
            return res.status(404).json({ message: 'Class not found' });
        }

        const batch = await Batch.findById(skillClass.batchId);
        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }

        const isTrainer = String(skillClass.trainerId) === userId;
        const isStudent = batch.students.some((studentId) => String(studentId) === userId);
        const isAdmin = req.user?.role === 'admin';

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
            await Attendance.findOneAndUpdate(
                { classSessionId: skillClass._id, studentId: userId },
                { $set: { status: 'present' } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }

        return res.status(200).json({
            message: 'Attendance recorded',
            link: skillClass.meetingLink || '',
        });
    } catch (error) {
        console.error('Failed to join trainer batch class:', error);
        return res.status(500).json({ message: 'Failed to join trainer batch class', error });
    }
};
