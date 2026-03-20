import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    BookOpen,
    Calendar,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Eye,
    Filter,
    GraduationCap,
    Loader2,
    Mail,
    Phone,
    Search,
    Trash2,
    User as UserIcon,
    Users,
    X,
} from 'lucide-react';
import api, { getAssetUrl } from '../../lib/api';
import AdminLayout from '../../components/admin/AdminLayout';

interface Student {
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
    createdAt: string;
}

interface Trainer {
    _id: string;
    name: string;
    email: string;
}

interface BatchListItem {
    _id: string;
    courseTitle: string;
    name: string;
    studentCount: number;
    trainer: Trainer | null;
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

interface BatchPagination {
    currentPage: number;
    totalPages: number;
    totalBatches: number;
    limit: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

interface StudentPagination {
    currentPage: number;
    totalPages: number;
    totalStudents: number;
    limit: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

const BATCHES_PER_PAGE = 6;
const STUDENTS_PER_PAGE = 8;

const LanguageBatches: React.FC = () => {
    const [batches, setBatches] = useState<BatchListItem[]>([]);
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [availableCourses, setAvailableCourses] = useState<string[]>(['All']);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCourse, setFilterCourse] = useState('All');
    const [batchPagination, setBatchPagination] = useState<BatchPagination>({
        currentPage: 1,
        totalPages: 1,
        totalBatches: 0,
        limit: BATCHES_PER_PAGE,
        hasPreviousPage: false,
        hasNextPage: false,
    });
    const [expandedBatch, setExpandedBatch] = useState<BatchListItem | null>(null);
    const [batchStudents, setBatchStudents] = useState<Student[]>([]);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [studentsError, setStudentsError] = useState('');
    const [studentPagination, setStudentPagination] = useState<StudentPagination>({
        currentPage: 1,
        totalPages: 1,
        totalStudents: 0,
        limit: STUDENTS_PER_PAGE,
        hasPreviousPage: false,
        hasNextPage: false,
    });
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState<BatchListItem | null>(null);
    const [selectedTrainer, setSelectedTrainer] = useState('');
    const [showPromoteModal, setShowPromoteModal] = useState(false);
    const [promoteEmail, setPromoteEmail] = useState('');
    const [promoting, setPromoting] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [studentDetailsLoading, setStudentDetailsLoading] = useState(false);
    const [languageEnrollments, setLanguageEnrollments] = useState<LanguageEnrollment[]>([]);
    const [skillEnrollments, setSkillEnrollments] = useState<SkillEnrollment[]>([]);
    const [isAvatarFullScreen, setIsAvatarFullScreen] = useState(false);

    useEffect(() => {
        void fetchTrainers();
    }, []);

    useEffect(() => {
        void fetchBatches();
    }, [batchPagination.currentPage, searchQuery, filterCourse]);

    useEffect(() => {
        if (!isViewModalOpen) {
            setIsAvatarFullScreen(false);
        }
    }, [isViewModalOpen]);

    const fetchTrainers = async () => {
        try {
            const response = await api.get('/language-training/admin/trainers');
            setTrainers(response.data || []);
        } catch (err) {
            console.error('Failed to fetch trainers', err);
        }
    };

    const fetchBatches = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/language-training/admin/batches', {
                params: {
                    page: batchPagination.currentPage,
                    limit: BATCHES_PER_PAGE,
                    search: searchQuery || undefined,
                    course: filterCourse !== 'All' ? filterCourse : undefined,
                },
            });

            const nextBatches = response.data.batches || [];
            const nextPagination = response.data.pagination || {};

            setBatches(nextBatches);
            setAvailableCourses(response.data.availableCourses || ['All']);
            setBatchPagination({
                currentPage: nextPagination.currentPage || 1,
                totalPages: nextPagination.totalPages || 1,
                totalBatches: nextPagination.totalBatches || 0,
                limit: nextPagination.limit || BATCHES_PER_PAGE,
                hasPreviousPage: !!nextPagination.hasPreviousPage,
                hasNextPage: !!nextPagination.hasNextPage,
            });

