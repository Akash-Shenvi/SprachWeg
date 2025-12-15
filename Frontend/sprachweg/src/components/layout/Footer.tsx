// Footer.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Facebook, Instagram, Linkedin, Youtube, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';

const Footer: React.FC = () => {
    const [email, setEmail] = useState('');

    return (
        <footer className="bg-[#050c18] text-white pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 lg:mb-16">
                    {/* Company Info - Left Column */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-[#d6b161] flex items-center justify-center flex-shrink-0">
                                <span className="font-serif font-bold text-xl text-[#0a192f]">S</span>
                            </div>
                            <div>
                                <span className="font-serif font-bold text-base leading-tight text-white block">SoVir Akademie</span>
                                <span className="text-xs tracking-wider text-gray-400">A Division of SoVir Technologies LLP</span>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Your gateway to language mastery and international career opportunities. Join thousands of successful learners worldwide.
                        </p>
                        <div className="space-y-3">
                            <a href="mailto:info@sovir.com" className="flex items-center gap-3 text-gray-400 hover:text-[#d6b161] transition-colors group">
                                <Mail className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm break-all">info@sovir.com</span>
                            </a>
                            <a href="tel:+4930123456789" className="flex items-center gap-3 text-gray-400 hover:text-[#d6b161] transition-colors">
                                <Phone className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm">+49 30 123 456 789</span>
                            </a>
                            <div className="flex items-start gap-3 text-gray-400">
                                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span className="text-sm">Friedrichstraße 123<br />10117 Berlin, Germany</span>
                            </div>
                        </div>
                    </div>

                    {/* Language Training */}
                    <div>
                        <h3 className="font-bold text-white mb-6 text-sm uppercase tracking-wide">Language Training</h3>
                        <ul className="space-y-3">
                            <li><Link to="#" className="text-gray-400 hover:text-[#d6b161] transition-colors text-sm">English Training</Link></li>
                            <li><Link to="#" className="text-gray-400 hover:text-[#d6b161] transition-colors text-sm">Spanish Classes</Link></li>
                            <li><Link to="#" className="text-gray-400 hover:text-[#d6b161] transition-colors text-sm">French Courses</Link></li>
                            <li><Link to="#" className="text-gray-400 hover:text-[#d6b161] transition-colors text-sm">German A1-B2</Link></li>
                            <li><Link to="#" className="text-gray-400 hover:text-[#d6b161] transition-colors text-sm">Japanese & Chinese</Link></li>
                        </ul>
                    </div>

                    {/* Career Abroad */}
                    <div>
                        <h3 className="font-bold text-white mb-6 text-sm uppercase tracking-wide">Career Abroad</h3>
                        <ul className="space-y-3">
                            <li><Link to="#" className="text-gray-400 hover:text-[#d6b161] transition-colors text-sm">Work in Canada</Link></li>
                            <li><Link to="#" className="text-gray-400 hover:text-[#d6b161] transition-colors text-sm">Career in Germany</Link></li>
                            <li><Link to="#" className="text-gray-400 hover:text-[#d6b161] transition-colors text-sm">Jobs in Australia</Link></li>
                            <li><Link to="#" className="text-gray-400 hover:text-[#d6b161] transition-colors text-sm">Visa Assistance</Link></li>
                            <li><Link to="#" className="text-gray-400 hover:text-[#d6b161] transition-colors text-sm">Job Placement</Link></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="font-bold text-white mb-6 text-sm uppercase tracking-wide">Resources</h3>
                        <ul className="space-y-3">
                            <li><Link to="#" className="text-gray-400 hover:text-[#d6b161] transition-colors text-sm">Student Dashboard</Link></li>
                            <li><Link to="#" className="text-gray-400 hover:text-[#d6b161] transition-colors text-sm">Knowledge Base</Link></li>
                            <li><Link to="#" className="text-gray-400 hover:text-[#d6b161] transition-colors text-sm">Blog</Link></li>
                            <li><Link to="#" className="text-gray-400 hover:text-[#d6b161] transition-colors text-sm">Events</Link></li>
                            <li><Link to="#" className="text-gray-400 hover:text-[#d6b161] transition-colors text-sm">Partner With Us</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Newsletter Section */}
                <div className="border-t border-white/5 pt-12 lg:pt-16 mb-12">
                    <h3 className="font-serif text-2xl lg:text-3xl text-white mb-3">Stay Updated</h3>
                    <p className="text-gray-400 text-sm mb-6 max-w-md">
                        Get the latest courses, career tips, and exclusive offers
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#d6b161] focus:bg-white/10 transition-colors flex-1"
                        />
                        <button className="bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] font-bold px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-sm">
                            Subscribe
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center gap-6 mt-8">
                        <span className="text-sm text-gray-400">Follow us</span>
                        <div className="flex gap-3">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#d6b161] flex items-center justify-center text-white hover:text-[#0a192f] transition-all duration-200">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#d6b161] flex items-center justify-center text-white hover:text-[#0a192f] transition-all duration-200">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#d6b161] flex items-center justify-center text-white hover:text-[#0a192f] transition-all duration-200">
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#d6b161] flex items-center justify-center text-white hover:text-[#0a192f] transition-all duration-200">
                                <Youtube className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
                    <p>&copy; 2025 SoVir Akademie. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link to="#" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
                        <Link to="#" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
                        <Link to="#" className="hover:text-gray-300 transition-colors">Imprint</Link>
                        <Link to="#" className="hover:text-gray-300 transition-colors">Cookie Settings</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
