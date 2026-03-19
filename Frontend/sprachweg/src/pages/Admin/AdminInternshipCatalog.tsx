import React from 'react';
import { ArrowLeft, BriefcaseBusiness } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import InternshipCatalogManager from '../../components/admin/InternshipCatalogManager';

const AdminInternshipCatalog: React.FC = () => {
    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Link
                            to="/admin-dashboard"
                            className="inline-flex items-center text-sm text-gray-500 hover:text-[#d6b161] mb-2 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            Add Internships
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Create, edit, and manage the internships shown on the careers page.
                        </p>
                    </div>

                    <Link
                        to="/admin/internship-applications"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-[#d6b161] hover:text-[#b38f3f] dark:border-gray-700 dark:bg-[#112240] dark:text-gray-200"
                    >
                        <BriefcaseBusiness className="h-4 w-4" />
                        View Internship Requests
                    </Link>
                </div>

                <InternshipCatalogManager />
            </div>
        </AdminLayout>
    );
};

export default AdminInternshipCatalog;
