import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Mail, MapPin, Phone, User2 } from 'lucide-react';
import { Header } from '../components/layout';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathForRole } from '../lib/authRouting';

const InstitutionRegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const {
        institutionRegister,
        institutionResendOtp,
        institutionVerifyOtp,
    } = useAuth();
    const [step, setStep] = useState<'register' | 'verify'>('register');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        institutionName: '',
        contactPersonName: '',
        email: '',
        phoneNumber: '',
        password: '',
        city: '',
        state: '',
        address: '',
        otp: '',
    });

    const handleRegister = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await institutionRegister({
                institutionName: formData.institutionName,
                contactPersonName: formData.contactPersonName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                password: formData.password,
                city: formData.city,
                state: formData.state,
                address: formData.address,
            });
            setStep('verify');
            setMessage('Verification code sent to your institution email.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Institution registration failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await institutionVerifyOtp(formData.email, formData.otp);
            const savedUser = localStorage.getItem('user');
            const nextUser = savedUser ? JSON.parse(savedUser) as { role?: string } : null;
            navigate(getDashboardPathForRole(nextUser?.role));
        } catch (err: any) {
            setError(err.response?.data?.message || 'OTP verification failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await institutionResendOtp(formData.email);
            setMessage('Verification code sent again.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Unable to resend OTP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a192f]">
            <Header />
            <main className="px-4 pt-28 pb-16 sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
                    <section className="rounded-[2rem] bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1a2e54] p-8 text-white shadow-2xl sm:p-10">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-[#f0d79a]">
                            <Building2 className="h-4 w-4" />
                            New Institution Registration
                        </div>
                        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                            Create a dedicated institution account.
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-blue-100">
                            Register once, verify your email, then submit German course requests for your students
                            through a separate institution-only dashboard.
                        </p>
                        <div className="mt-10 space-y-4">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-sm font-semibold text-[#f0d79a]">Basic contact profile</p>
                                <p className="mt-2 text-sm text-blue-100">Institution name, contact person, phone, address, city, and state.</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-sm font-semibold text-[#f0d79a]">OTP verification</p>
                                <p className="mt-2 text-sm text-blue-100">Your institution account becomes active after email verification.</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-sm font-semibold text-[#f0d79a]">Bulk student requests</p>
                                <p className="mt-2 text-sm text-blue-100">Submit one German level per request and let admin approve the entire batch.</p>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-[#112240] sm:p-10">
                        <div className="mb-8">
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d6b161]">
                                {step === 'register' ? 'Institution Register' : 'Verify Email'}
                            </p>
                            <h2 className="mt-3 text-3xl font-bold text-[#0a192f] dark:text-white">
                                {step === 'register' ? 'Create your institution portal account' : 'Enter the verification code'}
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                                {step === 'register'
                                    ? 'Use the institution contact details that should receive approval updates and dashboard access.'
                                    : `We sent a 6-digit OTP to ${formData.email}.`}
                            </p>
                        </div>

                        {error ? (
                            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                                {error}
                            </div>
                        ) : null}

                        {message ? (
                            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
                                {message}
                            </div>
                        ) : null}

                        {step === 'register' ? (
                            <form onSubmit={handleRegister} className="space-y-5">
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <label className="block">
                                        <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Institution Name</span>
                                        <div className="relative">
                                            <Building2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={formData.institutionName}
                                                onChange={(event) => setFormData((current) => ({ ...current, institutionName: event.target.value }))}
                                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 pl-12 text-gray-900 outline-none transition focus:border-[#d6b161] focus:bg-white dark:border-gray-700 dark:bg-[#0a192f] dark:text-white"
                                                required
                                            />
                                        </div>
                                    </label>

                                    <label className="block">
                                        <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Contact Person</span>
                                        <div className="relative">
                                            <User2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={formData.contactPersonName}
                                                onChange={(event) => setFormData((current) => ({ ...current, contactPersonName: event.target.value }))}
                                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 pl-12 text-gray-900 outline-none transition focus:border-[#d6b161] focus:bg-white dark:border-gray-700 dark:bg-[#0a192f] dark:text-white"
                                                required
                                            />
                                        </div>
                                    </label>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <label className="block">
                                        <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Institution Email</span>
                                        <div className="relative">
                                            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 pl-12 text-gray-900 outline-none transition focus:border-[#d6b161] focus:bg-white dark:border-gray-700 dark:bg-[#0a192f] dark:text-white"
                                                required
                                            />
                                        </div>
                                    </label>

                                    <label className="block">
                                        <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Phone Number</span>
                                        <div className="relative">
                                            <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="tel"
                                                value={formData.phoneNumber}
                                                onChange={(event) => setFormData((current) => ({ ...current, phoneNumber: event.target.value }))}
                                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 pl-12 text-gray-900 outline-none transition focus:border-[#d6b161] focus:bg-white dark:border-gray-700 dark:bg-[#0a192f] dark:text-white"
                                                required
                                            />
                                        </div>
                                    </label>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <label className="block">
                                        <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">City</span>
                                        <div className="relative">
                                            <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={formData.city}
                                                onChange={(event) => setFormData((current) => ({ ...current, city: event.target.value }))}
                                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 pl-12 text-gray-900 outline-none transition focus:border-[#d6b161] focus:bg-white dark:border-gray-700 dark:bg-[#0a192f] dark:text-white"
                                                required
                                            />
                                        </div>
                                    </label>

                                    <label className="block">
                                        <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">State</span>
                                        <input
                                            type="text"
                                            value={formData.state}
                                            onChange={(event) => setFormData((current) => ({ ...current, state: event.target.value }))}
                                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-[#d6b161] focus:bg-white dark:border-gray-700 dark:bg-[#0a192f] dark:text-white"
                                            required
                                        />
                                    </label>
                                </div>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Address</span>
                                    <textarea
                                        value={formData.address}
                                        onChange={(event) => setFormData((current) => ({ ...current, address: event.target.value }))}
                                        rows={3}
                                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-[#d6b161] focus:bg-white dark:border-gray-700 dark:bg-[#0a192f] dark:text-white"
                                        required
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Password</span>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-[#d6b161] focus:bg-white dark:border-gray-700 dark:bg-[#0a192f] dark:text-white"
                                        minLength={6}
                                        required
                                    />
                                </label>

                                <Button
                                    type="submit"
                                    className="w-full rounded-2xl bg-[#d6b161] py-3 text-base font-semibold text-[#0a192f] hover:bg-[#c4a055]"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating Account...' : 'Create Institution Account'}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerify} className="space-y-5">
                                <label className="block">
                                    <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Verification Code</span>
                                    <input
                                        type="text"
                                        value={formData.otp}
                                        onChange={(event) => setFormData((current) => ({ ...current, otp: event.target.value }))}
                                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-lg tracking-[0.6em] text-gray-900 outline-none transition focus:border-[#d6b161] focus:bg-white dark:border-gray-700 dark:bg-[#0a192f] dark:text-white"
                                        maxLength={6}
                                        required
                                    />
                                </label>

                                <Button
                                    type="submit"
                                    className="w-full rounded-2xl bg-[#d6b161] py-3 text-base font-semibold text-[#0a192f] hover:bg-[#c4a055]"
                                    disabled={loading}
                                >
                                    {loading ? 'Verifying...' : 'Verify and Continue'}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full rounded-2xl border-[#d6b161] py-3 text-base font-semibold text-[#d6b161]"
                                    onClick={handleResendOtp}
                                    disabled={loading}
                                >
                                    Resend OTP
                                </Button>
                            </form>
                        )}

                        <div className="mt-8 rounded-2xl bg-[#f8f5ec] px-4 py-4 text-sm text-[#5f5333] dark:bg-[#0a192f] dark:text-[#f0d79a]">
                            Already registered?{' '}
                            <Link to="/institution/login" className="font-semibold text-[#0a192f] underline dark:text-white">
                                Sign in to the institution portal
                            </Link>
                        </div>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default InstitutionRegisterPage;
