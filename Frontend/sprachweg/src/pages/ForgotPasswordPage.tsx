import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, ArrowLeft, Send } from 'lucide-react';
import Button from '../components/ui/Button';
import { Header } from '../components/layout';
import { authAPI } from '../lib/api';

const ForgotPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    // const [success, setSuccess] = useState(false); // Removed success state as we navigate away

    // Call backend API
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authAPI.forgotPassword(email);
            // Navigate to ResetPasswordPage with email param
            navigate(`/reset-password?email=${encodeURIComponent(email)}`);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a192f] font-sans">
            <Header />
            <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>

            <main id="main" role="main" className="min-h-screen pt-20 flex">
                {/* Left Panel - Hero */}
                <div className="hidden lg:flex lg:w-1/2 bg-[#0a192f] text-white p-16 flex-col justify-between relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-12 right-12 w-32 h-32 border border-white/20 rounded-3xl transform rotate-12" />
                    <div className="absolute bottom-12 left-12 w-24 h-24 border border-white/10 rounded-full" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-12">
                            {/* Logo Removed */}
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20 text-sm font-medium backdrop-blur-sm">
                                <span className="w-2 h-2 rounded-full bg-[#d6b161]" />
                                Secure Account Recovery
                            </div>

                            <h1 className="font-sans text-5xl font-medium leading-tight mb-6">
                                Password<br />
                                Recovery
                            </h1>

                            <p className="text-blue-100 text-lg mb-12 max-w-md leading-relaxed">
                                Don't worry, even the best of us forget. We'll help you get back to your skill training journey in no time.
                            </p>

                            <div className="space-y-6">
                                {[
                                    "Verified email confirmation",
                                    "Industry-standard encryption",
                                    "24/7 account support available"
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        custom={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + (i * 0.1) }}
                                        className="flex items-center gap-4"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                            <CheckCircle className="w-4 h-4 text-[#d6b161]" />
                                        </div>
                                        <span className="text-blue-50">{item}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    <div className="text-sm text-blue-200/60">
                        SoVir Technologies LLP © {new Date().getFullYear()}
                    </div>
                </div>

                {/* Right Panel - Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
                    {/* Mobile Header (Visible only on small screens) */}
                    <div className="lg:hidden absolute top-4 left-8 flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#0a192f] rounded-lg flex items-center justify-center text-white">
                            <span className="font-sans font-bold">S</span>
                        </div>
                        <span className="font-sans font-bold text-[#0a192f] dark:text-white">SOVIR</span>
                    </div>

                    <div className="w-full max-w-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700"
                        >
                            <div className="mb-8 text-center">
                                <div className="w-16 h-16 bg-[#d6b161]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#d6b161]">
                                    <Mail className="w-8 h-8" />
                                </div>
                                <h2 className="font-sans text-3xl font-bold text-[#0a192f] dark:text-white mb-3">Forgot Password?</h2>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Enter your email address and we'll send you a link to reset your password.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pl-10 text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-[#d6b161] focus:bg-white dark:focus:bg-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] py-3.5 rounded-xl font-semibold shadow-lg shadow-amber-900/10 flex items-center justify-center gap-2"
                                    disabled={loading}
                                    data-testid="reset-button"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Sending...
                                        </span>
                                    ) : (
                                        <>
                                            Send OTP
                                            <Send className="w-4 h-4" />
                                        </>
                                    )}
                                </Button>

                                <div className="text-center">
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#d6b161] font-medium transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to Login
                                    </Link>
                                </div>
                            </form>

                        </motion.div>

                        <p className="text-center text-xs text-gray-400 mt-8">
                            Protected by reCAPTCHA and subject to the Google Privacy Policy and Terms of Service.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ForgotPasswordPage;