            if (expandedBatch) {
                const refreshedExpandedBatch = nextBatches.find((batch: BatchListItem) => batch._id === expandedBatch._id) || null;

                if (!refreshedExpandedBatch) {
                    setExpandedBatch(null);
                    setBatchStudents([]);
                    setStudentsError('');
                    setStudentPagination({
                        currentPage: 1,
                        totalPages: 1,
                        totalStudents: 0,
                        limit: STUDENTS_PER_PAGE,
                        hasPreviousPage: false,
                        hasNextPage: false,
                    });
                } else {
                    setExpandedBatch(refreshedExpandedBatch);
                }
            }
        } catch (err: any) {
            console.error('Failed to fetch batches', err);
            setError(err.response?.data?.message || 'Failed to fetch active classes.');
        } finally {
            setLoading(false);
        }
    };

    const fetchBatchStudents = async (batch: BatchListItem, page = 1) => {
        try {
            setStudentsLoading(true);
            setStudentsError('');

            const response = await api.get(`/language-training/admin/batches/${batch._id}/students`, {
                params: {
                    page,
                    limit: STUDENTS_PER_PAGE,
                },
            });

            const nextPagination = response.data.pagination || {};

            setExpandedBatch((currentBatch) => {
                if (!currentBatch || currentBatch._id !== batch._id) {
                    return batch;
                }

                return {
                    ...currentBatch,
                    studentCount: response.data.batch?.studentCount ?? currentBatch.studentCount,
                    trainer: response.data.batch?.trainer ?? currentBatch.trainer,
                };
            });
            setBatchStudents(response.data.students || []);
            setStudentPagination({
                currentPage: nextPagination.currentPage || 1,
                totalPages: nextPagination.totalPages || 1,
                totalStudents: nextPagination.totalStudents || 0,
                limit: nextPagination.limit || STUDENTS_PER_PAGE,
                hasPreviousPage: !!nextPagination.hasPreviousPage,
                hasNextPage: !!nextPagination.hasNextPage,
            });
        } catch (err: any) {
            console.error('Failed to fetch batch students', err);
            setStudentsError(err.response?.data?.message || 'Failed to load batch students.');
            setBatchStudents([]);
            setStudentPagination({
                currentPage: 1,
                totalPages: 1,
                totalStudents: 0,
                limit: STUDENTS_PER_PAGE,
                hasPreviousPage: false,
                hasNextPage: false,
            });
        } finally {
            setStudentsLoading(false);
        }
    };

    const handleSearchSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setBatchPagination((current) => ({ ...current, currentPage: 1 }));
        setSearchQuery(searchInput.trim());
    };

    const toggleBatch = async (batch: BatchListItem) => {
        if (expandedBatch?._id === batch._id) {
            setExpandedBatch(null);
            setBatchStudents([]);
            setStudentsError('');
            return;
        }

        setExpandedBatch(batch);
        setBatchStudents([]);
        setStudentPagination({
            currentPage: 1,
            totalPages: 1,
            totalStudents: 0,
            limit: STUDENTS_PER_PAGE,
            hasPreviousPage: false,
            hasNextPage: false,
        });
        await fetchBatchStudents(batch, 1);
    };

    const openAssignModal = (batch: BatchListItem, event: React.MouseEvent) => {
        event.stopPropagation();
        setSelectedBatch(batch);
        setSelectedTrainer(batch.trainer?._id || '');
        setShowAssignModal(true);
    };

    const handleAssignTrainer = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!selectedBatch || !selectedTrainer) {
            return;
        }

        try {
            await api.put(`/language-training/admin/batches/${selectedBatch._id}/assign-trainer`, {
                trainerId: selectedTrainer,
            });
            setShowAssignModal(false);
            await fetchBatches();

            if (expandedBatch?._id === selectedBatch._id) {
                await fetchBatchStudents(selectedBatch, studentPagination.currentPage);
            }

            window.alert('Trainer assigned successfully.');
        } catch (err) {
            console.error('Failed to assign trainer', err);
            window.alert('Failed to assign trainer.');
        }
    };

    const handlePromoteTrainer = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!promoteEmail.trim()) {
            return;
        }

        try {
            setPromoting(true);
            const { data } = await api.post('/language-training/admin/promote-trainer', { email: promoteEmail.trim() });
            window.alert(data.message);
            setPromoteEmail('');
            setShowPromoteModal(false);
            await fetchTrainers();
        } catch (err: any) {
            console.error('Failed to promote user', err);
            window.alert(err.response?.data?.message || 'Failed to promote user.');
        } finally {
            setPromoting(false);
        }
    };

    const handleRemoveStudent = async (batchId: string, studentId: string) => {
        if (!window.confirm('Are you sure you want to remove this student from the active class? This will cancel their enrollment.')) {
            return;
        }

        try {
            await api.delete(`/language-training/admin/batches/${batchId}/students/${studentId}`);

            if (expandedBatch && expandedBatch._id === batchId) {
                const nextPage =
                    batchStudents.length === 1 && studentPagination.currentPage > 1
                        ? studentPagination.currentPage - 1
                        : studentPagination.currentPage;

                await fetchBatchStudents(expandedBatch, nextPage);
            }

            await fetchBatches();
        } catch (err) {
            console.error('Failed to remove student', err);
            window.alert('Failed to remove student.');
        }
    };

    const handleDeleteBatch = async (batchId: string) => {
        if (!window.confirm('WARNING: Are you sure you want to delete this entire batch? All students will be removed from the class and their enrollments will be rejected.')) {
            return;
        }

        try {
            await api.delete(`/language-training/admin/batches/${batchId}`);

            if (expandedBatch?._id === batchId) {
                setExpandedBatch(null);
                setBatchStudents([]);
                setStudentsError('');
            }

            if (batches.length === 1 && batchPagination.currentPage > 1) {
                setBatchPagination((current) => ({ ...current, currentPage: current.currentPage - 1 }));
                return;
            }

            await fetchBatches();
        } catch (err) {
            console.error('Failed to delete batch', err);
            window.alert('Failed to delete batch.');
        }
    };

    const handleViewStudent = async (student: Student) => {
        setSelectedStudent(student);
        setIsViewModalOpen(true);
        setStudentDetailsLoading(true);
        setLanguageEnrollments([]);
        setSkillEnrollments([]);

        try {
            const response = await api.get(`/admin/students/${student._id}/details`);
            setSelectedStudent(response.data.student || student);
            setLanguageEnrollments(response.data.languageEnrollments || []);
            setSkillEnrollments(response.data.skillEnrollments || []);
        } catch (err) {
            console.error('Failed to load student details', err);
        } finally {
            setStudentDetailsLoading(false);
        }
    };

    const closeViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedStudent(null);
    };

    const batchStart = batches.length === 0 ? 0 : (batchPagination.currentPage - 1) * batchPagination.limit + 1;
    const batchEnd = batches.length === 0 ? 0 : Math.min(batchPagination.currentPage * batchPagination.limit, batchPagination.totalBatches);
    const studentStart = batchStudents.length === 0 ? 0 : (studentPagination.currentPage - 1) * studentPagination.limit + 1;
    const studentEnd = batchStudents.length === 0 ? 0 : Math.min(studentPagination.currentPage * studentPagination.limit, studentPagination.totalStudents);

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">Active Classes</h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                            Load classes page by page, then open one class to fetch only that class&apos;s students.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowPromoteModal(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#d6b161] px-4 py-2 font-bold text-[#0a192f] transition-colors hover:bg-[#c4a055]"
                    >
                        <Users className="h-5 w-5" />
                        Promote New Trainer
                    </button>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <form
                        onSubmit={handleSearchSubmit}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[#112240]"
                    >
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by class name or course..."
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-gray-900 outline-none transition-all focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161] dark:border-gray-700 dark:bg-[#0a192f] dark:text-white"
                            />
                        </div>
                    </form>

                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[#112240]">
                        <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        <select
                            value={filterCourse}
                            onChange={(event) => {
                                setFilterCourse(event.target.value);
                                setBatchPagination((current) => ({ ...current, currentPage: 1 }));
                            }}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none transition-all focus:ring-2 focus:ring-[#d6b161] dark:border-gray-700 dark:bg-[#0a192f] dark:text-white"
                        >
                            {availableCourses.map((course) => (
                                <option key={course} value={course}>
                                    {course}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[#112240]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Showing <span className="font-semibold text-gray-900 dark:text-white">{batchStart}</span> to{' '}
                            <span className="font-semibold text-gray-900 dark:text-white">{batchEnd}</span> of{' '}
                            <span className="font-semibold text-gray-900 dark:text-white">{batchPagination.totalBatches}</span> classes
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setBatchPagination((current) => ({ ...current, currentPage: Math.max(1, current.currentPage - 1) }))}
                                disabled={!batchPagination.hasPreviousPage}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-[#0a192f] dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </button>
                            <span className="px-2 text-sm text-gray-600 dark:text-gray-400">
                                Page <span className="font-semibold text-gray-900 dark:text-white">{batchPagination.currentPage}</span> of{' '}
                                <span className="font-semibold text-gray-900 dark:text-white">{batchPagination.totalPages}</span>
                            </span>
                            <button
                                type="button"
                                onClick={() => setBatchPagination((current) => ({ ...current, currentPage: Math.min(current.totalPages, current.currentPage + 1) }))}
                                disabled={!batchPagination.hasNextPage}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-[#0a192f] dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-[#d6b161]" />
                    </div>
                ) : error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center font-medium text-red-600 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-400">
                        {error}
                    </div>
                ) : batches.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-[#112240]">
                        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">No active classes found</h3>
                        <p className="text-gray-500 dark:text-gray-400">Try changing the course filter or search term.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {batches.map((batch) => {
                            const isExpanded = expandedBatch?._id === batch._id;

                            return (
                                <div
                                    key={batch._id}
                                    className={`overflow-hidden rounded-xl border bg-white transition-all dark:bg-[#112240] ${
                                        isExpanded
                                            ? 'border-[#d6b161] ring-1 ring-[#d6b161]/20 shadow-md'
                                            : 'border-gray-200 shadow-sm hover:shadow-md dark:border-gray-800'
                                    }`}
                                >
                                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                                        <button
                                            type="button"
                                            onClick={() => void toggleBatch(batch)}
                                            className="flex flex-1 items-center gap-4 text-left"
                                        >
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#d6b161]/10 text-[#d6b161]">
                                                <BookOpen className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
                                                    {batch.courseTitle}
                                                    <span className="rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/30 dark:text-blue-300">
                                                        {batch.name}
                                                    </span>
                                                </h2>
                                                <div className="mt-1 flex flex-wrap items-center gap-4 text-sm">
                                                    <p className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                                        <Users className="h-4 w-4" />
                                                        <span className="font-medium text-gray-900 dark:text-white">{batch.studentCount}</span> Students
                                                    </p>
                                                    <p className="text-gray-500 dark:text-gray-400">
                                                        <span className="font-medium">Trainer:</span>{' '}
                                                        {batch.trainer ? (
                                                            <span className="text-gray-900 dark:text-white">{batch.trainer.name}</span>
                                                        ) : (
                                                            <span className="font-medium text-red-500">Unassigned</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>

                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={(event) => openAssignModal(batch, event)}
                                                className="rounded-lg border border-[#d6b161] px-3 py-1.5 text-sm font-medium text-[#d6b161] transition-colors hover:bg-[#d6b161]/10"
                                            >
                                                {batch.trainer ? 'Reassign' : 'Assign Trainer'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteBatch(batch._id)}
                                                className="rounded-lg border border-transparent p-2 text-red-500 transition-colors hover:border-red-200 hover:bg-red-50 dark:hover:border-red-800 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void toggleBatch(batch)}
                                                className="text-gray-400"
                                            >
                                                {isExpanded ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                                            </button>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="border-t border-gray-100 dark:border-gray-800">
                                            <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-gray-800">
                                                <div>
                                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Students in this class</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Showing <span className="font-semibold text-gray-900 dark:text-white">{studentStart}</span> to{' '}
                                                        <span className="font-semibold text-gray-900 dark:text-white">{studentEnd}</span> of{' '}
                                                        <span className="font-semibold text-gray-900 dark:text-white">{studentPagination.totalStudents}</span> students
                                                    </p>
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Use <span className="font-semibold text-gray-900 dark:text-white">View Profile</span> for full details and avatar preview.
                                                </p>
                                            </div>

                                            {studentsLoading ? (
                                                <div className="flex items-center justify-center py-16">
                                                    <Loader2 className="h-8 w-8 animate-spin text-[#d6b161]" />
                                                </div>
                                            ) : studentsError ? (
                                                <div className="px-6 py-8 text-center text-red-500">{studentsError}</div>
                                            ) : batchStudents.length === 0 ? (
                                                <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No students found for this class.</div>
                                            ) : (
                                                <>
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                                                            <thead className="bg-gray-50 dark:bg-[#0a192f]">
                                                                <tr>
                                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Student</th>
                                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Contact</th>
                                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Joined</th>
                                                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-[#112240]">
                                                                {batchStudents.map((student) => (
                                                                    <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-[#0a192f]/50">
                                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#d6b161]/30 bg-[#d6b161]/20 text-sm font-bold text-[#d6b161]">
                                                                                    {student.avatar ? (
                                                                                        <img src={getAssetUrl(student.avatar)} alt={student.name} className="h-full w-full object-cover" />
                                                                                    ) : (
                                                                                        student.name.charAt(0).toUpperCase()
                                                                                    )}
                                                                                </div>
                                                                                <div>
                                                                                    <p className="font-semibold text-gray-900 dark:text-white">{student.name}</p>
                                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{student.qualification || 'Qualification not provided'}</p>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                                            <div className="space-y-1 text-sm">
                                                                                <p className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                                                                                    <Mail className="h-3.5 w-3.5" />
                                                                                    {student.email}
                                                                                </p>
                                                                                <p className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                                                                    <Phone className="h-3.5 w-3.5" />
                                                                                    {student.phoneNumber || 'Not provided'}
                                                                                </p>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                                                            {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'Not available'}
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                                            <div className="flex justify-end gap-2">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => void handleViewStudent(student)}
                                                                                    className="inline-flex items-center gap-2 rounded-lg border border-[#d6b161]/30 bg-[#d6b161]/10 px-3 py-2 text-sm font-medium text-[#d6b161] transition-colors hover:bg-[#d6b161]/20"
                                                                                >
                                                                                    <Eye className="h-4 w-4" />
                                                                                    View Profile
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleRemoveStudent(batch._id, student._id)}
                                                                                    className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    <div className="flex flex-col gap-4 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-gray-800">
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            Page <span className="font-semibold text-gray-900 dark:text-white">{studentPagination.currentPage}</span> of{' '}
                                                            <span className="font-semibold text-gray-900 dark:text-white">{studentPagination.totalPages}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => expandedBatch && void fetchBatchStudents(expandedBatch, studentPagination.currentPage - 1)}
                                                                disabled={!studentPagination.hasPreviousPage}
                                                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-[#0a192f] dark:text-gray-300 dark:hover:bg-gray-800"
                                                            >
                                                                <ChevronLeft className="h-4 w-4" />
                                                                Previous
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => expandedBatch && void fetchBatchStudents(expandedBatch, studentPagination.currentPage + 1)}
                                                                disabled={!studentPagination.hasNextPage}
                                                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-[#0a192f] dark:text-gray-300 dark:hover:bg-gray-800"
                                                            >
                                                                Next
                                                                <ChevronRight className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {showAssignModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                            <h2 className="mb-4 text-xl font-bold dark:text-white">Assign Trainer</h2>
                            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                                Assigning trainer for <strong>{selectedBatch?.courseTitle} - {selectedBatch?.name}</strong>
                            </p>
                            <form onSubmit={handleAssignTrainer} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Select Trainer</label>
                                    <select
                                        value={selectedTrainer}
                                        onChange={(event) => setSelectedTrainer(event.target.value)}
                                        className="w-full rounded-lg border border-gray-300 bg-white p-2 outline-none focus:ring-2 focus:ring-[#d6b161] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        required
                                    >
                                        <option value="">-- Select Trainer --</option>
                                        {trainers.map((trainer) => (
                                            <option key={trainer._id} value={trainer._id}>
                                                {trainer.name} ({trainer.email})
                                            </option>
                                        ))}
                                    </select>
                                    {trainers.length === 0 && (
                                        <p className="mt-1 text-xs text-red-500">No trainers found. Promote a user to trainer first.</p>
                                    )}
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAssignModal(false)}
                                        className="flex-1 rounded-lg bg-gray-100 py-2.5 font-medium text-gray-800 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 rounded-lg bg-[#d6b161] py-2.5 font-bold text-[#0a192f] transition-colors hover:bg-[#c4a055]"
                                    >
                                        Save Assignment
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showPromoteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                            <h2 className="mb-4 text-xl font-bold dark:text-white">Promote User to Trainer</h2>
                            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                                Enter the email of a registered user to grant trainer access.
                            </p>
                            <form onSubmit={handlePromoteTrainer} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">User Email</label>
                                    <input
                                        type="email"
                                        placeholder="user@example.com"
                                        value={promoteEmail}
                                        onChange={(event) => setPromoteEmail(event.target.value)}
                                        className="w-full rounded-lg border border-gray-300 bg-white p-2 outline-none focus:ring-2 focus:ring-[#d6b161] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        required
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowPromoteModal(false)}
                                        className="flex-1 rounded-lg bg-gray-100 py-2.5 font-medium text-gray-800 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={promoting}
                                        className="flex-1 rounded-lg bg-[#d6b161] py-2.5 font-bold text-[#0a192f] transition-colors hover:bg-[#c4a055] disabled:opacity-50"
                                    >
                                        {promoting ? 'Promoting...' : 'Promote'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
            <AnimatePresence>
                {isViewModalOpen && selectedStudent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={closeViewModal}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-[#112240]"
                        >
                            <button
                                type="button"
                                onClick={closeViewModal}
                                className="absolute right-4 top-4 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                <X className="h-6 w-6" />
                            </button>

                            <div className="p-8">
                                <div className="mb-8 flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
                                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#d6b161] text-4xl font-bold text-[#0a192f] shadow-lg dark:border-[#0a192f] sm:h-32 sm:w-32 sm:text-5xl">
                                        {selectedStudent.avatar ? (
                                            <img
                                                src={getAssetUrl(selectedStudent.avatar)}
                                                alt={selectedStudent.name}
                                                className="h-full w-full cursor-pointer object-cover transition-opacity hover:opacity-80"
                                                onClick={() => setIsAvatarFullScreen(true)}
                                                title="Click to view full screen"
                                            />
                                        ) : (
                                            selectedStudent.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedStudent.name}</h2>
                                        <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
                                            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                                <Mail className="h-4 w-4" />
                                                <span className="text-sm font-medium">{selectedStudent.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                                                <Phone className="h-4 w-4" />
                                                <span className="text-sm font-medium">{selectedStudent.phoneNumber || 'Not Provided'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0a192f]">
                                        <div className="mb-2 flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-purple-500" />
                                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Date of Birth</span>
                                        </div>
                                        <p className="pl-8 font-bold text-gray-900 dark:text-white">
                                            {selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : 'Not Provided'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0a192f]">
                                        <div className="mb-2 flex items-center gap-3">
                                            <GraduationCap className="h-5 w-5 text-orange-500" />
                                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Qualification</span>
                                        </div>
                                        <p className="pl-8 font-bold text-gray-900 dark:text-white">{selectedStudent.qualification || 'Not Provided'}</p>
                                    </div>
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0a192f]">
                                        <div className="mb-2 flex items-center gap-3">
                                            <BookOpen className="h-5 w-5 text-[#d6b161]" />
                                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">German Level</span>
                                        </div>
                                        <p className="pl-8 font-bold text-gray-900 dark:text-white">{selectedStudent.germanLevel || 'Not Provided'}</p>
                                    </div>
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0a192f]">
                                        <div className="mb-2 flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-[#d6b161]" />
                                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Joined</span>
                                        </div>
                                        <p className="pl-8 font-bold text-gray-900 dark:text-white">
                                            {selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toLocaleDateString() : 'Not Provided'}
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
                                                <p className="font-bold text-gray-900 dark:text-white">{selectedStudent.guardianName || 'Not Provided'}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-xs text-gray-500">Phone</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{selectedStudent.guardianPhone || 'Not Provided'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                                        <BookOpen className="h-5 w-5 text-[#d6b161]" />
                                        Enrolled Courses
                                    </h3>

                                    {studentDetailsLoading ? (
                                        <div className="py-8 text-center">
                                            <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-[#d6b161]" />
                                            <p className="text-sm text-gray-500">Loading courses...</p>
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
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {isAvatarFullScreen && selectedStudent?.avatar && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm" onClick={() => setIsAvatarFullScreen(false)}>
                    <button type="button" className="absolute right-4 top-4 p-2 text-white transition-colors hover:text-gray-300" onClick={() => setIsAvatarFullScreen(false)}>
                        <X className="h-8 w-8" />
                    </button>
                    <img
                        src={getAssetUrl(selectedStudent.avatar)}
                        alt="Full Screen Avatar"
                        className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    />
                </div>
            )}
        </AdminLayout>
    );
};

export default LanguageBatches;
