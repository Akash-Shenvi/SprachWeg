import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

interface ProfileCompletionModalProps {
    isOpen: boolean;
    onClose?: () => void;
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({ isOpen, onClose }) => {
    const { user, updateProfile } = useAuth();
    const [formData, setFormData] = useState({
        phoneNumber: '',
        guardianName: '',
        guardianPhone: '',
        dateOfBirth: '',
        qualification: 'High School',
    });
    const [avatar, setAvatar] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                phoneNumber: user.phoneNumber || '',
                guardianName: user.guardianName || '',
                guardianPhone: user.guardianPhone || '',
                dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
                qualification: user.qualification || 'High School',
            }));
        }
    }, [user, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!avatar) {
            setError('Profile picture is required.');
            setLoading(false);
            return;
        }

        try {
            const submitData = new FormData();
            submitData.append('phoneNumber', formData.phoneNumber);
            submitData.append('guardianName', formData.guardianName);
            submitData.append('guardianPhone', formData.guardianPhone);
            submitData.append('dateOfBirth', formData.dateOfBirth);
            submitData.append('qualification', formData.qualification);
            submitData.append('avatar', avatar);

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

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800 relative"
                >
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Complete Your Profile</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Please provide the following details to continue.
                    </p>

                    {error && (
                        <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Picture <span className="text-red-500">*</span></label>
                            <input
                                type="file"
                                accept="image/*"
                                required
                                onChange={(e) => setAvatar(e.target.files ? e.target.files[0] : null)}
                                className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#d6b161] file:text-[#0a192f] hover:file:bg-[#c4a055] file:cursor-pointer cursor-pointer"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                            <input
                                type="text"
                                value={user?.name || ''}
                                disabled
                                className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
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
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#d6b161] focus:outline-none focus:ring-[#d6b161] sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#d6b161] focus:outline-none focus:ring-[#d6b161] sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#d6b161] focus:outline-none focus:ring-[#d6b161] sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#d6b161] focus:outline-none focus:ring-[#d6b161] sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#d6b161] focus:outline-none focus:ring-[#d6b161] sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="High School">High School</option>
                                <option value="Diploma">Diploma</option>
                                <option value="Undergraduate">Undergraduate</option>
                                <option value="Postgraduate">Postgraduate</option>
                                <option value="PhD">PhD</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="mt-6 flex gap-3">
                            {onClose && (
                                <Button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#d6b161] focus:ring-offset-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 justify-center rounded-md bg-[#d6b161] px-4 py-2 text-sm font-medium text-[#0a192f] shadow-sm hover:bg-[#c4a055] focus:outline-none focus:ring-2 focus:ring-[#d6b161] focus:ring-offset-2 disabled:opacity-50"
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
