import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { getAssetUrl, internshipApplicationAPI, webinarRegistrationAPI } from '../lib/api';
import {
    BookOpen,
    Briefcase,
    User,
    Edit,
    Mail,
    Phone,
    GraduationCap,
    CalendarDays,
    MessageCircle,
    LogOut,
    Layers,
    ExternalLink,
    Video
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import ProfileCompletionModal from '../components/auth/ProfileCompletionModal';
import { formatInternshipMode } from '../types/internship';
import { formatWebinarDateTime, formatWebinarPrice, type ApprovedWebinar } from '../types/webinar';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface EnrolledInternship {
    _id: string;
    internshipTitle: string;
    internshipMode?: string;
    referenceCode: string;
    status: string;
    createdAt: string;
}

// ============================================================================
// ANIMATIONS
// ============================================================================

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay: custom * 0.1, ease: [0.22, 1, 0.36, 1] as const }
    })
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } }
};

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
// SKELETON LOADERS
// ============================================================================

const SkeletonCourseCard: React.FC = () => (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 animate-pulse">
        <div className="mb-3 h-5 w-3/4 rounded-md bg-gray-200 dark:bg-gray-700" />
        <div className="mb-2 h-4 w-1/2 rounded-md bg-gray-200 dark:bg-gray-700" />
        <div className="mt-4 flex gap-3">
            <div className="h-8 flex-1 rounded-lg bg-gray-200 dark:bg-gray-700" />
            <div className="h-8 w-20 rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
    </div>
);



// ============================================================================
// COURSE CARD
// ============================================================================

const CourseCard: React.FC<{ course: any }> = ({ course }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const myId = user?._id || (user as any)?.id;
    const trainerId = typeof course.trainerId === 'string' ? course.trainerId : course.trainerId?._id;

    const handleCardClick = () => { navigate(`/language-batch/${course._id}`); };

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 cursor-pointer overflow-hidden transition-shadow"
            onClick={handleCardClick}
        >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl bg-gradient-to-br from-[#d6b161]/[0.04] to-transparent" />
            <div className="relative">
                <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1 mr-2">
                        <div className="mb-1 inline-flex items-center rounded-md bg-[#d6b161]/10 px-2 py-0.5 text-xs font-semibold text-[#d6b161] uppercase tracking-wide">
                            Language Course
                        </div>
                        <h3 className="mt-2 text-lg font-bold leading-snug text-[#0a192f] dark:text-white">{course.courseTitle}</h3>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{course.name}</p>
                        <p className="mt-1 text-xs text-gray-400">Trainer: <span className="text-gray-600 dark:text-gray-300 font-medium">{course.trainerId?.name || 'Unknown'}</span></p>
                    </div>
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-[#0a192f]/5 dark:bg-[#d6b161]/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-[#d6b161]" />
                    </div>
                </div>
                <div className="mt-5 flex gap-3" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={handleCardClick}
                        className="flex-1 rounded-xl bg-[#0a192f] dark:bg-[#d6b161] px-4 py-2 text-sm font-semibold text-white dark:text-[#0a192f] hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                    >
                        <BookOpen className="h-4 w-4" />
                        View Materials
                    </button>
                    {course.trainerId && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!trainerId) return;
                                navigate(`/chat/${myId}?trainerId=${encodeURIComponent(trainerId)}`);
                            }}
                            className="flex items-center gap-1.5 rounded-xl bg-[#d6b161]/10 px-4 py-2 text-sm font-semibold text-[#d6b161] hover:bg-[#d6b161]/20 transition-colors"
                        >
                            <MessageCircle className="h-4 w-4" />
                            Chat
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// ============================================================================
// ENROLLED INTERNSHIP CARD
// ============================================================================

const EnrolledInternshipCard: React.FC<{ internship: EnrolledInternship }> = ({ internship }) => (
    <motion.div
        variants={itemVariants}
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
        className="group relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 overflow-hidden transition-shadow"
    >
        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#d6b161] to-amber-400 rounded-t-2xl" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-[#d6b161] mb-2">Internship</p>
                <h3 className="text-xl font-bold text-[#0a192f] dark:text-white leading-snug">{internship.internshipTitle}</h3>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5">
                    <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                        <Briefcase className="h-3.5 w-3.5 text-[#d6b161]" />
                        <span>Mode:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{formatInternshipMode(internship.internshipMode)}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                        <span>Ref:</span>
                        <code className="font-mono text-xs font-semibold text-[#0a192f] dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{internship.referenceCode}</code>
                    </span>
                </div>
            </div>
            <button
                type="button"
                disabled
                className="shrink-0 inline-flex items-center justify-center rounded-xl bg-[#0a192f] px-5 py-2.5 text-sm font-semibold text-white opacity-60 dark:bg-[#d6b161] dark:text-[#0a192f] cursor-not-allowed"
            >
                View Certificate
            </button>
        </div>
    </motion.div>
);

const ApprovedWebinarCard: React.FC<{ webinar: ApprovedWebinar }> = ({ webinar }) => (
    <motion.div
        variants={itemVariants}
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
        className="group relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 overflow-hidden transition-shadow"
    >
        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#d6b161] to-orange-400 rounded-t-2xl" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-[#d6b161] mb-2">Approved Webinar</p>
                <h3 className="text-xl font-bold text-[#0a192f] dark:text-white leading-snug">{webinar.title}</h3>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                    <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                        <CalendarDays className="h-3.5 w-3.5 text-[#d6b161]" />
                        <span>{formatWebinarDateTime(webinar.scheduledAt)}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                        <span>Price:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{formatWebinarPrice(webinar.price, webinar.currency)}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                        <span>Ref:</span>
                        <code className="font-mono text-xs font-semibold text-[#0a192f] dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{webinar.referenceCode}</code>
                    </span>
                </div>
            </div>
            {webinar.joinLink ? (
                <a
                    href={webinar.joinLink}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0a192f] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 dark:bg-[#d6b161] dark:text-[#0a192f] transition-opacity"
                >
                    <ExternalLink className="h-4 w-4" />
                    Join Webinar
                </a>
            ) : (
                <button
                    type="button"
                    disabled
                    className="shrink-0 inline-flex items-center justify-center rounded-xl bg-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-500 dark:bg-gray-700 dark:text-gray-300 cursor-not-allowed"
                >
                    Join link pending
                </button>
            )}
        </div>
    </motion.div>
);

// ============================================================================
// PROFILE FIELD ROW
// ============================================================================

const ProfileField: React.FC<{ icon: React.ReactNode; label: string; value?: string | null }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50/80 dark:bg-gray-700/40 hover:bg-gray-100/80 dark:hover:bg-gray-700/60 transition-colors">
        <div className="mt-0.5 shrink-0 text-[#d6b161]">{icon}</div>
        <div className="min-w-0">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{value || <span className="text-gray-400 font-normal italic">Not set</span>}</p>
        </div>
    </div>
);

