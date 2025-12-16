import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    BookOpen,
    Clock,
    Video,
    FileText,
    Award,
    Calendar,
    TrendingUp,
    Download,
    Play,
    CheckCircle,
    AlertCircle,
    Bell,
    CreditCard,
    User,
    ChevronRight,
    Upload
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Course {
    id: string;
    name: string;
    trainer: string;
    progress: number;
    nextClass: string;
    batchSchedule: string;
    status: 'active' | 'completed' | 'upcoming';
}

interface LiveSession {
    id: string;
    courseName: string;
    startTime: string;
    isLive: boolean;
}

interface Recording {
    id: string;
    title: string;
    course: string;
    duration: string;
    uploadedAt: string;
    thumbnail: string;
}

interface Assignment {
    id: string;
    title: string;
    course: string;
    dueDate: string;
    status: 'pending' | 'submitted' | 'graded';
    score?: number;
}

interface Announcement {
    id: string;
    from: string;
    subject: string;
    preview: string;
    date: string;
    unread: boolean;
}

// ============================================================================
// MOCK DATA (Replace with API calls)
// ============================================================================

const mockCourses: Course[] = [
    {
        id: '1',
        name: 'German A2',
        trainer: 'Dr. Schmidt',
        progress: 65,
        nextClass: '2025-12-17 10:00 AM',
        batchSchedule: 'Mon, Wed, Fri • 10:00 AM',
        status: 'active'
    },
    {
        id: '2',
        name: 'IELTS Preparation',
        trainer: 'Sarah Johnson',
        progress: 45,
        nextClass: '2025-12-18 2:00 PM',
        batchSchedule: 'Tue, Thu • 2:00 PM',
        status: 'active'
    }
];

const mockLiveSession: LiveSession | null = {
    id: 'live-1',
    courseName: 'German A2',
    startTime: '10:00 AM',
    isLive: true
};

const mockRecordings: Recording[] = [
    {
        id: 'rec-1',
        title: 'German Grammar - Past Tense',
        course: 'German A2',
        duration: '45:30',
        uploadedAt: '2025-12-15',
        thumbnail: '/placeholder-video.jpg'
    },
    {
        id: 'rec-2',
        title: 'IELTS Writing Task 2',
        course: 'IELTS Preparation',
        duration: '52:15',
        uploadedAt: '2025-12-14',
        thumbnail: '/placeholder-video.jpg'
    }
];

const mockAssignments: Assignment[] = [
    {
        id: 'assign-1',
        title: 'Write essay on German culture',
        course: 'German A2',
        dueDate: '2025-12-20',
        status: 'pending'
    },
    {
        id: 'assign-2',
        title: 'IELTS Speaking Practice',
        course: 'IELTS Preparation',
        dueDate: '2025-12-18',
        status: 'submitted'
    }
];

const mockAnnouncements: Announcement[] = [
    {
        id: 'ann-1',
        from: 'Dr. Schmidt',
        subject: 'Class rescheduled to 11 AM tomorrow',
        preview: 'Due to technical issues, tomorrow\'s class will start at 11 AM instead of 10 AM...',
        date: '2 hours ago',
        unread: true
    }
];

// ============================================================================
// COMPONENTS
// ============================================================================

const ProgressRing: React.FC<{ progress: number; size?: number }> = ({ progress, size = 120 }) => {
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="text-[#d6b161] transition-all duration-500"
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-[#0a192f] dark:text-white">{progress}%</span>
            </div>
        </div>
    );
};

