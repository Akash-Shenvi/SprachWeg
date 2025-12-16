import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header, Footer } from '../components/layout';
import Button from '../components/ui/Button';
import { Home } from 'lucide-react';

// --- Inline SVGs ---

const CatZero = () => (
    <div className="relative inline-block w-[0.8em] h-[0.8em] mx-1">
        {/* The '0' shape and Cat combined */}
        <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
            {/* Outline of the layout for the 0 - adjusted to match the font weight of 4 */}
            <defs>
                <clipPath id="circle-clip">
                    <circle cx="100" cy="100" r="80" />
                </clipPath>
            </defs>

            {/* The Zero Ring */}
            <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="18"
                className="text-[#1a2b4b] dark:text-white"
            />

            {/* Cat Body Peeking Through */}
            <g clipPath="url(#circle-clip)">
                {/* Cat Head */}
                <motion.g
                    initial={{ y: 10 }}
                    animate={{ y: 0 }}
                    transition={{
                        repeat: Infinity,
                        repeatType: "reverse",
                        duration: 2,
                        ease: "easeInOut"
                    }}
                >
                    {/* Ears */}
                    <path
                        d="M60 70 L50 40 L80 60 Z"
                        fill="#FFE4E1"
                        stroke="#1a2b4b"
                        strokeWidth="3"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M140 70 L150 40 L120 60 Z"
                        fill="#FFE4E1"
                        stroke="#1a2b4b"
                        strokeWidth="3"
                        strokeLinejoin="round"
                    />

                    {/* Face */}
                    <ellipse
                        cx="100"
                        cy="90"
                        rx="50"
                        ry="40"
                        fill="#FFF0F5"
                        stroke="#1a2b4b"
                        strokeWidth="3"
                    />

                    {/* Stripes - Forehead */}
                    <path d="M85 60 L100 75 L115 60" fill="none" stroke="#1a2b4b" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                    <path d="M100 55 L100 70" fill="none" stroke="#1a2b4b" strokeWidth="2" strokeLinecap="round" opacity="0.5" />

                    {/* Eyes */}
                    <motion.g
                        animate={{ scaleY: [1, 0.1, 1] }}
                        transition={{
                            repeat: Infinity,
                            delay: 3,
                            duration: 0.2
                        }}
                    >
                        <circle cx="80" cy="85" r="3" fill="#1a2b4b" />
                        <circle cx="120" cy="85" r="3" fill="#1a2b4b" />
                    </motion.g>

                    {/* Nose & Mouth */}
                    <path
                        d="M95 95 Q100 100 105 95"
                        fill="none"
                        stroke="#1a2b4b"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <path
                        d="M100 100 L100 105 Q90 115 80 105 M100 105 Q110 115 120 105"
                        fill="none"
                        stroke="#1a2b4b"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />

                    {/* Whiskers */}
                    <path d="M60 90 L40 85 M60 95 L40 95 M60 100 L40 105" fill="none" stroke="#1a2b4b" strokeWidth="1" opacity="0.4" />
                    <path d="M140 90 L160 85 M140 95 L160 95 M140 100 L160 105" fill="none" stroke="#1a2b4b" strokeWidth="1" opacity="0.4" />
                </motion.g>

                {/* Paws holding the ring */}
                <ellipse cx="60" cy="140" rx="12" ry="15" fill="#FFF0F5" stroke="#1a2b4b" strokeWidth="3" transform="rotate(-20 60 140)" />
                <ellipse cx="140" cy="140" rx="12" ry="15" fill="#FFF0F5" stroke="#1a2b4b" strokeWidth="3" transform="rotate(20 140 140)" />

                {/* Toe beans */}
                <circle cx="60" cy="145" r="2" fill="#FFB6C1" transform="rotate(-20 60 140)" />
                <circle cx="55" cy="140" r="2" fill="#FFB6C1" transform="rotate(-20 60 140)" />
                <circle cx="65" cy="140" r="2" fill="#FFB6C1" transform="rotate(-20 60 140)" />

                <circle cx="140" cy="145" r="2" fill="#FFB6C1" transform="rotate(20 140 140)" />
                <circle cx="135" cy="140" r="2" fill="#FFB6C1" transform="rotate(20 140 140)" />
                <circle cx="145" cy="140" r="2" fill="#FFB6C1" transform="rotate(20 140 140)" />

            </g>

            {/* Tail hanging down outside */}
            <motion.path
                d="M100 170 Q100 200 130 190 Q150 180 140 160"
                fill="none"
                stroke="#FFF0F5"
                strokeWidth="12"
                strokeLinecap="round"
                initial={{ rotate: -5, transformOrigin: "100px 170px" }}
                animate={{ rotate: 5 }}
                transition={{
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 1.5,
                    ease: "easeInOut"
                }}
            />
            <motion.path
                d="M100 170 Q100 200 130 190 Q150 180 140 160"
                fill="none"
                stroke="#1a2b4b"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ rotate: -5, transformOrigin: "100px 170px" }}
                animate={{ rotate: 5 }}
                transition={{
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 1.5,
                    ease: "easeInOut"
                }}
            />
            {/* Tail stripes */}
            <motion.path
                d="M110 180 Q115 185 120 180"
                fill="none"
                stroke="#1a2b4b"
                strokeWidth="2"
                opacity="0.5"
                initial={{ rotate: -5, transformOrigin: "100px 170px" }}
                animate={{ rotate: 5 }}
                transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
            />
            <motion.path
                d="M115 190 Q122 195 128 188"
                fill="none"
                stroke="#1a2b4b"
                strokeWidth="2"
                opacity="0.5"
                initial={{ rotate: -5, transformOrigin: "100px 170px" }}
                animate={{ rotate: 5 }}
                transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
            />
        </svg>
    </div>
);

