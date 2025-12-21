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

const TermsAndConditions: React.FC = () => {
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
                                Terms and <span className="text-[#d6b161]">Conditions</span>
                            </h1>
                            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
                                Please read these terms and conditions carefully before using our website
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
                                    Welcome to SoVir Technologies!
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 text-base">
                                    These terms and conditions outline the rules and regulations for the use of SoVir Technologies's Website, located at{' '}
                                    <a href="https://www.sovirtechnologies.in" className="text-[#d6b161] hover:underline font-medium">
                                        https://www.sovirtechnologies.in
                                    </a>.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-8 text-base">
                                    By accessing this website, we assume you accept these terms and conditions. Do not continue to use SoVir Technologies if you do not agree to take all of the terms and conditions stated on this page.
                                </p>
                            </div>

                            {/* Cookies Section */}
                            <section className="mb-10" id="cookies">
                                <h2 className="text-2xl sm:text-3xl font-semibold text-[#0a192f] dark:text-white mb-4 pb-3 border-b-2 border-[#d6b161]">
                                    Cookies
                                </h2>
                                <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                                    <p>
                                        The website uses cookies to help personalize your online experience. By accessing SoVir Technologies, you agreed to use the required cookies.
                                    </p>
                                    <p>
                                        A cookie is a text file that is placed on your hard disk by a web page server. Cookies cannot be used to run programs or deliver viruses to your computer. Cookies are uniquely assigned to you and can only be read by a web server in the domain that issued the cookie to you.
                                    </p>
                                    <p>
                                        We may use cookies to collect, store, and track information for statistical or marketing purposes to operate our website. You have the ability to accept or decline optional Cookies. There are some required Cookies that are necessary for the operation of our website. These cookies do not require your consent as they always work. Please keep in mind that by accepting required Cookies, you also accept third party Cookies, which might be used via third-party provided services if you use such services on our website, for example, a video display window provided by third parties and integrated into our website.
                                    </p>
                                </div>
                            </section>

                            {/* License Section */}
                            <section className="mb-10" id="license">
                                <h2 className="text-2xl sm:text-3xl font-semibold text-[#0a192f] dark:text-white mb-4 pb-3 border-b-2 border-[#d6b161]">
                                    License
                                </h2>
                                <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                                    <p>
                                        Unless otherwise stated, SoVir Technologies and/or its licensors own the intellectual property rights for all material on SoVir Technologies. All intellectual property rights are reserved. You may access this from SoVir Technologies for your own personal use subjected to restrictions set in these terms and conditions.
                                    </p>

                                    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 my-4 rounded-r-lg">
                                        <p className="font-medium text-gray-900 dark:text-white mb-2">You must not:</p>
                                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                                            <li>Copy or republish material from SoVir Technologies</li>
                                            <li>Sell, rent, or sub-license material from SoVir Technologies</li>
                                            <li>Reproduce, duplicate or copy material from SoVir Technologies</li>
                                            <li>Redistribute content from SoVir Technologies</li>
                                        </ul>
                                    </div>

                                    <p>This Agreement shall begin on the date hereof.</p>

                                    <p>
                                        Parts of this website offer users an opportunity to post and exchange opinions and information in certain areas of the website. SoVir Technologies does not filter, edit, publish or review Comments before their presence on the website. Comments do not reflect the views and opinions of SoVir Technologies, its agents, and/or affiliates. Comments reflect the views and opinions of the person who posts their views and opinions. To the extent permitted by applicable laws, SoVir Technologies shall not be liable for the Comments or any liability, damages, or expenses caused and/or suffered as a result of any use of and/or posting of and/or appearance of the Comments on this website.
                                    </p>

                                    <p>
                                        SoVir Technologies reserves the right to monitor all Comments and remove any Comments that can be considered inappropriate, offensive, or causes breach of these Terms and Conditions.
                                    </p>

                                    <div className="bg-[#d6b161]/10 border-l-4 border-[#d6b161] p-4 my-4 rounded-r-lg">
                                        <p className="font-medium text-gray-900 dark:text-white mb-2">You warrant and represent that:</p>
                                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                                            <li>You are entitled to post the Comments on our website and have all necessary licenses and consents to do so;</li>
                                            <li>The Comments do not invade any intellectual property right, including without limitation copyright, patent, or trademark of any third party;</li>
                                            <li>The Comments do not contain any defamatory, libelous, offensive, indecent, or otherwise unlawful material, which is an immediate extension.</li>
                                            <li>The Comments will not be used to solicit or promote business or custom or present commercial activities or unlawful activity.</li>
                                        </ul>
                                    </div>

                                    <p>
                                        You hereby grant SoVir Technologies a non-exclusive license to use, reproduce, edit and authorize others to use, reproduce and edit any of your Comments in any and all forms, formats, or media.
                                    </p>
                                </div>
                            </section>

                            {/* Hyperlinking Section */}
                            <section className="mb-10" id="hyperlinking">
                                <h2 className="text-2xl sm:text-3xl font-semibold text-[#0a192f] dark:text-white mb-4 pb-3 border-b-2 border-[#d6b161]">
                                    Hyperlinking to our Content
                                </h2>
                                <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                                    <p className="font-medium">The following organizations may link to our Website without prior written approval:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>Government agencies;</li>
                                        <li>Search engines;</li>
                                        <li>News organizations;</li>
                                        <li>Online directory distributors may link to our Website in the same manner as they hyperlink to the Websites of other listed businesses; and</li>
                                        <li>System-wide Accredited Businesses except soliciting non-profit organizations, charity shopping malls, and charity fundraising groups which may not hyperlink to our Web site.</li>
                                    </ul>

                                    <p>
                                        These organizations may link to our home page, to publications, or to other Website information so long as the link: (a) is not in any way deceptive; (b) does not falsely imply sponsorship, endorsement, or approval of the linking party and its products and/or services; and (c) fits within the context of the linking party's site.
                                    </p>

                                    <p className="font-medium">We may consider and approve other link requests from the following types of organizations:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>Commonly-known consumer and/or business information sources;</li>
                                        <li>Dot.com community sites;</li>
                                        <li>Associations or other groups representing charities;</li>
                                        <li>Online directory distributors;</li>
                                        <li>Internet portals;</li>
                                        <li>Accounting, law, and consulting firms; and</li>
                                        <li>Educational institutions and trade associations.</li>
                                    </ul>

                                    <p>
                                        We will approve link requests from these organizations if we decide that: (a) the link would not make us look unfavorably to ourselves or to our accredited businesses; (b) the organization does not have any negative records with us; (c) the benefit to us from the visibility of the hyperlink compensates the absence of SoVir Technologies; and (d) the link is in the context of general resource information.
                                    </p>

                                    <p>
                                        These organizations may link to our home page so long as the link: (a) is not in any way deceptive; (b) does not falsely imply sponsorship, endorsement, or approval of the linking party and its products or services; and (c) fits within the context of the linking party's site.
                                    </p>

                                    <p>
                                        If you are one of the organizations listed in paragraph 2 above and are interested in linking to our website, you must inform us by sending an e-mail to SoVir Technologies. Please include your name, your organization name, contact information as well as the URL of your site, a list of any URLs from which you intend to link to our Website, and a list of the URLs on our site to which you would like to link. Wait 2-3 weeks for a response.
                                    </p>

                                    <p className="font-medium">Approved organizations may hyperlink to our Website as follows:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>By use of our corporate name; or</li>
                                        <li>By use of the uniform resource locator being linked to; or</li>
                                        <li>Using any other description of our Website being linked to that makes sense within the context and format of content on the linking party's site.</li>
                                    </ul>

                                    <p>
                                        No use of SoVir Technologies's logo or other artwork will be allowed for linking absent a trademark license agreement.
                                    </p>
                                </div>
                            </section>

                            {/* Content Liability Section */}
                            <section className="mb-10" id="content-liability">
                                <h2 className="text-2xl sm:text-3xl font-semibold text-[#0a192f] dark:text-white mb-4 pb-3 border-b-2 border-[#d6b161]">
                                    Content Liability
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                                    We shall not be held responsible for any content that appears on your Website. You agree to protect and defend us against all claims that are raised on your Website. No link(s) should appear on any Website that may be interpreted as libelous, obscene, or criminal, or which infringes, otherwise violates, or advocates the infringement or other violation of, any third party rights.
                                </p>
                            </section>

                            {/* Reservation of Rights Section */}
                            <section className="mb-10" id="reservation-of-rights">
                                <h2 className="text-2xl sm:text-3xl font-semibold text-[#0a192f] dark:text-white mb-4 pb-3 border-b-2 border-[#d6b161]">
                                    Reservation of Rights
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base mb-4">
                                    We reserve the right to request that you remove all links or any particular link to our Website. You approve to immediately remove all links to our Website upon request. We also reserve the right to amend these terms and conditions and its linking policy at any time. By continuously linking to our Website, you agree to be bound to and follow these linking terms and conditions.
                                </p>
                            </section>

                            {/* Removal of Links Section */}
                            <section className="mb-10" id="removal-of-links">
                                <h2 className="text-2xl sm:text-3xl font-semibold text-[#0a192f] dark:text-white mb-4 pb-3 border-b-2 border-[#d6b161]">
                                    Removal of links from our website
                                </h2>
                                <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                                    <p>
                                        If you find any link on our Website that is offensive for any reason, you are free to contact and inform us at any moment. We will consider requests to remove links, but we are not obligated to or so or to respond to you directly.
                                    </p>
                                    <p>
                                        We do not ensure that the information on this website is correct. We do not warrant its completeness or accuracy, nor do we promise to ensure that the website remains available or that the material on the website is kept up to date.
                                    </p>
                                </div>
                            </section>

                            {/* Disclaimer Section */}
                            <section id="disclaimer">
                                <h2 className="text-2xl sm:text-3xl font-semibold text-[#0a192f] dark:text-white mb-4 pb-3 border-b-2 border-[#d6b161]">
                                    Disclaimer
                                </h2>
                                <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                                    <p>
                                        To the maximum extent permitted by applicable law, we exclude all representations, warranties, and conditions relating to our website and the use of this website. Nothing in this disclaimer will:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>Limit or exclude our or your liability for death or personal injury;</li>
                                        <li>Limit or exclude our or your liability for fraud or fraudulent misrepresentation;</li>
                                        <li>Limit any of our or your liabilities in any way that is not permitted under applicable law; or</li>
                                        <li>Exclude any of our or your liabilities that may not be excluded under applicable law.</li>
                                    </ul>
                                    <p>
                                        The limitations and prohibitions of liability set in this Section and elsewhere in this disclaimer: (a) are subject to the preceding paragraph; and (b) govern all liabilities arising under the disclaimer, including liabilities arising in contract, in tort, and for breach of statutory duty.
                                    </p>
                                    <p>
                                        As long as the website and the information and services on the website are provided free of charge, we will not be liable for any loss or damage of any nature.
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

export default TermsAndConditions;
