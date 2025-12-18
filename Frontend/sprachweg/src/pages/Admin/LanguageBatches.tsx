import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import AdminLayout from "../../components/admin/AdminLayout";
import { Users, ChevronDown, ChevronUp, Mail, BookOpen, Search, Filter, Trash2, AlertCircle } from "lucide-react";

interface Student {
    _id: string;
    name: string;
    email: string;
}

interface Batch {
    _id: string;
    courseTitle: string;
    name: string; // was levelName
    students: Student[];
}

const LanguageBatches: React.FC = () => {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCourse, setFilterCourse] = useState("All");

    const fetchBatches = async () => {
        try {
            const { data } = await api.get("/language-training/admin/batches");
            setBatches(data);
            setLoading(false);
        } catch (err) {
            setError("Failed to fetch batches");
            setLoading(false);
        }
    };

    const handleRemoveStudent = async (batchId: string, studentId: string) => {
        if (!confirm("Are you sure you want to remove this student from the active class? This will cancel their enrollment.")) return;

        try {
            await api.delete(`/language-training/admin/batches/${batchId}/students/${studentId}`);

            // Update local state by removing student
            setBatches(prev => prev.map(batch => {
                if (batch._id === batchId) {
                    return {
                        ...batch,
                        students: batch.students.filter(s => s._id !== studentId)
                    };
                }
                return batch;
            }));

        } catch (err) {
            alert("Failed to remove student.");
        }
    };

    const handleDeleteBatch = async (batchId: string) => {
        if (!confirm("WARNING: Are you sure you want to delete this ENTIRE BATCH? All students will be removed from the class (status set to Rejected). This cannot be undone.")) return;

        try {
            await api.delete(`/language-training/admin/batches/${batchId}`);

            // Remove batch from state
            setBatches(prev => prev.filter(b => b._id !== batchId));
        } catch (err) {
            console.error(err);
            alert("Failed to delete batch");
        }
    };

    useEffect(() => {
        fetchBatches();
    }, []);

    const toggleBatch = (id: string) => {
        setExpandedBatch(expandedBatch === id ? null : id);
    };

    // Derived Filters
    const uniqueCourses = ["All", ...Array.from(new Set(batches.map(b => b.courseTitle)))];

    const filteredBatches = batches.filter(batch => {
        if (filterCourse !== "All" && batch.courseTitle !== filterCourse) return false;

        const searchLower = searchTerm.toLowerCase();
        const batchMatches =
            batch.courseTitle.toLowerCase().includes(searchLower) ||
            (batch.name || "").toLowerCase().includes(searchLower);

        const hasMatchingStudent = batch.students.some(s =>
            s.name.toLowerCase().includes(searchLower) ||
            s.email.toLowerCase().includes(searchLower)
        );

        return batchMatches || hasMatchingStudent;
    });

    const getVisibleStudents = (batch: Batch) => {
        if (!searchTerm) return batch.students;
        const searchLower = searchTerm.toLowerCase();
        return batch.students.filter(s =>
            s.name.toLowerCase().includes(searchLower) ||
            s.email.toLowerCase().includes(searchLower)
        );
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">
                            Active Classes
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage your running batches and enrolled students.
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#112240] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search students by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 min-w-[200px]">
                        <Filter className="text-gray-500 dark:text-gray-400 w-5 h-5" />
                        <select
                            value={filterCourse}
                            onChange={(e) => setFilterCourse(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] outline-none cursor-pointer"
                        >
                            {uniqueCourses.map(course => (
                                <option key={course} value={course}>{course}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="w-12 h-12 border-4 border-[#d6b161] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-4 rounded-lg text-center font-medium">
                        {error}
                    </div>
                ) : filteredBatches.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-[#112240] rounded-xl border border-gray-200 dark:border-gray-800">
                        <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Results Found</h3>
                        <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or search terms.</p>
                        {(searchTerm || filterCourse !== "All") && (
                            <button
                                onClick={() => { setSearchTerm(""); setFilterCourse("All"); }}
                                className="mt-4 text-[#d6b161] hover:underline font-medium"
                            >
                                Clear All Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredBatches.map((batch) => {
                            const visibleStudents = getVisibleStudents(batch);
                            const shouldExpand = expandedBatch === batch._id || (searchTerm.length > 0 && visibleStudents.length > 0);

                            return (
                                <div
                                    key={batch._id}
                                    className={`bg-white dark:bg-[#112240] rounded-xl border transition-all duration-200 overflow-hidden
                                        ${shouldExpand ? 'border-[#d6b161] ring-1 ring-[#d6b161]/20 shadow-md' : 'border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md'}
                                    `}
                                >
                                    <div
                                        onClick={() => toggleBatch(batch._id)}
                                        className="p-4 sm:p-6 cursor-pointer flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#0a192f]/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                    {batch.courseTitle}
                                                    <span className="text-xs sm:text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/50">
                                                        {batch.name}
                                                    </span>
                                                </h2>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                                    <Users className="w-4 h-4" />
                                                    <span className="font-medium">{visibleStudents.length} / {batch.students.length}</span> Students Match
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteBatch(batch._id);
                                                }}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
                                                title="Delete Entire Batch"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                            <div className="text-gray-400">
                                                {shouldExpand ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                                            </div>
                                        </div>
                                    </div>

                                    {shouldExpand && (
                                        <div className="border-t border-gray-100 dark:border-gray-800">
                                            {visibleStudents.length === 0 ? (
                                                <div className="p-8 text-center bg-gray-50/50 dark:bg-[#0a192f]/30">
                                                    <p className="text-gray-500 dark:text-gray-400 italic">No students found matching your search in this batch.</p>
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                                                        <thead className="bg-gray-50 dark:bg-[#0a192f]">
                                                            <tr>
                                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                    Student
                                                                </th>
                                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                    Contact
                                                                </th>
                                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                    Actions
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white dark:bg-[#112240] divide-y divide-gray-200 dark:divide-gray-800">
                                                            {visibleStudents.map((student) => (
                                                                <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-[#0a192f]/50 transition-colors">
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="flex items-center">
                                                                            <div className="shrink-0 h-8 w-8 rounded-full bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-xs">
                                                                                {student.name.charAt(0).toUpperCase()}
                                                                            </div>
                                                                            <div className="ml-4">
                                                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                                            <Mail className="w-4 h-4 mr-1.5 text-gray-400" />
                                                                            {student.email}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                        <button
                                                                            onClick={() => handleRemoveStudent(batch._id, student._id)}
                                                                            className="text-red-600 hover:text-red-900 dark:hover:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                            title="Remove Student"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default LanguageBatches;
