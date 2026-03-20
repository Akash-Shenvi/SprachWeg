import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    BookOpen,
    Calendar,
    Check,
    ChevronLeft,
    ChevronRight,
    Eye,
    Filter,
    GraduationCap,
    Loader2,
    Mail,
    Phone,
    Search,
    User as UserIcon,
    X,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api, { getAssetUrl } from '../../lib/api';

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
    userId: StudentProfile | null;
    courseTitle: string;
    name: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt?: string;
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

const ENROLLMENTS_PER_PAGE = 9;

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

    useEffect(() => {
        void fetchEnrollments();
    }, [pagination.currentPage, searchQuery, filterLevel]);

    useEffect(() => {
        if (!selectedEnrollment) {
            setIsAvatarFullScreen(false);
        }
    }, [selectedEnrollment]);

    const fetchEnrollments = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/language-training/admin/enrollments', {
                params: {
                    status: 'PENDING',
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

    const refreshAfterDecision = async () => {
        if (enrollments.length === 1 && pagination.currentPage > 1) {
            setPagination((current) => ({ ...current, currentPage: current.currentPage - 1 }));
            return;
        }

        await fetchEnrollments();
    };

    const handleApprove = async (id: string, event?: React.MouseEvent) => {
        event?.stopPropagation();
        if (processingId) return;
        setProcessingId(id);

        try {
            await api.post(`/language-training/admin/enroll/${id}/approve`);
            if (selectedEnrollment?._id === id) {
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

    const handleReject = async (id: string, event?: React.MouseEvent) => {
        event?.stopPropagation();
        if (processingId) return;
        if (!window.confirm('Are you sure you want to reject this enrollment?')) return;
        setProcessingId(id);

        try {
            await api.post(`/language-training/admin/enroll/${id}/reject`);
            if (selectedEnrollment?._id === id) {
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

    const enrollmentStart = enrollments.length === 0 ? 0 : (pagination.currentPage - 1) * pagination.limit + 1;
    const enrollmentEnd = enrollments.length === 0 ? 0 : Math.min(pagination.currentPage * pagination.limit, pagination.totalEnrollments);

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">Verify Enrollments</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Review language class enrollment requests with paginated loading and full student profiles.
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
                        <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Filter by Level:</span>
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
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#1E3A8A] text-blue-300 border border-blue-900 shrink-0">
                                        {enrollment.name}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="p-4 rounded-lg bg-[#111827] border border-gray-700">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Applying For</p>
                                        <p className="text-base font-medium text-white flex items-center gap-2">
                                            <BookOpen className="w-4 h-4 text-[#d6b161]" />
                                            {enrollment.courseTitle}
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
                                        onClick={(event) => handleApprove(enrollment._id, event)}
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
                                        onClick={(event) => handleReject(enrollment._id, event)}
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
                                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Level</span>
                                        </div>
                                        <p className="pl-8 font-bold text-gray-900 dark:text-white">{selectedEnrollment.name}</p>
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
                                                                        enrollment.status === 'APPROVED'
                                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                            : enrollment.status === 'PENDING'
                                                                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                                    }`}>
                                                                        {enrollment.status}
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
                                                                        enrollment.status === 'APPROVED'
                                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                            : enrollment.status === 'PENDING'
                                                                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                                    }`}>
                                                                        {enrollment.status}
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
                                        onClick={() => handleApprove(selectedEnrollment._id)}
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
                                        onClick={() => handleReject(selectedEnrollment._id)}
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
