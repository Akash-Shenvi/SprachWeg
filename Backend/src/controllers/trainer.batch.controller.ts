import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import Announcement from '../models/announcement.model';
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

type SkillAttendanceEntry = {
    studentId: string;
    joinedAt: Date;
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
        const batch = await Batch.findOne({ _id: batchId, trainerId });

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
        const batch = await Batch.findOne({ _id: batchId, trainerId });

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
        const trainerId = String(req.user?._id || '');
        const batch = await Batch.findOne({ _id: batchId, trainerId }).populate('students', 'email');

        if (!batch) {
            return res.status(403).json({ message: 'Not authorized to schedule class for this batch' });
        }

        const { trainer, attendeeEmails } = await getTrainerEventAttendees(batch, trainerId);
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
            trainerId,
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

        if (!isTrainer && !isStudent) {
            return res.status(403).json({ message: 'Not authorized to join this class' });
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
