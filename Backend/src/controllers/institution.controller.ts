import bcrypt from 'bcryptjs';
import mongoose, { type ClientSession } from 'mongoose';
import { Request, Response } from 'express';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateInstitutionSubmissionDto, RejectInstitutionSubmissionDto } from '../dtos/institution.dto';
import LanguageCourse from '../models/languageCourse.model';
import InstitutionEnrollmentRequest from '../models/institutionEnrollmentRequest.model';
import User from '../models/user.model';
import LanguageBatch from '../models/language.batch.model';
import LanguageEnrollment from '../models/language.enrollment.model';
import { EmailService } from '../utils/email.service';

const emailService = new EmailService();

type ApprovalArtifacts = {
    createdStudentsForEmail: Array<{ name: string; email: string; courseTitle: string; levelName: string }>;
    institutionEmailPayload?: {
        email: string;
        institutionName: string;
        courseTitle: string;
        levelName: string;
        studentCount: number;
    };
};

const normalizeEmail = (value: string) => String(value || '').trim().toLowerCase();
const normalizeText = (value: string) => String(value || '').trim();

const getGermanCourse = () => LanguageCourse.findOne({
    title: { $regex: 'german', $options: 'i' },
});

const sanitizeInstitutionRequest = (request: any) => ({
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
        ? request.students.map((student: any) => ({
            name: student.name,
            email: student.email,
            createdUserId: student.createdUserId ? String(student.createdUserId) : null,
        }))
        : [],
});

const validateGermanSelection = async (courseTitle: string, levelName: string) => {
    const germanCourse = await getGermanCourse();

    if (!germanCourse) {
        return { error: 'German course is not configured in the backend catalog.', germanCourse: null };
    }

    if (normalizeText(germanCourse.title) !== normalizeText(courseTitle)) {
        return { error: 'Selected German course is invalid.', germanCourse: null };
    }

    const matchingLevel = germanCourse.levels?.find(
        (level) => normalizeText(level.name) === normalizeText(levelName)
    );

    if (!matchingLevel) {
        return { error: 'Selected German level is invalid.', germanCourse: null };
    }

    return { error: null, germanCourse };
};

const findDuplicateEmails = (emails: string[]) => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const email of emails) {
        if (seen.has(email)) {
            duplicates.add(email);
        }
        seen.add(email);
    }

    return [...duplicates];
};

const createOrLoadBatch = async (
    courseTitle: string,
    levelName: string,
    session?: ClientSession | null
) => {
    const batchQuery = LanguageBatch.findOne({
        courseTitle,
        name: levelName,
    });

    if (session) {
        batchQuery.session(session);
    }

    let batch = await batchQuery;

    if (!batch) {
        batch = new LanguageBatch({
            courseTitle,
            name: levelName,
            students: [],
        });
        if (session) {
            await batch.save({ session });
        } else {
            await batch.save();
        }
    }

    return batch;
};

const isTransactionUnsupportedError = (error: unknown) => {
    const message = String((error as Error)?.message || '');
    return message.includes('Transaction numbers are only allowed on a replica set member or mongos');
};

const rollbackNonTransactionalApproval = async (params: {
    createdEnrollmentIds: mongoose.Types.ObjectId[];
    createdUserIds: mongoose.Types.ObjectId[];
    batchId?: mongoose.Types.ObjectId | null;
    originalBatchStudentIds: mongoose.Types.ObjectId[];
}) => {
    if (params.createdEnrollmentIds.length > 0) {
        await LanguageEnrollment.deleteMany({
            _id: { $in: params.createdEnrollmentIds },
        });
    }

    if (params.createdUserIds.length > 0) {
        await User.deleteMany({
            _id: { $in: params.createdUserIds },
        });
    }

    if (params.batchId) {
        await LanguageBatch.findByIdAndUpdate(
            params.batchId,
            { $set: { students: params.originalBatchStudentIds } }
        );
    }
};

