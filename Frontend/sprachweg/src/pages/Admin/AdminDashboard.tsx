import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
    Users,
    BookOpen,
    TrendingUp,
    Shield,
    Award,
    Trash2,
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

interface TrialRequest {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    countryCode: string;
    interest: string;
    language?: string;
    course?: string;
    prepLevel?: string;
    skillCourses?: string[];
    comments?: string;
    createdAt: string;
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
    const [trialRequests, setTrialRequests] = useState<TrialRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());

    // Stats State
    const [stats, setStats] = useState({
        activeTrainers: 0,
        activeClasses: 0,
        totalStudents: 0
    });

    // Promotion State
    const [promoteEmail, setPromoteEmail] = useState("");
    const [promoting, setPromoting] = useState(false);

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
            const [batchesRes, trainersRes, trialsRes] = await Promise.all([
                api.get('/language-training/admin/batches'),
                api.get('/language-training/admin/trainers'),
                api.get('/trials')
            ]);

            const fetchedBatches: Batch[] = batchesRes.data;
            const fetchedTrainers: Trainer[] = trainersRes.data;

            console.log('Fetched trial requests:', trialsRes.data);
            console.log('Number of trial requests:', trialsRes.data.length);
            setTrialRequests(trialsRes.data);

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

    const handlePromoteTrainer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promoteEmail) return;

        try {
            setPromoting(true);
            const { data } = await api.post('/language-training/admin/promote-trainer', { email: promoteEmail });
            alert(data.message);
            setPromoteEmail("");
            fetchData(); // Refresh trainers list
        } catch (error: any) {
            console.error("Failed to promote user", error);
            alert(error.response?.data?.message || 'Failed to promote user');
        } finally {
            setPromoting(false);
        }
    };

    const handleRemoveTrainer = async (id: string) => {
        if (!window.confirm("Are you sure you want to remove this trainer? This action cannot be undone.")) {
            return;
        }

        try {
            await api.delete(`/language-training/admin/trainers/${id}`);
            setTrainers(trainers.filter(t => t._id !== id));
            // Recalculate stats
            setStats(prev => ({
                ...prev,
                activeTrainers: prev.activeTrainers - 1
            }));
        } catch (error: any) {
            console.error("Failed to remove trainer", error);
            alert(error.response?.data?.message || 'Failed to remove trainer');
        }
    };

    const handleDeleteTrialRequest = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this request?")) return;
        try {
            await api.delete(`/trials/${id}`);
            setTrialRequests(prev => prev.filter(req => req._id !== id));
        } catch (error: any) {
            console.error("Failed to delete trial request", error);
            alert(error.response?.data?.message || 'Failed to delete request');
        }
    };

    const toggleRequestDetails = (id: string) => {
        setExpandedRequests(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
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
                </div>

                {/* Trial Requests */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#112240]">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#0a192f] dark:text-white">
                        <Mail className="h-5 w-5 text-[#d6b161]" />
                        New booking requests
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                        {loading ? (
                            <p className="text-gray-500">Loading requests...</p>
                        ) : trialRequests.length === 0 ? (
                            <p className="text-gray-500">No new booking requests.</p>
                        ) : (
                            trialRequests.map((req) => {
                                const isExpanded = expandedRequests.has(req._id);
                                return (
                                    <div key={req._id} className="rounded-lg border border-gray-100 p-4 dark:border-gray-700 bg-gray-50 dark:bg-[#0a192f]/50">
                                        {/* Summary View - Always Visible */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <span className="font-bold text-gray-900 dark:text-white">{req.fullName}</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs border ${req.interest === 'Language' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300' : req.interest === 'Skill' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300'}`}>
                                                        {req.interest}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                    {req.email}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString()}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => toggleRequestDetails(req._id)}
                                                    className="px-3 py-1.5 text-sm font-medium text-[#0a192f] dark:text-white bg-[#d6b161] hover:bg-[#c4a055] rounded-lg transition-colors"
                                                    title={isExpanded ? "Hide Details" : "View Details"}
                                                >
                                                    {isExpanded ? 'Hide' : 'View'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTrialRequest(req._id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                                    title="Delete Request"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                                                {/* Contact Info */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Email</span>
                                                        <p className="text-sm text-gray-900 dark:text-white">{req.email}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Phone</span>
                                                        <p className="text-sm text-gray-900 dark:text-white">{req.countryCode} {req.phone}</p>
                                                    </div>
                                                </div>

                                                {/* Language Training Details */}
                                                {(req.interest === 'Language' || req.interest === 'Both') && req.language && (
                                                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                                                        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2">Language Training</h4>
                                                        <div className="space-y-1 text-sm">
                                                            <div>
                                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Language: </span>
                                                                <span className="text-gray-600 dark:text-gray-400 capitalize">{req.language}</span>
                                                            </div>
                                                            {req.course && (
                                                                <div>
                                                                    <span className="font-semibold text-gray-700 dark:text-gray-300">Course: </span>
                                                                    <span className="text-gray-600 dark:text-gray-400">{req.course}</span>
                                                                </div>
                                                            )}
                                                            {req.prepLevel && (
                                                                <div>
                                                                    <span className="font-semibold text-gray-700 dark:text-gray-300">Target Level: </span>
                                                                    <span className="text-gray-600 dark:text-gray-400">{req.prepLevel}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Skill Training Details */}
                                                {(req.interest === 'Skill' || req.interest === 'Both') && req.skillCourses && req.skillCourses.length > 0 && (
                                                    <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30">
                                                        <h4 className="text-sm font-bold text-purple-900 dark:text-purple-300 mb-2">Skill Training</h4>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {req.skillCourses.map((course, idx) => (
                                                                <span key={idx} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800">
                                                                    {course}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Comments */}
                                                {req.comments && (
                                                    <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Comments</h4>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">{req.comments}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>

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

                    {/* Promote to Trainer */}
                    <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#112240]">
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#0a192f] dark:text-white">
                            <Shield className="h-5 w-5 text-[#d6b161]" />
                            Promote User to Trainer
                        </h3>
                        <form onSubmit={handlePromoteTrainer} className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">
                                    Enter email to grant Trainer access
                                </label>
                                <input
                                    type="email"
                                    placeholder="user@example.com"
                                    value={promoteEmail}
                                    onChange={(e) => setPromoteEmail(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0a192f] p-2.5 text-sm outline-none focus:ring-2 focus:ring-[#d6b161] dark:text-white transition-all"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={promoting}
                                className="w-full rounded-lg bg-[#d6b161] py-2.5 text-sm font-bold text-[#0a192f] transition-colors hover:bg-[#c4a055] disabled:opacity-50 flex justify-center"
                            >
                                {promoting ? "Promoting..." : "Promote User"}
                            </button>
                        </form>
                    </section>

                    {/* Manage Trainers List */}
                    <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#112240]">
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#0a192f] dark:text-white">
                            <Users className="h-5 w-5 text-[#d6b161]" />
                            Manage Trainers
                        </h3>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {loading ? (
                                <p className="text-gray-500 text-sm">Loading trainers...</p>
                            ) : trainers.length === 0 ? (
                                <p className="text-gray-500 text-sm">No trainers found.</p>
                            ) : (
                                trainers.map((trainer) => (
                                    <div key={trainer._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#0a192f]/50 border border-gray-100 dark:border-gray-700">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                {trainer.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {trainer.email}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveTrainer(trainer._id)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-2 shrink-0"
                                            title="Remove Trainer"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="p-6 rounded-2xl bg-linear-to-br from-[#0a192f] to-[#112240] text-white">
                        <h3 className="font-bold text-lg mb-2">Admin Tips</h3>
                        <ul className="text-sm space-y-2 text-gray-300 list-disc list-inside">
                            <li>Review trainer applications carefully</li>
                            <li>Monitor class attendance regularly</li>
                            <li>Keep platform announcements updated</li>
                        </ul>
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
