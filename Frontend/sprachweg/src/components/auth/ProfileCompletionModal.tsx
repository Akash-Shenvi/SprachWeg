import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { getAssetUrl } from '../../lib/api';

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

interface ProfileCompletionModalProps {
    isOpen: boolean;
    onClose?: () => void;
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({ isOpen, onClose }) => {
    const { user, updateProfile } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: '',
        guardianName: '',
        guardianPhone: '',
        dateOfBirth: '',
        qualification: 'High School',
    });
    const [avatar, setAvatar] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Profile image states
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Drag constraint ref for draggable modal
    const constraintRef = useRef<HTMLDivElement>(null);

    // Responsive breakpoint detection
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkBreakpoint = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkBreakpoint();
        window.addEventListener('resize', checkBreakpoint);
        return () => window.removeEventListener('resize', checkBreakpoint);
    }, []);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                phoneNumber: user.phoneNumber || '',
                guardianName: user.guardianName || '',
                guardianPhone: user.guardianPhone || '',
                dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
                qualification: user.qualification || 'High School',
            }));
        }
    }, [user, isOpen]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
            if (successTimerRef.current) clearTimeout(successTimerRef.current);
        };
    }, []);

    const simulateUpload = useCallback(() => {
        setIsUploading(true);
        setUploadProgress(0);
        setUploadSuccess(false);

        // Clear any existing timers
        if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
        if (successTimerRef.current) clearTimeout(successTimerRef.current);

        let progress = 0;
        uploadTimerRef.current = setInterval(() => {
            progress += Math.random() * 15 + 5;
            if (progress >= 100) {
                progress = 100;
                if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
                setUploadProgress(100);
                setIsUploading(false);
                setUploadSuccess(true);

                successTimerRef.current = setTimeout(() => {
                    setUploadSuccess(false);
                }, 3000);
            } else {
                setUploadProgress(Math.round(progress));
            }
        }, 200);
    }, []);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageError(null);
        setUploadSuccess(false);
        setUploadProgress(0);

        if (file.size > MAX_IMAGE_SIZE_BYTES) {
            setImageError(`Image size must be less than ${MAX_IMAGE_SIZE_MB} MB. Selected file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setAvatar(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
            simulateUpload();
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setAvatar(null);
        setImagePreview(null);
        setImageError(null);
        setUploadProgress(0);
        setIsUploading(false);
        setUploadSuccess(false);
        if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
        if (successTimerRef.current) clearTimeout(successTimerRef.current);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!avatar && !user?.avatar) {
            setError('Profile picture is required.');
            setLoading(false);
            return;
        }

        try {
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('phoneNumber', formData.phoneNumber);
            submitData.append('guardianName', formData.guardianName);
            submitData.append('guardianPhone', formData.guardianPhone);
            submitData.append('dateOfBirth', formData.dateOfBirth);
            submitData.append('qualification', formData.qualification);
            if (avatar) {
                submitData.append('avatar', avatar);
            }

            await updateProfile(submitData);
            if (onClose) {
                onClose();
            }
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsDismissed(true);
        if (onClose) onClose();
    };

    if (!isOpen || isDismissed) return null;

    // Input field classes (shared)
    const inputClasses = "mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 shadow-sm focus:border-[#d6b161] focus:outline-none focus:ring-1 focus:ring-[#d6b161] text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors";

    return (
        <AnimatePresence>
            {/* Full-screen backdrop + drag constraint container */}
            <div
                ref={constraintRef}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    drag={!isMobile}
                    dragConstraints={constraintRef}
                    dragElastic={0.05}
                    dragMomentum={false}
                    className={`
                        flex flex-col bg-white dark:bg-gray-800 shadow-2xl
                        ${isMobile
                            ? 'w-full h-full rounded-none'
                            : 'w-[85vw] md:w-[480px] max-h-[90vh] rounded-2xl'
                        }
                    `}
                >
                    {/* ═══════════ STICKY HEADER — never scrolls ═══════════ */}
                    <div className={`flex-shrink-0 px-5 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4 border-b border-gray-200 dark:border-gray-700 ${!isMobile ? 'cursor-grab active:cursor-grabbing' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </button>

                            {onClose && (
                                <button
                                    onClick={handleClose}
                                    className="p-1 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Complete Your Profile</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Please provide the following details to continue.
                        </p>
                    </div>

                    {/* ═══════════ SCROLLABLE BODY — all form fields ═══════════ */}
                    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-5 py-4 sm:px-6 sm:py-5">
                        {error && (
                            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30">
                                {error}
                            </div>
                        )}

                        {/* Profile Image Upload Section */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative group">
                                <div
                                    className="w-22 h-22 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-700 cursor-pointer hover:border-[#d6b161] dark:hover:border-[#d6b161] transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Profile preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : user?.avatar ? (
                                        <img
                                            src={getAssetUrl(user.avatar)}
                                            alt="Current Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500" />
                                    )}
                                </div>
                                {imagePreview && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                                id="profile-image-upload"
                            />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Upload profile photo (max {MAX_IMAGE_SIZE_MB} MB)
                            </p>

                            {/* Image validation error */}
                            {imageError && (
                                <p className="mt-1 text-xs text-red-600 dark:text-red-400 text-center">
                                    {imageError}
                                </p>
                            )}

                            {/* Upload progress bar */}
                            {(isUploading || uploadProgress > 0) && !imageError && imagePreview && (
                                <div className="w-full max-w-[200px] mt-2">
                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full bg-[#d6b161]"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${uploadProgress}%` }}
                                            transition={{ duration: 0.2, ease: 'easeOut' }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                                        {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Upload complete'}
                                    </p>
                                </div>
                            )}

                            {/* Upload success notification */}
                            <AnimatePresence>
                                {uploadSuccess && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="mt-2 flex items-center gap-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 px-3 py-1.5 text-xs text-green-700 dark:text-green-400"
                                    >
                                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>Profile image uploaded successfully.</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Form Fields */}
                        <form id="profile-form" onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400 shadow-sm cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number <span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    id="phoneNumber"
                                    required
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label htmlFor="guardianName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Guardian Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="guardianName"
                                    id="guardianName"
                                    required
                                    value={formData.guardianName}
                                    onChange={handleChange}
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label htmlFor="guardianPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Guardian Phone Number <span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    name="guardianPhone"
                                    id="guardianPhone"
                                    required
                                    value={formData.guardianPhone}
                                    onChange={handleChange}
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    id="dateOfBirth"
                                    required
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label htmlFor="qualification" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Highest Educational Qualification <span className="text-red-500">*</span></label>
                                <select
                                    name="qualification"
                                    id="qualification"
                                    required
                                    value={formData.qualification}
                                    onChange={handleChange}
                                    className={inputClasses}
                                >
                                    <option value="High School">High School</option>
                                    <option value="Diploma">Diploma</option>
                                    <option value="Undergraduate">Undergraduate</option>
                                    <option value="Postgraduate">Postgraduate</option>
                                    <option value="PhD">PhD</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </form>
                    </div>

                    {/* ═══════════ STICKY FOOTER — always visible ═══════════ */}
                    <div className="flex-shrink-0 px-5 py-4 sm:px-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 rounded-b-2xl">
                        <div className="flex gap-3">
                            {onClose && (
                                <Button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-[#d6b161] focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors min-h-[48px]"
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button
                                type="submit"
                                form="profile-form"
                                disabled={loading}
                                className="flex-1 justify-center rounded-lg bg-[#d6b161] px-4 py-2.5 text-sm font-semibold text-[#0a192f] shadow-sm hover:bg-[#c4a055] focus:outline-none focus:ring-2 focus:ring-[#d6b161] focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 transition-colors min-h-[48px]"
                            >
                                {loading ? 'Saving...' : 'Save & Continue'}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ProfileCompletionModal;
