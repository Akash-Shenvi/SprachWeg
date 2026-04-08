import React, { createContext, useContext, useEffect, useEffectEvent, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { API_BASE_URL, chatAPI, notificationsAPI, pushAPI } from '../lib/api';
import {
    getBrowserPushSupportDetails,
    clearBrowserPushEnabledFlag,
    getBrowserPushEnabledStorageKey,
    getExistingBrowserPushSubscription,
    PUSH_NOTIFICATION_QUERY_PARAM,
    registerBrowserPushServiceWorker,
    serializeBrowserPushSubscription,
    subscribeBrowserPush,
} from '../lib/browserPush';
import {
    extractChatConversationFromNotification,
    getChatConversationKey,
    isSameChatConversation,
    type ChatConversationRef,
} from '../lib/chat';
import { isLearnerRole } from '../lib/roles';

type BrowserPushPermissionState = NotificationPermission | 'unsupported';

export interface NotificationItem {
    _id: string;
    recipientUserId: string;
    actorUserId?: string | null;
    kind: string;
    trainingType?: 'language' | 'skill' | null;
    batchId?: string | null;
    title: string;
    body: string;
    linkPath: string;
    isRead: boolean;
    readAt?: string | null;
    metadata?: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
}

export interface ChatConversationStateItem {
    studentId: string;
    trainerId: string;
    hasUnread: boolean;
    lastMessageAt?: string | null;
}

interface NotificationContextValue {
    notifications: NotificationItem[];
    unreadCount: number;
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    pushSupported: boolean;
    pushAvailable: boolean;
    pushPermission: BrowserPushPermissionState;
    pushEnabled: boolean;
    pushLoading: boolean;
    pushHelperText: string;
    refreshNotifications: () => Promise<void>;
    loadMoreNotifications: () => Promise<void>;
    markNotificationAsRead: (notificationId: string) => Promise<void>;
    markAllNotificationsAsRead: () => Promise<void>;
    hasUnreadConversation: (studentId: string, trainerId: string) => boolean;
    markConversationAsRead: (conversation: ChatConversationRef) => Promise<void>;
    registerOpenConversation: (conversation: ChatConversationRef | null) => void;
    enablePush: () => Promise<void>;
    disablePush: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const PAGE_LIMIT = 10;
const DEFAULT_PUSH_HELPER = 'Turn on browser push notifications for alerts even when the app is closed.';

const isNotificationEligibleRole = (role?: string | null) => {
    const normalizedRole = String(role || '').trim().toLowerCase();
    return normalizedRole === 'trainer' || isLearnerRole(normalizedRole);
};

const mergeNotificationLists = (current: NotificationItem[], incoming: NotificationItem[]) => {
    const nextMap = new Map<string, NotificationItem>();

    [...current, ...incoming].forEach((notification) => {
        nextMap.set(notification._id, notification);
    });

    return [...nextMap.values()].sort((left, right) => (
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    ));
};

const buildUnreadConversationMap = (conversations: ChatConversationStateItem[]) => {
    const nextMap: Record<string, ChatConversationStateItem> = {};

    conversations.forEach((conversation) => {
        if (!conversation?.hasUnread) {
            return;
        }

        nextMap[getChatConversationKey(conversation.studentId, conversation.trainerId)] = conversation;
    });

    return nextMap;
};

const updateUnreadConversationMap = (
    current: Record<string, ChatConversationStateItem>,
    conversation: ChatConversationStateItem
) => {
    const key = getChatConversationKey(conversation.studentId, conversation.trainerId);

    if (!conversation.hasUnread) {
        if (!current[key]) {
            return current;
        }

        const { [key]: _removed, ...rest } = current;
        return rest;
    }

    return {
        ...current,
        [key]: conversation,
    };
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(1);
    const [conversationUnreadMap, setConversationUnreadMap] = useState<Record<string, ChatConversationStateItem>>({});
    const [pushSupported, setPushSupported] = useState(false);
    const [pushAvailable, setPushAvailable] = useState(false);
    const [pushPermission, setPushPermission] = useState<BrowserPushPermissionState>('unsupported');
    const [pushEnabled, setPushEnabled] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);
    const [pushHelperText, setPushHelperText] = useState(DEFAULT_PUSH_HELPER);
    const [pushPublicKey, setPushPublicKey] = useState('');
    const openConversationRef = useRef<ChatConversationRef | null>(null);
    const markConversationReadInFlightRef = useRef<Set<string>>(new Set());
    const isEligible = isNotificationEligibleRole(user?.role);
    const currentUserId = user?._id || (user as any)?.id || '';

    const resetState = () => {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        setLoadingMore(false);
        setHasMore(false);
        setPage(1);
        setConversationUnreadMap({});
        openConversationRef.current = null;
        markConversationReadInFlightRef.current.clear();
    };

    const resetPushState = () => {
        setPushSupported(false);
        setPushAvailable(false);
        setPushPermission('unsupported');
        setPushEnabled(false);
        setPushLoading(false);
        setPushHelperText(DEFAULT_PUSH_HELPER);
        setPushPublicKey('');
    };

    const refreshUnreadCount = useEffectEvent(async () => {
        if (!isEligible) {
            return;
        }

        try {
            const response = await notificationsAPI.getUnreadCount();
            setUnreadCount(Number(response.unreadCount) || 0);
        } catch (error) {
            console.error('Failed to refresh notification unread count', error);
        }
    });

    const loadNotifications = useEffectEvent(async (pageToLoad: number, append: boolean) => {
        if (!isEligible) {
            return;
        }

        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }

        try {
            const response = await notificationsAPI.list({ page: pageToLoad, limit: PAGE_LIMIT });
            const nextNotifications = Array.isArray(response.data) ? response.data : [];

            setNotifications((current) => append ? mergeNotificationLists(current, nextNotifications) : nextNotifications);
            setHasMore(Boolean(response.hasMore));
            setPage(pageToLoad);
        } catch (error) {
            console.error('Failed to load notifications', error);
        } finally {
            if (append) {
                setLoadingMore(false);
            } else {
                setLoading(false);
            }
        }
    });

    const refreshUnreadConversations = useEffectEvent(async () => {
        if (!isEligible) {
            return;
        }

        try {
            const response = await chatAPI.getUnreadConversations();
            const conversations = Array.isArray(response.data) ? response.data : [];
            setConversationUnreadMap(buildUnreadConversationMap(conversations));
        } catch (error) {
            console.error('Failed to load unread chat conversations', error);
        }
    });

    const refreshPushState = useEffectEvent(async () => {
        if (!isEligible || !currentUserId) {
            resetPushState();
            return;
        }

        const supportDetails = getBrowserPushSupportDetails();
        setPushSupported(supportDetails.supported);
        setPushPermission(supportDetails.supported ? Notification.permission : 'unsupported');

        if (!supportDetails.supported) {
            setPushAvailable(false);
            setPushEnabled(false);
            setPushHelperText(supportDetails.helperText);
            return;
        }

        if (!supportDetails.canUse) {
            setPushAvailable(false);
            setPushEnabled(false);
            setPushHelperText(supportDetails.helperText);
            return;
        }

        try {
            const response = await pushAPI.getPublicKey();
            const publicKey = typeof response.publicKey === 'string' ? response.publicKey.trim() : '';
            const available = Boolean(publicKey);

            setPushPublicKey(publicKey);
            setPushAvailable(available);

            if (!available) {
                setPushEnabled(false);
                setPushHelperText('Push notifications are unavailable right now.');
                return;
            }

            await registerBrowserPushServiceWorker();

            const localPushEnabled = localStorage.getItem(getBrowserPushEnabledStorageKey(currentUserId)) === 'true';
            const existingSubscription = await getExistingBrowserPushSubscription();

            if (Notification.permission === 'granted' && localPushEnabled && existingSubscription) {
                await pushAPI.saveSubscription(serializeBrowserPushSubscription(existingSubscription));
                setPushEnabled(true);
                setPushHelperText('Browser push notifications are on for this browser.');
                return;
            }

            if (Notification.permission === 'granted' && localPushEnabled && !existingSubscription) {
                clearBrowserPushEnabledFlag(currentUserId);
            }

            setPushEnabled(false);
            setPushHelperText(
                Notification.permission === 'denied'
                    ? 'Blocked in browser settings.'
                    : DEFAULT_PUSH_HELPER
            );
        } catch (error) {
            console.error('Failed to refresh browser push state', error);
            setPushAvailable(false);
            setPushEnabled(false);
            setPushHelperText('Push notifications are unavailable right now.');
        }
    });

    const registerOpenConversation = useEffectEvent((conversation: ChatConversationRef | null) => {
        openConversationRef.current = conversation;
    });

    const markConversationAsRead = useEffectEvent(async (conversation: ChatConversationRef) => {
        if (!isEligible) {
            return;
        }

        const key = getChatConversationKey(conversation.studentId, conversation.trainerId);
        setConversationUnreadMap((current) => {
            if (!current[key]) {
                return current;
            }

            const { [key]: _removed, ...rest } = current;
            return rest;
        });

        if (markConversationReadInFlightRef.current.has(key)) {
            return;
        }

        markConversationReadInFlightRef.current.add(key);

        try {
            await chatAPI.markConversationRead(conversation.studentId, conversation.trainerId);
        } catch (error) {
            console.error('Failed to mark chat conversation as read', error);
            await refreshUnreadConversations();
        } finally {
            markConversationReadInFlightRef.current.delete(key);
        }
    });

    const markNotificationAsRead = useEffectEvent(async (notificationId: string) => {
        if (!notificationId) {
            return;
        }

        const targetNotification = notifications.find((notification) => notification._id === notificationId);

        if (targetNotification?.isRead) {
            return;
        }

        if (targetNotification) {
            setNotifications((current) => current.map((notification) => (
                notification._id === notificationId
                    ? { ...notification, isRead: true, readAt: new Date().toISOString() }
                    : notification
            )));
            setUnreadCount((current) => Math.max(0, current - 1));
        }

        try {
            const response = await notificationsAPI.markRead(notificationId);

            if (!targetNotification && response?.notification) {
                setNotifications((current) => mergeNotificationLists(current, [response.notification]));
            }

            await refreshUnreadCount();
        } catch (error) {
            console.error('Failed to mark notification as read', error);

            if (targetNotification) {
                await loadNotifications(1, false);
                await refreshUnreadCount();
            }
        }
    });

    const markAllNotificationsAsRead = useEffectEvent(async () => {
        const hasUnreadNotifications = notifications.some((notification) => !notification.isRead);

        if (!hasUnreadNotifications) {
            return;
        }

        setNotifications((current) => current.map((notification) => ({
            ...notification,
            isRead: true,
            readAt: notification.readAt || new Date().toISOString(),
        })));
        setUnreadCount(0);

        try {
            await notificationsAPI.markAllRead();
        } catch (error) {
            console.error('Failed to mark all notifications as read', error);
            await loadNotifications(1, false);
            await refreshUnreadCount();
        }
    });

    const enablePush = useEffectEvent(async () => {
        if (!isEligible || !currentUserId) {
            return;
        }

        const supportDetails = getBrowserPushSupportDetails();
        setPushSupported(supportDetails.supported);
        setPushPermission(supportDetails.supported ? Notification.permission : 'unsupported');

        if (!supportDetails.supported) {
            setPushAvailable(false);
            setPushEnabled(false);
            setPushHelperText(supportDetails.helperText);
            return;
        }

        if (!supportDetails.canUse) {
            setPushAvailable(false);
            setPushEnabled(false);
            setPushHelperText(supportDetails.helperText);
            return;
        }

        setPushLoading(true);

        try {
            let publicKey = pushPublicKey;

            if (!publicKey) {
                const response = await pushAPI.getPublicKey();
                publicKey = typeof response.publicKey === 'string' ? response.publicKey.trim() : '';
                setPushPublicKey(publicKey);
                setPushAvailable(Boolean(publicKey));
            }

            if (!publicKey) {
                setPushAvailable(false);
                setPushHelperText('Push notifications are unavailable right now.');
                return;
            }

            const permission = Notification.permission === 'granted'
                ? 'granted'
                : await Notification.requestPermission();

            setPushPermission(permission);

            if (permission !== 'granted') {
                clearBrowserPushEnabledFlag(currentUserId);
                setPushEnabled(false);
                setPushHelperText(
                    permission === 'denied'
                        ? 'Blocked in browser settings.'
                        : DEFAULT_PUSH_HELPER
                );
                return;
            }

            const subscription = await subscribeBrowserPush(publicKey);
            await pushAPI.saveSubscription(serializeBrowserPushSubscription(subscription));
            localStorage.setItem(getBrowserPushEnabledStorageKey(currentUserId), 'true');
            setPushAvailable(true);
            setPushEnabled(true);
            setPushHelperText('Browser push notifications are on for this browser.');
        } catch (error) {
            console.error('Failed to enable browser push notifications', error);
            setPushEnabled(false);
            setPushHelperText('Failed to enable browser push notifications.');
        } finally {
            setPushLoading(false);
        }
    });

    const disablePush = useEffectEvent(async () => {
        if (!currentUserId) {
            return;
        }

        setPushLoading(true);

        try {
            const existingSubscription = await getExistingBrowserPushSubscription();

            if (existingSubscription) {
                await pushAPI.deleteSubscription(existingSubscription.endpoint);

                try {
                    await existingSubscription.unsubscribe();
                } catch (error) {
                    console.error('Failed to unsubscribe browser push subscription', error);
                }
            }

            clearBrowserPushEnabledFlag(currentUserId);
            setPushEnabled(false);
            setPushHelperText(
                Notification.permission === 'denied'
                    ? 'Blocked in browser settings.'
                    : 'Browser push notifications are off for this browser.'
            );
        } catch (error) {
            console.error('Failed to disable browser push notifications', error);
            setPushHelperText('Failed to disable browser push notifications.');
        } finally {
            setPushLoading(false);
        }
    });

    useEffect(() => {
        if (!isEligible) {
            resetState();
            resetPushState();
            return;
        }

        void loadNotifications(1, false);
        void refreshUnreadCount();
        void refreshUnreadConversations();
        void refreshPushState();
    }, [currentUserId, isEligible]);

    useEffect(() => {
        if (!isEligible) {
            return;
        }

        const handleWindowFocus = () => {
            void loadNotifications(1, false);
            void refreshUnreadCount();
            void refreshUnreadConversations();
            void refreshPushState();
        };

        window.addEventListener('focus', handleWindowFocus);
        return () => {
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, [isEligible]);

    useEffect(() => {
        if (!isEligible || !currentUserId) {
            return;
        }

        const token = localStorage.getItem('token');

        if (!token) {
            return;
        }

        const socket: Socket = io(API_BASE_URL, {
            auth: { token },
            path: '/api/socket.io',
            transports: ['polling', 'websocket'],
        });

        socket.on('connect', () => {
            void loadNotifications(1, false);
            void refreshUnreadCount();
            void refreshUnreadConversations();
        });

        socket.on('notification:new', (notification: NotificationItem) => {
            const conversation = extractChatConversationFromNotification(notification);
            const shouldAutoRead = Boolean(
                conversation
                && openConversationRef.current
                && isSameChatConversation(conversation, openConversationRef.current)
                && document.visibilityState === 'visible'
            );

            if (shouldAutoRead && conversation) {
                const autoReadNotification = {
                    ...notification,
                    isRead: true,
                    readAt: notification.readAt || new Date().toISOString(),
                };

                setNotifications((current) => mergeNotificationLists(current, [autoReadNotification]));
                void notificationsAPI.markRead(notification._id).catch((error) => {
                    console.error('Failed to auto-read incoming chat notification', error);
                    void loadNotifications(1, false);
                    void refreshUnreadCount();
                });
                void markConversationAsRead(conversation);
                return;
            }

            setNotifications((current) => mergeNotificationLists(current, [notification]));
            setUnreadCount((current) => notification.isRead ? current : current + 1);
        });

        socket.on('chat:conversation-state', (conversation: ChatConversationStateItem) => {
            setConversationUnreadMap((current) => updateUnreadConversationMap(current, conversation));

            if (
                conversation.hasUnread
                && openConversationRef.current
                && isSameChatConversation(conversation, openConversationRef.current)
                && document.visibilityState === 'visible'
            ) {
                void markConversationAsRead({
                    studentId: conversation.studentId,
                    trainerId: conversation.trainerId,
                });
            }
        });

        socket.on('connect_error', (error) => {
            console.error('Notification socket connection failed', error);
        });

        return () => {
            socket.disconnect();
        };
    }, [currentUserId, isEligible]);

    useEffect(() => {
        if (!isEligible) {
            return;
        }

        const searchParams = new URLSearchParams(location.search);
        const notificationId = searchParams.get(PUSH_NOTIFICATION_QUERY_PARAM);

        if (!notificationId) {
            return;
        }

        void markNotificationAsRead(notificationId);
        searchParams.delete(PUSH_NOTIFICATION_QUERY_PARAM);

        navigate(
            {
                pathname: location.pathname,
                search: searchParams.toString() ? `?${searchParams.toString()}` : '',
                hash: location.hash,
            },
            { replace: true }
        );
    }, [isEligible, location.hash, location.pathname, location.search, navigate]);

    const refreshNotifications = async () => {
        await loadNotifications(1, false);
        await refreshUnreadCount();
    };

    const loadMoreNotifications = async () => {
        if (!hasMore || loadingMore) {
            return;
        }

        await loadNotifications(page + 1, true);
    };

    const hasUnreadConversation = (studentId: string, trainerId: string) => (
        Boolean(conversationUnreadMap[getChatConversationKey(studentId, trainerId)])
    );

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                loadingMore,
                hasMore,
                pushSupported,
                pushAvailable,
                pushPermission,
                pushEnabled,
                pushLoading,
                pushHelperText,
                refreshNotifications,
                loadMoreNotifications,
                markNotificationAsRead,
                markAllNotificationsAsRead,
                hasUnreadConversation,
                markConversationAsRead,
                registerOpenConversation,
                enablePush,
                disablePush,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);

    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }

    return context;
};
