import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import api from '../lib/api';
import { getAssetUrl } from '../lib/api';
import {
    BookOpen,
    User,
    Edit,
    Mail,
    Phone,
    GraduationCap,
    CalendarDays,
    MessageCircle
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import ProfileCompletionModal from '../components/auth/ProfileCompletionModal';

// ============================================================================
// COMPONENTS
// ============================================================================

const CourseCard: React.FC<{ course: any }> = ({ course }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const myId = user?._id || (user as any)?.id;

    const handleCardClick = () => {
        navigate(`/language-batch/${course._id}`);
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 cursor-pointer"
            onClick={handleCardClick}
        >
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h3 className="text-xl font-bold text-[#0a192f] dark:text-white">{course.courseTitle}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{course.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Trainer: {course.trainerId?.name || 'Unknown'}</p>
                </div>
                {/* Progress ring or other visuals if we have data */}
            </div>

            <div className="flex gap-3 mt-4">
                <button className="flex-1 text-center text-[#d6b161] font-semibold hover:underline">
                    View Course Content & Materials
                </button>
                {course.trainerId && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/chat/${myId}`);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d6b161]/10 text-[#d6b161] hover:bg-[#d6b161]/20 text-sm font-medium transition-colors"
                    >
                        <MessageCircle className="w-4 h-4" />
                        Chat
                    </button>
                )}
            </div>
        </motion.div>
    );
};

// ============================================================================
// ANIMATIONS & COMPONENTS
// ============================================================================

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay: custom * 0.1, ease: [0.22, 1, 0.36, 1] as const }
    })
};

// Hero Background Component with parallax blobs + grain
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

const StudentDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const response = await api.get('/language-trainer/student/batches');
                setCourses(response.data);
            } catch (error) {
                console.error("Failed to fetch student batches", error);
            } finally {
                setLoading(false);
            }
        };
        if (user) {
            fetchBatches();
        }
    }, [user]);

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

            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1a365d] overflow-hidden py-28 sm:py-36 text-center">
                <HeroBackground />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                    >
                        <h1 className="mb-4 text-4xl font-bold font-sans md:text-5xl text-white">Student Dashboard</h1>
                        <p className="text-xl text-gray-300">Welcome back, {user?.name}!</p>
                    </motion.div>
                </div>
            </section>

            <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

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
                                <button
                                    onClick={() => {
                                        logout();
                                        navigate('/login');
                                    }}
                                    className="p-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                    title="Logout"
                                >
                                    <div className="flex items-center gap-1 font-semibold text-sm">
                                        Logout
                                    </div>
                                </button>
                            </div>

                            <div className="flex flex-col items-center mb-6 pt-2 pb-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="h-28 w-28 rounded-full bg-[#d6b161]/20 flex items-center justify-center overflow-hidden border-4 border-[#d6b161]/30 text-[#d6b161] font-bold text-4xl mb-4 shadow-sm">
                                    {user?.avatar ? (
                                        <img src={getAssetUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        user?.name?.charAt(0).toUpperCase() || 'U'
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{user?.name}</h3>
                                <p className="text-sm font-medium text-[#d6b161] uppercase tracking-wider">{user?.role}</p>
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
                            {loading ? <p>Loading courses...</p> : (
                                <>
                                    {courses.length > 0 ? (
                                        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                                            {courses.map((course, idx) => (
                                                <motion.div
                                                    key={course._id}
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
                                </>
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
