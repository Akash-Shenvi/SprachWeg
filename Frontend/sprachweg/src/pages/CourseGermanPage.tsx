import React, { useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Check, ChevronRight, BookOpen, Clock, Target, Award, Star, Shield, Zap, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

// Course Level Data (CEFR)
interface CourseLevel {
  id: string;
  name: string;
  hours: number;
  fees: string;
  curriculum: string[];
  outcome: string;
}

const courseLevels: CourseLevel[] = [
  {
    id: 'a1',
    name: 'A1',
    hours: 45,
    fees: '₹15,999',
    curriculum: [
      'Alphabet & pronunciation',
      'Greetings & daily expressions',
      'Numbers, dates, time',
      'Articles & plurals',
      'Present tense verbs & sentence structure',
      'Questions & negation',
      'Daily life conversations (shopping, travel, food)',
      'Reading simple texts',
      'Writing short sentences'
    ],
    outcome: 'Basic spoken German; can introduce self; ready for Goethe A1'
  },
  {
    id: 'a2',
    name: 'A2',
    hours: 60,
    fees: '₹18,999',
    curriculum: [
      'Past tense (Perfekt)',
      'Modal verbs',
      'Prepositions & connectors',
      'Describing experiences/opinions',
      'Telephone & email communication',
      'Reading short articles',
      'Writing structured paragraphs',
      'Listening practice'
    ],
    outcome: 'Improved fluency; ready for Goethe A2'
  },
  {
    id: 'b1',
    name: 'B1',
    hours: 90,
    fees: '₹20,999',
    curriculum: [
      'Advanced grammar (Nebensätze, Konjunktiv II)',
      'Formal/informal communication',
      'Opinion & arguments',
      'Professional vocabulary',
      'Essay & email writing',
      'Newspapers & longer texts',
      'Real-life audio comprehension',
      'Presentations'
    ],
    outcome: 'Work/Ausbildung preparation; ready for Goethe B1'
  }
];

const examSpecial = {
  name: 'Goethe / TELC B2',
  hours: 240,
  fees: '₹43,499',
  description: 'Advanced exam preparation for university and professional certification'
};

const faqs = [
  {
    id: '1',
    question: 'Is this course aligned with CEFR levels?',
    answer: 'Yes. Our curriculum is aligned with CEFR from A1 to B2 and prepares you for Goethe-Institut and TELC exams.'
  },
  {
    id: '2',
    question: 'Do I need prior German knowledge?',
    answer: 'No. Our A1 level is designed for complete beginners. We start from the alphabet and build up systematically.'
  },
  {
    id: '3',
    question: 'Will this help with visa interviews?',
    answer: 'Absolutely! We include practical scenarios for visa interviews, job applications, and daily life in Germany.'
  },
  {
    id: '4',
    question: 'What certification will I receive?',
    answer: 'Upon completion, you receive a certificate aligned with CEFR standards, accepted by German embassies and universities.'
  }
];

// Animated Hero Background
const HeroBackground: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, shouldReduceMotion ? 0 : -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, shouldReduceMotion ? 0 : -30]);

  return (
    <>
      <motion.div
        style={{ y: y1 }}
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#d6b161]/20 blur-3xl"
        aria-hidden="true"
      />
      <motion.div
        style={{ y: y2 }}
        className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-red-500/10 blur-3xl"
        aria-hidden="true"
      />
    </>
  );
};

// Course Level Card Component
interface CourseLevelCardProps {
  level: CourseLevel;
  index: number;
  isB1?: boolean;
}

