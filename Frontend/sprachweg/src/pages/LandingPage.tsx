import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    Star,
    Globe,
    Play,
    GraduationCap,
    Zap,
    Users,
    BookOpen,
    ArrowRight
} from 'lucide-react';
import Button from '../components/ui/Button';
import { Header, Footer } from '../components/layout';
import { skillAPI } from '../lib/api';
import type { SkillCourse } from '../types/skill';
import BookingForm from '../components/ui/BookingForm';
import EnrollmentModal from '../components/ui/EnrollmentModal';

const LandingPage: React.FC = () => {
    const [skillCourses, setSkillCourses] = useState<SkillCourse[]>([]);
    const [loadingSkills, setLoadingSkills] = useState(true);
    const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
    const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);

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

    // Language cards data from LanguageTraining
    const featuredCourses = [
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
            route: '/training/english'
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
            price: '₹17,999',
            bgColor: 'bg-pink-50 dark:bg-pink-950/30',
            borderColor: 'border-pink-200 dark:border-pink-800',
            route: '/training/japanese'
        }
    ];

    // Star Rating Component (inline for LandingPage)
    const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${star <= Math.floor(rating)
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

    const partners = ['TELC / Goethe', 'ÖSD', 'IELTS'];

    // Helper for formatting price
    const formatPrice = (val: string | number) => {
        if (!val) return '₹0';
        if (String(val).includes('₹') || String(val).includes('$') || String(val).includes('€')) return val;
        return `₹${Number(val).toLocaleString('en-IN')}`;
    };

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

                            <h1 className="font-sans text-5xl lg:text-7xl font-medium text-gray-900 dark:text-white leading-tight mb-6">
                                SoVir Academy <br />
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
                                <Button
                                    onClick={() => setIsEnrollmentModalOpen(true)}
                                    className="bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] font-semibold px-8 py-6 text-lg rounded-full w-full sm:w-auto flex items-center justify-center gap-2"
                                >
                                    Start Learning
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                </Button>
                                <Button
                                    onClick={() => setIsBookingFormOpen(true)}
                                    variant="outline"
                                    className="border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 px-8 py-6 text-lg rounded-full w-full sm:w-auto flex items-center justify-center gap-2"
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
                            <span key={i} className="text-xl lg:text-2xl font-sans font-bold text-gray-400 dark:text-gray-500 hover:text-[#d6b161] transition-colors cursor-default">
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

                        {/* About SoVir Academy */}
                        <div className="bg-gray-50 dark:bg-[#112240] rounded-[2rem] p-10 border border-gray-100 dark:border-white/5">
                            <div className="w-14 h-14 rounded-xl bg-[#d6b161]/10 flex items-center justify-center mb-6">
                                <GraduationCap className="w-7 h-7 text-[#d6b161]" />
                            </div>
                            <h3 className="font-sans text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                About SoVir Academy
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                                SoVir Academy is the training and education wing of SoVir Technologies LLP. Our academy is built to deliver practical learning, certification-oriented training, and career-focused guidance for students, working professionals, and international aspirants.
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
                                To provide high-quality training programs that enhance technical competence, language proficiency, and global employability.
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
                                <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Ausbildung" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
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
                        <h2 className="font-sans text-4xl lg:text-5xl font-medium text-gray-900 dark:text-white mt-4 mb-6">
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
                                <div key={course._id} className="bg-white dark:bg-[#112240] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden group hover:shadow-lg transition-all duration-300 hover:border-[#d6b161]/50 animate-fade-in flex flex-col h-full">
                                    {/* Image Area */}
                                    <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
                                        {course.image ? (
                                            <img
                                                src={`http://localhost:5000/uploads/${course.image}`}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-300">
                                                <div className="text-center">
                                                    <div className="mb-2 text-4xl">🎓</div>
                                                    <span className="text-xs font-medium uppercase tracking-wider">No Image</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Floating Badges */}
                                        {course.popular && (
                                            <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                                                Popular
                                            </div>
                                        )}
                                        {course.level && (
                                            <div className="absolute top-4 right-4 bg-[#d6b161] text-[#0a192f] text-xs font-bold px-3 py-1 rounded-full shadow-md">
                                                {course.level}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-6 flex-1 flex flex-col">
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
                                            <Button
                                                onClick={() => setIsEnrollmentModalOpen(true)}
                                                className="bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] text-sm font-bold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
                                            >
                                                Enroll Now
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
                        <h2 className="font-sans text-4xl lg:text-5xl font-medium text-gray-900 dark:text-white mt-4 mb-6">
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
                                <h3 className="font-sans text-3xl font-semibold text-gray-900 dark:text-white mb-2">German Language Training</h3>
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
                            <h3 className="font-sans text-xl font-semibold text-gray-900 dark:text-white mb-3">English Language</h3>
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
                            <h3 className="font-sans text-xl font-semibold text-gray-900 dark:text-white mb-3">German Language</h3>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#d6b161] mt-0.5" /> Beginner to Advanced</li>
                                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#d6b161] mt-0.5" /> Conversational German</li>
                                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[#d6b161] mt-0.5" /> Written German</li>
                            </ul>
                        </div>

                        <div className="bg-white dark:bg-[#112240] p-6 rounded-2xl border border-gray-100 dark:border-white/5">
                            <div className="w-12 h-12 rounded-xl bg-[#d6b161]/10 flex items-center justify-center mb-4">
                                <Globe className="w-6 h-6 text-[#d6b161]" />
                            </div>
                            <h3 className="font-sans text-xl font-semibold text-gray-900 dark:text-white mb-3">Japanese Language</h3>
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
                        <h2 className="font-sans text-4xl lg:text-5xl font-medium text-gray-900 dark:text-white mt-4 mb-6">
                            International Exam Coaching
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                            Structured coaching and mock test preparation for globally recognized language exams
                        </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-[#112240] rounded-[2rem] p-10 border border-gray-100 dark:border-white/5">
                        <div className="grid md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <h3 className="font-sans text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">Exams Covered</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white dark:bg-[#0a192f] p-4 rounded-xl text-center">
                                        <div className="text-[#d6b161] font-semibold">TELC / Goethe</div>
                                        <div className="text-xs text-gray-500">Institut Exams</div>
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
                                <h3 className="font-sans text-2xl font-semibold text-gray-900 dark:text-white mb-6">Preparation Includes</h3>
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



            {/* Featured Courses */}
            <section className="py-24 bg-white dark:bg-[#0a192f]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="text-[#d6b161] font-medium mb-2 block">Our Programs</span>
                        <h2 className="font-sans text-4xl lg:text-5xl font-medium text-gray-900 dark:text-white mb-4">Featured Courses</h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8">
                            Start your journey with our expert-led language training programs.
                        </p>


                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuredCourses.map((course, index) => (
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
                                    {/* Country Code Overlay */}

                                </div>
                                <div className="p-8">
                                    <h3 className="font-sans text-2xl font-bold text-center text-gray-900 dark:text-white mb-6 group-hover:text-[#d6b161] transition-colors">{course.title}</h3>

                                    {/* Stats Row */}
                                    <div className="flex items-center justify-center gap-6 text-sm text-gray-700 dark:text-gray-300 mb-6">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-4 h-4 text-[#d6b161]" />
                                            <span className="font-medium">{course.students} students</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <BookOpen className="w-4 h-4 text-[#d6b161]" />
                                            <span className="font-medium">{course.courses} courses</span>
                                        </div>
                                    </div>

                                    {/* Rating */}
                                    <div className="flex items-center justify-center gap-2 mb-6">
                                        <StarRating rating={course.rating} />
                                        <span className="text-sm font-semibold text-[#0a192f] dark:text-white">{course.rating}</span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">({course.reviews} reviews)</span>
                                    </div>

                                    {/* Levels */}
                                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                                        {course.levels.map((level) => (
                                            <span
                                                key={level}
                                                className="px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/5"
                                            >
                                                {level}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-100 dark:border-white/5">
                                        <div>
                                            <span className="text-xs font-medium text-gray-500 block mb-1">Starting at</span>
                                            <span className="text-2xl font-bold text-gray-900 dark:text-white block">{course.price}</span>
                                        </div>
                                        <Link to={course.route}>
                                            <Button className="bg-[#1a2b4b] dark:bg-[#d6b161] text-white dark:text-[#0a192f] hover:bg-[#2a3b5b] dark:hover:bg-[#c4a055] rounded-lg px-6 py-2.5 text-sm font-bold flex items-center gap-2">
                                                Explore
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Modals */}
            <BookingForm
                isOpen={isBookingFormOpen}
                onClose={() => setIsBookingFormOpen(false)}
            />
            <EnrollmentModal
                isOpen={isEnrollmentModalOpen}
                onClose={() => setIsEnrollmentModalOpen(false)}
                origin="german"
            />

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default LandingPage;
