import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useAnimation, type Easing } from 'framer-motion';
import {
    Users,
    Award,
    Globe,
    Building2,
    Star,
    BookOpen,
    Clock,
    TrendingUp,
    ArrowRight,
    GraduationCap
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

// Typed easing value
const easeOut: Easing = [0.0, 0.0, 0.2, 1];

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.1
        }
    }
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: easeOut } }
};


// Animated section wrapper component
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

// Stats data
const stats = [
    { icon: Users, value: '30+', label: 'Active Students' },
    { icon: Award, value: '76%', label: 'Success Rate' },
    { icon: Globe, value: '3+', label: 'Countries' },
    { icon: Building2, value: '5', label: 'Partner Companies' }
];

// Language cards data
const languageCards = [
    {
        code: 'GB',
        title: 'English Training',
        students: '8,500+',
        courses: 45,
        rating: 4.9,
        reviews: '2.4k',
        levels: ['Beginner', 'Intermediate', 'Advanced'],
        categories: ['Business', 'Academic'],
        price: '₹12,999',
        bgColor: 'bg-blue-50 dark:bg-blue-950/30',
        borderColor: 'border-blue-200 dark:border-blue-800',
        route: '/training/english'
    },
    {
        code: 'DE',
        title: 'German Training',
        students: '6,200+',
        courses: 38,
        rating: 4.8,
        reviews: '2.4k',
        levels: ['A1', 'A2', 'B1', 'B2', 'TestDaF'],
        categories: [],
        price: '₹15,999',
        bgColor: 'bg-pink-50 dark:bg-pink-950/30',
        borderColor: 'border-pink-200 dark:border-pink-800',
        route: '/training/german'
    },
    {
        code: 'JP',
        title: 'Japanese Training',
        students: '4,800+',
        courses: 32,
        rating: 4.9,
        reviews: '2.4k',
        levels: ['N5', 'N4', 'N3', 'N2', 'N1'],
        categories: [],
        price: '₹16,999',
        bgColor: 'bg-pink-50 dark:bg-pink-950/30',
        borderColor: 'border-pink-200 dark:border-pink-800',
        route: '/training/japanese'
    }
];

// Benefits data
const benefits = [
    {
        icon: Users,
        title: 'Expert Instructors',
        description: 'Native speakers & certified trainers with 10+ years experience'
    },
    {
        icon: Clock,
        title: 'Flexible Learning',
        description: 'Live classes, self-paced modules, and hybrid options'
    },
    {
        icon: TrendingUp,
        title: 'Career Support',
        description: 'Job placement assistance and interview preparation'
    },
    {
        icon: Globe,
        title: 'Global Network',
        description: 'Connect with students and opportunities worldwide'
    }
];

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

