import { Response } from 'express';
import Announcement from '../models/announcement.model';
import Assignment from '../models/assignment.model';
import Batch from '../models/batch.model';
import ClassSession from '../models/classSession.model';
import Submission from '../models/submission.model';
import User from '../models/user.model';
import { AuthRequest } from '../middlewares/auth.middleware';

const DEFAULT_PAGE_LIMIT = 10;
const MAX_PAGE_LIMIT = 50;

type BatchAccess = {
    batch: any;
    isAdmin: boolean;
    isTrainer: boolean;
    isStudent: boolean;
};

const getObjectIdString = (value: any): string | null => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (value._id) return String(value._id);
    if (typeof value.toString === 'function') return String(value.toString());
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

const getAuthorizedBatch = async (req: AuthRequest, batchId: string): Promise<BatchAccess | null> => {
    const batch = await Batch.findById(batchId)
        .populate('courseId')
        .populate('trainerId', 'name email');

    if (!batch) {
        return null;
    }

    const userId = getObjectIdString(req.user?._id);
    const isAdmin = req.user?.role === 'admin';
    const trainerId = getObjectIdString(batch.trainerId);
    const isTrainer = !!userId && !!trainerId && trainerId === userId;
    const isStudent = !!userId && batch.students.some((studentId: any) => getObjectIdString(studentId) === userId);

    if (!isAdmin && !isTrainer && !isStudent) {
        return null;
    }

    return {
        batch,
        isAdmin,
        isTrainer,
        isStudent,
    };
};

export const getSkillBatchDetails = async (req: AuthRequest, res: Response) => {
    try {
        const { batchId } = req.params;
        const access = await getAuthorizedBatch(req, batchId);

        if (!access) {
            return res.status(404).json({ message: 'Skill batch not found or access denied' });
        }

        const { batch } = access;
        const course = batch.courseId as any;
        const trainer = batch.trainerId as any;

        const [announcementCount, assignmentCount, classCount, resourceClasses] = await Promise.all([
            Announcement.countDocuments({ batchId: batch._id }),
            Assignment.countDocuments({ batchId: batch._id }),
            ClassSession.countDocuments({ batchId: batch._id }),
            ClassSession.find({ batchId: batch._id }).select('resources recordings'),
        ]);

        const classResourceCount = resourceClasses.filter((skillClass) => (
            (Array.isArray(skillClass.resources) && skillClass.resources.length > 0)
            || (Array.isArray(skillClass.recordings) && skillClass.recordings.length > 0)
        )).length;

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
                title: course?.title || 'Skill Training',
                subtitle: course?.subtitle || '',
                description: course?.description || 'Your batch details and learning materials will appear here.',
                level: course?.level || '',
                category: course?.category || '',
                duration: course?.duration || '',
                image: course?.image || '',
                features: Array.isArray(course?.features) ? course.features.filter(Boolean) : [],
            },
            counts: {
                announcements: announcementCount,
                materials: 1 + assignmentCount + classResourceCount,
                students: Array.isArray(batch.students) ? batch.students.length : 0,
                classes: classCount,
            },
        });
    } catch (error) {
        console.error('Failed to fetch skill batch details:', error);
        return res.status(500).json({ message: 'Failed to fetch skill batch details' });
    }
};

export const getSkillBatchAnnouncements = async (req: AuthRequest, res: Response) => {
    try {
        const { batchId } = req.params;
        const access = await getAuthorizedBatch(req, batchId);

        if (!access) {
            return res.status(404).json({ message: 'Skill batch not found or access denied' });
        }

        const { page, limit, skip } = getPagination(req);
        const total = await Announcement.countDocuments({ batchId });
        const data = await Announcement.find({ batchId })
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
    } catch (error) {
        console.error('Failed to fetch skill batch announcements:', error);
        return res.status(500).json({ message: 'Failed to fetch skill batch announcements' });
    }
};

export const getSkillBatchMaterials = async (req: AuthRequest, res: Response) => {
    try {
        const { batchId } = req.params;
        const access = await getAuthorizedBatch(req, batchId);

        if (!access) {
            return res.status(404).json({ message: 'Skill batch not found or access denied' });
        }

        const { batch, isStudent } = access;
        const course = batch.courseId as any;
        const assignments = await Assignment.find({ batchId: batch._id }).sort({ dueDate: 1, createdAt: -1 });
        const classes = await ClassSession.find({ batchId: batch._id }).sort({ startTime: -1 });

        const assignmentIds = assignments.map((assignment) => assignment._id);
        const submissions = isStudent && assignmentIds.length > 0
            ? await Submission.find({
                assignmentId: { $in: assignmentIds },
                studentId: req.user?._id,
            }).select('assignmentId status grade feedback submissionDate')
            : [];

        const submissionByAssignmentId = new Map<string, any>();
        submissions.forEach((submission) => {
            submissionByAssignmentId.set(String(submission.assignmentId), submission);
        });

        const materials = [
            {
                _id: `course-overview-${getObjectIdString(course) || String(batch._id)}`,
                type: 'overview',
                title: `${course?.title || 'Skill Training'} Course Overview`,
                subtitle: [course?.level, course?.category].filter(Boolean).join(' • '),
                description: course?.description || 'Course guidance and trainer-shared resources will appear here.',
                createdAt: batch.createdAt,
                attachments: [] as string[],
                highlights: Array.isArray(course?.features) ? course.features.filter(Boolean) : [],
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
                    highlights: [] as string[],
                    submissionStatus: submission?.status || null,
                    submittedAt: submission?.submissionDate || null,
                    grade: typeof submission?.grade === 'number' ? submission.grade : null,
                    feedback: submission?.feedback || '',
                };
            }),
            ...classes
                .filter((skillClass) => (
                    (Array.isArray(skillClass.resources) && skillClass.resources.length > 0)
                    || (Array.isArray(skillClass.recordings) && skillClass.recordings.length > 0)
                ))
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
                    highlights: [] as string[],
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
    } catch (error) {
        console.error('Failed to fetch skill batch materials:', error);
        return res.status(500).json({ message: 'Failed to fetch skill batch materials' });
    }
};

export const getSkillBatchStudents = async (req: AuthRequest, res: Response) => {
    try {
        const { batchId } = req.params;
        const access = await getAuthorizedBatch(req, batchId);

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
            : await User.find({ _id: { $in: batch.students } })
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
    } catch (error) {
        console.error('Failed to fetch skill batch students:', error);
        return res.status(500).json({ message: 'Failed to fetch skill batch students' });
    }
};

export const getSkillBatchClasses = async (req: AuthRequest, res: Response) => {
    try {
        const { batchId } = req.params;
        const access = await getAuthorizedBatch(req, batchId);

        if (!access) {
            return res.status(404).json({ message: 'Skill batch not found or access denied' });
        }

        const { page, limit, skip } = getPagination(req);
        const total = await ClassSession.countDocuments({ batchId });
        const classes = await ClassSession.find({ batchId })
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
    } catch (error) {
        console.error('Failed to fetch skill batch classes:', error);
        return res.status(500).json({ message: 'Failed to fetch skill batch classes' });
    }
};
