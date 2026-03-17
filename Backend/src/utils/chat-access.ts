import LanguageBatch from '../models/language.batch.model';

type ChatRole = 'student' | 'trainer' | string | undefined;

export const findAssignedBatchForChat = async (studentId: string, trainerId: string) => {
    return LanguageBatch.findOne({ students: studentId, trainerId });
};

export const getAssignedTrainerIdsForStudent = async (studentId: string) => {
    const batches = await LanguageBatch.find({
        students: studentId,
        trainerId: { $exists: true, $ne: null }
    }).select('trainerId');

    return [...new Set(
        batches
            .map(batch => batch.trainerId?.toString())
            .filter((trainerId): trainerId is string => Boolean(trainerId))
    )];
};

export const resolveTrainerIdForStudentChat = async (studentId: string, requestedTrainerId?: string | null) => {
    const assignedTrainerIds = await getAssignedTrainerIdsForStudent(studentId);

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
};

export const canAccessChatPair = async (
    userId: string,
    userRole: ChatRole,
    studentId: string,
    trainerId: string
) => {
    if (userRole === 'student') {
        if (userId !== studentId) return false;
        return Boolean(await findAssignedBatchForChat(studentId, trainerId));
    }

    if (userRole === 'trainer') {
        if (userId !== trainerId) return false;
        return Boolean(await findAssignedBatchForChat(studentId, trainerId));
    }

    return false;
};
