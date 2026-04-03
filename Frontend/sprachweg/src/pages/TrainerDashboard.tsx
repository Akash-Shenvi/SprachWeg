import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import api, { webinarCatalogAPI } from '../lib/api';
import {
    BookOpen,
    Users,
    Calendar,
    Upload,
    LogOut,
    Layers,
    ChevronRight,
    GraduationCap,
    ExternalLink,
    Video
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';
import type { WebinarListing } from '../types/webinar';
import { formatWebinarDateTime, formatWebinarPrice } from '../types/webinar';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Batch {
    _id: string;
    courseTitle: string;
    name: string;
    studentCount: number;
    trainingType: 'language' | 'skill';
}

interface TrainerWebinarFeed {
    trainerCalendarConnected: boolean;
    webinars: WebinarListing[];
}

// ============================================================================
// ANIMATIONS
// ============================================================================

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay: custom * 0.1, ease: [0.22, 1, 0.36, 1] as const }
    })
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } }
};

// ============================================================================
// HERO BACKGROUND
// ============================================================================

const HeroBackground: React.FC = () => {
    const shouldReduceMotion = useReducedMotion();
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, shouldReduceMotion ? 0 : 150]);
    const y2 = useTransform(scrollY, [0, 500], [0, shouldReduceMotion ? 0 : -150]);
    const opacity = useTransform(scrollY, [0, 500], [1, 0]);

    return (
        <motion.div
            style={{ opacity }}
            className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
            aria-hidden="true"
        >
            <motion.div
                style={{ y: y1 }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-[10%] -right-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#d6b161]/20 to-red-500/10 blur-[120px]"
            />
            <motion.div
                style={{ y: y2 }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-yellow-500/10 blur-[100px]"
            />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
        </motion.div>
    );
};

// ============================================================================
// SKELETON LOADERS
// ============================================================================

const SkeletonBatchCard: React.FC = () => (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-6 animate-pulse">
        <div className="mb-5">
            <div className="mb-2 h-5 w-3/4 rounded-md bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-1/3 rounded-md bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="space-y-3 mb-6">
            <div className="h-4 w-full rounded-md bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-2/3 rounded-md bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-10 w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
    </div>
);

// ============================================================================
// STAT BADGE (Hero inline stat)
// ============================================================================

const HeroStat: React.FC<{ value: string | number; label: string; loading?: boolean }> = ({ value, label, loading }) => (
    <div className="text-center px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <p className="text-3xl font-bold text-[#d6b161]">{loading ? '—' : value}</p>
        <p className="text-sm text-gray-400 mt-0.5">{label}</p>
    </div>
);

// ============================================================================
// BATCH CARD
// ============================================================================

const BatchCard: React.FC<{ batch: Batch; onManage: (batch: Batch) => void }> = ({ batch, onManage }) => (
    <motion.div
        variants={itemVariants}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 overflow-hidden transition-shadow"
    >
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#d6b161] to-amber-400" />

        <div className="flex flex-col flex-1 p-6">
            {/* Header */}
            <div className="mb-5">
                <div className={`mb-2 inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${batch.trainingType === 'skill'
                    ? 'bg-[#d6b161]/10 text-[#b38f3f] dark:text-[#f0d28a]'
                    : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300'
                    }`}>
                    {batch.trainingType === 'skill' ? 'Skill Batch' : 'Language Batch'}
                </div>
                <div className="mb-2 inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-700/70 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-200">
                    {batch.name}
                </div>
                <h3 className="mt-1.5 text-lg font-bold leading-snug text-[#0a192f] dark:text-white line-clamp-2" title={batch.courseTitle}>
                    {batch.courseTitle}
                </h3>
            </div>

            {/* Stats */}
            <div className="flex-1 mb-5 space-y-2.5">
                <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 px-3.5 py-2.5">
                    <div className="h-7 w-7 rounded-lg bg-[#d6b161]/10 flex items-center justify-center shrink-0">
                        <Users className="h-3.5 w-3.5 text-[#d6b161]" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Enrolled</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {batch.studentCount || 0} <span className="font-normal text-gray-500">students</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 px-3.5 py-2.5">
                    <div className="h-7 w-7 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                        <Calendar className="h-3.5 w-3.5 text-green-500" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Module</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Curriculum Active</p>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <button
                onClick={() => onManage(batch)}
                className="group/btn w-full flex items-center justify-center gap-2 rounded-xl bg-[#d6b161] px-4 py-3 text-sm font-bold text-[#0a192f] hover:bg-[#c4a055] active:scale-[0.98] transition-all"
            >
                <Upload className="h-4 w-4" />
                Open Batch
                <ChevronRight className="h-4 w-4 ml-auto opacity-50 group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
        </div>
    </motion.div>
);

// ============================================================================
// EMPTY STATE
// ============================================================================

const EmptyState: React.FC = () => (
    <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-20 px-6 text-center"
    >
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.35, type: 'spring', stiffness: 200 }}
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
        >
            <GraduationCap className="h-8 w-8 text-gray-400" />
        </motion.div>
        <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">No batches assigned yet</p>
        <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
            Batches will appear here once an admin assigns them to your account.
        </p>
    </motion.div>
);

