import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    BookOpen,
    Users,
    Video,
    Upload,
    FileText,
    TrendingUp,
    DollarSign,
    Bell,
    Calendar,
    CheckSquare,
    Clock,
    Play,
    StopCircle,
    Download,
    Edit,
    MessageSquare,
    BarChart
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TrainerCourse {
    id: string;
    name: string;
    students: number;
    batches: number;
    nextSession: string;
    status: 'active' | 'paused';
}

interface LiveSession {
    id: string;
    courseName: string;
    batch: string;
    scheduledTime: string;
    isLive: boolean;
    studentCount?: number;
}

interface StudentPerformance {
    id: string;
    name: string;
    course: string;
    attendance: number;
    lastGrade: string;
}

interface PendingGrading {
    id: string;
    studentName: string;
    assignment: string;
    course: string;
    submittedDate: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockCourses: TrainerCourse[] = [
    {
        id: 'course-1',
        name: 'German A2 - Batch 5',
        students: 24,
        batches: 3,
        nextSession: '2025-12-17 10:00 AM',
        status: 'active'
    },
    {
        id: 'course-2',
        name: 'German B1 - Batch 3',
        students: 18,
        batches: 2,
        nextSession: '2025-12-18 2:00 PM',
        status: 'active'
    }
];

const mockLiveSession: LiveSession = {
    id: 'session-1',
    courseName: 'German A2',
    batch: 'Batch 5',
    scheduledTime: '10:00 AM',
    isLive: false
};

const mockStudents: StudentPerformance[] = [
    { id: '1', name: 'John Doe', course: 'German A2', attendance: 95, lastGrade: 'A' },
    { id: '2', name: 'Jane Smith', course: 'German A2', attendance: 88, lastGrade: 'B+' },
    { id: '3', name: 'Mike Johnson', course: 'German B1', attendance: 92, lastGrade: 'A-' }
];

const mockPendingGrading: PendingGrading[] = [
    {
        id: 'grade-1',
        studentName: 'John Doe',
        assignment: 'Essay on German Culture',
        course: 'German A2',
        submittedDate: '2025-12-15'
    },
    {
        id: 'grade-2',
        studentName: 'Jane Smith',
        assignment: 'Grammar Exercise Set 3',
        course: 'German A2',
        submittedDate: '2025-12-14'
    }
];

// ============================================================================
// COMPONENTS
// ============================================================================

const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    trend?: string;
}> = ({ icon, label, value, trend }) => {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 flex items-center justify-between">
                <div className="rounded-lg bg-[#d6b161]/10 p-2 text-[#d6b161]">{icon}</div>
                {trend && <span className="text-xs font-semibold text-green-500">{trend}</span>}
            </div>
            <p className="mb-1 text-3xl font-bold text-[#0a192f] dark:text-white">{value}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        </div>
    );
};

