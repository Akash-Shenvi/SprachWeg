// Generated page — SkillTrainingOverviewPage.tsx — follow CourseGermanPage.tsx & LanguageTraining.tsx UI/UX, animations, and color tokens.
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform, useMotionValue, useSpring, useInView, useAnimation } from 'framer-motion';
import {
    ArrowRight,
    Zap,
    Cpu,
    Gauge,
    Factory,
    Settings,
    Clock,
    BookOpen,
    Award
} from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { skillAPI } from '../../lib/api';
import { formatTrainingPrice } from '../../lib/trainingPricing';

// Brand tokens: Navy #0a192f, Gold #d6b161

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay: custom * 0.1, ease: [0.22, 1, 0.36, 1] as const }
    })
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
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

// Animated section wrapper
const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });
    const controls = useAnimation();

    useEffect(() => {
        if (isInView) {
            controls.start('visible');
        }
    }, [isInView, controls]);

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={controls}
            variants={staggerContainer}
            className={className}
        >
            {children}
        </motion.div>
    );
};

// Course data
const courses = [
    {
        id: 'scada',
        title: 'SCADA & HMI Training',
        excerpt: 'Master supervisory control and data acquisition for modern industrial systems',
        duration: '40 hours',
        mode: 'Live/Hybrid',
        fees: '₹7,200+',
        icon: Zap,
        route: '/skill-training/scada',
        image: 'https://sovirtechnologies.in/api/uploads/tariningwebsite/landing/plc.png',
        bgColor: 'bg-white dark:bg-blue-950/30',
        borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
        id: 'plc',
        title: 'PLC Programming & Industrial Automation',
        excerpt: 'Learn programmable logic controllers and complete industrial automation systems',
        duration: '56 hours',
        mode: 'Live/Hybrid',
        fees: '₹9,200+',
        icon: Cpu,
        route: '/skill-training/plc',
        image: 'https://sovirtechnologies.in/api/uploads/tariningwebsite/landing/plc.png',
        bgColor: 'bg-white dark:bg-purple-950/30',
        borderColor: 'border-purple-200 dark:border-purple-800'
    },
    {
        id: 'drives',
        title: 'Industrial Drives & Motion Control',
        excerpt: 'Expert training in VFDs, servo systems, and advanced motion control',
        duration: '45 hours',
        mode: 'Live/Hybrid',
        fees: '₹10,200+',
        icon: Gauge,
        route: '/skill-training/drives',
        image: 'https://sovirtechnologies.in/api/uploads/tariningwebsite/landing/industrial.png',
        bgColor: 'bg-white dark:bg-green-950/30',
        borderColor: 'border-green-200 dark:border-green-800'
    },
    {
        id: 'industry4',
        title: 'Advanced Automation Industry 4.0',
        excerpt: 'Cutting-edge training in smart factories, IIoT, and Industry 4.0 technologies',
        duration: '50 hours',
        mode: 'Live/Hybrid',
        fees: '₹28,000',
        icon: Factory,
        route: '/skill-training/industry4',
        image: 'https://sovirtechnologies.in/api/uploads/tariningwebsite/landing/advancedautomation.png',
        bgColor: 'bg-white dark:bg-orange-950/30',
        borderColor: 'border-orange-200 dark:border-orange-800'
    },
    {
        id: 'corporate',
        title: 'Customized Corporate Training',
        excerpt: 'Tailored automation training programs designed for your organization',
        duration: 'Flexible',
        mode: 'Custom',
        fees: '₹28,000',
        icon: Settings,
        route: '/skill-training/corporate',
        image: 'https://sovirtechnologies.in/api/uploads/tariningwebsite/landing/customizedcorporate.png',
        bgColor: 'bg-white dark:bg-pink-950/30',
        borderColor: 'border-pink-200 dark:border-pink-800'
    }
];

const matchesSkillOverviewCard = (card: typeof courses[number], title?: string) => {
    const normalizedTitle = String(title || '').trim().toLowerCase();

    if (card.route === '/skill-training/scada') {
        return normalizedTitle.includes('scada');
    }

    if (card.route === '/skill-training/plc') {
        return normalizedTitle.includes('plc');
    }

    if (card.route === '/skill-training/drives') {
        return normalizedTitle.includes('drives') || normalizedTitle.includes('motion');
    }

    if (card.route === '/skill-training/industry4') {
        return normalizedTitle.includes('industry 4') || normalizedTitle.includes('automation');
    }

    if (card.route === '/skill-training/corporate') {
        return normalizedTitle.includes('corporate');
    }

    return false;
};

