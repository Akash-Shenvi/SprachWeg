import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

// --- Theme Colors ---
// Navy: #0a192f
// Gold: #d6b161

// --- Animation Variants ---
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
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// --- Reusable Components ---

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
    Globe: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    ),
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
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 500], [0, 150]);
    const shouldReduceMotion = useReducedMotion();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans text-gray-800 dark:text-gray-200">
            <Header />

            {/* --- HERO SECTION --- */}
            <section className="relative min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden bg-[#0a192f] dark:bg-[#030810] text-white">
                {/* Parallax Background Band */}
                <motion.div
                    className="absolute inset-0 bg-[#0a192f] dark:bg-[#030810]"
                    style={{ y: shouldReduceMotion ? 0 : heroY }}
                >
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0a192f]/80 to-[#0a192f]" />
                </motion.div>

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10 w-full">
                    <motion.div
                        initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
                        animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-[65ch] mx-auto text-center"
                    >
                        <motion.span
                            className="inline-block text-[#d6b161] font-semibold tracking-wider text-sm uppercase mb-4"
                            initial={shouldReduceMotion ? {} : { opacity: 0 }}
                            animate={shouldReduceMotion ? {} : { opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            Learn. Automate. Communicate. Succeed.
                        </motion.span>
                        <motion.h1
                            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight"
                            initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
                            animate={shouldReduceMotion ? {} : { opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            About SoVir Skilling & Training Center
                        </motion.h1>
                        <motion.p
                            className="text-lg sm:text-xl text-gray-300 mb-8 font-light leading-relaxed"
                            initial={shouldReduceMotion ? {} : { opacity: 0 }}
                            animate={shouldReduceMotion ? {} : { opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            Empowering Global Careers Through Language, Skills & Automation
                        </motion.p>
                    </motion.div>
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
                            <span className="text-[#d6b161] font-bold tracking-wide uppercase text-sm">Who We Are</span>
                            <SectionHeading id="who-we-are">SoVir Training Academy</SectionHeading>
                            <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed text-base max-w-[65ch]">
                                <p>
                                    SoVir Training Academy, a professional training division of SoVir Technologies LLP, is committed to developing industry-ready professionals through foreign language training, automation technologies, and career-focused skill development.
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
                        {/* Languages */}
                        <motion.section
                            initial={shouldReduceMotion ? {} : "hidden"}
                            whileInView={shouldReduceMotion ? undefined : "visible"}
                            viewport={{ once: true }}
                            variants={sectionVariants}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-700"
                            aria-labelledby="languages-heading"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-[#e6f4ff] dark:bg-blue-900/30 rounded-lg text-[#0a192f] dark:text-blue-400" aria-hidden="true">
                                    <Icons.Globe />
                                </div>
                                <h3 id="languages-heading" className="text-2xl font-semibold text-[#0a192f] dark:text-white">
                                    Foreign Language Training
                                </h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-6 text-base">
                                We offer structured, internationally aligned language programs including:
                            </p>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                    {[
                                        { lang: 'English', level: 'Beginner to Advanced', students: '8,500+', price: '₹9,999', categories: 'Business & Academic' },
                                        { lang: 'German', level: 'A1, A2, B1, B2', students: '6,200+', price: '₹15,999', categories: 'TELC / Goethe' },
                                        { lang: 'Japanese', level: 'N5, N4, N3, N2, N1', students: '4,800+', price: '₹17,999', categories: 'JLPT Aligned' }
                                    ].map((l, i) => (
                                        <div key={i} className="h-full bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-[#d6b161] transition-colors">
                                            <div className="font-semibold text-[#0a192f] dark:text-white mb-1 text-lg">{l.lang}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{l.level}</div>
                                            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                <Icons.Users />
                                                <span>{l.students} students</span>
                                            </div>
                                            <div className="text-sm font-semibold text-[#d6b161] mb-1">{l.categories}</div>
                                            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Starting at {l.price}</div>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-[#0a192f] dark:text-white mb-3 text-base">Key focus areas:</h4>
                                    <ListWithIcon
                                        items={[
                                            'Speaking & pronunciation',
                                            'Grammar & vocabulary',
                                            'Listening, writing & comprehension',
                                            'Workplace and real-life communication'
                                        ]}
                                    />
                                </div>
                            </div>
                        </motion.section>

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
                                    PLC & Industrial Automation
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                        {/* Exam Prep */}
                        <motion.div
                            initial={shouldReduceMotion ? {} : "hidden"}
                            whileInView={shouldReduceMotion ? undefined : "visible"}
                            viewport={{ once: true }}
                            variants={itemVariants}
                        >
                            <div className="border-l-4 border-[#d6b161] pl-6 mb-8">
                                <h2 className="text-3xl sm:text-4xl font-semibold text-[#0a192f] dark:text-white">
                                    Exam Preparation & Certifications
                                </h2>
                            </div>
                            <div className="space-y-4 text-gray-700 dark:text-gray-300 text-base mb-6 max-w-[65ch]">
                                <p className="leading-relaxed">We provide exam-oriented training and guidance for:</p>
                                <ul className="space-y-2 ml-4">
                                    <li>• Goethe-Institut (German)</li>
                                    <li>• TELC</li>
                                    <li>• ÖSD</li>
                                    <li>• IELTS & English proficiency exams</li>
                                    <li>• Industrial & skill-based certifications</li>
                                </ul>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                                <h4 className="font-semibold text-[#0a192f] dark:text-white mb-3 text-base">Includes:</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
                                    <span>• Mock tests & assessments</span>
                                    <span>• Certification-aligned syllabus</span>
                                    <span>• Performance feedback</span>
                                    <span>• Confidence & exam strategy</span>
                                </div>
                            </div>
                        </motion.div>

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
                                At SoVir Training Academy, training is career-oriented, not just academic.
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
                        <SectionHeading id="why-choose" align="center">Why Choose SoVir Training Academy?</SectionHeading>
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
                                To deliver professional, practical, and globally relevant training that enables learners to succeed in international careers, industrial roles, and advanced technology domains.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-semibold text-[#d6b161]">Our Vision</h3>
                            <p className="text-gray-300 leading-relaxed text-base max-w-[65ch]">
                                To become a trusted and recognized training academy known for excellence in language education, PLC & automation training, and career development.
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
                            SoVir Training Academy operates under SoVir Technologies LLP, a service-based company delivering technology solutions, automation services, digital platforms, and professional training. This strong industry foundation ensures our training remains relevant, credible, and future-ready.
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
                        Whether your goal is international language certification, industrial automation expertise, or career advancement, SoVir Training Academy is your trusted partner for growth and success.
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