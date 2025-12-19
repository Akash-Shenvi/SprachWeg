import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import {
    BookOpen,
    Users,
    Calendar,
    Upload
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Batch {
    _id: string;
    courseTitle: string;
    name: string;
    students: any[];
    // Add other fields from backend if needed
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TrainerDashboard: React.FC = () => {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const response = await api.get('/language-trainer/batches');
                setBatches(response.data);
            } catch (error) {
                console.error("Failed to fetch batches", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBatches();
    }, []);

    const handleBatchClick = (batchId: string) => {
        navigate(`/language-batch/${batchId}`);
    };

    // Calculate simple stats
    const totalStudents = batches.reduce((acc, batch) => acc + (batch.students?.length || 0), 0);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <Header />

            <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 rounded-2xl bg-gradient-to-br from-[#0a192f] to-[#112240] p-8 text-white shadow-lg"
                >
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="mb-2 text-3xl font-bold font-serif">Trainer Dashboard</h1>
                            <p className="text-gray-300">Manage your ongoing language classes and materials.</p>
                        </div>

                        <div className="flex gap-8">
                            <div className="text-center">
                                <p className="text-3xl font-bold">{loading ? "..." : batches.length}</p>
                                <p className="text-sm text-gray-400">Active Batches</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold">{loading ? "..." : totalStudents}</p>
                                <p className="text-sm text-gray-400">Total Students</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Batches Grid */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-2xl font-bold text-[#0a192f] dark:text-white">
                            <BookOpen className="h-6 w-6 text-[#d6b161]" />
                            My Batches
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-[#d6b161] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : batches.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-gray-900 dark:text-white">No batches assigned yet.</p>
                            <p className="text-gray-500 dark:text-gray-400">Batches will appear here once an admin assigns them to you.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {batches.map((batch) => (
                                <motion.div
                                    key={batch._id}
                                    whileHover={{ y: -4 }}
                                    className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
                                >
                                    <div className="mb-4">
                                        <h3 className="mb-1 text-xl font-bold text-[#0a192f] dark:text-white line-clamp-1" title={batch.courseTitle}>
                                            {batch.courseTitle}
                                        </h3>
                                        <div className="inline-block rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                                            {batch.name}
                                        </div>
                                    </div>

                                    <div className="mb-6 flex-1 space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Users className="h-4 w-4" />
                                            <span>{batch.students?.length || 0} Students Enrolled</span>
                                        </div>
                                        {/* You could add schedule/time here if backend provides it */}
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Calendar className="h-4 w-4" />
                                            <span>Manage Curriculum</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleBatchClick(batch._id)}
                                        className="w-full rounded-lg bg-[#d6b161] px-4 py-2.5 text-sm font-bold text-[#0a192f] transition-colors hover:bg-[#c4a055] flex items-center justify-center gap-2"
                                    >
                                        <Upload className="h-4 w-4" />
                                        Manage Batch
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default TrainerDashboard;