const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
    const shouldReduceMotion = useReducedMotion();

    const handleJoinLive = () => {
        // TODO: Integrate with backend
        if (typeof (window as any).api?.joinLiveClass === 'function') {
            (window as any).api.joinLiveClass(course.id);
        } else {
            window.open(`/live-class/${course.id}`, '_blank');
        }
    };

    return (
        <motion.div
            whileHover={shouldReduceMotion ? {} : { y: -4 }}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h3 className="text-xl font-bold text-[#0a192f] dark:text-white">{course.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">with {course.trainer}</p>
                </div>
                <ProgressRing progress={course.progress} size={60} />
            </div>

            <div className="mb-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Calendar className="h-4 w-4 text-[#d6b161]" />
                    <span>{course.batchSchedule}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Clock className="h-4 w-4 text-[#d6b161]" />
                    <span>Next class: {course.nextClass}</span>
                </div>
            </div>

            <div className="flex gap-3">
                <motion.button
                    whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                    onClick={handleJoinLive}
                    className="flex-1 rounded-lg bg-[#d6b161] px-4 py-2 text-sm font-semibold text-[#0a192f] transition-colors hover:bg-[#c4a055]"
                >
                    Join Live
                </motion.button>
                <motion.button
                    whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                    className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#d6b161] hover:text-[#d6b161] dark:border-gray-600 dark:text-gray-300"
                >
                    View Schedule
                </motion.button>
            </div>
        </motion.div>
    );
};

const RecordingCard: React.FC<{ recording: Recording }> = ({ recording }) => {
    return (
        <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
                <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="h-12 w-12 text-white opacity-75 transition-opacity group-hover:opacity-100" />
                </div>
            </div>
            <div className="p-4">
                <h4 className="mb-1 font-semibold text-gray-900 dark:text-white">{recording.title}</h4>
                <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">{recording.course}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{recording.duration}</span>
                    <span>{recording.uploadedAt}</span>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const StudentDashboard: React.FC = () => {
    const [courses] = useState<Course[]>(mockCourses);
    const [liveSession] = useState<LiveSession | null>(mockLiveSession);
    const [recordings] = useState<Recording[]>(mockRecordings);
    const [assignments] = useState<Assignment[]>(mockAssignments);
    const [announcements] = useState<Announcement[]>(mockAnnouncements);
    const shouldReduceMotion = useReducedMotion();

    // TODO: Replace with actual API call
    useEffect(() => {
        // window.api?.fetchDashboardData?.().then(setDashboardData);
    }, []);

    const handleJoinLiveSession = () => {
        if (liveSession && typeof (window as any).api?.joinLiveClass === 'function') {
            (window as any).api.joinLiveClass(liveSession.id);
        } else if (liveSession) {
            window.open(`/live-class/${liveSession.id}`, '_blank');
        }
    };

    const unreadCount = announcements.filter((a) => a.unread).length;
    const overallProgress = Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / courses.length);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            {/* Skip to Content */}
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
                    <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="mb-2 text-3xl font-bold">Welcome back, Student!</h1>
                            <p className="text-gray-300">Continue your learning journey</p>
                        </div>
                        <ProgressRing progress={overallProgress} size={100} />
                    </div>

                    {/* Live Class Alert */}
                    {liveSession && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-6 flex items-center justify-between rounded-xl border-2 border-[#d6b161] bg-[#d6b161]/10 p-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500">
                                    <Video className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold">{liveSession.courseName} is LIVE now!</p>
                                    <p className="text-sm text-gray-300">Started at {liveSession.startTime}</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleJoinLiveSession}
                                className="rounded-lg bg-[#d6b161] px-6 py-3 font-bold text-[#0a192f] transition-colors hover:bg-[#c4a055]"
                            >
                                Join Now
                            </motion.button>
                        </motion.div>
                    )}
                </motion.div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Enrolled Courses */}
                        <section>
                            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-[#0a192f] dark:text-white">
                                <BookOpen className="h-6 w-6 text-[#d6b161]" />
                                My Courses
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {courses.map((course, idx) => (
                                    <motion.div
                                        key={course.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <CourseCard course={course} />
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        {/* Recorded Classes */}
                        <section>
                            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-[#0a192f] dark:text-white">
                                <Video className="h-6 w-6 text-[#d6b161]" />
                                Recorded Classes
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {recordings.map((rec) => (
                                    <RecordingCard key={rec.id} recording={rec} />
                                ))}
                            </div>
                        </section>

                        {/* Assignments */}
                        <section>
                            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-[#0a192f] dark:text-white">
                                <FileText className="h-6 w-6 text-[#d6b161]" />
                                Assignments & Tests
                            </h2>
                            <div className="space-y-3">
                                {assignments.map((assignment) => (
                                    <div
                                        key={assignment.id}
                                        className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                                    >
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">{assignment.title}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {assignment.course} • Due: {assignment.dueDate}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {assignment.status === 'submitted' ? (
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <button className="rounded-lg bg-[#d6b161] px-4 py-2 text-sm font-semibold text-[#0a192f] hover:bg-[#c4a055]">
                                                    <Upload className="inline h-4 w-4 mr-1" />
                                                    Submit
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Announcements */}
                        <section>
                            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-[#0a192f] dark:text-white">
                                <Bell className="h-5 w-5 text-[#d6b161]" />
                                Announcements
                                {unreadCount > 0 && (
                                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{unreadCount}</span>
                                )}
                            </h3>
                            <div className="space-y-2">
                                {announcements.map((ann) => (
                                    <div
                                        key={ann.id}
                                        className={`rounded-lg border p-3 ${ann.unread
                                            ? 'border-[#d6b161] bg-[#d6b161]/5'
                                            : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                                            }`}
                                    >
                                        <div className="mb-1 flex items-start justify-between">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{ann.subject}</p>
                                            {ann.unread && <div className="h-2 w-2 rounded-full bg-[#d6b161]" />}
                                        </div>
                                        <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">{ann.preview}</p>
                                        <p className="text-xs text-gray-500">{ann.from} • {ann.date}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Quick Stats */}
                        <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                            <h3 className="mb-4 text-lg font-bold text-[#0a192f] dark:text-white">Quick Stats</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-[#d6b161]" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Attendance</span>
                                    </div>
                                    <span className="font-bold text-[#0a192f] dark:text-white">92%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Award className="h-5 w-5 text-[#d6b161]" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Certificates</span>
                                    </div>
                                    <span className="font-bold text-[#0a192f] dark:text-white">3</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-[#d6b161]" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Pending Tasks</span>
                                    </div>
                                    <span className="font-bold text-[#0a192f] dark:text-white">2</span>
                                </div>
                            </div>
                        </section>

                        {/* Quick Links */}
                        <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                            <h3 className="mb-4 text-lg font-bold text-[#0a192f] dark:text-white">Quick Links</h3>
                            <div className="space-y-2">
                                <button className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-[#d6b161]" />
                                        <span className="text-sm font-medium">My Profile</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                                <button className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-[#d6b161]" />
                                        <span className="text-sm font-medium">Payment History</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                                <button className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <div className="flex items-center gap-2">
                                        <Download className="h-4 w-4 text-[#d6b161]" />
                                        <span className="text-sm font-medium">Certificates</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4" />
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

export default StudentDashboard;
