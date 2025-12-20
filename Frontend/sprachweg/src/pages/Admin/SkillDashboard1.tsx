import React, { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Button from '../../components/ui/Button';
import { Edit, X } from 'lucide-react';
import { skillAPI, skillTrainingDetailAPI } from '../../lib/api';
import type { SkillCourse } from '../../types/skill';

// ============= Types & Interfaces =============


interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
}

interface FormData {
    title: string; // Read-only for context
    duration: string;
    deliveryMode: string;
    classTimings: string;
    fees: string;
}

// ============= Constants =============
const INITIAL_FORM_STATE: FormData = {
    title: '',
    duration: '',
    deliveryMode: '',
    classTimings: '',
    fees: '',
};

const SkillDashboard1: React.FC = () => {
    const [courses, setCourses] = useState<SkillCourse[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>(INITIAL_FORM_STATE);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // ============= Effects =============
    useEffect(() => {
        fetchCourses();
    }, []);

    // ============= Actions =============
    const fetchCourses = async () => {
        try {
            setLoading(true);
            const data = await skillAPI.getAll();
            setCourses(data);
        } catch (error) {
            console.error('Error fetching courses:', error);
            addToast('Failed to load courses. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 4000) => {
        const id = Date.now().toString();
        const newToast: Toast = { id, type, message, duration };
        setToasts(prev => [newToast, ...prev]);
    };

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const handleOpenForm = async (course: SkillCourse) => {
        setEditingId(course._id || null);

        let details = {
            deliveryMode: 'Online / Offline / Hybrid',
            classTimings: 'Mon, Wed, Fri - 6 PM to 9 PM',
            fees: '₹7200 to ₹13800'
        };

        // Fetch existing flexible details if editing
        if (course._id) {
            try {
                const apiDetails = await skillTrainingDetailAPI.get(course._id);
                if (apiDetails) {
                    details = {
                        deliveryMode: apiDetails.deliveryMode || details.deliveryMode,
                        classTimings: apiDetails.classTimings || details.classTimings,
                        fees: apiDetails.fees || details.fees
                    };
                }
            } catch (error) {
                console.error('Error fetching details', error);
            }
        }

        setFormData({
            title: course.title,
            duration: course.duration || '40 hours (5 weeks)',
            ...details
        });

        setShowForm(true);
    };

    const handleCloseModal = () => {
        setShowForm(false);
        setFormData(INITIAL_FORM_STATE);
        setEditingId(null);
    };

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId) return;

        setIsSubmitting(true);

        try {
            // Update Duration in standard Course API
            // We need to send a FormData object or JSON depending on the API. 
            // skillAPI.update uses standard FormData based on previous file.
            // But here we only want to update duration.
            // Let's assume we can fetch the full course, update duration, and send it back, 
            // OR just send the fields we want if the backend supports partial updates.
            // The previous controller code seemed to check individual fields: "if (duration) course.duration = duration;"
            // So we can send just the fields we want? 
            // Wait, previous file used `formDataToSend.append`.

            const formDataToSend = new FormData();
            formDataToSend.append('duration', formData.duration);
            // We might need to send other required fields if backend validation fails, 
            // but let's try sending just duration first as per controller logic.
            // Actually, backend controller for `updateCourse` does validation?
            // "if (title) course.title = title;" -> It handles partial updates! Great.

            await skillAPI.update(editingId, formDataToSend);

            // Update Flexible Details
            await skillTrainingDetailAPI.update({
                skillCourseId: editingId,
                deliveryMode: formData.deliveryMode,
                classTimings: formData.classTimings,
                fees: formData.fees
            });

            addToast(`Details for "${formData.title}" updated successfully!`, 'success');
            await fetchCourses(); // Refresh list to show new duration
            handleCloseModal();

        } catch (error) {
            console.error('Error saving details:', error);
            addToast('Failed to save details. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AdminLayout>
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white transform transition-all duration-300 animate-slide-in ${toast.type === 'success' ? 'bg-green-600' :
                            toast.type === 'error' ? 'bg-red-600' :
                                toast.type === 'warning' ? 'bg-yellow-600' : 'bg-blue-600'
                            }`}
                    >
                        {toast.type === 'success' && <div className="w-2 h-2 rounded-full bg-white" />}
                        {toast.type === 'error' && <div className="w-2 h-2 rounded-full bg-white" />}
                        <p className="text-sm font-medium">{toast.message}</p>
                        <button onClick={() => removeToast(toast.id)} className="ml-4 hover:opacity-80">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-2">
                            Skill Training Details
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Manage Duration, Timings, Mode, and Fees for Skill Courses
                        </p>
                    </div>
                </div>

                {/* Courses List */}
                <div className="grid gap-6">
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading courses...</div>
                    ) : (
                        courses.map(course => (
                            <div key={course._id} className="bg-white dark:bg-[#112240] rounded-xl p-6 border border-gray-200 dark:border-gray-800 flex justify-between items-center hover:shadow-lg transition-all">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{course.title}</h3>
                                    <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
                                        <span>⏱️ {course.duration || 'Not set'}</span>
                                        {/* We can't easily show flexible details here without fetching them for ALL courses, 
                                            which might be N+1 requests. For now, rely on Edit to see them. 
                                            Or fetching in the Edit modal is fine. */}
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleOpenForm(course)}
                                    className="bg-[#d6b161] text-[#0a192f] hover:bg-[#c4a055]"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Details
                                </Button>
                            </div>
                        ))
                    )}
                </div>

                {/* Edit Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                        <div
                            ref={modalRef}
                            className="bg-white dark:bg-[#112240] rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-slide-up"
                        >
                            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#0a192f]">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Edit: {formData.title}
                                </h2>
                                <button
                                    ref={closeButtonRef}
                                    onClick={handleCloseModal}
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-[#112240] rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 dark:text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Duration */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Duration
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.duration}
                                        onChange={e => handleInputChange('duration', e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161]"
                                        placeholder="e.g. 40 hours (5 weeks)"
                                    />
                                </div>

                                {/* Delivery Mode */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Delivery Mode
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.deliveryMode}
                                        onChange={e => handleInputChange('deliveryMode', e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161]"
                                        placeholder="e.g. Online / Offline / Hybrid"
                                    />
                                </div>

                                {/* Class Timings */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Class Timings
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.classTimings}
                                        onChange={e => handleInputChange('classTimings', e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161]"
                                        placeholder="e.g. Mon, Wed, Fri - 6 PM to 9 PM"
                                    />
                                </div>

                                {/* Fees */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Fees
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.fees}
                                        onChange={e => handleInputChange('fees', e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161]"
                                        placeholder="e.g. ₹7200 to ₹13800"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCloseModal}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-[#d6b161] text-[#0a192f] hover:bg-[#c4a055]"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save Details'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default SkillDashboard1;
