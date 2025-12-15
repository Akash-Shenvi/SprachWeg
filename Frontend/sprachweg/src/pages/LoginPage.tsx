import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import { Header } from '../components/layout';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login, googleLogin } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                setLoading(true);
                await googleLogin(tokenResponse.access_token);
                navigate('/dashboard');
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
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />
            <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 pt-20">
                {/* Left Panel */}
                <div className="hidden lg:flex lg:w-1/2 bg-[#0e5cad] text-white p-16 flex-col justify-between relative overflow-hidden">
                    {/* Decorative Square */}
                    <div className="absolute top-12 right-12 w-32 h-32 border border-white/20 rounded-3xl transform rotate-12" />

                    <div>
                        <div className="flex items-center gap-3 mb-12">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                                <span className="text-[#0e5cad] font-serif font-bold text-xl">S</span>
                            </div>
                            <span className="font-serif font-bold text-xl tracking-wide">SOVIR Akademie</span>
                        </div>

                        <h1 className="font-serif text-5xl font-medium leading-tight mb-6">
                            Welcome Back to<br />
                            Your<br />
                            Learning Journey
                        </h1>

                        <p className="text-blue-100 text-lg mb-12 max-w-md">
                            Continue your path to language fluency and global career opportunities.
                        </p>

                        <div className="space-y-6">
                            {[
                                "Live interactive classes with expert instructors",
                                "Comprehensive language certification preparation",
                                "Direct pathway to international careers"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-blue-50">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                    <div className="w-full max-w-md">
                        {/* Top Toggle */}
                        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex mb-12">
                            <button
                                className="flex-1 py-2.5 text-sm font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg shadow-sm transition-all"
                            >
                                Sign In
                            </button>
                            <Link to="/register" className="flex-1">
                                <button
                                    className="w-full py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-all"
                                >
                                    Create Account
                                </button>
                            </Link>
                        </div>

                        <div className="mb-8">
                            <h2 className="font-serif text-3xl font-bold text-[#0e5cad] dark:text-white mb-2">Sign In</h2>
                            <p className="text-gray-500 dark:text-gray-400">Enter your credentials to access your account</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 pl-10 text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-[#0e5cad] focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
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
                                    <Link
                                        to="/forgot-password"
                                        className="text-sm text-[#0e5cad] hover:underline font-medium"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 pl-10 pr-10 text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-[#0e5cad] focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>


                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="remember" className="rounded border-gray-300 text-[#0e5cad] focus:ring-[#0e5cad]" />
                                <label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400">Remember me for 30 days</label>
                            </div>

                            <Button type="submit" className="w-full bg-[#0e5cad] hover:bg-[#0a4a82] text-white py-3 rounded-lg font-semibold" disabled={loading}>
                                {loading ? 'Signing In...' : 'Sign In'}
                            </Button>
                        </form>

                        <div className="mt-8 relative text-center">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                            </div>
                            <div className="relative inline-block px-4 bg-gray-50 dark:bg-gray-900 text-xs text-gray-400 uppercase tracking-widest">
                                OR CONTINUE WITH
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() => handleGoogleLogin()}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 transition-colors"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Continue with Google</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;
