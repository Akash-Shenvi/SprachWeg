import React, { useState, useEffect } from 'react';
import { Link, Copy, Trash2, Upload, File as FileIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../lib/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface FileLink {
    _id: string;
    title: string;
    fileUrl: string;
    originalName: string;
    createdAt: string;
}

const AdminFileLinks: React.FC = () => {
    const [files, setFiles] = useState<FileLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    // Form state
    const [title, setTitle] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        fetchFiles();
    }, [currentPage]);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/files?page=${currentPage}&limit=${limit}`);
            setFiles(response.data.files);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error fetching files:', error);
            showToast('Failed to load files', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFiles.length === 0) {
            showToast('Please select at least one file', 'error');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        if (title.trim()) {
            formData.append('title', title.trim());
        }
        selectedFiles.forEach((file) => {
            formData.append('files', file);
        });

        try {
            const response = await api.post('/admin/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            const uploadedCount = response.data.uploadedCount || selectedFiles.length;
            showToast(
                uploadedCount === 1 ? 'File uploaded successfully' : `${uploadedCount} files uploaded successfully`,
                'success'
            );
            setTitle('');
            setSelectedFiles([]);
            // Reset file input
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            
            // Refresh list
            if (currentPage === 1) {
                fetchFiles();
            } else {
                setCurrentPage(1); // Go back to first page to see new file
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            showToast('Upload failed', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this file? The link will no longer work.')) return;

        try {
            await api.delete(`/admin/files/${id}`);
            showToast('File deleted successfully', 'success');
            fetchFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
            showToast('Failed to delete file', 'error');
        }
    };

    const copyToClipboard = (fileUrl: string) => {
        const fullUrl = `${API_BASE_URL.replace('/api', '')}${fileUrl}`;
        navigator.clipboard.writeText(fullUrl).then(() => {
            showToast('Link copied to clipboard', 'success');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            showToast('Failed to copy link', 'error');
        });
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
                
                {toast && (
                    <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {toast.message}
                    </div>
                )}

                <div className="flex justify-between items-center bg-white dark:bg-[#112240] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">File Links Management</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Upload files and generate shareable links</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Upload Form */}
                    <div className="lg:col-span-1 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#112240] rounded-2xl p-6 shadow-sm self-start">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                            <Upload className="w-5 h-5 mr-2 text-orange-500" />
                            Upload Files
                        </h2>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    File Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-[#0a192f] dark:text-white"
                                    placeholder="Optional title or title prefix"
                                />
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    Leave blank to use each file name automatically. If you upload multiple files, this title will be used as a prefix.
                                </p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Files
                                </label>
                                <input
                                    id="file-upload"
                                    type="file"
                                    multiple
                                    onChange={(e) => setSelectedFiles(e.target.files ? Array.from(e.target.files) : [])}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-[#0a192f] dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 dark:file:bg-orange-900/20 dark:file:text-orange-400"
                                    required
                                />
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    You can select and upload multiple files in one go.
                                </p>
                            </div>

                            {selectedFiles.length > 0 && (
                                <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-4 dark:border-orange-900/30 dark:bg-orange-900/10">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                                            {selectedFiles.length} file{selectedFiles.length === 1 ? '' : 's'} selected
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedFiles([]);
                                                const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                                                if (fileInput) fileInput.value = '';
                                            }}
                                            className="text-xs font-medium text-orange-700 hover:text-orange-900 dark:text-orange-300 dark:hover:text-orange-200"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    <div className="mt-3 space-y-2">
                                        {selectedFiles.slice(0, 5).map((file) => (
                                            <div
                                                key={`${file.name}-${file.size}-${file.lastModified}`}
                                                className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm dark:bg-[#112240]"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-gray-900 dark:text-white">{file.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        {selectedFiles.length > 5 && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                +{selectedFiles.length - 5} more file{selectedFiles.length - 5 === 1 ? '' : 's'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                            >
                                {uploading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Uploading...
                                    </span>
                                ) : (
                                    selectedFiles.length > 1 ? `Upload ${selectedFiles.length} Files` : 'Upload File'
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Files List */}
                    <div className="lg:col-span-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#112240] rounded-2xl shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                                <Link className="w-5 h-5 mr-2 text-orange-500" />
                                Managed File Links
                            </h2>
                        </div>
                        
                        <div className="flex-grow overflow-auto p-0">
                            {loading ? (
                                <div className="flex justify-center items-center h-48 text-gray-500">Loading files...</div>
                            ) : files.length === 0 ? (
                                <div className="flex justify-center items-center h-48 text-gray-500 flex-col">
                                    <FileIcon className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-2" />
                                    <p>No files uploaded yet.</p>
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                                    <thead className="bg-gray-50 dark:bg-gray-900">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Details</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-[#112240] divide-y divide-gray-200 dark:divide-gray-800">
                                        {files.map((file) => (
                                            <tr key={file._id} className="hover:bg-gray-50 dark:hover:bg-[#0a192f]/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <FileIcon className="h-6 w-6 text-gray-400 mr-3 flex-shrink-0" />
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{file.title}</div>
                                                            <div className="text-sm text-gray-500 truncate max-w-[200px] sm:max-w-xs">{file.originalName}</div>
                                                            <div className="text-xs text-gray-400 mt-1">{new Date(file.createdAt).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end space-x-3">
                                                        <button 
                                                            onClick={() => copyToClipboard(file.fileUrl)}
                                                            className="text-gray-500 hover:text-orange-500 transition-colors flex items-center bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-md"
                                                        >
                                                            <Copy className="h-4 w-4 mr-1.5" />
                                                            Copy Link
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(file._id)}
                                                            className="text-red-500 hover:text-red-700 transition-colors p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Pagination */}
                        {!loading && files.length > 0 && (
                            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminFileLinks;
