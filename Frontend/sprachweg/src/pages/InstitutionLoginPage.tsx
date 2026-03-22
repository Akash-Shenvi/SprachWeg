import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail } from 'lucide-react';
import { Header } from '../components/layout';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathForRole } from '../lib/authRouting';

const InstitutionLoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { institutionLogin } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const redirectTarget = new URLSearchParams(location.search).get('redirect');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            await institutionLogin(formData.email, formData.password);
            const savedUser = localStorage.getItem('user');
            const nextUser = savedUser ? JSON.parse(savedUser) as { role?: string } : null;
            const nextPath = redirectTarget && redirectTarget.startsWith('/')
                ? redirectTarget
                : getDashboardPathForRole(nextUser?.role);

            navigate(nextPath);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Institution login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a192f]">
            <Header />
            <main className="px-4 pt-28 pb-16 sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                    <section className="rounded-[2rem] bg-[#0a192f] p-8 text-white shadow-2xl sm:p-10">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-[#f0d79a]">
                            <Building2 className="h-4 w-4" />
                            Institution Portal
                        </div>
                        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                            Manage German enrollments for your students.
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-blue-100">
                            Sign in with your institution account to submit student batches, track approval status,
                            and manage course requests separately from the student portal.
                        </p>
                        <div className="mt-10 grid gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-sm font-semibold text-[#f0d79a]">1. Register</p>
                                <p className="mt-2 text-sm text-blue-100">Create your institution account with contact details.</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-sm font-semibold text-[#f0d79a]">2. Add Students</p>
                                <p className="mt-2 text-sm text-blue-100">Choose the German level and upload student names, emails, and passwords.</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-sm font-semibold text-[#f0d79a]">3. Wait for Approval</p>
                                <p className="mt-2 text-sm text-blue-100">Admin approves the whole request and activates every student at once.</p>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-[#112240] sm:p-10">
                        <div className="mb-8">
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d6b161]">Institution Login</p>
                            <h2 className="mt-3 text-3xl font-bold text-[#0a192f] dark:text-white">Sign in to your portal</h2>
                            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                                This login is only for institution accounts. Students should continue using the normal student sign in.
                            </p>
                        </div>

                        {error ? (
                            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                                {error}
                            </div>
                        ) : null}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Institution Email</label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 pl-12 text-gray-900 outline-none transition focus:border-[#d6b161] focus:bg-white dark:border-gray-700 dark:bg-[#0a192f] dark:text-white"
                                        placeholder="institution@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Password</label>
                                <div className="relative">
                                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 pl-12 text-gray-900 outline-none transition focus:border-[#d6b161] focus:bg-white dark:border-gray-700 dark:bg-[#0a192f] dark:text-white"
                                        placeholder="Enter institution password"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full rounded-2xl bg-[#d6b161] py-3 text-base font-semibold text-[#0a192f] hover:bg-[#c4a055]"
                                disabled={loading}
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                            </Button>
                        </form>

                        <div className="mt-8 rounded-2xl bg-[#f8f5ec] px-4 py-4 text-sm text-[#5f5333] dark:bg-[#0a192f] dark:text-[#f0d79a]">
                            Need a new institution account?{' '}
                            <Link to="/institution/register" className="font-semibold text-[#0a192f] underline dark:text-white">
                                Register here
                            </Link>
                        </div>

                        <div className="mt-5 text-sm text-gray-500 dark:text-gray-400">
                            Student portal:{' '}
                            <Link to="/login" className="font-semibold text-[#d6b161]">
                                Student Sign In
                            </Link>
                        </div>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default InstitutionLoginPage;
