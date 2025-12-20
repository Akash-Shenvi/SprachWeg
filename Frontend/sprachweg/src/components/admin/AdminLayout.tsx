import React, { type ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, LogOut, Menu, X, Users, Edit } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';


interface AdminLayoutProps {
    children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const menuItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/language-enrollment-details', icon: BookOpen, label: 'Language Enrollments' },
        { path: '/admin/language-batches', icon: Users, label: 'Active Classes' },
        { path: '/admin/languages', icon: BookOpen, label: 'Language Courses' },
        { path: '/admin/skills', icon: BookOpen, label: 'Skill Courses' },
        { path: '/admin/skills-details', icon: Edit, label: 'Skill Details' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a192f] flex">
            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#112240] border-r border-gray-200 dark:border-gray-800 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#d6b161] flex items-center justify-center">
                                <span className="font-serif font-bold text-xl text-[#0a192f]">S</span>
                            </div>
                            <div>
                                <h1 className="font-serif font-bold text-lg text-gray-900 dark:text-white">
                                    Admin Panel
                                </h1>
                                <p className="text-xs text-gray-500">SoVir Academy</p>
                            </div>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-[#d6b161]/10 text-[#d6b161]'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#0a192f]'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="lg:hidden bg-white dark:bg-[#112240] border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
                    <h1 className="font-serif font-bold text-lg text-gray-900 dark:text-white">
                        Admin Panel
                    </h1>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-[#0a192f] rounded-lg"
                    >
                        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default AdminLayout;
