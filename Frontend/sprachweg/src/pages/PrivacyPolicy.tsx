import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

// Hero Background Component with parallax blobs + grain
const HeroBackground: React.FC = () => {
    const shouldReduceMotion = useReducedMotion();
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, shouldReduceMotion ? 0 : 150]);
    const y2 = useTransform(scrollY, [0, 500], [0, shouldReduceMotion ? 0 : -150]);
    const opacity = useTransform(scrollY, [0, 500], [1, 0]);

    return (
        <motion.div
            style={{ opacity }}
            className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
            aria-hidden="true"
        >
            <motion.div
                style={{ y: y1 }}
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-[10%] -right-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#d6b161]/20 to-red-500/10 blur-[120px]"
            />
            <motion.div
                style={{ y: y2 }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-yellow-500/10 blur-[100px]"
            />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        </motion.div>
    );
};

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
    }
};

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans text-gray-800 dark:text-gray-200">
            <Header />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1a365d] overflow-hidden py-28 sm:py-36 text-center">
                    <HeroBackground />

                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            className="flex flex-col items-center text-center"
                            initial="hidden"
                            animate="visible"
                            variants={fadeInUp}
                        >
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold text-white mb-6 leading-tight">
                                Privacy <span className="text-[#d6b161]">Policy</span>
                            </h1>
                            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
                                Learn how we collect, use, and protect your personal information
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Content Section */}
                <section className="py-12 sm:py-16 md:py-20">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 lg:p-10"
                        >

                            {/* Introduction */}
                            <div className="mb-8">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 text-base">
                                    SoVir Technologies website is owned by SoVir Technologies, which is a data controller of your personal data.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 text-base">
                                    We have adopted this Privacy Policy, which determines how we are processing the information collected by SoVir Technologies, which also provides the reasons why we must collect certain personal data about you. Therefore, you must read this Privacy Policy before using SoVir Technologies website.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-8 text-base">
                                    We take care of your personal data and undertake to guarantee its confidentiality and security.
                                </p>
                            </div>

                            {/* Personal Information Section */}
                            <section className="mb-10" id="personal-information">
                                <h2 className="text-2xl sm:text-3xl font-semibold text-[#0a192f] dark:text-white mb-4 pb-3 border-b-2 border-[#d6b161]">
                                    Personal information we collect:
                                </h2>
                                <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                                    <p>
                                        When you visit the SoVir Technologies, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the installed cookies on your device. Additionally, as you browse the Site, we collect information about the individual web pages or products you view, what websites or search terms referred you to the Site, and how you interact with the Site. We refer to this automatically-collected information as "Device Information." Moreover, we might collect the personal data you provide to us (including but not limited to Name, Surname, Address, payment information, etc.) during registration to be able to fulfill the agreement.
                                    </p>
                                </div>
                            </section>

                            {/* Data Processing Section */}
                            <section className="mb-10" id="data-processing">
                                <h2 className="text-2xl sm:text-3xl font-semibold text-[#0a192f] dark:text-white mb-4 pb-3 border-b-2 border-[#d6b161]">
                                    Why do we process your data?
                                </h2>
                                <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                                    <p>
                                        Our top priority is customer data security, and, as such, we may process only minimal user data, only as much as it is absolutely necessary to maintain the website. Information collected automatically is used only to identify potential cases of abuse and establish statistical information regarding website usage. This statistical information is not otherwise aggregated in such a way that it would identify any particular user of the system.
                                    </p>
                                    <p>
                                        You can visit the website without telling us who you are or revealing any information, by which someone could identify you as a specific, identifiable individual. If, however, you wish to use some of the website's features, or you wish to receive our newsletter or provide other details by filling a form, you may provide personal data to us, such as your email, first name, last name, city of residence, organization, telephone number. You can choose not to provide us with your personal data, but then you may not be able to take advantage of some of the website's features. For example, you won't be able to receive our Newsletter or contact us directly from the website. Users who are uncertain about what information is mandatory are welcome to contact us via sovirtechnologies@gmail.com.
                                    </p>
                                </div>
                            </section>

                            {/* Your Rights Section */}
                            <section className="mb-10" id="your-rights">
                                <h2 className="text-2xl sm:text-3xl font-semibold text-[#0a192f] dark:text-white mb-4 pb-3 border-b-2 border-[#d6b161]">
                                    Your rights:
                                </h2>
                                <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                                    <p>
                                        If you are a European resident, you have the following rights related to your personal data:
                                    </p>
                                    <div className="bg-[#d6b161]/10 border-l-4 border-[#d6b161] p-4 my-4 rounded-r-lg">
                                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                                            <li>The right to be informed.</li>
                                            <li>The right of access.</li>
                                            <li>The right to rectification.</li>
                                            <li>The right to erasure.</li>
                                            <li>The right to restrict processing.</li>
                                            <li>The right to data portability.</li>
                                            <li>The right to object.</li>
                                            <li>Rights in relation to automated decision-making and profiling.</li>
                                        </ul>
                                    </div>
                                    <p>
                                        If you would like to exercise this right, please contact us through the contact information below.
                                    </p>
                                    <p>
                                        Additionally, if you are a European resident, we note that we are processing your information in order to fulfill contracts we might have with you (for example, if you make an order through the Site), or otherwise to pursue our legitimate business interests listed above. Additionally, please note that your information might be transferred outside of Europe, including Canada and the United States.
                                    </p>
                                </div>
                            </section>

                            {/* Links to Other Websites Section */}
                            <section className="mb-10" id="external-links">
                                <h2 className="text-2xl sm:text-3xl font-semibold text-[#0a192f] dark:text-white mb-4 pb-3 border-b-2 border-[#d6b161]">
                                    Links to other websites:
                                </h2>
                                <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                                    <p>
                                        Our website may contain links to other websites that are not owned or controlled by us. Please be aware that we are not responsible for such other websites or third parties' privacy practices. We encourage you to be aware when you leave our website and read the privacy statements of each website that may collect personal information.
                                    </p>
                                </div>
                            </section>

                            {/* Information Security Section */}
                            <section className="mb-10" id="information-security">
                                <h2 className="text-2xl sm:text-3xl font-semibold text-[#0a192f] dark:text-white mb-4 pb-3 border-b-2 border-[#d6b161]">
                                    Information security:
                                </h2>
                                <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                                    <p>
                                        We secure information you provide on computer servers in a controlled, secure environment, protected from unauthorized access, use, or disclosure. We keep reasonable administrative, technical, and physical safeguards to protect against unauthorized access, use, modification, and personal data disclosure in its control and custody. However, no data transmission over the Internet or wireless network can be guaranteed.
                                    </p>
                                </div>
                            </section>

                            {/* Legal Disclosure Section */}
                            <section className="mb-10" id="legal-disclosure">
                                <h2 className="text-2xl sm:text-3xl font-semibold text-[#0a192f] dark:text-white mb-4 pb-3 border-b-2 border-[#d6b161]">
                                    Legal disclosure:
                                </h2>
                                <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                                    <p>
                                        We will disclose any information we collect, use or receive if required or permitted by law, such as to comply with a subpoena or similar legal process, and when we believe in good faith that disclosure is necessary to protect our rights, protect your safety or the safety of others, investigate fraud, or respond to a government request.
                                    </p>
                                </div>
                            </section>

                            {/* Contact Information Section */}
                            <section id="contact-information">
                                <h2 className="text-2xl sm:text-3xl font-semibold text-[#0a192f] dark:text-white mb-4 pb-3 border-b-2 border-[#d6b161]">
                                    Contact information:
                                </h2>
                                <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                                    <p>
                                        If you would like to contact us to understand more about this Policy or wish to contact us concerning any matter relating to individual rights and your Personal Information, you may send an email to <a href="mailto:sovirtechnologies@gmail.com" className="text-[#d6b161] hover:underline font-medium">sovirtechnologies@gmail.com</a>.
                                    </p>
                                </div>
                            </section>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
