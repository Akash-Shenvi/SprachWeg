// Header.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, ChevronDown } from 'lucide-react';
import Button from '../ui/Button';
import { useTheme } from '../../context/ThemeContext';

const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const { theme, toggleTheme } = useTheme();

    const toggleDropdown = (dropdown: string) => {
        setOpenDropdown(openDropdown === dropdown ? null : dropdown);
    };

    return (
        <nav className="fixed w-full z-50 bg-white/90 dark:bg-[#0a192f]/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-[#d6b161] flex items-center justify-center flex-shrink-0">
                            <span className="font-serif font-bold text-lg text-[#0a192f]">S</span>
                        </div>
                        <span className="font-serif font-bold text-base lg:text-lg text-gray-900 dark:text-white">SoVir Akademie</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-1">
                        <Link
                            to="/"
                            className="text-gray-700 dark:text-gray-300 hover:text-[#d6b161] font-medium transition-colors text-sm px-3 py-2"
                        >
                            Home
                        </Link>

                        {/* Language Training Dropdown */}
                        <div className="relative group">
                            <Link
                                to="/language-training"
                                className="text-gray-700 dark:text-gray-300 hover:text-[#d6b161] font-medium transition-colors text-sm px-3 py-2 flex items-center gap-1"
                            >
                                Language Training
                                <ChevronDown className="w-4 h-4" />
                            </Link>
                            <div className="absolute left-0 mt-0 w-48 bg-white dark:bg-[#0a192f] border border-gray-100 dark:border-gray-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                <Link to="/training/english" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-[#d6b161] text-sm">English Training</Link>
                                <Link to="/training/german" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-[#d6b161] text-sm">German Training</Link>
                                <Link to="/training/japanese" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-[#d6b161] text-sm">Japanese Training</Link>
                                <Link to="/language-training" className="block px-4 py-2 text-[#d6b161] font-medium text-sm border-t border-gray-100 dark:border-gray-800">View All Languages →</Link>
                            </div>
                        </div>

                        {/* Skill Training Dropdown */}
                        <div className="relative group">
                            <button className="text-gray-700 dark:text-gray-300 hover:text-[#d6b161] font-medium transition-colors text-sm px-3 py-2 flex items-center gap-1">
                                Skill Training
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            <div className="absolute left-0 mt-0 w-48 bg-white dark:bg-[#0a192f] border border-gray-100 dark:border-gray-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                <Link to="#" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-[#d6b161] text-sm">Web Development</Link>
                                <Link to="#" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-[#d6b161] text-sm">Mobile Development</Link>
                                <Link to="#" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-[#d6b161] text-sm">Data Science</Link>
                                <Link to="#" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-[#d6b161] text-sm">Cloud Computing</Link>
                            </div>
                        </div>

                        {/* Career Abroad Dropdown */}
                        <div className="relative group">
                            <button className="text-gray-700 dark:text-gray-300 hover:text-[#d6b161] font-medium transition-colors text-sm px-3 py-2 flex items-center gap-1">
                                Career Abroad
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            <div className="absolute left-0 mt-0 w-48 bg-white dark:bg-[#0a192f] border border-gray-100 dark:border-gray-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                <Link to="#" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-[#d6b161] text-sm">Work in Canada</Link>
                                <Link to="#" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-[#d6b161] text-sm">Career in Germany</Link>
                                <Link to="#" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-[#d6b161] text-sm">Jobs in Australia</Link>
                                <Link to="#" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-[#d6b161] text-sm">Visa Assistance</Link>
                                <Link to="#" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-[#d6b161] text-sm">Job Placement</Link>
                            </div>
                        </div>

                        <Link
                            to="#"
                            className="text-gray-700 dark:text-gray-300 hover:text-[#d6b161] font-medium transition-colors text-sm px-3 py-2"
                        >
                            About
                        </Link>
                        <Link
                            to="#"
                            className="text-gray-700 dark:text-gray-300 hover:text-[#d6b161] font-medium transition-colors text-sm px-3 py-2"
                        >
                            Contact
                        </Link>
                    </div>

                    {/* Right Area */}
                    <div className="hidden lg:flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-yellow-400 transition-colors"
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <Link to="/login" className="text-gray-700 dark:text-white font-medium hover:text-[#d6b161] transition-colors text-sm">
                            Sign In
                        </Link>
                        <Link to="/register">
                            <Button className="bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] font-semibold px-6 py-2 rounded-full text-sm">
                                Enroll Now
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden flex items-center gap-3">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-yellow-400"
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-700 dark:text-white p-2"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden bg-white dark:bg-[#0a192f] border-t border-gray-100 dark:border-gray-800"
                    >
                        <div className="px-4 py-4 space-y-2">
                            <Link to="/" className="block text-gray-700 dark:text-gray-300 font-medium py-2 text-sm" onClick={() => setIsMenuOpen(false)}>Home</Link>

                            <Link
                                to="/language-training"
                                className="w-full text-left text-gray-700 dark:text-gray-300 font-medium py-2 text-sm flex items-center justify-between"
                                onClick={() => { toggleDropdown('language'); }}
                            >
                                Language Training
                                <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'language' ? 'rotate-180' : ''}`} />
                            </Link>
                            {openDropdown === 'language' && (
                                <div className="bg-gray-50 dark:bg-white/5 rounded pl-4 space-y-1">
                                    <Link to="/language-details/english" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>English Training</Link>
                                    <Link to="/language-details/german" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>German Training</Link>
                                    <Link to="/language-details/japanese" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>Japanese Training</Link>
                                    <Link to="/language-training" className="block text-[#d6b161] font-medium py-1 text-xs" onClick={() => setIsMenuOpen(false)}>View All Languages →</Link>
                                </div>
                            )}

                            <button
                                onClick={() => toggleDropdown('skill')}
                                className="w-full text-left text-gray-700 dark:text-gray-300 font-medium py-2 text-sm flex items-center justify-between"
                            >
                                Skill Training
                                <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'skill' ? 'rotate-180' : ''}`} />
                            </button>
                            {openDropdown === 'skill' && (
                                <div className="bg-gray-50 dark:bg-white/5 rounded pl-4 space-y-1">
                                    <Link to="#" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>Web Development</Link>
                                    <Link to="#" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>Mobile Development</Link>
                                    <Link to="#" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>Data Science</Link>
                                    <Link to="#" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>Cloud Computing</Link>
                                </div>
                            )}

                            <button
                                onClick={() => toggleDropdown('career')}
                                className="w-full text-left text-gray-700 dark:text-gray-300 font-medium py-2 text-sm flex items-center justify-between"
                            >
                                Career Abroad
                                <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'career' ? 'rotate-180' : ''}`} />
                            </button>
                            {openDropdown === 'career' && (
                                <div className="bg-gray-50 dark:bg-white/5 rounded pl-4 space-y-1">
                                    <Link to="#" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>Work in Canada</Link>
                                    <Link to="#" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>Career in Germany</Link>
                                    <Link to="#" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>Jobs in Australia</Link>
                                    <Link to="#" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>Visa Assistance</Link>
                                    <Link to="#" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>Job Placement</Link>
                                </div>
                            )}

                            <Link to="#" className="block text-gray-700 dark:text-gray-300 font-medium py-2 text-sm" onClick={() => setIsMenuOpen(false)}>About</Link>
                            <Link to="#" className="block text-gray-700 dark:text-gray-300 font-medium py-2 text-sm" onClick={() => setIsMenuOpen(false)}>Contact</Link>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3">
                                <Link to="/login" className="text-center text-gray-700 dark:text-white font-medium py-2 text-sm" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                                <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                                    <Button className="w-full bg-[#d6b161] text-[#0a192f] font-semibold rounded-full text-sm py-2">
                                        Enroll Now
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Header;
