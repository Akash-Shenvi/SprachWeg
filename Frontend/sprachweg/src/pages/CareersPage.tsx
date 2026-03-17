import React, { useEffect, useRef } from 'react';
import { motion, useAnimation, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Briefcase, Clock, MapPin, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

interface Internship {
    title: string;
    description: string;
    duration: string;
    location: string;
    tags: string[];
    icon: string;
}

const internships: Internship[] = [
    {
        title: 'Software Development Intern',
        description: 'Work alongside our engineering team to build, test, and deploy real-world software solutions across multiple platforms.',
        duration: '3–6 Months',
        location: 'Remote / Hybrid / Onsite',
        tags: ['Software', 'Internship', 'Beginner Friendly'],
        icon: '💻',
    },
    {
        title: 'Web Development Intern (Frontend / Backend)',
        description: 'Gain hands-on experience building responsive web interfaces or robust server-side APIs using modern frameworks.',
        duration: '3–6 Months',
        location: 'Remote / Hybrid / Onsite',
        tags: ['Web Dev', 'React', 'Node.js'],
        icon: '🌐',
    },
    {
        title: 'Full Stack Development Intern',
        description: 'End-to-end development exposure — design APIs, build UI components, and integrate databases in a production environment.',
        duration: '3–6 Months',
        location: 'Remote / Hybrid / Onsite',
        tags: ['Full Stack', 'React', 'Node.js'],
        icon: '⚡',
    },
    {
        title: 'Python Programming Intern',
        description: 'Apply Python to automate workflows, process data, and contribute to scripting or backend service development.',
        duration: '3–6 Months',
        location: 'Remote / Hybrid / Onsite',
        tags: ['Python', 'Automation', 'Scripting'],
        icon: '🐍',
    },
    {
        title: 'Java Development Intern',
        description: 'Build enterprise-grade applications using Java and modern frameworks like Spring Boot in a collaborative team.',
        duration: '3–6 Months',
        location: 'Remote / Hybrid / Onsite',
        tags: ['Java', 'Spring Boot', 'OOP'],
        icon: '☕',
    },
    {
        title: 'Data Analytics Intern',
        description: 'Collect, clean, and analyze data to surface insights that drive business decisions using tools like Python, Excel, and Power BI.',
        duration: '3–6 Months',
        location: 'Remote / Hybrid / Onsite',
        tags: ['Data', 'Analytics', 'Power BI'],
        icon: '📊',
    },
    {
        title: 'Cloud Computing Intern',
        description: 'Get hands-on with cloud platforms (AWS, Azure, or GCP) — provision resources, deploy services, and learn cloud architecture.',
        duration: '3–6 Months',
        location: 'Remote / Hybrid / Onsite',
        tags: ['Cloud', 'AWS', 'DevOps'],
        icon: '☁️',
    },
    {
        title: 'Cyber Security Intern',
        description: 'Learn about threat detection, vulnerability assessments, and security best practices while working on real security tasks.',
        duration: '3–6 Months',
        location: 'Remote / Hybrid / Onsite',
        tags: ['Security', 'Networking', 'Ethical Hacking'],
        icon: '🔐',
    },
    {
        title: 'AI & Machine Learning Intern',
        description: 'Build and experiment with ML models, explore NLP and computer vision tasks, and work with real datasets and pipelines.',
        duration: '3–6 Months',
        location: 'Remote / Hybrid / Onsite',
        tags: ['AI', 'ML', 'Python', 'Deep Learning'],
        icon: '🤖',
    },
    {
        title: 'IT Support & Systems Intern',
        description: 'Support IT infrastructure, assist with helpdesk operations, and gain exposure to system administration and networking.',
        duration: '3–6 Months',
        location: 'Remote / Hybrid / Onsite',
        tags: ['IT Support', 'Networking', 'Systems'],
        icon: '🛠️',
    },
    {
        title: 'PLC Automation Engineer',
        description: 'Learn to design and program Programmable Logic Controllers (PLC) for industrial automation systems and processes.',
        duration: '3–6 Months',
        location: 'Remote / Hybrid / Onsite',
        tags: ['PLC', 'Automation', 'Industrial'],
        icon: '🤖',
    },
    {
        title: 'Controls & Automation Engineer',
        description: 'Gain experience in control systems engineering, implementing automated workflows for manufacturing and industrial applications.',
        duration: '3–6 Months',
        location: 'Remote / Hybrid / Onsite',
        tags: ['Controls', 'Automation', 'Engineering'],
        icon: '⚙️',
    },
    {
        title: 'PLC Programmer (Automation)',
        description: 'Focus on developing and troubleshooting PLC logic and HMI interfaces for complex industrial machinery.',
        duration: '3–6 Months',
        location: 'Remote / Hybrid / Onsite',
        tags: ['PLC', 'Programming', 'Automation'],
        icon: '💻',
    },
    {
        title: 'Industrial Automation Engineer',
        description: 'Explore the full lifecycle of industrial automation projects, from system design to testing and deployment onsite.',
        duration: '3–6 Months',
        location: 'Remote / Hybrid / Onsite',
        tags: ['Industrial', 'Automation', 'IIoT'],
        icon: '🏭',
    },
];

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
                className="absolute -top-[10%] -right-[10%] h-[600px] w-[600px] rounded-full bg-linear-to-br from-[#d6b161]/20 to-red-500/10 blur-[120px]"
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

const CareersPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a192f]">
            <Header />

            {/* Hero */}
            <section className="relative bg-linear-to-br from-[#0a192f] via-[#112240] to-[#1a365d] overflow-hidden py-28 sm:py-36 text-center">
                <HeroBackground />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimatedSection className="flex flex-col items-center text-center">
                        <motion.div variants={fadeInUp} className="mb-6 flex justify-center">
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#d6b161]/20 bg-[#d6b161]/10 px-4 py-1.5 text-sm font-semibold text-[#d6b161] backdrop-blur-sm">
                                <Briefcase className="h-4 w-4" />
                                Join Our Team
                            </span>
                        </motion.div>

                        <motion.h1
                            variants={fadeInUp}
                            className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold text-white mb-6 leading-tight"
                        >
                            Launch Your Career with a <br />
                            <span className="text-[#d6b161] relative">
                                Real Internship
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
                            We offer hands-on internship opportunities across tech disciplines. Gain real-world experience, work with industry professionals, and kickstart your career.
                        </motion.p>
                    </AnimatedSection>
                </div>
            </section>

            {/* Internship Cards */}
            <section className="pb-24 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {internships.map((internship, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: idx * 0.06 }}
                                className="group bg-white dark:bg-[#112240] rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6 flex flex-col gap-4 hover:shadow-xl hover:border-[#d6b161]/40 dark:hover:border-[#d6b161]/40 transition-all duration-300"
                            >
                                {/* Icon & Title */}
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 shrink-0 rounded-xl bg-[#d6b161]/10 flex items-center justify-center text-2xl group-hover:bg-[#d6b161]/20 transition-colors">
                                        {internship.icon}
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900 dark:text-white leading-snug group-hover:text-[#d6b161] transition-colors">
                                            {internship.title}
                                        </h2>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1">
                                    {internship.description}
                                </p>

                                {/* Meta info */}
                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {internship.duration}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {internship.location}
                                    </span>
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2">
                                    {internship.tags.map((tag, tIdx) => (
                                        <span
                                            key={tIdx}
                                            className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#d6b161]/10 text-[#d6b161]"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Apply button */}
                                <Link
                                    to={`/internship-application?internship=${encodeURIComponent(internship.title)}`}
                                    className="mt-auto w-full flex items-center justify-center gap-2 bg-[#d6b161] hover:bg-[#c4a055] active:scale-95 text-[#0a192f] font-semibold py-2.5 rounded-xl text-sm transition-all duration-200"
                                >
                                    Apply Now
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default CareersPage;
