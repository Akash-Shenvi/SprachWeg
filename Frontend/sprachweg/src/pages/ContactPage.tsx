import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'framer-motion';

import { MessageCircle } from 'lucide-react';

import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

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
            : { duration: 0.3 } // Instant for first paint, delay stagger until after
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
// Types
interface FormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

interface ContactEmail {
    type: string;
    email: string;
}

interface IconWrapperProps {
    children: React.ReactNode;
    className?: string;
}

interface FieldIconProps {
    children: React.ReactNode;
}

interface SuccessAnimationProps {
    onReset: () => void;
}

// 3D Tilt Hook removed for performance optimization

// LazyIframe Component - Only loads when in viewport
const LazyIframe: React.FC<{ src: string; title: string; className?: string }> = ({ src, title, className }) => {
    const ref = useRef<HTMLIFrameElement | null>(null);
    useEffect(() => {
        if (!ref.current) return;
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    if (ref.current && !ref.current.src) ref.current.src = src;
                    io.disconnect();
                }
            });
        }, { rootMargin: '200px' });
        io.observe(ref.current);
        return () => io.disconnect();
    }, [src]);
    return <iframe ref={ref} src="" data-src={src} title={title} className={className} loading="lazy" width="100%" height="100%" style={{ border: 0 }} allowFullScreen referrerPolicy="no-referrer-when-downgrade" />;
};

// Icons - Memoized for performance
const useIcons = () => useMemo(() => ({
    user: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    ),
    email: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    ),
    subject: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="17" x2="7" y1="17" y2="7" />
            <polyline points="7 17 7 7 17 7" />
        </svg>
    ),
    message: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    ),
    location: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    ),
    clock: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    phone: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
    ),
    partner: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    whatsapp: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
    ),
    call: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
    ),
}), []);

// Helper Components - Memoized
const IconWrapper = React.memo<IconWrapperProps>(({ children, className = "" }) => (
    <div className={`flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30 ${className}`}>
        {children}
    </div>
));

const FieldIcon = React.memo<FieldIconProps>(({ children }) => (
    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 sm:pl-3.5">
        {children}
    </div>
));

// Success Animation Component - Memoized
const SuccessAnimation = React.memo<SuccessAnimationProps>(({ onReset }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="text-center w-full px-2"
    >
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-lg"
        >
            <motion.svg
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
                className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
            >
                <motion.path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
        </motion.div>
        <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-3 sm:mt-4 md:mt-6 text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-white"
        >
            Message Sent!
        </motion.h2>
        <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-1.5 sm:mt-2 md:mt-3 text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 px-2"
        >
            Thank you for reaching out. We'll get back to you shortly.
        </motion.p>
        <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            onClick={onReset}
            className="mt-4 sm:mt-6 md:mt-8 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-[#0a192f] to-[#112240] dark:from-[#d6b161] dark:to-[#c4a055] text-white dark:text-[#0a192f] rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm md:text-base hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-xl min-h-[44px] flex items-center justify-center"
        >
            Send Another Message
        </motion.button>
    </motion.div>
));

// Animation Variants
const containerVariants = {
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
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: "easeOut" as const
        }
    }
};

