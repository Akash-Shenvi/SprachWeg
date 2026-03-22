import React, { useEffect, useState } from 'react';
import {
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Mail,
    Phone,
    Search,
    Trash2,
    Users,
    XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { institutionAPI } from '../../lib/api';

interface InstitutionRequest {
    _id: string;
    institutionId: {
        _id: string;
        name: string;
        email: string;
        phoneNumber?: string;
        institutionName?: string;
        contactPersonName?: string;
        city?: string;
        state?: string;
        address?: string;
    };
    courseTitle: string;
    levelName: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    studentCount: number;
    rejectionReason?: string | null;
    students: Array<{ name: string; email: string; createdUserId?: string | null }>;
}

interface InstitutionRequestSummary {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
}

interface InstitutionRequestPagination {
    currentPage: number;
    totalPages: number;
    totalRequests: number;
    limit: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

interface InstitutionRequestResponse {
    requests: InstitutionRequest[];
    availableStatuses: string[];
    summary?: InstitutionRequestSummary;
    pagination?: Partial<InstitutionRequestPagination>;
}

const REQUESTS_PER_PAGE = 10;

const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const getStatusMeta = (status: InstitutionRequest['status']) => {
    if (status === 'APPROVED') {
        return {
            label: 'Approved',
            badgeClass: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900/40',
        };
    }

    if (status === 'REJECTED') {
        return {
            label: 'Rejected',
            badgeClass: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900/40',
        };
    }

    return {
        label: 'Pending Review',
        badgeClass: 'bg-[#d6b161]/15 text-[#d6b161] border-[#d6b161]/30',
    };
};

const getStatusButtonLabel = (status: string) => {
    if (status === 'PENDING') return 'Pending';
    if (status === 'APPROVED') return 'Approved';
    if (status === 'REJECTED') return 'Rejected';
    return 'All';
};

const AdminInstitutionRequests: React.FC = () => {
    const [requests, setRequests] = useState<InstitutionRequest[]>([]);
    const [availableStatuses, setAvailableStatuses] = useState<string[]>(['All', 'PENDING', 'APPROVED', 'REJECTED']);
    const [summary, setSummary] = useState<InstitutionRequestSummary>({
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
    });
    const [pagination, setPagination] = useState<InstitutionRequestPagination>({
        currentPage: 1,
        totalPages: 1,
        totalRequests: 0,
        limit: REQUESTS_PER_PAGE,
        hasPreviousPage: false,
        hasNextPage: false,
    });
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchRequests = async (page = pagination.currentPage) => {
        try {
            setLoading(true);
            setError(null);

            const response = await institutionAPI.getAdminRequests({
                page,
                limit: REQUESTS_PER_PAGE,
                status: statusFilter !== 'All' ? statusFilter : undefined,
                search: searchQuery || undefined,
            }) as InstitutionRequestResponse;

            setRequests(response.requests || []);
            setAvailableStatuses(response.availableStatuses || ['All', 'PENDING', 'APPROVED', 'REJECTED']);
            setSummary(response.summary || { pending: 0, approved: 0, rejected: 0, total: 0 });
            setPagination({
                currentPage: response.pagination?.currentPage ?? page,
                totalPages: response.pagination?.totalPages ?? 1,
                totalRequests: response.pagination?.totalRequests ?? (response.requests || []).length,
                limit: response.pagination?.limit ?? REQUESTS_PER_PAGE,
                hasPreviousPage: response.pagination?.hasPreviousPage ?? false,
                hasNextPage: response.pagination?.hasNextPage ?? false,
            });
        } catch (err: any) {
            console.error('Failed to fetch institution requests:', err);
            setError(err.response?.data?.message || 'Failed to load institution requests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchRequests();
    }, [pagination.currentPage, searchQuery, statusFilter]);

    const refreshAfterAction = async () => {
        if (requests.length === 1 && pagination.currentPage > 1) {
            setPagination((current) => ({ ...current, currentPage: current.currentPage - 1 }));
            return;
        }

        await fetchRequests();
    };

    const handleApprove = async (requestId: string) => {
        if (!window.confirm('Approve this institution request and create all student accounts now?')) {
            return;
        }

        try {
            setProcessingId(requestId);
            await institutionAPI.approveRequest(requestId);
            await refreshAfterAction();
        } catch (err: any) {
            console.error('Failed to approve institution request:', err);
            window.alert(err.response?.data?.message || 'Failed to approve institution request.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (requestId: string) => {
        if (!window.confirm('Reject this institution request? No student accounts will be created.')) {
            return;
        }

        try {
            setProcessingId(requestId);
            await institutionAPI.rejectRequest(requestId);
            await refreshAfterAction();
        } catch (err: any) {
            console.error('Failed to reject institution request:', err);
            window.alert(err.response?.data?.message || 'Failed to reject institution request.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDeleteRejectedRequest = async (request: InstitutionRequest) => {
        if (request.status !== 'REJECTED') {
            window.alert('Only rejected institution requests can be deleted.');
            return;
        }

        if (!window.confirm('Delete this rejected institution request? This cannot be undone.')) {
            return;
        }

        try {
            setProcessingId(request._id);
            await institutionAPI.deleteRejectedRequest(request._id);
            await refreshAfterAction();
        } catch (err: any) {
            console.error('Failed to delete rejected institution request:', err);
            window.alert(err.response?.data?.message || 'Failed to delete institution request.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleSearchSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setPagination((current) => ({ ...current, currentPage: 1 }));
        setSearchQuery(searchInput.trim());
    };

    const requestStart = requests.length === 0 ? 0 : (pagination.currentPage - 1) * pagination.limit + 1;
    const requestEnd = requests.length === 0 ? 0 : Math.min(pagination.currentPage * pagination.limit, pagination.totalRequests);

    return (
        <AdminLayout>
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <Link
                            to="/admin-dashboard"
                            className="mb-2 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-[#d6b161]"
                        >
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                        <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900 dark:text-white">
                            Institution Requests
                            <span className="rounded-full bg-[#d6b161] px-3 py-1 text-sm font-bold text-[#0a192f]">
                                {summary.pending} Pending
                            </span>
                        </h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                            Review institution submissions, approve entire batches, or reject and clean up old requests.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-[#d6b161]/30 bg-[#d6b161]/10 p-5">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending Review</p>
                        <p className="mt-2 text-3xl font-bold text-[#0a192f] dark:text-white">{summary.pending}</p>
                    </div>
                    <div className="rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-900/40 dark:bg-green-900/10">
                        <p className="text-sm font-medium text-green-700 dark:text-green-300">Approved</p>
                        <p className="mt-2 text-3xl font-bold text-[#0a192f] dark:text-white">{summary.approved}</p>
                    </div>
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/40 dark:bg-red-900/10">
                        <p className="text-sm font-medium text-red-700 dark:text-red-300">Rejected</p>
                        <p className="mt-2 text-3xl font-bold text-[#0a192f] dark:text-white">{summary.rejected}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#112240]">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Requests</p>
                        <p className="mt-2 text-3xl font-bold text-[#0a192f] dark:text-white">{summary.total}</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[#112240]">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <form onSubmit={handleSearchSubmit} className="relative w-full flex-1">
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by institution, contact, student, course, or email..."
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-gray-900 outline-none transition focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161] dark:border-gray-700 dark:bg-[#0a192f] dark:text-white"
                            />
                        </form>

                        <div className="flex flex-wrap gap-2">
                            {availableStatuses.map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => {
                                        setStatusFilter(status);
                                        setPagination((current) => ({ ...current, currentPage: 1 }));
                                    }}
                                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                        statusFilter === status
                                            ? 'bg-[#d6b161] text-[#0a192f]'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-[#0a192f] dark:text-gray-400 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    {getStatusButtonLabel(status)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-[#d6b161]" />
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">
                        {error}
                    </div>
                ) : requests.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-white py-20 text-center dark:border-gray-800 dark:bg-[#112240]">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-[#0a192f]">
                            <Building2 className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">No institution requests found</h3>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">Try adjusting the search or status filter.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map((request) => {
                            const statusMeta = getStatusMeta(request.status);
                            const isPending = request.status === 'PENDING';
                            const isRejected = request.status === 'REJECTED';
                            const isProcessing = processingId === request._id;
                            const visibleStudents = request.students.slice(0, 4);
                            const hiddenStudentCount = Math.max(0, request.students.length - visibleStudents.length);

                            return (
                                <div
                                    key={request._id}
                                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-[#112240]"
                                >
                                    <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-start">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                    {request.institutionId.institutionName || request.institutionId.name}
                                                </h3>
                                                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.badgeClass}`}>
                                                    {statusMeta.label}
                                                </span>
                                                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300">
                                                    {request.courseTitle}
                                                </span>
                                                <span className="inline-flex items-center rounded-full border border-[#d6b161]/30 bg-[#d6b161]/10 px-3 py-1 text-xs font-semibold text-[#b38f3f] dark:text-[#d6b161]">
                                                    {request.levelName}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Mail className="h-4 w-4" />
                                                    {request.institutionId.email}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Phone className="h-4 w-4" />
                                                    {request.institutionId.phoneNumber || 'Phone not provided'}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Calendar className="h-4 w-4" />
                                                    {formatDate(request.createdAt)}
                                                </span>
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-[#0a192f]">
                                                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Contact</p>
                                                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                                                        {request.institutionId.contactPersonName || 'Not provided'}
                                                    </p>
                                                </div>
                                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-[#0a192f]">
                                                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Program</p>
                                                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                                                        German Language Training
                                                    </p>
                                                </div>
                                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-[#0a192f]">
                                                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Students</p>
                                                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">{request.studentCount}</p>
                                                </div>
                                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-[#0a192f]">
                                                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Location</p>
                                                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                                                        {[request.institutionId.city, request.institutionId.state].filter(Boolean).join(', ') || 'Not provided'}
                                                    </p>
                                                </div>
                                            </div>

                                            {request.rejectionReason ? (
                                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                                                    {request.rejectionReason}
                                                </div>
                                            ) : null}

                                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-[#0a192f]">
                                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                                    <h4 className="text-sm font-semibold uppercase tracking-[0.28em] text-[#d6b161]">
                                                        Student List
                                                    </h4>
                                                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-[#112240] dark:text-gray-200">
                                                        <Users className="mr-1 h-3.5 w-3.5" />
                                                        {request.studentCount} student{request.studentCount === 1 ? '' : 's'}
                                                    </span>
                                                </div>

                                                <div className="grid gap-3 md:grid-cols-2">
                                                    {visibleStudents.map((student) => (
                                                        <div
                                                            key={`${request._id}-${student.email}`}
                                                            className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-[#112240]"
                                                        >
                                                            <p className="font-semibold text-gray-900 dark:text-white">{student.name}</p>
                                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {hiddenStudentCount > 0 ? (
                                                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                                                        +{hiddenStudentCount} more student{hiddenStudentCount === 1 ? '' : 's'} in this request
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:flex-col">
                                            {isRejected ? (
                                                <button
                                                    type="button"
                                                    onClick={() => void handleDeleteRejectedRequest(request)}
                                                    disabled={isProcessing}
                                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                                                >
                                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    Delete
                                                </button>
                                            ) : (
                                                <>
                                                    {isPending && (
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleApprove(request._id)}
                                                            disabled={isProcessing}
                                                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100 disabled:opacity-60 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30"
                                                        >
                                                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                                            Accept
                                                        </button>
                                                    )}
                                                    {isPending && (
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleReject(request._id)}
                                                            disabled={isProcessing}
                                                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                                                        >
                                                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                                            Reject
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-[#112240] sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Showing <span className="font-semibold text-gray-900 dark:text-white">{requestStart}</span> to{' '}
                                <span className="font-semibold text-gray-900 dark:text-white">{requestEnd}</span> of{' '}
                                <span className="font-semibold text-gray-900 dark:text-white">{pagination.totalRequests}</span> requests
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPagination((current) => ({ ...current, currentPage: current.currentPage - 1 }))}
                                    disabled={!pagination.hasPreviousPage}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-[#0a192f] dark:text-gray-300 dark:hover:bg-gray-800"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </button>

                                <span className="px-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Page <span className="text-gray-900 dark:text-white">{pagination.currentPage}</span> of{' '}
                                    <span className="text-gray-900 dark:text-white">{pagination.totalPages}</span>
                                </span>

                                <button
                                    type="button"
                                    onClick={() => setPagination((current) => ({ ...current, currentPage: current.currentPage + 1 }))}
                                    disabled={!pagination.hasNextPage}
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
        </AdminLayout>
    );
};

export default AdminInstitutionRequests;
