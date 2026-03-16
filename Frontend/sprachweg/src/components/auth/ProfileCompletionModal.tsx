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
            progress += Math.random() * 15 + 5; // Increment by 5-20%
            if (progress >= 100) {
                progress = 100;
                if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
                setUploadProgress(100);
                setIsUploading(false);
                setUploadSuccess(true);

                // Auto-hide success notification after 3 seconds
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

        // Reset states
        setImageError(null);
        setUploadSuccess(false);
        setUploadProgress(0);

        // Validate file size
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
            setImageError(`Image size must be less than ${MAX_IMAGE_SIZE_MB} MB. Selected file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.`);
            // Reset file input so the same file can be re-selected after fixing
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Set avatar state for form submission
        setAvatar(file);

        // Generate preview
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
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsDismissed(true);
        if (onClose) onClose();
    };

    if (!isOpen || isDismissed) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-2xl bg-white p-4 sm:p-6 shadow-xl dark:bg-gray-800 relative"
                >
                    <div className="flex items-center justify-between mb-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back
                        </button>
                        
                        {onClose && (
                            <button
                                onClick={handleClose}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Complete Your Profile</h2>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Please provide the following details to continue.
                    </p>

                    {error && (
                        <div className="mt-3 sm:mt-4 rounded-md bg-red-50 p-3 sm:p-4 text-xs sm:text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Profile Image Upload Section */}
                    <div className="mt-4 sm:mt-5 flex flex-col items-center">
                        <div className="relative group">
                            <div
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-100 dark:bg-gray-700 cursor-pointer hover:border-[#d6b161] transition-colors"
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
                                    <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
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
                                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 text-center mt-0.5">
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
                                    className="mt-2 flex items-center gap-1.5 rounded-md bg-green-50 dark:bg-green-900/20 px-3 py-1.5 text-xs text-green-700 dark:text-green-400"
                                >
                                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>Profile image uploaded successfully.</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#d6b161] focus:outline-none focus:ring-[#d6b161] text-xs sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500 shadow-sm text-xs sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
                            />
                        </div>

                        <div>
                            <label htmlFor="phoneNumber" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number <span className="text-red-500">*</span></label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                id="phoneNumber"
                                required
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#d6b161] focus:outline-none focus:ring-[#d6b161] text-xs sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label htmlFor="guardianName" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Guardian Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="guardianName"
                                id="guardianName"
                                required
                                value={formData.guardianName}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#d6b161] focus:outline-none focus:ring-[#d6b161] text-xs sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label htmlFor="guardianPhone" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Guardian Phone Number <span className="text-red-500">*</span></label>
                            <input
                                type="tel"
                                name="guardianPhone"
                                id="guardianPhone"
                                required
                                value={formData.guardianPhone}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#d6b161] focus:outline-none focus:ring-[#d6b161] text-xs sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label htmlFor="dateOfBirth" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                name="dateOfBirth"
                                id="dateOfBirth"
                                required
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#d6b161] focus:outline-none focus:ring-[#d6b161] text-xs sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label htmlFor="qualification" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Highest Educational Qualification <span className="text-red-500">*</span></label>
                            <select
                                name="qualification"
                                id="qualification"
                                required
                                value={formData.qualification}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#d6b161] focus:outline-none focus:ring-[#d6b161] text-xs sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="High School">High School</option>
                                <option value="Diploma">Diploma</option>
                                <option value="Undergraduate">Undergraduate</option>
                                <option value="Postgraduate">Postgraduate</option>
                                <option value="PhD">PhD</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="mt-4 sm:mt-6 flex gap-3">
                            {onClose && (
                                <Button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#d6b161] focus:ring-offset-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 justify-center rounded-md bg-[#d6b161] px-4 py-2 text-xs sm:text-sm font-medium text-[#0a192f] shadow-sm hover:bg-[#c4a055] focus:outline-none focus:ring-2 focus:ring-[#d6b161] focus:ring-offset-2 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save & Continue'}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ProfileCompletionModal;
