import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import AdminLayout from "../../components/admin/AdminLayout";
import { Users, ChevronDown, ChevronUp, Mail, BookOpen, Search, Filter, Trash2, AlertCircle } from "lucide-react";

interface Student {
    _id: string;
    name: string;
    email: string;
}

interface Trainer {
    _id: string;
    name: string;
    email: string;
}

interface Batch {
    _id: string;
    courseTitle: string;
    name: string;
    students: Student[];
    trainerId?: string;
}

const LanguageBatches: React.FC = () => {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCourse, setFilterCourse] = useState("All");

    // Trainer Assignment State
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
    const [selectedTrainer, setSelectedTrainer] = useState("");

    // Promote Trainer State
    const [showPromoteModal, setShowPromoteModal] = useState(false);
    const [promoteEmail, setPromoteEmail] = useState("");
    const [promoting, setPromoting] = useState(false);

    // Pagination State
    const [visibleCount, setVisibleCount] = useState(15);

    const fetchData = async () => {
        try {
            const [batchesRes, trainersRes] = await Promise.all([
                api.get("/language-training/admin/batches"),
                api.get("/language-training/admin/trainers")
            ]);
            setBatches(batchesRes.data);
            setTrainers(trainersRes.data);
            setLoading(false);
        } catch (err) {
            setError("Failed to fetch data");
            setLoading(false);
        }
    };

    const handleAssignTrainer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBatch || !selectedTrainer) return;

        try {
            await api.put(`/language-training/admin/batches/${selectedBatch._id}/assign-trainer`, {
                trainerId: selectedTrainer
            });
            setShowAssignModal(false);
            fetchData(); // Refresh data to show updated trainer
            alert('Trainer assigned successfully');
        } catch (error) {
            console.error("Failed to assign trainer", error);
            alert('Failed to assign trainer');
        }
    };

    const openAssignModal = (batch: Batch, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedBatch(batch);
        setSelectedTrainer(batch.trainerId || '');
        setShowAssignModal(true);
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

    const handlePromoteTrainer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promoteEmail) return;

        try {
            setPromoting(true);
            const { data } = await api.post('/language-training/admin/promote-trainer', { email: promoteEmail });
            alert(data.message);
            setPromoteEmail("");
            setShowPromoteModal(false);
            fetchData(); // Refresh trainers list
        } catch (error: any) {
            console.error("Failed to promote user", error);
            alert(error.response?.data?.message || 'Failed to promote user');
        } finally {
            setPromoting(false);
        }
    };

    useEffect(() => {
        fetchData();
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
                            Manage your running batches, assign trainers, and view enrolled students.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowPromoteModal(true)}
                        className="px-4 py-2 bg-[#d6b161] text-[#0a192f] font-bold rounded-lg hover:bg-[#c4a055] transition-colors flex items-center gap-2"
                    >
                        <Users className="w-5 h-5" />
                        Promote New Trainer
                    </button>
                </div>

                <div className="bg-white dark:bg-[#112240] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search students or batches..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setVisibleCount(15); // Reset pagination on search
                            }}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 min-w-[200px]">
                        <Filter className="text-gray-500 dark:text-gray-400 w-5 h-5" />
                        <select
                            value={filterCourse}
                            onChange={(e) => {
                                setFilterCourse(e.target.value);
                                setVisibleCount(15); // Reset pagination on filter
                            }}
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
                        {filteredBatches.slice(0, visibleCount).map((batch) => {
                            const visibleStudents = getVisibleStudents(batch);
                            const shouldExpand = expandedBatch === batch._id || (searchTerm.length > 0 && visibleStudents.length > 0);
                            const assignedTrainer = trainers.find(t => t._id === batch.trainerId);

                            return (
                                <div
                                    key={batch._id}
                                    className={`bg-white dark:bg-[#112240] rounded-xl border transition-all duration-200 overflow-hidden
                                        ${shouldExpand ? 'border-[#d6b161] ring-1 ring-[#d6b161]/20 shadow-md' : 'border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md'}
                                    `}
                                >
                                    <div
                                        onClick={() => toggleBatch(batch._id)}
                                        className="p-4 sm:p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 dark:hover:bg-[#0a192f]/50 transition-colors gap-4"
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
                                                <div className="flex flex-wrap items-center gap-4 mt-1 text-sm">
                                                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                        <Users className="w-4 h-4" />
                                                        <span className="font-medium">{visibleStudents.length} / {batch.students.length}</span> Students Match
                                                    </p>
                                                    <span className="hidden sm:block text-gray-300 dark:text-gray-700">|</span>
                                                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                        <span className="font-medium">Trainer:</span>
                                                        {assignedTrainer ? (
                                                            <span className="text-gray-900 dark:text-white">{assignedTrainer.name}</span>
                                                        ) : (
                                                            <span className="text-red-500 font-medium">Unassigned</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={(e) => openAssignModal(batch, e)}
                                                className="px-3 py-1.5 text-sm font-medium text-[#d6b161] border border-[#d6b161] rounded-lg hover:bg-[#d6b161]/10 transition-colors"
                                            >
                                                {assignedTrainer ? 'Reassign' : 'Assign Trainer'}
                                            </button>
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
                        
                        {visibleCount < filteredBatches.length && (
                            <div className="flex justify-center mt-8 pb-4">
                                <button
                                    onClick={() => setVisibleCount((prev) => prev + 15)}
                                    className="px-6 py-2.5 bg-white dark:bg-[#112240] text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#0a192f]/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b161]/50 shadow-sm"
                                >
                                    Load More ({filteredBatches.length - visibleCount} remaining)
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Assign Trainer Modal */}
                {showAssignModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700">
                            <h2 className="mb-4 text-xl font-bold dark:text-white">Assign Trainer</h2>
                            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                                Assigning trainer for <strong>{selectedBatch?.courseTitle} - {selectedBatch?.name}</strong>
                            </p>
                            <form onSubmit={handleAssignTrainer} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Select Trainer</label>
                                    <select
                                        value={selectedTrainer}
                                        onChange={(e) => setSelectedTrainer(e.target.value)}
                                        className="w-full rounded-lg border p-2 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-[#d6b161] outline-none"
                                        required
                                    >
                                        <option value="">-- Select Trainer --</option>
                                        {trainers.map(t => (
                                            <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                                        ))}
                                    </select>
                                    {trainers.length === 0 && (
                                        <p className="mt-1 text-xs text-red-500">
                                            No trainers found. Use the CLI script to give a user the 'trainer' role.
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAssignModal(false)}
                                        className="flex-1 rounded-lg bg-gray-100 py-2.5 text-gray-800 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 rounded-lg bg-[#d6b161] py-2.5 text-[#0a192f] transition-colors hover:bg-[#c4a055] font-bold"
                                    >
                                        Save Assignment
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Promote Trainer Modal */}
                {showPromoteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700">
                            <h2 className="mb-4 text-xl font-bold dark:text-white">Promote User to Trainer</h2>
                            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                                Enter the email of a registered user to grant them Trainer access.
                            </p>
                            <form onSubmit={handlePromoteTrainer} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">User Email</label>
                                    <input
                                        type="email"
                                        placeholder="user@example.com"
                                        value={promoteEmail}
                                        onChange={(e) => setPromoteEmail(e.target.value)}
                                        className="w-full rounded-lg border p-2 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-[#d6b161] outline-none"
                                        required
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowPromoteModal(false)}
                                        className="flex-1 rounded-lg bg-gray-100 py-2.5 text-gray-800 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={promoting}
                                        className="flex-1 rounded-lg bg-[#d6b161] py-2.5 text-[#0a192f] transition-colors hover:bg-[#c4a055] font-bold disabled:opacity-50"
                                    >
                                        {promoting ? "Promoting..." : "Promote"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default LanguageBatches;
