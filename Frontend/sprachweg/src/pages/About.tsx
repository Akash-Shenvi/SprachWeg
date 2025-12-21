import React, { useRef, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { motion, useScroll, useTransform, useReducedMotion, useInView, useAnimation } from 'framer-motion';
import { Award } from 'lucide-react';

// --- Theme Colors ---
// Navy: #0a192f
// Gold: #d6b161

// --- Animation Variants ---
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay: custom * 0.1, ease: [0.22, 1, 0.36, 1] as const }
    })
};

const sectionVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" as any }
    }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// Animated section wrapper (from SkillTrainingOverviewPage.tsx)
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

// --- Reusable Components ---

// Hero Background Component with parallax blobs + grain (From OverView.tsx)
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

const SectionHeading: React.FC<{ children: React.ReactNode; align?: 'left' | 'center'; id?: string }> = ({
    children,
    align = 'left',
    id
}) => {
    const shouldReduceMotion = useReducedMotion();

    return (
        <h2
            id={id}
            className={`text-3xl sm:text-4xl font-semibold text-[#0a192f] dark:text-white mb-6 relative inline-block ${align === 'center' ? 'w-full text-center' : ''
                }`}
        >
            {children}
            <motion.span
                className="absolute -bottom-3 left-0 h-1 bg-[#d6b161] origin-left w-full"
                initial={{ scaleX: 0 }}
                whileInView={shouldReduceMotion ? undefined : { scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
            />
        </h2>
    );
};

const ContentCard: React.FC<{
    title?: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
    borderTop?: boolean;
}> = ({ title, children, icon, className = "", borderTop = false }) => {
    return (
        <motion.article
            className={`h-full flex flex-col bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-100 dark:border-gray-700 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 will-change-transform ${borderTop ? 'border-t-4 border-t-[#d6b161]' : ''
                } ${className}`}
            variants={itemVariants}
        >
            <div className="flex-1">
                {icon && <div className="text-[#d6b161] mb-4" aria-hidden="true">{icon}</div>}
                {title && <h3 className="text-2xl font-semibold text-[#0a192f] dark:text-white mb-3">{title}</h3>}
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-2 text-base">
                    {children}
                </div>
            </div>
        </motion.article>
    );
};

const ListWithIcon: React.FC<{ items: string[] }> = ({ items }) => (
    <ul className="space-y-3">
        {items.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
                <span className="mt-1.5 min-w-[6px] min-h-[6px] rounded-full bg-[#d6b161] flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 text-base">{item}</span>
            </li>
        ))}
    </ul>
);

// --- Icons (Inline SVGs) ---
const Icons = {
    Gear: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    Target: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    ),
    GradCap: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
    ),
    Briefcase: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    ),
    Users: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    Check: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
};

