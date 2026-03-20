import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
    ArrowRight,
    BarChart3,
    BrainCircuit,
    Briefcase,
    Cloud,
    Clock3,
    Code2,
    Cpu,
    Laptop2,
    MapPin,
    ShieldCheck,
    X,
    Monitor,
    Wifi
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { internshipCatalogAPI } from '../lib/api';
import {
    formatInternshipPrice,
    getInternshipBenefits,
    getInternshipResponsibilities,
    type InternshipListing,
} from '../types/internship';

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
    visible: (startHeavyAnimations: boolean = false) => ({
        opacity: 1,
        transition: startHeavyAnimations
            ? { staggerChildren: 0.1, delayChildren: 0.2 }
            : { duration: 0.3 }
    })
};

// Elevated Hero Background - Memoized and deferred for performance
const HeroBackground: React.FC<{ startAnimations: boolean }> = React.memo(({ startAnimations }) => {
    const shouldReduceMotion = useReducedMotion();
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, shouldReduceMotion ? 0 : 150]);
    const y2 = useTransform(scrollY, [0, 500], [0, shouldReduceMotion ? 0 : -150]);
    const opacity = useTransform(scrollY, [0, 500], [1, 0]);

    return (
        <motion.div
            style={{ opacity, contain: 'paint' }}
            className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
            aria-hidden="true"
        >
            {/* Static background immediately visible */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

            {/* Heavy animated layers deferred until after first paint */}
            {startAnimations && (
                <>
                    <motion.div
                        style={{ y: y1 }}
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-[10%] -right-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#d6b161]/20 to-cyan-500/10 blur-[120px]"
                    />
                    <motion.div
                        style={{ y: y2 }}
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[100px]"
                    />
                </>
            )}
        </motion.div>
    );
});

const getInternshipIcon = (internship: InternshipListing): LucideIcon => {
    const signal = `${internship.title} ${internship.tags.join(' ')}`.toLowerCase();

    if (signal.includes('ai') || signal.includes('machine learning')) return BrainCircuit;
    if (signal.includes('cyber')) return ShieldCheck;
    if (signal.includes('cloud') || signal.includes('devops')) return Cloud;
    if (signal.includes('data') || signal.includes('analytics')) return BarChart3;
    if (signal.includes('plc') || signal.includes('automation') || signal.includes('industrial')) return Cpu;
    if (signal.includes('support') || signal.includes('systems')) return Laptop2;
    if (signal.includes('software') || signal.includes('java') || signal.includes('python') || signal.includes('full stack') || signal.includes('web')) return Code2;
    return Briefcase;
};

