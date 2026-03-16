import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Clock, MapPin, ChevronRight } from 'lucide-react';
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

const CareersPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a192f]">
            <Header />

            {/* Hero */}
            <section className="pt-32 pb-16 px-4 relative overflow-hidden">
                {/* Background gradient blobs */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#d6b161]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#d6b161]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-flex items-center gap-2 bg-[#d6b161]/10 text-[#d6b161] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                            <Briefcase className="w-4 h-4" />
                            Join Our Team
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight"
                    >
                        Launch Your Career with a{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d6b161] to-[#c4a055]">
                            Real Internship
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
                    >
                        We offer hands-on internship opportunities across tech disciplines. Gain real-world experience, work with industry professionals, and kickstart your career.
                    </motion.p>
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
                                    <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-[#d6b161]/10 flex items-center justify-center text-2xl group-hover:bg-[#d6b161]/20 transition-colors">
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
                                <button
                                    type="button"
                                    className="mt-auto w-full flex items-center justify-center gap-2 bg-[#d6b161] hover:bg-[#c4a055] active:scale-95 text-[#0a192f] font-semibold py-2.5 rounded-xl text-sm transition-all duration-200"
                                >
                                    Apply Now
                                    <ChevronRight className="w-4 h-4" />
                                </button>
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
