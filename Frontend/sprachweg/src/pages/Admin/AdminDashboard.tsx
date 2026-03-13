import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
    Users,
    BookOpen,
    TrendingUp,
    Award,
    Mail,
    ArrowRight
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


// ============================================================================
// COMPONENTS
// ============================================================================

const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subtext?: string;
    color?: string;
}> = ({ icon, label, value, subtext, color = 'bg-[#d6b161]' }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#112240]"
        >
            <div className={`mb-3 inline-flex rounded-lg ${color}/10 p-3 text-${color.replace('bg-', '')}`}>{icon}</div>
            <p className="mb-1 text-3xl font-bold text-[#0a192f] dark:text-white">{value}</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
            {subtext && <p className="mt-1 text-xs text-gray-500">{subtext}</p>}
        </motion.div>
    );
};

// ============================================================================
// HERO COMPONENT
// ============================================================================

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay: custom * 0.1, ease: [0.22, 1, 0.36, 1] as const }
    })
};

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
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-[10%] -right-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#d6b161]/20 to-red-500/10 blur-[120px]"
            />
            <motion.div
                style={{ y: y2 }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-yellow-500/10 blur-[100px]"
            />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        </motion.div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AdminDashboard: React.FC = () => {
    // Data State
    const [batches, setBatches] = useState<Batch[]>([]);
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [loading, setLoading] = useState(true);

    // Stats State
    const [stats, setStats] = useState({
        activeTrainers: 0,
        activeClasses: 0,
        totalStudents: 0
    });


    useEffect(() => {
        fetchData();

        // Auto-refresh every 10 seconds
        const interval = setInterval(() => {
            fetchData();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [batchesRes, trainersRes] = await Promise.all([
                api.get('/language-training/admin/batches'),
                api.get('/language-training/admin/trainers')
            ]);

            const fetchedBatches: Batch[] = batchesRes.data;
            const fetchedTrainers: Trainer[] = trainersRes.data;


            setBatches(fetchedBatches);
            setTrainers(fetchedTrainers);

            // Calculate Stats
            const totalStudents = fetchedBatches.reduce((acc, batch) => acc + (batch.students?.length || 0), 0);

            setStats({
                activeTrainers: fetchedTrainers.length,
                activeClasses: fetchedBatches.length,
                totalStudents: totalStudents
            });
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch admin data", error);
            setLoading(false);
        }
    };



    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Hero */}
                {/* Hero */}
                <div className="relative bg-[#0a192f] dark:bg-[#030810] text-white py-28 sm:py-36 text-center overflow-hidden -mx-6 -mt-6 lg:-mx-8 lg:-mt-8 mb-8">
                    <HeroBackground />

                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeInUp}
                        >
                            <h1 className="mb-4 text-4xl font-bold font-serif md:text-5xl">Dashboard</h1>
                            <p className="text-xl text-gray-300">Overview of your academy's performance.</p>
                        </motion.div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        icon={<Users className="h-6 w-6 text-[#d6b161]" />}
                        label="Active Trainers"
                        value={loading ? "..." : stats.activeTrainers}
                    />
                    <StatCard
                        icon={<BookOpen className="h-6 w-6 text-green-500" />}
                        label="Active Classes"
                        value={loading ? "..." : stats.activeClasses}
                        color="bg-green-500"
                    />
                    <StatCard
                        icon={<Award className="h-6 w-6 text-blue-500" />}
                        label="Total Students"
                        value={loading ? "..." : stats.totalStudents}
                        color="bg-blue-500"
                    />
                </div>

                {/* Quick Access Links */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Link to="/admin/messages" className="group">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#112240] hover:border-[#d6b161] dark:hover:border-[#d6b161] transition-all hover:shadow-lg"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="mb-3 inline-flex rounded-lg bg-[#d6b161]/10 p-3 text-[#d6b161]">
                                        <Mail className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-[#0a192f] dark:text-white mb-1">Contact Messages</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">View and manage inquiries</p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#d6b161] group-hover:translate-x-1 transition-all" />
                            </div>
                        </motion.div>
                    </Link>

                    <Link to="/admin/booking-requests" className="group">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#112240] hover:border-[#d6b161] dark:hover:border-[#d6b161] transition-all hover:shadow-lg"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="mb-3 inline-flex rounded-lg bg-[#d6b161]/10 p-3 text-[#d6b161]">
                                        <Mail className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-[#0a192f] dark:text-white mb-1">Booking Requests</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">View language/skill requests</p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#d6b161] group-hover:translate-x-1 transition-all" />
                            </div>
                        </motion.div>
                    </Link>

                    <Link to="/admin/trainers" className="group">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#112240] hover:border-[#d6b161] dark:hover:border-[#d6b161] transition-all hover:shadow-lg"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="mb-3 inline-flex rounded-lg bg-[#d6b161]/10 p-3 text-[#d6b161]">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-[#0a192f] dark:text-white mb-1">Manage Trainers</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">View & promote trainers</p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#d6b161] group-hover:translate-x-1 transition-all" />
                            </div>
                        </motion.div>
                    </Link>

                     <Link to="/admin/feedback" className="group">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#112240] hover:border-[#d6b161] dark:hover:border-[#d6b161] transition-all hover:shadow-lg"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="mb-3 inline-flex rounded-lg bg-red-500/10 p-3 text-red-500">
                                        <Mail className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-[#0a192f] dark:text-white mb-1">Feedback/Errors</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage user feedback</p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                            </div>
                        </motion.div>
                    </Link>
                </div>


                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Recent Batches List */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#112240]">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#0a192f] dark:text-white">
                                <TrendingUp className="h-5 w-5 text-[#d6b161]" />
                                Recent Classes
                            </h3>
                            <div className="space-y-4">
                                {loading ? (
                                    <p className="text-gray-500">Loading classes...</p>
                                ) : batches.length === 0 ? (
                                    <p className="text-gray-500">No active classes found.</p>
                                ) : (
                                    batches.slice(0, 5).map((batch) => (
                                        <div key={batch._id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#0a192f]/50 transition-colors">
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{batch.courseTitle}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{batch.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {batch.students?.length || 0} Students
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Trainer: {trainers.find(t => t._id === batch.trainerId)?.name || 'Unassigned'}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <section className="p-6 rounded-2xl bg-linear-to-br from-[#0a192f] to-[#112240] text-white h-full">
                            <h3 className="font-bold text-lg mb-2">Admin Tips</h3>
                            <ul className="text-sm space-y-2 text-gray-300 list-disc list-inside">
                                <li>Review trainer applications carefully</li>
                                <li>Monitor class attendance regularly</li>
                                <li>Keep platform announcements updated</li>
                            </ul>
                        </section>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
