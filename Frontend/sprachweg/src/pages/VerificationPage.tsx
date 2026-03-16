import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    CheckCircle,
    XCircle,
    Shield,
    QrCode,
    Download,
    Eye,
    Calendar,
    User,
    Building2,
    GraduationCap,
    Briefcase,
    MapPin,
    Mail,
    Clock,
    Fingerprint,
    ArrowRight,
    AlertCircle
} from 'lucide-react';
import { Header, Footer } from '../components/layout';

// --- Types ---
interface CertificateData {
    certificateId: string;
    studentName: string;
    email: string;
    role: string;
    department: string;
    college: string;
    duration: { start: string; end: string };
    mode: 'Online' | 'Offline' | 'On-site' | 'Hybrid';
    status: 'Completed' | 'Ongoing';
    supervisor: string;
    issueDate: string;
    skillsLearned: string[];
}

// --- Mock Database ---
const certificateDatabase: Record<string, CertificateData> = {
    'SVR-INT-2026-001': {
        certificateId: 'SVR-INT-2026-001',
        studentName: 'Rahul Sharma',
        email: 'rahul.sharma@email.com',
        role: 'Electrical Engineering Intern',
        department: 'Electrical Engineering',
        college: 'Visvesvaraya Technological University (VTU)',
        duration: { start: '01 Jan 2026', end: '28 Feb 2026' },
        mode: 'On-site',
        status: 'Completed',
        supervisor: 'Mr. Akash Shenvi',
        issueDate: '05 Mar 2026',
        skillsLearned: ['PLC Programming', 'SCADA Systems', 'Industrial Automation', 'HMI Design']
    },
    'SVR-INT-2026-002': {
        certificateId: 'SVR-INT-2026-002',
        studentName: 'Priya Nair',
        email: 'priya.nair@email.com',
        role: 'Software Developer Intern',
        department: 'Software Development',
        college: 'National Institute of Technology Karnataka (NITK)',
        duration: { start: '15 Feb 2026', end: '15 May 2026' },
        mode: 'Hybrid',
        status: 'Ongoing',
        supervisor: 'Mr. Akash Shenvi',
        issueDate: '—',
        skillsLearned: ['React.js', 'Node.js', 'MongoDB', 'REST APIs']
    },
    'SVR-INT-2026-003': {
        certificateId: 'SVR-INT-2026-003',
        studentName: 'Aarav Kulkarni',
        email: 'aarav.k@email.com',
        role: 'Industrial Automation Intern',
        department: 'Industrial Automation',
        college: 'BMS College of Engineering, Bangalore',
        duration: { start: '01 Dec 2025', end: '28 Feb 2026' },
        mode: 'Offline',
        status: 'Completed',
        supervisor: 'Mr. Akash Shenvi',
        issueDate: '10 Mar 2026',
        skillsLearned: ['VFD Configuration', 'Servo Drives', 'Motion Control', 'Fieldbus Protocols']
    }
};

// --- Animation Variants ---
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.15 }
    }
};

// --- Sub-Components ---

const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value: string; highlight?: boolean }> = ({ icon, label, value, highlight }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-b-0">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#d6b161]/10 dark:bg-[#d6b161]/5 flex items-center justify-center text-[#d6b161]">
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
            <p className={`text-sm sm:text-base font-semibold mt-0.5 break-words ${highlight ? 'text-[#d6b161]' : 'text-gray-900 dark:text-white'}`}>
                {value}
            </p>
        </div>
    </div>
);