const AboutPage: React.FC = () => {
    const shouldReduceMotion = useReducedMotion();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans text-gray-800 dark:text-gray-200">
            <Header />

            {/* --- HERO SECTION --- */}
            <section className="relative bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1a365d] overflow-hidden py-28 sm:py-36 text-center">
                <HeroBackground />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimatedSection className="flex flex-col items-center text-center">
                        <motion.div variants={fadeInUp} className="mb-6 flex justify-center">
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#d6b161]/20 bg-[#d6b161]/10 px-4 py-1.5 text-sm font-semibold text-[#d6b161] backdrop-blur-sm">
                                <Award className="h-4 w-4 fill-current" />
                                Learn. Automate. Communicate. Succeed.
                            </span>
                        </motion.div>
                        <motion.h1
                            variants={fadeInUp}
                            className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold text-white mb-6 leading-tight"
                        >
                            About SoVir Skilling & <br />
                            <span className="text-[#d6b161] relative">
                                Training Center
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
                            className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed"
                        >
                            Empowering Global Careers Through Language, Skills & Automation
                        </motion.p>
                    </AnimatedSection>
                </div>
            </section>

            {/* --- INTRO SECTION --- */}
            <motion.section
                className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8"
                initial={shouldReduceMotion ? {} : "hidden"}
                whileInView={shouldReduceMotion ? undefined : "visible"}
                viewport={{ once: true, margin: "-100px" }}
                variants={sectionVariants}
                aria-labelledby="who-we-are"
            >
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div>
                            <div className="text-center mb-6">
                                <span className="text-[#d6b161] font-bold tracking-wide uppercase text-sm">Who We Are</span>
                            </div>
                            <SectionHeading id="who-we-are">SoVir Skilling &
                                Training Center</SectionHeading>
                            <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed text-base max-w-[65ch]">
                                <p>
                                    SoVir Skilling &
                                    Training Center , a professional training division of SoVir Technologies LLP, is committed to developing industry-ready professionals through foreign language training, automation technologies, and career-focused skill development.
                                </p>
                                <p>
                                    We combine education, technology, and real-world industry practices to prepare learners for global employment, industrial roles, and future-ready careers.
                                </p>
                            </div>

                            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <p className="font-semibold text-[#0a192f] dark:text-white mb-4 text-base">Backed by SoVir Technologies LLP, we deliver training that is:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {['Industry-aligned', 'Practically oriented', 'Certification focused', 'Career & placement driven'].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className="text-[#d6b161] flex-shrink-0" aria-hidden="true"><Icons.Check /></span>
                                            <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            {/* Abstract visual element */}
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#d6b161]/10 rounded-full blur-xl" aria-hidden="true" />
                            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative z-10">
                                <h3 className="text-2xl font-semibold text-[#0a192f] dark:text-white mb-4">Our Purpose</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 italic leading-relaxed">
                                    "...to build a trusted, professional, and outcome-driven training ecosystem that aligns education with industry requirements."
                                </p>
                                <div className="space-y-4">
                                    <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Designed for</div>
                                    <div className="flex flex-wrap gap-2">
                                        {['Students', 'Diploma holders', 'Engineers', 'Working Professionals', 'Career Switchers'].map(tag => (
                                            <span key={tag} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* --- CORE PROGRAMS --- */}
            <section className="py-12 sm:py-16 md:py-20 bg-gray-50/50 dark:bg-gray-800/50 relative overflow-hidden px-4 sm:px-6 lg:px-8" aria-labelledby="core-programs">
                {/* Smooth golden accent line */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d6b161] to-transparent opacity-30" aria-hidden="true" />

                <div className="mx-auto max-w-7xl">
                    <div className="text-center mb-12 sm:mb-16">
                        <span className="text-[#d6b161] font-bold tracking-wide uppercase text-sm">Our Expertise</span>
                        <SectionHeading id="core-programs" align="center">Our Core Training Programs</SectionHeading>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:gap-10">
                        {/* Automation */}
                        <motion.section
                            initial={shouldReduceMotion ? {} : "hidden"}
                            whileInView={shouldReduceMotion ? undefined : "visible"}
                            viewport={{ once: true }}
                            variants={sectionVariants}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-700"
                            aria-labelledby="automation-heading"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-[#fff7e6] dark:bg-yellow-900/30 rounded-lg text-[#d6b161]" aria-hidden="true">
                                    <Icons.Gear />
                                </div>
                                <h3 id="automation-heading" className="text-2xl font-semibold text-[#0a192f] dark:text-white">
                                    All skill training courses
                                </h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-6 text-base">
                                Our PLC & Automation Training Programs are designed to meet modern industrial, manufacturing, and smart factory requirements.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold text-[#0a192f] dark:text-white mb-3 text-base">Technologies Covered</h4>
                                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                        <li>• PLC Programming (Siemens, Allen Bradley, Mitsubishi)</li>
                                        <li>• HMI Design & SCADA Systems</li>
                                        <li>• Industrial Sensors & Actuators</li>
                                        <li>• VFD / Drives</li>
                                        <li>• Control Panels & Industrial Wiring</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-[#0a192f] dark:text-white mb-3 text-base">Basics of Industry 4.0</h4>
                                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                        <li>• Industrial Networking</li>
                                        <li>• Safety Systems</li>
                                        <li>• Smart Automation</li>
                                    </ul>
                                </div>
                            </div>
                        </motion.section>
                    </div>
                </div>
            </section>

            {/* --- TRAINING APPROACH & AUDIENCE --- */}
            <motion.section
                className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-[#0a192f] dark:bg-[#030810] text-white"
                initial={shouldReduceMotion ? {} : "hidden"}
                whileInView={shouldReduceMotion ? undefined : "visible"}
                viewport={{ once: true }}
                variants={sectionVariants}
                aria-labelledby="training-approach"
            >
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
                        <div>
                            <h2 id="training-approach" className="text-3xl sm:text-4xl font-semibold mb-8 flex items-center gap-3">
                                <Icons.Target />
                                Training Approach
                            </h2>
                            <ul className="space-y-4">
                                {[
                                    'Hands-on practical training',
                                    'Real-time industrial case studies',
                                    'Live simulations & lab practice',
                                    'Project-based learning',
                                    'Industry-standard tools & methods'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5">
                                        <span className="text-[#d6b161] mt-1 flex-shrink-0">
                                            <Icons.Check />
                                        </span>
                                        <span className="text-lg leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-2xl font-semibold mb-6 text-[#d6b161]">Program Ideal For:</h3>
                            <div className="grid gap-4">
                                {[
                                    'Electrical & Electronics students',
                                    'Mechanical & Mechatronics engineers',
                                    'Automation & maintenance professionals',
                                    'Freshers seeking industrial exposure'
                                ].map((item, i) => (
                                    <div
                                        key={i}
                                        className="p-4 bg-white/95 dark:bg-gray-800/95 text-[#0a192f] dark:text-white rounded-lg font-medium shadow-lg transform hover:-translate-x-1 transition-transform"
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* --- EXAM PREP & SKILLS --- */}
            <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 dark:bg-gray-900">
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 gap-8 md:gap-10">
                        {/* Skill Dev */}
                        <ContentCard
                            title="Skill Development & Career Training"
                            borderTop={true}
                            icon={<Icons.Briefcase />}
                        >
                            <p className="mb-4 text-base leading-relaxed">
                                To ensure complete career readiness, we also offer:
                            </p>
                            <ListWithIcon
                                items={[
                                    'Professional communication skills',
                                    'Workplace ethics & industrial safety',
                                    'Resume & technical profile building',
                                    'Interview & HR round preparation',
                                    'Soft skills & personality development'
                                ]}
                            />
                        </ContentCard>
                    </div>
                </div>
            </section>

            {/* --- LEARNING MODES & PLACEMENT --- */}
            <section className="py-12 sm:py-16 md:py-20 bg-gray-50 dark:bg-gray-800 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12"
                        variants={staggerContainer}
                        initial={shouldReduceMotion ? {} : "hidden"}
                        whileInView={shouldReduceMotion ? undefined : "visible"}
                        viewport={{ once: true }}
                    >
                        {/* Learning Modes */}
                        <ContentCard
                            title="Learning Modes"
                            borderTop={true}
                            icon={<Icons.GradCap />}
                        >
                            <p className="mb-4 text-base leading-relaxed">
                                We offer flexible learning options to support different schedules:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {['Live Online Classes', 'Offline / Classroom Training', 'Weekend & Working Professional Batches', 'Recorded Sessions & Learning Materials'].map(mode => (
                                    <div
                                        key={mode}
                                        className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center text-center border border-gray-100 dark:border-gray-600 h-full"
                                    >
                                        {mode}
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 italic text-center leading-relaxed">
                                All programs are delivered using modern teaching tools and structured progress tracking.
                            </p>
                        </ContentCard>

                        {/* Placement */}
                        <ContentCard
                            title="Placement & Career Support"
                            borderTop={true}
                            icon={<Icons.Users />}
                        >
                            <p className="mb-4 text-base leading-relaxed">
                                At SoVir Skilling &
                                Training Center, training is career-oriented, not just academic.
                            </p>
                            <h4 className="font-semibold text-[#0a192f] dark:text-white mb-3 text-base">Our support includes:</h4>
                            <ListWithIcon
                                items={[
                                    'Career counseling & roadmap planning',
                                    'Resume & LinkedIn profile support',
                                    'Interview preparation (technical + HR)',
                                    'Industry exposure & guidance',
                                    'Internship & placement assistance (where applicable)'
                                ]}
                            />
                        </ContentCard>
                    </motion.div>
                </div>
            </section>

            {/* --- WHY CHOOSE US --- */}
            <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="why-choose">
                <div className="mx-auto max-w-7xl">
                    <div className="text-center mb-12 sm:mb-16">
                        <SectionHeading id="why-choose" align="center">Why Choose SoVir Skilling & Training Center?</SectionHeading>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            'Industry-backed training by SoVir Technologies LLP',
                            'Certified & experienced trainers',
                            'Practical, hands-on learning approach',
                            'International exam & industry alignment',
                            'Automation + Language training under one roof',
                            'Transparent, professional & learner-focused ecosystem'
                        ].map((reason, i) => (
                            <motion.div
                                key={i}
                                whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
                                className="h-full flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow"
                            >
                                <div className="text-[#d6b161] mb-3" aria-hidden="true">
                                    <Icons.Check />
                                </div>
                                <p className="font-medium text-gray-800 dark:text-gray-300 text-base leading-relaxed">
                                    {reason}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
            {/* --- MISSION, VISION, VALUES --- */}
            <section className="py-12 sm:py-16 md:py-20 bg-[#0a192f] dark:bg-[#030810] text-white overflow-hidden relative px-4 sm:px-6 lg:px-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#d6b161]/10 rounded-full blur-3xl" aria-hidden="true" />
                <div className="mx-auto max-w-7xl relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-2xl font-semibold text-[#d6b161]">Our Mission</h3>
                            <p className="text-gray-300 leading-relaxed text-base max-w-[65ch]">
                                To provide high-quality training programs that enhance technical competence and global employability.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-semibold text-[#d6b161]">Our Vision</h3>
                            <p className="text-gray-300 leading-relaxed text-base max-w-[65ch]">
                                To become a global leader in industrial automation, empowering businesses with smart, efficient, and sustainable solutions.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-semibold text-[#d6b161]">Our Values</h3>
                            <ul className="space-y-2">
                                {[
                                    'Quality & Professional Integrity',
                                    'Industry Relevance',
                                    'Student-Centric Learning',
                                    'Continuous Skill Upgradation',
                                    'Career-Focused Outcomes'
                                ].map((val, i) => (
                                    <li key={i} className="flex items-center gap-2 text-gray-300 text-base">
                                        <span className="w-1.5 h-1.5 bg-[#d6b161] rounded-full flex-shrink-0" />
                                        <span>{val}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="mt-12 sm:mt-16 pt-8 border-t border-white/10 text-center">
                        <p className="text-sm font-semibold tracking-wide text-[#d6b161] uppercase mb-3">
                            Powered by SoVir Technologies LLP
                        </p>
                        <p className="text-gray-400 max-w-[65ch] mx-auto text-base leading-relaxed">
                            SoVir Skilling &
                            Training Center operates under SoVir Technologies LLP, a service-based company delivering technology solutions, automation services, digital platforms, and professional training. This strong industry foundation ensures our training remains relevant, credible, and future-ready.
                        </p>
                    </div>
                </div>
            </section>

            {/* --- START JOURNEY CTA --- */}
            <section id="start" className="py-20 sm:py-24 bg-gradient-to-b from-[#f8fafc] dark:from-gray-800 to-white dark:to-gray-900 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
                    whileInView={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="max-w-[65ch] mx-auto"
                >
                    <h2 className="text-4xl sm:text-5xl font-bold text-[#0a192f] dark:text-white mb-6 leading-tight">
                        Start Your Skill Journey With Us
                    </h2>
                    <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
                        Whether your goal is international language certification, industrial automation expertise, or career advancement, SoVir Skilling &
                        Training Center is your trusted partner for growth and success.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <span className="text-[#d6b161] font-bold tracking-widest uppercase text-sm">
                            📍 Learn. Automate. Communicate. Succeed.
                        </span>
                    </div>
                </motion.div>
            </section>

            <Footer />
        </div>
    );
};

export default AboutPage;