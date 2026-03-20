import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    BookOpen,
    Calendar,
    Check,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Eye,
    Filter,
    GraduationCap,
    Loader2,
    Mail,
    Hash,
    Phone,
    Search,
    Trash2,
    User as UserIcon,
    X,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api, { getAssetUrl, trainingCheckoutAPI } from '../../lib/api';
import { formatPaymentState } from '../../lib/paymentFormatting';
import { formatTrainingPrice } from '../../lib/trainingPricing';

interface StudentProfile {
    _id?: string;
    name: string;
    email: string;
    phoneNumber?: string;
    germanLevel?: string;
    guardianName?: string;
    guardianPhone?: string;
    qualification?: string;
    dateOfBirth?: string;
    avatar?: string;
    role?: string;
    createdAt?: string;
}

interface Enrollment {
    _id: string;
    trainingType: 'language' | 'skill';
    userId: StudentProfile | null;
    courseTitle: string;
    name: string;
    status: string;
    createdAt?: string;
    payment: PaymentSnapshot | null;
}

interface PaymentSnapshot {
    status: string;
    amount: number | null;
    currency: string;
    method: string | null;
    gateway: string;
    razorpayOrderId: string | null;
    razorpayPaymentId: string | null;
    paidAt: string | null;
}

interface LanguageEnrollment {
    _id: string;
    courseTitle: string;
    name: string;
    status: string;
    batchId?: {
        _id: string;
        name: string;
    };
}

interface SkillEnrollment {
    _id: string;
    status: string;
    skillCourseId?: {
        _id: string;
        title: string;
    };
}

interface EnrollmentPagination {
    currentPage: number;
    totalPages: number;
    totalEnrollments: number;
    limit: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

interface TrainingPaymentAttempt {
    _id: string;
    userId?: StudentProfile | null;
    skillCourseId?: {
        _id: string;
        title: string;
    } | null;
    trainingType: 'language' | 'skill';
    origin: string;
    courseTitle: string;
    levelName?: string;
    amount: number;
    currency: string;
    paymentStatus?: string;
    paymentMethod?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    failureReason?: string;
    paymentErrorDescription?: string;
    paymentErrorReason?: string;
    status: 'created' | 'paid' | 'failed' | 'cancelled';
    paidAt?: string;
    createdAt: string;
    updatedAt: string;
}

interface PaymentAttemptPagination {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

const ENROLLMENTS_PER_PAGE = 9;
const TRAINING_PAYMENT_ISSUES_PAGE_SIZE = 6;

const formatDateTime = (value?: string | null) => {
    if (!value) return 'Not available';

    return new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatEnrollmentStatus = (value?: string | null) => {
    const normalizedValue = String(value ?? '').trim().toLowerCase();

    if (!normalizedValue) return 'Unknown';
    if (normalizedValue === 'approved' || normalizedValue === 'active') return 'Approved';
    if (normalizedValue === 'pending') return 'Pending';
    if (normalizedValue === 'rejected' || normalizedValue === 'dropped') return 'Rejected';
    if (normalizedValue === 'completed') return 'Completed';

    return normalizedValue.charAt(0).toUpperCase() + normalizedValue.slice(1);
};

const getEnrollmentStatusClasses = (value?: string | null) => {
    const normalizedValue = String(value ?? '').trim().toLowerCase();

    if (normalizedValue === 'approved' || normalizedValue === 'active') {
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }

    if (normalizedValue === 'pending') {
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    }

    if (normalizedValue === 'completed') {
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    }

    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
};

const getPaymentAttemptStatusMeta = (status: TrainingPaymentAttempt['status']) => {
    if (status === 'paid') {
        return 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300';
    }

    if (status === 'failed') {
        return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300';
    }

    if (status === 'cancelled') {
        return 'border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-[#0a192f] dark:text-gray-300';
    }

    return 'border-[#d6b161]/30 bg-[#d6b161]/10 text-[#b38f3f] dark:text-[#d6b161]';
};

const formatPaymentAttemptTitle = (attempt: TrainingPaymentAttempt) =>
    attempt.trainingType === 'language' && attempt.levelName
        ? `${attempt.courseTitle} - ${attempt.levelName}`
        : attempt.courseTitle;

const LanguageEnrollmentDetails: React.FC = () => {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [levels, setLevels] = useState<string[]>(['All']);
    const [filterLevel, setFilterLevel] = useState('All');
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [pagination, setPagination] = useState<EnrollmentPagination>({
        currentPage: 1,
        totalPages: 1,
        totalEnrollments: 0,
        limit: ENROLLMENTS_PER_PAGE,
        hasPreviousPage: false,
        hasNextPage: false,
    });

    const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
    const [selectedStudentProfile, setSelectedStudentProfile] = useState<StudentProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [languageEnrollments, setLanguageEnrollments] = useState<LanguageEnrollment[]>([]);
    const [skillEnrollments, setSkillEnrollments] = useState<SkillEnrollment[]>([]);
    const [isAvatarFullScreen, setIsAvatarFullScreen] = useState(false);
    const [paymentIssueItems, setPaymentIssueItems] = useState<TrainingPaymentAttempt[]>([]);
    const [paymentIssuePagination, setPaymentIssuePagination] = useState<PaymentAttemptPagination>({
        page: 1,
        limit: TRAINING_PAYMENT_ISSUES_PAGE_SIZE,
        totalItems: 0,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
    });
    const [isPaymentIssuesOpen, setIsPaymentIssuesOpen] = useState(false);
    const [paymentIssuesLoading, setPaymentIssuesLoading] = useState(false);
    const [paymentIssuesError, setPaymentIssuesError] = useState('');
    const [paymentIssueDeletingId, setPaymentIssueDeletingId] = useState<string | null>(null);

    useEffect(() => {
        void fetchEnrollments();
    }, [pagination.currentPage, searchQuery, filterLevel]);

    useEffect(() => {
        void fetchPaymentIssues(1);
    }, []);

    useEffect(() => {
        if (!selectedEnrollment) {
            setIsAvatarFullScreen(false);
        }
    }, [selectedEnrollment]);

    const fetchEnrollments = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/admin/enrollments/pending', {
                params: {
                    page: pagination.currentPage,
                    limit: ENROLLMENTS_PER_PAGE,
                    search: searchQuery || undefined,
                    level: filterLevel !== 'All' ? filterLevel : undefined,
                },
            });

