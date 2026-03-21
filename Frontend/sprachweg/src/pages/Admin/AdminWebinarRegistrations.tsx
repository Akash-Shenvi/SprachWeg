import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, CreditCard, Eye, Hash, Loader2, Mail, Phone, Radio, Search, ShieldCheck, User as UserIcon, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { getAssetUrl, webinarRegistrationAPI } from '../../lib/api';
import { formatPaymentState } from '../../lib/paymentFormatting';
import { formatWebinarDateTime, formatWebinarPrice } from '../../types/webinar';

type WebinarRegistrationStatus = 'submitted' | 'accepted' | 'rejected';
interface RegistrationUser {
    _id: string; name: string; email: string; phoneNumber?: string; avatar?: string; qualification?: string;
    dateOfBirth?: string; guardianName?: string; guardianPhone?: string; germanLevel?: string; role?: string;
    isVerified?: boolean; createdAt?: string;
}
interface RegistrationWebinar { _id: string; title: string; scheduledAt: string; joinLink?: string; isActive: boolean; }
interface WebinarRegistrationItem {
    _id: string; userId?: RegistrationUser | null; webinarId?: RegistrationWebinar | null; webinarTitle: string;
    scheduledAt: string; price: number; currency: string; paymentStatus?: string; paymentAmount?: number;
    paymentCurrency?: string; paymentMethod?: string; razorpayOrderId?: string; razorpayPaymentId?: string;
    paidAt?: string; status: WebinarRegistrationStatus; referenceCode: string; createdAt: string;
}
interface PaginationState {
    currentPage: number; totalPages: number; totalRegistrations: number; limit: number;
    hasPreviousPage: boolean; hasNextPage: boolean;
}

const REGISTRATIONS_PER_PAGE = 10;
const getStatusClasses = (status: WebinarRegistrationStatus) =>
    status === 'accepted'
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
        : status === 'rejected'
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            : 'bg-[#d6b161]/15 text-[#b38f3f] dark:text-[#f0d28a]';
const formatStatus = (status: WebinarRegistrationStatus) => status.charAt(0).toUpperCase() + status.slice(1);