const WebinarCard: React.FC<{ webinar: WebinarListing }> = ({ webinar }) => (
    <motion.div
        variants={itemVariants}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 overflow-hidden transition-shadow"
    >
        <div className="h-1 w-full bg-gradient-to-r from-[#d6b161] to-orange-400" />
        <div className="flex flex-1 flex-col p-6">
            <div className="mb-5">
                <div className="mb-2 inline-flex items-center rounded-md bg-[#d6b161]/10 px-2.5 py-1 text-xs font-bold text-[#b38f3f] dark:text-[#f0d28a] uppercase tracking-wide">
                    Webinar
                </div>
                <h3 className="mt-1.5 text-lg font-bold leading-snug text-[#0a192f] dark:text-white line-clamp-2">
                    {webinar.title}
                </h3>
            </div>

            <div className="mb-5 space-y-2.5">
                <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 px-3.5 py-2.5">
                    <div className="h-7 w-7 rounded-lg bg-[#d6b161]/10 flex items-center justify-center shrink-0">
                        <Calendar className="h-3.5 w-3.5 text-[#d6b161]" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Scheduled</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatWebinarDateTime(webinar.scheduledAt)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 px-3.5 py-2.5">
                    <div className="h-7 w-7 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                        <Users className="h-3.5 w-3.5 text-green-500" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Approved Students</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {webinar.approvedRegistrationsCount || 0} <span className="font-normal text-gray-500">approved</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 px-3.5 py-2.5">
                    <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Video className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Calendar Status</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {webinar.calendarSyncStatus === 'scheduled'
                                ? 'Google Meet ready'
                                : webinar.calendarSyncStatus === 'needs_trainer_connection'
                                    ? 'Needs Google Calendar'
                                    : webinar.calendarSyncStatus === 'sync_error'
                                        ? 'Sync error'
                                        : 'Draft'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-auto flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs text-gray-400">Price</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatWebinarPrice(webinar.price, webinar.currency || 'INR')}
                    </p>
                </div>
                {webinar.joinLink ? (
                    <a
                        href={webinar.joinLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#d6b161] px-4 py-3 text-sm font-bold text-[#0a192f] hover:bg-[#c4a055] transition-colors"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Open Meet
                    </a>
                ) : (
                    <span className="rounded-xl border border-dashed border-gray-300 px-4 py-3 text-xs font-semibold text-gray-500 dark:border-gray-600 dark:text-gray-400">
                        Waiting for sync
                    </span>
                )}
            </div>
        </div>
    </motion.div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TrainerDashboard: React.FC = () => {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [assignedWebinars, setAssignedWebinars] = useState<WebinarListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [webinarsLoading, setWebinarsLoading] = useState(true);
    const [trainerCalendarConnected, setTrainerCalendarConnected] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [batchResponse, webinarResponse] = await Promise.all([
                    api.get('/trainer-batches/mine'),
                    webinarCatalogAPI.getAssignedTrainer() as Promise<TrainerWebinarFeed>,
                ]);

                const normalizedBatches: Batch[] = Array.isArray(batchResponse.data)
                    ? batchResponse.data.map((batch: any) => ({
                        _id: String(batch._id),
                        courseTitle: String(batch.courseTitle || '').trim(),
                        name: String(batch.name || '').trim(),
                        studentCount: Number(batch.studentCount || 0),
                        trainingType: batch.trainingType === 'skill' ? 'skill' : 'language',
                    }))
                    : [];

                setBatches(normalizedBatches);
                setAssignedWebinars(webinarResponse.webinars || []);
                setTrainerCalendarConnected(webinarResponse.trainerCalendarConnected !== false);
            } catch (error) {
                console.error("Failed to fetch trainer dashboard data", error);
            } finally {
                setLoading(false);
                setWebinarsLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('googleConnected') === 'true') {
            alert('Google Calendar successfully connected. Webinar events and meet links will now stay in sync.');
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const handleBatchClick = (batch: Batch) => {
        navigate(
            batch.trainingType === 'skill' ? `/skill-batch/${batch._id}` : `/language-batch/${batch._id}`,
            {
                state: {
                    from: `${location.pathname}${location.search}`,
                },
            }
        );
    };
    const handleConnectGoogle = async () => {
        try {
            sessionStorage.setItem('googleOAuthReturnUrl', window.location.pathname);
            const response = await api.get('/auth/google/url');
            window.location.href = response.data.url;
        } catch (error) {
            console.error('Failed to get Google Auth URL', error);
            alert('Failed to initiate Google Calendar connection');
        }
    };

    const totalStudents = batches.reduce((acc, batch) => acc + (batch.studentCount || 0), 0);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <Header />

            {/* Hero */}
            <section className="relative bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1a365d] overflow-hidden py-24 sm:py-32 text-center">
                <HeroBackground />
                <div className="relative z-10 max-w-3xl mx-auto px-4">
                    <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#d6b161]/30 bg-[#d6b161]/10 px-4 py-1.5 mb-5">
                            <Layers className="h-3.5 w-3.5 text-[#d6b161]" />
                            <span className="text-xs font-semibold uppercase tracking-widest text-[#d6b161]">Trainer Portal</span>
                        </div>
                        <h1 className="mb-3 text-4xl font-bold font-sans md:text-5xl text-white">Trainer Dashboard</h1>
                        <p className="text-lg text-gray-400 mb-10">Manage your ongoing language and skill batches from one place.</p>
                        <div className="flex justify-center gap-4 flex-wrap">
                            <HeroStat value={batches.length} label="Active Batches" loading={loading} />
                            <HeroStat value={totalStudents} label="Total Students" loading={loading} />
                        </div>
                    </motion.div>
                </div>
            </section>

            <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                {/* Section Header Row */}
                <div className="flex items-center justify-between mb-7">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d6b161]/10">
                            <BookOpen className="h-5 w-5 text-[#d6b161]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-[#0a192f] dark:text-white">My Batches</h2>
                            {!loading && (
                                <p className="text-xs text-gray-400 mt-0.5">{batches.length} batch{batches.length !== 1 ? 'es' : ''} assigned</p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/30 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>

                <section className="mb-10">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d6b161]/10">
                                <Video className="h-5 w-5 text-[#d6b161]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-[#0a192f] dark:text-white">Upcoming Webinars</h2>
                                {!webinarsLoading && (
                                    <p className="text-xs text-gray-400 mt-0.5">{assignedWebinars.length} webinar{assignedWebinars.length !== 1 ? 's' : ''} assigned</p>
                                )}
                            </div>
                        </div>
                        {!trainerCalendarConnected && (
                            <button
                                type="button"
                                onClick={handleConnectGoogle}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0a192f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#112240] dark:bg-[#d6b161] dark:text-[#0a192f]"
                            >
                                <Video className="h-4 w-4" />
                                Connect Google Calendar
                            </button>
                        )}
                    </div>

                    {!trainerCalendarConnected && (
                        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
                            Google Calendar is not connected on your trainer account. New webinar events cannot be synced until you reconnect it.
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {webinarsLoading ? (
                            <motion.div
                                key="webinar-skeleton"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                            >
                                {Array.from({ length: 2 }).map((_, i) => <SkeletonBatchCard key={i} />)}
                            </motion.div>
                        ) : assignedWebinars.length === 0 ? (
                            <motion.div key="webinar-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-16 px-6 text-center">
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                                        <Video className="h-7 w-7 text-gray-400" />
                                    </div>
                                    <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">No webinars assigned yet</p>
                                    <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                                        Assigned webinars will appear here once admin schedules them for your account.
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="webinar-grid"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                            >
                                {assignedWebinars.map((webinar) => (
                                    <WebinarCard key={webinar._id} webinar={webinar} />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                {/* Batch Grid */}
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                        >
                            {Array.from({ length: 3 }).map((_, i) => <SkeletonBatchCard key={i} />)}
                        </motion.div>
                    ) : batches.length === 0 ? (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <EmptyState />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="grid"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                        >
                            {batches.map((batch) => (
                                <BatchCard key={`${batch.trainingType}-${batch._id}`} batch={batch} onManage={handleBatchClick} />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <Footer />
        </div>
    );
};

export default TrainerDashboard;
