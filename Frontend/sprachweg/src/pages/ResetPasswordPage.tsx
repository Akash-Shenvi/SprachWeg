import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import Button from '../components/ui/Button';
import { authAPI } from '../lib/api';
import { Header } from '../components/layout';

const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Auto-fill email from query param
    const initialEmail = searchParams.get('email') || '';

    const [formData, setFormData] = useState({
        email: initialEmail,
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            await authAPI.resetPassword({
                email: formData.email,
                otp: formData.otp,
                newPassword: formData.newPassword
            });
            setSubmitted(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Reset failed. Invalid OTP or request.');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 font-sans text-left overflow-y-auto">
            <Header />

            <main className="min-h-screen flex items-center justify-center p-4 pt-20">
                <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                        {!submitted && (
                            <Link
                                to="/forgot-password"
                                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back
                            </Link>
                        )}

                        <div className="mb-6">
                            <h2 className="font-sans text-3xl font-bold text-[#0e5cad] dark:text-white mb-2">
                                {submitted ? 'Password Reset!' : 'Reset Password'}
                            </h2>
                            {!submitted && (
                                <p className="text-gray-500 dark:text-gray-400">
                                    Enter the verification code and your new password.
                                </p>
                            )}
                        </div>

                        {submitted ? (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Success!</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    Your password has been reset successfully. <br />
                                    Redirecting to login...
                                </p>
                                <Button
                                    onClick={() => navigate('/login')}
                                    className="w-full bg-[#0e5cad] hover:bg-[#0a4a82] text-white py-3 rounded-xl font-semibold"
                                >
                                    Login Now
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Email Field - Read Only if pre-filled, or editable */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500 transition-all focus:outline-none dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        Enter OTP Code
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="123456"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-2xl tracking-widest font-mono text-gray-900 placeholder:text-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-[#0e5cad] focus:bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                        value={formData.otp}
                                        onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                                        maxLength={6}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        New Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0e5cad] transition-colors">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pl-10 pr-10 text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-[#0e5cad] focus:bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                            value={formData.newPassword}
                                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        Confirm Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0e5cad] transition-colors">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pl-10 pr-10 text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-[#0e5cad] focus:bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-[#0e5cad] hover:bg-[#0a4a82] text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-900/10 transition-transform active:scale-[0.98]"
                                    disabled={loading}
                                >
                                    {loading ? 'Reseting...' : 'Reset Password'}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>,
        document.body
    );
};

export default ResetPasswordPage;
