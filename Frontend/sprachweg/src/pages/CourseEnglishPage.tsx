import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, BookOpen, Clock, Target, Award, Shield, Zap, Star } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import EnrollmentModal from '../components/ui/EnrollmentModal';
import { languageAPI } from '../lib/api';
import type { SkillCourse } from '../types/skill';

// --- Premium Animation Variants ---
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: custom * 0.1, ease: [0.22, 1, 0.36, 1] as const }
  })
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

// --- Components ---

// Elevated Hero Background
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
          opacity: [0.4, 0.6, 0.4]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[10%] -right-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#d6b161]/20 to-[#0a192f]/10 blur-[120px]"
      />
      <motion.div
        style={{ y: y2 }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[100px]"
      />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
    </motion.div>
  );
};

// Premium Course Card
interface CourseLevelCardProps {
  level: NonNullable<SkillCourse['levels']>[number];
  index: number;
  onEnroll: () => void;
}

const CourseLevelCard: React.FC<CourseLevelCardProps> = ({ level, index, onEnroll }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={fadeInUp}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      whileHover={shouldReduceMotion ? {} : { y: -8, transition: { duration: 0.3 } }}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-lg transition-all duration-500 hover:shadow-2xl dark:border-gray-800 dark:bg-gray-800/95 dark:backdrop-blur-sm"
    >
      {/* Decorative Top Accent */}
      <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-[#0a192f] via-[#112240] to-[#d6b161]" />

      <div className="flex flex-1 flex-col p-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-900 dark:bg-blue-900/30 dark:text-blue-100">
            <BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>{level.name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            {level.duration}
          </div>
        </div>

        {/* Price & Title */}
        <div className="mb-8">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">{level.price}</span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">/ package</span>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Comprehensive {level.name} training</p>
        </div>

        {/* Features List */}
        <div className="mb-8 flex-1 space-y-4">
          <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            <Target className="h-4 w-4" />
            What You'll Learn
          </h4>
          <ul className="space-y-3">
            {level.features.slice(0, 8).map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-200">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#d6b161]" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Outcome Box */}
        <div className="mb-8 rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100 dark:bg-gray-900/50 dark:ring-gray-800">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Target Outcome</p>
          <p className="mt-1.5 text-sm font-medium leading-relaxed text-gray-900 dark:text-white">{level.outcome}</p>
        </div>

        {/* Exam Prep (Conditional) */}
        {level.examPrep && level.examPrep.title && (
          <div className="mb-8 rounded-xl border border-dashed border-[#d6b161]/40 bg-[#d6b161]/5 p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-bold text-[#0a192f] dark:text-[#d6b161]">
              <Award className="h-4 w-4" />
              {level.examPrep.title}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">{level.examPrep.details}</p>
          </div>
        )}

        {/* CTA */}
        <motion.button
          onClick={onEnroll}
          whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-[#0a192f] py-4 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-[#112240] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-white dark:text-[#0a192f] dark:hover:bg-gray-100 dark:focus:ring-offset-gray-900"
        >
          Enroll Now
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </motion.button>
      </div>
    </motion.div>
  );
};

// Premium FAQ Item
const faqs = [
  {
    id: '1',
    question: 'Do I need prior English knowledge?',
    answer: 'Our Beginner level welcomes complete beginners. We assess your level and place you in the right program.'
  },
  {
    id: '2',
    question: 'Are classes live or recorded?',
    answer: 'We offer both options. Live classes provide real-time interaction, while recorded sessions offer flexibility.'
  },
  {
    id: '3',
    question: 'Will I get a certificate?',
    answer: 'Yes! Upon completion, you receive a verified certificate recognized by employers and universities.'
  }
];

const FAQItem: React.FC<{ faq: typeof faqs[0]; isOpen: boolean; onToggle: () => void }> = ({ faq, isOpen, onToggle }) => {
  return (
    <div className="overflow-hidden border-b border-gray-200 last:border-0 dark:border-gray-800">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b161] focus-visible:ring-inset"
        aria-expanded={isOpen}
      >
        <span className={`text-lg font-medium transition-colors ${isOpen ? 'text-[#d6b161]' : 'text-gray-900 dark:text-white'}`}>
          {faq.question}
        </span>
        <span className={`ml-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all ${isOpen ? 'bg-[#d6b161] text-white rotate-180' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
          <ChevronRight className="h-5 w-5 rotate-90" />
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <p className="pb-6 text-base leading-relaxed text-gray-600 dark:text-gray-400">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Page Component ---

const CourseEnglishPage: React.FC = () => {
  const [course, setCourse] = useState<SkillCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedLevelName, setSelectedLevelName] = useState("");


  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const courses = await languageAPI.getAll();
        const englishCourse = courses.find((c: any) => c.title.includes('English'));
        if (englishCourse) {
          setCourse(englishCourse);
        }
      } catch (error) {
        console.error('Failed to fetch course data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#0a192f]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#d6b161] border-t-transparent"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#0a192f]">
        <p className="text-lg text-gray-500">Course not found.</p>
      </div>
    );
  }

  const selectedLevelDetails = course.levels?.find((level) => level.name === selectedLevelName);

  return (
    <div className="relative min-h-screen bg-white text-gray-900 selection:bg-[#d6b161]/30 dark:bg-[#0a192f] dark:text-gray-100">
      <Header />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-6 focus:left-6 focus:z-50 focus:rounded-lg focus:bg-white focus:px-6 focus:py-3 focus:font-bold focus:text-[#0a192f] focus:shadow-2xl focus:ring-2 focus:ring-[#d6b161]"
      >
        Skip to content
      </a>

      {/* Hero Section */}
      <section className="relative py-28 sm:py-36 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white dark:from-[#0d1f3a] dark:to-[#0a192f]" />
        <HeroBackground />

        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="mx-auto max-w-4xl"
          >
            <motion.div variants={fadeInUp} className="mb-8 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#d6b161]/20 bg-[#d6b161]/10 px-4 py-1.5 text-sm font-semibold text-[#d6b161] backdrop-blur-sm">
                <Star className="h-4 w-4 fill-current" />
                Premium English Certification
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="font-display mb-6 text-5xl font-bold tracking-tight text-[#0a192f] dark:text-white sm:text-6xl lg:text-7xl"
            >
              Master English for <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#d6b161] to-[#b38f3f] bg-clip-text text-transparent">Global Success</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-300 sm:text-xl"
            >
              {course.description}
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2 rounded-lg bg-white/50 px-4 py-2 dark:bg-white/5">
                <Shield className="h-5 w-5 text-emerald-500" />
                <span>Official Certification</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/50 px-4 py-2 dark:bg-white/5">
                <Zap className="h-5 w-5 text-[#d6b161]" />
                <span>Fast-track Options</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <main id="main-content" className="relative z-10">

        {/* Levels Grid */}
        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-16 text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight text-[#0a192f] dark:text-white sm:text-4xl">
                Choose Your Proficiency Level
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Tailored curriculums designed to meet your specific goals.
              </p>
            </motion.div>

            {course.levels && course.levels.length > 0 ? (
              <div className="grid gap-8 lg:grid-cols-3">
                {course.levels.map((level, index) => (
                  <CourseLevelCard
                    key={index}
                    level={level}
                    index={index}
                    onEnroll={() => {
                      setSelectedLevelName(level.name);
                      setIsEnrollModalOpen(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
                No course levels available at the moment.
              </div>
            )}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-gray-50 px-4 py-24 dark:bg-[#0d1f3a]/30 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <h2 className="text-3xl font-bold tracking-tight text-[#0a192f] dark:text-white sm:text-4xl">
                Frequently Asked Questions
              </h2>
            </motion.div>

            <div className="rounded-2xl bg-white p-6 shadow-xl shadow-gray-200/50 dark:bg-gray-900/50 dark:shadow-none sm:p-10">
              {faqs.map((faq) => (
                <FAQItem
                  key={faq.id}
                  faq={faq}
                  isOpen={openFAQ === faq.id}
                  onToggle={() => setOpenFAQ(openFAQ === faq.id ? null : faq.id)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl bg-[#0a192f] px-6 py-16 text-center text-white shadow-2xl dark:bg-blue-600/10 dark:ring-1 dark:ring-white/10 sm:px-12 sm:py-20"
            >
              <div className="relative z-10">
                <Zap className="mx-auto mb-6 h-12 w-12 text-[#d6b161]" />
                <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  Ready to Transform Your Future?
                </h2>
                <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-300">
                  Join thousands of successful students mastering English with our expert-led courses.
                </p>
                {/* Note: "View Level" button removed as per requirements */}
              </div>

              {/* Background Accents */}
              <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-[#d6b161]/10 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"></div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <EnrollmentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        origin="english"
        originPath="/training/english"
        selectedLevel={selectedLevelName}
        paymentAmount={selectedLevelDetails?.price}
      />
    </div>
  );
};

export default CourseEnglishPage;