const CareersPage: React.FC = () => {
    const [internships, setInternships] = useState<InternshipListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedInternship, setSelectedInternship] = useState<InternshipListing | null>(null);
    const [startHeavyAnimations, setStartHeavyAnimations] = useState(false);

    // Defer heavy animations until after first paint / idle
    useEffect(() => {
        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(() => {
                setStartHeavyAnimations(true);
            }, { timeout: 200 });
        } else {
            const id = requestAnimationFrame(() => {
                setStartHeavyAnimations(true);
            });
            return () => cancelAnimationFrame(id);
        }
    }, []);

    useEffect(() => {
        const fetchInternships = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await internshipCatalogAPI.getAll();
                setInternships(response.internships || []);
            } catch (err: unknown) {
                console.error('Failed to fetch internships:', err);
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.message || 'Failed to load internships right now.');
                } else {
                    setError('Failed to load internships right now.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchInternships();
    }, []);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (!selectedInternship) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [selectedInternship]);

    return (
        <div className="min-h-screen bg-[#f6f4ef] dark:bg-[#0a192f] transition-colors duration-300 flex flex-col">
            <Header />

            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1a365d] py-28 sm:py-36 text-center overflow-hidden flex-shrink-0">
                <HeroBackground startAnimations={startHeavyAnimations} />

                <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        custom={startHeavyAnimations}
                        className="mx-auto max-w-4xl flex flex-col items-center"
                    >
                        <motion.div variants={fadeInUp} className="mb-6 flex justify-center">
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#d6b161]/20 bg-[#d6b161]/10 px-4 py-1.5 text-sm font-semibold text-[#d6b161] backdrop-blur-sm">
                                <Briefcase className="h-4 w-4 fill-current" />
                                Now Hiring
                            </span>
                        </motion.div>

                        <motion.h1
                            variants={fadeInUp}
                            className="font-display mb-4 text-4xl md:text-5xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.2]"
                        >
                            Shape your future with <br className="hidden sm:block" />
                            <span className="bg-gradient-to-r from-[#d6b161] to-[#b38f3f] bg-clip-text text-transparent">
                                practical industry experience
                            </span>
                        </motion.h1>

                        <motion.p
                            variants={fadeInUp}
                            className="mx-auto mt-2 max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg"
                        >
                            Apply to curated roles built for professional growth, practical skills, and global career pathways.
                        </motion.p>
                    </motion.div>
                </div>
            </section>

            {/* Internships Grid */}
            <section className="px-4 pb-24 relative z-20 flex-1">
                <div className="mx-auto max-w-7xl">
                    {loading ? (
                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="rounded-3xl border border-white/60 bg-white/90 backdrop-blur p-6 shadow-sm dark:border-white/10 dark:bg-[#112240]"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="h-12 w-12 animate-pulse rounded-full bg-[#d6b161]/20 dark:bg-[#d6b161]/10" />
                                        <div className="h-8 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-white/5" />
                                    </div>
                                    <div className="h-4 w-32 animate-pulse rounded-full bg-gray-200 dark:bg-white/5 mb-3" />
                                    <div className="h-6 w-3/4 animate-pulse rounded-full bg-gray-200 dark:bg-white/5 mb-5" />
                                    <div className="flex gap-2 mb-6 border-t border-gray-100 dark:border-white/5 pt-4">
                                        <div className="h-4 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-white/5" />
                                        <div className="h-4 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-white/5" />
                                    </div>
                                    <div className="h-11 w-full animate-pulse rounded-xl bg-gray-200 dark:bg-white/5" />
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-12 text-center text-red-700 shadow-sm dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300">
                            {error}
                        </div>
                    ) : internships.length === 0 ? (
                        <div className="rounded-3xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-600 shadow-sm dark:border-gray-800 dark:bg-[#112240] dark:text-gray-300">
                            No internships are published yet. Check back later.
                        </div>
                    ) : (
                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                            {internships.map((internship, index) => {
                                const Icon = getInternshipIcon(internship);
                                
                                return (
                                    <motion.article
                                        key={internship._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: index * 0.05 }}
                                        className="group flex flex-col rounded-3xl border border-white/60 bg-white/90 p-6 backdrop-blur shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#d6b161]/50 hover:shadow-[0_0_40px_-10px_rgba(214,177,97,0.2)] dark:border-white/10 dark:bg-[#112240] dark:shadow-none"
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0a192f] text-[#d6b161] dark:bg-[#d6b161]/10 dark:text-[#d6b161] shadow-inner">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="rounded-full border border-[#d6b161]/30 bg-[#d6b161]/10 px-3 py-1.5 text-right">
                                                <p className="text-sm font-bold text-[#0a192f] dark:text-white">
                                                    {formatInternshipPrice(internship.price, internship.currency)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <span className="inline-block rounded-full border border-[#0a192f]/10 bg-[#0a192f]/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0a192f]/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70 mb-3">
                                                Professional Internship Track
                                            </span>
                                            <h2 className="text-xl font-bold leading-tight text-[#0a192f] dark:text-white transition-colors group-hover:text-[#8b6f2c] dark:group-hover:text-[#d6b161] line-clamp-2">
                                                {internship.title}
                                            </h2>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-5">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <Clock3 className="h-4 w-4 text-[#b38f3f]" />
                                                <span>{internship.duration}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <MapPin className="h-4 w-4 text-[#b38f3f]" />
                                                <span>{internship.location}</span>
                                            </div>
                                            {/* Example of optional mode field if present; typescript compilation will pass safely with cast if the field gets added later */}
                                            {(internship as any).mode && (
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    {(internship as any).mode.toLowerCase() === 'remote' ? (
                                                        <Wifi className="h-4 w-4 text-[#b38f3f]" />
                                                    ) : (
                                                        <Monitor className="h-4 w-4 text-[#b38f3f]" />
                                                    )}
                                                    <span className="capitalize">{(internship as any).mode}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex border-t border-gray-100 dark:border-white/5 pt-4 mb-6 flex-wrap gap-2">
                                            {internship.tags.slice(0, 4).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="rounded-full border border-[#d6b161]/25 bg-[#d6b161]/10 px-2.5 py-1 text-[11px] font-semibold text-[#8b6f2c] dark:text-[#f0d28a]"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                            {internship.tags.length > 4 && (
                                                <span className="rounded-full border border-[#d6b161]/25 bg-[#d6b161]/10 px-2.5 py-1 text-[11px] font-semibold text-[#8b6f2c] dark:text-[#f0d28a]">
                                                    +{internship.tags.length - 4}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-auto pt-2">
                                            <button
                                                onClick={() => setSelectedInternship(internship)}
                                                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-[#d6b161] bg-transparent py-2.5 text-sm font-bold text-[#b38f3f] dark:text-[#d6b161] transition-all hover:bg-[#d6b161] hover:text-[#0a192f] dark:hover:bg-[#d6b161] dark:hover:text-[#0a192f]"
                                            >
                                                Explore Internship
                                                <ArrowRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </motion.article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            <Footer />

            {/* Explore Modal */}
            <AnimatePresence>
                {selectedInternship && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedInternship(null)}
                            className="absolute inset-0 bg-[#0a192f]/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-3xl overflow-hidden flex flex-col rounded-[32px] bg-white shadow-2xl dark:bg-[#0a192f] border border-gray-200 dark:border-[#d6b161]/20 max-h-[90vh]"
                        >
                            {/* Modal Header/Scrollable Area */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-hide">
                                <button
                                    onClick={() => setSelectedInternship(null)}
                                    className="absolute top-5 right-5 md:top-7 md:right-7 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                                
                                <div className="mb-6 pr-12">
                                    <span className="inline-block rounded-full bg-[#d6b161]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-[#d6b161] mb-4 border border-[#d6b161]/20">
                                        Professional Internship Track
                                    </span>
                                    <h2 className="text-2xl md:text-3xl font-extrabold text-[#0a192f] dark:text-white leading-tight">
                                        {selectedInternship.title}
                                    </h2>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-700 dark:text-gray-300 mb-8 pb-6 border-b border-gray-100 dark:border-white/10">
                                    <div className="flex items-center gap-2 font-medium bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-white/5">
                                        <Clock3 className="h-4 w-4 text-[#d6b161]" />
                                        <span>{selectedInternship.duration}</span>
                                    </div>
                                    <div className="flex items-center gap-2 font-medium bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-white/5">
                                        <MapPin className="h-4 w-4 text-[#d6b161]" />
                                        <span>{selectedInternship.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 font-medium bg-[#d6b161]/10 px-3 py-1.5 rounded-lg border border-[#d6b161]/20 pb-[6px] pt-[6px]">
                                        <Briefcase className="h-4 w-4 text-[#d6b161]" />
                                        <span className="text-[#0a192f] dark:text-[#f0d28a] font-bold">
                                            {formatInternshipPrice(selectedInternship.price, selectedInternship.currency)}
                                        </span>
                                    </div>
                                    {(selectedInternship as any).mode && (
                                        <div className="flex items-center gap-2 font-medium bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-white/5">
                                            {(selectedInternship as any).mode.toLowerCase() === 'remote' ? (
                                                <Wifi className="h-4 w-4 text-[#d6b161]" />
                                            ) : (
                                                <Monitor className="h-4 w-4 text-[#d6b161]" />
                                            )}
                                            <span className="capitalize">{(selectedInternship as any).mode}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-10">
                                    {/* Description */}
                                    <div>
                                        <h3 className="text-lg font-bold text-[#0a192f] dark:text-white mb-3">Role Overview</h3>
                                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                                            {selectedInternship.description || selectedInternship.shortDescription}
                                        </p>
                                    </div>

                                    {/* Responsibilities */}
                                    <div>
                                        <h3 className="text-lg font-bold text-[#0a192f] dark:text-white mb-4">Key Responsibilities</h3>
                                        <ul className="space-y-4">
                                            {getInternshipResponsibilities(selectedInternship).map((item, i) => (
                                                <li key={i} className="flex gap-4 text-sm md:text-base text-gray-600 dark:text-gray-300 bg-gray-50/50 dark:bg-[#112240]/50 p-3 rounded-xl border border-transparent dark:border-white/5">
                                                    <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#d6b161]/20">
                                                        <span className="h-2 w-2 rounded-full bg-[#d6b161]" />
                                                    </span>
                                                    <span className="leading-relaxed font-medium">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Benefits */}
                                    <div>
                                        <h3 className="text-lg font-bold text-[#0a192f] dark:text-white mb-4">Benefits & Offerings</h3>
                                        <ul className="space-y-4">
                                            {getInternshipBenefits(selectedInternship).map((item, i) => (
                                                <li key={i} className="flex gap-4 text-sm md:text-base text-gray-600 dark:text-gray-300 bg-gray-50/50 dark:bg-[#112240]/50 p-3 rounded-xl border border-transparent dark:border-white/5">
                                                    <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#0a192f]/10 dark:bg-[#d6b161]/20">
                                                        <span className="h-2 w-2 rounded-full bg-[#0a192f] dark:bg-[#d6b161]" />
                                                    </span>
                                                    <span className="leading-relaxed font-medium">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Optional fields if they existed in the response */}
                                    {((selectedInternship as any).stipend || (selectedInternship as any).slots || (selectedInternship as any).deadline) && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-gray-100 dark:border-white/10 pt-8">
                                            {(selectedInternship as any).stipend && (
                                                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                                                    <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold mb-1">Stipend</p>
                                                    <p className="font-bold text-[#0a192f] dark:text-white">{(selectedInternship as any).stipend}</p>
                                                </div>
                                            )}
                                            {(selectedInternship as any).slots && (
                                                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                                                    <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold mb-1">Available Slots</p>
                                                    <p className="font-bold text-[#0a192f] dark:text-white">{(selectedInternship as any).slots}</p>
                                                </div>
                                            )}
                                            {(selectedInternship as any).deadline && (
                                                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                                                    <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold mb-1">Application Deadline</p>
                                                    <p className="font-bold text-[#0a192f] dark:text-white">{(selectedInternship as any).deadline}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Tags */}
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Tags & Technologies</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedInternship.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-1.5 text-[11px] font-bold text-gray-700 dark:text-gray-300"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Modal Footer */}
                            <div className="sticky bottom-0 z-20 border-t border-gray-100 dark:border-white/10 p-5 md:p-6 bg-white dark:bg-[#0a192f] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
                                <Link
                                    to={`/internship-application?slug=${encodeURIComponent(selectedInternship.slug)}`}
                                    onClick={() => setSelectedInternship(null)}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0a192f] dark:bg-[#d6b161] px-6 py-4 text-base font-bold text-white dark:text-[#0a192f] transition-all hover:bg-[#122a4e] dark:hover:bg-[#c9a653] hover:shadow-[0_0_20px_rgba(10,25,47,0.3)] dark:hover:shadow-[0_0_20px_rgba(214,177,97,0.4)]"
                                >
                                    Apply for Internship
                                    <ArrowRight className="h-5 w-5" />
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CareersPage;

