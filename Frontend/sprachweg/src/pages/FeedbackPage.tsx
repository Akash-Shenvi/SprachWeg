import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Loader2, Send, MessageSquareHeart, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const FeedbackPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        problem: ''
    });
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Check file type
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(selectedFile.type)) {
                toast.error('Only JPEG, JPG, and PNG images are allowed.');
                return;
            }
            
            // Check file size (e.g., 5MB limit)
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error('Image size must be less than 5MB.');
                return;
            }

            setFile(selectedFile);
            const url = URL.createObjectURL(selectedFile);
            setPreviewUrl(url);
        }
    };

    const removeFile = () => {
        setFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name || !formData.email || !formData.problem) {
            toast.error('Please fill in all required fields.');
            return;
        }

        setIsLoading(true);

        try {
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('email', formData.email);
            submitData.append('problem', formData.problem);
            if (file) {
                submitData.append('image', file);
            }

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${API_URL}/api/feedback`, {
                method: 'POST',
                body: submitData
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Feedback submitted successfully. Thank you!');
                // Reset form
                setFormData({ name: '', email: '', problem: '' });
                removeFile();
                setIsSuccess(true);
                setTimeout(() => setIsSuccess(false), 3000);
            } else {
                toast.error(data.message || 'Failed to submit feedback.');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            toast.error('An error occurred. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a192f] transition-colors duration-300 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Header Section */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex items-center justify-center p-3 bg-[#d6b161]/10 rounded-full mb-4">
                        <MessageSquareHeart className="w-8 h-8 text-[#d6b161]" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Report an Issue or Feedback
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        We value your feedback! If you encountered any errors or have suggestions to improve our platform, please let us know below.
                    </p>
                </motion.div>

                {/* Main Form Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-[#112240] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                >
                    <div className="p-6 md:p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* Personal Info Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Your Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="John Doe"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent transition-colors"
                                        required
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="john@example.com"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Problem Description */}
                            <div className="space-y-2">
                                <label htmlFor="problem" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Describe the Problem / Feedback <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="problem"
                                    name="problem"
                                    rows={5}
                                    value={formData.problem}
                                    onChange={handleInputChange}
                                    placeholder="Please describe the issue you encountered in detail..."
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent transition-colors resize-y"
                                    required
                                />
                            </div>

                            {/* Image Upload Area */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Screenshot (Optional - Max 1 Image)
                                    </label>
                                    {previewUrl && (
                                        <button
                                            type="button"
                                            onClick={removeFile}
                                            className="text-xs text-red-500 hover:text-red-600 hover:underline flex items-center gap-1"
                                        >
                                            <X className="w-3 h-3" /> Remove image
                                        </button>
                                    )}
                                </div>

                                {!previewUrl ? (
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-[#d6b161] dark:hover:border-[#d6b161] transition-colors group relative cursor-pointer">
                                        <div className="space-y-1 text-center">
                                            <Upload className="mx-auto h-12 w-12 text-gray-400 group-hover:text-[#d6b161] transition-colors" />
                                            <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                                                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-[#d6b161] hover:text-[#c4a055] focus-within:outline-none">
                                                    <span>Upload a file</span>
                                                    <input 
                                                        id="file-upload" 
                                                        name="file-upload" 
                                                        type="file" 
                                                        className="sr-only" 
                                                        accept="image/jpeg,image/png,image/jpg"
                                                        onChange={handleFileChange}
                                                    />
                                                </label>
                                                <p className="pl-1">or drag and drop</p>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                PNG, JPG, JPEG up to 5MB
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 group flex items-center justify-center p-2 h-64">
                                         <img 
                                            src={previewUrl} 
                                            alt="Preview" 
                                            className="max-h-full max-w-full object-contain rounded"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={removeFile}
                                                className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transform hover:scale-110 transition-all"
                                                title="Remove image"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading || isSuccess}
                                    className={`w-full sm:w-auto flex justify-center items-center gap-2 px-8 py-3.5 border border-transparent text-base font-semibold rounded-lg transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed ${
                                        isSuccess 
                                            ? 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500' 
                                            : 'bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] focus:ring-[#d6b161]'
                                    }`}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : isSuccess ? (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Success!
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Submit Feedback
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                                Your feedback helps us improve. We appreciate your time!
                            </p>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default FeedbackPage;
