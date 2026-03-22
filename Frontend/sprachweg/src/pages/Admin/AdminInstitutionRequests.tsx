import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle2, Mail, Phone, Search, User2, XCircle } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import Button from '../../components/ui/Button';
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

const getStatusClasses = (status: InstitutionRequest['status']) => {
    if (status === 'APPROVED') {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300';
    }

    if (status === 'REJECTED') {
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
    }

    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300';
};

const AdminInstitutionRequests: React.FC = () => {
    const [requests, setRequests] = useState<InstitutionRequest[]>([]);
    const [availableStatuses, setAvailableStatuses] = useState<string[]>(['All']);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await institutionAPI.getAdminRequests({
                status: statusFilter !== 'All' ? statusFilter : undefined,
                search: searchQuery || undefined,
            }) as { requests: InstitutionRequest[]; availableStatuses: string[] };

            setRequests(response.requests || []);
            setAvailableStatuses(response.availableStatuses || ['All']);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load institution requests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchRequests();
    }, [statusFilter, searchQuery]);

    const handleApprove = async (requestId: string) => {
        if (!window.confirm('Approve this entire institution request and create all student accounts now?')) {
            return;
        }

        try {
            setProcessingId(requestId);
            await institutionAPI.approveRequest(requestId);
            await fetchRequests();
        } catch (err: any) {
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
            await fetchRequests();
        } catch (err: any) {
            window.alert(err.response?.data?.message || 'Failed to reject institution request.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleSearchSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setSearchQuery(searchInput.trim());
    };

    return (
        <AdminLayout>
            <div className="mx-auto max-w-7xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0a192f] dark:text-white">Institution Requests</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Review institution submissions and approve or reject complete student batches at once.
                    </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[#112240]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <form onSubmit={handleSearchSubmit} className="relative w-full lg:max-w-md">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                placeholder="Search by institution, contact, email, course, or student..."
                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 pl-10 text-sm text-gray-900 outline-none transition focus:border-[#d6b161] focus:bg-white dark:border-gray-700 dark:bg-[#0a192f] dark:text-white"
                            />
                        </form>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                                className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#d6b161] focus:bg-white dark:border-gray-700 dark:bg-[#0a192f] dark:text-white"
                            >
                                {availableStatuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                            <Button
                                type="button"
                                className="rounded-2xl bg-[#d6b161] px-5 py-3 text-[#0a192f] hover:bg-[#c4a055]"
                                onClick={() => setSearchQuery(searchInput.trim())}
                            >
                                Search
                            </Button>
                        </div>
                    </div>
                </div>

                {error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                        {error}
                    </div>
                ) : null}

                {loading ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-10 shadow-sm dark:border-gray-800 dark:bg-[#112240]">
                        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#d6b161] border-t-transparent" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-[#112240] dark:text-gray-400">
                        No institution requests found for the current filters.
                    </div>
                ) : (
                    <div className="space-y-5">
                        {requests.map((request) => (
                            <section
                                key={request._id}
                                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#112240]"
                            >
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="rounded-2xl bg-[#d6b161]/10 p-3 text-[#d6b161]">
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-[#0a192f] dark:text-white">
                                                    {request.institutionId.institutionName || request.institutionId.name}
                                                </h2>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Submitted on {new Date(request.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(request.status)}`}>
                                                {request.status}
                                            </span>
                                        </div>

                                        <div className="grid gap-3 text-sm text-gray-600 dark:text-gray-300 md:grid-cols-2">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-[#d6b161]" />
                                                <span>{request.institutionId.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-[#d6b161]" />
                                                <span>{request.institutionId.phoneNumber || 'Phone not provided'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <User2 className="h-4 w-4 text-[#d6b161]" />
                                                <span>Contact: {request.institutionId.contactPersonName || 'Not provided'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-[#d6b161]" />
                                                <span>{request.courseTitle} - {request.levelName}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {request.status === 'PENDING' ? (
                                        <div className="flex flex-col gap-3 sm:flex-row">
                                            <Button
                                                type="button"
                                                className="rounded-2xl bg-emerald-600 px-5 py-3 text-white hover:bg-emerald-700"
                                                disabled={processingId === request._id}
                                                onClick={() => handleApprove(request._id)}
                                            >
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                {processingId === request._id ? 'Processing...' : 'Accept Request'}
                                            </Button>
                                            <Button
                                                type="button"
                                                className="rounded-2xl bg-red-600 px-5 py-3 text-white hover:bg-red-700"
                                                disabled={processingId === request._id}
                                                onClick={() => handleReject(request._id)}
                                            >
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Reject Request
                                            </Button>
                                        </div>
                                    ) : null}
                                </div>

                                {request.rejectionReason ? (
                                    <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                                        {request.rejectionReason}
                                    </div>
                                ) : null}

                                <div className="mt-6 rounded-2xl bg-[#fcfbf7] p-5 dark:bg-[#0a192f]">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d6b161]">
                                            Student List
                                        </h3>
                                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 dark:bg-[#112240] dark:text-gray-200 dark:ring-gray-700">
                                            {request.studentCount} student(s)
                                        </span>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {request.students.map((student) => (
                                            <div
                                                key={`${request._id}-${student.email}`}
                                                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-[#112240]"
                                            >
                                                <p className="font-semibold text-[#0a192f] dark:text-white">{student.name}</p>
                                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminInstitutionRequests;
