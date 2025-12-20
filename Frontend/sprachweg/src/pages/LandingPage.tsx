import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
    CheckCircle,
    Star,
    Globe,
    Play,
    GraduationCap,
    ArrowRight
} from 'lucide-react';
import Button from '../components/ui/Button';
import { Header, Footer } from '../components/layout';
import BookingForm from '../components/ui/BookingForm';

// Carousel for Trusted Partners with smooth infinite scroll
const TrustedPartnersCarousel = () => {
    const carouselRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);

    const partners = [
        { name: "Jindal Steel", logo: "https://sovirtechnologies.in/api/uploads/website/home/Jindal_Steel_Limited_Logo.png" },
        { name: "LG", logo: "https://sovirtechnologies.in/api/uploads/website/home/LG.svg" },
        { name: "Havells", logo: "https://sovirtechnologies.in/api/uploads/website/home/Havells_Logo.svg.png" },
        { name: "JSW Steel", logo: "https://sovirtechnologies.in/api/uploads/website/home/jsw_steel.jfif" },
        { name: "Tata", logo: "https://sovirtechnologies.in/api/uploads/website/home/t_926_tata.jpg" },
        { name: "Siemens", logo: "https://sovirtechnologies.in/api/uploads/website/home/Siemens-Logo.wine.png" },
    ];

    useEffect(() => {
        const carousel = carouselRef.current;
        if (!carousel) return;

        let animationId: number;
        const scrollSpeed = isHovering ? 0 : 0.7;

        const animate = () => {
            if (!carouselRef.current) return;

            const totalWidth = carousel.scrollWidth;
            const visibleWidth = carousel.clientWidth;
            const scrollableWidth = totalWidth - visibleWidth;

            if (carousel.scrollLeft >= scrollableWidth / 3) {
                carousel.scrollLeft = 0;
            } else {
                carousel.scrollLeft += scrollSpeed;
            }

            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationId);
    }, [isHovering]);

    return (
        <div
            className="relative overflow-hidden w-full"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div
                ref={carouselRef}
                className="flex gap-x-12 items-center overflow-x-hidden"
                style={{
                    scrollbarWidth: "none",
                    width: "100%",
                }}
            >
                {[...partners, ...partners, ...partners].map((partner, idx) => (
                    <div
                        key={idx}
                        className="flex flex-col items-center min-w-max transition-transform duration-300 hover:scale-110 flex-shrink-0 group py-4"
                    >
                        <div className="h-24 w-48 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all duration-300 shadow-sm hover:shadow-md border border-gray-100 dark:border-white/5">
                            <img
                                src={partner.logo}
                                alt={partner.name}
                                className="h-16 w-32 object-contain px-2 transition-transform duration-300 group-hover:scale-105 filter dark:brightness-100"
                                loading="lazy"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = `https://placehold.co/192x80/f0f0f0/999999?text=${partner.name.replace(' ', '+')}`;
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Fade effect on edges */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-50 dark:from-[#0d1f3a] to-transparent pointer-events-none z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-50 dark:from-[#0d1f3a] to-transparent pointer-events-none z-10"></div>
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
            url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            title: "Industrial Automation Training",
            caption: "Master PLC, SCADA, and Modern Control Systems"
        },
        {
            url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            title: "Hands-On Learning",
            caption: "Real-world Projects and Lab Experience"
        },
        {
            url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            title: "Industry 4.0 Ready",
            caption: "Smart Manufacturing and IIoT Technologies"
        },
        {
            url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
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
    subtitle: string;
    category: string;
    duration: string;
    mode: string;
    price: string;
    originalPrice?: string;
    image: string;
    rating: number;
    level: string;
    popular: boolean;
    link: string;
}

// Enhanced Skill Card with 3D Tilt
interface SkillCardProps {
    course: SkillCourseStatic;
}

const SkillCard: React.FC<SkillCardProps> = ({ course }) => {
    const shouldReduceMotion = useReducedMotion();
    const cardRef = useRef<HTMLDivElement>(null);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), { stiffness: 300, damping: 30 });
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), { stiffness: 300, damping: 30 });

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
        mouseX.set(0);
        mouseY.set(0);
    };

    const formatPrice = (val: string | number) => {
        if (!val) return '₹0';
        if (String(val).includes('₹') || String(val).includes('$') || String(val).includes('€')) return val;
        return `₹${Number(val).toLocaleString('en-IN')}`;
    };

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
                rotateX: shouldReduceMotion ? 0 : rotateX,
                rotateY: shouldReduceMotion ? 0 : rotateY,
                transformStyle: 'preserve-3d',
                willChange: 'transform'
            }}
            whileHover={{ scale: shouldReduceMotion ? 1 : 1.03 }}
            className="bg-white dark:bg-[#112240] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden group hover:shadow-2xl hover:shadow-[#d6b161]/20 transition-all duration-300 hover:border-[#d6b161]/50 flex flex-col h-full"
            tabIndex={0}
            role="article"
            aria-label={`${course.title} course card`}
        >
            {/* Grain overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay pointer-events-none z-10" aria-hidden="true"></div>

            {/* Image Area */}
            <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
                {/* LQIP */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700" />
                <img
                    src={course.image}
                    alt={course.title}
                    className="relative z-10 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                />

                {/* Floating Badges */}
                {course.popular && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md z-20">
                        Popular
                    </div>
                )}
                {course.level && (
                    <div className="absolute top-4 right-4 bg-[#d6b161] text-[#0a192f] text-xs font-bold px-3 py-1 rounded-full shadow-md z-20">
                        {course.level}
                    </div>
                )}

                {/* Rim light */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Content Area */}
            <div className="p-6 flex-1 flex flex-col relative z-20">
                <div className="flex justify-between items-start mb-2">
                    <div className="text-[#d6b161] text-sm font-semibold">{course.category}</div>
                    {course.rating && (
                        <div className="flex items-center gap-1 text-sm text-yellow-500 font-semibold">
                            <Star className="w-3.5 h-3.5 fill-current" /> {Number(course.rating).toFixed(1)}
                        </div>
                    )}
                </div>

                <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-1 line-clamp-2" title={course.title}>
                    {course.title}
                </h3>

                {course.subtitle && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
                        {course.subtitle}
                    </p>
                )}

                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {course.duration && <span>⏱️ {course.duration}</span>}
                    {course.mode && <span>📍 {course.mode}</span>}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800 mt-auto">
                    <div className="flex flex-col">
                        {course.originalPrice && (
                            <span className="text-xs text-gray-400 line-through">
                                {formatPrice(course.originalPrice)}
                            </span>
                        )}
                        <span className="text-lg font-bold text-[#0a192f] dark:text-white">
                            {course.price ? formatPrice(course.price) : 'Free'}
                        </span>
                    </div>
                    <Link to={course.link}>
                        <Button
                            className="bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] text-sm font-bold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all focus-visible:ring-2 focus-visible:ring-[#d6b161]"
                        >
                            Explore
                        </Button>
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
            subtitle: 'Master supervisory control and data acquisition',
            category: 'Industrial Automation',
            duration: '40 hours',
            mode: 'Live/Hybrid',
            price: '7200',
            image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            rating: 4.8,
            level: 'Intermediate',
            popular: true,
            link: '/skill-training'
        },
        {
            _id: '2',
            title: 'PLC Programming & Industrial Automation',
            subtitle: 'Complete industrial automation systems',
            category: 'Industrial Automation',
            duration: '56 hours',
            mode: 'Live/Hybrid',
            price: '9200',
            image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            rating: 4.9,
            level: 'Advanced',
            popular: true,
            link: '/skill-training'
        },
        {
            _id: '3',
            title: 'Industrial Drives & Motion Control',
            subtitle: 'VFDs, servo systems, and motion control',
            category: 'Industrial Automation',
            duration: '45 hours',
            mode: 'Live/Hybrid',
            price: '10200',
            image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            rating: 4.7,
            level: 'Intermediate',
            popular: false,
            link: '/skill-training'
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
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="inline-block px-4 py-2 bg-[#d6b161]/10 rounded-full mb-6 border border-[#d6b161]/20">
                                <span className="text-[#d6b161] font-medium text-sm flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#d6b161]"></span>
                                    New: Summer 2025 Batches Now Open
                                </span>
                            </div>

                            <h1 className="font-sans text-5xl lg:text-7xl font-medium text-gray-900 dark:text-white leading-tight mb-6">
                                SoVir Skilling & <br />
                                <span className="text-[#d6b161]">Training Center</span> <br />
                            </h1>

                            <p className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-4">
                                A Training & Career Services Division of SoVir Technologies LLP
                            </p>

                            <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 leading-relaxed max-w-xl">
                                A professional training academy empowering individuals with industry-ready skills and global career opportunities through specialized skill development and abroad placement support.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link to="/skill-training">
                                    <Button
                                        className="bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] font-semibold px-8 py-6 text-lg rounded-full w-full sm:w-auto flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#d6b161]"
                                    >
                                        Start Learning
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                    </Button>
                                </Link>
                                <Button
                                    onClick={() => setIsBookingFormOpen(true)}
                                    variant="outline"
                                    className="border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 px-8 py-6 text-lg rounded-full w-full sm:w-auto flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#d6b161]"
                                >
                                    <Play className="w-5 h-5" />
                                    Book Free Consultation
                                </Button>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="relative h-[500px] lg:h-[600px]"
                        >
                            <RotatingImageStack />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Partners Section */}
            <section className="py-10 border-t border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#0d1f3a]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-sm tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-8">Recognized & Partnered With</p>
                    <div className="w-full">
                        <TrustedPartnersCarousel />
                    </div>
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

            {/* Careers Abroad - Pathways Section */}
            <section id="careers" className="py-24 bg-[#0a192f]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <span className="text-[#d6b161] font-semibold text-sm tracking-widest uppercase">Careers Abroad</span>
                        <h2 className="font-sans text-4xl lg:text-5xl font-medium text-white mt-4 mb-6">
                            Build Your Career in Germany
                        </h2>
                        <p className="text-lg text-gray-400 max-w-3xl mx-auto">
                            Structured placement programs with end-to-end support for vocational training and nursing opportunities
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Ausbildung */}
                        <div className="bg-[#112240] rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:shadow-[#d6b161]/10 transition-all duration-300 border border-white/5 relative">
                            <div className="h-64 relative overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Ausbildung" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#112240] to-transparent"></div>
                                <div className="absolute top-6 left-6 w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                                    <GraduationCap className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="absolute bottom-6 left-6 font-sans text-2xl text-white">Ausbildung Programs</h3>
                            </div>
                            <div className="p-8">
                                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                                    Paid vocational training in Germany with work permit and pathway to permanent residence.
                                </p>

                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    <div>
                                        <div className="text-2xl font-bold text-[#d6b161]">85+</div>
                                        <div className="text-xs text-gray-500">Placed</div>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-white">€1,200/m</div>
                                        <div className="text-xs text-gray-500">Avg. Salary</div>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-white">2-3 yrs</div>
                                        <div className="text-xs text-gray-500">Timeline</div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center gap-3 text-sm text-gray-300">
                                        <CheckCircle className="w-4 h-4 text-[#d6b161]" />
                                        Earn while you learn
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-300">
                                        <CheckCircle className="w-4 h-4 text-[#d6b161]" />
                                        German B1 required
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-300">
                                        <CheckCircle className="w-4 h-4 text-[#d6b161]" />
                                        Free accommodation support
                                    </div>
                                </div>

                                <Link to="/careers">
                                    <Button className="w-full bg-white text-[#0a192f] hover:bg-gray-100 font-semibold rounded-xl focus-visible:ring-2 focus-visible:ring-[#d6b161]">Learn More</Button>
                                </Link>
                            </div>
                        </div>

                        {/* Nursing */}
                        <div className="bg-[#112240] rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:shadow-[#d6b161]/10 transition-all duration-300 border border-white/5 relative">
                            <div className="h-64 relative overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Nursing" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#112240] to-transparent"></div>
                                <div className="absolute top-6 left-6 w-12 h-12 rounded-xl bg-[#ff7e5f]/20 backdrop-blur-md flex items-center justify-center border border-[#ff7e5f]/20">
                                    <svg className="w-6 h-6 text-[#ff7e5f]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                                </div>
                                <h3 className="absolute bottom-6 left-6 font-sans text-2xl text-white">Nursing Pathway</h3>
                            </div>
                            <div className="p-8">
                                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                                    Fast-track to nursing career in Canada with recognition support and employer matching.
                                </p>

                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    <div>
                                        <div className="text-2xl font-bold text-[#d6b161]">120+</div>
                                        <div className="text-xs text-gray-500">Placed</div>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-white">€2,800/m</div>
                                        <div className="text-xs text-gray-500">Avg. Salary</div>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-white">6-12 mo</div>
                                        <div className="text-xs text-gray-500">Timeline</div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center gap-3 text-sm text-gray-300">
                                        <CheckCircle className="w-4 h-4 text-[#d6b161]" />
                                        Direct hospital placements
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-300">
                                        <CheckCircle className="w-4 h-4 text-[#d6b161]" />
                                        German B2 required
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-300">
                                        <CheckCircle className="w-4 h-4 text-[#d6b161]" />
                                        Visa assistance
                                    </div>
                                </div>

                                <Link to="/careers">
                                    <Button className="w-full bg-white text-[#0a192f] hover:bg-gray-100 font-semibold rounded-xl focus-visible:ring-2 focus-visible:ring-[#d6b161]">Learn More</Button>
                                </Link>
                            </div>
                        </div>

                        {/* Direct Job */}
                        <div className="bg-[#112240] rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:shadow-[#d6b161]/10 transition-all duration-300 border border-white/5 relative">
                            <div className="h-64 relative overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Direct Job" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#112240] to-transparent"></div>
                                <div className="absolute top-6 left-6 w-12 h-12 rounded-xl bg-[#d6b161]/20 backdrop-blur-md flex items-center justify-center border border-[#d6b161]/20">
                                    <svg className="w-6 h-6 text-[#d6b161]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                </div>
                                <h3 className="absolute bottom-6 left-6 font-sans text-2xl text-white">Direct Job Placement</h3>
                            </div>
                            <div className="p-8">
                                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                                    Connect with Japanese Tech employers hiring international talent across various sectors.
                                </p>

                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    <div>
                                        <div className="text-2xl font-bold text-[#d6b161]">45+</div>
                                        <div className="text-xs text-gray-500">Placed</div>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-white">€3,500/m</div>
                                        <div className="text-xs text-gray-500">Avg. Salary</div>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-white">3-6 mo</div>
                                        <div className="text-xs text-gray-500">Timeline</div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center gap-3 text-sm text-gray-300">
                                        <CheckCircle className="w-4 h-4 text-[#d6b161]" />
                                        IT, Engineering, Finance
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-300">
                                        <CheckCircle className="w-4 h-4 text-[#d6b161]" />
                                        German B1-B2 required
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-300">
                                        <CheckCircle className="w-4 h-4 text-[#d6b161]" />
                                        Interview preparation
                                    </div>
                                </div>

                                <Link to="/careers">
                                    <Button className="w-full bg-white text-[#0a192f] hover:bg-gray-100 font-semibold rounded-xl focus-visible:ring-2 focus-visible:ring-[#d6b161]">Learn More</Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Modals */}
            <BookingForm
                isOpen={isBookingFormOpen}
                onClose={() => setIsBookingFormOpen(false)}
            />

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default LandingPage;
