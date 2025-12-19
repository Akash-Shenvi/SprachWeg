import React, { useState, useEffect } from 'react';
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
    ArrowLeft
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import api from '../lib/api';

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
    fileUrl?: string; // Optional
    createdAt: string;
}

interface Student {
    _id: string;
    name: string;
    email: string;
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

    // Forms State
    const [showAddModal, setShowAddModal] = useState(false);

    // Add Item State
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [content, setContent] = useState(''); // Used for Announcement Content OR Material Description
    const [classDate, setClassDate] = useState('');
    const [classTime, setClassTime] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);

    // Attendance Modal State
    const [attendanceClass, setAttendanceClass] = useState<LanguageClass | null>(null);
    const [attendanceLoading, setAttendanceLoading] = useState(false);

    const isTrainer = user?.role === 'trainer' || user?._id === batch?.trainerId;

    useEffect(() => {
        fetchBatchDetails();

        // Check if user just returned from Google OAuth
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('googleConnected') === 'true') {
            alert('✅ Google Calendar successfully connected! Meeting links will now be auto-generated.');
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [batchId]);

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

    // Check Google Calendar connection status
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
                // For materials, use FormData to handle file upload
                const formData = new FormData();
                formData.append('batchId', batchId);
                formData.append('title', title);
                formData.append('subtitle', subtitle);
                formData.append('description', content); // 'content' state maps to description
                if (selectedFile) {
                    formData.append('file', selectedFile);
                }

                await api.post('/language-trainer/materials', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }

            // Reset and Refresh
            setShowAddModal(false);
            resetForm();
            fetchBatchDetails();
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
            fetchBatchDetails(); // Refresh
        } catch (error) {
            console.error("Failed to delete announcement", error);
            alert("Failed to delete announcement. Please try again.");
        }
    };

    const handleDeleteMaterial = async (materialId: string) => {
        if (!window.confirm('Are you sure you want to delete this material?')) return;

        try {
            await api.delete(`/language-trainer/materials/${materialId}`);
            fetchBatchDetails(); // Refresh
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
            // Update local state
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
            // Update local state for modal
            setAttendanceClass(prev => prev ? { ...prev, attendees: response.data.attendees } : null);
            // Update main batch state
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
            // Record attendance
            await api.post(`/language-trainer/classes/${classId}/join`);
            window.open(link, '_blank');
        } catch (error) {
            console.error("Failed to join class", error);
            window.open(link, '_blank'); // Open anyway
        }
    };

    const handleConnectGoogle = async () => {
        try {
            // Store current page URL in sessionStorage (more reliable than localStorage for redirects)
            sessionStorage.setItem('googleOAuthReturnUrl', window.location.pathname);
            console.log('Stored return URL:', window.location.pathname);

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

    const getFileUrl = (path?: string) => {
        if (!path) return '#';
        if (path.startsWith('http')) return path;
        // Prepend backend URL if relative path
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        return `${backendUrl}${path}`;
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d6b161] border-t-transparent"></div>
        </div>
    );

    if (!batch) return <div className="p-8 text-center bg-gray-50 dark:bg-gray-900 min-h-screen">Batch not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <Header />
            <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Navigation */}
                <Button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Button>

                {/* Batch Header */}
                <div className="mb-8 rounded-3xl bg-gradient-to-r from-[#0a192f] to-[#112240] p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <FileText className="h-64 w-64" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-4xl font-bold font-serif mb-2">{batch.courseTitle}</h1>
                                <div className="inline-flex items-center rounded-full bg-[#d6b161]/20 px-4 py-1.5 text-sm font-medium text-[#d6b161]">
                                    {batch.name}
                                </div>
                            </div>
                            <div className="text-right hidden sm:block">
                                <p className="text-3xl font-bold">{batch.students?.length || 0}</p>
                                <p className="text-sm text-gray-400">Students Enrolled</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-8 flex space-x-1 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('announcements')}
                        className={`px-6 py-4 text-sm font-medium transition-all relative ${activeTab === 'announcements'
                            ? 'text-[#d6b161]'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        Announcements
                        {activeTab === 'announcements' && (
                            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-[#d6b161]" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('materials')}
                        className={`px-6 py-4 text-sm font-medium transition-all relative ${activeTab === 'materials'
                            ? 'text-[#d6b161]'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        Learning Materials
                        {activeTab === 'materials' && (
                            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-[#d6b161]" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`px-6 py-4 text-sm font-medium transition-all relative ${activeTab === 'students'
                            ? 'text-[#d6b161]'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        Students
                        {activeTab === 'students' && (
                            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-[#d6b161]" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('classes')}
                        className={`px-6 py-4 text-sm font-medium transition-all relative ${activeTab === 'classes'
                            ? 'text-[#d6b161]'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        Live Classes
                        {activeTab === 'classes' && (
                            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-[#d6b161]" />
                        )}
                    </button>
                </div>

                {/* Action Bar */}
                {isTrainer && activeTab !== 'students' && (
                    <div className="mb-6 flex justify-end">
                        <Button
                            onClick={() => { resetForm(); setShowAddModal(true); }}
                            className="flex items-center gap-2 bg-[#d6b161] text-[#0a192f] hover:bg-[#c4a055] px-6 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
                        >
                            <Plus className="h-5 w-5" />
                            <Plus className="h-5 w-5" />
                            Add {activeTab === 'announcements' ? 'Announcement' : activeTab === 'classes' ? 'Class' : 'Material'}
                        </Button>
                    </div>
                )}

                {/* Content Area */}
                <div className="space-y-6">
                    {activeTab === 'classes' ? (
                        <div className="space-y-4">
                            {(!batch.classes || batch.classes.length === 0) && (
                                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                                    <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">No live classes scheduled yet.</p>
                                </div>
                            )}

                            {(batch.classes || []).map((cls) => (
                                <div key={cls._id} className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 rounded-full bg-green-50 p-3 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                                                <Video className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{cls.topic}</h3>
                                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                                                        {new Date(cls.startTime).toLocaleDateString()}
                                                    </span>
                                                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                                                        {new Date(cls.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span>• {cls.attendees?.length || 0} joined</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {cls.status !== 'completed' ? (
                                                <button
                                                    onClick={() => handleJoinClass(cls._id, cls.meetLink)}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition w-full sm:w-auto text-sm"
                                                >
                                                    Join Class
                                                </button>
                                            ) : (
                                                <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-lg font-medium text-sm">
                                                    Class Ended
                                                </span>
                                            )}
                                            {isTrainer && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setAttendanceClass(cls)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                                        title="Attendance"
                                                    >
                                                        <UserCheck className="h-5 w-5" />
                                                    </button>
                                                    {cls.status !== 'completed' && (
                                                        <button
                                                            onClick={() => handleEndClass(cls._id)}
                                                            className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition"
                                                            title="End Class"
                                                        >
                                                            <Ban className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteClass(cls._id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                        title="Delete Class"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {cls.status === 'completed' && (
                                        <div className="absolute top-4 right-4 bg-gray-100 dark:bg-gray-700 text-gray-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                            Completed
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : activeTab === 'announcements' ? (
                        <div className="space-y-4">
                            {(!batch.announcements || batch.announcements.length === 0) && (
                                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                                    <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">No announcements yet.</p>
                                </div>
                            )}

                            {(batch.announcements || []).slice().reverse().map((item) => (
                                <div key={item._id} className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                                    <div className="flex items-start gap-5">
                                        <div className="flex-shrink-0 rounded-full bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                            <Bell className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{item.title}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-lg">
                                                        {new Date(item.createdAt).toLocaleDateString()}
                                                    </span>
                                                    {isTrainer && (
                                                        <button
                                                            onClick={() => handleDeleteAnnouncement(item._id)}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 hover:text-red-600"
                                                            title="Delete announcement"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activeTab === 'materials' ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {(!batch.materials || batch.materials.length === 0) && (
                                <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">No learning materials uploaded yet.</p>
                                </div>
                            )}

                            {(batch.materials || []).slice().reverse().map((item) => (
                                <div key={item._id} className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 dark:border-gray-700 dark:bg-gray-800 relative">
                                    {isTrainer && (
                                        <button
                                            onClick={() => handleDeleteMaterial(item._id)}
                                            className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 hover:text-red-600 shadow-sm"
                                            title="Delete material"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                                            {getFileIcon(item.fileUrl)}
                                        </div>
                                        {item.createdAt && (
                                            <span className="text-xs text-gray-400">
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 mb-4">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-1" title={item.title}>
                                            {item.title}
                                        </h3>
                                        {item.subtitle && (
                                            <p className="text-sm font-medium text-[#d6b161] mb-2">{item.subtitle}</p>
                                        )}
                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                                            {item.description}
                                        </p>
                                    </div>

                                    {item.fileUrl ? (
                                        <a
                                            href={getFileUrl(item.fileUrl)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-gray-50 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                        >
                                            <Download className="h-4 w-4" /> Download File
                                        </a>
                                    ) : (
                                        <div className="mt-auto w-full py-2.5 text-center text-sm text-gray-400 bg-gray-50 rounded-xl dark:bg-gray-700/50">
                                            No file attached
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {(!batch.students || batch.students.length === 0) && (
                                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">No students enrolled yet.</p>
                                </div>
                            )}

                            {(batch.students || []).map((student) => (
                                <div key={student._id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-lg dark:bg-blue-900/20 dark:text-blue-400">
                                            {student.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-lg">{student.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
                                        </div>
                                    </div>
                                    <button className="text-sm font-medium text-gray-400 hover:text-[#d6b161]">
                                        View Profile
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Add Item Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl dark:bg-gray-800 scale-100">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold font-serif dark:text-white">
                                    {activeTab === 'classes' ? 'Schedule Live Class' : `Add ${activeTab === 'announcements' ? 'Announcement' : 'Material'}`}
                                </h2>
                                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleAddItem} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Chapter 1 Notes"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
                                        required
                                    />
                                </div>

                                {activeTab === 'classes' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Date</label>
                                                <input
                                                    type="date"
                                                    value={classDate}
                                                    onChange={e => setClassDate(e.target.value)}
                                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Time</label>
                                                <input
                                                    type="time"
                                                    value={classTime}
                                                    onChange={e => setClassTime(e.target.value)}
                                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Google Calendar Connection Status */}
                                        <div className={`p-4 rounded-xl border ${isGoogleConnected
                                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'
                                            }`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${isGoogleConnected
                                                    ? 'bg-green-100 dark:bg-green-800'
                                                    : 'bg-blue-100 dark:bg-blue-800'
                                                    }`}>
                                                    <Video className={`h-5 w-5 ${isGoogleConnected
                                                        ? 'text-green-600 dark:text-green-300'
                                                        : 'text-blue-600 dark:text-blue-300'
                                                        }`} />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Google Calendar</h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {isGoogleConnected
                                                            ? '✅ Connected - Meeting links auto-generated'
                                                            : 'Not connected - Click to connect'}
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    onClick={handleConnectGoogle}
                                                    className={`text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm ${isGoogleConnected
                                                        ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                                                        : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                                                        }`}
                                                >
                                                    {isGoogleConnected ? 'Reconnect' : 'Connect'}
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {activeTab === 'materials' && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Subtitle <span className="text-gray-400 font-normal">(Optional)</span></label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Grammar Basics"
                                            value={subtitle}
                                            onChange={e => setSubtitle(e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
                                        />
                                    </div>
                                )}

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
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all resize-none"
                                            required
                                        />
                                    </div>
                                )}

                                {activeTab === 'materials' && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Upload File</label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                onChange={handleFileChange}
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#d6b161]/10 file:text-[#d6b161] hover:file:bg-[#d6b161]/20 cursor-pointer"
                                                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-gray-400">Supported: PDF, Doc, Images (Max 10MB)</p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 py-3 rounded-xl font-bold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-[#d6b161] text-[#0a192f] hover:bg-[#c4a055] py-3 rounded-xl font-bold shadow-lg shadow-[#d6b161]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? 'Adding...' : activeTab === 'classes' ? 'Schedule Class' : 'Add Item'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {/* Attendance Modal */}
                {attendanceClass && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl dark:bg-gray-800 scale-100 max-h-[80vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold font-serif dark:text-white">Attendance</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{attendanceClass.topic}</p>
                                </div>
                                <button onClick={() => setAttendanceClass(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {(!batch?.students || batch.students.length === 0) && (
                                    <p className="text-center text-gray-500">No students enrolled.</p>
                                )}

                                {batch?.students.map(student => {
                                    const isPresent = attendanceClass.attendees.some(a => a.studentId === student._id);
                                    return (
                                        <div key={student._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">{student.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{student.email}</p>
                                                </div>
                                            </div>
                                            <button
                                                disabled={attendanceLoading}
                                                onClick={() => handleUpdateAttendance(student._id, !isPresent)}
                                                className={`p-2 rounded-lg transition-colors ${isPresent
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-400'
                                                    }`}
                                                title={isPresent ? "Mark Absent" : "Mark Present"}
                                            >
                                                {isPresent ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div >
    );
};

export default LanguageBatchDetails;
