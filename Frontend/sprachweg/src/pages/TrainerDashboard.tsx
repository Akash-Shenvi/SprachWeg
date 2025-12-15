import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Calendar, CheckSquare, BarChart2, DollarSign, MessageSquare,
    MoreHorizontal, Search, X, Check, Filter, ChevronDown, Download,
    Video, Edit3, Eye, FileText, Send, Mic, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/layout';

// --- Types ---

interface Student {
    id: string;
    name: string;
    email: string;
    attendance: number;
    lastActive: string;
    status: 'active' | 'at-risk' | 'inactive';
}

interface Batch {
    id: string;
    name: string;
    course: string;
    students: number;
    attendance: number;
    nextClass: string;
}

interface ClassSession {
    id: string;
    title: string;
    time: string;
    batch: string;
    attendees: number;
    status: 'upcoming' | 'live' | 'completed';
}

// --- Framer Motion Variants ---

const variants = {
    pageEntry: {
        initial: { opacity: 0, y: 12 },
        enter: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] } },
    },
    tableRowHover: {
        rest: { scale: 1, y: 0, zIndex: 1, boxShadow: "0 0 0 rgba(0,0,0,0)" },
        hover: { scale: 1.01, y: -2, zIndex: 10, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", transition: { duration: 0.2 } }
    },
    drawerOpen: {
        closed: { x: "100%", opacity: 0, transition: { duration: 0.2 } },
        open: { x: 0, opacity: 1, transition: { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] } }
    }
};

// --- Mock Data ---

const MOCK_BATCHES: Batch[] = [
    { id: 'b1', name: 'Batch A - Morning', course: 'German A1', students: 24, attendance: 92, nextClass: 'Today, 10:00 AM' },
    { id: 'b2', name: 'Batch B - Evening', course: 'Business German', students: 18, attendance: 85, nextClass: 'Tomorrow, 6:00 PM' },
];

const MOCK_CLASSES: ClassSession[] = [
    { id: 'c1', title: 'Modal Verbs Practice', time: '10:00 AM - 11:30 AM', batch: 'Batch A', attendees: 22, status: 'upcoming' },
];

const MOCK_STUDENTS: Student[] = [
    { id: 's1', name: 'Rahul Verma', email: 'rahul@example.com', attendance: 95, lastActive: '2h ago', status: 'active' },
    { id: 's2', name: 'Priya Singh', email: 'priya@example.com', attendance: 82, lastActive: '1d ago', status: 'active' },
    { id: 's3', name: 'Amit Kumar', email: 'amit@example.com', attendance: 60, lastActive: '5d ago', status: 'at-risk' },
    { id: 's4', name: 'Sneha Gupta', email: 'sneha@example.com', attendance: 98, lastActive: '10m ago', status: 'active' },
    { id: 's5', name: 'Vikram Malhotra', email: 'vikram@example.com', attendance: 45, lastActive: '2w ago', status: 'inactive' },
];

// --- Components ---

const StatCard: React.FC<{ title: string; value: string; subtext: string; icon: any; color: string }> = ({ title, value, subtext, icon: Icon, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-start justify-between mb-4">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
                <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
            </div>
        </div>
        <div className="flex items-center text-sm text-green-600 font-medium">
            <span className="bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full text-xs mr-2">
                +12%
            </span>
            {subtext}
        </div>
    </div>
);

const BatchCard: React.FC<{ batch: Batch }> = ({ batch }) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <div>
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md inline-block mb-2">
                    {batch.course}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{batch.name}</h3>
            </div>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <MoreHorizontal className="w-5 h-5" />
            </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Students</div>
                <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    {batch.students}
                </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Attendance</div>
                <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-green-500" />
                    {batch.attendance}%
                </div>
            </div>
        </div>

        <div className="flex items-center justify-between text-sm border-t border-gray-100 dark:border-gray-700 pt-4">
            <span className="text-gray-500 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> {batch.nextClass}
            </span>
            <button className="text-indigo-600 font-semibold hover:underline">Manage</button>
        </div>
    </div>
);

const GradingDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
    <AnimatePresence>
        {isOpen && (
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black z-40"
                />
                <motion.div
                    variants={variants.drawerOpen}
                    initial="closed"
                    animate="open"
                    exit="closed"
                    className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto"
                >
                    <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-10">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Grading Assignment</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Student Info */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">RV</div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Rahul Verma</h3>
                                <p className="text-sm text-gray-500">Submitted 2h ago • 3 Attachments</p>
                            </div>
                        </div>

                        {/* Submission Viewing */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 min-h-[300px] flex items-center justify-center flex-col text-gray-400">
                            <FileText className="w-12 h-12 mb-2 opacity-50" />
                            <p>PDF Preview Component Placeholder</p>
                            <button className="mt-4 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg shadow-sm text-sm font-medium">Download Submission</button>
                        </div>

                        {/* Grading Tools */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-900 dark:text-white">Feedback & Score</h4>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Private Note</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                                    rows={4}
                                    placeholder="Write constructive feedback here..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Score (out of 100)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <input
                                        type="number"
                                        className="w-20 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-center font-bold"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-200 dark:border-gray-800 sticky bottom-0 bg-white dark:bg-gray-900">
                        <div className="flex gap-4">
                            <button className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors">
                                Publish Grade
                            </button>
                            <button onClick={onClose} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                Save Draft
                            </button>
                        </div>
                    </div>
                </motion.div>
            </>
        )}
    </AnimatePresence>
);

// --- Main Trainer Dashboard Component ---

const TrainerDashboard: React.FC = () => {
    const { user } = useAuth();
    const [isGradingOpen, setIsGradingOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
            <Header />

            <motion.div
                variants={variants.pageEntry}
                initial="initial"
                animate="enter"
                className="max-w-[1600px] mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trainer Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400">Manage your batches, classes, and student performance.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Schedule
                        </button>
                        <button className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-2">
                            <Video className="w-4 h-4" /> Start Live Class
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8">

                    {/* LEFT CONTENT (Main Stats & Tables) */}
                    <div className="col-span-12 lg:col-span-9 space-y-8">

                        {/* Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard
                                title="Total Students"
                                value="142"
                                subtext="vs last month"
                                icon={Users}
                                color="bg-blue-500"
                            />
                            <StatCard
                                title="Avg. Attendance"
                                value="88%"
                                subtext="vs last month"
                                icon={CheckSquare}
                                color="bg-green-500"
                            />
                            <StatCard
                                title="Est. Earnings"
                                value="€ 2,840"
                                subtext="this month"
                                icon={DollarSign}
                                color="bg-purple-500"
                            />
                        </div>

                        {/* Active Batches */}
                        <section>
                            <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                                Active Batches
                                <button className="text-sm text-indigo-600 font-semibold hover:underline">View All</button>
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                {MOCK_BATCHES.map(batch => (
                                    <BatchCard key={batch.id} batch={batch} />
                                ))}
                            </div>
                        </section>

                        {/* Student Performance Table */}
                        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h2 className="text-lg font-bold">Student Performance</h2>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder="Search student..."
                                            className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                                        />
                                    </div>
                                    <button className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <Filter className="w-4 h-4 text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-xs uppercase text-gray-500 font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">Student Name</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Attendance</th>
                                            <th className="px-6 py-4">Last Active</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {MOCK_STUDENTS.map(student => (
                                            <motion.tr
                                                key={student.id}
                                                variants={variants.tableRowHover}
                                                initial="rest"
                                                whileHover="hover"
                                                className="bg-white dark:bg-gray-800"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                                                            {student.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900 dark:text-gray-100">{student.name}</div>
                                                            <div className="text-xs text-gray-500">{student.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${student.status === 'active' ? 'bg-green-100 text-green-700' :
                                                        student.status === 'at-risk' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {student.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                                            <div
                                                                className={`h-1.5 rounded-full ${student.attendance > 90 ? 'bg-green-500' : student.attendance > 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                                style={{ width: `${student.attendance}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-medium">{student.attendance}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {student.lastActive}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => setIsGradingOpen(true)}
                                                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm mr-4"
                                                    >
                                                        Details
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-center">
                                <button className="text-sm text-gray-500 font-medium hover:text-gray-700">View All Students</button>
                            </div>
                        </section>
                    </div>

                    {/* RIGHT SIDEBAR (Quick Ops) */}
                    <div className="col-span-12 lg:col-span-3 space-y-6">

                        {/* Upcoming Classes */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Upcoming Classes</h3>
                            <div className="space-y-4">
                                {MOCK_CLASSES.map(cls => (
                                    <div key={cls.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                                                {cls.batch}
                                            </span>
                                            <button className="text-gray-400 hover:text-gray-600">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">{cls.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {cls.time}
                                        </p>
                                        <button className="w-full py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                                            Start Class
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Notes */}
                        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-2xl p-6 border border-yellow-100 dark:border-yellow-900/30">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <Edit3 className="w-4 h-4 text-orange-500" /> Quick Note
                            </h3>
                            <textarea
                                className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border-none shadow-sm text-sm mb-3 focus:ring-2 focus:ring-orange-200 outline-none"
                                rows={3}
                                placeholder="Jot down a reminder or announcement..."
                            />
                            <div className="flex justify-end">
                                <button className="p-2 bg-orange-500 text-white rounded-lg shadow-sm hover:bg-orange-600 transition-colors">
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </motion.div>

            {/* Drawers & Modals */}
            <GradingDrawer isOpen={isGradingOpen} onClose={() => setIsGradingOpen(false)} />

        </div>
    );
};

export default TrainerDashboard;
