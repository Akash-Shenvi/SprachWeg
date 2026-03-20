import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
    Briefcase,
    Users,
    BookOpen,
    TrendingUp,
    Award,
    Mail,
    ArrowRight,
    Plus,
    ChevronRight,
    Activity,
    Layers
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../lib/api';
import { Link } from 'react-router-dom';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Trainer {
    _id: string;
    name: string;
    email: string;
}

interface Batch {
    _id: string;
    courseTitle: string;
    name: string;
    trainerId?: string;
    students: any[];
}

interface InternshipApplicationSummary {
    _id: string;
    status: string;
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.07, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
    }
};

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay: custom * 0.1, ease: [0.22, 1, 0.36, 1] as const }
    })
};

// ============================================================================
// SKELETON LOADER
// ============================================================================

const SkeletonCard: React.FC = () => (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#112240] animate-pulse">
        <div className="mb-3 h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="mb-2 h-8 w-16 rounded-md bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-28 rounded-md bg-gray-200 dark:bg-gray-700" />
    </div>
);

const SkeletonRow: React.FC = () => (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4 dark:border-gray-700/60 animate-pulse">
        <div className="space-y-2">
            <div className="h-4 w-36 rounded-md bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-24 rounded-md bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="text-right space-y-2">
            <div className="h-4 w-20 rounded-md bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-28 rounded-md bg-gray-200 dark:bg-gray-700" />
        </div>
    </div>
);

// ============================================================================
// STAT CARD
// ============================================================================

const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subtext?: string;
    accent?: string;
    loading?: boolean;
}> = ({ icon, label, value, subtext, accent = '#d6b161', loading = false }) => {
    if (loading) return <SkeletonCard />;
    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm hover:shadow-xl dark:border-gray-800/80 dark:bg-[#112240] transition-shadow overflow-hidden"
        >
            {/* Accent glow */}
            <div
                className="absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                style={{ background: accent }}
            />
            <div
                className="mb-4 inline-flex rounded-xl p-3"
                style={{ background: `${accent}18` }}
            >
                {icon}
            </div>
            <p className="mb-1 text-3xl font-bold tracking-tight text-[#0a192f] dark:text-white">{value}</p>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{label}</p>
            {subtext && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
                    <Activity className="h-3 w-3" />
                    {subtext}
                </p>
            )}
        </motion.div>
    );
};

// ============================================================================
// QUICK ACCESS CARD
// ============================================================================

const QuickAccessCard: React.FC<{
    to: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    accent?: string;
    delay?: number;
}> = ({ to, icon, title, description, accent = '#d6b161', delay = 0 }) => (
    <motion.div variants={itemVariants} custom={delay}>
        <Link to={to} className="group block">
            <motion.div
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="relative rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm hover:shadow-lg dark:border-gray-800/80 dark:bg-[#112240] transition-all overflow-hidden"
                style={{ borderColor: undefined }}
            >
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                    style={{ background: `linear-gradient(135deg, ${accent}06 0%, transparent 60%)` }}
                />
                <div className="relative flex items-start justify-between">
                    <div className="flex-1">
                        <div
                            className="mb-4 inline-flex rounded-xl p-2.5"
                            style={{ background: `${accent}18` }}
                        >
                            {icon}
                        </div>
                        <h3 className="mb-1 text-base font-bold text-[#0a192f] dark:text-white">{title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
                    </div>
                    <div
                        className="mt-1 ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-200 group-hover:translate-x-1"
                        style={{ background: `${accent}18` }}
                    >
                        <ChevronRight className="h-4 w-4" style={{ color: accent }} />
                    </div>
                </div>
            </motion.div>
        </Link>
    </motion.div>
);

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
// SECTION HEADER
// ============================================================================

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
    <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d6b161]/10">
                {icon}
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#0a192f] dark:text-white">{title}</h2>
        </div>
        {subtitle && <p className="pl-10 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
    </div>
);

// ============================================================================
// DIVIDER
// ============================================================================