// Language Card Component
const LanguageCard: React.FC<{
    card: typeof languageCards[0];
    index: number;
}> = ({ card, index }) => {
    return (
        <motion.div
            variants={fadeInUp}
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            className={`relative rounded-2xl border-2 ${card.borderColor} ${card.bgColor} p-6 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group`}
        >
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 pointer-events-none" />

            {/* Content wrapper with z-index */}
            <div className="relative z-10">
                {/* Country Code */}
                <div className="text-center mb-4">
                    <motion.span
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1, duration: 0.4 }}
                        className="text-4xl font-bold text-[#0a192f] dark:text-white tracking-wider"
                    >
                        {card.code}
                    </motion.span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-sans font-bold text-center text-[#0a192f] dark:text-white mb-5">
                    {card.title}
                </h3>

                {/* Stats Row */}
                <div className="flex items-center justify-center gap-6 text-sm text-gray-700 dark:text-gray-300 mb-4">
                    <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#0a192f] dark:text-gray-400" />
                        <span className="font-medium">{card.students} students</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[#0a192f] dark:text-gray-400" />
                        <span className="font-medium">{card.courses} courses</span>
                    </div>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-center gap-2 mb-5">
                    <StarRating rating={card.rating} />
                    <span className="text-sm font-semibold text-[#0a192f] dark:text-white">{card.rating}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">({card.reviews} reviews)</span>
                </div>

                {/* Level Tags */}
                <div className="flex flex-wrap justify-center gap-2 mb-3">
                    {card.levels.map((level) => (
                        <span
                            key={level}
                            className="px-3 py-1.5 text-xs font-semibold rounded-full bg-white dark:bg-gray-800 text-[#0a192f] dark:text-gray-200 border border-gray-300 dark:border-gray-600 shadow-sm"
                        >
                            {level}
                        </span>
                    ))}
                </div>

                {/* Category Tags */}
                {card.categories.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                        {card.categories.map((category) => (
                            <span
                                key={category}
                                className="px-3 py-1.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700"
                            >
                                {category}
                            </span>
                        ))}
                    </div>
                )}

                {/* Price and CTA */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-300 dark:border-gray-600">
                    <div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Starting at</span>
                        <span className="text-2xl font-bold text-[#0a192f] dark:text-white">{card.price}</span>
                    </div>
                    <Link to={card.route}>
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

// Benefit Card Component
const BenefitCard: React.FC<{
    benefit: typeof benefits[0];
    index: number;
}> = ({ benefit, index: _index }) => {
    const Icon = benefit.icon;

    return (
        <motion.div
            variants={scaleIn}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center group"
        >
            {/* Icon */}
            <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-[#d6b161]/20 transition-colors"
            >
                <Icon className="w-8 h-8 text-[#0a192f] dark:text-[#d6b161]" />
            </motion.div>

            {/* Title */}
            <h3 className="text-lg font-bold text-[#0a192f] dark:text-white mb-2">
                {benefit.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {benefit.description}
            </p>
        </motion.div>
    );
};

// Main Component
const LanguageTraining: React.FC = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
            <Header />

            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1a365d] overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                        animate={{
                            x: [0, 100, 0],
                            y: [0, -50, 0],
                            scale: [1, 1.2, 1]
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{
                            x: [0, -80, 0],
                            y: [0, 80, 0],
                            scale: [1, 1.3, 1]
                        }}
                        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                        className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-[#d6b161]/20 to-transparent rounded-full blur-3xl"
                    />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
                    <AnimatedSection className="flex flex-col items-center text-center">
                        {/* Main Heading */}
                        <motion.h1
                            variants={fadeInUp}
                            className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold text-white mb-6 leading-tight text-center mx-auto"
                        >
                            Master Global Languages with{' '}
                            <span className="text-[#d6b161] relative">
                                Expert Instructors
                                <motion.span
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 0.8, duration: 0.6 }}
                                    className="absolute -bottom-2 left-0 w-full h-1 bg-[#d6b161]/50 rounded-full origin-left"
                                />
                            </span>
                        </motion.h1>

                        {/* Subheading */}
                        <motion.p
                            variants={fadeInUp}
                            className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-12"
                        >
                            Learn English, German, or Japanese with live interactive classes, flexible
                            schedules, and internationally recognized certifications
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/book-trial">
                                <motion.button
                                    whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(214, 177, 97, 0.3)' }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-8 py-4 bg-[#d6b161] text-[#0a192f] font-bold rounded-xl hover:bg-[#c4a055] transition-all shadow-lg"
                                >
                                    Start Learning Today
                                </motion.button>
                            </Link>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 border-2 border-white/30 text-white font-medium rounded-xl hover:bg-white/10 transition-all"
                            >
                                View All Courses
                            </motion.button>
                        </motion.div>
                    </AnimatedSection>
                </div>

                {/* Stats Bar */}
                <div className="relative bg-white/10 backdrop-blur-md border-t border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                            className="grid grid-cols-2 md:grid-cols-4 gap-8"
                        >
                            {stats.map((stat, index) => {
                                const Icon = stat.icon;
                                return (
                                    <motion.div
                                        key={index}
                                        variants={fadeInUp}
                                        className="text-center group"
                                    >
                                        <motion.div
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                            className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 mb-3 group-hover:bg-[#d6b161]/20 transition-colors"
                                        >
                                            <Icon className="w-6 h-6 text-[#d6b161]" />
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.1, duration: 0.4 }}
                                            viewport={{ once: true }}
                                            className="text-3xl md:text-4xl font-bold text-white mb-1"
                                        >
                                            {stat.value}
                                        </motion.div>
                                        <p className="text-sm text-gray-300">{stat.label}</p>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Language Cards Section */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimatedSection className="flex flex-col items-center text-center mb-16">
                        <motion.span
                            variants={fadeInUp}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#d6b161]/10 text-[#d6b161] rounded-full text-sm font-medium mb-4"
                        >
                            <GraduationCap className="w-4 h-4" />
                            Our Programs
                        </motion.span>
                        <motion.h2
                            variants={fadeInUp}
                            className="text-3xl md:text-4xl lg:text-5xl font-sans font-bold text-[#0a192f] dark:text-white mb-4 text-center mx-auto"
                        >
                            Choose Your Language Path
                        </motion.h2>
                        <motion.p
                            variants={fadeInUp}
                            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
                        >
                            Professional training programs designed for global careers
                        </motion.p>
                    </AnimatedSection>

                    <AnimatedSection className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {languageCards.map((card, index) => (
                            <LanguageCard key={card.code} card={card} index={index} />
                        ))}
                    </AnimatedSection>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 bg-white dark:bg-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimatedSection className="flex flex-col items-center text-center mb-16">
                        <motion.h2
                            variants={fadeInUp}
                            className="text-3xl md:text-4xl lg:text-5xl font-sans font-bold text-[#0a192f] dark:text-white mb-4 text-center mx-auto"
                        >
                            Why Choose SoVir Academy?
                        </motion.h2>
                        <motion.p
                            variants={fadeInUp}
                            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
                        >
                            World-class language training with proven results
                        </motion.p>
                    </AnimatedSection>

                    <AnimatedSection className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {benefits.map((benefit, index) => (
                            <BenefitCard key={index} benefit={benefit} index={index} />
                        ))}
                    </AnimatedSection>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative bg-gradient-to-r from-[#0a192f] via-[#112240] to-[#1a365d] py-20 overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                        className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-[#d6b161]/10 to-transparent rounded-full"
                    />
                </div>

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <AnimatedSection>
                        <motion.h2
                            variants={fadeInUp}
                            className="text-3xl md:text-4xl lg:text-5xl font-sans font-bold text-white mb-6"
                        >
                            Start Your Language Journey Today
                        </motion.h2>
                        <motion.p
                            variants={fadeInUp}
                            className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto"
                        >
                            Book a free trial class and experience our world-class teaching methodology
                        </motion.p>
                        <motion.div
                            variants={fadeInUp}
                            className="flex flex-col sm:flex-row gap-4 justify-center"
                        >
                            <Link to="/book-trial">
                                <motion.button
                                    whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(214, 177, 97, 0.4)' }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-8 py-4 bg-[#d6b161] text-[#0a192f] font-bold rounded-xl hover:bg-[#c4a055] transition-all shadow-lg"
                                >
                                    Book Free Trial
                                </motion.button>
                            </Link>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 bg-white text-[#0a192f] font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg"
                            >
                                Contact Us
                            </motion.button>
                        </motion.div>
                    </AnimatedSection>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default LanguageTraining;