// --- Main Component ---
const VerificationPage: React.FC = () => {
    const [certificateId, setCertificateId] = useState('');
    const [searchResult, setSearchResult] = useState<CertificateData | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Check URL params for QR code verification
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) {
            setCertificateId(id);
            handleVerify(id);
        }
    }, []);

    const handleVerify = useCallback((idOverride?: string) => {
        const id = (idOverride || certificateId).trim().toUpperCase();
        if (!id) return;

        setIsSearching(true);
        setHasSearched(false);
        setSearchResult(null);
        setNotFound(false);

        // Simulate network delay
        setTimeout(() => {
            const result = certificateDatabase[id];
            if (result) {
                setSearchResult(result);
                setNotFound(false);
            } else {
                setSearchResult(null);
                setNotFound(true);
            }
            setHasSearched(true);
            setIsSearching(false);
        }, 1200);
    }, [certificateId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleVerify();
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a192f] transition-colors duration-300 font-sans">
            <Header />

            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1a365d] pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0" aria-hidden="true">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                    <div className="absolute -top-[10%] -right-[10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#d6b161]/15 to-cyan-500/5 blur-[120px]" />
                    <div className="absolute top-[30%] -left-[10%] h-[400px] w-[400px] rounded-full bg-indigo-500/8 blur-[100px]" />
                </div>

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
                        <motion.div variants={fadeInUp} className="mb-6 flex justify-center">
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#d6b161]/20 bg-[#d6b161]/10 px-4 py-1.5 text-sm font-semibold text-[#d6b161] backdrop-blur-sm">
                                <Shield className="h-4 w-4" />
                                Secure Verification Portal
                            </span>
                        </motion.div>

                        <motion.h1 variants={fadeInUp} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4">
                            Internship Certificate{' '}
                            <span className="bg-gradient-to-r from-[#d6b161] to-[#b38f3f] bg-clip-text text-transparent">
                                Verification
                            </span>
                        </motion.h1>

                        <motion.p variants={fadeInUp} className="mx-auto max-w-2xl text-base sm:text-lg leading-relaxed text-gray-300 mb-10">
                            Verify the authenticity of internship certificates issued by Sovir Technologies.
                            Enter the Certificate ID or scan the QR code on the certificate.
                        </motion.p>

                        {/* Search Box */}
                        <motion.div variants={fadeInUp}>
                            <form onSubmit={handleSubmit} className="mx-auto max-w-xl">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                            <Search className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={certificateId}
                                            onChange={(e) => setCertificateId(e.target.value)}
                                            placeholder="Enter Certificate ID (e.g., SVR-INT-2026-001)"
                                            className="w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-md py-4 pl-12 pr-4 text-white placeholder:text-gray-400 focus:border-[#d6b161] focus:outline-none focus:ring-2 focus:ring-[#d6b161]/30 transition-all text-sm sm:text-base"
                                            id="certificate-id-input"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSearching || !certificateId.trim()}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d6b161] px-8 py-4 font-semibold text-[#0a192f] hover:bg-[#c4a055] focus:outline-none focus:ring-2 focus:ring-[#d6b161] focus:ring-offset-2 focus:ring-offset-[#0a192f] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-[#d6b161]/25 text-sm sm:text-base"
                                        id="verify-button"
                                    >
                                        {isSearching ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Verifying...
                                            </>
                                        ) : (
                                            <>
                                                Verify
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* QR Scan hint */}
                                <p className="mt-4 text-xs sm:text-sm text-gray-400 flex items-center justify-center gap-1.5">
                                    <QrCode className="h-4 w-4" />
                                    Or scan the QR code on the certificate to verify instantly
                                </p>
                            </form>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Results Section */}
            <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <AnimatePresence mode="wait">
                        {/* Loading State */}
                        {isSearching && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-center py-16"
                            >
                                <div className="w-16 h-16 border-4 border-[#d6b161] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                                <p className="text-gray-600 dark:text-gray-400 text-lg">Verifying certificate...</p>
                            </motion.div>
                        )}

                        {/* Valid Certificate */}
                        {hasSearched && searchResult && !isSearching && (
                            <motion.div
                                key="result"
                                initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0 }}
                                variants={staggerContainer}
                                className="space-y-6"
                            >
                                {/* Status Banner */}
                                <motion.div
                                    variants={fadeInUp}
                                    className="rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800/50 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-4"
                                >
                                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <h3 className="text-xl sm:text-2xl font-bold text-green-800 dark:text-green-300">
                                            ✅ Certificate Verified — Authentic
                                        </h3>
                                        <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                                            This internship certificate was officially issued by Sovir Technologies.
                                        </p>
                                    </div>
                                </motion.div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Student Details Card */}
                                    <motion.div
                                        variants={fadeInUp}
                                        className="bg-white dark:bg-[#112240] rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6 shadow-lg"
                                    >
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <User className="w-5 h-5 text-[#d6b161]" />
                                            Student Information
                                        </h3>
                                        <div className="space-y-0">
                                            <DetailRow icon={<User className="w-4 h-4" />} label="Full Name" value={searchResult.studentName} />
                                            <DetailRow icon={<Fingerprint className="w-4 h-4" />} label="Certificate ID" value={searchResult.certificateId} highlight />
                                            <DetailRow icon={<Mail className="w-4 h-4" />} label="Email" value={searchResult.email} />
                                            <DetailRow icon={<GraduationCap className="w-4 h-4" />} label="College / University" value={searchResult.college} />
                                        </div>
                                    </motion.div>

                                    {/* Internship Details Card */}
                                    <motion.div
                                        variants={fadeInUp}
                                        className="bg-white dark:bg-[#112240] rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6 shadow-lg"
                                    >
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Briefcase className="w-5 h-5 text-[#d6b161]" />
                                            Internship Details
                                        </h3>
                                        <div className="space-y-0">
                                            <DetailRow icon={<Briefcase className="w-4 h-4" />} label="Role / Position" value={searchResult.role} />
                                            <DetailRow icon={<Building2 className="w-4 h-4" />} label="Department" value={searchResult.department} />
                                            <DetailRow icon={<Calendar className="w-4 h-4" />} label="Duration" value={`${searchResult.duration.start} – ${searchResult.duration.end}`} />
                                            <DetailRow icon={<MapPin className="w-4 h-4" />} label="Mode" value={searchResult.mode} />
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Additional Details Card */}
                                <motion.div
                                    variants={fadeInUp}
                                    className="bg-white dark:bg-[#112240] rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6 shadow-lg"
                                >
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                <Building2 className="w-5 h-5 text-[#d6b161]" />
                                                Company Details
                                            </h3>
                                            <div className="space-y-0">
                                                <DetailRow icon={<Building2 className="w-4 h-4" />} label="Company" value="SoVir Technologies LLP" />
                                                <DetailRow icon={<User className="w-4 h-4" />} label="Supervisor" value={searchResult.supervisor} />
                                                <DetailRow icon={<Calendar className="w-4 h-4" />} label="Issue Date" value={searchResult.issueDate} />
                                                <DetailRow
                                                    icon={<Clock className="w-4 h-4" />}
                                                    label="Status"
                                                    value={searchResult.status}
                                                    highlight={searchResult.status === 'Completed'}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                <GraduationCap className="w-5 h-5 text-[#d6b161]" />
                                                Key Skills Learned
                                            </h3>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {searchResult.skillsLearned.map((skill) => (
                                                    <span
                                                        key={skill}
                                                        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-[#d6b161]/10 text-[#d6b161] border border-[#d6b161]/20"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Certificate Actions */}
                                {searchResult.status === 'Completed' && (
                                    <motion.div
                                        variants={fadeInUp}
                                        className="flex flex-col sm:flex-row gap-3 justify-center"
                                    >
                                        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0a192f] dark:bg-[#d6b161] px-6 py-3.5 font-semibold text-white dark:text-[#0a192f] hover:bg-[#112240] dark:hover:bg-[#c4a055] transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base">
                                            <Eye className="w-5 h-5" />
                                            View Certificate
                                        </button>
                                        <button className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 px-6 py-3.5 font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-300 text-sm sm:text-base">
                                            <Download className="w-5 h-5" />
                                            Download Certificate (PDF)
                                        </button>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {/* Invalid Certificate */}
                        {hasSearched && notFound && !isSearching && (
                            <motion.div
                                key="not-found"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-center py-12"
                            >
                                <div className="mx-auto max-w-md">
                                    <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-8">
                                        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                                            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">
                                            ❌ Invalid Certificate ID
                                        </h3>
                                        <p className="text-red-700 dark:text-red-400 text-sm">
                                            No certificate found with this ID. Please double-check the Certificate ID and try again.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Initial State — before any search */}
                        {!hasSearched && !isSearching && (
                            <motion.div
                                key="initial"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {/* How It Works */}
                                <div className="text-center mb-12">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">How It Works</h2>
                                    <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
                                        Verify any internship certificate in three simple steps.
                                    </p>
                                </div>

                                <div className="grid sm:grid-cols-3 gap-6 mb-16">
                                    {[
                                        {
                                            icon: <Search className="w-6 h-6" />,
                                            step: '01',
                                            title: 'Enter Certificate ID',
                                            desc: 'Type the unique Certificate ID printed on the internship certificate.'
                                        },
                                        {
                                            icon: <Shield className="w-6 h-6" />,
                                            step: '02',
                                            title: 'Instant Verification',
                                            desc: 'Our system checks the certificate against our secure database.'
                                        },
                                        {
                                            icon: <CheckCircle className="w-6 h-6" />,
                                            step: '03',
                                            title: 'View Result',
                                            desc: 'See complete details and download the verified certificate.'
                                        }
                                    ].map((item) => (
                                        <motion.div
                                            key={item.step}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            className="relative bg-white dark:bg-[#112240] rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300"
                                        >
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#d6b161] rounded-full text-xs font-bold text-[#0a192f]">
                                                Step {item.step}
                                            </div>
                                            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161] mt-2 mb-4">
                                                {item.icon}
                                            </div>
                                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            {/* Security Features */}
            <section className="py-12 sm:py-16 bg-white dark:bg-[#112240]/50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                            Security Features
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
                            Every certificate issued by Sovir Technologies is protected with multiple layers of security.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-6">
                        {[
                            {
                                icon: <Fingerprint className="w-6 h-6" />,
                                title: 'Unique Certificate ID',
                                desc: 'Each certificate has a unique tamper-proof identification number.'
                            },
                            {
                                icon: <QrCode className="w-6 h-6" />,
                                title: 'QR Code Verification',
                                desc: 'Scan the QR code for instant verification via a secure link.'
                            },
                            {
                                icon: <Shield className="w-6 h-6" />,
                                title: 'Digitally Issued',
                                desc: 'All certificates are digitally generated and securely stored.'
                            }
                        ].map((feature) => (
                            <div
                                key={feature.title}
                                className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 dark:bg-[#0a192f] border border-gray-200 dark:border-gray-700/50"
                            >
                                <div className="w-12 h-12 rounded-xl bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161] mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{feature.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Company Authentication Section */}
            <section className="py-12 sm:py-16 bg-gray-50 dark:bg-[#0a192f]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-[#112240] rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6 sm:p-8 shadow-lg">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0a192f] to-[#112240] dark:from-[#d6b161]/20 dark:to-[#d6b161]/5 flex items-center justify-center border border-gray-200 dark:border-[#d6b161]/30">
                                <Building2 className="w-10 h-10 text-[#d6b161]" />
                            </div>
                            <div className="text-center sm:text-left">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">SoVir Technologies LLP</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Authorized Signatory: Director, SoVir Technologies LLP</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <Mail className="w-3.5 h-3.5 inline mr-1" />
                                    info@sovirtechnologies.in
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    <MapPin className="w-3.5 h-3.5 inline mr-1" />
                                    JLB Complex Gopadi, NH 66, Koteshwara, Karnataka 576201
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Disclaimer */}
            <section className="py-6 bg-white dark:bg-[#112240]/50 border-t border-gray-200 dark:border-gray-700/50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        This page verifies internship certificates issued by Sovir Technologies. If you find any discrepancy, please contact our support team.
                    </p>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default VerificationPage;
