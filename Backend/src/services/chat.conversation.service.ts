import ChatConversationState, { type IChatConversationState } from '../models/chat.conversation.state.model';
import { emitToUserRoom } from '../socket';
import { isLearnerRole } from '../utils/roles';

type ConversationRole = 'trainer' | 'student' | 'institution_student' | string | null | undefined;

export type ChatConversationStatePayload = {
    studentId: string;
    trainerId: string;
    hasUnread: boolean;
    lastMessageAt: Date | null;
};

type UpsertConversationStateInput = {
    studentId: string;
    trainerId: string;
    senderId: string;
    senderRole: ConversationRole;
    sentAt: Date;
};

type MarkConversationAsReadInput = {
    studentId: string;
    trainerId: string;
    userId: string;
    userRole: ConversationRole;
};

const getReadFieldForRole = (role: ConversationRole) => (
    isLearnerRole(role) ? 'studentLastReadAt' : 'trainerLastReadAt'
);

const isConversationUnreadForUser = (
    conversation: Pick<IChatConversationState, 'lastSenderId' | 'lastMessageAt' | 'studentLastReadAt' | 'trainerLastReadAt'>,
    userId: string,
    userRole: ConversationRole
) => {
    if (!userId || conversation.lastSenderId === userId) {
        return false;
    }

    const readAt = isLearnerRole(userRole)
        ? conversation.studentLastReadAt
        : conversation.trainerLastReadAt;

    if (!readAt) {
        return true;
    }

    return conversation.lastMessageAt.getTime() > readAt.getTime();
};

const serializeConversationState = (
    conversation: Pick<IChatConversationState, 'studentId' | 'trainerId' | 'lastMessageAt'>,
    hasUnread: boolean
): ChatConversationStatePayload => ({
    studentId: String(conversation.studentId),
    trainerId: String(conversation.trainerId),
    hasUnread,
    lastMessageAt: conversation.lastMessageAt || null,
});

export const emitChatConversationStateToUser = (params: {
    recipientUserId: string;
    studentId: string;
    trainerId: string;
    hasUnread: boolean;
    lastMessageAt: Date | null;
}) => {
    emitToUserRoom(params.recipientUserId, 'chat:conversation-state', {
        studentId: params.studentId,
        trainerId: params.trainerId,
        hasUnread: params.hasUnread,
        lastMessageAt: params.lastMessageAt,
    });
};

export const upsertConversationStateOnMessage = async ({
    studentId,
    trainerId,
    senderId,
    senderRole,
    sentAt,
}: UpsertConversationStateInput) => {
    const senderReadField = getReadFieldForRole(senderRole);

    await ChatConversationState.findOneAndUpdate(
        { studentId, trainerId },
        {
            $set: {
                lastMessageAt: sentAt,
                lastSenderId: senderId,
                [senderReadField]: sentAt,
            },
            $setOnInsert: {
                studentId,
                trainerId,
                studentLastReadAt: null,
                trainerLastReadAt: null,
            },
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        }
    );
};

export const listUnreadConversationsForUser = async (params: {
    userId: string;
    userRole: ConversationRole;
}) => {
    const filter = isLearnerRole(params.userRole)
        ? { studentId: params.userId }
        : { trainerId: params.userId };

    const conversations = await ChatConversationState.find(filter)
        .sort({ lastMessageAt: -1 })
        .lean();

    return conversations
        .filter((conversation) => isConversationUnreadForUser(
            {
                lastSenderId: String(conversation.lastSenderId),
                lastMessageAt: new Date(conversation.lastMessageAt),
                studentLastReadAt: conversation.studentLastReadAt ? new Date(conversation.studentLastReadAt) : null,
                trainerLastReadAt: conversation.trainerLastReadAt ? new Date(conversation.trainerLastReadAt) : null,
            } as Pick<IChatConversationState, 'lastSenderId' | 'lastMessageAt' | 'studentLastReadAt' | 'trainerLastReadAt'>,
            params.userId,
            params.userRole
        ))
        .map((conversation) => serializeConversationState(
            {
                studentId: conversation.studentId,
                trainerId: conversation.trainerId,
                lastMessageAt: conversation.lastMessageAt,
            } as Pick<IChatConversationState, 'studentId' | 'trainerId' | 'lastMessageAt'>,
            true
        ));
};

export const markConversationAsRead = async ({
    studentId,
    trainerId,
    userId,
    userRole,
}: MarkConversationAsReadInput) => {
    const conversation = await ChatConversationState.findOne({ studentId, trainerId });

    if (!conversation) {
        return null;
    }

    const readField = getReadFieldForRole(userRole);
    conversation.set(readField, conversation.lastMessageAt);
    await conversation.save();

    const payload = serializeConversationState(conversation, false);
    emitChatConversationStateToUser({
        recipientUserId: userId,
        studentId,
        trainerId,
        hasUnread: false,
        lastMessageAt: conversation.lastMessageAt,
    });

    return payload;
};
