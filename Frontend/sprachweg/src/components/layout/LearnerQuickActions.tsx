import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Moon, Settings, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from '../notifications/NotificationBell';
import PushNotificationToggle from '../notifications/PushNotificationToggle';

interface LearnerQuickActionsProps {
    homeTo?: string;
    showFeedbackLink?: boolean;
}

const LearnerQuickActions: React.FC<LearnerQuickActionsProps> = ({
    homeTo = '/',
    showFeedbackLink = false,
}) => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isQuickSettingsOpen) {
            return;
        }

        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsQuickSettingsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isQuickSettingsOpen]);

    return (
        <div ref={containerRef} className="fixed right-4 top-4 z-50 flex items-center gap-3">
            <button
                type="button"
                onClick={() => navigate(homeTo)}
                aria-label="Go to dashboard"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-white/90 text-[#0a192f] shadow-lg backdrop-blur-md transition-colors hover:bg-white dark:border-gray-700 dark:bg-[#112240]/90 dark:text-white dark:hover:bg-[#112240]"
            >
                <LayoutDashboard className="h-5 w-5" />
            </button>

            <NotificationBell />

            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsQuickSettingsOpen((currentState) => !currentState)}
                    aria-label="Dashboard settings"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-white/90 text-[#0a192f] shadow-lg backdrop-blur-md transition-colors hover:bg-white dark:border-gray-700 dark:bg-[#112240]/90 dark:text-white dark:hover:bg-[#112240]"
                >
                    <Settings className="h-5 w-5" />
                </button>

                <AnimatePresence>
                    {isQuickSettingsOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            transition={{ duration: 0.18 }}
                            className="absolute right-0 top-14 w-72 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:border-gray-700 dark:bg-[#112240]/95"
                        >
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-400 dark:text-gray-500">Settings</p>

                            <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-3 dark:bg-[#0a192f]/80">
                                <div className="flex items-center gap-2.5">
                                    {theme === 'dark' ? (
                                        <Moon className="h-4 w-4 text-[#d6b161]" />
                                    ) : (
                                        <Sun className="h-4 w-4 text-[#d6b161]" />
                                    )}
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={toggleTheme}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#d6b161] focus:ring-offset-2 dark:focus:ring-offset-[#112240] ${theme === 'dark' ? 'bg-[#d6b161]' : 'bg-gray-300'}`}
                                    aria-label="Toggle theme"
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>

                            <PushNotificationToggle />

                            {showFeedbackLink && (
                                <Link
                                    to="/feedback"
                                    onClick={() => setIsQuickSettingsOpen(false)}
                                    className="mt-3 flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#d6b161] dark:text-gray-200 dark:hover:bg-[#0a192f]/80 dark:hover:text-[#d6b161]"
                                >
                                    Report an Issue / Feedback
                                </Link>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LearnerQuickActions;
