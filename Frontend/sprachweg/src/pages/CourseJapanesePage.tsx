import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useAnimation, AnimatePresence } from 'framer-motion';
import { ArrowRight, Clock, DollarSign, BookOpen, CheckCircle, HelpCircle, Play } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

// ============================================================================
// ANIMATIONS & VARIANTS
// ============================================================================

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.0, 0.0, 0.2, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.0, 0.0, 0.2, 1] } }
};

// ============================================================================
// ANIMATED SECTION WRAPPER
// ============================================================================

const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ============================================================================
// HERO ANIMATED BACKGROUND
// ============================================================================

const HeroAnimatedBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-red-500/20 to-transparent rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          x: [0, -80, 0],
          y: [0, 80, 0],
          scale: [1, 1.3, 1]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-[#d6b161]/20 to-transparent rounded-full blur-3xl"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 dark:to-black/20" />
    </div>
  );
};

// ============================================================================
// COURSE LEVEL CARD COMPONENT
// ============================================================================

interface Level {
  name: string;
  hours: number;
  fees: string;
  curriculum: string[];
  outcome: string;
  examCta?: {
    title: string;
    hours: number;
    fees: string;
    route: string;
  };
  route: string;
}

interface CourseLevelCardProps {
  level: Level;
  index: number;
}

