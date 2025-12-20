import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import Button from '../ui/Button';

const Footer: React.FC = () => {
    const [email, setEmail] = useState('');

    return (
        <footer className="bg-[#050c18] text-white pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Grid - 4 Columns with equal spacing */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-16">
                    {/* Column 1: Company Info */}
                    <div className="space-y-6 lg:col-span-1">
                        <div className="flex items-center gap-3">
                            <img
                                src="/sovir-logo.png"
                                alt="SoVir Logo"
                                className="h-10 w-auto object-contain"
                            />
                            <div>
                                <span className="font-serif font-bold text-lg leading-tight text-white block">SoVir Skilling & Training Center</span>
                                <span className="text-xs tracking-wider text-gray-400">A Division of SoVir Technologies LLP</span>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Your gateway to advanced industry skills and international career opportunities. Join thousands of successful learners worldwide.
                        </p>
                        <div className="space-y-3 pt-2">
                            <a href="mailto:training@sovirtechnologies.in " className="flex items-center gap-3 text-gray-400 hover:text-[#d6b161] transition-colors">
                                <Mail className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm">training@sovirtechnologies.in</span>
                            </a>
                            <a href="tel:+4930123456789" className="flex items-center gap-3 text-gray-400 hover:text-[#d6b161] transition-colors">
                                <Phone className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm">+49 30 123 456 789</span>
                            </a>
                            <div className="flex items-start gap-3 text-gray-400">
                                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <div>Friedrichstraße 123</div>
                                    <div>10117 Berlin, Germany</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Career Abroad (previously Column 3) */}
                    <div>
                        <h3 className="font-bold text-white mb-6 text-base">Career Abroad</h3>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><Link to="#" className="hover:text-[#d6b161] transition-colors block">Work in Canada</Link></li>
                            <li><Link to="#" className="hover:text-[#d6b161] transition-colors block">Career in Germany</Link></li>
                            <li><Link to="#" className="hover:text-[#d6b161] transition-colors block">Jobs in Australia</Link></li>
                            <li><Link to="#" className="hover:text-[#d6b161] transition-colors block">Visa Assistance</Link></li>
                            <li><Link to="#" className="hover:text-[#d6b161] transition-colors block">Job Placement</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Company (previously Column 4) */}
                    <div>
                        <h3 className="font-bold text-white mb-6 text-base">Company</h3>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><Link to="/about" className="hover:text-[#d6b161] transition-colors block">About Us</Link></li>
                            <li><Link to="#" className="hover:text-[#d6b161] transition-colors block">Our Team</Link></li>
                            <li><Link to="#" className="hover:text-[#d6b161] transition-colors block">Careers at SoVir</Link></li>
                            <li><Link to="#" className="hover:text-[#d6b161] transition-colors block">Press & Media</Link></li>
                            <li><Link to="#" className="hover:text-[#d6b161] transition-colors block">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Policies (previously Column 5) */}
                    <div>
                        <h3 className="font-bold text-white mb-6 text-base">Policies</h3>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><Link to="/privacy-policy" className="hover:text-[#d6b161] transition-colors block">Privacy Policy</Link></li>
                            <li><Link to="/terms-and-conditions" className="hover:text-[#d6b161] transition-colors block">Terms & Condition</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Newsletter Section with Follow Us on same row */}
                <div className="border-t border-white/10 pt-12 mb-12">
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                        {/* Left: Stay Updated */}
                        <div className="flex-1">
                            <h3 className="font-serif text-2xl text-white mb-3">Stay Updated</h3>
                            <p className="text-gray-400 text-sm mb-6">Get the latest courses, career tips, and exclusive offers</p>
                            <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#d6b161] flex-1 min-w-[280px]"
                                />
                                <Button className="bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] font-bold px-6 py-3 rounded-lg whitespace-nowrap">
                                    Subscribe →
                                </Button>
                            </div>
                        </div>

                        {/* Right: Follow Us */}
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-400">Follow Us</span>
                            <div className="flex gap-3">
                                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#d6b161] hover:text-[#0a192f] transition-all">
                                    <Facebook className="w-5 h-5" />
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#d6b161] hover:text-[#0a192f] transition-all">
                                    <Instagram className="w-5 h-5" />
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#d6b161] hover:text-[#0a192f] transition-all">
                                    <Linkedin className="w-5 h-5" />
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#d6b161] hover:text-[#0a192f] transition-all">
                                    <Youtube className="w-5 h-5" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Copyright & Links */}
                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
                    <p>&copy; 2025 SoVir Skilling & Training Center. All rights reserved.</p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link to="/privacy-policy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
                        <Link to="/terms-and-conditions" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
                        <Link to="#" className="hover:text-gray-300 transition-colors">Imprint</Link>
                        <Link to="#" className="hover:text-gray-300 transition-colors">Cookie Settings</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;