import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { internshipCatalogAPI } from '../lib/api';
import { formatInternshipPrice, type InternshipListing } from '../types/internship';

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

    return (
        <div className="min-h-screen bg-[#f6f4ef] dark:bg-[#0a192f]">
            <Header />

            <section className="relative overflow-hidden px-4 pb-16 pt-32">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(214,177,97,0.18),_transparent_42%),linear-gradient(180deg,rgba(10,25,47,0.03),transparent)] dark:bg-[radial-gradient(circle_at_top,_rgba(214,177,97,0.15),_transparent_36%)]" />
                <div className="absolute left-8 top-28 h-40 w-40 rounded-full bg-[#d6b161]/10 blur-3xl" />
                <div className="absolute bottom-0 right-8 h-52 w-52 rounded-full bg-[#0a192f]/10 blur-3xl dark:bg-[#d6b161]/10" />

                <div className="relative z-10 mx-auto max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0, y: -18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="mx-auto max-w-3xl text-center"
                    >
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#d6b161]/30 bg-white/80 px-4 py-1.5 text-sm font-semibold text-[#b38f3f] shadow-sm backdrop-blur dark:bg-[#112240]/80 dark:text-[#f0d28a]">
                            <Briefcase className="h-4 w-4" />
                            Internship Opportunities
                        </span>
                        <h1 className="mt-6 text-4xl font-bold leading-tight text-[#0a192f] dark:text-white sm:text-5xl lg:text-6xl">
                            Build real-world experience with
                            <span className="block bg-gradient-to-r from-[#d6b161] to-[#8b6f2c] bg-clip-text text-transparent">
                                internships that are now live from the backend
                            </span>
                        </h1>
                        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-300 sm:text-lg">
                            Explore the latest internship openings, review pricing and details, and apply directly to the role that fits your track.
                        </p>
                    </motion.div>
                </div>
            </section>

            <section className="px-4 pb-24">
                <div className="mx-auto max-w-7xl">
                    {loading ? (
                        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_-45px_rgba(10,25,47,0.45)] backdrop-blur dark:border-white/10 dark:bg-[#112240]"
                                >
                                    <div className="h-12 w-12 animate-pulse rounded-2xl bg-[#d6b161]/20" />
                                    <div className="mt-6 h-5 w-3/4 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
                                    <div className="mt-4 h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
                                    <div className="mt-5 h-10 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="rounded-[28px] border border-red-200 bg-red-50 px-6 py-12 text-center text-red-700 shadow-sm dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300">
                            {error}
                        </div>
                    ) : internships.length === 0 ? (
                        <div className="rounded-[28px] border border-gray-200 bg-white px-6 py-12 text-center text-gray-600 shadow-sm dark:border-gray-800 dark:bg-[#112240] dark:text-gray-300">
                            No internships are published yet. Add them from the admin panel and they will appear here automatically.
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                            {internships.map((internship, index) => {
                                const Icon = getInternshipIcon(internship);

                                return (
                                    <motion.article
                                        key={internship._id}
                                        initial={{ opacity: 0, y: 24 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: index * 0.05 }}
                                        className="group flex h-full flex-col rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(10,25,47,0.55)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-[#d6b161]/35 hover:shadow-[0_30px_90px_-48px_rgba(10,25,47,0.65)] dark:border-white/10 dark:bg-[#112240]/95 dark:hover:border-[#d6b161]/30"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0a192f] to-[#17345f] text-[#f7df9a] shadow-lg shadow-[#0a192f]/20 dark:from-[#d6b161]/20 dark:to-[#b38f3f]/10 dark:text-[#f3d78c]">
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <div className="rounded-2xl border border-[#d6b161]/20 bg-[#d6b161]/10 px-4 py-2 text-right">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b6f2c] dark:text-[#e5c978]">
                                                    Program Fee
                                                </p>
                                                <p className="mt-1 text-lg font-bold text-[#0a192f] dark:text-white">
                                                    {formatInternshipPrice(internship.price, internship.currency)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-6">
                                            <h2 className="text-xl font-bold leading-snug text-[#0a192f] transition-colors group-hover:text-[#8b6f2c] dark:text-white dark:group-hover:text-[#f0d28a]">
                                                {internship.title}
                                            </h2>
                                            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                                                {internship.shortDescription}
                                            </p>
                                        </div>

                                        <div className="mt-5 grid gap-3 rounded-2xl bg-[#f7f2e7] p-4 text-sm text-gray-700 dark:bg-[#0a192f] dark:text-gray-200">
                                            <div className="flex items-center gap-2">
                                                <Clock3 className="h-4 w-4 text-[#b38f3f]" />
                                                <span>{internship.duration}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-[#b38f3f]" />
                                                <span>{internship.location}</span>
                                            </div>
                                        </div>

                                        <div className="mt-5 flex flex-wrap gap-2">
                                            {internship.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="rounded-full border border-[#d6b161]/25 bg-[#d6b161]/10 px-3 py-1 text-xs font-semibold text-[#8b6f2c] dark:text-[#f0d28a]"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="mt-6 flex-1 rounded-2xl border border-dashed border-gray-200 px-4 py-3 text-sm leading-6 text-gray-600 dark:border-white/10 dark:text-gray-300">
                                            {internship.description}
                                        </div>

                                        <Link
                                            to={`/internship-application?slug=${encodeURIComponent(internship.slug)}`}
                                            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0a192f] px-5 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#122a4e] dark:bg-[#d6b161] dark:text-[#0a192f] dark:hover:bg-[#c9a653]"
                                        >
                                            Apply for Internship
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </motion.article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default CareersPage;
