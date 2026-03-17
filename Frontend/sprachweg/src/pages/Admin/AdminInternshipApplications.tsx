import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    Briefcase,
    Building,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Download,
    Eye,
    FileText,
    GraduationCap,
    Hash,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Search,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { getAssetUrl, internshipApplicationAPI } from '../../lib/api';

type InternshipApplicationStatus = 'submitted' | 'accepted' | 'rejected' | 'reviewed' | 'shortlisted';
type DisplayStatus = 'submitted' | 'accepted' | 'rejected';

interface InternshipApplicantUser {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    role: string;
    avatar?: string;
}

interface InternshipApplication {
    _id: string;
    userId?: InternshipApplicantUser;
    accountName: string;
    accountEmail: string;
    accountPhoneNumber?: string;
    internshipTitle: string;
    internshipMode?: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
    whatsapp: string;
    college: string;
    registration: string;
    department: string;
    semester: string;
    passingYear: string;
    address: string;
    source: string;
    resumeUrl: string;
    resumeOriginalName: string;
    status: InternshipApplicationStatus;
    referenceCode: string;
    createdAt: string;
    updatedAt: string;
}

const normalizeStatus = (status: InternshipApplicationStatus): DisplayStatus => {
    if (status === 'accepted') return 'accepted';
    if (status === 'rejected') return 'rejected';
    return 'submitted';
};

const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const formatInternshipMode = (mode?: string) => {
    if (!mode) return 'Not specified';
    return mode.charAt(0).toUpperCase() + mode.slice(1);
};

const getStatusMeta = (status: DisplayStatus) => {
    if (status === 'accepted') {
        return {
            label: 'Accepted',
            badgeClass: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900/40',
            actionClass: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/40',
        };
    }

    if (status === 'rejected') {
        return {
            label: 'Rejected',
            badgeClass: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900/40',
            actionClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/40',
        };
    }

    return {
        label: 'Pending Review',
        badgeClass: 'bg-[#d6b161]/15 text-[#d6b161] border-[#d6b161]/30',
        actionClass: 'bg-[#d6b161]/10 text-[#d6b161] border-[#d6b161]/25',
    };
};

