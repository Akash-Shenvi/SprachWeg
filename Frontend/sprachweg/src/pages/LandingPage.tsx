import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import heroBg from '../assets/hero-bg.png';

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
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <img
                        src={heroBg}
                        alt=""
                        className="w-full h-full object-cover object-center"
                        aria-hidden="true"
                    />
                </div>

                {/* Gradient overlay — light mode */}
                <div className="absolute inset-0 block dark:hidden bg-black/20 backdrop-blur-sm" aria-hidden="true" />
                {/* Gradient overlay — dark mode */}
                <div className="absolute inset-0 hidden dark:block bg-gradient-to-b from-[#0a192f]/75 via-[#0a192f]/45 to-[#0a192f]/85" aria-hidden="true" />

                {/* Subtle radial glow from center */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(214,177,97,0.06),transparent)]" aria-hidden="true" />

                {/* Bottom vignette for seamless transition to next section */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-[#0a192f] to-transparent" aria-hidden="true" />

                {/* Content — wider container with generous padding */}
                <div className="relative z-10 w-full max-w-8xl mx-auto px-6 sm:px-8 lg:px-12 pt-28 pb-24 lg:pt-40 lg:pb-36">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.0, 0.0, 0.2, 1] }}
                        className="flex flex-col items-center text-center space-y-4 md:space-y-6 w-full max-w-6xl mx-auto"
                    >
                        <div className="inline-block px-4 py-2 bg-[#d6b161]/15 backdrop-blur-sm rounded-full border border-[#d6b161]/30">
                            <span className="text-[#d6b161] font-medium text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#d6b161] animate-pulse"></span>
                                New: Summer 2026 Batches Now Open
                            </span>
                        </div>

                        <h1 className="font-sans text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-medium text-gray-900 dark:text-white leading-tight md:leading-[1.1] tracking-tight drop-shadow-lg">
                            SoVir Skilling & <br className="hidden sm:block" />
                            <span>Training Center</span>
                        </h1>

                        <p className="text-base md:text-lg lg:text-xl font-semibold text-gray-700 dark:text-gray-200 max-w-7xl opacity-95 drop-shadow-md">
                            A Training & Career Services Division of SoVir Technologies LLP
                        </p>

                        <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-6xl opacity-95 drop-shadow-sm">
                            A professional training academy empowering individuals with industry-ready skills and global career opportunities through specialized skill development and abroad placement support.
                        </p>

                        <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full sm:w-auto justify-center pt-2">
                            <Link to="/skill-training">
                                <Button
                                    className="bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] font-semibold px-8 py-4 text-base sm:text-lg rounded-full w-full sm:w-auto flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#d6b161] transition-all duration-300 hover:shadow-lg hover:shadow-[#d6b161]/25 min-h-[48px]"
                                >
                                    Start Learning
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                </Button>
                            </Link>
                            <Button
                                onClick={() => setIsBookingFormOpen(true)}
                                variant="outline"
                                className="border-gray-400/50 dark:border-white/30 text-gray-900 dark:text-white hover:bg-gray-900/5 dark:hover:bg-white/10 backdrop-blur-sm px-8 py-4 text-base sm:text-lg rounded-full w-full sm:w-auto flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#d6b161] transition-all duration-300 hover:shadow-lg dark:hover:border-white/50 min-h-[48px]"
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
