import React, { } from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen, Video, TrendingUp, Award, User, Settings,
    Home, Calendar, Clock, ChevronRight, Play, CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/layout';

// --- Types & Interfaces ---

interface Course {
    id: string;
    title: string;
    progress: number;
    lastWatched: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    thumbnail: string;
    totalLessons: number;
    completedLessons: number;
}

interface LiveClass {
    id: string;
    title: string;
    startsAt: string;
    instructor: string;
    status: 'upcoming' | 'live' | 'ended';
}

interface WeekGroup {
    id: string;
    title: string;
    isCompleted: boolean;
    lessons: { id: string; title: string; duration: string; isCompleted: boolean }[];
}

// --- Framer Motion Variants ---

const variants = {
    pageEntry: {
        initial: { opacity: 0, y: 12 },
        enter: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] as const } },
        exit: { opacity: 0, y: 8, transition: { duration: 0.18 } }
    },
    cardHover: {
        rest: { scale: 1, y: 0 },
        hover: { scale: 1.02, y: -4, transition: { duration: 0.18, ease: [0.2, 0, 0, 1] as const } },
        tap: { scale: 0.98, transition: { duration: 0.1 } }
    },
    drawerOpen: {
        closed: { x: "100%", opacity: 0, transition: { duration: 0.2 } },
        open: { x: 0, opacity: 1, transition: { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] as const } }
    },
    pulseLive: {
        pulse: { scale: [1, 1.2, 1], opacity: [1, 0.5, 1], transition: { repeat: Infinity, duration: 2 } }
    }
};

// --- Mock Data ---

const MOCK_COURSES: Course[] = [
    {
        id: 'c1',
        title: 'German A1: Absolute Beginner',
        progress: 45,
        lastWatched: '2h ago',
        difficulty: 'Beginner',
        thumbnail: '🇩🇪',
        totalLessons: 24,
        completedLessons: 11
    },
    {
        id: 'c2',
        title: 'Business German Communication',
        progress: 12,
        lastWatched: '1d ago',
        difficulty: 'Intermediate',
        thumbnail: '💼',
        totalLessons: 18,
        completedLessons: 2
    },
    {
        id: 'c3',
        title: 'Japanese N5 Prep',
        progress: 0,
        lastWatched: 'Never',
        difficulty: 'Beginner',
        thumbnail: '🇯🇵',
        totalLessons: 30,
        completedLessons: 0
    }
];

const MOCK_LIVE_CLASS: LiveClass = {
    id: 'l1',
    title: 'German Pronunciation Masterclass',
    startsAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(), // Starts in 15 mins
    instructor: 'Dr. Schmidt',
    status: 'upcoming'
};

const MOCK_TIMELINE: WeekGroup[] = [
    {
        id: 'w1',
        title: 'Week 1: Foundations',
        isCompleted: true,
        lessons: [
            { id: 'l1', title: 'Alphabet & Phonetics', duration: '12m', isCompleted: true },
            { id: 'l2', title: 'Basic Greetings', duration: '15m', isCompleted: true }
        ]
    },
    {
        id: 'w2',
        title: 'Week 2: Grammar Basics',
        isCompleted: false,
        lessons: [
            { id: 'l3', title: 'Articles (Der, Die, Das)', duration: '20m', isCompleted: false },
            { id: 'l4', title: 'Sentence Structure', duration: '18m', isCompleted: false }
        ]
    }
];

// --- Components ---

const HeroCard: React.FC<{ user: any }> = ({ user }) => (
    <motion.div
        variants={variants.pageEntry}
        initial="initial"
        animate="enter"
        className="col-span-12 rounded-3xl p-8 bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-xl relative overflow-hidden"
    >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Student'}! 👋</h1>
                <p className="text-orange-50 opacity-90 text-lg max-w-xl">
                    You're on a 5-day streak! Keep it up to reach your weekly goal of 10 hours.
                </p>
                <div className="mt-6 flex gap-4">
                    <button className="bg-white text-orange-600 px-6 py-3 rounded-xl font-bold hover:bg-orange-50 transition-colors shadow-sm flex items-center gap-2">
                        <Play className="w-5 h-5 fill-current" /> Resume Learning
                    </button>
                    <button className="bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors">
                        View Schedule
                    </button>
                </div>
            </div>

            {/* Circular Progress Widget */}
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <div className="relative w-20 h-20">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/20" />
                        <motion.circle
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 0.65 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            cx="40" cy="40" r="32"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeLinecap="round"
                            className="text-white"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">65%</div>
                </div>
                <div>
                    <div className="text-2xl font-bold">6.5h</div>
                    <div className="text-sm opacity-80">Weekly Goal</div>
                </div>
            </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2" />
    </motion.div>
);

