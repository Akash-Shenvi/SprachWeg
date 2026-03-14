import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Video,
    FileText,
    Bell,
    Plus,
    X,
    Trash2,
    Users,
    Download,
    CheckCircle,
    XCircle,
    UserCheck,
    Ban,
    ArrowLeft,
    Mail,
    Phone,
    Calendar,
    GraduationCap,
    User as UserIcon,
    Eye

} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';
import api, { getAssetUrl } from '../lib/api';

interface Annotation {
    _id: string;
    title: string;
    content: string;
    createdAt: string;
}

interface Material {
    _id: string;
    title: string;
    subtitle?: string;
    description: string;
    fileUrl?: string;
    createdAt: string;
}

interface Student {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    avatar?: string;
    germanLevel?: string;
    guardianName?: string;
    guardianPhone?: string;
    qualification?: string;
    dateOfBirth?: string;
}

interface BatchDetails {
    _id: string;
    name: string;
    courseTitle: string;
    announcements: Annotation[];
    materials: Material[];
    students: Student[];
    trainerId: string;
    classes: LanguageClass[];
}

interface LanguageClass {
    _id: string;
    topic: string;
    startTime: string;
    meetLink: string;
    attendees: { studentId: string; joinedAt: string }[];
    status: 'scheduled' | 'completed' | 'cancelled';
}

