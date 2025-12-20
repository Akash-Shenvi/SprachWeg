// Generated page — follow CourseGermanPage.tsx UI/UX and animations.
import React, { useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Check, ChevronRight, Clock, Target, Award, Users, BookOpen, Settings } from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import EnrollmentModal from '../../components/ui/EnrollmentModal';

// --- Premium Animation Variants ---
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
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
};

// --- Components ---

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
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-[10%] -right-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#d6b161]/20 to-teal-500/10 blur-[120px]"
            />
            <motion.div
                style={{ y: y2 }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-amber-500/10 blur-[100px]"
            />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        </motion.div>
    );
};

// --- Main Page Component ---

const CustomizedCorporateTrainingPage: React.FC = () => {
    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
    const shouldReduceMotion = useReducedMotion();

    const whyChooseFeatures = [
        "Tailored modules based on your company's workflow and needs",
        "Expert trainers with real industry experience",
        "Flexible delivery modes: On-site, Online, or Hybrid",
        "Focused on practical skills that improve productivity and safety",
        "Comprehensive post-training support to ensure knowledge retention and application"
    ];

    return (
        <div className="relative min-h-screen bg-white text-gray-900 selection:bg-[#d6b161]/30 dark:bg-[#0a192f] dark:text-gray-100">
            <Header />

            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-6 focus:left-6 focus:z-50 focus:rounded-lg focus:bg-white focus:px-6 focus:py-3 focus:font-bold focus:text-[#0a192f] focus:shadow-2xl focus:ring-2 focus:ring-[#d6b161]"
            >
                Skip to content
            </a>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
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
                                <Settings className="h-4 w-4 fill-current" />
                                Personalized Corporate Solutions
                            </span>
                        </motion.div>

                        <motion.h1
                            variants={fadeInUp}
                            className="font-display mb-6 text-5xl font-bold tracking-tight text-[#0a192f] dark:text-white sm:text-6xl lg:text-7xl"
                        >
                            Customized <br className="hidden sm:inline" />
                            <span className="bg-gradient-to-r from-[#d6b161] to-[#b38f3f] bg-clip-text text-transparent">Corporate Training</span>
                        </motion.h1>

                        <motion.p
                            variants={fadeInUp}
                            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-300 sm:text-xl"
                        >
                            At Sovir Technologies, our Customized Corporate Training is tailored to meet the specific requirements of your organization. We design training programs that address your workforce's skill gaps, improve operational efficiency, and enhance industrial automation capabilities, ensuring your team stays ahead in a competitive market.
                        </motion.p>

                        <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2 rounded-lg bg-white/50 px-4 py-2 dark:bg-white/5">
                                <Clock className="h-5 w-5 text-[#d6b161]" />
                                <span>Flexible Duration</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg bg-white/50 px-4 py-2 dark:bg-white/5">
                                <Target className="h-5 w-5 text-teal-500" />
                                <span>Client-Based</span>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            <main id="main-content" className="relative z-10">

                {/* Course Overview Section */}
                <section className="px-4 py-24 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="mb-16 text-center"
                        >
                            <h2 className="text-3xl font-bold tracking-tight text-[#0a192f] dark:text-white sm:text-4xl">
                                Course Overview
                            </h2>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mx-auto max-w-4xl rounded-3xl border border-gray-100 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-800/95 sm:p-12"
                        >
                            <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-200">
                                This training program is designed for companies seeking personalized learning solutions. Our experts analyze your business processes and develop customized modules, covering PLC programming, SCADA & HMI, industrial drives, motion control, Industry 4.0 technologies, and safety compliance. Each session is structured to maximize learning and hands-on application.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Course Details Section */}
                <section className="bg-gray-50 px-4 py-24 dark:bg-[#0d1f3a]/30 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-12 text-center"
                        >
                            <h2 className="text-3xl font-bold tracking-tight text-[#0a192f] dark:text-white sm:text-4xl">
                                Course Details
                            </h2>
                        </motion.div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-800/95"
                            >
                                <Clock className="mb-4 h-10 w-10 text-[#d6b161]" />
                                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Duration</h3>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">Flexible (Client-based)</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-800/95"
                            >
                                <BookOpen className="mb-4 h-10 w-10 text-[#d6b161]" />
                                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Delivery Mode</h3>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">On-site / Online / Hybrid</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 }}
                                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-800/95"
                            >
                                <Target className="mb-4 h-10 w-10 text-[#d6b161]" />
                                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Class Timings</h3>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">Customized Schedule</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4 }}
                                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-800/95"
                            >
                                <Award className="mb-4 h-10 w-10 text-[#d6b161]" />
                                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Fees</h3>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">₹28,000</p>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Who Should Enroll Section */}
                <section className="px-4 py-24 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-12 text-center"
                        >
                            <h2 className="text-3xl font-bold tracking-tight text-[#0a192f] dark:text-white sm:text-4xl">
                                Who Should Enroll?
                            </h2>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mx-auto max-w-4xl rounded-3xl border border-gray-100 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-800/95 sm:p-12"
                        >
                            <div className="flex items-start gap-4">
                                <Users className="mt-1 h-8 w-8 flex-shrink-0 text-[#d6b161]" />
                                <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-200">
                                    Ideal for corporate teams, engineers, production managers, and professionals seeking specialized training in automation, Industry 4.0, and smart manufacturing practices.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Why Choose Sovir Technologies Section */}
                <section className="bg-gray-50 px-4 py-24 dark:bg-[#0d1f3a]/30 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-12 text-center"
                        >
                            <h2 className="text-3xl font-bold tracking-tight text-[#0a192f] dark:text-white sm:text-4xl">
                                Why Choose Sovir Technologies?
                            </h2>
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                            className="mx-auto max-w-4xl rounded-3xl border border-gray-100 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-800/95 sm:p-12"
                        >
                            <ul className="space-y-4">
                                {whyChooseFeatures.map((feature, idx) => (
                                    <motion.li
                                        key={idx}
                                        variants={fadeInUp}
                                        custom={idx}
                                        className="flex items-start gap-3 text-lg text-gray-700 dark:text-gray-200"
                                    >
                                        <Check className="mt-0.5 h-6 w-6 flex-shrink-0 text-[#d6b161]" />
                                        <span className="leading-relaxed">{feature}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="px-4 py-24 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-5xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative overflow-hidden rounded-3xl bg-[#0a192f] px-6 py-16 text-center text-white shadow-2xl dark:bg-blue-600/10 dark:ring-1 dark:ring-white/10 sm:px-12 sm:py-20"
                        >
                            <div className="relative z-10">
                                <Settings className="mx-auto mb-6 h-12 w-12 text-[#d6b161]" />
                                <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                                    Transform Your Team with Custom Training
                                </h2>
                                <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-300">
                                    Join Sovir Technologies and empower your workforce with specialized skills.
                                </p>
                                <motion.button
                                    onClick={() => setIsEnrollModalOpen(true)}
                                    whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                                    className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-[#d6b161] px-8 py-4 text-base font-bold text-[#0a192f] shadow-lg shadow-[#d6b161]/20 transition-all hover:bg-[#c9a556] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#d6b161] focus:ring-offset-2 focus:ring-offset-[#0a192f]"
                                >
                                    Enroll Now
                                    <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </motion.button>
                            </div>

                            {/* Background Accents */}
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-[#d6b161]/10 blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl"></div>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
            <EnrollmentModal
                isOpen={isEnrollModalOpen}
                onClose={() => setIsEnrollModalOpen(false)}
                origin="corporate-training"
                originPath="/skill-training/corporate"
            />
        </div>
    );
};

export default CustomizedCorporateTrainingPage;