const AdminWebinarRegistrations: React.FC = () => {
    const [registrations, setRegistrations] = useState<WebinarRegistrationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | WebinarRegistrationStatus>('submitted');
    const [pagination, setPagination] = useState<PaginationState>({ currentPage: 1, totalPages: 1, totalRegistrations: 0, limit: REGISTRATIONS_PER_PAGE, hasPreviousPage: false, hasNextPage: false });
    const [selectedRegistration, setSelectedRegistration] = useState<WebinarRegistrationItem | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [isAvatarFullScreen, setIsAvatarFullScreen] = useState(false);

    useEffect(() => { void fetchRegistrations(); }, [pagination.currentPage, searchQuery, statusFilter]);
    useEffect(() => { if (!selectedRegistration) setIsAvatarFullScreen(false); }, [selectedRegistration]);

    const fetchRegistrations = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await webinarRegistrationAPI.getAllAdmin({
                page: pagination.currentPage,
                limit: REGISTRATIONS_PER_PAGE,
                search: searchQuery || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
            });
            const nextPagination = response.pagination || {};
            setRegistrations(response.registrations || []);
            setPagination({
                currentPage: nextPagination.currentPage || 1,
                totalPages: nextPagination.totalPages || 1,
                totalRegistrations: nextPagination.totalRegistrations || 0,
                limit: nextPagination.limit || REGISTRATIONS_PER_PAGE,
                hasPreviousPage: !!nextPagination.hasPreviousPage,
                hasNextPage: !!nextPagination.hasNextPage,
            });
        } catch (err: any) {
            console.error('Failed to fetch webinar registrations:', err);
            setError(err.response?.data?.message || 'Failed to load webinar registrations.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setPagination((current) => ({ ...current, currentPage: 1 }));
        setSearchQuery(searchInput.trim());
    };

    const handleStatusUpdate = async (registration: WebinarRegistrationItem, nextStatus: 'accepted' | 'rejected') => {
        if (registration.status === nextStatus) {
            window.alert(`This registration is already ${nextStatus}.`);
            return;
        }
        if (!window.confirm(nextStatus === 'accepted' ? 'Approve this webinar registration?' : 'Reject this webinar registration?')) {
            return;
        }
        try {
            setProcessingId(registration._id);
            const response = await webinarRegistrationAPI.updateStatus(registration._id, nextStatus);
            const updatedRegistration = response.registration as WebinarRegistrationItem;
            setSelectedRegistration((current) => current?._id === updatedRegistration._id ? updatedRegistration : current);
            await fetchRegistrations();
        } catch (err: any) {
            console.error('Failed to update webinar registration:', err);
            window.alert(err.response?.data?.message || 'Failed to update webinar registration.');
        } finally {
            setProcessingId(null);
        }
    };

    const selectedUser = selectedRegistration?.userId || null;
    const registrationStart = registrations.length === 0 ? 0 : (pagination.currentPage - 1) * pagination.limit + 1;
    const registrationEnd = registrations.length === 0 ? 0 : Math.min(pagination.currentPage * pagination.limit, pagination.totalRegistrations);

    return (
        <AdminLayout>
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <Link to="/admin-dashboard" className="mb-2 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-[#d6b161]"><ArrowLeft className="mr-1 h-4 w-4" />Back to Dashboard</Link>
                        <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">Webinar Registrations</h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">Review paid webinar registrations and decide when students can access the join link on their dashboard.</p>
                    </div>
                    <div className="rounded-2xl border border-[#d6b161]/30 bg-[#d6b161]/10 px-5 py-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Current Queue</p>
                        <p className="mt-1 text-2xl font-bold text-[#0a192f] dark:text-white">{pagination.totalRegistrations}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[#112240] lg:flex-row lg:items-center lg:justify-between">
                    <form onSubmit={handleSearchSubmit} className="relative w-full lg:max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input type="text" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search by student, webinar, or reference..." className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 dark:border-gray-700 dark:bg-[#0a192f] dark:text-white" />
                    </form>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filter status</span>
                        <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as 'all' | WebinarRegistrationStatus); setPagination((current) => ({ ...current, currentPage: 1 })); }} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 dark:border-gray-700 dark:bg-[#0a192f] dark:text-white">
                            <option value="all">All</option><option value="submitted">Submitted</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#112240]">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Student</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Webinar</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Payment</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                {loading ? <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Loading webinar registrations...</td></tr>
                                    : error ? <tr><td colSpan={5} className="px-6 py-10 text-center text-red-500">{error}</td></tr>
                                        : registrations.length === 0 ? <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">No webinar registrations found for this filter.</td></tr>
                                            : registrations.map((registration) => (
                                                <tr key={registration._id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[#d6b161]/30 bg-[#d6b161]/15 font-bold text-[#b38f3f]">
                                                                {registration.userId?.avatar ? <img src={getAssetUrl(registration.userId.avatar)} alt={registration.userId.name} className="h-full w-full object-cover" /> : registration.userId?.name?.charAt(0).toUpperCase() || 'U'}
                                                            </div>
                                                            <div><p className="font-semibold text-gray-900 dark:text-white">{registration.userId?.name || 'Unknown user'}</p><p className="text-sm text-gray-500 dark:text-gray-400">{registration.userId?.email || 'No email available'}</p></div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4"><p className="font-semibold text-gray-900 dark:text-white">{registration.webinarTitle}</p><p className="text-sm text-gray-500 dark:text-gray-400">{formatWebinarDateTime(registration.webinarId?.scheduledAt || registration.scheduledAt)}</p></td>
                                                    <td className="px-6 py-4"><p className="font-semibold text-gray-900 dark:text-white">{formatWebinarPrice(registration.paymentAmount ?? registration.price, registration.paymentCurrency || registration.currency)}</p><p className="text-sm text-gray-500 dark:text-gray-400">{formatPaymentState(registration.paymentStatus)}</p></td>
                                                    <td className="px-6 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(registration.status)}`}>{formatStatus(registration.status)}</span></td>
                                                    <td className="px-6 py-4 text-right"><button type="button" onClick={() => setSelectedRegistration(registration)} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#d6b161] hover:text-[#b38f3f] dark:border-gray-700 dark:bg-[#0a192f] dark:text-gray-200"><Eye className="h-4 w-4" />View</button></td>
                                                </tr>
                                            ))}
                            </tbody>
                        </table>
                    </div>

                    {!loading && registrations.length > 0 && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-800">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Showing <span className="font-semibold text-gray-900 dark:text-white">{registrationStart}</span> to <span className="font-semibold text-gray-900 dark:text-white">{registrationEnd}</span> of <span className="font-semibold text-gray-900 dark:text-white">{pagination.totalRegistrations}</span> registrations</div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setPagination((current) => ({ ...current, currentPage: current.currentPage - 1 }))} disabled={!pagination.hasPreviousPage} className="rounded-xl border border-gray-200 bg-white p-2 text-gray-700 transition-colors hover:border-[#d6b161] hover:text-[#b38f3f] disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-[#0a192f] dark:text-gray-200"><ChevronLeft className="h-4 w-4" /></button>
                                <button type="button" onClick={() => setPagination((current) => ({ ...current, currentPage: current.currentPage + 1 }))} disabled={!pagination.hasNextPage} className="rounded-xl border border-gray-200 bg-white p-2 text-gray-700 transition-colors hover:border-[#d6b161] hover:text-[#b38f3f] disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-[#0a192f] dark:text-gray-200"><ChevronRight className="h-4 w-4" /></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {selectedRegistration && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRegistration(null)} />
                        <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }} className="relative z-10 max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-[#112240]">
                            <button type="button" onClick={() => setSelectedRegistration(null)} className="absolute right-4 top-4 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-[#0a192f]"><X className="h-6 w-6" /></button>
                            <div className="p-8">
                                <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center">
                                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#d6b161] text-4xl font-bold text-[#0a192f] shadow-lg dark:border-[#0a192f]">
                                        {selectedUser?.avatar ? <img src={getAssetUrl(selectedUser.avatar)} alt={selectedUser.name} className="h-full w-full cursor-pointer object-cover transition-opacity hover:opacity-80" onClick={() => setIsAvatarFullScreen(true)} /> : selectedUser?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedUser?.name || 'Unknown user'}</h2>
                                            <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(selectedRegistration.status)}`}>{formatStatus(selectedRegistration.status)}</span>
                                            <span className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${selectedUser?.isVerified ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}><ShieldCheck className="h-3.5 w-3.5" />{selectedUser?.isVerified ? 'Verified account' : 'Unverified account'}</span>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-3">
                                            <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"><Mail className="h-4 w-4" /><span className="text-sm font-medium">{selectedUser?.email || 'Not provided'}</span></div>
                                            <div className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5 text-green-600 dark:bg-green-900/20 dark:text-green-400"><Phone className="h-4 w-4" /><span className="text-sm font-medium">{selectedUser?.phoneNumber || 'Not provided'}</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-[#0a192f]"><div className="mb-2 flex items-center gap-3"><Radio className="h-5 w-5 text-[#d6b161]" /><span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Webinar</span></div><p className="pl-8 text-lg font-bold text-gray-900 dark:text-white">{selectedRegistration.webinarTitle}</p><p className="pl-8 text-sm text-gray-500 dark:text-gray-400">{formatWebinarDateTime(selectedRegistration.webinarId?.scheduledAt || selectedRegistration.scheduledAt)}</p></div>
                                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-[#0a192f]"><div className="mb-2 flex items-center gap-3"><Calendar className="h-5 w-5 text-purple-500" /><span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Reference</span></div><p className="pl-8 font-mono text-sm font-bold text-gray-900 dark:text-white">{selectedRegistration.referenceCode}</p><p className="pl-8 text-sm text-gray-500 dark:text-gray-400">Requested on {formatWebinarDateTime(selectedRegistration.createdAt)}</p></div>
                                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-[#0a192f]"><div className="mb-2 flex items-center gap-3"><UserIcon className="h-5 w-5 text-orange-500" /><span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Student Details</span></div><div className="space-y-2 pl-8 text-sm"><p className="font-semibold text-gray-900 dark:text-white">Qualification: <span className="font-normal">{selectedUser?.qualification || 'Not provided'}</span></p><p className="font-semibold text-gray-900 dark:text-white">German Level: <span className="font-normal">{selectedUser?.germanLevel || 'Not provided'}</span></p><p className="font-semibold text-gray-900 dark:text-white">Date of Birth: <span className="font-normal">{selectedUser?.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString() : 'Not provided'}</span></p></div></div>
                                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-[#0a192f]"><div className="mb-2 flex items-center gap-3"><UserIcon className="h-5 w-5 text-pink-500" /><span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Guardian Details</span></div><div className="space-y-2 pl-8 text-sm"><p className="font-semibold text-gray-900 dark:text-white">Name: <span className="font-normal">{selectedUser?.guardianName || 'Not provided'}</span></p><p className="font-semibold text-gray-900 dark:text-white">Phone: <span className="font-normal">{selectedUser?.guardianPhone || 'Not provided'}</span></p><p className="font-semibold text-gray-900 dark:text-white">Account Created: <span className="font-normal">{selectedUser?.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Not provided'}</span></p></div></div>
                                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-[#0a192f] sm:col-span-2">
                                        <div className="mb-3 flex items-center gap-3"><CreditCard className="h-5 w-5 text-emerald-500" /><span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Payment Details</span></div>
                                        <div className="grid gap-4 pl-8 sm:grid-cols-2">
                                            <div><p className="mb-1 text-xs text-gray-500">Amount</p><p className="font-bold text-gray-900 dark:text-white">{formatWebinarPrice(selectedRegistration.paymentAmount ?? selectedRegistration.price, selectedRegistration.paymentCurrency || selectedRegistration.currency)}</p></div>
                                            <div><p className="mb-1 text-xs text-gray-500">Gateway Status</p><p className="font-bold text-gray-900 dark:text-white">{formatPaymentState(selectedRegistration.paymentStatus)}</p></div>
                                            <div><p className="mb-1 text-xs text-gray-500">Method</p><p className="font-bold text-gray-900 dark:text-white">{selectedRegistration.paymentMethod || 'Not available'}</p></div>
                                            <div><p className="mb-1 text-xs text-gray-500">Paid At</p><p className="font-bold text-gray-900 dark:text-white">{selectedRegistration.paidAt ? formatWebinarDateTime(selectedRegistration.paidAt) : 'Not available'}</p></div>
                                            <div><p className="mb-1 flex items-center gap-1 text-xs text-gray-500"><Hash className="h-3.5 w-3.5" />Order ID</p><p className="font-mono text-xs font-bold text-gray-900 dark:text-white">{selectedRegistration.razorpayOrderId || 'Not available'}</p></div>
                                            <div><p className="mb-1 flex items-center gap-1 text-xs text-gray-500"><Hash className="h-3.5 w-3.5" />Payment ID</p><p className="font-mono text-xs font-bold text-gray-900 dark:text-white">{selectedRegistration.razorpayPaymentId || 'Not available'}</p></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <button type="button" onClick={() => void handleStatusUpdate(selectedRegistration, 'accepted')} disabled={processingId === selectedRegistration._id} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-6 py-3 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100 disabled:opacity-60 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30">{processingId === selectedRegistration._id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Accept Registration</button>
                                    <button type="button" onClick={() => void handleStatusUpdate(selectedRegistration, 'rejected')} disabled={processingId === selectedRegistration._id} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-6 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30">{processingId === selectedRegistration._id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Reject Registration</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {isAvatarFullScreen && selectedUser?.avatar && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm" onClick={() => setIsAvatarFullScreen(false)}>
                    <button type="button" className="absolute right-4 top-4 p-2 text-white transition-colors hover:text-gray-300" onClick={() => setIsAvatarFullScreen(false)}><X className="h-8 w-8" /></button>
                    <img src={getAssetUrl(selectedUser.avatar)} alt="Full Screen Avatar" className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl" onClick={(event) => event.stopPropagation()} />
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminWebinarRegistrations;
