import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Calendar,
    Clock,
    User,
    Edit,
    Mail,
    Phone,
    GraduationCap,
    CalendarDays
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import ProfileCompletionModal from '../components/auth/ProfileCompletionModal';

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
                <span className="text-xl font-bold text-[#0a192f] dark:text-white">{progress}%</span>
            </div>
        </div>
    );
};

const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
    const handleJoinLive = () => {
        if (typeof (window as any).api?.joinLiveClass === 'function') {
            (window as any).api.joinLiveClass(course.id);
        } else {
            window.open(`/live-class/${course.id}`, '_blank');
        }
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
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
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleJoinLive}
                    className="flex-1 rounded-lg bg-[#d6b161] px-4 py-2 text-sm font-semibold text-[#0a192f] transition-colors hover:bg-[#c4a055]"
                >
                    Join Live
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#d6b161] hover:text-[#d6b161] dark:border-gray-600 dark:text-gray-300"
                >
                    View Schedule
                </motion.button>
            </div>
        </motion.div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const StudentDashboard: React.FC = () => {
    const { user } = useAuth();
    const [courses] = useState<Course[]>(mockCourses);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
                    className="mb-8 rounded-2xl bg-gradient-to-br from-[#0a192f] to-[#112240] p-8 text-white relative overflow-hidden"
                >
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d6b161] opacity-10 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 h-32 w-32 -translate-x-1/2 translate-y-1/2 rounded-full bg-[#d6b161] opacity-10 blur-3xl"></div>

                    <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="mb-2 text-3xl font-bold">Student Dashboard</h1>
                            <p className="text-gray-300">Welcome back, {user?.name}!</p>
                        </div>
                    </div>
                </motion.div>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Profile Section - Takes 4 columns */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-4"
                    >
                        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="flex items-center gap-2 text-xl font-bold text-[#0a192f] dark:text-white">
                                    <User className="h-5 w-5 text-[#d6b161]" />
                                    My Profile
                                </h2>
                                <Button
                                    onClick={() => setIsProfileModalOpen(true)}
                                    className="p-2 text-gray-500 hover:text-[#d6b161] dark:text-gray-400 dark:hover:text-[#d6b161] transition-colors"
                                    title="Edit Profile"
                                >
                                    <Edit className="h-5 w-5" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <User className="h-5 w-5 text-[#d6b161] mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</p>
                                        <p className="text-base font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <Mail className="h-5 w-5 text-[#d6b161] mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</p>
                                        <p className="text-base font-semibold text-gray-900 dark:text-white">{user?.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <Phone className="h-5 w-5 text-[#d6b161] mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
                                        <p className="text-base font-semibold text-gray-900 dark:text-white">{user?.phoneNumber || 'Not set'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <CalendarDays className="h-5 w-5 text-[#d6b161] mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</p>
                                        <p className="text-base font-semibold text-gray-900 dark:text-white">
                                            {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not set'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <GraduationCap className="h-5 w-5 text-[#d6b161] mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Qualification</p>
                                        <p className="text-base font-semibold text-gray-900 dark:text-white">{user?.qualification || 'Not set'}</p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Guardian Info</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-400">Name</p>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.guardianName || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Phone</p>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.guardianPhone || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </motion.div>

                    {/* Enrolled Courses Section - Takes 8 columns */}
                    <div className="lg:col-span-8">
                        <section>
                            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-[#0a192f] dark:text-white">
                                <BookOpen className="h-6 w-6 text-[#d6b161]" />
                                Enrolled Courses
                            </h2>
                            {courses.length > 0 ? (
                                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
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
                            ) : (
                                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                                    <p className="text-gray-500 dark:text-gray-400">You are not enrolled in any courses yet.</p>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </main>

            <ProfileCompletionModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />

            <Footer />
        </div>
    );
};

export default StudentDashboard;