const CourseCard: React.FC<{ course: Course }> = ({ course }) => (
    <motion.div
        variants={variants.cardHover}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        className="min-w-[280px] bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer group"
    >
        <div className="aspect-video bg-gray-100 dark:bg-gray-900 rounded-xl mb-4 flex items-center justify-center text-4xl shadow-inner relative overflow-hidden">
            <span className="z-10">{course.thumbnail}</span>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-white text-xs font-semibold flex items-center gap-1">
                    <Play className="w-3 h-3 fill-current" /> Resume
                </span>
            </div>
        </div>

        <div className="flex justify-between items-start mb-2">
            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${course.difficulty === 'Beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                course.difficulty === 'Intermediate' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                }`}>
                {course.difficulty}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {course.lastWatched}
            </span>
        </div>

        <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{course.title}</h3>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {course.completedLessons} / {course.totalLessons} Lessons
        </div>

        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${course.progress}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full bg-orange-500 rounded-full"
            />
        </div>
    </motion.div>
);

const LiveClassWidget: React.FC<{ liveClass: LiveClass }> = ({ liveClass }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-orange-500" /> Live Class
            </h3>
            {liveClass.status === 'live' ? (
                <span className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold animate-pulse">
                    <span className="w-2 h-2 bg-red-600 rounded-full" /> LIVE NOW
                </span>
            ) : (
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                    Upcoming
                </span>
            )}
        </div>

        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{liveClass.title}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2">
            <User className="w-4 h-4" /> {liveClass.instructor} • Starts in 15m
        </p>

        <button className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            Join Waitlist
        </button>
    </div>
);

const TimelineWidget: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white">This Week</h3>
            <button className="text-xs text-orange-600 font-semibold hover:underline">View All</button>
        </div>

        <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:h-full before:w-0.5 before:bg-gray-100 dark:before:bg-gray-700">
            {MOCK_TIMELINE.map((week) => (
                <div key={week.id} className="relative pl-10">
                    <div className={`absolute left-0 top-1 w-7 h-7 rounded-full border-2 flex items-center justify-center bg-white dark:bg-gray-800 z-10 ${week.isCompleted ? 'border-green-500 text-green-500' : 'border-gray-300 dark:border-gray-600 text-gray-400'
                        }`}>
                        {week.isCompleted ? <CheckCircle className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                    </div>

                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{week.title}</h4>

                    <div className="space-y-2">
                        {week.lessons.map(lesson => (
                            <div key={lesson.id} className="group flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${lesson.isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    <span className={`text-sm ${lesson.isCompleted ? 'text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {lesson.title}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-400">{lesson.duration}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const UserStats: React.FC = () => (
    <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 mb-3">
                <TrendingUp className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">12</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Day Streak</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-2xl">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 mb-3">
                <Award className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">4</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Certificates</div>
        </div>
    </div>
);

// --- Main Page Component ---

const DashboardPage: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
            <Header />

            <div className="max-w-[1400px] mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-12 gap-8">

                    {/* LEFT SIDE NAVIGATION (Desktop Sticky) */}
                    <div className="hidden lg:block col-span-2 relative">
                        <div className="sticky top-24 space-y-2">
                            {[
                                { icon: Home, label: 'Overview', active: true },
                                { icon: BookOpen, label: 'My Courses' },
                                { icon: Calendar, label: 'Schedule' },
                                { icon: Award, label: 'Achievements' },
                                { icon: Settings, label: 'Settings' }
                            ].map((item, i) => (
                                <button
                                    key={i}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.active
                                        ? 'bg-white dark:bg-gray-800 text-orange-600 shadow-sm font-semibold'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </button>
                            ))}

                            <div className="pt-8 mt-8 border-t border-gray-200 dark:border-gray-800">
                                <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Support</p>
                                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    Help Center
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* MAIN CONTENT AREA */}
                    <div className="col-span-12 lg:col-span-7 space-y-8">
                        {/* 1. Hero Section */}
                        <HeroCard user={user} />

                        {/* 2. Continued Learning Carousel */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">Continue Learning</h2>
                                <div className="flex gap-2">
                                    <button className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-colors">
                                        <ChevronRight className="w-5 h-5 rotate-180" />
                                    </button>
                                    <button className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x">
                                {MOCK_COURSES.map(course => (
                                    <div key={course.id} className="snap-start">
                                        <CourseCard course={course} />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 3. Learning Path Timeline (Mobile/Tablet Only usually but shown here for layout) */}
                        <section className="lg:hidden">
                            <h2 className="text-xl font-bold mb-4">Your Path</h2>
                            <TimelineWidget />
                        </section>
                    </div>

                    {/* RIGHT SIDEBAR (Sticky) */}
                    <div className="col-span-12 lg:col-span-3 space-y-6">
                        {/* Live Class Widget */}
                        <LiveClassWidget liveClass={MOCK_LIVE_CLASS} />

                        {/* Quick Stats */}
                        <UserStats />

                        {/* Timeline (Desktop) */}
                        <div className="hidden lg:block">
                            <TimelineWidget />
                        </div>

                        {/* Banner Ad / Upsell */}
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-6 text-center">
                            <h3 className="font-bold mb-2">Unlock Career Pro</h3>
                            <p className="text-sm text-gray-400 mb-4">Get unlimited access to certification exams and 1-on-1 mentorship.</p>
                            <button className="text-sm font-bold text-white border border-white/20 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
                                View Plans
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