const LanguageBatchDetails: React.FC = () => {
    const { batchId } = useParams<{ batchId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [batch, setBatch] = useState<BatchDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'announcements' | 'materials' | 'students' | 'classes'>('announcements');
    const contentContainerRef = useRef<HTMLDivElement>(null);
    const tabsContainerRef = useRef<HTMLDivElement>(null);

    // Forms State
    const [showAddModal, setShowAddModal] = useState(false);

    // Add Item State
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [content, setContent] = useState('');
    const [classDate, setClassDate] = useState('');
    const [classTime, setClassTime] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);

    // Attendance Modal State
    const [attendanceClass, setAttendanceClass] = useState<LanguageClass | null>(null);
    const [attendanceLoading, setAttendanceLoading] = useState(false);

    // View Student Profile State
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isAvatarFullScreen, setIsAvatarFullScreen] = useState(false);

    // Pagination State — per tab
    const PAGE_LIMIT = 10;

    const [announcements, setAnnouncements] = useState<Annotation[]>([]);
    const [annPage, setAnnPage] = useState(1);
    const [annHasMore, setAnnHasMore] = useState(false);
    const [annLoading, setAnnLoading] = useState(false);

    const [materials, setMaterials] = useState<Material[]>([]);
    const [matPage, setMatPage] = useState(1);
    const [matHasMore, setMatHasMore] = useState(false);
    const [matLoading, setMatLoading] = useState(false);

    const [students, setStudents] = useState<Student[]>([]);
    const [stuPage, setStuPage] = useState(1);
    const [stuHasMore, setStuHasMore] = useState(false);
    const [stuLoading, setStuLoading] = useState(false);

    const [classes, setClasses] = useState<LanguageClass[]>([]);
    const [clsPage, setClsPage] = useState(1);
    const [clsHasMore, setClsHasMore] = useState(false);
    const [clsLoading, setClsLoading] = useState(false);

    const isTrainer = user?.role === 'trainer' || user?._id === batch?.trainerId;

    // --- Paginated fetch helpers ---
    const fetchTab = async (tab: typeof activeTab, page: number, append = false) => {
        if (!batchId) return;
        const setLoading = tab === 'announcements' ? setAnnLoading
            : tab === 'materials' ? setMatLoading
            : tab === 'students' ? setStuLoading
            : setClsLoading;

        setLoading(true);
        try {
            const res = await api.get(`/language-trainer/batch/${batchId}/${tab}`, {
                params: { page, limit: PAGE_LIMIT }
            });
            const { data, hasMore } = res.data;
            if (tab === 'announcements') {
                setAnnouncements(prev => append ? [...prev, ...data] : data);
                setAnnHasMore(hasMore);
                setAnnPage(page);
            } else if (tab === 'materials') {
                setMaterials(prev => append ? [...prev, ...data] : data);
                setMatHasMore(hasMore);
                setMatPage(page);
            } else if (tab === 'students') {
                setStudents(prev => append ? [...prev, ...data] : data);
                setStuHasMore(hasMore);
                setStuPage(page);
            } else {
                setClasses(prev => append ? [...prev, ...data] : data);
                setClsHasMore(hasMore);
                setClsPage(page);
            }
        } catch (err) {
            console.error(`Failed to fetch ${tab}`, err);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchBatchDetails();

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('googleConnected') === 'true') {
            alert('✅ Google Calendar successfully connected! Meeting links will now be auto-generated.');
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [batchId]);

    // Re-fetch active tab whenever batchId or activeTab changes
    useEffect(() => {
        if (batchId) fetchTab(activeTab, 1, false);
    }, [batchId, activeTab]);

    const fetchBatchDetails = async () => {
        try {
            const response = await api.get(`/language-trainer/batch/${batchId}`);
            setBatch(response.data);
        } catch (error) {
            console.error("Failed to fetch batch details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkGoogleConnection = async () => {
            if (isTrainer) {
                try {
                    const response = await api.get('/auth/me');
                    setIsGoogleConnected(!!response.data.googleRefreshToken);
                } catch (error) {
                    console.error('Failed to check Google connection', error);
                }
            }
        };
        checkGoogleConnection();
    }, [isTrainer]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!batchId) return;

        try {
            setSubmitting(true);

            if (activeTab === 'announcements') {
                await api.post('/language-trainer/announcements', {
                    batchId,
                    title,
                    content
                });
            } else if (activeTab === 'classes') {
                const startTime = new Date(`${classDate}T${classTime}`);
                await api.post('/language-trainer/classes', {
                    batchId,
                    topic: title,
                    startTime
                });
            } else {
                const formData = new FormData();
                formData.append('batchId', batchId);
                formData.append('title', title);
                formData.append('subtitle', subtitle);
                formData.append('description', content);
                if (selectedFile) {
                    formData.append('file', selectedFile);
                }
                await api.post('/language-trainer/materials', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }

            setShowAddModal(false);
            resetForm();
            fetchTab(activeTab, 1, false); // refresh this tab from page 1
        } catch (error) {
            console.error("Failed to add item", error);
            alert("Failed to add item. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setSubtitle('');
        setContent('');
        setClassDate('');
        setClassTime('');
        setSelectedFile(null);
    };

    const handleDeleteAnnouncement = async (announcementId: string) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) return;

        try {
            await api.delete(`/language-trainer/announcements/${announcementId}`);
            fetchTab('announcements', 1, false);
        } catch (error) {
            console.error("Failed to delete announcement", error);
            alert("Failed to delete announcement. Please try again.");
        }
    };

    const handleDeleteMaterial = async (materialId: string) => {
        if (!window.confirm('Are you sure you want to delete this material?')) return;

        try {
            await api.delete(`/language-trainer/materials/${materialId}`);
            fetchTab('materials', 1, false);
        } catch (error) {
            console.error("Failed to delete material", error);
            alert("Failed to delete material. Please try again.");
        }
    };

    const handleDeleteClass = async (classId: string) => {
        if (!window.confirm('Are you sure you want to delete this class?')) return;
        try {
            await api.delete(`/language-trainer/classes/${classId}`);
            setBatch(prev => prev ? {
                ...prev,
                classes: prev.classes.filter(c => c._id !== classId)
            } : null);
        } catch (error) {
            console.error("Failed to delete class", error);
        }
    };

    const handleEndClass = async (classId: string) => {
        if (!window.confirm('Are you sure you want to end this class? This will disable the meeting link.')) return;
        try {
            await api.post(`/language-trainer/classes/${classId}/end`, {});
            setBatch(prev => prev ? {
                ...prev,
                classes: prev.classes.map(c => c._id === classId ? { ...c, status: 'completed' } : c)
            } : null);
            alert('Class ended successfully.');
        } catch (error) {
            console.error("Failed to end class", error);
            alert('Failed to end class');
        }
    };

    const handleUpdateAttendance = async (studentId: string, attended: boolean) => {
        if (!attendanceClass) return;
        setAttendanceLoading(true);
        try {
            const response = await api.put(`/language-trainer/classes/${attendanceClass._id}/attendance`, {
                studentId,
                attended
            });
            setAttendanceClass(prev => prev ? { ...prev, attendees: response.data.attendees } : null);
            setBatch(prev => prev ? {
                ...prev,
                classes: prev.classes.map(c => c._id === attendanceClass._id ? { ...c, attendees: response.data.attendees } : c)
            } : null);
        } catch (error) {
            console.error("Failed to update attendance", error);
        } finally {
            setAttendanceLoading(false);
        }
    };

    const handleJoinClass = async (classId: string, link: string) => {
        try {
            await api.post(`/language-trainer/classes/${classId}/join`);
            window.open(link, '_blank');
        } catch (error) {
            console.error("Failed to join class", error);
            window.open(link, '_blank');
        }
    };

    const handleConnectGoogle = async () => {
        try {
            sessionStorage.setItem('googleOAuthReturnUrl', window.location.pathname);
            const response = await api.get('/auth/google/url');
            window.location.href = response.data.url;
        } catch (error) {
            console.error("Failed to get Google Auth URL", error);
            alert("Failed to initiate Google Calendar connection");
        }
    };

    const getFileIcon = (filename: string = '') => {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return <img className="h-6 w-6" />;
        if (['pdf'].includes(ext || '')) return <FileText className="h-6 w-6" />;
        return <FileText className="h-6 w-6" />;
    };



    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
            <div className="flex flex-col items-center gap-4">
                <div className="h-14 w-14 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-[#d6b161]"></div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Loading batch details...</p>
            </div>
        </div>
    );

    if (!batch) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Batch Not Found</h2>
                <p className="text-gray-600 dark:text-gray-400">The batch you're looking for doesn't exist.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-950 flex flex-col">
            <Header />

            <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
                {/* Navigation */}
                <div className="mb-8 animate-in fade-in slide-in-from-top duration-500">
                    <button
                        onClick={() => navigate(-1)}
                        className="group inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all duration-300 hover:gap-3 mb-6"
                    >
                        <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
                        <span className="font-medium">Back to Dashboard</span>
                    </button>

                    {/* Batch Header */}
                    <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-800/50 backdrop-blur-xl shadow-xl border border-gray-100 dark:border-gray-700/50 p-6 sm:p-8 lg:p-10">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0a192f]/5 via-transparent to-[#d6b161]/5 pointer-events-none" />

                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#d6b161]/10 rounded-full blur-3xl dark:bg-[#d6b161]/5" />
                        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl dark:bg-blue-500/5" />

                        <div className="relative z-10">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-4">
                                <div className="flex-1">
                                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                                        {batch.courseTitle}
                                    </h1>
                                    <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#d6b161]/10 to-[#d6b161]/5 px-4 py-2 border border-[#d6b161]/20 dark:border-[#d6b161]/10">
                                        <div className="w-2 h-2 rounded-full bg-[#d6b161] animate-pulse" />
                                        <span className="text-sm font-semibold text-[#d6b161]">{batch.name}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 sm:gap-8">
                                    <div className="text-center">
                                        <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                                            {batch.students?.length || 0}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Students</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs - Responsive with scroll on mobile */}
                <div className="mb-8 animate-in fade-in slide-in-from-top duration-500 delay-100">
                    <div
                        ref={tabsContainerRef}
                        className="relative overflow-x-auto scrollbar-hide border-b border-gray-200 dark:border-gray-700/50"
                    >
                        <style>{`
                            .scrollbar-hide::-webkit-scrollbar { display: none; }
                            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                            .tab-scroll { scroll-behavior: smooth; }
                        `}</style>

                        <div className="flex space-x-1 min-w-max px-0 tab-scroll">
                            {(['announcements', 'materials', 'students', 'classes'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`relative px-5 sm:px-6 py-4 text-sm sm:text-base font-semibold whitespace-nowrap transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b161]/30 rounded-lg ${activeTab === tab
                                        ? 'text-[#d6b161]'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                        }`}
                                    role="tab"
                                    aria-selected={activeTab === tab}
                                    aria-label={`${tab.charAt(0).toUpperCase() + tab.slice(1)} tab`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/([A-Z])/g, ' $1')}

                                    {activeTab === tab && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#d6b161] to-[#d6b161]/60 rounded-full animate-in" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Action Bar */}
                {isTrainer && activeTab !== 'students' && (
                    <div className="mb-8 flex justify-end animate-in fade-in slide-in-from-bottom duration-500 delay-150">
                        <button
                            onClick={() => { resetForm(); setShowAddModal(true); }}
                            className="group inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-[#d6b161] to-[#c4a055] text-[#0a192f] hover:shadow-lg hover:shadow-[#d6b161]/20 hover:-translate-y-0.5 transition-all duration-300 border border-[#d6b161]/50 dark:border-[#d6b161]/30"
                            role="button"
                            aria-label={`Add new ${activeTab}`}
                        >
                            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90 duration-300" />
                            <span className="hidden sm:inline">Add {activeTab === 'announcements' ? 'Announcement' : activeTab === 'classes' ? 'Class' : 'Material'}</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                    </div>
                )}

                {/* Content Area */}
                <div
                    ref={contentContainerRef}
                    className="animate-in fade-in slide-in-from-bottom duration-500 delay-200"
                >
                    {activeTab === 'classes' ? (
                        <div className="space-y-4 sm:space-y-5">
                            {(!batch.classes || batch.classes.length === 0) && (
                                <div className="text-center py-12 sm:py-16 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 backdrop-blur-xl">
                                    <Video className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400 text-base font-medium">No live classes scheduled yet.</p>
                                </div>
                            )}

                            {(batch.classes || []).map((cls, idx) => (
                                <div
                                    key={cls._id}
                                    className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 backdrop-blur-xl p-5 sm:p-6 lg:p-7 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-left duration-500"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-emerald-400" />

                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    <div className="relative z-10">
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-start gap-4 min-w-0 flex-1">
                                                <div className="flex-shrink-0 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-3 text-green-600 dark:bg-green-900/20 dark:text-green-400 transition-transform group-hover:scale-110 duration-300">
                                                    <Video className="h-6 w-6" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 truncate group-hover:text-[#d6b161] transition-colors">
                                                        {cls.topic}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                                        <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg font-medium">
                                                            {new Date(cls.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg font-medium">
                                                            {new Date(cls.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                                            <Users className="h-4 w-4" /> {cls.attendees?.length || 0} joined
                                                        </span>
                                                        {cls.status === 'completed' && (
                                                            <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider">
                                                                ✓ Completed
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                                {cls.status !== 'completed' ? (
                                                    <button
                                                        onClick={() => handleJoinClass(cls._id, cls.meetLink)}
                                                        className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-0.5 transition-all duration-300 text-sm whitespace-nowrap"
                                                        role="button"
                                                        aria-label="Join class"
                                                    >
                                                        <Video className="h-4 w-4" />
                                                        <span className="hidden sm:inline">Join Class</span>
                                                        <span className="sm:hidden">Join</span>
                                                    </button>
                                                ) : (
                                                    <span className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 rounded-xl font-semibold text-sm">
                                                        Class Ended
                                                    </span>
                                                )}

                                                {isTrainer && (
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => setAttendanceClass(cls)}
                                                            className="p-2.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                                                            title="Attendance"
                                                            aria-label="View attendance"
                                                        >
                                                            <UserCheck className="h-5 w-5" />
                                                        </button>
                                                        {cls.status !== 'completed' && (
                                                            <button
                                                                onClick={() => handleEndClass(cls._id)}
                                                                className="p-2.5 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20 rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30"
                                                                title="End Class"
                                                                aria-label="End class"
                                                            >
                                                                <Ban className="h-5 w-5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteClass(cls._id)}
                                                            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                                                            title="Delete Class"
                                                            aria-label="Delete class"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activeTab === 'announcements' ? (
                        <div className="space-y-4 sm:space-y-5">
                            {!annLoading && announcements.length === 0 && (
                                <div className="text-center py-12 sm:py-16 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 backdrop-blur-xl">
                                    <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400 text-base font-medium">No announcements yet.</p>
                                </div>
                            )}
                            {announcements.map((item, idx) => (
                                <div key={item._id} className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 backdrop-blur-xl p-5 sm:p-6 lg:p-7 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-right duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-400" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="relative z-10">
                                        <div className="flex items-start gap-4 sm:gap-5">
                                            <div className="flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 p-3 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 transition-transform group-hover:scale-110 duration-300">
                                                <Bell className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3">
                                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white group-hover:text-[#d6b161] transition-colors break-words">{item.title}</h3>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg whitespace-nowrap">
                                                            {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                                                        </span>
                                                        {isTrainer && (
                                                            <button onClick={() => handleDeleteAnnouncement(item._id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 hover:text-red-600 dark:text-red-400 duration-200" title="Delete" aria-label="Delete announcement">
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base whitespace-pre-wrap break-words">{item.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {annHasMore && (
                                <div className="flex justify-center mt-6 pb-4">
                                    <button onClick={() => fetchTab('announcements', annPage + 1, true)} disabled={annLoading} className="px-6 py-2.5 bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 font-semibold rounded-xl border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-sm disabled:opacity-50">
                                        {annLoading ? 'Loading...' : 'Load More'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'materials' ? (
                        <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {!matLoading && materials.length === 0 && (
                                <div className="col-span-full text-center py-12 sm:py-16 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 backdrop-blur-xl">
                                    <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400 text-base font-medium">No learning materials uploaded yet.</p>
                                </div>
                            )}
                            {materials.map((item, idx) => (
                                <div key={item._id} className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 backdrop-blur-xl p-5 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col h-full animate-in fade-in slide-in-from-bottom duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="mb-4 flex items-start justify-between">
                                            <div className="flex gap-3 items-center">
                                                <div className="flex flex-shrink-0 h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 transition-transform group-hover:scale-110 duration-300">
                                                    {getFileIcon(item.fileUrl)}
                                                </div>
                                                {item.createdAt && (
                                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded-lg">
                                                        {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                )}
                                            </div>
                                            {isTrainer && (
                                                <button onClick={() => handleDeleteMaterial(item._id)} className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 ml-2 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 hover:text-red-600 dark:text-red-400 shadow-sm" title="Delete" aria-label="Delete material">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex-1 mb-4">
                                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-[#d6b161] transition-colors" title={item.title}>{item.title}</h3>
                                            {item.subtitle && <p className="text-sm font-semibold text-[#d6b161] mb-2 line-clamp-1">{item.subtitle}</p>}
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">{item.description}</p>
                                        </div>
                                        {item.fileUrl ? (
                                            <div className="mt-auto flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                                                <a href={getAssetUrl(item.fileUrl)} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-all duration-300 border border-gray-200 dark:border-gray-700" aria-label={`View ${item.title}`}>
                                                    <Eye className="h-4 w-4" /> View
                                                </a>
                                                <a href={getAssetUrl(item.fileUrl)} download={item.title} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 hover:from-emerald-500 hover:to-green-500 py-2.5 text-sm font-semibold text-emerald-600 hover:text-white dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:text-white transition-all duration-300 border border-emerald-200 dark:border-emerald-700/50" aria-label={`Download ${item.title}`}>
                                                    <Download className="h-4 w-4" /> Download
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="mt-auto w-full py-2.5 text-center text-sm font-medium text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-xl">No file</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {matHasMore && (
                                <div className="col-span-full flex justify-center mt-6 pb-4">
                                    <button onClick={() => fetchTab('materials', matPage + 1, true)} disabled={matLoading} className="px-6 py-2.5 bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 font-semibold rounded-xl border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-sm disabled:opacity-50">
                                        {matLoading ? 'Loading...' : 'Load More'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'students' ? (
                        <div className="space-y-4 sm:space-y-5">
                            {!stuLoading && students.length === 0 && (
                                <div className="text-center py-12 sm:py-16 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 backdrop-blur-xl">
                                    <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400 text-base font-medium">No students enrolled yet.</p>
                                </div>
                            )}
                            {students.map((student, idx) => (
                                <div key={student._id} className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 backdrop-blur-xl p-5 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="relative z-10 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600 font-bold text-lg dark:bg-blue-900/20 dark:text-blue-400 transition-transform group-hover:scale-110 duration-300">
                                                {student.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-gray-900 dark:text-white text-base sm:text-lg truncate">{student.name}</p>
                                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{student.email}</p>
                                            </div>
                                        </div>
                                        {isTrainer && (
                                            <button onClick={() => setSelectedStudent(student)} className="flex-shrink-0 text-sm font-semibold text-gray-400 hover:text-[#d6b161] transition-colors duration-300 rounded px-3 py-2" aria-label={`View ${student.name}'s profile`}>
                                                <span className="hidden sm:inline">View Profile</span>
                                                <span className="sm:hidden">→</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {stuHasMore && (
                                <div className="flex justify-center mt-6 pb-4">
                                    <button onClick={() => fetchTab('students', stuPage + 1, true)} disabled={stuLoading} className="px-6 py-2.5 bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 font-semibold rounded-xl border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-sm disabled:opacity-50">
                                        {stuLoading ? 'Loading...' : 'Load More'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4 sm:space-y-5">
                            {!clsLoading && classes.length === 0 && (
                                <div className="text-center py-12 sm:py-16 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 backdrop-blur-xl">
                                    <Video className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400 text-base font-medium">No live classes scheduled yet.</p>
                                </div>
                            )}
                            {classes.map((cls, idx) => (
                                <div key={cls._id} className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 backdrop-blur-xl p-5 sm:p-6 lg:p-7 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-emerald-400" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="relative z-10">
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-start gap-4 min-w-0 flex-1">
                                                <div className="flex-shrink-0 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-3 text-green-600 dark:bg-green-900/20 dark:text-green-400 transition-transform group-hover:scale-110 duration-300">
                                                    <Video className="h-6 w-6" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 truncate group-hover:text-[#d6b161] transition-colors">{cls.topic}</h3>
                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                                        <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg font-medium">
                                                            {new Date(cls.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg font-medium">
                                                            {new Date(cls.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                                            <Users className="h-4 w-4" /> {cls.attendees?.length || 0} joined
                                                        </span>
                                                        {cls.status === 'completed' && (
                                                            <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider">✓ Completed</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                                {cls.status !== 'completed' ? (
                                                    <button onClick={() => handleJoinClass(cls._id, cls.meetLink)} className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-0.5 transition-all duration-300 text-sm" aria-label="Join class">
                                                        <Video className="h-4 w-4" />
                                                        <span className="hidden sm:inline">Join Class</span>
                                                        <span className="sm:hidden">Join</span>
                                                    </button>
                                                ) : (
                                                    <span className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 rounded-xl font-semibold text-sm">Class Ended</span>
                                                )}
                                                {isTrainer && (
                                                    <div className="flex gap-1">
                                                        <button onClick={() => setAttendanceClass(cls)} className="p-2.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200" title="Attendance" aria-label="View attendance">
                                                            <UserCheck className="h-5 w-5" />
                                                        </button>
                                                        {cls.status !== 'completed' && (
                                                            <button onClick={() => handleEndClass(cls._id)} className="p-2.5 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20 rounded-lg transition-colors duration-200" title="End Class" aria-label="End class">
                                                                <Ban className="h-5 w-5" />
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleDeleteClass(cls._id)} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200" title="Delete Class" aria-label="Delete class">
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {clsHasMore && (
                                <div className="flex justify-center mt-6 pb-4">
                                    <button onClick={() => fetchTab('classes', clsPage + 1, true)} disabled={clsLoading} className="px-6 py-2.5 bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 font-semibold rounded-xl border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-sm disabled:opacity-50">
                                        {clsLoading ? 'Loading...' : 'Load More'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Add Item Modal */}
            {showAddModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-300"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Add ${activeTab}`}
                >
                    <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-gray-800 shadow-2xl max-h-[85vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-300">
                        <div className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800 px-6 sm:px-8 py-5 sm:py-6 backdrop-blur-xl">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                        {activeTab === 'classes' ? 'Schedule Live Class' : `Add ${activeTab === 'announcements' ? 'Announcement' : 'Material'}`}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b161]/30"
                                    aria-label="Close modal"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleAddItem} className="p-6 sm:p-8 space-y-5 sm:space-y-6">
                            {/* Title Field */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Chapter 1 Notes"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all duration-200 focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 dark:focus:border-[#d6b161]"
                                    required
                                    aria-label="Title"
                                />
                            </div>

                            {activeTab === 'classes' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                Date
                                            </label>
                                            <input
                                                type="date"
                                                value={classDate}
                                                onChange={e => setClassDate(e.target.value)}
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-3 text-sm text-gray-900 dark:text-white outline-none transition-all duration-200 focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 dark:focus:border-[#d6b161]"
                                                required
                                                aria-label="Class date"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                Time
                                            </label>
                                            <input
                                                type="time"
                                                value={classTime}
                                                onChange={e => setClassTime(e.target.value)}
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-3 text-sm text-gray-900 dark:text-white outline-none transition-all duration-200 focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 dark:focus:border-[#d6b161]"
                                                required
                                                aria-label="Class time"
                                            />
                                        </div>
                                    </div>

                                    {/* Google Calendar Connection Status */}
                                    <div className={`p-4 sm:p-5 rounded-xl border transition-all duration-300 ${isGoogleConnected
                                        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50'
                                        : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/50'
                                        }`}>
                                        <div className="flex items-center gap-3 flex-col sm:flex-row">
                                            <div className={`p-2.5 rounded-xl flex-shrink-0 ${isGoogleConnected
                                                ? 'bg-green-100 dark:bg-green-800/30'
                                                : 'bg-blue-100 dark:bg-blue-800/30'
                                                }`}>
                                                <Video className={`h-5 w-5 ${isGoogleConnected
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-blue-600 dark:text-blue-400'
                                                    }`} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Google Calendar</h3>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    {isGoogleConnected
                                                        ? '✅ Connected - Meeting links auto-generated'
                                                        : '⚠️ Not connected - Click to connect'}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleConnectGoogle}
                                                className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isGoogleConnected
                                                    ? 'bg-green-600 hover:bg-green-700 text-white focus-visible:ring-offset-green-100 dark:focus-visible:ring-offset-gray-800'
                                                    : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:text-white focus-visible:ring-offset-gray-800'
                                                    }`}
                                                aria-label={`${isGoogleConnected ? 'Reconnect' : 'Connect'} Google Calendar`}
                                            >
                                                {isGoogleConnected ? 'Reconnect' : 'Connect'}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'materials' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Subtitle <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Grammar Basics"
                                        value={subtitle}
                                        onChange={e => setSubtitle(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all duration-200 focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 dark:focus:border-[#d6b161]"
                                        aria-label="Subtitle"
                                    />
                                </div>
                            )}

                            {/* Content/Description Field */}
                            {activeTab !== 'classes' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        {activeTab === 'announcements' ? 'Content' : 'Description'}
                                    </label>
                                    <textarea
                                        placeholder={activeTab === 'announcements' ? 'Enter announcement details...' : 'Describe what this material is about...'}
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                        rows={4}
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all duration-200 focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 dark:focus:border-[#d6b161] resize-none"
                                        required
                                        aria-label={activeTab === 'announcements' ? 'Content' : 'Description'}
                                    />
                                </div>
                            )}

                            {/* File Upload Field */}
                            {activeTab === 'materials' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Upload File
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="block w-full text-xs sm:text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-[#d6b161]/10 file:text-[#d6b161] hover:file:bg-[#d6b161]/20 file:cursor-pointer cursor-pointer transition-all"
                                            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                                            aria-label="Upload file"
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                        Supported: PDF, Doc, Images (Max 10MB)
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2 flex-col-reverse sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500/30"
                                    aria-label="Cancel"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-[#d6b161] to-[#c4a055] text-[#0a192f] hover:shadow-lg hover:shadow-[#d6b161]/20 hover:-translate-y-0.5 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b161]/30"
                                    aria-busy={submitting}
                                >
                                    {submitting ? (
                                        <span className="inline-flex items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a192f]/20 border-t-[#0a192f]"></div>
                                            Adding...
                                        </span>
                                    ) : (
                                        activeTab === 'classes' ? 'Schedule Class' : 'Add Item'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Attendance Modal */}
            {attendanceClass && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-300"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Attendance"
                >
                    <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-gray-800 shadow-2xl max-h-[85vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-300">
                        <div className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800 px-6 sm:px-8 py-5 sm:py-6 backdrop-blur-xl">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Attendance</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{attendanceClass.topic}</p>
                                </div>
                                <button
                                    onClick={() => setAttendanceClass(null)}
                                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b161]/30"
                                    aria-label="Close modal"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8">
                            <div className="space-y-3">
                                {(!batch?.students || batch.students.length === 0) && (
                                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No students enrolled.</p>
                                )}

                                {batch?.students.map((student, idx) => {
                                    const isPresent = attendanceClass.attendees.some(a => a.studentId === student._id);
                                    return (
                                        <div
                                            key={student._id}
                                            className="group relative overflow-hidden flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-300 animate-in fade-in slide-in-from-left duration-500"
                                            style={{ animationDelay: `${idx * 30}ms` }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                            <div className="relative z-10 flex items-center gap-3 min-w-0 flex-1">
                                                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm transition-transform group-hover:scale-110 duration-300">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
                                                        {student.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {student.email}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                disabled={attendanceLoading}
                                                onClick={() => handleUpdateAttendance(student._id, !isPresent)}
                                                className={`flex-shrink-0 p-2.5 rounded-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${isPresent
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 focus-visible:ring-green-500/30 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-800'
                                                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-400 dark:hover:bg-gray-500 focus-visible:ring-gray-500/30 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-800'
                                                    }`}
                                                title={isPresent ? "Mark Absent" : "Mark Present"}
                                                aria-label={`Mark ${student.name} as ${isPresent ? 'absent' : 'present'}`}
                                                aria-pressed={isPresent}
                                            >
                                                {isPresent ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Profile Modal */}
            {selectedStudent && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="bg-white dark:bg-[#112240] rounded-2xl shadow-2xl w-full max-w-lg overflow-y-auto animate-in zoom-in-95 fade-in duration-300 relative">
                        <button
                            onClick={() => setSelectedStudent(null)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="p-8">
                            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                                <div className="w-24 h-24 rounded-full bg-[#d6b161] text-[#0a192f] text-4xl font-bold flex items-center justify-center shadow-lg shrink-0">
                                    {selectedStudent.avatar ? (
                                        <img 
                                            src={getAssetUrl(selectedStudent.avatar)} 
                                            alt="Avatar" 
                                            className="w-full h-full rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                                            onClick={() => setIsAvatarFullScreen(true)}
                                            title="Click to view full screen"
                                        />
                                    ) : (
                                        selectedStudent.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="text-center sm:text-left w-full">
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                        {selectedStudent.name}
                                    </h2>
                                    <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                                        <a
                                            href={`mailto:${selectedStudent.email}`}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                        >
                                            <Mail className="w-4 h-4" />
                                            <span className="font-medium text-sm">{selectedStudent.email}</span>
                                        </a>
                                        {selectedStudent.phoneNumber && (
                                            <a
                                                href={`tel:${selectedStudent.phoneNumber}`}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                            >
                                                <Phone className="w-4 h-4" />
                                                <span className="font-medium text-sm">{selectedStudent.phoneNumber}</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Date of Birth */}
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0a192f] border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Date of Birth</span>
                                    </div>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white ml-12">
                                        {selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : "Not Specified"}
                                    </p>
                                </div>

                                {/* Qualification */}
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0a192f] border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                                            <GraduationCap className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Qualification</span>
                                    </div>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white ml-12">
                                        {selectedStudent.qualification || "Not Specified"}
                                    </p>
                                </div>

                                {/* Guardian Info */}
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0a192f] border border-gray-100 dark:border-gray-800 sm:col-span-2">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                                            <UserIcon className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Guardian Information</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-12">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Name</p>
                                            <p className="text-base font-bold text-gray-900 dark:text-white">
                                                {selectedStudent.guardianName || "Not Provided"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Phone</p>
                                            <p className="text-base font-bold text-gray-900 dark:text-white">
                                                {selectedStudent.guardianPhone || "Not Provided"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

            <Footer />
        </div>
    );
};

export default LanguageBatchDetails;