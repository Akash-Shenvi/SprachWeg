import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    Users,
    CheckCircle,
    XCircle,
    Shield,
    DollarSign,
    AlertCircle,
    TrendingUp,
    BookOpen,
    Calendar,
    FileText,
    Settings,
    Search,
    Filter
} from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PendingTrainer {
    id: string;
    name: string;
    email: string;
    specialization: string;
    experience: string;
    appliedDate: string;
    status: 'pending' | 'approved' | 'rejected';
}

interface ActiveTrainer {
    id: string;
    name: string;
    courses: number;
    students: number;
    rating: number;
    earnings: string;
    status: 'active' | 'paused';
}

interface PaymentIssue {
    id: string;
    trainerName: string;
    type: 'refund' | 'dispute' | 'payout';
    amount: string;
    date: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockPendingTrainers: PendingTrainer[] = [
    {
        id: 'trainer-1',
        name: 'Dr. Anna Schmidt',
        email: 'anna.schmidt@email.com',
        specialization: 'German Language (A1-C1)',
        experience: '8 years',
        appliedDate: '2025-12-10',
        status: 'pending'
    },
    {
        id: 'trainer-2',
        name: 'John Williams',
        email: 'john.w@email.com',
        specialization: 'IELTS Preparation',
        experience: '5 years',
        appliedDate: '2025-12-12',
        status: 'pending'
    }
];

const mockActiveTrainers: ActiveTrainer[] = [
    {
        id: 'active-1',
        name: 'Dr. Schmidt',
        courses: 3,
        students: 42,
        rating: 4.8,
        earnings: '₹85,000',
        status: 'active'
    },
    {
        id: 'active-2',
        name: 'Sarah Johnson',
        courses: 2,
        students: 28,
        rating: 4.9,
        earnings: '₹62,000',
        status: 'active'
    }
];

const mockPaymentIssues: PaymentIssue[] = [
    {
        id: 'payment-1',
        trainerName: 'Dr. Schmidt',
        type: 'payout',
        amount: '₹12,000',
        date: '2025-12-15'
    },
    {
        id: 'payment-2',
        trainerName: 'Sarah Johnson',
        type: 'refund',
        amount: '₹5,500',
        date: '2025-12-14'
    }
];

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
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className={`mb-3 inline-flex rounded-lg ${color}/10 p-3 text-${color.replace('bg-', '')}`}>{icon}</div>
            <p className="mb-1 text-3xl font-bold text-[#0a192f] dark:text-white">{value}</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
            {subtext && <p className="mt-1 text-xs text-gray-500">{subtext}</p>}
        </div>
    );
};

