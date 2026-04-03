import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck, LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { type NotificationItem, useNotifications } from '../../context/NotificationContext';
import { extractChatConversationFromNotification } from '../../lib/chat';

const formatNotificationTime = (value: string) => {
    const timestamp = new Date(value);
    const diffMs = Date.now() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
        return 'Just now';
    }

    if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
        return `${diffDays}d ago`;
    }

    return timestamp.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
    });
};

const NotificationCard: React.FC<{
    notification: NotificationItem;
    onOpen: (notification: NotificationItem) => void;
    onReply: (notification: NotificationItem) => void;
}> = ({ notification, onOpen, onReply }) => {
    const supportsReply = notification.kind === 'chat_message' && Boolean(extractChatConversationFromNotification(notification));

    return (
        <div
            className={`rounded-2xl border px-3 py-3 transition-colors ${
                notification.isRead
                    ? 'border-gray-200 bg-white/70 dark:border-gray-700 dark:bg-[#0a192f]/60'
                    : 'border-[#d6b161]/30 bg-[#d6b161]/10 dark:border-[#d6b161]/20 dark:bg-[#d6b161]/10'
            }`}
        >
            <button
                type="button"
                onClick={() => onOpen(notification)}
                className="w-full text-left"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className={`text-sm font-semibold ${notification.isRead ? 'text-gray-900 dark:text-white' : 'text-[#0a192f] dark:text-[#f3deb0]'}`}>
                            {notification.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                            {notification.body}
                        </p>
                    </div>
                    {!notification.isRead && (
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#d6b161]" />
                    )}
                </div>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                    {formatNotificationTime(notification.createdAt)}
                </p>
            </button>

            {supportsReply && (
                <button
                    type="button"
                    onClick={() => onReply(notification)}
                    className="mt-3 inline-flex items-center justify-center rounded-xl bg-[#0a192f] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#112240] dark:bg-[#d6b161] dark:text-[#0a192f] dark:hover:bg-[#cfaa5b]"
                >
                    Reply
                </button>
            )}
        </div>
    );
};

const NotificationBell: React.FC = () => {
    const navigate = useNavigate();
    const {
        notifications,
        unreadCount,
        loading,
        loadingMore,
        hasMore,
        loadMoreNotifications,
        markAllNotificationsAsRead,
        markNotificationAsRead,
        markConversationAsRead,
    } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    const handleNotificationOpen = async (notification: NotificationItem) => {
        setIsOpen(false);
        void markNotificationAsRead(notification._id);
        const conversation = extractChatConversationFromNotification(notification);
        if (conversation) {
            void markConversationAsRead(conversation);
        }
        navigate(notification.linkPath);
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen((currentState) => !currentState)}
                aria-label="Notifications"
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-white/90 text-[#0a192f] shadow-lg backdrop-blur-md transition-colors hover:bg-white dark:border-gray-700 dark:bg-[#112240]/90 dark:text-white dark:hover:bg-[#112240]"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#d6b161] px-1.5 text-[10px] font-bold text-[#0a192f] shadow-sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 top-14 w-[22rem] rounded-3xl border border-gray-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:border-gray-700 dark:bg-[#112240]/95"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-400 dark:text-gray-500">
                                    Notifications
                                </p>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => void markAllNotificationsAsRead()}
                                disabled={unreadCount === 0}
                                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#0a192f] transition-colors hover:bg-[#d6b161]/10 disabled:cursor-not-allowed disabled:text-gray-400 dark:text-[#f3deb0] dark:hover:bg-[#d6b161]/10 dark:disabled:text-gray-500"
                            >
                                <CheckCheck className="h-4 w-4" />
                                Mark all read
                            </button>
                        </div>

                        <div className="mt-4 max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                            {loading ? (
                                <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                    <LoaderCircle className="h-5 w-5 animate-spin" />
                                </div>
                            ) : notifications.length > 0 ? (
                                notifications.map((notification) => (
                                    <NotificationCard
                                        key={notification._id}
                                        notification={notification}
                                        onOpen={handleNotificationOpen}
                                        onReply={handleNotificationOpen}
                                    />
                                ))
                            ) : (
                                <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center dark:border-gray-700">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">No notifications yet</p>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        New messages and course updates will show up here.
                                    </p>
                                </div>
                            )}
                        </div>

                        {hasMore && (
                            <button
                                type="button"
                                onClick={() => void loadMoreNotifications()}
                                disabled={loadingMore}
                                className="mt-4 flex w-full items-center justify-center rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-[#0a192f]/80 dark:disabled:text-gray-500"
                            >
                                {loadingMore ? (
                                    <span className="inline-flex items-center gap-2">
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                        Loading more
                                    </span>
                                ) : 'Load more'}
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