const ContactPage: React.FC = () => {

    const [form, setForm] = useState<FormData>({ name: "", email: "", subject: "", message: "" });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [startHeavyAnimations, setStartHeavyAnimations] = useState(false);

    // const contactCardRef = useTilt(true, isMobile);
    // const formCardRef = useTilt(true, isMobile);
    const ICONS = useIcons();

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



    const updateField = (key: keyof FormData, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const validate = (): string | null => {
        if (!form.name.trim()) return "Please enter your name.";
        if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return "Please enter a valid email.";
        if (!form.subject.trim()) return "Please enter a subject.";
        if (!form.message.trim()) return "Please enter a message.";
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");

        const validationError = validate();
        if (validationError) {
            setSubmitError(validationError);
            return;
        }

        setSubmitting(true);

        try {
            const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            await axios.post(`${API_URL}/api/contact`, form);
            setSubmitted(true);
            setForm({ name: "", email: "", subject: "", message: "" });
        } catch (error: any) {
            console.error("Submission error:", error);
            setSubmitError(error.response?.data?.message || "Failed to send message. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };



    // Data
    const contactEmails: ContactEmail[] = [
        { type: 'Training', email: 'training@sovirtechnologies.in' },
        { type: 'Queries', email: 'info@sovirtechnologies.in' }
    ];

    const officeAddress = "JLB Complex Gopadi, NH 66, Koteshwara Proper, Kundapura, Karnataka 576201";
    const googleMapsUrl = "https://maps.app.goo.gl/uLHMj7CyA73jzbSL8";

    const branchAddress = "UNIT NO: 540, Block A, 5th Floor, Plot No - 1, sector - 90, Expressway Noida (U.P)";
    const branchMapsUrl = "https://maps.app.goo.gl/BghpcWce2FgN6eLAA?g_st=awb";

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans">
            <Header />

            {/* Hero Section */}
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1a365d] py-28 sm:py-36 text-center overflow-hidden">
                <HeroBackground startAnimations={startHeavyAnimations} />

                <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        custom={startHeavyAnimations}
                        className="mx-auto max-w-4xl"
                    >
                        <motion.div variants={fadeInUp} className="mb-6 flex justify-center">
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#d6b161]/20 bg-[#d6b161]/10 px-4 py-1.5 text-sm font-semibold text-[#d6b161] backdrop-blur-sm">
                                <MessageCircle className="h-4 w-4 fill-current" />
                                Get In Touch
                            </span>
                        </motion.div>

                        <motion.h1
                            variants={fadeInUp}
                            className="font-display mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
                        >
                            Contact <span className="bg-gradient-to-r from-[#d6b161] to-[#b38f3f] bg-clip-text text-transparent">Us</span>
                        </motion.h1>

                        <motion.p
                            variants={fadeInUp}
                            className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg"
                        >
                            Ready to transform your industry with cutting-edge automation solutions? Let's discuss how our PLC, IoT, and SCADA expertise can revolutionize your operations.
                        </motion.p>
                    </motion.div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="relative py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-16 items-start">
                        {/* Left Column - Contact Info */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className={`bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#0a192f] rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 text-white relative overflow-hidden border border-[#d6b161]/20 transition-shadow duration-500 shadow-xl`}
                        >
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-10" style={{
                                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(214, 177, 97, 0.3) 1px, transparent 0)`,
                                backgroundSize: '40px 40px'
                            }}></div>

                            {/* Animated Gradient Orbs - deferred */}
                            {startHeavyAnimations && (
                                <>
                                    <div className="absolute top-0 left-0 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-r from-[#d6b161] to-[#c4a055] rounded-full opacity-20 blur-2xl animate-pulse"></div>
                                    <div className="absolute bottom-0 right-0 w-24 h-24 sm:w-28 sm:h-28 md:w-40 md:h-40 bg-gradient-to-r from-[#d6b161] to-[#c4a055] rounded-full opacity-20 blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                                </>
                            )}

                            <div className="relative z-10">
                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 md:mb-8 text-[#d6b161]"
                                >
                                    Get in touch
                                </motion.h2>

                                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4 sm:space-y-6 md:space-y-8 mb-6 sm:mb-10 md:mb-12">
                                    <motion.div variants={itemVariants} className="flex items-start gap-3 sm:gap-4">
                                        <IconWrapper className="bg-[#d6b161]/20 border-[#d6b161]/40 text-[#d6b161]">
                                            {ICONS.location}
                                        </IconWrapper>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-1 sm:mb-2 text-white">Our Office</h3>
                                            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm md:text-base text-gray-300 hover:text-[#d6b161] hover:underline transition-all duration-300 break-words leading-snug">
                                                {officeAddress}
                                            </a>
                                        </div>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="flex items-start gap-3 sm:gap-4">
                                        <IconWrapper className="bg-[#d6b161]/20 border-[#d6b161]/40 text-[#d6b161]">
                                            {ICONS.clock}
                                        </IconWrapper>
                                        <div>
                                            <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-1 sm:mb-2 text-white">Business Hours</h3>
                                            <p className="text-gray-300 text-xs sm:text-sm md:text-base leading-snug">Monday - Friday: 9am to 6pm</p>
                                        </div>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="flex items-start gap-3 sm:gap-4">
                                        <IconWrapper className="bg-[#d6b161]/20 border-[#d6b161]/40 text-[#d6b161]">
                                            {ICONS.phone}
                                        </IconWrapper>
                                        <div>
                                            <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-1 sm:mb-2 text-white">Let's Talk</h3>
                                            <p className="text-gray-300 text-xs sm:text-sm md:text-base leading-snug">+91 8851771838 / +91 8840957097</p>
                                        </div>
                                    </motion.div>
                                </motion.div>

                                {/* Direct Emails */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="border-t border-white/10 pt-4 sm:pt-6 md:pt-8"
                                >
                                    <h3 className="font-semibold text-base sm:text-lg md:text-xl mb-3 sm:mb-4 md:mb-6 text-white">Direct Email</h3>
                                    <div className="grid grid-cols-1 gap-2 sm:gap-3 md:gap-4">
                                        {contactEmails.map((contact, index) => (
                                            <motion.a
                                                key={contact.type}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.7 + index * 0.1 }}
                                                href={`mailto:${contact.email}`}
                                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-[#d6b161]/30 transition-all duration-300 group shadow-lg gap-1 sm:gap-0 min-h-[44px] justify-center"
                                            >
                                                <span className="font-medium text-white group-hover:text-[#d6b161] text-xs sm:text-sm md:text-base">{contact.type}</span>
                                                <span className="text-gray-300 group-hover:text-white font-semibold text-xs break-all sm:break-normal">
                                                    {contact.email}
                                                </span>
                                            </motion.a>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Action Buttons */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.9 }}
                                    className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 mt-6 sm:mt-10 md:mt-12"
                                >
                                    <a
                                        href="https://wa.me/918851771838"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 bg-green-600 rounded-lg sm:rounded-xl text-white font-semibold text-xs sm:text-sm md:text-base hover:bg-green-700 transition-all duration-300 group shadow-lg hover:shadow-xl min-h-[44px]"
                                    >
                                        {ICONS.whatsapp}
                                        <span>WhatsApp</span>
                                    </a>
                                    <a
                                        href="tel:+918851771838"
                                        className="flex items-center justify-center gap-2 px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 bg-[#d6b161] rounded-lg sm:rounded-xl text-[#0a192f] font-semibold text-xs sm:text-sm md:text-base hover:bg-[#c4a055] transition-all duration-300 group shadow-lg hover:shadow-xl min-h-[44px]"
                                    >
                                        {ICONS.call}
                                        <span>Call</span>
                                    </a>
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Right Column - Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className={`bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 border border-gray-200 dark:border-gray-700 transition-shadow duration-500 shadow-xl`}
                        >
                            <AnimatePresence mode="wait">
                                {submitted ? (
                                    <SuccessAnimation onReset={() => setSubmitted(false)} />
                                ) : (
                                    <motion.form
                                        initial={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onSubmit={handleSubmit}
                                        className="space-y-4 sm:space-y-5 md:space-y-6"
                                    >
                                        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#0a192f] dark:text-white mb-1">Send us a message</h2>
                                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm md:text-base mb-4 sm:mb-6 md:mb-8">We're here to help and answer any questions you might have.</p>

                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 }}
                                        >
                                            <label htmlFor="name" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Full name</label>
                                            <div className="relative">
                                                <FieldIcon>{ICONS.user}</FieldIcon>
                                                <input
                                                    id="name"
                                                    type="text"
                                                    value={form.name}
                                                    onChange={(e) => updateField("name", e.target.value)}
                                                    className="block w-full rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 py-2.5 sm:py-3 pl-9 sm:pl-11 pr-3 text-gray-900 dark:text-white focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 transition-all duration-300 text-xs sm:text-sm md:text-base min-h-[44px]"
                                                    placeholder="Your full name"
                                                />
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.6 }}
                                        >
                                            <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Email address</label>
                                            <div className="relative">
                                                <FieldIcon>{ICONS.email}</FieldIcon>
                                                <input
                                                    id="email"
                                                    type="email"
                                                    value={form.email}
                                                    onChange={(e) => updateField("email", e.target.value)}
                                                    className="block w-full rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 py-2.5 sm:py-3 pl-9 sm:pl-11 pr-3 text-gray-900 dark:text-white focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 transition-all duration-300 text-xs sm:text-sm md:text-base min-h-[44px]"
                                                    placeholder="you@example.com"
                                                />
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.7 }}
                                        >
                                            <label htmlFor="subject" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Subject</label>
                                            <div className="relative">
                                                <FieldIcon>{ICONS.subject}</FieldIcon>
                                                <input
                                                    id="subject"
                                                    type="text"
                                                    value={form.subject}
                                                    onChange={(e) => updateField("subject", e.target.value)}
                                                    className="block w-full rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 py-2.5 sm:py-3 pl-9 sm:pl-11 pr-3 text-gray-900 dark:text-white focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 transition-all duration-300 text-xs sm:text-sm md:text-base min-h-[44px]"
                                                    placeholder="What is this about?"
                                                />
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.8 }}
                                        >
                                            <label htmlFor="message" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Message</label>
                                            <textarea
                                                id="message"
                                                value={form.message}
                                                onChange={(e) => updateField("message", e.target.value)}
                                                rows={4}
                                                className="block w-full rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 py-2.5 sm:py-3 px-3 text-gray-900 dark:text-white focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 transition-all duration-300 resize-none text-xs sm:text-sm md:text-base min-h-[110px] sm:min-h-[120px]"
                                                placeholder="Your message..."
                                            ></textarea>
                                        </motion.div>

                                        {submitError && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="text-xs sm:text-sm font-medium text-red-600 rounded-lg sm:rounded-xl bg-red-50 dark:bg-red-900/20 p-3 sm:p-4 text-center border border-red-200 dark:border-red-800"
                                            >
                                                {submitError}
                                            </motion.div>
                                        )}

                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.9 }}
                                            className="pt-2 sm:pt-4"
                                        >
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="w-full inline-flex items-center justify-center gap-2 px-4 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4 bg-gradient-to-r from-[#0a192f] to-[#112240] dark:from-[#d6b161] dark:to-[#c4a055] hover:from-[#112240] hover:to-[#1a3050] dark:hover:from-[#c4a055] dark:hover:to-[#b39050] text-white dark:text-[#0a192f] text-xs sm:text-sm md:text-base lg:text-lg font-semibold rounded-lg sm:rounded-xl shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 min-h-[44px]"
                                            >
                                                {submitting ? (
                                                    <>
                                                        <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white dark:text-[#0a192f]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        <span>Sending...</span>
                                                    </>
                                                ) : (
                                                    "Send Message"
                                                )}
                                            </button>
                                        </motion.div>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Offices Section */}
            <section className="py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-8 sm:mb-12 md:mb-16"
                    >
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-[#0a192f] dark:text-white mb-3 sm:mb-4 md:mb-6">Our Offices</h2>
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto px-2 sm:px-4">
                            Visit us at our strategically located offices designed to serve you better
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 xl:gap-12">
                        {/* Head Office */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 border border-gray-200 dark:border-gray-700"
                        >
                            <div className="aspect-video bg-gradient-to-br from-[#0a192f]/10 to-[#d6b161]/10 relative">
                                <LazyIframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3882.4876887447756!2d74.71387367507528!3d13.278956687193878!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbca54a0bdd5e0b%3A0x7b6f8b1a0bdd5e0c!2sKoteshwara%2C%20Karnataka%20576222!5e0!3m2!1sen!2sin!4v1640000000000!5m2!1sen!2sin"
                                    title="Sovir Technologies Head Office"
                                    className="min-h-[200px] sm:min-h-[250px] md:min-h-[300px]"
                                />
                            </div>
                            <div className="p-4 sm:p-6 md:p-8">
                                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[#0a192f] dark:text-white mb-2 sm:mb-3 md:mb-4">Head Office</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm md:text-base mb-3 sm:mb-4 md:mb-6 leading-relaxed">
                                    <a
                                        href={googleMapsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#0a192f] dark:text-[#d6b161] hover:text-[#d6b161] dark:hover:text-white hover:underline transition-all duration-300"
                                    >
                                        {officeAddress}
                                    </a>
                                </p>

                                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-0.5 sm:mb-1 text-xs sm:text-sm md:text-base">Hours</h4>
                                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm md:text-base">Monday - Friday: 9am - 6pm</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-0.5 sm:mb-1 text-xs sm:text-sm md:text-base">Contacts</h4>
                                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm md:text-base">+91 8851771838 / +91 8840957097</p>
                                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm md:text-base">info@sovirtechnologies.in</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Branch Office */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 border border-gray-200 dark:border-gray-700"
                        >
                            <div className="aspect-video bg-gradient-to-br from-[#0a192f]/10 to-[#d6b161]/10 relative">
                                <LazyIframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.578307963847!2d77.38166!3d28.566670!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce5a43173357b%3A0x37ffce30c87cc03d!2sSector%2090%2C%20Noida%2C%20Uttar%20Pradesh%20201305!5e0!3m2!1sen!2sin!4v1640000000000!5m2!1sen!2sin"
                                    title="Sovir Technologies Branch Office"
                                    className="min-h-[200px] sm:min-h-[250px] md:min-h-[300px]"
                                />
                            </div>
                            <div className="p-4 sm:p-6 md:p-8">
                                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[#0a192f] dark:text-white mb-2 sm:mb-3 md:mb-4">Branch Office</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm md:text-base mb-3 sm:mb-4 md:mb-6 leading-relaxed">
                                    <a
                                        href={branchMapsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#0a192f] dark:text-[#d6b161] hover:text-[#d6b161] dark:hover:text-white hover:underline transition-all duration-300"
                                    >
                                        {branchAddress}
                                    </a>
                                </p>

                                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-0.5 sm:mb-1 text-xs sm:text-sm md:text-base">Hours</h4>
                                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm md:text-base">Monday - Friday: 9am - 6pm</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-0.5 sm:mb-1 text-xs sm:text-sm md:text-base">Contacts</h4>
                                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm md:text-base">+91 8851771838 / +91 8840957097</p>
                                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm md:text-base">info@sovirtechnologies.in</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <Footer />

            {/* Reduced Motion Support Styles */}
            <style>{`
                @media (prefers-reduced-motion: reduce) {
                    .transform-style-preserve-3d {
                        transform: none !important;
                        transition: none !important;
                    }
                }
                
                @media (max-width: 640px) {
                    input, textarea, button, a {
                        font-size: 16px;
                    }
                }
            `}</style>
        </div>
    );
};

export default ContactPage;
