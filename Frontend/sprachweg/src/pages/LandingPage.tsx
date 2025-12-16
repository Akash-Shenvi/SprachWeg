import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    Star,
    Globe,
    Play,
    GraduationCap,
    Zap
} from 'lucide-react';
import Button from '../components/ui/Button';
import { Header, Footer } from '../components/layout';
import { skillAPI } from '../lib/api';
import type { SkillCourse } from '../types/skill';

const LandingPage: React.FC = () => {
    const [skillCourses, setSkillCourses] = useState<SkillCourse[]>([]);
    const [loadingSkills, setLoadingSkills] = useState(true);

    useEffect(() => {
        const fetchSkillCourses = async () => {
            try {
                const data = await skillAPI.getAll();
                setSkillCourses(data);
            } catch (error) {
                console.error('Failed to fetch skill courses:', error);
            } finally {
                setLoadingSkills(false);
            }
        };

        fetchSkillCourses();
    }, []);

    const courses = [
        {
            level: 'A1',
            title: 'German A1 Complete',
            subtitle: "Beginner's Journey",
            price: '€299',
            originalPrice: '€399',
            rating: '4.9',
            students: '1,250',
            duration: '8 weeks',
            startDate: 'Jan 15, 2024',
            mode: 'Live',
            popular: true
        },
        {
            level: 'A2',
            title: 'German A2 Intensive',
            subtitle: "Build Fluency",
            price: '€349',
            originalPrice: '€449',
            rating: '4.8',
            students: '890',
            duration: '10 weeks',
            startDate: 'Jan 20, 2024',
            mode: 'Hybrid',
            popular: false
        },
        {
            level: 'B1',
            title: 'German B1 Professional',
            subtitle: "Workplace Ready",
            price: '€449',
            originalPrice: '€549',
            rating: '4.9',
            students: '670',
            duration: '12 weeks',
            startDate: 'Feb 1, 2024',
            mode: 'Live',
            popular: true
        }
    ];

    const partners = ['Goethe Institut', 'TELC', 'TestDaF', 'ÖSD', 'Make it in Germany', 'IHK'];

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a192f] transition-colors duration-300 font-sans">
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

                            <h1 className="font-serif text-5xl lg:text-7xl font-medium text-gray-900 dark:text-white leading-tight mb-6">
                                SoVir Akademie <br />
                                <span className="text-[#d6b161]">Skills, Languages</span> <br />
                                & Global Careers
                            </h1>

                            <p className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-4">
                                A Training & Career Services Division of SoVir Technologies LLP
                            </p>

                            <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 leading-relaxed max-w-xl">
                                A professional training academy empowering individuals with industry-ready skills, international language expertise, and global career opportunities through specialized skill development, language training, international exam preparation, and abroad placement support.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link to="/register">
                                    <Button className="bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] font-semibold px-8 py-6 text-lg rounded-full w-full sm:w-auto flex items-center justify-center gap-2">
                                        Start Learning
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                    </Button>
                                </Link>
                                <Link to="/consult">
                                    <Button variant="outline" className="border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 px-8 py-6 text-lg rounded-full w-full sm:w-auto flex items-center justify-center gap-2">
                                        <Play className="w-5 h-5" />
                                        Book Free Consultation
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="relative"
                        >
                            <div className="relative rounded-[2rem] overflow-hidden border-8 border-white dark:border-white/5 shadow-2xl">
                                <img
                                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80"
                                    alt="Students in library"
                                    className="w-full h-auto object-cover"
                                />

                                {/* Floating Cards */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="absolute top-8 left-[-1rem] lg:left-[-2rem] bg-[#1a2b4b] p-4 rounded-xl shadow-xl flex items-center gap-4 max-w-xs border border-white/10"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[#2a3b5b] flex items-center justify-center text-[#d6b161]">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">Goethe Certified</div>
                                        <div className="text-gray-400 text-xs">Exam Prep Program</div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                    className="absolute bottom-24 right-[-1rem] lg:right-[-2rem] bg-[#1a2b4b] p-4 rounded-xl shadow-xl flex items-center gap-4 max-w-xs border border-white/10"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[#d6b161]/20 flex items-center justify-center text-[#d6b161]">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">150+</div>
                                        <div className="text-gray-400 text-xs">Placements in Germany</div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.9 }}
                                    className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-4"
                                >
                                    <div className="w-12 h-12 rounded-full bg-[#d6b161] flex items-center justify-center text-[#0a192f]">
                                        <Play className="w-6 h-6 fill-current" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white font-medium">Live Class Starting</div>
                                        <div className="text-gray-300 text-xs">German A1 • 12 students joined</div>
                                    </div>
                                    <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-2 py-1 rounded-full">
                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                        <span className="text-xs font-bold">LIVE</span>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Partners Section */}
            <section className="py-10 border-t border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#0d1f3a]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-sm tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-8">Recognized & Partnered With</p>
                    <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-16">
                        {partners.map((partner, i) => (
                            <span key={i} className="text-xl lg:text-2xl font-serif font-bold text-gray-400 dark:text-gray-500 hover:text-[#d6b161] transition-colors cursor-default">
                                {partner}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Us Section */}
            <section id="about" className="py-24 bg-white dark:bg-[#0a192f]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <span className="text-[#d6b161] font-semibold text-sm tracking-widest uppercase">About Us</span>
                        <h2 className="font-serif text-4xl lg:text-5xl font-medium text-gray-900 dark:text-white mt-4 mb-6">
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
                            <h3 className="font-serif text-2xl font-semibold text-gray-900 dark:text-white mb-4">
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

                        {/* About SoVir Akademie */}
                        <div className="bg-gray-50 dark:bg-[#112240] rounded-[2rem] p-10 border border-gray-100 dark:border-white/5">
                            <div className="w-14 h-14 rounded-xl bg-[#d6b161]/10 flex items-center justify-center mb-6">
                                <GraduationCap className="w-7 h-7 text-[#d6b161]" />
                            </div>
                            <h3 className="font-serif text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                About SoVir Akademie
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                                SoVir Akademie is the training and education wing of SoVir Technologies LLP. Our academy is built to deliver practical learning, certification-oriented training, and career-focused guidance for students, working professionals, and international aspirants.
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
                                <h4 className="font-serif text-xl font-semibold text-gray-900 dark:text-white">Our Mission</h4>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                To provide high-quality training programs that enhance technical competence, language proficiency, and global employability.
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-[#d6b161]/10 to-transparent dark:from-[#d6b161]/5 rounded-2xl p-8 border border-[#d6b161]/20">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-[#d6b161] flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-[#0a192f]" />
                                </div>
                                <h4 className="font-serif text-xl font-semibold text-gray-900 dark:text-white">Our Vision</h4>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                To become a trusted academy for technology training, language education, and international career pathways.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Careers Abroad - Pathways Section */}
            <section id="careers" className="py-24 bg-[#0a192f]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <span className="text-[#d6b161] font-semibold text-sm tracking-widest uppercase">Careers Abroad</span>
                        <h2 className="font-serif text-4xl lg:text-5xl font-medium text-white mt-4 mb-6">
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
                                <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Ausbildung" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#112240] to-transparent"></div>
                                <div className="absolute top-6 left-6 w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                                    <GraduationCap className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="absolute bottom-6 left-6 font-serif text-2xl text-white">Ausbildung Programs</h3>
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

                                <Button className="w-full bg-white text-[#0a192f] hover:bg-gray-100 font-semibold rounded-xl">Learn More</Button>
                            </div>
                        </div>

                        {/* Nursing */}
                        <div className="bg-[#112240] rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:shadow-[#d6b161]/10 transition-all duration-300 border border-white/5 relative">
                            <div className="h-64 relative overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Nursing" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#112240] to-transparent"></div>
                                <div className="absolute top-6 left-6 w-12 h-12 rounded-xl bg-[#ff7e5f]/20 backdrop-blur-md flex items-center justify-center border border-[#ff7e5f]/20">
                                    <svg className="w-6 h-6 text-[#ff7e5f]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                                </div>
                                <h3 className="absolute bottom-6 left-6 font-serif text-2xl text-white">Nursing Pathway</h3>
                            </div>
                            <div className="p-8">
                                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                                    Fast-track to nursing career in Germany with recognition support and employer matching.
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

                                <Button className="w-full bg-white text-[#0a192f] hover:bg-gray-100 font-semibold rounded-xl">Learn More</Button>
                            </div>
                        </div>

                        {/* Direct Job */}
                        <div className="bg-[#112240] rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:shadow-[#d6b161]/10 transition-all duration-300 border border-white/5 relative">
                            <div className="h-64 relative overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Direct Job" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#112240] to-transparent"></div>
                                <div className="absolute top-6 left-6 w-12 h-12 rounded-xl bg-[#d6b161]/20 backdrop-blur-md flex items-center justify-center border border-[#d6b161]/20">
                                    <svg className="w-6 h-6 text-[#d6b161]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                </div>
                                <h3 className="absolute bottom-6 left-6 font-serif text-2xl text-white">Direct Job Placement</h3>
                            </div>
                            <div className="p-8">
                                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                                    Connect with German employers hiring international talent across various sectors.
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

                                <Button className="w-full bg-white text-[#0a192f] hover:bg-gray-100 font-semibold rounded-xl">Learn More</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Skill Training Services Section */}
            <section id="skill-training" className="py-24 bg-white dark:bg-[#0a192f]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <span className="text-[#d6b161] font-semibold text-sm tracking-widest uppercase">Skill Training</span>
                        <h2 className="font-serif text-4xl lg:text-5xl font-medium text-gray-900 dark:text-white mt-4 mb-6">
                            Industry-Ready Technical Training
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                            Practical, hands-on training programs combining theory with real-world applications
                        </p>
                    </div>

                    {/* Training Programs Grid - Dynamic */}
                    {loadingSkills ? (
                        <div className="flex justify-center py-12">
                            <div className="w-12 h-12 border-4 border-[#d6b161] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : skillCourses.length > 0 ? (
                        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
                            {skillCourses.slice(0, 3).map((course) => (
                                <div key={course._id} className="bg-white dark:bg-[#112240] rounded-[1.5rem] border border-gray-100 dark:border-white/5 hover:border-[#d6b161]/50 transition-all duration-300 group overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1">
                                    {/* Image Section */}
                                    <div className="relative h-64 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#112240] via-transparent to-transparent z-10 opacity-60" />
                                        {course.image ? (
                                            <img
                                                src={`http://localhost:5000/uploads/${course.image}`}
                                                alt={course.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                                                <GraduationCap className="w-16 h-16 text-gray-400" />
                                            </div>
                                        )}

                                        {/* Top Left Badges */}
                                        <div className="absolute top-4 left-4 z-20 flex gap-2">
                                            {course.level && (
                                                <div className="bg-[#d6b161] text-[#0a192f] text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md">
                                                    {course.level}
                                                </div>
                                            )}
                                            {course.popular && (
                                                <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-md">
                                                    <Zap className="w-3 h-3 fill-current" />
                                                    Popular
                                                </div>
                                            )}
                                        </div>

                                        {/* Bottom Left Overlay */}
                                        <div className="absolute bottom-4 left-4 z-20">
                                            {course.mode === 'Live' && (
                                                <div className="bg-[#0a192f]/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-white/10">
                                                    <Play className="w-3 h-3 fill-current" />
                                                    Live
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content Section */}
                                    <div className="p-6 relative">
                                        {/* Rating Row */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <Star className="w-4 h-4 text-[#d6b161] fill-current" />
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{course.rating || '4.8'}</span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">({course.students || '0'} students)</span>
                                        </div>

                                        {/* Title & Subtitle */}
                                        <h3 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-[#d6b161] transition-colors">
                                            {course.title}
                                        </h3>
                                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-5 block">
                                            {course.subtitle || 'Beginner\'s Journey'}
                                        </p>

                                        {/* Metadata Row */}
                                        <div className="flex items-center gap-6 text-xs font-medium text-gray-500 dark:text-gray-400 mb-6 pb-6 border-b border-gray-100 dark:border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#d6b161]" />
                                                {course.duration || '8 weeks'}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#d6b161]" />
                                                {course.startDate || 'Jan 15, 2024'}
                                            </div>
                                        </div>

                                        {/* Features List */}
                                        <div className="space-y-3 mb-8">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="w-5 h-5 text-[#d6b161] flex-shrink-0" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Live interactive sessions</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="w-5 h-5 text-[#d6b161] flex-shrink-0" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">1-on-1 speaking practice</span>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-2">
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                                        {course.price || '€299'}
                                                    </span>
                                                    {course.originalPrice && (
                                                        <span className="text-sm text-gray-400 line-through decoration-gray-500">
                                                            {course.originalPrice}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-400 hidden sm:block">All inclusive</span>
                                            </div>
                                            <Button className="bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transform transition-all active:scale-95">
                                                Enroll
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-600 dark:text-gray-400">No skill courses available yet.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Language Training Services Section */}
            <section id="language-training" className="py-24 bg-gray-50 dark:bg-[#0d1f3a]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <span className="text-[#d6b161] font-semibold text-sm tracking-widest uppercase">Language Training</span>
                        <h2 className="font-serif text-4xl lg:text-5xl font-medium text-gray-900 dark:text-white mt-4 mb-6">
                            Master Global Languages
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                            Comprehensive language programs for academic, professional, and international opportunities
                        </p>
                    </div>

                    {/* German Language - Flagship */}
                    <div className="bg-white dark:bg-[#112240] rounded-[2rem] p-10 mb-8 border-2 border-[#d6b161]/30 relative overflow-hidden">
                        <div className="absolute top-4 right-4 bg-[#d6b161] text-[#0a192f] px-4 py-1 rounded-full text-sm font-semibold">
                            Flagship Program
                        </div>
                        <div className="flex items-start gap-6 mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-[#d6b161]/10 flex items-center justify-center flex-shrink-0">
                                <Globe className="w-8 h-8 text-[#d6b161]" />
                            </div>
                            <div>
                                <h3 className="font-serif text-3xl font-semibold text-gray-900 dark:text-white mb-2">German Language Training</h3>
                                <p className="text-gray-600 dark:text-gray-400">Complete A1 to B2 certification program with exam preparation</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-gray-50 dark:bg-[#0a192f] p-4 rounded-xl text-center">
                                <div className="text-[#d6b161] font-semibold mb-2">Levels Offered</div>
                                <div className="text-gray-900 dark:text-white font-medium">A1, A2, B1, B2</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-[#0a192f] p-4 rounded-xl text-center">
                                <div className="text-[#d6b161] font-semibold mb-2">Class Formats</div>
                                <div className="text-gray-900 dark:text-white font-medium">Individual & Group</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-[#0a192f] p-4 rounded-xl text-center">
                                <div className="text-[#d6b161] font-semibold mb-2">Learning Mode</div>
                                <div className="text-gray-900 dark:text-white font-medium">Online & Offline</div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 justify-center">
                                    <CheckCircle className="w-4 h-4 text-[#d6b161]" />
                                    <span>Intensive speaking sessions</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 justify-center">
                                    <CheckCircle className="w-4 h-4 text-[#d6b161]" />
                                    <span>Grammar & vocabulary focus</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 justify-center">
                                    <CheckCircle className="w-4 h-4 text-[#d6b161]" />
                                    <span>Exam-oriented preparation</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 justify-center">
                                    <CheckCircle className="w-4 h-4 text-[#d6b161]" />
                                    <span>Regular assessments & feedback</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Other Languages */}
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-[#112240] p-6 rounded-2xl border border-gray-100 dark:border-white/5">
                            <div className="w-12 h-12 rounded-xl bg-[#d6b161]/10 flex items-center justify-center mb-4">
                                <Globe className="w-6 h-6 text-[#d6b161]" />
                            </div>
                            <h3 className="font-serif text-xl font-semibold text-gray-900 dark:text-white mb-3">English Language</h3>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#d6b161] mt-0.5" /> Spoken English</li>
                                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#d6b161] mt-0.5" /> Business English</li>
                                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#d6b161] mt-0.5" /> Interview Preparation</li>
                            </ul>
                        </div>

                        <div className="bg-white dark:bg-[#112240] p-6 rounded-2xl border border-gray-100 dark:border-white/5">
                            <div className="w-12 h-12 rounded-xl bg-[#d6b161]/10 flex items-center justify-center mb-4">
                                <Globe className="w-6 h-6 text-[#d6b161]" />
                            </div>
                            <h3 className="font-serif text-xl font-semibold text-gray-900 dark:text-white mb-3">French Language</h3>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#d6b161] mt-0.5" /> Beginner to Advanced</li>
                                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#d6b161] mt-0.5" /> Conversational French</li>
                                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#d6b161] mt-0.5" /> Written French</li>
                            </ul>
                        </div>

                        <div className="bg-white dark:bg-[#112240] p-6 rounded-2xl border border-gray-100 dark:border-white/5">
                            <div className="w-12 h-12 rounded-xl bg-[#d6b161]/10 flex items-center justify-center mb-4">
                                <Globe className="w-6 h-6 text-[#d6b161]" />
                            </div>
                            <h3 className="font-serif text-xl font-semibold text-gray-900 dark:text-white mb-3">Japanese Language</h3>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#d6b161] mt-0.5" /> Basic to Intermediate</li>
                                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#d6b161] mt-0.5" /> Career-focused Training</li>
                                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#d6b161] mt-0.5" /> Cultural Context</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Exam Preparation Section */}
            <section id="exam-prep" className="py-24 bg-white dark:bg-[#0a192f]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="text-[#d6b161] font-semibold text-sm tracking-widest uppercase">Exam Prepar

                            ation</span>
                        <h2 className="font-serif text-4xl lg:text-5xl font-medium text-gray-900 dark:text-white mt-4 mb-6">
                            International Exam Coaching
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                            Structured coaching and mock test preparation for globally recognized language exams
                        </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-[#112240] rounded-[2rem] p-10 border border-gray-100 dark:border-white/5">
                        <div className="grid md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <h3 className="font-serif text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">Exams Covered</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white dark:bg-[#0a192f] p-4 rounded-xl text-center">
                                        <div className="text-[#d6b161] font-semibold">TELC</div>
                                        <div className="text-xs text-gray-500">A1 to B2</div>
                                    </div>
                                    <div className="bg-white dark:bg-[#0a192f] p-4 rounded-xl text-center">
                                        <div className="text-[#d6b161] font-semibold">Goethe</div>
                                        <div className="text-xs text-gray-500">Institut Exams</div>
                                    </div>
                                    <div className="bg-white dark:bg-[#0a192f] p-4 rounded-xl text-center">
                                        <div className="text-[#d6b161] font-semibold">TestDaF</div>
                                        <div className="text-xs text-gray-500">University Entry</div>
                                    </div>
                                    <div className="bg-white dark:bg-[#0a192f] p-4 rounded-xl text-center">
                                        <div className="text-[#d6b161] font-semibold">ÖSD</div>
                                        <div className="text-xs text-gray-500">Austrian Exam</div>
                                    </div>
                                    <div className="bg-white dark:bg-[#0a192f] p-4 rounded-xl text-center">
                                        <div className="text-[#d6b161] font-semibold">IELTS</div>
                                        <div className="text-xs text-gray-500">English Proficiency</div>
                                    </div>
                                    <div className="bg-white dark:bg-[#0a192f] p-4 rounded-xl text-center">
                                        <div className="text-[#d6b161] font-semibold">Others</div>
                                        <div className="text-xs text-gray-500">On Request</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-serif text-2xl font-semibold text-gray-900 dark:text-white mb-6">Preparation Includes</h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-[#d6b161] mt-0.5 flex-shrink-0" />
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">Exam Pattern Guidance</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Detailed breakdown of exam structure</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-[#d6b161] mt-0.5 flex-shrink-0" />
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">Practice Tests & Evaluations</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Regular mock tests with feedback</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-[#d6b161] mt-0.5 flex-shrink-0" />
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">Speaking & Writing Assessments</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">One-on-one evaluation sessions</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-[#d6b161] mt-0.5 flex-shrink-0" />
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">Time Management Strategies</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Techniques for optimal performance</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-24 bg-white dark:bg-[#0a192f] overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="text-[#d6b161] font-medium mb-2 block">Success Stories</span>
                        <h2 className="font-serif text-4xl lg:text-5xl font-medium text-gray-900 dark:text-white mb-6">Hear From Our Students</h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Join thousands of successful learners who have transformed their careers through our German language and career programs.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="bg-[#fcf8f1] dark:bg-[#112240] p-12 rounded-[2rem] border border-[#d6b161]/20 relative">
                            <div className="text-[#d6b161]/20 absolute top-8 left-8">
                                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.05 17.07 15 17.07 13.01C17.07 10 16.53 10 16 10C13.55 10 12.002 12.19 12.002 14L12.002 2H10.003L10.003 14C10.003 20 16.037 21 16.037 21H14.017ZM8.01 21L8.01 18C8.01 16.05 11.07 15 11.07 13.01C11.07 10 10.53 10 10.002 10C7.552 10 6.004 12.19 6.004 14L6.004 2H4.004L4.004 14C4.004 20 10.038 21 10.038 21H8.01Z"></path></svg>
                            </div>
                            <div className="relative z-10">
                                <p className="font-serif text-xl lg:text-2xl text-gray-800 dark:text-gray-200 leading-relaxed mb-8">
                                    "SoVir Akademie transformed my career. From zero German to B2 in 10 months, and now I'm working as a nurse in Berlin. The live classes were engaging, and the career support was exceptional."
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full overflow-hidden">
                                        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80" alt="Student" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white">Priya Sharma</div>
                                        <div className="text-sm text-gray-500">Registered Nurse, Berlin</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="bg-white dark:bg-[#112240] p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-white/5 mb-8 transform -rotate-2">
                                <div className="text-[#d6b161] text-sm font-bold tracking-widest uppercase mb-2">Program Completed</div>
                                <h3 className="font-serif text-2xl text-gray-900 dark:text-white">German B2 + Nursing Pathway</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" alt="Student 1" className="w-full h-40 object-cover rounded-2xl border-4 border-white dark:border-[#112240] shadow-lg transform translate-y-4" />
                                <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" alt="Student 2" className="w-full h-40 object-cover rounded-2xl border-4 border-white dark:border-[#112240] shadow-lg" />
                                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" alt="Student 3" className="w-full h-40 object-cover rounded-2xl border-4 border-white dark:border-[#112240] shadow-lg transform -translate-y-4" />
                                <div className="w-full h-40 bg-gray-100 dark:bg-[#112240] rounded-2xl border-4 border-white dark:border-[#112240] shadow-lg flex items-center justify-center">
                                    <span className="text-[#d6b161] font-bold text-xl">+1500</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Courses */}
            <section className="py-24 bg-white dark:bg-[#0a192f]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="text-[#d6b161] font-medium mb-2 block">Our Programs</span>
                        <h2 className="font-serif text-4xl lg:text-5xl font-medium text-gray-900 dark:text-white mb-4">Featured Courses</h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8">
                            Choose from our expertly designed German language courses, from beginner A1 to advanced B2 levels.
                        </p>

                        <div className="inline-flex gap-2 bg-gray-100 dark:bg-white/5 p-1 rounded-full">
                            <button className="px-6 py-2 bg-[#d6b161] text-[#0a192f] rounded-full text-sm font-semibold shadow-lg">All Courses</button>
                            <button className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-white transition-colors text-sm font-medium">Live Classes</button>
                            <button className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-white transition-colors text-sm font-medium">Hybrid</button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {courses.map((course, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white dark:bg-[#112240] rounded-[2rem] border border-gray-100 dark:border-white/5 overflow-hidden hover:border-[#d6b161]/50 transition-colors group shadow-lg dark:shadow-none"
                            >
                                <div className="h-48 relative overflow-hidden bg-gray-200 dark:bg-gray-800">
                                    <img
                                        src={[
                                            "https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                                            "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                                            "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                                        ][index % 3]}
                                        alt={course.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        <span className="bg-[#d6b161] text-[#0a192f] text-xs font-bold px-3 py-1 rounded-full">
                                            {course.level}
                                        </span>
                                        {course.popular && (
                                            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" /></svg>
                                                Popular
                                            </span>
                                        )}
                                    </div>
                                    <div className="absolute bottom-4 left-4">
                                        <span className="bg-[#0a192f]/80 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                                            <Play className="w-3 h-3 fill-current" />
                                            {course.mode}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-8">
                                    <div className="flex items-center gap-2 mb-2 text-sm text-yellow-400">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="font-bold text-gray-900 dark:text-white">{course.rating}</span>
                                        <span className="text-gray-500 dark:text-gray-400">({course.students} students)</span>
                                    </div>
                                    <h3 className="font-serif text-2xl font-medium text-gray-900 dark:text-white mb-1 group-hover:text-[#d6b161] transition-colors">{course.title}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{course.subtitle}</p>

                                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#d6b161]"></div>
                                            {course.duration}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#d6b161]"></div>
                                            {course.startDate}
                                        </div>
                                    </div>

                                    <ul className="space-y-2 mb-8">
                                        <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <CheckCircle className="w-4 h-4 text-[#d6b161]" />
                                            Live interactive sessions
                                        </li>
                                        <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <CheckCircle className="w-4 h-4 text-[#d6b161]" />
                                            1-on-1 speaking practice
                                        </li>
                                    </ul>

                                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-100 dark:border-white/5">
                                        <div>
                                            <span className="text-2xl font-bold text-gray-900 dark:text-white block">{course.price}</span>
                                            <span className="text-sm text-gray-400 line-through">{course.originalPrice}</span>
                                        </div>
                                        <Link to="/register">
                                            <Button className="bg-[#1a2b4b] dark:bg-[#d6b161] text-white dark:text-[#0a192f] hover:bg-[#2a3b5b] dark:hover:bg-[#c4a055] rounded-full px-6 py-2 text-sm font-semibold">
                                                Enroll
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default LandingPage;
