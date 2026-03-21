import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Calendar, ChevronLeft, ChevronRight, Eye, GraduationCap, Mail, Phone, Search, ShieldCheck, User as UserIcon, X } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import Button from '../../components/ui/Button';
import api, { getAssetUrl } from '../../lib/api';

interface UserRecord {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    avatar?: string;
    guardianName?: string;
    guardianPhone?: string;
    qualification?: string;
    dateOfBirth?: string;
    germanLevel?: string;
    role?: string;
    isVerified?: boolean;
    createdAt: string;
}
interface LanguageEnrollment {
    _id: string;
    courseTitle: string;
    name: string;
    status: string;
    batchId?: { _id: string; name: string };
}
interface SkillEnrollment {
    _id: string;
    status: string;
    skillCourseId?: { _id: string; title: string };
}

const LIMIT = 10;
const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : 'Not Provided');
const formatRole = (role?: string) => (role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User');
const roleClass = (role?: string) => {
    switch (String(role ?? '').toLowerCase()) {
        case 'admin':
            return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
        case 'trainer':
            return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
        default:
            return 'bg-[#d6b161]/15 text-[#d6b161] dark:bg-[#d6b161]/20 dark:text-[#f0d79a]';
    }
};
const verifyClass = (isVerified?: boolean) =>
    isVerified ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
const statusClass = (status?: string) => {
    switch (status) {
        case 'APPROVED':
            return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        case 'PENDING':
            return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
        default:
            return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    }
};

const ManageUsers: React.FC = () => {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
    const [userDetailsLoading, setUserDetailsLoading] = useState(false);
    const [languageEnrollments, setLanguageEnrollments] = useState<LanguageEnrollment[]>([]);
    const [skillEnrollments, setSkillEnrollments] = useState<SkillEnrollment[]>([]);
    const [isAvatarFullScreen, setIsAvatarFullScreen] = useState(false);

    useEffect(() => {
        void fetchUsers();
    }, [page, searchQuery]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await api.get(`/admin/users?page=${page}&limit=${LIMIT}&search=${encodeURIComponent(searchQuery)}`);
            const nextUsers = data.users || data.students || [];
            setUsers(nextUsers);
            setTotalPages(data.totalPages || 1);
            setTotalUsers(data.totalUsers ?? data.totalStudents ?? nextUsers.length);
        } catch (err: any) {
            console.error('Failed to fetch users:', err);
            setError(err.response?.data?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(searchInput.trim());
        setPage(1);
    };

    const handleViewUser = async (user: UserRecord) => {
        setSelectedUser(user);
        setIsViewModalOpen(true);
        setUserDetailsLoading(true);
        setLanguageEnrollments([]);
        setSkillEnrollments([]);
        try {
            const { data } = await api.get(`/admin/users/${user._id}/details`);
            setSelectedUser(data.user || data.student || user);
            setLanguageEnrollments(data.languageEnrollments || []);
            setSkillEnrollments(data.skillEnrollments || []);
        } catch (err) {
            console.error('Failed to load user details', err);
        } finally {
            setUserDetailsLoading(false);
        }
    };

    const closeViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedUser(null);
        setIsAvatarFullScreen(false);
    };

    return (
        <AdminLayout>
            <div className="mx-auto max-w-7xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0a192f] dark:text-white">Manage Users</h1>
                    <p className="text-gray-600 dark:text-gray-400">View all registered users and their account details.</p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#112240]">
                    <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Total Users: <span className="font-bold text-[#0a192f] dark:text-white">{totalUsers}</span>
                        </div>
                        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search by name, email, phone, or role..."
                                className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-900 placeholder-gray-500 focus:border-[#d6b161] focus:outline-none focus:ring-1 focus:ring-[#d6b161] dark:border-gray-700 dark:bg-[#0a192f] dark:text-white sm:text-sm"
                            />
                        </form>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Profile</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">User</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Contact Info</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Account</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Joined Date</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                {loading && users.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading users...</td></tr>
                                ) : error ? (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center text-red-500">{error}</td></tr>
                                ) : users.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No users found.</td></tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user._id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-6 py-4">
                                                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#d6b161]/30 bg-[#d6b161]/20 font-bold text-[#d6b161]">
                                                    {user.avatar ? <img src={getAssetUrl(user.avatar)} alt={user.name} className="h-full w-full object-cover" /> : user.name.charAt(0).toUpperCase()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900 dark:text-white">{user.name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{user.qualification || user.germanLevel || 'Additional details not provided'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="mb-1 flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400"><Mail className="h-3.5 w-3.5" />{user.email}</div>
                                                <div className="flex items-center gap-1.5 text-sm text-gray-500"><Phone className="h-3.5 w-3.5" />{user.phoneNumber || 'Not provided'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-2">
                                                    <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${roleClass(user.role)}`}>{formatRole(user.role)}</span>
                                                    <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${verifyClass(user.isVerified)}`}>{user.isVerified ? 'Verified' : 'Unverified'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{formatDate(user.createdAt)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="outline" size="sm" onClick={() => handleViewUser(user)} className="flex items-center gap-2">
                                                    <Eye className="h-4 w-4" />View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!loading && users.length > 0 && totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-800">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Page <span className="font-medium text-gray-900 dark:text-white">{page}</span> of <span className="font-medium text-gray-900 dark:text-white">{totalPages}</span></div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isViewModalOpen && selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeViewModal} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-[#112240]">
                            <button onClick={closeViewModal} className="absolute right-4 top-4 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-6 w-6" /></button>
                            <div className="p-8">
                                <div className="mb-8 flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
                                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#d6b161] text-4xl font-bold text-[#0a192f] shadow-lg dark:border-[#0a192f] sm:h-32 sm:w-32 sm:text-5xl">
                                        {selectedUser.avatar ? (
                                            <img
                                                src={getAssetUrl(selectedUser.avatar)}
                                                alt={selectedUser.name}
                                                className="h-full w-full cursor-pointer object-cover transition-opacity hover:opacity-80"
                                                onClick={() => setIsAvatarFullScreen(true)}
                                                title="Click to view full screen"
                                            />
                                        ) : selectedUser.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedUser.name}</h2>
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${roleClass(selectedUser.role)}`}>{formatRole(selectedUser.role)}</span>
                                            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${verifyClass(selectedUser.isVerified)}`}><ShieldCheck className="h-3.5 w-3.5" />{selectedUser.isVerified ? 'Verified account' : 'Unverified account'}</span>
                                        </div>
                                        <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
                                            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"><Mail className="h-4 w-4" /><span className="text-sm font-medium">{selectedUser.email}</span></div>
                                            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5 text-green-600 dark:bg-green-900/20 dark:text-green-400"><Phone className="h-4 w-4" /><span className="text-sm font-medium">{selectedUser.phoneNumber || 'Not Provided'}</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0a192f]"><div className="mb-2 flex items-center gap-3"><Calendar className="h-5 w-5 text-purple-500" /><span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Date of Birth</span></div><p className="pl-8 font-bold text-gray-900 dark:text-white">{formatDate(selectedUser.dateOfBirth)}</p></div>
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0a192f]"><div className="mb-2 flex items-center gap-3"><Calendar className="h-5 w-5 text-cyan-500" /><span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Joined Date</span></div><p className="pl-8 font-bold text-gray-900 dark:text-white">{formatDate(selectedUser.createdAt)}</p></div>
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0a192f]"><div className="mb-2 flex items-center gap-3"><GraduationCap className="h-5 w-5 text-orange-500" /><span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Qualification</span></div><p className="pl-8 font-bold text-gray-900 dark:text-white">{selectedUser.qualification || 'Not Provided'}</p></div>
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0a192f]"><div className="mb-2 flex items-center gap-3"><UserIcon className="h-5 w-5 text-indigo-500" /><span className="text-sm font-semibold text-gray-500 dark:text-gray-400">German Level</span></div><p className="pl-8 font-bold text-gray-900 dark:text-white">{selectedUser.germanLevel || 'Not Provided'}</p></div>
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0a192f] sm:col-span-2">
                                        <div className="mb-3 flex items-center gap-3"><UserIcon className="h-5 w-5 text-pink-500" /><span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Guardian Details</span></div>
                                        <div className="grid grid-cols-1 gap-4 pl-8 sm:grid-cols-2">
                                            <div><p className="mb-1 text-xs text-gray-500">Name</p><p className="font-bold text-gray-900 dark:text-white">{selectedUser.guardianName || 'Not Provided'}</p></div>
                                            <div><p className="mb-1 text-xs text-gray-500">Phone</p><p className="font-bold text-gray-900 dark:text-white">{selectedUser.guardianPhone || 'Not Provided'}</p></div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white"><BookOpen className="h-5 w-5 text-[#d6b161]" />Training Activity</h3>
                                    <div className="space-y-4">
                                        {userDetailsLoading ? (
                                            <div className="py-8 text-center"><div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-[#d6b161] border-t-transparent" /><p className="text-sm text-gray-500">Loading training details...</p></div>
                                        ) : (
                                            <>
                                                {languageEnrollments.length > 0 && (
                                                    <div>
                                                        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Language Trainings</h4>
                                                        <div className="grid gap-3 sm:grid-cols-2">
                                                            {languageEnrollments.map((enrollment) => (
                                                                <div key={enrollment._id} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-[#112240]">
                                                                    <div className="mb-1 font-bold text-gray-900 dark:text-white">{enrollment.courseTitle}</div>
                                                                    <div className="flex items-center justify-between text-sm">
                                                                        <span className="text-gray-600 dark:text-gray-400">{enrollment.name}</span>
                                                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(enrollment.status)}`}>{enrollment.status}</span>
                                                                    </div>
                                                                    {enrollment.batchId && <div className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">Assigned Batch: Class - {enrollment.batchId.name}</div>}
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
                                                                    <div className="mb-1 font-bold text-gray-900 dark:text-white">{enrollment.skillCourseId?.title || 'Unknown Course'}</div>
                                                                    <div className="flex items-center justify-between text-sm">
                                                                        <span className="text-gray-600 dark:text-gray-400">Skill Development</span>
                                                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(enrollment.status)}`}>{enrollment.status}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {languageEnrollments.length === 0 && skillEnrollments.length === 0 && <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-6 text-center dark:border-gray-800 dark:bg-[#0a192f]"><p className="text-gray-500 dark:text-gray-400">No training activity found for this user.</p></div>}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {isAvatarFullScreen && selectedUser?.avatar && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
                    onClick={() => setIsAvatarFullScreen(false)}
                >
                    <button
                        type="button"
                        className="absolute right-4 top-4 p-2 text-white transition-colors hover:text-gray-300"
                        onClick={() => setIsAvatarFullScreen(false)}
                    >
                        <X className="h-8 w-8" />
                    </button>
                    <img
                        src={getAssetUrl(selectedUser.avatar)}
                        alt="Full Screen Avatar"
                        className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </AdminLayout>
    );
};

export default ManageUsers;
