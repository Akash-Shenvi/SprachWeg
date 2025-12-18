import React, { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ImageUpload from '../../components/admin/ImageUpload';
import Button from '../../components/ui/Button';
import { Plus, Edit, Trash2, Save, X, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { skillAPI } from '../../lib/api';
import type { SkillCourse } from '../../types/skill';

// ============= Types & Interfaces =============
interface FormErrors {
    [key: string]: string;
}

interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
}

interface DeleteConfirmation {
    isOpen: boolean;
    courseId: string | null;
    courseTitle: string;
}

interface FormData {
    title: string;
    subtitle: string;
    level: string;
    description: string;
    price: string;
    originalPrice: string;
    rating: string;
    students: string;
    duration: string;
    startDate: string;
    mode: string;
    popular: boolean;
    features: string[];
    category: string;
    image: File | null;
    levels: {
        name: string;
        duration: string;
        price: string;
        features: string[];
        outcome: string;
        examPrep?: {
            title: string;
            details: string;
            price: string;
        };
    }[];
}

// ============= Constants =============
const CURRENCY_SYMBOL = '₹';
const INITIAL_FORM_STATE: FormData = {
    title: '',
    subtitle: '',
    level: 'Beginner',
    description: '',
    price: '',
    originalPrice: '',
    rating: '4.5',
    students: '0',
    duration: '',
    startDate: '',
    mode: 'Live',
    popular: false,
    features: [''],
    category: 'General',
    image: null,
    levels: [],
};

// ============= Utility Functions =============
const formatPrice = (value: string | number): string => {
    if (!value) return '';
    const num = parseFloat(String(value).replace(/,/g, ''));
    if (isNaN(num)) return '';
    return `${CURRENCY_SYMBOL}${num.toLocaleString('en-IN')}`;
};

const parsePrice = (value: string): string => {
    return value.replace(/[^\d.]/g, '');
};

const hasFormChanged = (current: FormData, original: FormData): boolean => {
    return JSON.stringify(current) !== JSON.stringify(original);
};

const validateForm = (data: FormData): FormErrors => {
    const errors: FormErrors = {};

    if (!data.title || data.title.trim().length === 0) {
        errors.title = 'Course title is required';
    } else if (data.title.trim().length < 3) {
        errors.title = 'Title must be at least 3 characters';
    } else if (data.title.trim().length > 100) {
        errors.title = 'Title must not exceed 100 characters';
    }

    if (!data.category || data.category.trim().length === 0) {
        errors.category = 'Category is required';
    }

    if (!data.description || data.description.trim().length === 0) {
        errors.description = 'Description is required';
    } else if (data.description.trim().length < 10) {
        errors.description = 'Description must be at least 10 characters';
    } else if (data.description.trim().length > 1000) {
        errors.description = 'Description must not exceed 1000 characters';
    }

    if (data.price && data.price.trim().length > 0) {
        const price = parseFloat(parsePrice(data.price));
        if (isNaN(price) || price < 0) {
            errors.price = 'Please enter a valid price';
        } else if (price > 999999) {
            errors.price = 'Price exceeds maximum limit';
        }
    }

    if (data.originalPrice && data.originalPrice.trim().length > 0) {
        const origPrice = parseFloat(parsePrice(data.originalPrice));
        if (isNaN(origPrice) || origPrice < 0) {
            errors.originalPrice = 'Please enter a valid original price';
        } else if (origPrice > 999999) {
            errors.originalPrice = 'Original price exceeds maximum limit';
        }
        if (data.price) {
            const currentPrice = parseFloat(parsePrice(data.price));
            if (!isNaN(currentPrice) && !isNaN(origPrice) && origPrice < currentPrice) {
                errors.originalPrice = 'Original price should be greater than or equal to current price';
            }
        }
    }

    if (data.rating && data.rating.trim().length > 0) {
        const rating = parseFloat(data.rating);
        if (isNaN(rating) || rating < 0 || rating > 5) {
            errors.rating = 'Rating must be between 0 and 5';
        }
    }

    if (data.students && data.students.trim().length > 0) {
        const students = parseInt(data.students);
        if (isNaN(students) || students < 0) {
            errors.students = 'Students must be a valid positive number';
        }
    }

    return errors;
};

// ============= Toast Component =============
interface ToastDisplayProps {
    toast: Toast;
    onClose: (id: string) => void;
}

const ToastDisplay: React.FC<ToastDisplayProps> = ({ toast, onClose }) => {
    useEffect(() => {
        const duration = toast.duration || 4000;
        const timer = setTimeout(() => onClose(toast.id), duration);
        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onClose]);

    const bgColor = {
        success: 'bg-green-50 dark:bg-green-900/20',
        error: 'bg-red-50 dark:bg-red-900/20',
        warning: 'bg-yellow-50 dark:bg-yellow-900/20',
        info: 'bg-blue-50 dark:bg-blue-900/20',
    }[toast.type];

    const borderColor = {
        success: 'border-green-200 dark:border-green-800',
        error: 'border-red-200 dark:border-red-800',
        warning: 'border-yellow-200 dark:border-yellow-800',
        info: 'border-blue-200 dark:border-blue-800',
    }[toast.type];

    const textColor = {
        success: 'text-green-800 dark:text-green-200',
        error: 'text-red-800 dark:text-red-200',
        warning: 'text-yellow-800 dark:text-yellow-200',
        info: 'text-blue-800 dark:text-blue-200',
    }[toast.type];

    const Icon = {
        success: CheckCircle,
        error: AlertCircle,
        warning: AlertTriangle,
        info: AlertCircle,
    }[toast.type];

    return (
        <div
            className={`${bgColor} ${borderColor} border rounded-lg p-4 mb-3 flex items-center gap-3 animate-slide-in shadow-md`}
            role="alert"
            aria-live="polite"
        >
            <Icon className={`w-5 h-5 flex-shrink-0 ${textColor}`} />
            <span className={`text-sm font-medium ${textColor}`}>{toast.message}</span>
            <button
                onClick={() => onClose(toast.id)}
                className="ml-auto text-xs opacity-70 hover:opacity-100"
                aria-label="Close notification"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

// ============= Delete Confirmation Modal =============
interface DeleteConfirmationModalProps {
    isOpen: boolean;
    courseTitle: string;
    isLoading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    courseTitle,
    isLoading,
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#112240] rounded-2xl shadow-xl max-w-sm w-full p-6 animate-scale-in">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Course?</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Are you sure you want to delete <strong>{courseTitle}</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                    <Button
                        onClick={onCancel}
                        disabled={isLoading}
                        variant="outline"
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

// ============= Loading Skeleton =============
interface SkeletonCardProps {
    count?: number;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ count = 3 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-white dark:bg-[#112240] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
                >
                    <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="p-6 space-y-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
                        <div className="flex justify-between pt-4">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/4" />
                            <div className="flex gap-2">
                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
};

// ============= Empty State Component =============
interface EmptyStateProps {
    onAddClick: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddClick }) => {
    return (
        <div className="text-center py-16 px-6">
            <div className="w-20 h-20 rounded-full bg-[#d6b161]/10 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-10 h-10 text-[#d6b161]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No courses yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Get started by creating your first skill training course. Build comprehensive learning paths for your students.
            </p>
            <Button
                onClick={onAddClick}
                className="bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] inline-flex items-center gap-2"
            >
                <Plus className="w-5 h-5" />
                Create Your First Course
            </Button>
        </div>
    );
};

// ============= Form Error Display =============
interface FieldErrorProps {
    error?: string;
}

const FieldError: React.FC<FieldErrorProps> = ({ error }) => {
    if (!error) return null;
    return (
        <div className="flex items-center gap-1 mt-1 text-red-600 dark:text-red-400 text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            {error}
        </div>
    );
};

// ============= Main Component =============
const SkillDashboard: React.FC = () => {
    const [courses, setCourses] = useState<SkillCourse[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>(INITIAL_FORM_STATE);
    const [originalFormData, setOriginalFormData] = useState<FormData>(INITIAL_FORM_STATE);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
        isOpen: false,
        courseId: null,
        courseTitle: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>('All');
    const [filterLevel, setFilterLevel] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState<string>('');

    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showForm) {
                handleCloseModal();
            }
        };

        if (showForm) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [showForm, formData, originalFormData]);

    useEffect(() => {
        if (showForm && modalRef.current) {
            closeButtonRef.current?.focus();
        }
    }, [showForm]);

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

    const handleOpenForm = (course?: SkillCourse) => {
        if (course) {
            const editData: FormData = {
                title: course.title,
                subtitle: course.subtitle || '',
                level: course.level || 'Beginner',
                description: course.description,
                price: course.price || '',
                originalPrice: course.originalPrice || '',
                rating: course.rating || '4.5',
                students: course.students || '0',
                duration: course.duration || '',
                startDate: course.startDate || '',
                mode: course.mode || 'Live',
                popular: course.popular || false,
                features: course.features?.length > 0 ? course.features : [''],
                category: course.category,
                image: null,
                levels: course.levels || [],
            };
            setFormData(editData);
            setOriginalFormData(editData);
            setEditingId(course._id || null);
        } else {
            setFormData(INITIAL_FORM_STATE);
            setOriginalFormData(INITIAL_FORM_STATE);
            setEditingId(null);
        }
        setFormErrors({});
        setShowForm(true);
    };

    const handleCloseModal = () => {
        if (hasFormChanged(formData, originalFormData)) {
            const confirmed = window.confirm(
                'You have unsaved changes. Are you sure you want to discard them?'
            );
            if (!confirmed) return;
        }
        setShowForm(false);
        resetForm();
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handlePriceInput = (field: 'price' | 'originalPrice', value: string) => {
        const parsed = parsePrice(value);
        handleInputChange(field, parsed);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors = validateForm(formData);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            addToast('Please fix the errors in the form', 'warning');
            return;
        }

        setIsSubmitting(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('subtitle', formData.subtitle);
            formDataToSend.append('level', formData.level);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('price', formData.price);
            formDataToSend.append('originalPrice', formData.originalPrice);
            formDataToSend.append('rating', formData.rating);
            formDataToSend.append('students', formData.students);
            formDataToSend.append('duration', formData.duration);
            formDataToSend.append('startDate', formData.startDate);
            formDataToSend.append('mode', formData.mode);
            formDataToSend.append('popular', String(formData.popular));
            formDataToSend.append('features', JSON.stringify(formData.features.filter(f => f.trim())));
            formDataToSend.append('category', formData.category);
            formDataToSend.append('levels', JSON.stringify(formData.levels));

            if (formData.image) {
                formDataToSend.append('image', formData.image);
            }

            if (editingId) {
                await skillAPI.update(editingId, formDataToSend);
                addToast(`Course "${formData.title}" updated successfully!`, 'success');
            } else {
                await skillAPI.create(formDataToSend);
                addToast(`Course "${formData.title}" created successfully!`, 'success');
            }

            await fetchCourses();
            setShowForm(false);
            resetForm();
        } catch (error) {
            console.error('Error saving course:', error);
            addToast(
                editingId
                    ? 'Failed to update course. Please try again.'
                    : 'Failed to create course. Please try again.',
                'error'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (id: string, title: string) => {
        setDeleteConfirmation({
            isOpen: true,
            courseId: id,
            courseTitle: title,
        });
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirmation.courseId) return;

        setIsDeleting(true);
        try {
            await skillAPI.delete(deleteConfirmation.courseId);
            addToast(`Course "${deleteConfirmation.courseTitle}" deleted successfully!`, 'success');
            await fetchCourses();
        } catch (error) {
            console.error('Error deleting course:', error);
            addToast('Failed to delete course. Please try again.', 'error');
        } finally {
            setIsDeleting(false);
            setDeleteConfirmation({ isOpen: false, courseId: null, courseTitle: '' });
        }
    };

    const resetForm = () => {
        setFormData(INITIAL_FORM_STATE);
        setOriginalFormData(INITIAL_FORM_STATE);
        setEditingId(null);
        setFormErrors({});
    };

    const addFeature = () => {
        setFormData(prev => ({
            ...prev,
            features: [...prev.features, '']
        }));
    };

    const removeFeature = (index: number) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }));
    };

    const updateFeature = (index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.map((f, i) => i === index ? value : f)
        }));
    };

    const addLevel = () => {
        setFormData(prev => ({
            ...prev,
            levels: [...prev.levels, {
                name: '', duration: '', price: '', features: [], outcome: '',
                examPrep: { title: '', details: '', price: '' }
            }]
        }));
    };

    const removeLevel = (index: number) => {
        setFormData(prev => ({
            ...prev,
            levels: prev.levels.filter((_, i) => i !== index)
        }));
    };

    const updateLevel = (index: number, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            levels: prev.levels.map((lvl, i) => i === index ? { ...lvl, [field]: value } : lvl)
        }));
    };

    const updateLevelFeature = (levelIndex: number, featureIndex: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            levels: prev.levels.map((lvl, i) => {
                if (i !== levelIndex) return lvl;
                const newFeatures = [...lvl.features];
                newFeatures[featureIndex] = value;
                return { ...lvl, features: newFeatures };
            })
        }));
    };

    const addLevelFeature = (levelIndex: number) => {
        setFormData(prev => ({
            ...prev,
            levels: prev.levels.map((lvl, i) => i === levelIndex ? { ...lvl, features: [...lvl.features, ''] } : lvl)
        }));
    };

    const removeLevelFeature = (levelIndex: number, featureIndex: number) => {
        setFormData(prev => ({
            ...prev,
            levels: prev.levels.map((lvl, i) => i === levelIndex ? { ...lvl, features: lvl.features.filter((_, fi) => fi !== featureIndex) } : lvl)
        }));
    };

    const getUniqueCategoriesAndLevels = () => {
        const categories = new Set(['All']);
        const levels = new Set(['All']);

        courses.forEach(course => {
            if (course.category) categories.add(course.category);
            if (course.level) levels.add(course.level);
        });

        return {
            categories: Array.from(categories),
            levels: Array.from(levels),
        };
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || course.category === filterCategory;
        const matchesLevel = filterLevel === 'All' || course.level === filterLevel;

        return matchesSearch && matchesCategory && matchesLevel;
    });

    const { categories, levels } = getUniqueCategoriesAndLevels();

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                {/* Toast Container */}
                <div className="fixed top-4 right-4 z-40 w-full max-w-sm">
                    {toasts.map(toast => (
                        <ToastDisplay
                            key={toast.id}
                            toast={toast}
                            onClose={removeToast}
                        />
                    ))}
                </div>

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">
                            Skill Courses
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage your skill training courses
                        </p>
                    </div>
                    <Button
                        onClick={() => handleOpenForm()}
                        className="bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] flex items-center gap-2 transition-colors"
                        aria-label="Add new course"
                    >
                        <Plus className="w-5 h-5" />
                        Add Course
                    </Button>
                </div>

                {/* Filters Section */}
                <div className="mb-8 p-4 bg-white dark:bg-[#112240] rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Search Courses
                            </label>
                            <input
                                type="text"
                                placeholder="Search by title..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent transition-all"
                                aria-label="Search courses"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Category
                            </label>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent transition-all"
                                aria-label="Filter by category"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Level
                            </label>
                            <select
                                value={filterLevel}
                                onChange={(e) => setFilterLevel(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent transition-all"
                                aria-label="Filter by level"
                            >
                                {levels.map(lvl => (
                                    <option key={lvl} value={lvl}>{lvl}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {(searchTerm || filterCategory !== 'All' || filterLevel !== 'All') && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span>Showing {filteredCourses.length} of {courses.length} courses</span>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterCategory('All');
                                    setFilterLevel('All');
                                }}
                                className="text-[#d6b161] hover:text-[#c4a055] font-medium"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                        <div
                            ref={modalRef}
                            className="bg-white dark:bg-[#112240] rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="modal-title"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-[#112240] z-10">
                                <h2 id="modal-title" className="text-2xl font-serif font-bold text-gray-900 dark:text-white">
                                    {editingId ? 'Edit Course' : 'Add New Course'}
                                </h2>
                                <button
                                    ref={closeButtonRef}
                                    onClick={handleCloseModal}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-[#0a192f] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#d6b161]"
                                    aria-label="Close modal"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Form Content */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left Column */}
                                    <div className="space-y-6">
                                        {/* Title Field */}
                                        <div>
                                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Course Title <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="title"
                                                type="text"
                                                required
                                                value={formData.title}
                                                onChange={(e) => handleInputChange('title', e.target.value)}
                                                className={`w-full px-4 py-2 rounded-lg border ${formErrors.title ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent transition-all`}
                                                aria-describedby="title-error"
                                            />
                                            <FieldError error={formErrors.title} />
                                        </div>

                                        {/* Subtitle Field */}
                                        <div>
                                            <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Subtitle
                                            </label>
                                            <input
                                                id="subtitle"
                                                type="text"
                                                value={formData.subtitle}
                                                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent transition-all"
                                                placeholder="e.g. Beginner's Journey"
                                            />
                                        </div>

                                        {/* Level Select */}
                                        <div>
                                            <label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Level
                                            </label>
                                            <select
                                                id="level"
                                                value={formData.level}
                                                onChange={(e) => handleInputChange('level', e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent transition-all"
                                            >
                                                <option value="Beginner">Beginner</option>
                                                <option value="Intermediate">Intermediate</option>
                                                <option value="Advanced">Advanced</option>
                                                <option value="All Levels">All Levels</option>
                                            </select>
                                        </div>

                                        {/* Category Field */}
                                        <div>
                                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Category <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="category"
                                                type="text"
                                                required
                                                value={formData.category}
                                                onChange={(e) => handleInputChange('category', e.target.value)}
                                                className={`w-full px-4 py-2 rounded-lg border ${formErrors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent transition-all`}
                                                placeholder="e.g. Web Development"
                                            />
                                            <FieldError error={formErrors.category} />
                                        </div>

                                        {/* Description Field */}
                                        <div>
                                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Description <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                id="description"
                                                required
                                                value={formData.description}
                                                onChange={(e) => handleInputChange('description', e.target.value)}
                                                rows={4}
                                                className={`w-full px-4 py-2 rounded-lg border ${formErrors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent transition-all`}
                                            />
                                            <FieldError error={formErrors.description} />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {formData.description.length}/1000 characters
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-6">
                                        {/* Price Fields */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Price
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-2 text-gray-600 dark:text-gray-400 font-semibold">
                                                        {CURRENCY_SYMBOL}
                                                    </span>
                                                    <input
                                                        id="price"
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={formData.price}
                                                        onChange={(e) => handlePriceInput('price', e.target.value)}
                                                        className={`w-full pl-7 pr-4 py-2 rounded-lg border ${formErrors.price ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent transition-all`}
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <FieldError error={formErrors.price} />
                                                {formData.price && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        Formatted: {formatPrice(formData.price)}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Original Price
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-2 text-gray-600 dark:text-gray-400 font-semibold">
                                                        {CURRENCY_SYMBOL}
                                                    </span>
                                                    <input
                                                        id="originalPrice"
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={formData.originalPrice}
                                                        onChange={(e) => handlePriceInput('originalPrice', e.target.value)}
                                                        className={`w-full pl-7 pr-4 py-2 rounded-lg border ${formErrors.originalPrice ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent transition-all`}
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <FieldError error={formErrors.originalPrice} />
                                            </div>
                                        </div>

                                        {/* Duration & Start Date */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Duration
                                                </label>
                                                <input
                                                    id="duration"
                                                    type="text"
                                                    value={formData.duration}
                                                    onChange={(e) => handleInputChange('duration', e.target.value)}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent transition-all"
                                                    placeholder="e.g. 8 weeks"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Start Date
                                                </label>
                                                <input
                                                    id="startDate"
                                                    type="date"
                                                    value={formData.startDate}
                                                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* Rating & Students */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="rating" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Rating (0-5)
                                                </label>
                                                <input
                                                    id="rating"
                                                    type="number"
                                                    min="0"
                                                    max="5"
                                                    step="0.1"
                                                    value={formData.rating}
                                                    onChange={(e) => handleInputChange('rating', e.target.value)}
                                                    className={`w-full px-4 py-2 rounded-lg border ${formErrors.rating ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent transition-all`}
                                                />
                                                <FieldError error={formErrors.rating} />
                                            </div>

                                            <div>
                                                <label htmlFor="students" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Enrolled Students
                                                </label>
                                                <input
                                                    id="students"
                                                    type="number"
                                                    min="0"
                                                    value={formData.students}
                                                    onChange={(e) => handleInputChange('students', e.target.value)}
                                                    className={`w-full px-4 py-2 rounded-lg border ${formErrors.students ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent transition-all`}
                                                />
                                                <FieldError error={formErrors.students} />
                                            </div>
                                        </div>

                                        {/* Popular & Mode */}
                                        <div className="flex items-center gap-4 py-2">
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.popular}
                                                    onChange={(e) => handleInputChange('popular', e.target.checked)}
                                                    className="rounded border-gray-300 text-[#d6b161] focus:ring-[#d6b161] cursor-pointer"
                                                />
                                                Mark as Popular
                                            </label>
                                            <div className="flex-1">
                                                <label htmlFor="mode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Mode
                                                </label>
                                                <select
                                                    id="mode"
                                                    value={formData.mode}
                                                    onChange={(e) => handleInputChange('mode', e.target.value)}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent transition-all"
                                                >
                                                    <option value="Live">Live</option>
                                                    <option value="Hybrid">Hybrid</option>
                                                    <option value="Self-Paced">Self-Paced</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Image Upload */}
                                        <ImageUpload
                                            value={formData.image || undefined}
                                            onChange={(file) => handleInputChange('image', file)}
                                        />
                                    </div>
                                </div>

                                {/* Features Section */}
                                <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                        Features/Topics
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                        {formData.features.map((feature, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={feature}
                                                    onChange={(e) => updateFeature(index, e.target.value)}
                                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent transition-all"
                                                    placeholder="Feature name"
                                                    aria-label={`Feature ${index + 1}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeFeature(index)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                                                    aria-label={`Remove feature ${index + 1}`}
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addFeature}
                                        className="text-[#d6b161] hover:text-[#c4a055] text-sm font-medium transition-colors focus:outline-none focus:underline"
                                        aria-label="Add new feature"
                                    >
                                        + Add Feature
                                    </button>
                                </div>

                                {/* Levels Section */}
                                <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="block text-lg font-medium text-gray-900 dark:text-white">
                                            Course Levels / Packages
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addLevel}
                                            className="text-sm bg-[#d6b161]/10 text-[#d6b161] px-3 py-1 rounded-lg hover:bg-[#d6b161]/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[#d6b161]"
                                            aria-label="Add new level"
                                        >
                                            + Add Level
                                        </button>
                                    </div>
                                    <div className="space-y-6">
                                        {formData.levels.map((level, lIndex) => (
                                            <div
                                                key={lIndex}
                                                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 transition-all hover:shadow-md"
                                            >
                                                <div className="flex justify-between mb-4">
                                                    <h4 className="font-bold text-gray-900 dark:text-white">
                                                        Level {lIndex + 1}
                                                    </h4>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeLevel(lIndex)}
                                                        className="text-red-500 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
                                                        aria-label={`Remove level ${lIndex + 1}`}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <input
                                                            type="text"
                                                            placeholder="Name (e.g. Beginner/N5)"
                                                            value={level.name}
                                                            onChange={(e) => updateLevel(lIndex, 'name', e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#0a192f] dark:text-white focus:ring-2 focus:ring-[#d6b161] transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="text"
                                                            placeholder="Duration (e.g. 40 Hours)"
                                                            value={level.duration}
                                                            onChange={(e) => updateLevel(lIndex, 'duration', e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#0a192f] dark:text-white focus:ring-2 focus:ring-[#d6b161] transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-2 text-gray-600 dark:text-gray-400 text-sm font-semibold">
                                                                {CURRENCY_SYMBOL}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                placeholder="Price (e.g. 9999)"
                                                                value={level.price}
                                                                onChange={(e) => updateLevel(lIndex, 'price', parsePrice(e.target.value))}
                                                                className="w-full pl-6 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#0a192f] dark:text-white focus:ring-2 focus:ring-[#d6b161] transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="text"
                                                            placeholder="Outcome"
                                                            value={level.outcome}
                                                            onChange={(e) => updateLevel(lIndex, 'outcome', e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#0a192f] dark:text-white focus:ring-2 focus:ring-[#d6b161] transition-all"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Level Features */}
                                                <div className="mb-4 p-3 bg-white dark:bg-[#112240] rounded-lg border border-gray-200 dark:border-gray-700">
                                                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-3">
                                                        Features for this Level
                                                    </label>
                                                    <div className="space-y-2 mb-3">
                                                        {level.features.map((feat, fIndex) => (
                                                            <div key={fIndex} className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={feat}
                                                                    onChange={(e) => updateLevelFeature(lIndex, fIndex, e.target.value)}
                                                                    className="flex-1 px-3 py-1 rounded bg-gray-50 dark:bg-[#0a192f] border border-gray-300 dark:border-gray-600 text-sm dark:text-white focus:ring-2 focus:ring-[#d6b161] transition-all"
                                                                    placeholder="Feature"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeLevelFeature(lIndex, fIndex)}
                                                                    className="text-red-400 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => addLevelFeature(lIndex)}
                                                        className="text-xs text-[#d6b161] font-semibold hover:text-[#c4a055] transition-colors focus:outline-none focus:underline"
                                                    >
                                                        + Add Feature
                                                    </button>
                                                </div>

                                                {/* Exam Prep Optional */}
                                                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                                    <label className="text-xs font-semibold text-gray-500 uppercase mb-3 block">
                                                        Exam Prep Add-on (Optional)
                                                    </label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Title"
                                                            value={level.examPrep?.title || ''}
                                                            onChange={(e) => updateLevel(lIndex, 'examPrep', { ...level.examPrep, title: e.target.value })}
                                                            className="px-3 py-1 rounded bg-white dark:bg-[#112240] border border-gray-300 dark:border-gray-600 text-sm dark:text-white focus:ring-2 focus:ring-[#d6b161] transition-all"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Details"
                                                            value={level.examPrep?.details || ''}
                                                            onChange={(e) => updateLevel(lIndex, 'examPrep', { ...level.examPrep, details: e.target.value })}
                                                            className="px-3 py-1 rounded bg-white dark:bg-[#112240] border border-gray-300 dark:border-gray-600 text-sm dark:text-white focus:ring-2 focus:ring-[#d6b161] transition-all"
                                                        />
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1 text-gray-600 dark:text-gray-400 text-xs font-semibold">
                                                                {CURRENCY_SYMBOL}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                placeholder="Add-on Price"
                                                                value={level.examPrep?.price || ''}
                                                                onChange={(e) => updateLevel(lIndex, 'examPrep', { ...level.examPrep, price: parsePrice(e.target.value) })}
                                                                className="w-full pl-6 pr-3 py-1 rounded bg-white dark:bg-[#112240] border border-gray-300 dark:border-gray-600 text-sm dark:text-white focus:ring-2 focus:ring-[#d6b161] transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-busy={isSubmitting}
                                    >
                                        <Save className="w-5 h-5" />
                                        {isSubmitting ? 'Saving...' : editingId ? 'Update Course' : 'Create Course'}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleCloseModal}
                                        disabled={isSubmitting}
                                        variant="outline"
                                        className="flex-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                <DeleteConfirmationModal
                    isOpen={deleteConfirmation.isOpen}
                    courseTitle={deleteConfirmation.courseTitle}
                    isLoading={isDeleting}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setDeleteConfirmation({ isOpen: false, courseId: null, courseTitle: '' })}
                />

                {/* Courses Grid */}
                {loading && !showForm ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <SkeletonCard count={6} />
                    </div>
                ) : filteredCourses.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((course) => (
                            <div
                                key={course._id}
                                className="bg-white dark:bg-[#112240] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden group hover:shadow-lg transition-all duration-300 hover:border-[#d6b161]/50 animate-fade-in"
                            >
                                {course.image && (
                                    <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
                                        <img
                                            src={`http://localhost:5000/uploads/${course.image}`}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                        {course.popular && (
                                            <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                                                Popular
                                            </div>
                                        )}
                                        {course.level && (
                                            <div className="absolute top-4 right-4 bg-[#d6b161] text-[#0a192f] text-xs font-bold px-3 py-1 rounded-full shadow-md">
                                                {course.level}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-[#d6b161] text-sm font-semibold">{course.category}</div>
                                        {course.rating && (
                                            <div className="flex items-center gap-1 text-sm text-yellow-500 font-semibold">
                                                ★ {Number(course.rating).toFixed(1)}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                                        {course.title}
                                    </h3>
                                    {course.subtitle && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
                                            {course.subtitle}
                                        </p>
                                    )}

                                    <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        {course.duration && <span>⏱️ {course.duration}</span>}
                                        {course.mode && <span>📍 {course.mode}</span>}
                                    </div>

                                    {course.students && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                            👥 {course.students} students enrolled
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex flex-col">
                                            {course.originalPrice && (
                                                <span className="text-xs text-gray-400 line-through">
                                                    {formatPrice(course.originalPrice)}
                                                </span>
                                            )}
                                            <span className="text-lg font-bold text-[#0a192f] dark:text-white">
                                                {course.price ? formatPrice(course.price) : 'Free'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleOpenForm(course)}
                                                className="p-2 bg-[#d6b161]/10 text-[#d6b161] rounded-lg hover:bg-[#d6b161]/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[#d6b161]"
                                                aria-label={`Edit ${course.title}`}
                                                title="Edit course"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(course._id!, course.title)}
                                                className="p-2 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                                                aria-label={`Delete ${course.title}`}
                                                title="Delete course"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState onAddClick={() => handleOpenForm()} />
                )}
            </div>
        </AdminLayout>
    );
};

export default SkillDashboard;