            const nextPagination = response.data.pagination || {};

            setEnrollments(response.data.enrollments || []);
            setLevels(response.data.availableLevels || ['All']);
            setPagination({
                currentPage: nextPagination.currentPage || 1,
                totalPages: nextPagination.totalPages || 1,
                totalEnrollments: nextPagination.totalEnrollments || 0,
                limit: nextPagination.limit || ENROLLMENTS_PER_PAGE,
                hasPreviousPage: !!nextPagination.hasPreviousPage,
                hasNextPage: !!nextPagination.hasNextPage,
            });
        } catch (err: any) {
            console.error('Fetch error:', err);
            setError(err.response?.data?.message || 'Failed to fetch enrollments');
        } finally {
            setLoading(false);
        }
    };

    const syncPaymentIssueState = (
        paymentAttempts: TrainingPaymentAttempt[],
        nextPagination?: Partial<PaymentAttemptPagination>,
        fallbackPage = 1
    ) => {
        setPaymentIssueItems(paymentAttempts);
        setPaymentIssuePagination({
            page: nextPagination?.page ?? fallbackPage,
            limit: nextPagination?.limit ?? TRAINING_PAYMENT_ISSUES_PAGE_SIZE,
            totalItems: nextPagination?.totalItems ?? paymentAttempts.length,
            totalPages: nextPagination?.totalPages ?? 1,
            hasPreviousPage: nextPagination?.hasPreviousPage ?? false,
            hasNextPage: nextPagination?.hasNextPage ?? false,
        });
    };

    const fetchPaymentIssues = async (page = 1, options?: { showLoader?: boolean }) => {
        try {
            if (options?.showLoader) {
                setPaymentIssuesLoading(true);
            }

            setPaymentIssuesError('');

            const response = await trainingCheckoutAPI.getAllPaymentAttemptsAdmin({
                page,
                limit: TRAINING_PAYMENT_ISSUES_PAGE_SIZE,
                issuesOnly: true,
            });

            syncPaymentIssueState(
                response.paymentAttempts || [],
                response.pagination,
                page
            );
        } catch (err: any) {
            console.error('Failed to fetch training payment issues:', err);
            setPaymentIssuesError(err.response?.data?.message || 'Failed to load payment issues.');
        } finally {
            if (options?.showLoader) {
                setPaymentIssuesLoading(false);
            }
        }
    };

    const refreshAfterDecision = async () => {
        if (enrollments.length === 1 && pagination.currentPage > 1) {
            setPagination((current) => ({ ...current, currentPage: current.currentPage - 1 }));
            return;
        }

        await fetchEnrollments();
    };

    const handleApprove = async (enrollment: Enrollment, event?: React.MouseEvent) => {
        event?.stopPropagation();
        if (processingId) return;
        setProcessingId(enrollment._id);

        try {
            if (enrollment.trainingType === 'skill') {
                await api.post('/enrollment/accept', { enrollmentId: enrollment._id });
            } else {
                await api.post(`/language-training/admin/enroll/${enrollment._id}/approve`);
            }

            if (selectedEnrollment?._id === enrollment._id) {
                setSelectedEnrollment(null);
                setSelectedStudentProfile(null);
            }
            await refreshAfterDecision();
        } catch (err) {
            console.error('Failed to approve enrollment', err);
            window.alert('Failed to approve enrollment.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (enrollment: Enrollment, event?: React.MouseEvent) => {
        event?.stopPropagation();
        if (processingId) return;
        if (!window.confirm('Are you sure you want to reject this enrollment?')) return;
        setProcessingId(enrollment._id);

        try {
            if (enrollment.trainingType === 'skill') {
                await api.post('/enrollment/reject', { enrollmentId: enrollment._id });
            } else {
                await api.post(`/language-training/admin/enroll/${enrollment._id}/reject`);
            }

            if (selectedEnrollment?._id === enrollment._id) {
                setSelectedEnrollment(null);
                setSelectedStudentProfile(null);
            }
            await refreshAfterDecision();
        } catch (err) {
            console.error('Failed to reject enrollment', err);
            window.alert('Failed to reject enrollment.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleSearchSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setPagination((current) => ({ ...current, currentPage: 1 }));
        setSearchQuery(searchInput.trim());
    };

    const handleOpenEnrollment = async (enrollment: Enrollment) => {
        setSelectedEnrollment(enrollment);
        setSelectedStudentProfile(enrollment.userId);
        setProfileLoading(true);
        setLanguageEnrollments([]);
        setSkillEnrollments([]);

        if (!enrollment.userId?._id) {
            setProfileLoading(false);
            return;
        }

        try {
            const response = await api.get(`/admin/students/${enrollment.userId._id}/details`);
            setSelectedStudentProfile(response.data.student || enrollment.userId);
            setLanguageEnrollments(response.data.languageEnrollments || []);
            setSkillEnrollments(response.data.skillEnrollments || []);
        } catch (err) {
            console.error('Failed to load student details', err);
        } finally {
            setProfileLoading(false);
        }
    };

    const closeProfile = () => {
        setSelectedEnrollment(null);
        setSelectedStudentProfile(null);
    };

    const handleOpenPaymentIssues = async () => {
        setIsPaymentIssuesOpen(true);
        await fetchPaymentIssues(1, { showLoader: true });
    };

    const handleDeletePaymentIssue = async (attempt: TrainingPaymentAttempt) => {
        if (!window.confirm('Delete this training payment issue record?')) {
            return;
        }

        try {
            setPaymentIssueDeletingId(attempt._id);
            await trainingCheckoutAPI.deletePaymentAttemptAdmin(attempt._id);

            const nextPage =
                paymentIssueItems.length === 1 && paymentIssuePagination.page > 1
                    ? paymentIssuePagination.page - 1
                    : paymentIssuePagination.page;

            await fetchPaymentIssues(nextPage, { showLoader: true });
        } catch (err: any) {
            console.error('Failed to delete training payment issue:', err);
            window.alert(err.response?.data?.message || 'Failed to delete training payment issue.');
        } finally {
            setPaymentIssueDeletingId(null);
        }
    };

    const enrollmentStart = enrollments.length === 0 ? 0 : (pagination.currentPage - 1) * pagination.limit + 1;
    const enrollmentEnd = enrollments.length === 0 ? 0 : Math.min(pagination.currentPage * pagination.limit, pagination.totalEnrollments);
    const paymentIssueCount = paymentIssuePagination.totalItems;
    const paymentIssueStart =
        paymentIssueCount === 0
            ? 0
            : (paymentIssuePagination.page - 1) * paymentIssuePagination.limit + 1;
    const paymentIssueEnd =
        paymentIssueCount === 0
            ? 0
            : Math.min(paymentIssuePagination.page * paymentIssuePagination.limit, paymentIssueCount);

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">Verify Enrollments</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Review language and skill training requests with paginated loading and full student profiles.
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#112240] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by student, email, phone, course..."
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent outline-none transition-all"
                        />
                    </form>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Filter className="text-gray-500 dark:text-gray-400 w-5 h-5" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Filter by Language Level:</span>
                        <select
                            value={filterLevel}
                            onChange={(event) => {
                                setFilterLevel(event.target.value);
                                setPagination((current) => ({ ...current, currentPage: 1 }));
                            }}
                            className="flex-1 md:w-44 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] outline-none cursor-pointer"
                        >
                            {levels.map((level) => (
                                <option key={level} value={level}>
                                    {level}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#112240]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment Issue Center</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Review failed and cancelled training payments separately from the pending enrollment queue.
                            </p>
                        </div>
                        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                            <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 dark:border-orange-900/40 dark:bg-orange-900/20 dark:text-orange-300">
                                {paymentIssueCount} issue{paymentIssueCount === 1 ? '' : 's'}
                            </span>
                            <button
                                type="button"
                                onClick={() => void handleOpenPaymentIssues()}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d6b161]/30 bg-[#d6b161]/10 px-4 py-2 text-sm font-semibold text-[#d6b161] transition-colors hover:bg-[#d6b161]/20"
                            >
                                <Eye className="h-4 w-4" />
                                View Payment Issues
                            </button>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-3">
                        <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4 dark:border-orange-900/40 dark:bg-orange-900/10">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700 dark:text-orange-300">
                                Queue Size
                            </p>
                            <p className="mt-2 text-2xl font-bold text-[#0a192f] dark:text-white">{paymentIssueCount}</p>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Failed and cancelled attempts waiting for admin review.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0a192f]">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                                Page Size
                            </p>
                            <p className="mt-2 text-2xl font-bold text-[#0a192f] dark:text-white">{TRAINING_PAYMENT_ISSUES_PAGE_SIZE}</p>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Each page in the modal shows a compact batch of payment issues.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0a192f]">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                                Cleanup
                            </p>
                            <p className="mt-2 text-2xl font-bold text-[#0a192f] dark:text-white">Delete</p>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Remove stale failed or cancelled attempts without cluttering the main enrollment list.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[#112240]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Showing <span className="font-semibold text-gray-900 dark:text-white">{enrollmentStart}</span> to{' '}
                            <span className="font-semibold text-gray-900 dark:text-white">{enrollmentEnd}</span> of{' '}
                            <span className="font-semibold text-gray-900 dark:text-white">{pagination.totalEnrollments}</span> pending enrollments
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setPagination((current) => ({ ...current, currentPage: Math.max(1, current.currentPage - 1) }))}
                                disabled={!pagination.hasPreviousPage}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-[#0a192f] dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </button>
                            <span className="px-2 text-sm text-gray-600 dark:text-gray-400">
                                Page <span className="font-semibold text-gray-900 dark:text-white">{pagination.currentPage}</span> of{' '}
                                <span className="font-semibold text-gray-900 dark:text-white">{pagination.totalPages}</span>
                            </span>
                            <button
                                type="button"
                                onClick={() => setPagination((current) => ({ ...current, currentPage: Math.min(current.totalPages, current.currentPage + 1) }))}
                                disabled={!pagination.hasNextPage}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-[#0a192f] dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-10 w-10 animate-spin text-[#d6b161]" />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-4 rounded-lg text-center">
                        {error}
                    </div>
                ) : enrollments.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-[#112240] rounded-xl border border-gray-200 dark:border-gray-800">
                        <div className="bg-gray-100 dark:bg-[#0a192f] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Pending Requests</h3>
                        <p className="text-gray-500 dark:text-gray-400">All caught up. There are no enrollment requests pending approval.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {enrollments.map((enrollment) => (
                            <div
                                key={enrollment._id}
                                className="bg-[#0B1221] text-white rounded-xl border border-gray-800 p-6 shadow-lg hover:shadow-xl transition-all relative group cursor-pointer"
                                onClick={() => void handleOpenEnrollment(enrollment)}
                            >
                                <div className="flex justify-between items-start mb-4 gap-3">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 rounded-full bg-[#1A2333] flex items-center justify-center text-[#d6b161] font-bold text-xl border border-gray-700 overflow-hidden shrink-0">
                                            {enrollment.userId?.avatar ? (
                                                <img
                                                    src={getAssetUrl(enrollment.userId.avatar)}
                                                    alt={enrollment.userId.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                enrollment.userId?.name?.charAt(0).toUpperCase() || 'U'
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-white text-lg truncate">
                                                {enrollment.userId?.name || 'Unknown User'}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 truncate">
                                                <Mail className="w-3 h-3 shrink-0" />
                                                <span className="truncate">{enrollment.userId?.email || 'No Email'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-2">
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#1E3A8A] text-blue-300 border border-blue-900">
                                            {enrollment.trainingType === 'language' ? enrollment.name : 'Skill Training'}
                                        </span>
                                        {enrollment.payment?.status && (
                                            <span className="inline-flex items-center rounded-full border border-green-900/60 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300">
                                                Payment {formatPaymentState(enrollment.payment.status)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="p-4 rounded-lg bg-[#111827] border border-gray-700">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Applying For</p>
                                        <p className="text-base font-medium text-white flex items-center gap-2">
                                            <BookOpen className="w-4 h-4 text-[#d6b161]" />
                                            {enrollment.courseTitle}
                                        </p>
                                        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                                            {enrollment.trainingType === 'language' ? 'Language Training' : 'Skill Training'}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="rounded-lg border border-gray-800 bg-[#111827] p-3">
                                            <p className="text-xs uppercase tracking-wide text-gray-500">Phone</p>
                                            <p className="mt-1 text-white font-medium">{enrollment.userId?.phoneNumber || 'Not provided'}</p>
                                        </div>
                                        <div className="rounded-lg border border-gray-800 bg-[#111827] p-3">
                                            <p className="text-xs uppercase tracking-wide text-gray-500">Requested</p>
                                            <p className="mt-1 text-white font-medium">
                                                {enrollment.createdAt ? new Date(enrollment.createdAt).toLocaleDateString() : 'Not available'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-auto">
                                    <button
                                        onClick={(event) => handleApprove(enrollment, event)}
                                        disabled={!!processingId}
                                        className={`flex-1 bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] py-2.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg ${processingId ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {processingId === enrollment._id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Approve
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={(event) => handleReject(enrollment, event)}
                                        disabled={!!processingId}
                                        className={`flex-1 bg-transparent border border-red-900/50 text-red-500 hover:bg-red-900/20 py-2.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors ${processingId ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        <X className="w-4 h-4" />
                                        Reject
                                    </button>
                                </div>

                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Eye className="w-5 h-5 text-gray-400 hover:text-white" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isPaymentIssuesOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsPaymentIssuesOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-[#112240]"
                        >
                            <div className="border-b border-gray-200 dark:border-gray-800">
                                <div className="flex items-start justify-between gap-4 p-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Issues</h2>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                            Review failed or cancelled training checkout attempts and delete stale records when needed.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsPaymentIssuesOpen(false)}
                                        className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[70vh] overflow-y-auto p-6">
                                {paymentIssuesLoading ? (
                                    <div className="flex justify-center py-16">
                                        <Loader2 className="h-8 w-8 animate-spin text-[#d6b161]" />
                                    </div>
                                ) : paymentIssuesError ? (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">
                                        {paymentIssuesError}
                                    </div>
                                ) : paymentIssueItems.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-12 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                        No failed or cancelled training payment attempts right now.
                                    </div>
                                ) : (
                                    <div className="grid gap-4 lg:grid-cols-2">
                                        {paymentIssueItems.map((attempt) => {
                                            const isDeleting = paymentIssueDeletingId === attempt._id;
                                            const displayName = attempt.userId?.name || 'Unknown User';
                                            const displayEmail = attempt.userId?.email || 'Not available';
                                            const displayPhone = attempt.userId?.phoneNumber || 'Not available';

                                            return (
                                                <article
                                                    key={attempt._id}
                                                    className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-[#0a192f]"
                                                >
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div>
                                                            <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                                                {displayName}
                                                            </h3>
                                                            <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                                {formatPaymentAttemptTitle(attempt)}
                                                            </p>
                                                            <p className="mt-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                                {attempt.trainingType === 'language' ? 'Language Training' : 'Skill Training'}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getPaymentAttemptStatusMeta(attempt.status)}`}>
                                                                {formatPaymentState(attempt.status)}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => void handleDeletePaymentIssue(attempt)}
                                                                disabled={isDeleting}
                                                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                                                            >
                                                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                                                        <div>
                                                            <p className="text-gray-500 dark:text-gray-400">Contact</p>
                                                            <p className="font-semibold text-gray-900 dark:text-white">{displayEmail}</p>
                                                            <p className="text-gray-600 dark:text-gray-300">{displayPhone}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500 dark:text-gray-400">Amount</p>
                                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                                {formatTrainingPrice(attempt.amount / 100, attempt.currency)}
                                                            </p>
                                                            <p className="text-gray-600 dark:text-gray-300">
                                                                {attempt.levelName || (attempt.trainingType === 'skill' ? 'Skill Training' : 'Language Training')}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500 dark:text-gray-400">Order ID</p>
                                                            <p className="font-mono text-xs font-semibold text-gray-900 dark:text-white">
                                                                {attempt.razorpayOrderId || 'Not created'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500 dark:text-gray-400">Payment ID</p>
                                                            <p className="font-mono text-xs font-semibold text-gray-900 dark:text-white">
                                                                {attempt.razorpayPaymentId || 'Not available'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500 dark:text-gray-400">Gateway Status</p>
                                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                                {formatPaymentState(attempt.paymentStatus)}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500 dark:text-gray-400">Payment Method</p>
                                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                                {attempt.paymentMethod || 'Not available'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 space-y-2 text-sm">
                                                        <p className="text-gray-500 dark:text-gray-400">
                                                            Failure reason:{' '}
                                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                                {attempt.failureReason || attempt.paymentErrorDescription || attempt.paymentErrorReason || 'Not available'}
                                                            </span>
                                                        </p>
                                                        <p className="text-gray-500 dark:text-gray-400">
                                                            Recorded:{' '}
                                                            <span className="font-semibold text-gray-900 dark:text-white">{formatDateTime(attempt.createdAt)}</span>
                                                        </p>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-800">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Showing{' '}
                                        <span className="font-semibold text-gray-900 dark:text-white">{paymentIssueStart}</span>{' '}
                                        to{' '}
                                        <span className="font-semibold text-gray-900 dark:text-white">{paymentIssueEnd}</span>{' '}
                                        of{' '}
                                        <span className="font-semibold text-gray-900 dark:text-white">{paymentIssueCount}</span>{' '}
                                        issues
                                    </p>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => void fetchPaymentIssues(paymentIssuePagination.page - 1, { showLoader: true })}
                                            disabled={!paymentIssuePagination.hasPreviousPage || paymentIssuesLoading}
                                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-[#0a192f] dark:text-gray-300 dark:hover:bg-gray-800"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Previous
                                        </button>

                                        <span className="px-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                                            Page{' '}
                                            <span className="text-gray-900 dark:text-white">{paymentIssuePagination.page}</span>{' '}
                                            of{' '}
                                            <span className="text-gray-900 dark:text-white">{paymentIssuePagination.totalPages}</span>
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => void fetchPaymentIssues(paymentIssuePagination.page + 1, { showLoader: true })}
                                            disabled={!paymentIssuePagination.hasNextPage || paymentIssuesLoading}
                                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-[#0a192f] dark:text-gray-300 dark:hover:bg-gray-800"
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedEnrollment && selectedStudentProfile && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={closeProfile}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-[#112240]"
                        >
                            <button
                                type="button"
                                onClick={closeProfile}
                                className="absolute right-4 top-4 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                <X className="h-6 w-6" />
                            </button>

                            <div className="p-8">
                                <div className="mb-8 flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
                                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#d6b161] text-4xl font-bold text-[#0a192f] shadow-lg dark:border-[#0a192f] sm:h-32 sm:w-32 sm:text-5xl">
                                        {selectedStudentProfile.avatar ? (
                                            <img
                                                src={getAssetUrl(selectedStudentProfile.avatar)}
                                                alt={selectedStudentProfile.name}
                                                className="h-full w-full cursor-pointer object-cover transition-opacity hover:opacity-80"
                                                onClick={() => setIsAvatarFullScreen(true)}
                                                title="Click to view full screen"
                                            />
                                        ) : (
                                            selectedStudentProfile.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedStudentProfile.name}</h2>
                                        <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
                                            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                                <Mail className="h-4 w-4" />
                                                <span className="text-sm font-medium">{selectedStudentProfile.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                                                <Phone className="h-4 w-4" />
                                                <span className="text-sm font-medium">{selectedStudentProfile.phoneNumber || 'Not Provided'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0a192f]">
                                        <div className="mb-2 flex items-center gap-3">
                                            <BookOpen className="h-5 w-5 text-[#d6b161]" />
                                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Requested Course</span>
                                        </div>
                                        <p className="pl-8 font-bold text-gray-900 dark:text-white">{selectedEnrollment.courseTitle}</p>
                                    </div>
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0a192f]">
                                        <div className="mb-2 flex items-center gap-3">
                                            <BookOpen className="h-5 w-5 text-blue-500" />
                                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                                {selectedEnrollment.trainingType === 'language' ? 'Level' : 'Training Type'}
                                            </span>
                                        </div>
                                        <p className="pl-8 font-bold text-gray-900 dark:text-white">
                                            {selectedEnrollment.trainingType === 'language' ? selectedEnrollment.name : 'Skill Training'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0a192f]">
                                        <div className="mb-2 flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-purple-500" />
                                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Date of Birth</span>
                                        </div>
                                        <p className="pl-8 font-bold text-gray-900 dark:text-white">
                                            {selectedStudentProfile.dateOfBirth ? new Date(selectedStudentProfile.dateOfBirth).toLocaleDateString() : 'Not Provided'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0a192f]">
                                        <div className="mb-2 flex items-center gap-3">
                                            <GraduationCap className="h-5 w-5 text-orange-500" />
                                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Qualification</span>
                                        </div>
                                        <p className="pl-8 font-bold text-gray-900 dark:text-white">{selectedStudentProfile.qualification || 'Not Provided'}</p>
                                    </div>
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0a192f]">
                                        <div className="mb-2 flex items-center gap-3">
                                            <BookOpen className="h-5 w-5 text-[#d6b161]" />
                                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">German Level</span>
                                        </div>
                                        <p className="pl-8 font-bold text-gray-900 dark:text-white">{selectedStudentProfile.germanLevel || 'Not Provided'}</p>
                                    </div>
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0a192f]">
                                        <div className="mb-2 flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-[#d6b161]" />
                                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Requested On</span>
                                        </div>
                                        <p className="pl-8 font-bold text-gray-900 dark:text-white">
                                            {selectedEnrollment.createdAt ? new Date(selectedEnrollment.createdAt).toLocaleDateString() : 'Not Provided'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0a192f] sm:col-span-2">
                                        <div className="mb-3 flex items-center gap-3">
                                            <UserIcon className="h-5 w-5 text-pink-500" />
                                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Guardian Details</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 pl-8 sm:grid-cols-2">
                                            <div>
                                                <p className="mb-1 text-xs text-gray-500">Name</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{selectedStudentProfile.guardianName || 'Not Provided'}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-xs text-gray-500">Phone</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{selectedStudentProfile.guardianPhone || 'Not Provided'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0a192f] sm:col-span-2">
                                        <div className="mb-3 flex items-center gap-3">
                                            <CreditCard className="h-5 w-5 text-emerald-500" />
                                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Payment Details</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 pl-8 sm:grid-cols-2">
                                            <div>
                                                <p className="mb-1 text-xs text-gray-500">Amount</p>
                                                <p className="font-bold text-gray-900 dark:text-white">
                                                    {selectedEnrollment.payment?.amount !== null && selectedEnrollment.payment?.amount !== undefined
                                                        ? formatTrainingPrice(selectedEnrollment.payment.amount, selectedEnrollment.payment.currency || 'INR')
                                                        : 'Not available'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-xs text-gray-500">Gateway Status</p>
                                                <p className="font-bold text-gray-900 dark:text-white">
                                                    {formatPaymentState(selectedEnrollment.payment?.status)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-xs text-gray-500">Method</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{selectedEnrollment.payment?.method || 'Not available'}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-xs text-gray-500">Gateway</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{selectedEnrollment.payment?.gateway || 'Not available'}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-xs text-gray-500">Paid At</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{formatDateTime(selectedEnrollment.payment?.paidAt)}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 flex items-center gap-1 text-xs text-gray-500">
                                                    <Hash className="h-3.5 w-3.5" />
                                                    Order ID
                                                </p>
                                                <p className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                                                    {selectedEnrollment.payment?.razorpayOrderId || 'Not available'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="mb-1 flex items-center gap-1 text-xs text-gray-500">
                                                    <Hash className="h-3.5 w-3.5" />
                                                    Payment ID
                                                </p>
                                                <p className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                                                    {selectedEnrollment.payment?.razorpayPaymentId || 'Not available'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                                        <BookOpen className="h-5 w-5 text-[#d6b161]" />
                                        Enrolled Courses
                                    </h3>

                                    {profileLoading ? (
                                        <div className="py-8 text-center">
                                            <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-[#d6b161]" />
                                            <p className="text-sm text-gray-500">Loading profile details...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {languageEnrollments.length > 0 && (
                                                <div>
                                                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Language Trainings</h4>
                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                        {languageEnrollments.map((enrollment) => (
                                                            <div key={enrollment._id} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-[#112240]">
                                                                <div className="mb-1 font-bold text-gray-900 dark:text-white">{enrollment.courseTitle}</div>
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span className="text-gray-600 dark:text-gray-400">{enrollment.name}</span>
                                                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                                        getEnrollmentStatusClasses(enrollment.status)
                                                                    }`}>
                                                                        {formatEnrollmentStatus(enrollment.status)}
                                                                    </span>
                                                                </div>
                                                                {enrollment.batchId && (
                                                                    <div className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                                                                        Assigned Batch: Class - {enrollment.batchId.name}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {skillEnrollments.length > 0 && (
                                                <div className={languageEnrollments.length > 0 ? 'mt-6' : ''}>
                                                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Skill Trainings</h4>
                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                        {skillEnrollments.map((enrollment) => (
                                                            <div key={enrollment._id} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-[#112240]">
                                                                <div className="mb-1 font-bold text-gray-900 dark:text-white">
                                                                    {enrollment.skillCourseId?.title || 'Unknown Course'}
                                                                </div>
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span className="text-gray-600 dark:text-gray-400">Skill Development</span>
                                                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                                        getEnrollmentStatusClasses(enrollment.status)
                                                                    }`}>
                                                                        {formatEnrollmentStatus(enrollment.status)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {languageEnrollments.length === 0 && skillEnrollments.length === 0 && (
                                                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-6 text-center dark:border-gray-800 dark:bg-[#0a192f]">
                                                    <p className="text-gray-500 dark:text-gray-400">No course enrollments found.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <button
                                        onClick={() => handleApprove(selectedEnrollment)}
                                        disabled={!!processingId}
                                        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#d6b161] px-6 py-3 font-bold text-[#0a192f] transition-colors hover:bg-[#c4a055] ${processingId ? 'cursor-not-allowed opacity-70' : ''}`}
                                    >
                                        {processingId === selectedEnrollment._id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Approve Enrollment
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleReject(selectedEnrollment)}
                                        disabled={!!processingId}
                                        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-50 px-6 py-3 font-bold text-red-700 transition-colors hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30 ${processingId ? 'cursor-not-allowed opacity-70' : ''}`}
                                    >
                                        <X className="w-4 h-4" />
                                        Reject Enrollment
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {isAvatarFullScreen && selectedStudentProfile?.avatar && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm" onClick={() => setIsAvatarFullScreen(false)}>
                    <button type="button" className="absolute right-4 top-4 p-2 text-white transition-colors hover:text-gray-300" onClick={() => setIsAvatarFullScreen(false)}>
                        <X className="h-8 w-8" />
                    </button>
                    <img
                        src={getAssetUrl(selectedStudentProfile.avatar)}
                        alt="Full Screen Avatar"
                        className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    />
                </div>
            )}
        </AdminLayout>
    );
};

export default LanguageEnrollmentDetails;
