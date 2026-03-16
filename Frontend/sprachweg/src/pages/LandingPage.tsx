import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
    CheckCircle,
    Star,
    Globe,
    Play,
    GraduationCap,
    ArrowRight,
    Users,
    BookOpen
} from 'lucide-react';
import Button from '../components/ui/Button';
import { Header, Footer } from '../components/layout';
import UnifiedBookingForm from '../components/ui/UnifiedBookingForm';

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.0, 0.0, 0.2, 1] as const } }
};

// Star Rating Component
const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-4 h-4 ${star <= Math.floor(rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : star <= rating
                            ? 'fill-yellow-400/50 text-yellow-400'
                            : 'fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600'
                        }`}
                />
            ))}
        </div>
    );
};


// 3D Rotating Image Stack Component
const RotatingImageStack: React.FC = () => {
    const shouldReduceMotion = useReducedMotion();
    const stackRef = useRef<HTMLDivElement>(null);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), { stiffness: 300, damping: 30 });
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), { stiffness: 300, damping: 30 });

    const stackImages = [
        {
            url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80",
            title: "Industrial Automation Training",
            caption: "Master PLC, SCADA, and Modern Control Systems"
        },
        {
            url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80",
            title: "Hands-On Learning",
            caption: "Real-world Projects and Lab Experience"
        },
        {
            url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80",
            title: "Industry 4.0 Ready",
            caption: "Smart Manufacturing and IIoT Technologies"
        },
        {
            url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80",
            title: "Expert Instructors",
            caption: "Learn from Industry Professionals"
        }
    ];

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (shouldReduceMotion || !stackRef.current || e.pointerType === 'touch') return;

        const rect = stackRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = (e.clientX - centerX) / (rect.width / 2);
        const deltaY = (e.clientY - centerY) / (rect.height / 2);

        requestAnimationFrame(() => {
            mouseX.set(deltaX);
            mouseY.set(deltaY);
        });
    };

    const handlePointerLeave = () => {
        requestAnimationFrame(() => {
            mouseX.set(0);
            mouseY.set(0);
        });
    };

    const handleCardClick = (index: number) => {
        setExpandedIndex(index);
    };

    const handleCloseModal = () => {
        setExpandedIndex(null);
    };

    useEffect(() => {
        if (expandedIndex !== null) {
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    handleCloseModal();
                }
            };
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [expandedIndex]);

    return (
        <>
            <motion.div
                ref={stackRef}
                className="relative w-full h-full"
                style={{
                    transformStyle: 'preserve-3d',
                    perspective: '1000px'
                }}
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
            >
                <motion.div
                    style={{
                        rotateX: shouldReduceMotion ? 0 : rotateX,
                        rotateY: shouldReduceMotion ? 0 : rotateY,
                        transformStyle: 'preserve-3d',
                        willChange: 'transform'
                    }}
                    animate={{
                        rotateY: shouldReduceMotion ? 0 : [0, 5, -5, 0]
                    }}
                    transition={{
                        rotateY: {
                            duration: 30,
                            repeat: Infinity,
                            ease: "linear"
                        }
                    }}
                    className="relative w-full h-full"
                >
                    {stackImages.map((image, index) => (
                        <motion.div
                            key={index}
                            className="absolute inset-0 rounded-[2rem] overflow-hidden border-8 border-white dark:border-white/5 shadow-2xl cursor-pointer group"
                            style={{
                                translateZ: `${index * 15}px`,
                                zIndex: stackImages.length - index,
                                transformStyle: 'preserve-3d',
                                willChange: 'transform'
                            }}
                            whileHover={{ scale: shouldReduceMotion ? 1 : 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleCardClick(index)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCardClick(index);
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label={`View ${image.title}`}
                        >
                            {/* LQIP blur placeholder */}
                            <div
                                className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800"
                                style={{
                                    backgroundImage: `url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Cfilter id="b"%3E%3CfeGaussianBlur stdDeviation="12" /%3E%3C/filter%3E%3Cimage filter="url(%23b)" x="0" y="0" height="100%25" width="100%25" href="${image.url}" /%3E%3C/svg%3E')`,
                                    backgroundSize: 'cover'
                                }}
                            />

                            <img
                                src={image.url}
                                alt={image.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />

                            {/* Rim light effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Grain overlay */}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" aria-hidden="true" />

                            {/* Hover overlay with title */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-8">
                                <div className="text-white">
                                    <h3 className="text-2xl font-bold mb-2">{image.title}</h3>
                                    <p className="text-sm text-gray-200">{image.caption}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>

            {/* Expanded Modal */}
            {expandedIndex !== null && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={handleCloseModal}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    <motion.div
                        initial={{ scale: 0.8, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.8, y: 50 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative max-w-4xl w-full bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b161]"
                            aria-label="Close modal"
                        >
                            ✕
                        </button>

                        <img
                            src={stackImages[expandedIndex].url}
                            alt={stackImages[expandedIndex].title}
                            className="w-full h-auto max-h-[70vh] object-contain"
                        />

                        <div className="p-8 bg-white dark:bg-gray-800">
                            <h2 id="modal-title" className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                {stackImages[expandedIndex].title}
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300">
                                {stackImages[expandedIndex].caption}
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </>
    );
};

// Skill Course Type (static)
interface SkillCourseStatic {
    _id: string;
    title: string;
    students: string;
    courses: number;
    reviews: string;
    levels: string[];
    price: string;
    image: string;
    rating: number;
    link: string;
    bgColor: string;
    borderColor: string;
}

// Enhanced Skill Card matching LanguageTraining design
interface SkillCardProps {
    course: SkillCourseStatic;
}

const SkillCard: React.FC<SkillCardProps> = ({ course }) => {
    return (
        <motion.div
            variants={fadeInUp}
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            className={`relative rounded-2xl border-2 ${course.borderColor} ${course.bgColor} shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-default`}
        >
            {/* Image Area */}
            <div className="h-48 relative overflow-hidden bg-gray-200 dark:bg-gray-800 z-20">
                <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                />
            </div>

            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 pointer-events-none" />

            {/* Content wrapper with z-index */}
            <div className="relative z-10 p-6">
                {/* Title */}
                <h3 className="text-xl font-sans font-bold text-center text-[#0a192f] dark:text-white mb-5 line-clamp-2 min-h-[3.5rem] flex items-center justify-center">
                    {course.title}
                </h3>

                {/* Stats Row */}
                <div className="flex items-center justify-center gap-6 text-sm text-gray-700 dark:text-gray-300 mb-4">
                    <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#0a192f] dark:text-gray-400" />
                        <span className="font-medium">{course.students} students</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[#0a192f] dark:text-gray-400" />
                        <span className="font-medium">{course.courses} modules</span>
                    </div>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-center gap-2 mb-5">
                    <StarRating rating={course.rating} />
                    <span className="text-sm font-semibold text-[#0a192f] dark:text-white">{course.rating}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">({course.reviews} reviews)</span>
                </div>

                {/* Level Tags */}
                <div className="flex flex-wrap justify-center gap-2 mb-3">
                    {course.levels.map((level) => (
                        <span
                            key={level}
                            className="px-3 py-1.5 text-xs font-semibold rounded-full bg-white dark:bg-gray-800 text-[#0a192f] dark:text-gray-200 border border-gray-300 dark:border-gray-600 shadow-sm"
                        >
                            {level}
                        </span>
                    ))}
                </div>

                {/* Price and CTA */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-300 dark:border-gray-600">
                    <div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Starting at</span>
                        <span className="text-2xl font-bold text-[#0a192f] dark:text-white">₹{Number(course.price).toLocaleString('en-IN')}</span>
                    </div>
                    <Link to={course.link}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#0a192f] dark:bg-[#d6b161] text-white dark:text-[#0a192f] rounded-lg font-semibold text-sm hover:bg-[#112240] dark:hover:bg-[#c4a055] transition-colors shadow-md hover:shadow-lg"
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

const LandingPage: React.FC = () => {
    const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);

    // Static skill courses with premium images
    const skillCourses: SkillCourseStatic[] = [
        {
            _id: '1',
            title: 'SCADA & HMI Training',
            students: '1,200+',
            courses: 12,
            reviews: '450',
            levels: ['40 Hours', 'Live/Hybrid'],
            price: '7200',
            image: 'https://sovirtechnologies.in/api/uploads/tariningwebsite/landing/scada.png',
            rating: 4.8,
            link: '/skill-training/scada',
            bgColor: 'bg-blue-50 dark:bg-blue-950/30',
            borderColor: 'border-blue-200 dark:border-blue-800'
        },
        {
            _id: '2',
            title: 'PLC Programming & Industrial Automation',
            students: '2,500+',
            courses: 18,
            reviews: '890',
            levels: ['56 Hours', 'Live/Hybrid'],
            price: '9200',
            image: 'https://sovirtechnologies.in/api/uploads/tariningwebsite/landing/plc.png',
            rating: 4.9,
            link: '/skill-training/plc',
            bgColor: 'bg-purple-50 dark:bg-purple-950/30',
            borderColor: 'border-purple-200 dark:border-purple-800'
        },
        {
            _id: '3',
            title: 'Industrial Drives & Motion Control',
            students: '900+',
            courses: 8,
            reviews: '210',
            levels: ['45 Hours', 'Live/Hybrid'],
            price: '10200',
            image: 'https://sovirtechnologies.in/api/uploads/tariningwebsite/landing/industrial.png',
            rating: 4.7,
            link: '/skill-training/drives',
            bgColor: 'bg-green-50 dark:bg-green-950/30',
            borderColor: 'border-green-200 dark:border-green-800'
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a192f] transition-colors duration-300 font-sans">
            {/* Skip to content */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-6 focus:left-6 focus:z-50 focus:rounded-lg focus:bg-white focus:px-6 focus:py-3 focus:font-bold focus:text-[#0a192f] focus:shadow-2xl focus:ring-2 focus:ring-[#d6b161]"
            >
                Skip to content
            </a>

            {/* Header */}
            <Header />

            {/* Hero Section */}
            <section className="relative pt-28 pb-24 lg:pt-40 lg:pb-36 overflow-hidden">
                {/* Subtle radial gradient background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(214,177,97,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(214,177,97,0.08),transparent)]" aria-hidden="true" />

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.0, 0.0, 0.2, 1] }}
                        className="flex flex-col items-center text-center"
                    >
                        <div className="inline-block px-4 py-2 bg-[#d6b161]/10 rounded-full mb-8 border border-[#d6b161]/20">
                            <span className="text-[#d6b161] font-medium text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#d6b161]"></span>
                                New: Summer 2026 Batches Now Open
                            </span>
                        </div>

                        <h1 className="font-sans text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-6">
                            SoVir Skilling & <br className="hidden sm:block" />
                            <span>Training Center</span>
                        </h1>

                        <p className="text-lg sm:text-xl font-semibold text-gray-600 dark:text-gray-300 mb-4 max-w-2xl">
                            A Training & Career Services Division of SoVir Technologies LLP
                        </p>

                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-12 leading-relaxed max-w-2xl">
                            A professional training academy empowering individuals with industry-ready skills and global career opportunities through specialized skill development and abroad placement support.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
                            <Link to="/skill-training">
                                <Button
                                    className="bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] font-semibold px-8 py-6 text-lg rounded-full w-full sm:w-auto flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#d6b161] transition-all duration-300 hover:shadow-lg hover:shadow-[#d6b161]/25"
                                >
                                    Start Learning
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                </Button>
                            </Link>
                            <Button
                                onClick={() => setIsBookingFormOpen(true)}
                                variant="outline"
                                className="border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 px-8 py-6 text-lg rounded-full w-full sm:w-auto flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#d6b161] transition-all duration-300 hover:shadow-lg"
                            >
                                <Play className="w-5 h-5" />
                                Book Free Consultation
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>


            {/* About Us Section */}
            <section id="about" className="py-24 bg-white dark:bg-[#0a192f]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <span className="text-[#d6b161] font-semibold text-sm tracking-widest uppercase">About Us</span>
                        <h2 className="font-sans text-4xl lg:text-5xl font-medium text-gray-900 dark:text-white mt-4 mb-6">
                            Empowering Careers Through Excellence
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                            Part of SoVir Technologies LLP's commitment to professional development and global opportunities
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 mb-16">
                        {/* About SoVir Technologies LLP */}
                        <div className="bg-gray-50 dark:bg-[#112240] rounded-[2rem] p-10 border border-gray-100 dark:border-white/5">
                            <div className="w-14 h-14 rounded-xl bg-[#d6b161]/10 flex items-center justify-center mb-6">
                                <Globe className="w-7 h-7 text-[#d6b161]" />
                            </div>
                            <h3 className="font-sans text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                About SoVir Technologies LLP
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                                SoVir Technologies LLP is a professional services organization focused on technology, training, and workforce development. With a strong commitment to quality and innovation, the company supports individuals and industries through specialized skill-building solutions.
                            </p>
                            <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <CheckCircle className="w-5 h-5 text-[#d6b161] flex-shrink-0 mt-0.5" />
                                <span>Professional technology and training services</span>
                            </div>
                        </div>

                        {/* About SoVir Skilling & Training Center */}
                        <div className="bg-gray-50 dark:bg-[#112240] rounded-[2rem] p-10 border border-gray-100 dark:border-white/5">
                            <div className="w-14 h-14 rounded-xl bg-[#d6b161]/10 flex items-center justify-center mb-6">
                                <GraduationCap className="w-7 h-7 text-[#d6b161]" />
                            </div>
                            <h3 className="font-sans text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                About SoVir Skilling & Training Center
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                                SoVir Skilling & Training Center is the training and education wing of SoVir Technologies LLP. Our academy is built to deliver practical learning, certification-oriented training, and career-focused guidance for students, working professionals, and international aspirants.
                            </p>
                            <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <CheckCircle className="w-5 h-5 text-[#d6b161] flex-shrink-0 mt-0.5" />
                                <span>Practical learning and career-focused training</span>
                            </div>
                        </div>
                    </div>

                    {/* Mission & Vision */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-gradient-to-br from-[#d6b161]/10 to-transparent dark:from-[#d6b161]/5 rounded-2xl p-8 border border-[#d6b161]/20">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-[#d6b161] flex items-center justify-center">
                                    <Star className="w-5 h-5 text-[#0a192f]" />
                                </div>
                                <h4 className="font-sans text-xl font-semibold text-gray-900 dark:text-white">Our Mission</h4>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                To provide high-quality training programs that enhance technical competence and global employability.
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-[#d6b161]/10 to-transparent dark:from-[#d6b161]/5 rounded-2xl p-8 border border-[#d6b161]/20">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-[#d6b161] flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-[#0a192f]" />
                                </div>
                                <h4 className="font-sans text-xl font-semibold text-gray-900 dark:text-white">Our Vision</h4>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                To become a global leader in industrial automation training, empowering businesses with smart, efficient, and sustainable solutions.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Skill Training Services Section */}
            <section id="main-content" className="py-24 bg-gray-50 dark:bg-[#0d1f3a]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <span className="text-[#d6b161] font-semibold text-sm tracking-widest uppercase">Skill Training</span>
                        <h2 className="font-sans text-4xl lg:text-5xl font-medium text-gray-900 dark:text-white mt-4 mb-6">
                            Industry-Ready Technical Training
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                            Practical, hands-on training programs combining theory with real-world applications
                        </p>
                    </div>

                    {/* Training Programs Grid */}
                    <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
                        {skillCourses.map((course) => (
                            <SkillCard
                                key={course._id}
                                course={course}
                            />
                        ))}
                    </div>

                    {/* View All Link */}
                    <div className="text-center mt-12">
                        <Link to="/skill-training">
                            <Button className="bg-[#0a192f] dark:bg-[#d6b161] text-white dark:text-[#0a192f] hover:bg-[#112240] dark:hover:bg-[#c4a055] font-semibold px-8 py-3 rounded-lg flex items-center gap-2 mx-auto focus-visible:ring-2 focus-visible:ring-[#d6b161]">
                                View All Courses
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>


            {/* Booking Modal */}
            <UnifiedBookingForm
                isOpen={isBookingFormOpen}
                onClose={() => setIsBookingFormOpen(false)}
            />

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default LandingPage;
