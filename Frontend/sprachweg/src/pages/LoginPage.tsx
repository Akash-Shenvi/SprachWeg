import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import { Header } from '../components/layout';
import { getDashboardPathForRole } from '../lib/authRouting';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, googleLogin } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const redirectTargetFromState = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from;
    const redirectTargetFromQuery = new URLSearchParams(location.search).get('redirect');
    const redirectTarget = redirectTargetFromState?.pathname
        ? `${redirectTargetFromState.pathname}${redirectTargetFromState.search || ''}${redirectTargetFromState.hash || ''}`
        : (redirectTargetFromQuery && redirectTargetFromQuery.startsWith('/')
            ? redirectTargetFromQuery
            : getDashboardPathForRole());

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                setLoading(true);
                await googleLogin(tokenResponse.access_token);
                const savedUser = localStorage.getItem('user');
                const nextUser = savedUser ? JSON.parse(savedUser) as { role?: string } : null;
                navigate(redirectTarget || getDashboardPathForRole(nextUser?.role));
            } catch (err: any) {
                setError(err.response?.data?.message || 'Google Login failed');
            } finally {
                setLoading(false);
            }
        },
        onError: () => {
            setError('Google Login Failed');
        },
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(formData.email, formData.password);
            const savedUser = localStorage.getItem('user');
            const nextUser = savedUser ? JSON.parse(savedUser) as { role?: string } : null;
            navigate(redirectTarget || getDashboardPathForRole(nextUser?.role));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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


                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h1 className="font-sans text-5xl font-medium leading-tight mb-6">
                                Welcome Back to<br />
                                Your<br />
                                Skill Training
                            </h1>

                            <p className="text-blue-100 text-lg mb-12 max-w-md leading-relaxed">
                                Continue your path to technical mastery and global career opportunities in the industry.
                            </p>

                            <div className="space-y-6">
                                {[
                                    "Live hands-on sessions with industry experts",
                                    "Comprehensive technical skill certification preparation",
                                    "Direct pathway to international industrial careers"
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
                    <div className="w-full max-w-md">
                        {/* Mobile Header (Visible only on small screens) */}
                        
                        {/* Tab Switcher */}
                        <div className="bg-white dark:bg-gray-800 p-1.5 rounded-xl flex mb-8 shadow-sm border border-gray-100 dark:border-gray-700 w-full max-w-sm mx-auto">
                            <button
                                className="flex-1 py-2.5 text-sm font-semibold text-[#0a192f] bg-[#d6b161] rounded-lg shadow-md transition-all"
                                aria-selected="true"
                            >
                                Sign In
                            </button>
                            <Link to="/register" className="flex-1">
                                <button
                                    className="w-full py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-all"
                                    aria-selected="false"
                                >
                                    Create Account
                                </button>
                            </Link>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700"
                        >
                            <div className="mb-8">
                                <h2 className="font-sans text-3xl font-bold text-[#0a192f] dark:text-white mb-2">Sign In</h2>
                                <p className="text-gray-500 dark:text-gray-400">Enter your credentials to access your account</p>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-start gap-2"
                                    role="alert"
                                >
                                    <span className="mt-0.5">⚠️</span>
                                    {error}
                                </motion.div>
                            )}

                            <form onSubmit={handleLogin} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        Email
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#d6b161] transition-colors">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="email"
                                            placeholder="you@example.com"
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pl-10 text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-[#d6b161] focus:bg-white dark:focus:bg-gray-900 dark:bg-gray-900 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Password
                                        </label>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#d6b161] transition-colors">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pl-10 pr-10 text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-[#d6b161] focus:bg-white dark:focus:bg-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <div className="mt-2 text-right">
                                        <Link
                                            to="/forgot-password"
                                            className="text-sm text-[#d6b161] hover:underline font-medium"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                </div>


                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="remember" className="rounded border-gray-300 text-[#d6b161] focus:ring-[#d6b161] w-4 h-4 cursor-pointer" />
                                    <label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">Remember me for 30 days</label>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] py-3.5 rounded-xl font-semibold shadow-lg shadow-amber-900/10 transition-transform active:scale-[0.98]"
                                    disabled={loading}
                                    data-testid="login-submit"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            Signing In...
                                        </span>
                                    ) : 'Sign In'}
                                </Button>
                            </form>

                            <div className="mt-8 relative text-center">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                                </div>
                                <div className="relative inline-block px-4 bg-white dark:bg-gray-800 text-xs text-gray-400 uppercase tracking-widest font-semibold">
                                    OR CONTINUE WITH
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={() => handleGoogleLogin()}
                                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 transition-all active:scale-[0.98]"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Continue with Google</span>
                                </button>
                            </div>
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

export default LoginPage;