// ============================================================================
// SECTION HEADER
// ============================================================================

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; count?: number }> = ({ icon, title, count }) => (
    <div className="flex items-center gap-2.5 mb-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d6b161]/10">
            {icon}
        </div>
        <h2 className="text-xl font-bold tracking-tight text-[#0a192f] dark:text-white">{title}</h2>
        {count !== undefined && (
            <span className="ml-1 rounded-full bg-[#d6b161]/15 px-2.5 py-0.5 text-xs font-bold text-[#d6b161]">
                {count}
            </span>
        )}
    </div>
);

// ============================================================================
// EMPTY STATE
// ============================================================================

const EmptyState: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-14 px-6 text-center"
    >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            {icon}
        </div>
        <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">{title}</p>
        <p className="text-sm text-gray-400 max-w-xs">{description}</p>
    </motion.div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const StudentDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<any[]>([]);
    const [enrolledInternships, setEnrolledInternships] = useState<EnrolledInternship[]>([]);
    const [approvedWebinars, setApprovedWebinars] = useState<ApprovedWebinar[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [internshipsLoading, setInternshipsLoading] = useState(true);
    const [webinarsLoading, setWebinarsLoading] = useState(true);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [batchesResponse, enrolledInternshipsResponse, approvedWebinarsResponse] = await Promise.all([
                    api.get('/language-trainer/student/batches'),
                    internshipApplicationAPI.getMyEnrolled(),
                    webinarRegistrationAPI.getApprovedMine(),
                ]);
                setCourses(batchesResponse.data);
                setEnrolledInternships(enrolledInternshipsResponse.internships || []);
                setApprovedWebinars(approvedWebinarsResponse.registrations || []);
            } catch (error) {
                console.error("Failed to fetch student dashboard data", error);
            } finally {
                setCoursesLoading(false);
                setInternshipsLoading(false);
                setWebinarsLoading(false);
            }
        };
        if (user) { fetchDashboardData(); }
    }, [user]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-[#0a192f] focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-[#d6b161]">
                Skip to content
            </a>

            {/* Hero */}
            <section className="relative bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1a365d] overflow-hidden py-24 sm:py-32 text-center">
                <HeroBackground />
                <div className="relative z-10 max-w-3xl mx-auto px-4">
                    <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#d6b161]/30 bg-[#d6b161]/10 px-4 py-1.5 mb-5">
                            <Layers className="h-3.5 w-3.5 text-[#d6b161]" />
                            <span className="text-xs font-semibold uppercase tracking-widest text-[#d6b161]">Student Portal</span>
                        </div>
                        <h1 className="mb-3 text-4xl font-bold font-sans md:text-5xl text-white">Student Dashboard</h1>
                        <p className="text-lg text-gray-400">Welcome back, <span className="text-[#d6b161] font-semibold">{user?.name}</span>!</p>
                    </motion.div>
                </div>
            </section>

            <main id="main-content" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-12">

                    {/* ── Profile Sidebar ── */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="lg:col-span-4"
                    >
                        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 overflow-hidden sticky top-6">
                            {/* Profile Header */}
                            <div className="relative bg-gradient-to-br from-[#0a192f] to-[#112240] px-6 pt-8 pb-10">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
                                <div className="relative flex flex-col items-center text-center">
                                    <div className="h-24 w-24 rounded-full border-4 border-[#d6b161]/40 overflow-hidden bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161] font-bold text-3xl mb-4 shadow-lg">
                                        {user?.avatar
                                            ? <img src={getAssetUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
                                            : user?.name?.charAt(0).toUpperCase() || 'U'
                                        }
                                    </div>
                                    <h3 className="text-lg font-bold text-white">{user?.name}</h3>
                                    <span className="mt-1 inline-block rounded-full bg-[#d6b161]/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-[#d6b161]">
                                        {user?.role}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex border-b border-gray-100 dark:border-gray-700 divide-x divide-gray-100 dark:divide-gray-700">
                                <Button
                                    onClick={() => setIsProfileModalOpen(true)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-[#d6b161] dark:hover:text-[#d6b161] hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    title="Edit Profile"
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit Profile
                                </Button>
                                <button
                                    onClick={() => { logout(); navigate('/login'); }}
                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Logout"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </button>
                            </div>

                            {/* Profile Fields */}
                            <div className="p-5 space-y-2">
                                <ProfileField icon={<User className="h-4 w-4" />} label="Full Name" value={user?.name} />
                                <ProfileField icon={<Mail className="h-4 w-4" />} label="Email Address" value={user?.email} />
                                <ProfileField icon={<Phone className="h-4 w-4" />} label="Phone" value={user?.phoneNumber} />
                                <ProfileField icon={<CalendarDays className="h-4 w-4" />} label="Date of Birth" value={user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : null} />
                                <ProfileField icon={<GraduationCap className="h-4 w-4" />} label="Qualification" value={user?.qualification} />

                                {(user?.guardianName || user?.guardianPhone) && (
                                    <div className="pt-2">
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">Guardian Info</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="rounded-xl bg-gray-50/80 dark:bg-gray-700/40 p-3">
                                                <p className="text-xs text-gray-400 mb-0.5">Name</p>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.guardianName || '—'}</p>
                                            </div>
                                            <div className="rounded-xl bg-gray-50/80 dark:bg-gray-700/40 p-3">
                                                <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.guardianPhone || '—'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Main Content ── */}
                    <div className="lg:col-span-8 space-y-10">

                        {/* Enrolled Internships */}
                        <AnimatePresence>
                            {!internshipsLoading && enrolledInternships.length > 0 && (
                                <motion.section
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <SectionHeader
                                        icon={<Briefcase className="h-4 w-4 text-[#d6b161]" />}
                                        title="Enrolled Internships"
                                        count={enrolledInternships.length}
                                    />
                                    <motion.div
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className="space-y-4"
                                    >
                                        {enrolledInternships.map((internship) => (
                                            <EnrolledInternshipCard key={internship._id} internship={internship} />
                                        ))}
                                    </motion.div>
                                </motion.section>
                            )}
                        </AnimatePresence>

                        {/* Approved Webinars */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08, duration: 0.5 }}
                        >
                            <SectionHeader
                                icon={<Video className="h-4 w-4 text-[#d6b161]" />}
                                title="Approved Webinars"
                                count={!webinarsLoading ? approvedWebinars.length : undefined}
                            />
                            {webinarsLoading ? (
                                <div className="grid gap-5">
                                    <SkeletonCourseCard />
                                </div>
                            ) : approvedWebinars.length > 0 ? (
                                <motion.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="space-y-4"
                                >
                                    {approvedWebinars.map((webinar) => (
                                        <ApprovedWebinarCard key={webinar._id} webinar={webinar} />
                                    ))}
                                </motion.div>
                            ) : (
                                <EmptyState
                                    icon={<Video className="h-6 w-6 text-gray-400" />}
                                    title="No approved webinars yet"
                                    description="Once your webinar payment is reviewed and accepted by admin, it will appear here with the join link."
                                />
                            )}
                        </motion.section>

                        {/* Enrolled Courses */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.5 }}
                        >
                            <SectionHeader
                                icon={<BookOpen className="h-4 w-4 text-[#d6b161]" />}
                                title="Enrolled Courses"
                                count={!coursesLoading ? courses.length : undefined}
                            />
                            {coursesLoading ? (
                                <div className="grid gap-5 sm:grid-cols-1 lg:grid-cols-2">
                                    {Array.from({ length: 2 }).map((_, i) => <SkeletonCourseCard key={i} />)}
                                </div>
                            ) : courses.length > 0 ? (
                                <motion.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="grid gap-5 sm:grid-cols-1 lg:grid-cols-2"
                                >
                                    {courses.map((course) => (
                                        <CourseCard key={course._id} course={course} />
                                    ))}
                                </motion.div>
                            ) : (
                                <EmptyState
                                    icon={<BookOpen className="h-6 w-6 text-gray-400" />}
                                    title="No courses enrolled yet"
                                    description="Once you're enrolled in a course, it will appear here with all your learning materials."
                                />
                            )}
                        </motion.section>
                    </div>
                </div>
            </main>

            <ProfileCompletionModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
            <Footer />
        </div>
    );
};

export default StudentDashboard;