const CourseLevelCard: React.FC<CourseLevelCardProps> = ({ level, index }) => {
  const [showMore, setShowMore] = React.useState(false);

  return (
    <motion.div
      variants={scaleIn}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      className="h-full rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden group flex flex-col"
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-[#0a192f] dark:text-white mb-2">
          {level.name}
        </h3>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4 text-[#d6b161]" />
            <span className="font-semibold">{level.hours} hours</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <DollarSign className="w-4 h-4 text-[#d6b161]" />
            <span className="font-semibold">{level.fees}</span>
          </div>
        </div>
      </div>

      {/* Curriculum Preview */}
      <div className="mb-6 flex-1">
        <h4 className="text-sm font-semibold text-[#0a192f] dark:text-gray-200 mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#d6b161]" />
          Curriculum Highlights
        </h4>
        <ul className="space-y-2">
          {level.curriculum.slice(0, 3).map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-[#d6b161] flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <AnimatePresence>
          {showMore && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 mt-2"
            >
              {level.curriculum.slice(3).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-4 h-4 text-[#d6b161] flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        {level.curriculum.length > 3 && (
          <button
            onClick={() => setShowMore(!showMore)}
            className="text-xs font-semibold text-[#d6b161] hover:text-[#c4a055] mt-2 transition-colors"
          >
            {showMore ? 'Show less' : `+ ${level.curriculum.length - 3} more`}
          </button>
        )}
      </div>

      {/* Outcome */}
      <div className="mb-6 p-4 bg-[#d6b161]/10 dark:bg-[#d6b161]/5 rounded-lg border border-[#d6b161]/20">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold text-[#0a192f] dark:text-white">Outcome: </span>
          {level.outcome}
        </p>
      </div>

      {/* Exam CTA */}
      {level.examCta && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-3 bg-gradient-to-r from-[#d6b161]/10 to-transparent border border-[#d6b161]/30 rounded-lg"
        >
          <Link
            to={level.examCta.route}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#d6b161] hover:text-[#c4a055] transition-colors"
          >
            <Play className="w-3 h-3" />
            {level.examCta.title} ({level.examCta.hours}h, {level.examCta.fees})
          </Link>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.enrollToCourse?.(level.name.toLowerCase())}
          className="px-4 py-3 bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] font-bold rounded-lg transition-all shadow-md hover:shadow-lg text-sm"
        >
          Enroll Now
        </motion.button>
        <Link to={level.route}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full px-4 py-3 border-2 border-[#d6b161] text-[#d6b161] hover:bg-[#d6b161]/10 font-bold rounded-lg transition-all text-sm"
          >
            Learn More
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
};

// ============================================================================
// FAQ COMPONENT
// ============================================================================

interface FAQItem {
  question: string;
  answer: string;
}

const FAQSection: React.FC<{ faqs: FAQItem[] }> = ({ faqs }) => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => (
        <motion.div
          key={index}
          layout
          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-6 py-4 flex items-center justify-between bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="font-semibold text-left text-[#0a192f] dark:text-white flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-[#d6b161] flex-shrink-0" />
              {faq.question}
            </span>
            <motion.div
              animate={{ rotate: openIndex === index ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0"
            >
              <ArrowRight className="w-5 h-5 text-[#d6b161]" />
            </motion.div>
          </button>

          <AnimatePresence>
            {openIndex === index && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
              >
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};

// ============================================================================
// COURSE DATA
// ============================================================================

const japaneseCourseData = {
  hero: {
    title: 'Master Japanese: JLPT N5 to N1',
    subtitle: 'Complete Japanese language training with Hiragana, Katakana, Kanji, and conversation skills.',
    highlight: 'JLPT Certified Japanese Courses'
  },
  levels: [
    {
      name: 'N5 Beginner',
      hours: 50,
      fees: '₹17,999',
      curriculum: [
        'Hiragana & Katakana writing systems',
        'Basic Kanji (50+ characters)',
        'Pronunciation & intonation fundamentals',
        'Simple grammar patterns & particles',
        'Daily conversation phrases',
        'Numbers, dates & time expressions',
        'Reading basic sentences & dialogues',
        'Writing short texts & simple responses'
      ],
      outcome: 'Speak basic Japanese and read simple texts; ready for JLPT N5 certification.',
      route: '/courses/japanese/n5'
    },
    {
      name: 'N4 Elementary',
      hours: 80,
      fees: '₹21,999',
      curriculum: [
        'Intermediate grammar patterns',
        'Expanded Kanji (300+ characters)',
        'Past & polite verb forms',
        'Daily life & travel scenarios',
        'Active listening & comprehension',
        'Reading short paragraphs & articles',
        'Writing structured answers & emails',
        'Conversation about routine topics'
      ],
      outcome: 'Handle everyday situations with growing fluency; ready for JLPT N4 certification.',
      route: '/courses/japanese/n4'
    },
    {
      name: 'N3 Intermediate',
      hours: 150,
      fees: '₹32,999',
      curriculum: [
        'Advanced grammar patterns (causative, passive)',
        'Advanced Kanji (650+ characters)',
        'Formal & informal speech register',
        'Workplace & professional Japanese',
        'News articles & complex text reading',
        'Essay & formal writing',
        'Speaking drills & presentations',
        'Cultural context & nuances'
      ],
      outcome: 'Achieve intermediate-advanced proficiency; ready for JLPT N3 certification.',
      examCta: {
        title: 'JLPT N2 Advanced Prep',
        hours: 250,
        fees: '₹49,999',
        route: '/courses/japanese/n2'
      },
      route: '/courses/japanese/n3'
    }
  ],
  faqs: [
    {
      question: 'What is JLPT and why is it important?',
      answer: 'JLPT (Japanese Language Proficiency Test) is the international standard for Japanese proficiency. N5 is beginner, N1 is advanced. It\'s recognized by employers and universities worldwide for career and study opportunities in Japan.'
    },
    {
      question: 'Do I need to study Kanji?',
      answer: 'Yes! Kanji is essential for reading and writing Japanese. We teach Kanji progressively: N5 starts with 50 characters, N4 adds 300, N3 reaches 650+. We provide effective memorization techniques and context-based learning.'
    },
    {
      question: 'How long does it take to reach N1?',
      answer: 'Typically 18-24 months of consistent study (N5→N4→N3→N2→N1). Our students average 50-100 hours per level depending on prior experience and study intensity.'
    },
    {
      question: 'Are there opportunities to practice with native speakers?',
      answer: 'Absolutely! We offer language exchange sessions, conversation practice with native instructors, and online communities where you can interact with other learners and native speakers.'
    },
    {
      question: 'Can I take the JLPT exam after each level?',
      answer: 'Yes! After completing N5, N4, or N3 courses, you can register for the official JLPT exam held twice yearly (July & December). We provide exam prep materials and mock tests.'
    }
  ]
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CourseJapanesePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1a365d] overflow-hidden pt-24 pb-16">
        <HeroAnimatedBackground />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="flex flex-col items-center text-center">
            <motion.span
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#d6b161]/10 text-[#d6b161] rounded-full text-sm font-semibold mb-6"
            >
              <Play className="w-4 h-4" />
              {japaneseCourseData.hero.highlight}
            </motion.span>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
            >
              {japaneseCourseData.hero.title}
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-gray-300 max-w-3xl mb-10"
            >
              {japaneseCourseData.hero.subtitle}
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="#levels"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-[#d6b161] text-[#0a192f] font-bold rounded-xl hover:bg-[#c4a055] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Explore Levels
                <ArrowRight className="w-5 h-5" />
              </motion.a>
              <Link to="/book-trial">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/10 transition-all"
                >
                  Book Free Trial
                </motion.button>
              </Link>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* Course Levels Section */}
      <section id="levels" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="flex flex-col items-center text-center mb-16">
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0a192f] dark:text-white mb-4"
            >
              Choose Your Level
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl"
            >
              JLPT-aligned Japanese courses for beginners to advanced learners
            </motion.p>
          </AnimatedSection>

          <AnimatedSection className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {japaneseCourseData.levels.map((level, index) => (
              <CourseLevelCard
                key={level.name}
                level={level}
                index={index}
              />
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="flex flex-col items-center text-center mb-16">
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0a192f] dark:text-white mb-4"
            >
              Frequently Asked Questions
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-gray-600 dark:text-gray-400"
            >
              Get answers to common questions about our Japanese courses
            </motion.p>
          </AnimatedSection>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <FAQSection faqs={japaneseCourseData.faqs} />
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-r from-[#0a192f] via-[#112240] to-[#1a365d] py-16 overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-[#d6b161]/10 to-transparent rounded-full"
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-white mb-6"
            >
              Start Your Japanese Journey Today
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto"
            >
              Join thousands of learners mastering Japanese with our JLPT-certified programs.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/book-trial">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-[#d6b161] text-[#0a192f] font-bold rounded-xl hover:bg-[#c4a055] transition-all shadow-lg"
                >
                  Book Free Trial Class
                </motion.button>
              </Link>
              <Link to="/contact">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white text-[#0a192f] font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg"
                >
                  Contact Our Team
                </motion.button>
              </Link>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CourseJapanesePage;