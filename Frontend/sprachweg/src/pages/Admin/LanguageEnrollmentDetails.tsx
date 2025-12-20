import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "../../components/admin/AdminLayout";
import { Check, X, Filter, Search, Mail, BookOpen, Eye, Phone } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Enrollment {
    _id: string;
    userId: {
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
    } | null;
    courseTitle: string;
    name: string; // was levelName
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdAt?: string;
}

const LanguageEnrollmentDetails: React.FC = () => {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filterLevel, setFilterLevel] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);

    // Extract unique levels for the filter dropdown
    const levels = ["All", ...Array.from(new Set(
        Array.isArray(enrollments)
            ? enrollments.map(e => e.name).filter(Boolean)
            : []
    ))];

    const fetchEnrollments = async () => {
        try {
            const token = localStorage.getItem("token");
            const config = {
                headers: { Authorization: `Bearer ${token}` },
            };

            const { data } = await axios.get(
                `${API_URL}/language-training/admin/enrollments?status=PENDING`,
                config
            );

            // Ensure data is an array before setting state
            if (Array.isArray(data)) {
                setEnrollments(data);
            } else {
                console.error("Expected array but got:", data);
                setEnrollments([]);
            }
            setLoading(false);
        } catch (err) {
            console.error("Fetch error:", err);
            setError("Failed to fetch enrollments");
            setLoading(false);
        }
    };

    const handleApprove = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            const token = localStorage.getItem("token");
            const config = {
                headers: { Authorization: `Bearer ${token}` },
            };
            await axios.post(
                `${API_URL}/language-training/admin/enroll/${id}/approve`,
                {},
                config
            );
            setEnrollments(enrollments.filter((e) => e._id !== id));
            if (selectedEnrollment?._id === id) setSelectedEnrollment(null);
            // Optional: Add toast notification here
        } catch (err) {
            alert("Failed to approve");
        }
    };

    const handleReject = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!confirm("Are you sure you want to reject this enrollment?")) return;
        try {
            const token = localStorage.getItem("token");
            const config = {
                headers: { Authorization: `Bearer ${token}` },
            };
            await axios.post(
                `${API_URL}/language-training/admin/enroll/${id}/reject`,
                {},
                config
            );
            setEnrollments(enrollments.filter((e) => e._id !== id));
            if (selectedEnrollment?._id === id) setSelectedEnrollment(null);
        } catch (err) {
            alert("Failed to reject");
        }
    };

    useEffect(() => {
        fetchEnrollments();
    }, []);

    const filteredEnrollments = enrollments.filter(enrollment => {
        const matchesLevel = filterLevel === "All" || enrollment.name === filterLevel;
        const matchesSearch =
            (enrollment.userId?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (enrollment.userId?.email || "").toLowerCase().includes(searchTerm.toLowerCase());
        return matchesLevel && matchesSearch;
    });

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">
                            Verify Enrollments
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Review and approve student enrollment requests for language courses.
                        </p>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white dark:bg-[#112240] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by student name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Filter className="text-gray-500 dark:text-gray-400 w-5 h-5" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Filter by Level:</span>
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="flex-1 md:w-40 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] outline-none cursor-pointer"
                        >
                            {levels.map(level => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="w-12 h-12 border-4 border-[#d6b161] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-4 rounded-lg text-center">
                        {error}
                    </div>
                ) : filteredEnrollments.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-[#112240] rounded-xl border border-gray-200 dark:border-gray-800">
                        <div className="bg-gray-100 dark:bg-[#0a192f] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Pending Requests</h3>
                        <p className="text-gray-500 dark:text-gray-400">All caught up! There are no enrollment requests pending approval.</p>
                        {filterLevel !== "All" && (
                            <button
                                onClick={() => setFilterLevel("All")}
                                className="mt-4 text-[#d6b161] hover:underline font-medium"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEnrollments.map((enrollment) => (
                            <div
                                key={enrollment._id}
                                className="bg-[#0B1221] text-white rounded-xl border border-gray-800 p-6 shadow-lg hover:shadow-xl transition-all relative group cursor-pointer"
                                onClick={() => setSelectedEnrollment(enrollment)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#1A2333] flex items-center justify-center text-[#d6b161] font-bold text-xl border border-gray-700">
                                            {enrollment.userId?.name?.charAt(0).toUpperCase() || "U"}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg line-clamp-1">
                                                {enrollment.userId?.name || "Unknown User"}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                <Mail className="w-3 h-3" />
                                                <span className="line-clamp-1">{enrollment.userId?.email || "No Email"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#1E3A8A] text-blue-300 border border-blue-900">
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
                                </div>

                                <div className="flex gap-3 mt-auto">
                                    <button
                                        onClick={(e) => handleApprove(enrollment._id, e)}
                                        className="flex-1 bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] py-2.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg"
                                    >
                                        <Check className="w-4 h-4" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={(e) => handleReject(enrollment._id, e)}
                                        className="flex-1 bg-transparent border border-red-900/50 text-red-500 hover:bg-red-900/20 py-2.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        Reject
                                    </button>
                                </div>

                                {/* Hover Hint */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Eye className="w-5 h-5 text-gray-400 hover:text-white" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* User Profile Modal */}
                {selectedEnrollment && selectedEnrollment.userId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-[#112240] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-[#112240] z-10">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    Student Profile
                                </h2>
                                <button
                                    onClick={() => setSelectedEnrollment(null)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div className="w-24 h-24 rounded-full bg-[#d6b161] text-[#0a192f] text-4xl font-bold flex items-center justify-center shadow-lg shrink-0">
                                        {selectedEnrollment.userId.avatar ? (
                                            <img src={selectedEnrollment.userId.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            selectedEnrollment.userId.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                            {selectedEnrollment.userId.name}
                                        </h3>
                                        <div className="flex flex-col sm:flex-row items-center gap-4 text-gray-500 dark:text-gray-400">
                                            <a
                                                href={`mailto:${selectedEnrollment.userId.email}`}
                                                className="flex items-center gap-2 hover:text-[#d6b161] transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                            >
                                                <Mail className="w-4 h-4" />
                                                {selectedEnrollment.userId.email}
                                            </a>
                                            {selectedEnrollment.userId.phoneNumber && (
                                                <a
                                                    href={`tel:${selectedEnrollment.userId.phoneNumber}`}
                                                    className="flex items-center gap-2 hover:text-[#d6b161] transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                                >
                                                    <Phone className="w-4 h-4" />
                                                    {selectedEnrollment.userId.phoneNumber}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0a192f]/50 flex justify-end gap-3 rounded-b-2xl">
                                <button
                                    onClick={() => setSelectedEnrollment(null)}
                                    className="px-6 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-white dark:hover:bg-[#112240] transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => handleApprove(selectedEnrollment._id)}
                                    className="px-6 py-2 rounded-lg bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] font-bold shadow-md transition-colors flex items-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Approve Enrollment
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default LanguageEnrollmentDetails;