const SectionDivider: React.FC = () => (
    <div className="my-2 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700/60 to-transparent" />
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AdminDashboard: React.FC = () => {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeTrainers: 0,
        activeClasses: 0,
        totalStudents: 0,
        pendingInternshipRequests: 0,
    });

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => { fetchData(); }, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [batchesRes, trainersRes, internshipApplicationsRes] = await Promise.all([
                api.get('/language-training/admin/batches'),
                api.get('/language-training/admin/trainers'),
                api.get('/internship-applications/admin'),
            ]);
            const fetchedBatches: Batch[] = batchesRes.data;
            const fetchedTrainers: Trainer[] = trainersRes.data;
            const fetchedInternshipApplications: InternshipApplicationSummary[] = internshipApplicationsRes.data.applications || [];
            setBatches(fetchedBatches);
            setTrainers(fetchedTrainers);
            const totalStudents = fetchedBatches.reduce((acc, batch) => acc + (batch.students?.length || 0), 0);
            const pendingInternshipRequests = fetchedInternshipApplications.filter(
                (application) => !['accepted', 'rejected'].includes(application.status)
            ).length;
            setStats({ activeTrainers: fetchedTrainers.length, activeClasses: fetchedBatches.length, totalStudents, pendingInternshipRequests });
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch admin data", error);
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                {/* ── Hero ── */}
                <div className="relative bg-[#0a192f] dark:bg-[#030810] text-white py-24 sm:py-32 text-center overflow-hidden -mx-6 -mt-6 lg:-mx-8 lg:-mt-8 mb-10">
                    <HeroBackground />
                    <div className="relative z-10 max-w-3xl mx-auto px-4">
                        <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#d6b161]/30 bg-[#d6b161]/10 px-4 py-1.5 mb-5">
                                <Layers className="h-3.5 w-3.5 text-[#d6b161]" />
                                <span className="text-xs font-semibold uppercase tracking-widest text-[#d6b161]">Admin Portal</span>
                            </div>
                            <h1 className="mb-3 text-4xl font-bold font-serif md:text-5xl">Dashboard</h1>
                            <p className="text-lg text-gray-400 max-w-md mx-auto">Overview of your academy's performance and operations.</p>
                        </motion.div>
                    </div>
                </div>

                <div className="space-y-10 pb-10">
                    {/* ── Stats ── */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                    >
                        <StatCard
                            icon={<Users className="h-5 w-5 text-[#d6b161]" />}
                            label="Active Trainers"
                            value={loading ? "—" : stats.activeTrainers}
                            accent="#d6b161"
                            loading={loading}
                        />
                        <StatCard
                            icon={<BookOpen className="h-5 w-5 text-green-500" />}
                            label="Active Classes"
                            value={loading ? "—" : stats.activeClasses}
                            accent="#22c55e"
                            loading={loading}
                        />
                        <StatCard
                            icon={<Award className="h-5 w-5 text-blue-500" />}
                            label="Total Students"
                            value={loading ? "—" : stats.totalStudents}
                            accent="#3b82f6"
                            loading={loading}
                        />
                        <StatCard
                            icon={<Briefcase className="h-5 w-5 text-amber-500" />}
                            label="Internship Requests"
                            value={loading ? "—" : stats.pendingInternshipRequests}
                            subtext="Pending admin review"
                            accent="#f59e0b"
                            loading={loading}
                        />
                    </motion.div>

                    <SectionDivider />

                    {/* ── Internship Dashboard ── */}
                    <section>
                        <SectionHeader
                            icon={<Briefcase className="h-4 w-4 text-[#d6b161]" />}
                            title="Internship Dashboard"
                            subtitle="Review requests or publish new internship listings."
                        />
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid gap-4 md:grid-cols-2"
                        >
                            <QuickAccessCard
                                to="/admin/internship-applications"
                                icon={<Briefcase className="h-5 w-5 text-[#d6b161]" />}
                                title="Internship Hub Requests"
                                description={loading ? 'Loading requests…' : `${stats.pendingInternshipRequests} pending applications awaiting review`}
                                accent="#d6b161"
                            />
                            <QuickAccessCard
                                to="/admin/internships"
                                icon={<Plus className="h-5 w-5 text-green-500" />}
                                title="Add Internships"
                                description="Create and manage live internship listings for students"
                                accent="#22c55e"
                            />
                        </motion.div>
                    </section>

                    <SectionDivider />

                    {/* ── Quick Access ── */}
                    <section>
                        <SectionHeader
                            icon={<Activity className="h-4 w-4 text-[#d6b161]" />}
                            title="Quick Access"
                            subtitle="Jump to any section of the admin panel."
                        />
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                        >
                            <QuickAccessCard
                                to="/admin/messages"
                                icon={<Mail className="h-5 w-5 text-[#d6b161]" />}
                                title="Contact Messages"
                                description="View and manage incoming inquiries"
                                accent="#d6b161"
                            />
                            <QuickAccessCard
                                to="/admin/booking-requests"
                                icon={<Mail className="h-5 w-5 text-[#d6b161]" />}
                                title="Booking Requests"
                                description="View language and skill course requests"
                                accent="#d6b161"
                            />
                            <QuickAccessCard
                                to="/admin/trainers"
                                icon={<Users className="h-5 w-5 text-[#d6b161]" />}
                                title="Manage Trainers"
                                description="View, promote and assign trainers"
                                accent="#d6b161"
                            />
                            <QuickAccessCard
                                to="/admin/feedback"
                                icon={<Mail className="h-5 w-5 text-red-500" />}
                                title="Feedback / Errors"
                                description="Manage and triage user feedback"
                                accent="#ef4444"
                            />
                            <QuickAccessCard
                                to="/admin/file-links"
                                icon={<Award className="h-5 w-5 text-orange-500" />}
                                title="File Links"
                                description="Upload and manage shared files"
                                accent="#f97316"
                            />
                        </motion.div>
                    </section>

                    <SectionDivider />

                    {/* ── Bottom Grid ── */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Recent Classes */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="lg:col-span-2 rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800/80 dark:bg-[#112240] overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700/60">
                                <div className="flex items-center gap-2.5">
                                    <TrendingUp className="h-5 w-5 text-[#d6b161]" />
                                    <h3 className="font-bold text-[#0a192f] dark:text-white">Recent Classes</h3>
                                </div>
                                <Link to="/admin/batches" className="flex items-center gap-1 text-xs font-semibold text-[#d6b161] hover:underline">
                                    View all <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                            <div className="p-4 space-y-2">
                                <AnimatePresence>
                                    {loading ? (
                                        Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                                    ) : batches.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex flex-col items-center justify-center py-12 text-center"
                                        >
                                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                                                <BookOpen className="h-6 w-6 text-gray-400" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No active classes found</p>
                                            <p className="text-xs text-gray-400 mt-1">Classes will appear here once created</p>
                                        </motion.div>
                                    ) : (
                                        batches.slice(0, 5).map((batch, idx) => (
                                            <motion.div
                                                key={batch._id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.06 }}
                                                whileHover={{ x: 4, transition: { duration: 0.15 } }}
                                                className="group flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-700/60 p-4 hover:border-[#d6b161]/40 hover:bg-[#d6b161]/[0.03] dark:hover:border-[#d6b161]/30 transition-all cursor-default"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-lg bg-[#d6b161]/10 flex items-center justify-center shrink-0">
                                                        <BookOpen className="h-4 w-4 text-[#d6b161]" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{batch.courseTitle}</p>
                                                        <p className="text-xs text-gray-400 dark:text-gray-500">{batch.name}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0 ml-4">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        {batch.students?.length || 0} <span className="text-xs font-normal text-gray-400">students</span>
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {trainers.find(t => t._id === batch.trainerId)?.name || 'Unassigned'}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.section>

                        {/* Admin Tips */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-4"
                        >
                            <div className="rounded-2xl bg-gradient-to-br from-[#0a192f] to-[#112240] text-white p-6 h-full border border-[#d6b161]/10">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-7 w-7 rounded-lg bg-[#d6b161]/20 flex items-center justify-center">
                                        <Activity className="h-4 w-4 text-[#d6b161]" />
                                    </div>
                                    <h3 className="font-bold text-white">Admin Tips</h3>
                                </div>
                                <ul className="space-y-3">
                                    {[
                                        'Review trainer applications carefully',
                                        'Monitor class attendance regularly',
                                        'Keep platform announcements updated',
                                    ].map((tip, i) => (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + i * 0.1 }}
                                            className="flex items-start gap-2.5 text-sm text-gray-300"
                                        >
                                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#d6b161] shrink-0" />
                                            {tip}
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;