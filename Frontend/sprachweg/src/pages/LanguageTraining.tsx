// ... imports
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useAnimation, type Easing, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
    Star,
    BookOpen,
    Clock,
    TrendingUp,
    ArrowRight,
    GraduationCap,
    Shield,
    Zap,
    Users,
    Globe
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import BookingForm from '../components/ui/BookingForm';
import { languageAPI } from '../lib/api';
import { formatTrainingPrice, getCourseStartingPrice } from '../lib/trainingPricing';

// ... (keep all existing constants and subcomponents like stats, languageCards, benefits, StarRating, LanguageCard, BenefitCard)
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

// Elevated Hero Background
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
                    opacity: [0.4, 0.6, 0.4]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-[10%] -right-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#d6b161]/20 to-[#0a192f]/10 blur-[120px]"
            />
            <motion.div
                style={{ y: y2 }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[100px]"
            />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        </motion.div>
    );
};



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
        price: '₹9,999',
        bgColor: 'bg-blue-50 dark:bg-blue-950/30',
        borderColor: 'border-blue-200 dark:border-blue-800',
        route: '/training/english',
        image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
        code: 'DE',
        title: 'German Training',
        students: '6,200+',
        courses: 38,
        rating: 4.8,
        reviews: '2.4k',
        levels: ['A1', 'A2', 'B1', 'B2', 'TELC / Goethe'],
        categories: [],
        price: '₹15,999',
        bgColor: 'bg-pink-50 dark:bg-pink-950/30',
        borderColor: 'border-pink-200 dark:border-pink-800',
        route: '/training/german',
        image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
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
        price: '₹17,999',
        bgColor: 'bg-pink-50 dark:bg-pink-950/30',
        borderColor: 'border-pink-200 dark:border-pink-800',
        route: '/training/japanese',
        image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    }
];

const matchesLanguageCard = (card: typeof languageCards[number], title?: string) => {
    const normalizedTitle = String(title || '').trim().toLowerCase();

    if (card.route === '/training/english') {
        return normalizedTitle.includes('english');
    }

    if (card.route === '/training/german') {
        return normalizedTitle.includes('german');
    }

    if (card.route === '/training/japanese') {
        return normalizedTitle.includes('japanese');
    }

    return false;
};

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
}> = ({ card, index: _index }) => {
    return (
        <motion.div
            variants={fadeInUp}
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            className={`relative rounded-2xl border-2 ${card.borderColor} ${card.bgColor} shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group`}
        >
            {/* Image Area */}
            <div className="h-48 relative overflow-hidden bg-gray-200 dark:bg-gray-800 z-20">
                <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
            </div>

            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 pointer-events-none" />

            {/* Content wrapper with z-index */}
            <div className="relative z-10 p-6">
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
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [cards, setCards] = useState(languageCards);

    useEffect(() => {
        const syncLanguagePrices = async () => {
            try {
                const courses = await languageAPI.getAll();

                setCards((currentCards) =>
                    currentCards.map((card) => {
                        const matchedCourse = courses.find((course: any) => matchesLanguageCard(card, course?.title));

                        if (!matchedCourse) {
                            return card;
                        }

                        const startingPrice = getCourseStartingPrice(matchedCourse);

                        return {
                            ...card,
                            price: startingPrice !== null ? formatTrainingPrice(startingPrice) : card.price,
                        };
                    })
                );
            } catch (error) {
                console.error('Failed to sync language prices:', error);
            }
        };

        syncLanguagePrices();
    }, []);

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
            <Header />

            {/* Hero Section */}
            <section className="relative py-28 sm:py-36 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white dark:from-[#0d1f3a] dark:to-[#0a192f]" />
                <HeroBackground />

                <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="mx-auto max-w-4xl"
                    >
                        <motion.div variants={fadeInUp} className="mb-8 flex justify-center">
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#d6b161]/20 bg-[#d6b161]/10 px-4 py-1.5 text-sm font-semibold text-[#d6b161] backdrop-blur-sm">
                                <Star className="h-4 w-4 fill-current" />
                                Global Language Certification
                            </span>
                        </motion.div>

                        <motion.h1
                            variants={fadeInUp}
                            className="font-display mb-6 text-5xl font-bold tracking-tight text-[#0a192f] dark:text-white sm:text-6xl lg:text-7xl"
                        >
                            Master Languages for <br className="hidden sm:inline" />
                            <span className="bg-gradient-to-r from-[#d6b161] to-[#b38f3f] bg-clip-text text-transparent">Global Success</span>
                        </motion.h1>

                        <motion.p
                            variants={fadeInUp}
                            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-300 sm:text-xl"
                        >
                            Learn English, German, or Japanese with live interactive classes, flexible schedules, and internationally recognized certifications.
                        </motion.p>

                        <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2 rounded-lg bg-white/50 px-4 py-2 dark:bg-white/5">
                                <Shield className="h-5 w-5 text-emerald-500" />
                                <span>Official Certification</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg bg-white/50 px-4 py-2 dark:bg-white/5">
                                <Zap className="h-5 w-5 text-[#d6b161]" />
                                <span>Fast-track Options</span>
                            </div>
                        </motion.div>
                    </motion.div>
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
                        {cards.map((card, index) => (
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
                            <motion.button
                                onClick={() => setIsBookingOpen(true)}
                                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(214, 177, 97, 0.4)' }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 bg-[#d6b161] text-[#0a192f] font-bold rounded-xl hover:bg-[#c4a055] transition-all shadow-lg"
                            >
                                Book Free Trial
                            </motion.button>
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

            <BookingForm isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
            <Footer />
        </div>
    );
};

export default LanguageTraining;