const CourseManagementCard: React.FC<{ course: TrainerCourse }> = ({ course }) => {
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.div
            whileHover={shouldReduceMotion ? {} : { y: -4 }}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h3 className="mb-1 text-xl font-bold text-[#0a192f] dark:text-white">{course.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {course.students} students
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {course.batches} batches
                        </span>
                    </div>
                </div>
                <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${course.status === 'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                >
                    {course.status}
                </span>
            </div>

            <div className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                    <Clock className="mr-1 inline h-4 w-4 text-[#d6b161]" />
                    Next session: {course.nextSession}
                </p>
            </div>

            <div className="flex gap-2">
                <button className="flex-1 rounded-lg bg-[#d6b161] px-4 py-2 text-sm font-semibold text-[#0a192f] transition-colors hover:bg-[#c4a055]">
                    Manage Batch
                </button>
                <button className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#d6b161] hover:text-[#d6b161] dark:border-gray-600 dark:text-gray-300">
                    <Edit className="mr-1 inline h-4 w-4" />
                    Edit Course
                </button>
            </div>
        </motion.div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TrainerDashboard: React.FC = () => {
    const [courses] = useState<TrainerCourse[]>(mockCourses);
    const [liveSession, setLiveSession] = useState<LiveSession>(mockLiveSession);
    const [students] = useState<StudentPerformance[]>(mockStudents);
    const [pendingGrading] = useState<PendingGrading[]>(mockPendingGrading);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const shouldReduceMotion = useReducedMotion();

    const handleStartLiveClass = () => {
        // TODO: Integrate with backend
        if (typeof (window as any).api?.startLiveClass === 'function') {
            (window as any).api.startLiveClass(liveSession.id);
        } else {
            setLiveSession({ ...liveSession, isLive: true, studentCount: 0 });
            window.open(`/live-class/host/${liveSession.id}`, '_blank');
        }
    };

    const handleStopLiveClass = () => {
        if (typeof (window as any).api?.stopLiveClass === 'function') {
            (window as any).api.stopLiveClass(liveSession.id);
        } else {
            setLiveSession({ ...liveSession, isLive: false });
        }
    };

    const handleUploadMaterial = () => {
        // TODO: Integrate with backend
        setShowUploadModal(true);
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
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 rounded-2xl bg-gradient-to-br from-[#0a192f] to-[#112240] p-8 text-white"
                >
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="mb-2 text-3xl font-bold">Trainer Dashboard</h1>
                            <p className="text-gray-300">Manage your courses and students</p>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-3xl font-bold">42</p>
                                <p className="text-sm text-gray-300">Active Students</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold">5</p>
                                <p className="text-sm text-gray-300">Live Batches</p>
                            </div>
                        </div>
                    </div>

                    {/* Live Class Control */}
                    <div className="mt-6">
                        {!liveSession.isLive ? (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleStartLiveClass}
                                className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-[#d6b161] bg-[#d6b161]/10 p-4 font-semibold transition-colors hover:bg-[#d6b161]/20"
                            >
                                <Play className="h-6 w-6 text-[#d6b161]" />
                                <span>Start Live Class: {liveSession.courseName} ({liveSession.batch})</span>
                                <span className="text-sm text-gray-300">{liveSession.scheduledTime}</span>
                            </motion.button>
                        ) : (
                            <div className="flex items-center justify-between rounded-xl border-2 border-red-500 bg-red-500/10 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500">
                                        <Video className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Live Now: {liveSession.courseName}</p>
                                        <p className="text-sm text-gray-300">{liveSession.studentCount || 0} students joined</p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleStopLiveClass}
                                    className="flex items-center gap-2 rounded-lg bg-red-500 px-6 py-3 font-bold text-white transition-colors hover:bg-red-600"
                                >
                                    <StopCircle className="h-5 w-5" />
                                    End Session
                                </motion.button>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard icon={<BookOpen className="h-6 w-6" />} label="Active Courses" value={courses.length} />
                    <StatCard icon={<Users className="h-6 w-6" />} label="Total Students" value={42} />
                    <StatCard
                        icon={<FileText className="h-6 w-6" />}
                        label="Pending Grading"
                        value={pendingGrading.length}
                    />
                    <StatCard icon={<DollarSign className="h-6 w-6" />} label="This Month" value="₹45,000" trend="+12%" />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Course Management */}
                        <section>
                            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-[#0a192f] dark:text-white">
                                <BookOpen className="h-6 w-6 text-[#d6b161]" />
                                My Courses
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {courses.map((course) => (
                                    <CourseManagementCard key={course.id} course={course} />
                                ))}
                            </div>
                        </section>

                        {/* Upload Materials */}
                        <section className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                            <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                            <h3 className="mb-2 text-lg font-bold text-[#0a192f] dark:text-white">Upload Materials</h3>
                            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                                Upload recordings, assignments, or study materials
                            </p>
                            <button
                                onClick={handleUploadMaterial}
                                className="rounded-lg bg-[#d6b161] px-6 py-3 font-semibold text-[#0a192f] transition-colors hover:bg-[#c4a055]"
                            >
                                Select Files
                            </button>
                        </section>

                        {/* Student Performance */}
                        <section>
                            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-[#0a192f] dark:text-white">
                                <BarChart className="h-6 w-6 text-[#d6b161]" />
                                Student Performance
                            </h2>
                            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                Student
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                Course
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                Attendance
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                Grade
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {students.map((student) => (
                                            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                    {student.name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{student.course}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${student.attendance >= 90
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            }`}
                                                    >
                                                        {student.attendance}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                                                    {student.lastGrade}
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
                        {/* Pending Grading */}
                        <section>
                            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-[#0a192f] dark:text-white">
                                <CheckSquare className="h-5 w-5 text-[#d6b161]" />
                                Pending Grading
                                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                                    {pendingGrading.length}
                                </span>
                            </h3>
                            <div className="space-y-3">
                                {pendingGrading.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                                    >
                                        <p className="mb-1 font-semibold text-gray-900 dark:text-white">{item.studentName}</p>
                                        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">{item.assignment}</p>
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>{item.course}</span>
                                            <span>{item.submittedDate}</span>
                                        </div>
                                        <button className="mt-3 w-full rounded-lg bg-[#d6b161] px-4 py-2 text-sm font-semibold text-[#0a192f] hover:bg-[#c4a055]">
                                            Grade Now
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Quick Actions */}
                        <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                            <h3 className="mb-4 text-lg font-bold text-[#0a192f] dark:text-white">Quick Actions</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => setShowAnnouncementModal(true)}
                                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <Bell className="h-5 w-5 text-[#d6b161]" />
                                    <span className="text-sm font-medium">Send Announcement</span>
                                </button>
                                <button className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <Calendar className="h-5 w-5 text-[#d6b161]" />
                                    <span className="text-sm font-medium">Schedule Session</span>
                                </button>
                                <button className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <Download className="h-5 w-5 text-[#d6b161]" />
                                    <span className="text-sm font-medium">Export Attendance</span>
                                </button>
                                <button className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <MessageSquare className="h-5 w-5 text-[#d6b161]" />
                                    <span className="text-sm font-medium">Message Students</span>
                                </button>
                            </div>
                        </section>

                        {/* Earnings Summary */}
                        <section className="rounded-2xl border border-gray-200 bg-gradient-to-br from-[#d6b161]/10 to-transparent p-6 dark:border-gray-700">
                            <h3 className="mb-4 text-lg font-bold text-[#0a192f] dark:text-white">Earnings</h3>
                            <div className="mb-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">This Month</span>
                                    <span className="font-bold text-[#0a192f] dark:text-white">₹45,000</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Pending Payout</span>
                                    <span className="font-bold text-[#0a192f] dark:text-white">₹12,000</span>
                                </div>
                            </div>
                            <button className="w-full rounded-lg bg-[#d6b161] px-4 py-3 font-semibold text-[#0a192f] hover:bg-[#c4a055]">
                                Request Payout
                            </button>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default TrainerDashboard;
