export type ChatConversationRef = {
    studentId: string;
    trainerId: string;
};

type ChatNotificationLike = {
    kind?: string | null;
    metadata?: Record<string, unknown> | null;
};

const normalizeConversationValue = (value: unknown) => String(value || '').trim();

export const getChatConversationKey = (studentId: string, trainerId: string) => (
    `${normalizeConversationValue(studentId)}::${normalizeConversationValue(trainerId)}`
);

export const isSameChatConversation = (
    left: ChatConversationRef | null | undefined,
    right: ChatConversationRef | null | undefined
) => {
    if (!left || !right) {
        return false;
    }

    return getChatConversationKey(left.studentId, left.trainerId) === getChatConversationKey(right.studentId, right.trainerId);
};

export const extractChatConversationFromNotification = (
    notification: ChatNotificationLike
): ChatConversationRef | null => {
    if (notification.kind !== 'chat_message' || !notification.metadata) {
        return null;
    }

    const studentId = normalizeConversationValue(notification.metadata.studentId);
    const trainerId = normalizeConversationValue(notification.metadata.trainerId);

    if (!studentId || !trainerId) {
        return null;
    }

    return { studentId, trainerId };
};