// 3D Card Component with tilt effect
interface CourseCardProps {
    course: typeof courses[0];
    index: number;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
    const shouldReduceMotion = useReducedMotion();
    const cardRef = useRef<HTMLDivElement>(null);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7, -7]), { stiffness: 300, damping: 30 });
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7, 7]), { stiffness: 300, damping: 30 });

    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (shouldReduceMotion || !cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = (e.clientX - centerX) / (rect.width / 2);
        const deltaY = (e.clientY - centerY) / (rect.height / 2);

        mouseX.set(deltaX);
        mouseY.set(deltaY);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        mouseX.set(0);
        mouseY.set(0);
    };

    const Icon = course.icon;

    return (
        <motion.div
            ref={cardRef}
            variants={fadeInUp}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            whileHover={{ scale: shouldReduceMotion ? 1 : 1.03 }}
            whileTap={{ scale: 0.98 }}
            style={{
                rotateX: shouldReduceMotion ? 0 : rotateX,
                rotateY: shouldReduceMotion ? 0 : rotateY,
                transformStyle: 'preserve-3d'
            }}
            className={`relative rounded-2xl border-2 ${course.borderColor} ${course.bgColor} shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden group cursor-pointer`}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    window.location.href = course.route;
                }
            }}
            role="article"
            aria-label={`${course.title} course card`}
        >
            {/* Grain overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay pointer-events-none z-10"></div>

            {/* Gradient overlay - fixed for light mode visibility */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent dark:from-white/5 pointer-events-none z-10" />

            {/* Image Area */}
            <div className="h-48 relative overflow-hidden bg-gray-200 dark:bg-gray-800">
                <img
                    src={course.image}
                    alt={`${course.title} training program`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {/* Animated badge with 3D depth */}
                <motion.div
                    style={{
                        translateZ: shouldReduceMotion ? 0 : isHovered ? 30 : 0
                    }}
                    className="absolute top-4 right-4 p-3 rounded-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-lg"
                >
                    <Icon className="w-6 h-6 text-[#d6b161]" />
                </motion.div>
            </div>

            {/* Content */}
            <div className="relative z-20 p-6">
                {/* Title */}
                <h3 className="text-xl font-sans font-bold text-center text-gray-900 dark:text-white mb-3 leading-tight">
                    {course.title}
                </h3>

                {/* Excerpt */}
                <p className="text-sm text-gray-700 dark:text-gray-400 text-center mb-4 leading-relaxed">
                    {course.excerpt}
                </p>

                {/* Micro badges */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                    <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 shadow-sm flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                        {course.duration}
                    </span>
                    <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 shadow-sm flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                        {course.mode}
                    </span>
                    <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 shadow-sm flex items-center gap-1">
                        <Award className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                        {course.fees}
                    </span>
                </div>

                {/* CTA */}
                <div className="flex justify-center">
                    <Link to={course.route}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-6 py-3 bg-[#0a192f] dark:bg-[#d6b161] text-white dark:text-[#0a192f] rounded-lg font-semibold text-sm hover:bg-[#112240] dark:hover:bg-[#c4a055] transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#d6b161] focus:ring-offset-2"
                            aria-label={`Explore ${course.title}`}
                        >
                            Explore
                            <ArrowRight className="w-4 h-4" />
                        </motion.button>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

// Main Component
const SkillTrainingOverviewPage: React.FC = () => {
    const [courseCards, setCourseCards] = useState(courses);

    useEffect(() => {
        const syncSkillTrainingPrices = async () => {
            try {
                const apiCourses = await skillAPI.getAll();

                setCourseCards((currentCards) =>
                    currentCards.map((card) => {
                        const matchedCourse = apiCourses.find((course: any) => matchesSkillOverviewCard(card, course?.title));

                        if (!matchedCourse?.price) {
                            return card;
                        }

                        return {
                            ...card,
                            fees: formatTrainingPrice(matchedCourse.price),
                        };
                    })
                );
            } catch (error) {
                console.error('Failed to sync skill training prices:', error);
            }
        };

        syncSkillTrainingPrices();
    }, []);

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
            {/* Skip to content link */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-6 focus:left-6 focus:z-50 focus:rounded-lg focus:bg-white focus:px-6 focus:py-3 focus:font-bold focus:text-[#0a192f] focus:shadow-2xl focus:ring-2 focus:ring-[#d6b161]"
            >
                Skip to content
            </a>

            <Header />

            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1a365d] overflow-hidden py-28 sm:py-36 text-center">
                <HeroBackground />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimatedSection className="flex flex-col items-center text-center">
                        <motion.h1
                            variants={fadeInUp}
                            className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold text-white mb-6 leading-tight"
                        >
                            Industrial Automation{' '}
                            <span className="text-[#d6b161] relative">
                                Skill Training
                                <motion.span
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 0.8, duration: 0.6 }}
                                    className="absolute -bottom-2 left-0 w-full h-1 bg-[#d6b161]/50 rounded-full origin-left"
                                />
                            </span>
                        </motion.h1>

                        <motion.p
                            variants={fadeInUp}
                            custom={1}
                            className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-12"
                        >
                            Master cutting-edge automation technologies with hands-on training from industry experts. Choose from PLC, SCADA, drives, Industry 4.0, and customized corporate programs.
                        </motion.p>
                    </AnimatedSection>
                </div>
            </section>

            {/* Courses Section */}
            <main id="main-content" className="py-20 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimatedSection className="flex flex-col items-center text-center mb-16">
                        <motion.h2
                            variants={fadeInUp}
                            className="text-3xl md:text-4xl lg:text-5xl font-sans font-bold text-gray-900 dark:text-white mb-4"
                        >
                            Explore Our Training Programs
                        </motion.h2>
                        <motion.p
                            variants={fadeInUp}
                            custom={1}
                            className="text-lg text-gray-700 dark:text-gray-400 max-w-2xl mx-auto"
                        >
                            Industry-recognized certifications and hands-on experience in industrial automation
                        </motion.p>
                    </AnimatedSection>

                    <AnimatedSection className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {courseCards.map((course, index) => (
                            <CourseCard key={course.id} course={course} index={index} />
                        ))}
                    </AnimatedSection>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default SkillTrainingOverviewPage;
