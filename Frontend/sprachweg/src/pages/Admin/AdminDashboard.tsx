import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    BookOpen,
    TrendingUp,
    Shield,
    Award,
    Trash2
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../lib/api';

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

    // Promotion State
    const [promoteEmail, setPromoteEmail] = useState("");
    const [promoting, setPromoting] = useState(false);

    useEffect(() => {
        fetchData();
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

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Hero */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">
                            Dashboard
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Overview of your academy's performance.
                        </p>
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
