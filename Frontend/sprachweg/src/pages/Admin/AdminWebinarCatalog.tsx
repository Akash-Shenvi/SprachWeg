import React from 'react';
import { ArrowLeft, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import WebinarCatalogManager from '../../components/admin/WebinarCatalogManager';

const AdminWebinarCatalog: React.FC = () => {
    return (
        <AdminLayout>
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <Link
                            to="/admin-dashboard"
                            className="mb-2 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-[#d6b161]"
                        >
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                        <h1 className="flex items-center gap-3 text-3xl font-serif font-bold text-gray-900 dark:text-white">
                            <Radio className="h-7 w-7 text-[#d6b161]" />
                            Webinars
                        </h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                            Create and manage live webinars that students can register for online.
                        </p>
                    </div>

                    <Link
                        to="/admin/webinar-registrations"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-[#d6b161] hover:text-[#b38f3f] dark:border-gray-700 dark:bg-[#112240] dark:text-gray-200"
                    >
                        View Webinar Registrations
                    </Link>
                </div>

                <WebinarCatalogManager />
            </div>
        </AdminLayout>
    );
};

export default AdminWebinarCatalog;
