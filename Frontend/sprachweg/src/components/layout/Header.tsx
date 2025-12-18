// Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, ChevronDown } from 'lucide-react';
import Button from '../ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const { theme, toggleTheme } = useTheme();
    const { user } = useAuth();
    const navRef = useRef<HTMLElement>(null);

    const toggleDropdown = (dropdown: string) => {
        setOpenDropdown(openDropdown === dropdown ? null : dropdown);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside as unknown as EventListener);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside as unknown as EventListener);
        };
    }, []);

    return (
        <nav ref={navRef} className="fixed w-full z-50 bg-white/90 dark:bg-[#0a192f]/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                        <img
                            src="/src/assets/sovir-logo.png"
                            alt="SoVir Logo"
                            className="h-17 w-auto object-contain"
                        />
                        <span className="font-serif font-bold text-base lg:text-lg text-gray-900 dark:text-white"></span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-1">
                        <Link
                            to="/"
                            className="text-gray-700 dark:text-gray-300 hover:text-[#d6b161] font-medium transition-colors text-sm px-3 py-2"
                        >
                            Home
                        </Link>

                        {/* Language Training Mega Menu */}
                        <div className="relative group">
                            <button
                                onClick={() => toggleDropdown('language-desktop')}
                                className="text-gray-700 dark:text-gray-300 hover:text-[#d6b161] font-medium transition-colors text-sm px-3 py-2 flex items-center gap-1"
                            >
                                Language Training
                                <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'language-desktop' ? 'rotate-180' : ''}`} />
                            </button>
                            <div className={`absolute left-0 top-full mt-2 w-[650px] bg-white/95 dark:bg-[#0a192f]/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl transition-all duration-200 z-50 ${openDropdown === 'language-desktop' ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}>
                                <div className="grid grid-cols-3 gap-6 p-6">
                                    {/* LANGUAGES Column */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#d6b161] mb-4">Languages</h3>
                                        <div className="space-y-3">
                                            <Link to="/language-training" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">🌍</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">All Languages</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">View all language courses</p>
                                                </div>
                                            </Link>
                                            <Link to="/training/english" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">🇬🇧</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">English</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Business & Academic English</p>
                                                </div>
                                            </Link>
                                            <Link to="/training/german" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">🇩🇪</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">German</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">German A1-B2 Complete</p>
                                                </div>
                                            </Link>
                                            <Link to="/training/japanese" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">🇯🇵</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">Japanese</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">JLPT preparation</p>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* LEARNING MODES Column */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#d6b161] mb-4">Learning Modes</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">▶️</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Live Classes</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Interactive sessions</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">📚</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Self-Paced</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Learn at your pace</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">📅</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Hybrid</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Best of both worlds</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CERTIFICATIONS Column */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#d6b161] mb-4">Certifications</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">🏆</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Exam Preparation</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">International certifications</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">💼</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Business Language</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Professional communication</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Skill Training Mega Menu */}
                        <div className="relative group">
                            <button
                                onClick={() => toggleDropdown('skill-desktop')}
                                className="text-gray-700 dark:text-gray-300 hover:text-[#d6b161] font-medium transition-colors text-sm px-3 py-2 flex items-center gap-1"
                            >
                                Skill Training
                                <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'skill-desktop' ? 'rotate-180' : ''}`} />
                            </button>
                            <div className={`absolute left-0 top-full mt-2 w-[750px] bg-white/95 dark:bg-[#0a192f]/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl transition-all duration-200 z-50 ${openDropdown === 'skill-desktop' ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}>
                                <div className="grid grid-cols-3 gap-6 p-6">
                                    {/* INDUSTRIAL AUTOMATION Column */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#d6b161] mb-4">Industrial Automation</h3>
                                        <div className="space-y-3">
                                            <Link to="#" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">⚙️</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">Overview</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">All automation courses</p>
                                                </div>
                                            </Link>
                                            <Link to="#" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">🔧</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">PLC Programming</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Ladder logic & PLC systems</p>
                                                </div>
                                            </Link>
                                            <Link to="#" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">🖥️</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">HMI & SCADA</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Interface design & control</p>
                                                </div>
                                            </Link>
                                            <Link to="#" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">🤖</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">Robotics</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Industrial robotics</p>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* TECHNOLOGY TRAINING Column */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#d6b161] mb-4">Technology Training</h3>
                                        <div className="space-y-3">
                                            <Link to="#" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">📊</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">Overview</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">All technology courses</p>
                                                </div>
                                            </Link>
                                            <Link to="#" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">📡</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">Industrial IoT</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Connected factory solutions</p>
                                                </div>
                                            </Link>
                                            <Link to="#" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">📈</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">Data Analytics</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Industrial data insights</p>
                                                </div>
                                            </Link>
                                            <Link to="#" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">☁️</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">Cloud Computing</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Cloud automation</p>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* CORPORATE TRAINING Column */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#d6b161] mb-4">Corporate Training</h3>
                                        <div className="space-y-3">
                                            <Link to="#" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">👥</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">Team Upskilling</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Bulk training programs</p>
                                                </div>
                                            </Link>
                                            <Link to="#" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">🎯</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">Custom Programs</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Tailored solutions</p>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Career Abroad Mega Menu */}
                        <div className="relative group">
                            <button
                                onClick={() => toggleDropdown('career-desktop')}
                                className="text-gray-700 dark:text-gray-300 hover:text-[#d6b161] font-medium transition-colors text-sm px-3 py-2 flex items-center gap-1"
                            >
                                Career Abroad
                                <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'career-desktop' ? 'rotate-180' : ''}`} />
                            </button>
                            <div className={`absolute left-0 top-full mt-2 w-[650px] bg-white/95 dark:bg-[#0a192f]/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl transition-all duration-200 z-50 ${openDropdown === 'career-desktop' ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}>
                                <div className="grid grid-cols-3 gap-6 p-6">
                                    {/* DESTINATIONS Column */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#d6b161] mb-4">Destinations</h3>
                                        <div className="space-y-3">
                                            <Link to="/404" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">🇨🇦</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">Work in Canada</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Job opportunities in Canada</p>
                                                </div>
                                            </Link>
                                            <Link to="#" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">🇩🇪</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">Career in Germany</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">German work programs</p>
                                                </div>
                                            </Link>
                                            <Link to="/404" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">🇦🇺</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">Jobs in Australia</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Australian job placement</p>
                                                </div>
                                            </Link>
                                            <Link to="/404" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">🇬🇧</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">UK Employment</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Work permits & jobs in UK</p>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* SERVICES Column */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#d6b161] mb-4">Services</h3>
                                        <div className="space-y-3">
                                            <Link to="/404" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">📄</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">Visa Assistance</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Complete visa support</p>
                                                </div>
                                            </Link>
                                            <Link to="/404" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">💼</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">Job Placement</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Direct employment</p>
                                                </div>
                                            </Link>
                                            <Link to="/404" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">🎤</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">Interview Prep</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Career preparation</p>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* RESOURCES Column */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#d6b161] mb-4">Resources</h3>
                                        <div className="space-y-3">
                                            <Link to="/404" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">📋</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">Document Checklist</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Required paperwork</p>
                                                </div>
                                            </Link>
                                            <Link to="/404" className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/item">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d6b161]/10 flex items-center justify-center text-[#d6b161]">
                                                    <span className="text-lg">🤝</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/item:text-[#d6b161]">Employer Partners</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Our network</p>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
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

                        {user ? (
                            <Link to={`/${user.role}-dashboard`} className="text-gray-700 dark:text-white font-medium hover:text-[#d6b161] transition-colors text-sm">
                                <Button className="bg-[#0a192f] hover:bg-[#112240] text-white font-semibold px-6 py-2 rounded-full text-sm dark:bg-gray-700 dark:hover:bg-gray-600">
                                    Dashboard
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-700 dark:text-white font-medium hover:text-[#d6b161] transition-colors text-sm">
                                    Sign In
                                </Link>
                                <Link to="/register">
                                    <Button className="bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] font-semibold px-6 py-2 rounded-full text-sm">
                                        Enroll Now
                                    </Button>
                                </Link>
                            </>
                        )}
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

                            <button
                                onClick={() => toggleDropdown('language')}
                                className="w-full text-left text-gray-700 dark:text-gray-300 font-medium py-2 text-sm flex items-center justify-between"
                            >
                                Language Training
                                <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'language' ? 'rotate-180' : ''}`} />
                            </button>
                            {openDropdown === 'language' && (
                                <div className="bg-gray-50 dark:bg-white/5 rounded pl-4 pr-2 py-2 space-y-3">
                                    {/* Languages */}
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-bold uppercase text-[#d6b161] mb-2">Languages</h4>
                                        <Link to="/training/english" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>English</Link>
                                        <Link to="/training/german" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>German</Link>
                                        <Link to="/training/japanese" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>Japanese</Link>
                                        <Link to="/language-training" className="block text-gray-600 dark:text-gray-400 py-1 text-xs font-medium" onClick={() => setIsMenuOpen(false)}>View All Languages</Link>
                                    </div>

                                    {/* Learning Modes */}
                                    <div className="space-y-1 border-t border-gray-100 dark:border-gray-700 pt-2">
                                        <h4 className="text-xs font-bold uppercase text-[#d6b161] mb-2">Learning Modes</h4>
                                        <p className="text-gray-600 dark:text-gray-400 py-1 text-xs">Live Classes</p>
                                        <p className="text-gray-600 dark:text-gray-400 py-1 text-xs">Self-Paced</p>
                                        <p className="text-gray-600 dark:text-gray-400 py-1 text-xs">Hybrid</p>
                                    </div>
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
                                <div className="bg-gray-50 dark:bg-white/5 rounded pl-4 pr-2 py-2 space-y-3">
                                    {/* Industrial Automation */}
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-bold uppercase text-[#d6b161] mb-2">Industrial Automation</h4>
                                        <Link to="#" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>PLC Programming</Link>
                                        <Link to="#" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>HMI & SCADA</Link>
                                        <Link to="#" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>Robotics</Link>
                                    </div>

                                    {/* Technology Training */}
                                    <div className="space-y-1 border-t border-gray-100 dark:border-gray-700 pt-2">
                                        <h4 className="text-xs font-bold uppercase text-[#d6b161] mb-2">Technology</h4>
                                        <Link to="#" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>Industrial IoT</Link>
                                        <Link to="#" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>Data Analytics</Link>
                                        <Link to="#" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>Cloud Computing</Link>
                                    </div>

                                    {/* Corporate */}
                                    <div className="space-y-1 border-t border-gray-100 dark:border-gray-700 pt-2">
                                        <h4 className="text-xs font-bold uppercase text-[#d6b161] mb-2">Corporate</h4>
                                        <Link to="#" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>Team Upskilling</Link>
                                        <Link to="#" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>Custom Programs</Link>
                                    </div>
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
                                <div className="bg-gray-50 dark:bg-white/5 rounded pl-4 pr-2 py-2 space-y-3">
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-bold uppercase text-[#d6b161] mb-2">Destinations</h4>
                                        <Link to="/404" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>Work in Canada</Link>
                                        <Link to="#" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>Career in Germany</Link>
                                        <Link to="/404" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>Jobs in Australia</Link>
                                        <Link to="/404" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>UK Employment</Link>
                                    </div>
                                    <div className="space-y-1 border-t border-gray-100 dark:border-gray-700 pt-2">
                                        <h4 className="text-xs font-bold uppercase text-[#d6b161] mb-2">Services</h4>
                                        <Link to="/404" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>Visa Assistance</Link>
                                        <Link to="/404" className="block text-gray-600 dark:text-gray-400 py-1 text-xs" onClick={() => setIsMenuOpen(false)}>Job Placement</Link>
                                    </div>
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