const PendingTrainerCard: React.FC<{
    trainer: PendingTrainer;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}> = ({ trainer, onApprove, onReject }) => {
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={shouldReduceMotion ? {} : { y: -2 }}
            className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
        >
            <div className="mb-4">
                <h3 className="mb-1 text-lg font-bold text-[#0a192f] dark:text-white">{trainer.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{trainer.email}</p>
            </div>

            <div className="mb-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Specialization:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{trainer.specialization}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Experience:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{trainer.experience}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Applied:</span>
                    <span className="text-gray-500">{trainer.appliedDate}</span>
                </div>
            </div>

            <div className="flex gap-3">
                <motion.button
                    whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                    onClick={() => onApprove(trainer.id)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-600"
                >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                </motion.button>
                <motion.button
                    whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                    onClick={() => onReject(trainer.id)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
                >
                    <XCircle className="h-4 w-4" />
                    Reject
                </motion.button>
            </div>
        </motion.div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AdminDashboard: React.FC = () => {
    const [pendingTrainers, setPendingTrainers] = useState<PendingTrainer[]>(mockPendingTrainers);
    const [activeTrainers] = useState<ActiveTrainer[]>(mockActiveTrainers);
    const [paymentIssues] = useState<PaymentIssue[]>(mockPaymentIssues);
    const [searchQuery, setSearchQuery] = useState('');

    const handleApproveTrainer = (id: string) => {
        // TODO: Integrate with backend
        if (typeof (window as any).api?.approveTrainer === 'function') {
            (window as any).api.approveTrainer(id);
        } else {
            setPendingTrainers(pendingTrainers.filter((t) => t.id !== id));
            alert('Trainer approved successfully!');
        }
    };

    const handleRejectTrainer = (id: string) => {
        // TODO: Integrate with backend
        if (typeof (window as any).api?.rejectTrainer === 'function') {
            (window as any).api.rejectTrainer(id);
        } else {
            setPendingTrainers(pendingTrainers.filter((t) => t.id !== id));
            alert('Trainer application rejected.');
        }
    };

    const handleApproveRefund = (id: string) => {
        // TODO: Integrate with backend
        if (typeof (window as any).api?.approveRefund === 'function') {
            (window as any).api.approveRefund(id);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-[#0a192f] focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-[#d6b161]"
            >
                Skip to content
            </a>

            <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 rounded-2xl bg-gradient-to-br from-[#0a192f] to-[#112240] p-8 text-white"
                >
                    <h1 className="mb-2 text-3xl font-bold">Admin: Trainer Management</h1>
                    <p className="text-gray-300">Approve, manage, and oversee all trainers</p>
                </motion.div>

                {/* Stats Overview */}
                <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={<Users className="h-6 w-6" />}
                        label="Active Trainers"
                        value={activeTrainers.length}
                    />
                    <StatCard
                        icon={<AlertCircle className="h-6 w-6" />}
                        label="Pending Approvals"
                        value={pendingTrainers.length}
                        color="bg-orange-500"
                    />
                    <StatCard
                        icon={<BookOpen className="h-6 w-6" />}
                        label="Total Courses"
                        value={12}
                    />
                    <StatCard
                        icon={<DollarSign className="h-6 w-6" />}
                        label="Monthly Payouts"
                        value="₹2.4L"
                        subtext="+15% from last month"
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Pending Approvals */}
                        <section>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="flex items-center gap-2 text-2xl font-bold text-[#0a192f] dark:text-white">
                                    <Shield className="h-6 w-6 text-[#d6b161]" />
                                    Pending Trainer Approvals
                                    {pendingTrainers.length > 0 && (
                                        <span className="rounded-full bg-orange-500 px-3 py-1 text-sm text-white">
                                            {pendingTrainers.length}
                                        </span>
                                    )}
                                </h2>
                                <div className="flex gap-2">
                                    <button className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                                        <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    </button>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-[#d6b161] focus:outline-none focus:ring-2 focus:ring-[#d6b161]/20 dark:border-gray-600 dark:bg-gray-800"
                                        />
                                    </div>
                                </div>
                            </div>

                            {pendingTrainers.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {pendingTrainers.map((trainer) => (
                                        <PendingTrainerCard
                                            key={trainer.id}
                                            trainer={trainer}
                                            onApprove={handleApproveTrainer}
                                            onReject={handleRejectTrainer}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                                    <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
                                    <p className="font-semibold text-gray-900 dark:text-white">All caught up!</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">No pending trainer approvals</p>
                                </div>
                            )}
                        </section>

                        {/* Active Trainers Table */}
                        <section>
                            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-[#0a192f] dark:text-white">
                                <Users className="h-6 w-6 text-[#d6b161]" />
                                Active Trainers
                            </h2>
                            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                                                Trainer
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                                                Courses
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                                                Students
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                                                Rating
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                                                Earnings
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {activeTrainers.map((trainer) => (
                                            <tr key={trainer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                    {trainer.name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{trainer.courses}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{trainer.students}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    <span className="flex items-center gap-1">
                                                        <span className="font-semibold text-gray-900 dark:text-white">{trainer.rating}</span>
                                                        <span className="text-yellow-500">★</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                                                    {trainer.earnings}
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                        {trainer.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Payment Issues */}
                        <section>
                            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-[#0a192f] dark:text-white">
                                <DollarSign className="h-5 w-5 text-[#d6b161]" />
                                Payment Issues
                                {paymentIssues.length > 0 && (
                                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                                        {paymentIssues.length}
                                    </span>
                                )}
                            </h3>
                            <div className="space-y-3">
                                {paymentIssues.map((issue) => (
                                    <div
                                        key={issue.id}
                                        className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                                    >
                                        <div className="mb-2 flex items-start justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{issue.trainerName}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {issue.type.charAt(0).toUpperCase() + issue.type.slice(1)}: {issue.amount}
                                                </p>
                                            </div>
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs font-semibold ${issue.type === 'refund'
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                    }`}
                                            >
                                                {issue.type}
                                            </span>
                                        </div>
                                        <p className="mb-3 text-xs text-gray-500">{issue.date}</p>
                                        <button
                                            onClick={() => handleApproveRefund(issue.id)}
                                            className="w-full rounded-lg bg-[#d6b161] px-4 py-2 text-sm font-semibold text-[#0a192f] hover:bg-[#c4a055]"
                                        >
                                            Review & Approve
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Quick Analytics */}
                        <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#0a192f] dark:text-white">
                                <TrendingUp className="h-5 w-5 text-[#d6b161]" />
                                Quick Analytics
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Trainer Retention</span>
                                        <span className="font-bold text-gray-900 dark:text-white">94%</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                        <div className="h-full w-[94%] rounded-full bg-green-500"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Avg. Student Rating</span>
                                        <span className="font-bold text-gray-900 dark:text-white">4.7 ★</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                        <div className="h-full w-[94%] rounded-full bg-yellow-500"></div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* System Controls */}
                        <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#0a192f] dark:text-white">
                                <Settings className="h-5 w-5 text-[#d6b161]" />
                                System Controls
                            </h3>
                            <div className="space-y-2">
                                <button className="flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <Calendar className="h-4 w-4 text-[#d6b161]" />
                                    <span>Manage Timetables</span>
                                </button>
                                <button className="flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <BookOpen className="h-4 w-4 text-[#d6b161]" />
                                    <span>Course Management</span>
                                </button>
                                <button className="flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <FileText className="h-4 w-4 text-[#d6b161]" />
                                    <span>Export Reports</span>
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default AdminDashboard;