const processInstitutionApproval = async (params: {
    requestId: string;
    adminUserId: mongoose.Types.ObjectId | null;
    session?: ClientSession | null;
}): Promise<ApprovalArtifacts> => {
    const { requestId, adminUserId, session } = params;
    const approvalArtifacts: ApprovalArtifacts = {
        createdStudentsForEmail: [],
    };

    const requestQuery = InstitutionEnrollmentRequest.findById(requestId);
    if (session) {
        requestQuery.session(session);
    }
    const request = await requestQuery;

    if (!request || request.status !== 'PENDING') {
        throw new Error('Invalid institution request');
    }

    const validation = await validateGermanSelection(request.courseTitle, request.levelName);
    if (validation.error) {
        throw new Error(validation.error);
    }

    const normalizedEmails = request.students.map((student) => normalizeEmail(student.email));
    const duplicateEmails = findDuplicateEmails(normalizedEmails);

    if (duplicateEmails.length > 0) {
        throw new Error('Duplicate student emails are not allowed in the same request.');
    }

    const existingUsersQuery = User.find({
        email: { $in: normalizedEmails },
    });
    if (session) {
        existingUsersQuery.session(session);
    }
    const existingUsers = await existingUsersQuery;

    if (existingUsers.length > 0) {
        throw new Error('One or more student emails are already registered.');
    }

    const institutionQuery = User.findById(request.institutionId);
    if (session) {
        institutionQuery.session(session);
    }
    const institution = await institutionQuery;

    if (!institution) {
        throw new Error('Institution account not found.');
    }

    const batch = await createOrLoadBatch(request.courseTitle, request.levelName, session);
    const originalBatchStudentIds = [...batch.students];
    const createdUserIds: mongoose.Types.ObjectId[] = [];
    const createdEnrollmentIds: mongoose.Types.ObjectId[] = [];

    try {
        for (let index = 0; index < request.students.length; index += 1) {
            const studentEntry = request.students[index];
            const studentUser = new User({
                name: normalizeText(studentEntry.name),
                email: normalizeEmail(studentEntry.email),
                password: studentEntry.passwordHash,
                role: 'student',
                isVerified: true,
            });

            if (session) {
                await studentUser.save({ session });
            } else {
                await studentUser.save();
            }

            createdUserIds.push(studentUser._id);

            const createdEnrollments = await LanguageEnrollment.create([{
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
            await batch.save({ session });
            await request.save({ session });
        } else {
            await batch.save();
            await request.save();
        }

        approvalArtifacts.institutionEmailPayload = {
            email: institution.email,
            institutionName: institution.institutionName || institution.name,
            courseTitle: request.courseTitle,
            levelName: request.levelName,
            studentCount: request.students.length,
        };

        return approvalArtifacts;
    } catch (error) {
        if (!session) {
            await rollbackNonTransactionalApproval({
                createdEnrollmentIds,
                createdUserIds,
                batchId: batch._id,
                originalBatchStudentIds,
            });
        }

        throw error;
    }
};

export const getInstitutionDashboard = async (req: Request, res: Response) => {
    try {
        const institutionId = String((req.user as any)?._id || '');
        const [institution, germanCourse, submissions] = await Promise.all([
            User.findById(institutionId).select(
                'name email role phoneNumber institutionName contactPersonName city state address'
            ),
            getGermanCourse(),
            InstitutionEnrollmentRequest.find({ institutionId })
                .sort({ createdAt: -1 })
                .limit(10),
        ]);

        if (!institution) {
            return res.status(404).json({ message: 'Institution account not found' });
        }

        return res.status(200).json({
            institution: {
                _id: String((institution as any)._id),
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
    } catch (error) {
        console.error('Failed to load institution dashboard:', error);
        return res.status(500).json({ message: 'Failed to load institution dashboard' });
    }
};

export const getInstitutionSubmissions = async (req: Request, res: Response) => {
    try {
        const institutionId = String((req.user as any)?._id || '');
        const submissions = await InstitutionEnrollmentRequest.find({ institutionId })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            submissions: submissions.map((submission) => sanitizeInstitutionRequest(submission.toObject())),
        });
    } catch (error) {
        console.error('Failed to fetch institution submissions:', error);
        return res.status(500).json({ message: 'Failed to fetch institution submissions' });
    }
};

export const createInstitutionSubmission = async (req: Request, res: Response) => {
    const createDto = plainToClass(CreateInstitutionSubmissionDto, req.body);
    const errors = await validate(createDto);
    if (errors.length > 0) return res.status(400).json({ errors });

    const institutionId = String((req.user as any)?._id || '');
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
        const [{ error }, existingUsers] = await Promise.all([
            validateGermanSelection(normalizedCourseTitle, normalizedLevelName),
            User.find({
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

        const students = await Promise.all(
            normalizedStudents.map(async (student) => ({
                name: student.name,
                email: student.email,
                passwordHash: await bcrypt.hash(student.password, 10),
            }))
        );

        const submission = await InstitutionEnrollmentRequest.create({
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
    } catch (error) {
        console.error('Failed to create institution submission:', error);
        return res.status(500).json({ message: 'Failed to create institution submission' });
    }
};

export const getAdminInstitutionRequests = async (req: Request, res: Response) => {
    try {
        const status = normalizeText(String(req.query.status || ''));
        const search = normalizeText(String(req.query.search || ''));
        const filter: Record<string, unknown> = {};

        if (status && status !== 'All') {
            filter.status = status.toUpperCase();
        }

        let matchingInstitutionIds: mongoose.Types.ObjectId[] = [];
        if (search) {
            const matchingInstitutions = await User.find({
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

        const requests = await InstitutionEnrollmentRequest.find(filter)
            .populate(
                'institutionId',
                'name email phoneNumber institutionName contactPersonName city state address'
            )
            .sort({ createdAt: -1 });

        const availableStatuses = ['All', 'PENDING', 'APPROVED', 'REJECTED'];

        return res.status(200).json({
            requests: requests.map((request) => sanitizeInstitutionRequest(request.toObject())),
            availableStatuses,
        });
    } catch (error) {
        console.error('Failed to fetch institution admin requests:', error);
        return res.status(500).json({ message: 'Failed to fetch institution admin requests' });
    }
};

export const approveInstitutionRequest = async (req: Request, res: Response) => {
    const requestId = String(req.params.id || '').trim();

    if (!requestId) {
        return res.status(400).json({ message: 'Institution request id is required' });
    }

    const session = await mongoose.startSession();

    try {
        let approvalArtifacts: ApprovalArtifacts;

        try {
            await session.withTransaction(async () => {
                approvalArtifacts = await processInstitutionApproval({
                    requestId,
                    adminUserId: (req.user as any)?._id || null,
                    session,
                });
            });
        } catch (error) {
            if (!isTransactionUnsupportedError(error)) {
                throw error;
            }

            console.warn('MongoDB transactions are unavailable. Falling back to non-transactional institution approval.');
            approvalArtifacts = await processInstitutionApproval({
                requestId,
                adminUserId: (req.user as any)?._id || null,
                session: null,
            });
        } finally {
            session.endSession();
        }

        const decisionEmailPayload = approvalArtifacts!.institutionEmailPayload;

        if (decisionEmailPayload) {
            await emailService.sendInstitutionSubmissionDecisionEmail({
                to: decisionEmailPayload.email,
                institutionName: decisionEmailPayload.institutionName,
                status: 'APPROVED',
                courseTitle: decisionEmailPayload.courseTitle,
                levelName: decisionEmailPayload.levelName,
                studentCount: decisionEmailPayload.studentCount,
            });
        }

        await Promise.all(
            approvalArtifacts!.createdStudentsForEmail.map((student) => emailService.sendInstitutionStudentWelcomeEmail({
                to: student.email,
                studentName: student.name,
                courseTitle: student.courseTitle,
                levelName: student.levelName,
            }))
        );

        const approvedRequest = await InstitutionEnrollmentRequest.findById(requestId)
            .populate(
                'institutionId',
                'name email phoneNumber institutionName contactPersonName city state address'
            );

        return res.status(200).json({
            message: 'Institution request approved successfully.',
            request: approvedRequest ? sanitizeInstitutionRequest(approvedRequest.toObject()) : null,
        });
    } catch (error) {
        console.error('Failed to approve institution request:', error);
        return res.status(400).json({ message: (error as Error).message || 'Failed to approve institution request' });
    }
};

export const rejectInstitutionRequest = async (req: Request, res: Response) => {
    const rejectDto = plainToClass(RejectInstitutionSubmissionDto, req.body);
    const errors = await validate(rejectDto);
    if (errors.length > 0) return res.status(400).json({ errors });

    try {
        const request = await InstitutionEnrollmentRequest.findById(req.params.id);
        if (!request || request.status !== 'PENDING') {
            return res.status(400).json({ message: 'Invalid institution request' });
        }

        request.status = 'REJECTED';
        request.adminDecisionBy = (req.user as any)?._id || null;
        request.adminDecisionAt = new Date();
        request.rejectionReason = rejectDto.reason?.trim() || null;
        await request.save();

        const institution = await User.findById(request.institutionId).select('email institutionName name');
        if (institution) {
            await emailService.sendInstitutionSubmissionDecisionEmail({
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
    } catch (error) {
        console.error('Failed to reject institution request:', error);
        return res.status(500).json({ message: 'Failed to reject institution request' });
    }
};