const AdminInternshipApplications: React.FC = () => {
    const APPLICATIONS_PER_PAGE = 10;
    const [applications, setApplications] = useState<InternshipApplication[]>([]);
    const [selectedApplication, setSelectedApplication] = useState<InternshipApplication | null>(null);
    const [isAvatarFullScreen, setIsAvatarFullScreen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | DisplayStatus>('submitted');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchApplications();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await internshipApplicationAPI.getAllAdmin();
            setApplications(response.applications || []);
        } catch (err: any) {
            console.error('Failed to fetch internship applications:', err);
            setError(err.response?.data?.message || 'Failed to load internship applications.');
        } finally {
            setLoading(false);
        }
    };

    const handleDecision = async (application: InternshipApplication, nextStatus: 'accepted' | 'rejected') => {
        const normalizedStatus = normalizeStatus(application.status);
        const confirmationText =
            nextStatus === 'accepted'
                ? 'Accept this internship application?'
                : normalizedStatus === 'accepted'
                    ? 'Mark this accepted internship application as rejected?'
                    : 'Reject this internship application?';

        if (!window.confirm(confirmationText)) {
            return;
        }

        try {
            setProcessingId(application._id);
            const response = await internshipApplicationAPI.updateStatus(application._id, nextStatus);
            const updatedApplication = response.application as InternshipApplication;

            setApplications((currentApplications) =>
                currentApplications.map((currentApplication) =>
                    currentApplication._id === updatedApplication._id ? updatedApplication : currentApplication
                )
            );

            setSelectedApplication((currentSelectedApplication) =>
                currentSelectedApplication?._id === updatedApplication._id ? updatedApplication : currentSelectedApplication
            );
        } catch (err: any) {
            console.error(`Failed to ${nextStatus} internship application:`, err);
            window.alert(err.response?.data?.message || 'Failed to update internship application status.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDeleteRejectedApplication = async (application: InternshipApplication) => {
        if (normalizeStatus(application.status) !== 'rejected') {
            window.alert('Only rejected internship applications can be deleted.');
            return;
        }

        if (!window.confirm('Delete this rejected internship application? The uploaded resume will also be deleted.')) {
            return;
        }

        try {
            setProcessingId(application._id);
            await internshipApplicationAPI.deleteRejected(application._id);

            setApplications((currentApplications) =>
                currentApplications.filter((currentApplication) => currentApplication._id !== application._id)
            );

            setSelectedApplication((currentSelectedApplication) =>
                currentSelectedApplication?._id === application._id ? null : currentSelectedApplication
            );
        } catch (err: any) {
            console.error('Failed to delete rejected internship application:', err);
            window.alert(err.response?.data?.message || 'Failed to delete internship application.');
        } finally {
            setProcessingId(null);
        }
    };

    const filteredApplications = [...applications]
        .filter((application) => {
            const normalizedStatus = normalizeStatus(application.status);
            const matchesFilter = statusFilter === 'all' || normalizedStatus === statusFilter;
            const combinedSearch = [
                application.firstName,
                application.lastName,
                application.email,
                application.whatsapp,
                application.internshipTitle,
                application.internshipMode,
                application.college,
                application.referenceCode,
            ]
                .join(' ')
                .toLowerCase();

            return matchesFilter && combinedSearch.includes(searchTerm.toLowerCase().trim());
        })
        .sort((left, right) => {
            const statusPriority: Record<DisplayStatus, number> = {
                submitted: 0,
                accepted: 1,
                rejected: 2,
            };

            const statusDifference =
                statusPriority[normalizeStatus(left.status)] - statusPriority[normalizeStatus(right.status)];

            if (statusDifference !== 0) {
                return statusDifference;
            }

            return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        });

    const statusCounts = {
        submitted: applications.filter((application) => normalizeStatus(application.status) === 'submitted').length,
        accepted: applications.filter((application) => normalizeStatus(application.status) === 'accepted').length,
        rejected: applications.filter((application) => normalizeStatus(application.status) === 'rejected').length,
    };

    const totalPages = Math.max(1, Math.ceil(filteredApplications.length / APPLICATIONS_PER_PAGE));
    const paginatedApplications = filteredApplications.slice(
        (currentPage - 1) * APPLICATIONS_PER_PAGE,
        currentPage * APPLICATIONS_PER_PAGE
    );

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    useEffect(() => {
        if (!selectedApplication) {
            setIsAvatarFullScreen(false);
        }
    }, [selectedApplication]);

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Link
                            to="/admin-dashboard"
                            className="inline-flex items-center text-sm text-gray-500 hover:text-[#d6b161] mb-2 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            Internship Requests
                            <span className="bg-[#d6b161] text-[#0a192f] text-sm font-bold px-3 py-1 rounded-full">
                                {statusCounts.submitted} Pending
                            </span>
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Review internship applicants, open their full details, and accept or reject each request.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-[#d6b161]/30 bg-[#d6b161]/10 p-5">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending Review</p>
                        <p className="mt-2 text-3xl font-bold text-[#0a192f] dark:text-white">{statusCounts.submitted}</p>
                    </div>
                    <div className="rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-900/40 dark:bg-green-900/10">
                        <p className="text-sm font-medium text-green-700 dark:text-green-300">Accepted</p>
                        <p className="mt-2 text-3xl font-bold text-[#0a192f] dark:text-white">{statusCounts.accepted}</p>
                    </div>
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/40 dark:bg-red-900/10">
                        <p className="text-sm font-medium text-red-700 dark:text-red-300">Rejected</p>
                        <p className="mt-2 text-3xl font-bold text-[#0a192f] dark:text-white">{statusCounts.rejected}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#112240]">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Applications</p>
                        <p className="mt-2 text-3xl font-bold text-[#0a192f] dark:text-white">{applications.length}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#112240] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, email, internship, mode, college, or reference..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-[#d6b161] outline-none"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: 'Pending', value: 'submitted' },
                            { label: 'Accepted', value: 'accepted' },
                            { label: 'Rejected', value: 'rejected' },
                            { label: 'All', value: 'all' },
                        ].map((filterOption) => (
                            <button
                                key={filterOption.value}
                                onClick={() => setStatusFilter(filterOption.value as 'all' | DisplayStatus)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    statusFilter === filterOption.value
                                        ? 'bg-[#d6b161] text-[#0a192f]'
                                        : 'bg-gray-100 dark:bg-[#0a192f] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                                }`}
                            >
                                {filterOption.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 text-[#d6b161] animate-spin" />
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">
                        {error}
                    </div>
                ) : filteredApplications.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-[#112240] rounded-2xl border border-gray-200 dark:border-gray-800">
                        <div className="bg-gray-100 dark:bg-[#0a192f] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Briefcase className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No internship requests found</h3>
                        <p className="text-gray-500 dark:text-gray-400">Try adjusting the search or status filter.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {paginatedApplications.map((application) => {
                            const normalizedStatus = normalizeStatus(application.status);
                            const statusMeta = getStatusMeta(normalizedStatus);
                            const isPending = normalizedStatus === 'submitted';
                            const isAccepted = normalizedStatus === 'accepted';
                            const isRejected = normalizedStatus === 'rejected';
                            const isProcessing = processingId === application._id;

                            return (
                                <div
                                    key={application._id}
                                    className="bg-white dark:bg-[#112240] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all"
                                >
                                    <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                    {application.firstName} {application.lastName}
                                                </h3>
                                                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.badgeClass}`}>
                                                    {statusMeta.label}
                                                </span>
                                                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300">
                                                    {application.internshipTitle}
                                                </span>
                                                <span className="inline-flex items-center rounded-full border border-[#d6b161]/30 bg-[#d6b161]/10 px-3 py-1 text-xs font-semibold text-[#b38f3f] dark:text-[#d6b161]">
                                                    {formatInternshipMode(application.internshipMode)}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Mail className="w-4 h-4" />
                                                    {application.email}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Phone className="w-4 h-4" />
                                                    {application.whatsapp}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(application.createdAt)}
                                                </span>
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-[#0a192f]">
                                                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Reference</p>
                                                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">{application.referenceCode}</p>
                                                </div>
                                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-[#0a192f]">
                                                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Mode</p>
                                                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">{formatInternshipMode(application.internshipMode)}</p>
                                                </div>
                                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-[#0a192f]">
                                                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">College</p>
                                                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">{application.college}</p>
                                                </div>
                                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-[#0a192f]">
                                                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Department</p>
                                                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">{application.department}</p>
                                                </div>
                                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-[#0a192f]">
                                                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Semester</p>
                                                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">{application.semester}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row xl:flex-col gap-2 shrink-0">
                                            <button
                                                onClick={() => setSelectedApplication(application)}
                                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d6b161]/30 bg-[#d6b161]/10 px-4 py-2 text-sm font-medium text-[#d6b161] hover:bg-[#d6b161]/20 transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Details
                                            </button>

                                            <a
                                                href={getAssetUrl(application.resumeUrl)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
                                            >
                                                <Download className="w-4 h-4" />
                                                Resume
                                            </a>

                                            {isRejected ? (
                                                <button
                                                    onClick={() => handleDeleteRejectedApplication(application)}
                                                    disabled={isProcessing}
                                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-60 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                                                >
                                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    Delete
                                                </button>
                                            ) : (
                                                <>
                                                    {isPending && (
                                                        <button
                                                            onClick={() => handleDecision(application, 'accepted')}
                                                            disabled={isProcessing}
                                                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors disabled:opacity-60 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30"
                                                        >
                                                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                                            Accept
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDecision(application, 'rejected')}
                                                        disabled={isProcessing}
                                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-60 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                                                    >
                                                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                                        {isAccepted ? 'Mark Rejected' : 'Reject'}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-[#112240] sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Showing{' '}
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {Math.min((currentPage - 1) * APPLICATIONS_PER_PAGE + 1, filteredApplications.length)}
                                </span>{' '}
                                to{' '}
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {Math.min(currentPage * APPLICATIONS_PER_PAGE, filteredApplications.length)}
                                </span>{' '}
                                of{' '}
                                <span className="font-semibold text-gray-900 dark:text-white">{filteredApplications.length}</span>{' '}
                                applications
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                    disabled={currentPage === 1}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-[#0a192f] dark:text-gray-300 dark:hover:bg-gray-800"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </button>

                                <span className="px-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Page <span className="text-gray-900 dark:text-white">{currentPage}</span> of{' '}
                                    <span className="text-gray-900 dark:text-white">{totalPages}</span>
                                </span>

                                <button
                                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                    disabled={currentPage === totalPages}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-[#0a192f] dark:text-gray-300 dark:hover:bg-gray-800"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedApplication && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setSelectedApplication(null)}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 24, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 24, scale: 0.98 }}
                            className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#112240]"
                        >
                            <button
                                onClick={() => setSelectedApplication(null)}
                                className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 dark:bg-[#0a192f] dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="p-8 space-y-8">
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                                    <div className="flex items-start gap-4">
                                        {selectedApplication.userId?.avatar ? (
                                            <button
                                                type="button"
                                                onClick={() => setIsAvatarFullScreen(true)}
                                                className="flex h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#d6b161]/40 bg-[#d6b161]/10 transition-transform hover:scale-[1.03]"
                                                title="Click to view profile photo"
                                            >
                                                <img
                                                    src={getAssetUrl(selectedApplication.userId.avatar)}
                                                    alt={`${selectedApplication.firstName} ${selectedApplication.lastName}`}
                                                    className="h-full w-full object-cover"
                                                />
                                            </button>
                                        ) : (
                                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#d6b161] text-2xl font-bold text-[#0a192f]">
                                                {selectedApplication.firstName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                                    {selectedApplication.firstName} {selectedApplication.lastName}
                                                </h2>
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                                                        getStatusMeta(normalizeStatus(selectedApplication.status)).badgeClass
                                                    }`}
                                                >
                                                    {getStatusMeta(normalizeStatus(selectedApplication.status)).label}
                                                </span>
                                            </div>
                                            <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300">
                                                <Briefcase className="w-4 h-4" />
                                                {selectedApplication.internshipTitle}
                                            </p>
                                            <p className="mt-3 inline-flex items-center rounded-full border border-[#d6b161]/30 bg-[#d6b161]/10 px-3 py-1 text-sm font-medium text-[#b38f3f] dark:text-[#d6b161]">
                                                Mode: {formatInternshipMode(selectedApplication.internshipMode)}
                                            </p>
                                            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    Applied {formatDate(selectedApplication.createdAt)}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Hash className="w-4 h-4" />
                                                    {selectedApplication.referenceCode}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <a
                                        href={getAssetUrl(selectedApplication.resumeUrl)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d6b161]/30 bg-[#d6b161]/10 px-4 py-3 text-sm font-semibold text-[#d6b161] hover:bg-[#d6b161]/20 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Open Resume
                                    </a>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-[#0a192f]">
                                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                                            <User className="w-5 h-5 text-[#d6b161]" />
                                            Contact Details
                                        </h3>
                                        <div className="mt-4 space-y-3 text-sm">
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">Application Email</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">{selectedApplication.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">WhatsApp / Phone</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">{selectedApplication.whatsapp}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">Account Snapshot</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">{selectedApplication.accountName}</p>
                                                <p className="text-gray-600 dark:text-gray-300">{selectedApplication.accountEmail}</p>
                                                {selectedApplication.accountPhoneNumber && (
                                                    <p className="text-gray-600 dark:text-gray-300">{selectedApplication.accountPhoneNumber}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-[#0a192f]">
                                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                                            <GraduationCap className="w-5 h-5 text-[#d6b161]" />
                                            Academic Details
                                        </h3>
                                        <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">College</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">{selectedApplication.college}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">Registration No.</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">{selectedApplication.registration}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">Department</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">{selectedApplication.department}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">Internship Mode</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">{formatInternshipMode(selectedApplication.internshipMode)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">Semester</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">{selectedApplication.semester}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">Passing Year</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">{selectedApplication.passingYear}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">Source</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">{selectedApplication.source}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-[#0a192f]">
                                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                                            <Calendar className="w-5 h-5 text-[#d6b161]" />
                                            Personal Details
                                        </h3>
                                        <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">Date of Birth</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {new Date(selectedApplication.dateOfBirth).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">Resume File</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">{selectedApplication.resumeOriginalName}</p>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <p className="text-gray-500 dark:text-gray-400">Address</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">{selectedApplication.address}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-[#0a192f]">
                                        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                                            <Building className="w-5 h-5 text-[#d6b161]" />
                                            Profile Snapshot
                                        </h3>
                                        <div className="mt-4 space-y-3 text-sm">
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">Profile Image</p>
                                                {selectedApplication.userId?.avatar ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsAvatarFullScreen(true)}
                                                        className="mt-2 inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left transition-colors hover:border-[#d6b161] hover:bg-[#d6b161]/5 dark:border-gray-700 dark:bg-[#112240] dark:hover:border-[#d6b161]/50 dark:hover:bg-[#112240]"
                                                    >
                                                        <img
                                                            src={getAssetUrl(selectedApplication.userId.avatar)}
                                                            alt={`${selectedApplication.firstName} ${selectedApplication.lastName}`}
                                                            className="h-12 w-12 rounded-xl object-cover"
                                                        />
                                                        <span className="font-semibold text-gray-900 dark:text-white">Click to view photo</span>
                                                    </button>
                                                ) : (
                                                    <p className="font-semibold text-gray-900 dark:text-white">Not provided</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                <span className="font-semibold">
                                                    {selectedApplication.userId?.email || selectedApplication.accountEmail}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <span className="font-semibold">
                                                    {selectedApplication.userId?.phoneNumber || selectedApplication.accountPhoneNumber || 'Not provided'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="font-semibold">
                                                    {selectedApplication.userId?.name || selectedApplication.accountName}
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-2 text-gray-900 dark:text-white">
                                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                                <span className="font-semibold">{selectedApplication.address}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {normalizeStatus(selectedApplication.status) !== 'rejected' && (
                                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                        {normalizeStatus(selectedApplication.status) === 'submitted' && (
                                            <button
                                                onClick={() => handleDecision(selectedApplication, 'accepted')}
                                                disabled={processingId === selectedApplication._id}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm font-semibold text-green-700 hover:bg-green-100 transition-colors disabled:opacity-60 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30"
                                            >
                                                {processingId === selectedApplication._id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <FileText className="w-4 h-4" />
                                                )}
                                                Accept Application
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDecision(selectedApplication, 'rejected')}
                                            disabled={processingId === selectedApplication._id}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-60 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                                        >
                                            {processingId === selectedApplication._id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <X className="w-4 h-4" />
                                            )}
                                            {normalizeStatus(selectedApplication.status) === 'accepted' ? 'Mark Rejected' : 'Reject Application'}
                                        </button>
                                    </div>
                                )}

                                {normalizeStatus(selectedApplication.status) === 'rejected' && (
                                    <div className="pt-2">
                                        <button
                                            onClick={() => handleDeleteRejectedApplication(selectedApplication)}
                                            disabled={processingId === selectedApplication._id}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-60 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                                        >
                                            {processingId === selectedApplication._id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                            Delete Rejected Application
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {selectedApplication?.userId?.avatar && isAvatarFullScreen && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
                    onClick={() => setIsAvatarFullScreen(false)}
                >
                    <button
                        type="button"
                        onClick={() => setIsAvatarFullScreen(false)}
                        className="absolute right-4 top-4 rounded-full p-2 text-white transition-colors hover:bg-white/10"
                    >
                        <X className="h-7 w-7" />
                    </button>
                    <img
                        src={getAssetUrl(selectedApplication.userId.avatar)}
                        alt={`${selectedApplication.firstName} ${selectedApplication.lastName}`}
                        className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    />
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminInternshipApplications;
