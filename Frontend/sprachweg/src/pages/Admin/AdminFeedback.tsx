import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Image as ImageIcon, X } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';

interface FeedbackItem {
    _id: string;
    name: string;
    email: string;
    problem: string;
    imageUrl?: string;
    createdAt: string;
}

const AdminFeedback: React.FC = () => {
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const fetchFeedbacks = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/feedback`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (data.success) {
                setFeedbacks(data.data);
            } else {
                toast.error(data.message || 'Failed to fetch feedback.');
            }
        } catch (error) {
            console.error('Error fetching feedbacks:', error);
            toast.error('Error loading feedback reports.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const handleMarkAsSolved = async (id: string) => {
        if (!window.confirm("Are you sure you want to mark this as solved? It will be deleted permanently.")) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/feedback/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                toast.success('Feedback marked as solved and removed.');
                setFeedbacks(prev => prev.filter(fb => fb._id !== id));
            } else {
                toast.error(data.message || 'Failed to remove feedback.');
            }
        } catch (error) {
            console.error('Error deleting feedback:', error);
            toast.error('Error marking as solved.');
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[#0a192f] dark:text-white mb-2">Feedback & Error Reports</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Manage user feedback and reported issues.</p>
                </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d6b161]"></div>
                </div>
            ) : feedbacks.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-[#112240] rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-12 text-center"
                >
                    <div className="inline-flex items-center justify-center p-4 bg-green-500/10 rounded-full mb-6">
                        <CheckCircle className="w-16 h-16 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#0a192f] dark:text-white mb-3">All Caught Up!</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">There are no pending feedback or error reports at this time.</p>
                </motion.div>
            ) : (
                <div className="grid gap-6">
                    {feedbacks.map((fb, index) => (
                        <motion.div 
                            key={fb._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white dark:bg-[#112240] rounded-2xl shadow-md hover:shadow-lg transition-all border border-gray-100 dark:border-gray-800 overflow-hidden"
                        >
                            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-[#0a192f] dark:text-white flex items-center gap-2">
                                                <AlertCircle className="w-5 h-5 text-amber-500" />
                                                {fb.name}
                                            </h3>
                                            <a href={`mailto:${fb.email}`} className="text-sm text-[#d6b161] hover:underline">
                                                {fb.email}
                                            </a>
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {new Date(fb.createdAt).toLocaleDateString()} at {new Date(fb.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-100 dark:border-gray-800 mt-2">
                                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{fb.problem}</p>
                                    </div>
                                    
                                    <div className="flex pt-4 mt-2 border-t border-gray-100 dark:border-gray-700">
                                         <button
                                            onClick={() => handleMarkAsSolved(fb._id)}
                                            className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Mark as Solved
                                        </button>
                                    </div>
                                </div>
                                
                                {fb.imageUrl && (
                                    <div className="w-full md:w-64 flex-shrink-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                                        <img 
                                            src={`${API_URL}/api/uploads/${fb.imageUrl}`} 
                                            alt="Screenshot" 
                                            className="max-h-48 rounded object-contain cursor-pointer transition-transform hover:scale-105 shadow-sm"
                                            onClick={() => setSelectedImage(`${API_URL}/api/uploads/${fb.imageUrl}`)}
                                        />
                                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1.5 font-medium">
                                            <ImageIcon className="w-3.5 h-3.5" /> Click to enlarge
                                        </span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Image Modal */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
                        <img 
                            src={selectedImage} 
                            alt="Enlarged screenshot" 
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/10"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button 
                            className="absolute -top-4 -right-4 md:top-4 md:right-4 bg-red-500/90 hover:bg-red-500 text-white rounded-full p-2.5 transition-colors shadow-lg"
                            onClick={() => setSelectedImage(null)}
                            title="Close preview"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
            </div>
        </AdminLayout>
    );
};

export default AdminFeedback;
