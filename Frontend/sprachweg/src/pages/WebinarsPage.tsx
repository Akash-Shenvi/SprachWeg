import React, { useEffect, useState } from 'react';
import { ArrowRight, Calendar, Clock3, Radio, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EnrollmentModal from '../components/ui/EnrollmentModal';
import Footer from '../components/layout/Footer';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { webinarCatalogAPI } from '../lib/api';
import type { WebinarListing } from '../types/webinar';
import { formatWebinarDateTime, formatWebinarPrice } from '../types/webinar';

type FeedbackState =
    | { type: 'success' | 'error'; message: string }
    | null;

const WebinarsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [webinars, setWebinars] = useState<WebinarListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<FeedbackState>(null);
    const [submittedWebinarIds] = useState<string[]>([]);
    const [selectedWebinar, setSelectedWebinar] = useState<WebinarListing | null>(null);
    const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);

    useEffect(() => {
        const fetchWebinars = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await webinarCatalogAPI.getAll();
                setWebinars(response.webinars || []);
            } catch (err: any) {
                console.error('Failed to fetch webinars:', err);
                setError(err.response?.data?.message || 'Failed to load webinars right now.');
            } finally {
                setLoading(false);
            }
        };

        void fetchWebinars();
    }, []);

    const handleRegister = (webinar: WebinarListing) => {
        if (!user) {
            navigate(`/login?redirect=${encodeURIComponent('/webinars')}`);
            return;
        }

        setFeedback(null);
        setSelectedWebinar(webinar);
        setIsEnrollmentOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#f6f4ef] text-[#0a192f] dark:bg-[#0a192f] dark:text-white">
            <Header />

            <section className="relative overflow-hidden bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1a365d] py-28 text-white sm:py-36">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d6b161]/30 bg-[#d6b161]/10 px-4 py-1.5 text-sm font-semibold text-[#d6b161]">
                            <Radio className="h-4 w-4" />
                            Live Webinar Series
                        </div>
                        <h1 className="text-4xl font-bold leading-tight md:text-5xl">
                            Join premium webinars built for real-world learning
                        </h1>
                        <p className="mt-4 max-w-2xl text-lg text-gray-300">
                            Register online, complete secure payment, and access your approved webinars from the student dashboard.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4 text-sm text-gray-300">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                                <ShieldCheck className="h-4 w-4 text-[#d6b161]" />
                                Hosted payment checkout
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                                <Clock3 className="h-4 w-4 text-[#d6b161]" />
                                Approval-first access
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                {feedback && (
                    <div
                        className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-medium ${
                            feedback.type === 'success'
                                ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300'
                                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300'
                        }`}
                    >
                        {feedback.message}
                    </div>
                )}

                {loading ? (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="animate-pulse rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#112240]">
                                <div className="h-6 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                                <div className="mt-4 h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
                                <div className="mt-2 h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
                                <div className="mt-8 h-10 w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                        {error}
                    </div>
                ) : webinars.length === 0 ? (
                    <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-[#112240]">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">No webinars are live right now</h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            New webinars will appear here as soon as the team publishes them.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {webinars.map((webinar) => {
                            const isSubmitted = submittedWebinarIds.includes(webinar._id);

                            return (
                                <article
                                    key={webinar._id}
                                    className="group flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-[#112240]"
                                >
                                    <div className="mb-5 flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="inline-flex items-center rounded-full bg-[#d6b161]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#b38f3f] dark:text-[#e7c97e]">
                                                Upcoming Webinar
                                            </div>
                                            <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{webinar.title}</h2>
                                        </div>
                                        <div className="rounded-2xl bg-[#d6b161]/10 p-3 text-[#b38f3f] dark:text-[#d6b161]">
                                            <Radio className="h-5 w-5" />
                                        </div>
                                    </div>

                                    <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">{webinar.shortDescription}</p>

                                    <div className="mt-6 space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0a192f]">
                                        <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                            <Calendar className="h-4 w-4 text-[#d6b161]" />
                                            <span>{formatWebinarDateTime(webinar.scheduledAt)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Registration Fee</span>
                                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                                {formatWebinarPrice(webinar.price, webinar.currency || 'INR')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex-1">
                                        <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">{webinar.description}</p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleRegister(webinar)}
                                        disabled={isSubmitted}
                                        className={`mt-8 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-colors ${
                                            isSubmitted
                                                ? 'cursor-not-allowed bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                : 'bg-[#0a192f] text-white hover:bg-[#112240] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#d6b161] dark:text-[#0a192f] dark:hover:bg-[#c9a653]'
                                        }`}
                                    >
                                        {isSubmitted ? 'Awaiting Approval' : 'Register Now'}
                                        {!isSubmitted && <ArrowRight className="h-4 w-4" />}
                                    </button>
                                </article>
                            );
                        })}
                    </div>
                )}
            </main>

            {selectedWebinar && (
                <EnrollmentModal
                    isOpen={isEnrollmentOpen}
                    onClose={() => {
                        setIsEnrollmentOpen(false);
                        setSelectedWebinar(null);
                    }}
                    origin="webinars"
                    originPath="/webinars"
                    paymentAmount={formatWebinarPrice(selectedWebinar.price, selectedWebinar.currency || 'INR')}
                    mode="webinar"
                    webinar={{
                        webinarId: selectedWebinar._id,
                        webinarTitle: selectedWebinar.title,
                        scheduledAt: selectedWebinar.scheduledAt,
                    }}
                />
            )}

            <Footer />
        </div>
    );
};

export default WebinarsPage;