const CourseLevelCard: React.FC<CourseLevelCardProps> = ({ level, index, isB1 }) => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const handleEnroll = () => {
    if (typeof (window as any).enrollToCourse === 'function') {
      (window as any).enrollToCourse(`german-${level.id}`);
    } else {
      console.warn('Enrollment function not available');
      navigate('/register');
    }
  };

  const handleLearnMore = () => {
    navigate(`/training/german/${level.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : index * 0.1 }}
      whileHover={shouldReduceMotion ? {} : { y: -6 }}
      className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 sm:p-8"
    >
      {/* Level Badge */}
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#0a192f] px-4 py-2 text-sm font-bold text-white dark:bg-gray-700">
          <Globe className="h-4 w-4 text-[#d6b161]" />
          {level.name}
        </span>
        <div className="text-right">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Duration</p>
          <p className="flex items-center gap-1 text-sm font-bold text-[#0a192f] dark:text-gray-100">
            <Clock className="h-4 w-4 text-[#d6b161]" />
            {level.hours} Hours
          </p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-6">
        <p className="text-4xl font-bold text-[#0a192f] dark:text-gray-100">{level.fees}</p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Complete course package</p>
      </div>

      {/* Curriculum */}
      <div className="mb-6 flex-1">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">
          <Target className="h-4 w-4 text-[#d6b161]" />
          What You'll Learn
        </h3>
        <ul className="space-y-2">
          {level.curriculum.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Outcome Badge */}
      <div className="mb-6 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Outcome</p>
        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{level.outcome}</p>
      </div>

      {/* Exam Special Pill (Only for B1) */}
      {isB1 && (
        <div className="mb-6">
          <div className="rounded-xl border-2 border-dashed border-[#d6b161] bg-[#d6b161]/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Award className="h-5 w-5 text-[#d6b161]" />
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Advanced Certification</span>
            </div>
            <p className="mb-1 text-xs font-semibold text-gray-900 dark:text-gray-100">{examSpecial.name}</p>
            <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">{examSpecial.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {examSpecial.hours} hrs · {examSpecial.fees}
              </span>
              <button
                onClick={handleLearnMore}
                className="text-xs font-semibold text-[#d6b161] hover:text-[#b5934b] transition-colors"
              >
                Learn More →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <motion.button
          onClick={handleEnroll}
          whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#0a192f] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#112240] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#d6b161] focus:ring-offset-2 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          Enroll Now
          <ChevronRight className="h-4 w-4" />
        </motion.button>
        <motion.button
          onClick={handleLearnMore}
          whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border-2 border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-[#d6b161] hover:text-[#d6b161] focus:outline-none focus:ring-2 focus:ring-[#d6b161] focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:border-[#d6b161] dark:hover:text-[#d6b161]"
        >
          Learn More
        </motion.button>
      </div>
    </motion.div>
  );
};

// FAQ Accordion Item
interface FAQItemProps {
  faq: typeof faqs[0];
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ faq, isOpen, onToggle }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d6b161]"
        aria-expanded={isOpen}
      >
        <span className="text-base font-semibold text-gray-900 dark:text-gray-100 pr-4">{faq.question}</span>
        <span className={`flex-shrink-0 text-[#d6b161] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronRight className="h-5 w-5 rotate-90" />
        </span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {faq.answer}
        </p>
      </motion.div>
    </div>
  );
};

// Main Component
const CourseGermanPage: React.FC = () => {
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      {/* Skip to Content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-[#0a192f] focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-[#d6b161]"
      >
        Skip to content
      </a>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1a365d]">
        <HeroBackground />

        <div className="relative mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-[#d6b161] backdrop-blur-sm"
          >
            <Award className="h-4 w-4" />
            A1 to B2 (CEFR)
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto mb-6 max-w-4xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl"
          >
            German for Study & Work in Germany
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mb-12 max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg"
          >
            Master practical German for relocation, university study, and workplace integration in Germany. Comprehensive CEFR-aligned programs from A1 to B2.
          </motion.p>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-300"
          >
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400" />
              <span>Goethe-Certified</span>
            </div>
            <span className="hidden text-gray-500 sm:block">•</span>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>CEFR-Aligned Curriculum</span>
            </div>
            <span className="hidden text-gray-500 sm:block">•</span>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-emerald-400" />
              <span>Native German Instructors</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Course Levels Section */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
              CEFR-Aligned Levels
            </h2>
            <p className="mx-auto max-w-2xl text-base text-gray-600 dark:text-gray-400">
              Progress systematically through internationally recognized German language levels. Each course prepares you for official certification.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {courseLevels.map((level, index) => (
              <CourseLevelCard
                key={level.id}
                level={level}
                index={index}
                isB1={level.id === 'b1'}
              />
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mx-auto max-w-2xl text-base text-gray-600 dark:text-gray-400">
              Everything you need to know about learning German with us.
            </p>
          </motion.div>

          <div className="mx-auto max-w-3xl space-y-4">
            {faqs.map((faq) => (
              <FAQItem
                key={faq.id}
                faq={faq}
                isOpen={openFAQ === faq.id}
                onToggle={() => setOpenFAQ(openFAQ === faq.id ? null : faq.id)}
              />
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl bg-gradient-to-br from-[#0a192f] to-[#112240] p-8 text-center text-white sm:p-12"
        >
          <Globe className="mx-auto mb-4 h-12 w-12 text-[#d6b161]" />
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl">Begin Your German Journey</h2>
          <p className="mx-auto mb-8 max-w-2xl text-base text-gray-300">
            Start learning German today and unlock opportunities for study and work in Germany. Choose your CEFR level above.
          </p>
          <motion.button
            whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 rounded-lg bg-[#d6b161] px-8 py-4 text-base font-semibold text-[#0a192f] shadow-lg transition-all hover:bg-[#c4a055] focus:outline-none focus:ring-2 focus:ring-[#d6b161] focus:ring-offset-2 focus:ring-offset-[#0a192f]"
          >
            View Courses
            <ChevronRight className="h-5 w-5" />
          </motion.button>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
};

export default CourseGermanPage;
