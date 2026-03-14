import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, Eye, User as UserIcon, X, Calendar, BookOpen, GraduationCap, Phone, Mail } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../lib/api';
import { getAssetUrl } from '../../lib/api';
import Button from '../../components/ui/Button';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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
    createdAt: string;
}

interface LanguageEnrollment {
    _id: string;
    courseTitle: string;
    name: string; // Course name/level
    status: string;
    createdAt: string;
    batchId?: {
        _id: string;
        courseTitle: string;
        name: string;
    };
}

interface SkillEnrollment {
    _id: string;
    status: string;
    createdAt: string;
    skillCourseId?: {
        _id: string;
        title: string;
    };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ManageStudents: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Search & Pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);
    const LIMIT = 10;

    // View Modal State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [studentDetailsLoading, setStudentDetailsLoading] = useState(false);
    const [languageEnrollments, setLanguageEnrollments] = useState<LanguageEnrollment[]>([]);
    const [skillEnrollments, setSkillEnrollments] = useState<SkillEnrollment[]>([]);
    const [isAvatarFullScreen, setIsAvatarFullScreen] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, [page, searchQuery]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(searchInput);
        setPage(1); // Reset to first page on new search
    };

    const fetchStudents = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/admin/students?page=${page}&limit=${LIMIT}&search=${encodeURIComponent(searchQuery)}`);
            setStudents(response.data.students);
            setTotalPages(response.data.totalPages);
            setTotalStudents(response.data.totalStudents);
        } catch (err: any) {
            console.error("Failed to fetch students:", err);
            setError(err.response?.data?.message || 'Failed to load students');
        } finally {
            setLoading(false);
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
            setLanguageEnrollments(response.data.languageEnrollments || []);
            setSkillEnrollments(response.data.skillEnrollments || []);
        } catch (error) {
            console.error("Failed to load student details", error);
        } finally {
            setStudentDetailsLoading(false);
        }
    };

    const closeViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedStudent(null);
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0a192f] dark:text-white">Manage Students</h1>
                        <p className="text-gray-600 dark:text-gray-400">View all registered students and their details.</p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white dark:bg-[#112240] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                    {/* Header/Controls */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            Total Students: <span className="font-bold text-[#0a192f] dark:text-white">{totalStudents}</span>
                        </div>
                        
                        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search by name or email..."
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#d6b161] focus:border-[#d6b161] sm:text-sm transition-colors"
                            />
                        </form>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">Profile</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">Name</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">Contact Info</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">Joined Date</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                {loading && students.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading students...</td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-red-500">{error}</td>
                                    </tr>
                                ) : students.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No students found.</td>
                                    </tr>
                                ) : (
                                    students.map(student => (
                                        <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="w-10 h-10 rounded-full bg-[#d6b161]/20 flex items-center justify-center overflow-hidden border border-[#d6b161]/30 text-[#d6b161] font-bold">
                                                    {student.avatar ? (
                                                        <img src={getAssetUrl(student.avatar)} alt={student.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        student.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-semibold text-gray-900 dark:text-white">{student.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5 mb-1">
                                                    <Mail className="w-3.5 h-3.5" /> {student.email}
                                                </div>
                                                {student.phoneNumber && (
                                                    <div className="text-sm text-gray-500 flex items-center gap-1.5">
                                                        <Phone className="w-3.5 h-3.5" /> {student.phoneNumber}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {new Date(student.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewStudent(student)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && students.length > 0 && totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Page <span className="font-medium text-gray-900 dark:text-white">{page}</span> of <span className="font-medium text-gray-900 dark:text-white">{totalPages}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* View Student Modal */}
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
                            className="bg-white dark:bg-[#112240] w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl relative z-10"
                        >
                            <button
                                onClick={closeViewModal}
                                className="absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="p-8">
                                {/* Header / Profile Info */}
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 text-center sm:text-left">
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-[#d6b161] text-[#0a192f] text-4xl sm:text-5xl font-bold flex items-center justify-center shadow-lg shrink-0 overflow-hidden border-4 border-white dark:border-[#0a192f]">
                                        {selectedStudent.avatar ? (
                                            <img
                                                src={getAssetUrl(selectedStudent.avatar)}
                                                alt="Avatar"
                                                className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => setIsAvatarFullScreen(true)}
                                                title="Click to view full screen"
                                            />
                                        ) : (
                                            selectedStudent.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                            {selectedStudent.name}
                                        </h2>
                                        <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                                <Mail className="w-4 h-4" />
                                                <span className="font-medium text-sm">{selectedStudent.email}</span>
                                            </div>
                                            {selectedStudent.phoneNumber && (
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                                                    <Phone className="w-4 h-4" />
                                                    <span className="font-medium text-sm">{selectedStudent.phoneNumber}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0a192f] border border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Calendar className="w-5 h-5 text-purple-500" />
                                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Date of Birth</span>
                                        </div>
                                        <p className="font-bold text-gray-900 dark:text-white pl-8">
                                            {selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : "Not Provided"}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0a192f] border border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center gap-3 mb-2">
                                            <GraduationCap className="w-5 h-5 text-orange-500" />
                                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Qualification</span>
                                        </div>
                                        <p className="font-bold text-gray-900 dark:text-white pl-8">
                                            {selectedStudent.qualification || "Not Provided"}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0a192f] border border-gray-100 dark:border-gray-800 sm:col-span-2">
                                        <div className="flex items-center gap-3 mb-3">
                                            <UserIcon className="w-5 h-5 text-pink-500" />
                                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Guardian Details</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-8">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Name</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{selectedStudent.guardianName || "Not Provided"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Phone</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{selectedStudent.guardianPhone || "Not Provided"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Enrolled Courses */}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-[#d6b161]" />
                                        Enrolled Courses
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        {studentDetailsLoading ? (
                                            <div className="text-center py-8">
                                                <div className="w-8 h-8 border-2 border-[#d6b161] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                                <p className="text-sm text-gray-500">Loading courses...</p>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Language Courses */}
                                                {languageEnrollments.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Language Trainings</h4>
                                                        <div className="grid gap-3 sm:grid-cols-2">
                                                            {languageEnrollments.map(enrollment => (
                                                                <div key={enrollment._id} className="p-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-[#112240]">
                                                                    <div className="font-bold text-gray-900 dark:text-white mb-1">{enrollment.courseTitle}</div>
                                                                    <div className="flex items-center justify-between text-sm">
                                                                        <span className="text-gray-600 dark:text-gray-400">{enrollment.name}</span>
                                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                            enrollment.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                            enrollment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                                        }`}>
                                                                            {enrollment.status}
                                                                        </span>
                                                                    </div>
                                                                    {enrollment.batchId && (
                                                                         <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                                                                             Assigned Batch: Class - {enrollment.batchId.name}
                                                                         </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Skill Courses */}
                                                {skillEnrollments.length > 0 && (
                                                    <div className={languageEnrollments.length > 0 ? "mt-6" : ""}>
                                                        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Skill Trainings</h4>
                                                        <div className="grid gap-3 sm:grid-cols-2">
                                                            {skillEnrollments.map(enrollment => (
                                                                <div key={enrollment._id} className="p-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-[#112240]">
                                                                    <div className="font-bold text-gray-900 dark:text-white mb-1">
                                                                        {enrollment.skillCourseId?.title || "Unknown Course"}
                                                                    </div>
                                                                    <div className="flex items-center justify-between text-sm">
                                                                        <span className="text-gray-600 dark:text-gray-400">Skill Development</span>
                                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                            enrollment.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                            enrollment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
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
                                                    <div className="text-center py-6 bg-gray-50 dark:bg-[#0a192f] rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                                                        <p className="text-gray-500 dark:text-gray-400">No course enrollments found.</p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Full Screen Avatar Modal */}
            {isAvatarFullScreen && selectedStudent?.avatar && (
                <div 
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-300 backdrop-blur-sm"
                    onClick={() => setIsAvatarFullScreen(false)}
                >
                    <button 
                        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors p-2"
                        onClick={() => setIsAvatarFullScreen(false)}
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img 
                        src={getAssetUrl(selectedStudent.avatar)} 
                        alt="Full Screen Avatar" 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </AdminLayout>
    );
};

export default ManageStudents;