const YarnBall = () => (
    <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        whileHover={{ rotate: 180 }}
        transition={{ duration: 1, ease: "easeOut" }}
    >
        <circle cx="50" cy="50" r="40" fill="#FFD700" opacity="0.2" /> {/* Gold background */}
        <circle cx="50" cy="50" r="38" fill="none" stroke="#d6b161" strokeWidth="2" />

        {/* Yarn threads */}
        <path d="M20 40 Q50 20 80 40" fill="none" stroke="#d6b161" strokeWidth="2" />
        <path d="M20 60 Q50 80 80 60" fill="none" stroke="#d6b161" strokeWidth="2" />
        <path d="M40 20 Q20 50 40 80" fill="none" stroke="#d6b161" strokeWidth="2" />
        <path d="M60 20 Q80 50 60 80" fill="none" stroke="#d6b161" strokeWidth="2" />
        <path d="M30 30 L70 70" fill="none" stroke="#d6b161" strokeWidth="2" />
        <path d="M70 30 L30 70" fill="none" stroke="#d6b161" strokeWidth="2" />

        {/* Loose thread */}
        <path d="M85 70 Q95 80 90 90" fill="none" stroke="#d6b161" strokeWidth="2" strokeLinecap="round" />
    </motion.svg>
);

const PottedPlant = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Pot */}
        <path d="M35 100 L30 70 L70 70 L65 100 Z" fill="#2d3748" />
        <rect x="28" y="65" width="44" height="5" fill="#4a5568" rx="2" />

        {/* Leaves */}
        <g transform="translate(50, 65)">
            {/* Left Leaf */}
            <motion.path
                d="M0 0 Q-20 -20 -30 -10 Q-25 5 0 0"
                fill="#48BB78"
                initial={{ rotate: -5, transformOrigin: "0 0" }}
                animate={{ rotate: 5 }}
                transition={{
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 3
                }}
            />
            {/* Right Leaf */}
            <motion.path
                d="M0 0 Q20 -30 35 -15 Q25 5 0 0"
                fill="#48BB78"
                initial={{ rotate: 5, transformOrigin: "0 0" }}
                animate={{ rotate: -5 }}
                transition={{
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 3.5,
                    delay: 0.5
                }}
            />
            {/* Top Leaf */}
            <motion.path
                d="M0 0 Q-5 -35 0 -50 Q5 -35 0 0"
                fill="#38A169"
                initial={{ rotate: 0, transformOrigin: "0 0" }}
                animate={{ rotate: 2 }}
                transition={{
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 4,
                    delay: 1
                }}
            />
        </g>
    </svg>
);

// --- Main Page Component ---

const NotFound404: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a192f] transition-colors duration-300 font-sans overflow-x-hidden">
            {/* Sticky Header */}
            <Header />

            {/* Main Content */}
            <main
                className="flex-grow flex flex-col items-center justify-center relative px-4 sm:px-6 lg:px-8 py-20"
                role="main"
            >
                {/* Visual Area */}
                <div className="relative text-center select-none mb-12">
                    {/* The Big 404 text */}
                    <h1
                        className="font-sans font-bold text-[#1a2b4b] dark:text-white text-[8rem] sm:text-[10rem] md:text-[12rem] lg:text-[16rem] leading-none flex items-center justify-center gap-2"
                        aria-label="404 Page Not Found"
                    >
                        <span>4</span>
                        {/* The Cat Zero Graphic */}
                        <div className="w-[0.7em] h-[0.7em] flex items-center justify-center relative -top-4 sm:-top-6 md:-top-8">
                            <div className="absolute inset-0 w-full h-full scale-150 transform">
                                <CatZero />
                            </div>
                        </div>
                        <span>4</span>
                    </h1>

                    {/* Subtext and Baseline Graphics */}
                    <div className="relative mt-4">
                        {/* Baseline */}
                        <div className="absolute bottom-2 left-0 right-0 h-px bg-gray-200 dark:bg-gray-700 w-full max-w-4xl mx-auto rounded-full" />

                        <div className="flex flex-col items-center relative z-10">
                            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-gray-800 dark:text-gray-200 mb-2">
                                Oops... Page Not Found
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-sm sm:text-base leading-relaxed mb-10">
                                It seems our furry friend has been playing with the cables again.
                                The page you are looking for has wandered off.
                            </p>

                            {/* Decor Elements on Baseline */}
                            <div className="absolute bottom-4 left-[10%] w-16 h-16 hidden md:block">
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.5, duration: 0.8 }}
                                >
                                    <YarnBall />
                                </motion.div>
                            </div>

                            <div className="absolute bottom-4 right-[10%] w-20 h-24 hidden md:block origin-bottom">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.7, duration: 0.8 }}
                                >
                                    <PottedPlant />
                                </motion.div>
                            </div>

                            {/* CTA Button */}
                            <Link to="/">
                                <Button
                                    className="bg-[#FFB6C1] hover:bg-[#FFC0CB] text-[#1a2b4b] font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ring-offset-2 focus:ring-2 ring-[#FFB6C1] dark:ring-offset-[#0a192f] flex items-center gap-2"
                                    aria-label="Return to Homepage"
                                >
                                    <Home className="w-5 h-5" />
                                    <span>Homepage</span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default NotFound404;
