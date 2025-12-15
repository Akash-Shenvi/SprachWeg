import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, AnimatePresence, useMotionValue, useAnimationFrame, useInView } from 'framer-motion';
import { Star, Check, Users, Award, TrendingUp, Clock, Calendar, Download, Share2, Bookmark, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { englishCourseData } from '../lib/courseData';
import type { Batch, CurriculumModule, FAQItem, PricingPlan, Review, Trainer, CurriculumItemType, CurriculumItem } from '../lib/courseData';


// --- COMPONENTS ---

// Enterprise Components (New)

// Course Stats Component - Shows key metrics with animated counters
const CourseStats: React.FC<{ activeTrack: 'LIVE' | 'RECORDED' }> = ({ activeTrack }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const stats = [
    { value: 1247, suffix: '+', label: 'Students Enrolled', icon: Users },
    { value: 4.8, suffix: '★', label: 'Average Rating', icon: Star },
    { value: 98, suffix: '%', label: 'Completion Rate', icon: TrendingUp },
    { value: activeTrack === 'LIVE' ? 12 : 24, suffix: activeTrack === 'LIVE' ? ' weeks' : '/7', label: 'Course Duration', icon: Clock }
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-2 gap-4 sm:grid-cols-4 mt-8"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="flex flex-col items-center text-center p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-colors"
        >
          <stat.icon className="h-5 w-5 text-[#d6b161] mb-2" />
          <div className="text-2xl font-bold text-white">
            {stat.value}{stat.suffix}
          </div>
          <div className="text-xs text-gray-300 mt-1">{stat.label}</div>
        </motion.div>
      ))}
    </motion.div>
  );
};

// Trust Badges Component - Shows guarantees and benefits
const TrustBadges: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="flex flex-wrap items-center justify-center gap-6 mt-8 text-xs text-gray-300"
    >
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4 text-emerald-400" />
        <span>Money-back guarantee</span>
      </div>
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4 text-emerald-400" />
        <span>Lifetime access</span>
      </div>
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4 text-emerald-400" />
        <span>Certificate included</span>
      </div>
    </motion.div>
  );
};


// 1. LiveRecordedToggle (Enhanced)
interface LiveRecordedToggleProps {
  isLiveActive: boolean;
  onLiveClick: () => void;
  onRecordedClick: () => void;
  hasLiveSession?: boolean;
}

const LiveRecordedToggle: React.FC<LiveRecordedToggleProps> = ({
  isLiveActive,
  onLiveClick,
  onRecordedClick,
  hasLiveSession = false,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="inline-flex items-center rounded-xl bg-white/10 p-1.5 backdrop-blur-sm border border-white/20">
      <motion.button
        type="button"
        onClick={onLiveClick}
        aria-pressed={isLiveActive}
        aria-label={hasLiveSession ? 'Join live class, currently live' : 'View live class schedule'}
        whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
        className={`relative inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-semibold text-base transition-all duration-200 min-w-[140px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b161] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${isLiveActive
          ? 'bg-[#d6b161] text-[#0a192f] shadow-lg'
          : 'text-white/70 hover:text-white'
          }`}
      >
        {hasLiveSession && isLiveActive && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        )}
        <span className={`h-2 w-2 rounded-full ${isLiveActive ? 'bg-red-500' : 'bg-white/50'}`} aria-hidden="true" />
        <span>Live</span>
      </motion.button>

      <motion.button
        type="button"
        onClick={onRecordedClick}
        aria-pressed={!isLiveActive}
        aria-label="View recorded classes"
        whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
        className={`inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-semibold text-base transition-all duration-200 min-w-[140px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b161] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${!isLiveActive
          ? 'bg-[#d6b161] text-[#0a192f] shadow-lg'
          : 'text-white/70 hover:text-white'
          }`}
      >
        <span>Recorded</span>
      </motion.button>
    </div>
  );
};


// 2. CourseHero (Enhanced)
interface CourseHeroProps {
  title: string;
  subtitle: string;
  levelBadge?: string;
  hasLiveSession?: boolean;
  activeTrack: 'LIVE' | 'RECORDED';
  onTrackChange: (track: 'LIVE' | 'RECORDED') => void;
}

const CourseHero: React.FC<CourseHeroProps> = ({
  title,
  subtitle,
  levelBadge,
  hasLiveSession,
  activeTrack,
  onTrackChange,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, shouldReduceMotion ? 0 : -50]);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1a365d]">
      {/* Decorative background elements */}
      <motion.div
        style={{ y }}
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#d6b161]/20 blur-3xl"
      />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pt-40 pb-24 text-center sm:px-6 lg:px-8">
        {/* Level Badge */}
        {levelBadge && (
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#d6b161] border border-white/20 backdrop-blur-sm shadow-lg"
          >
            <Award className="h-4 w-4" />
            {levelBadge}
          </motion.span>
        )}

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30, scale: shouldReduceMotion ? 1 : 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-6 max-w-4xl font-serif text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl"
        >
          {title}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg"
        >
          {subtitle}
        </motion.p>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <LiveRecordedToggle
            isLiveActive={activeTrack === 'LIVE'}
            onLiveClick={() => onTrackChange('LIVE')}
            onRecordedClick={() => onTrackChange('RECORDED')}
            hasLiveSession={hasLiveSession}
          />
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-300 mb-4"
        >
          <span className="flex items-center gap-2">
            {activeTrack === 'LIVE' ? '✨' : '📹'}
            <span>{activeTrack === 'LIVE' ? 'Interactive Live Classes' : 'Self-Paced Learning'}</span>
          </span>
          <span className="hidden text-gray-500 sm:block">•</span>
          <span className="flex items-center gap-2">
            {activeTrack === 'LIVE' ? '👥' : '♾️'}
            <span>{activeTrack === 'LIVE' ? 'Cohort Based' : 'Lifetime Access'}</span>
          </span>
        </motion.div>

        {/* Course Stats */}
        <CourseStats activeTrack={activeTrack} />

        {/* Trust Badges */}
        <TrustBadges />
      </div>
    </section>
  );
};

// 3. BatchCard (Enhanced)
interface BatchCardProps {
  batch: Batch;
}

const BatchCard: React.FC<BatchCardProps> = ({ batch }) => {
  const isAlmostFull = batch.seatsLeft > 0 && batch.seatsLeft <= 5;
  const capacityPercent = batch.seatsLeft > 0 ? (batch.seatsLeft / 20) * 100 : 0; // Assuming max 20 seats

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-200 dark:border-gray-700 dark:bg-gray-800"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#d6b161]">
            Upcoming batch
          </p>
          {batch.isWaitlist && (
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
              Waitlist
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4 text-[#d6b161]" />
          <p className="text-base font-bold text-[#0a192f] dark:text-gray-50">
            {batch.startDate}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          <span>{batch.time} ({batch.timezone})</span>
        </div>
      </div>

      {/* Capacity Bar */}
      {!batch.isWaitlist && batch.seatsLeft > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {batch.seatsLeft} seats remaining
            </p>
            {isAlmostFull && (
              <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                <TrendingUp className="h-3 w-3" />
                Filling fast
              </span>
            )}
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${100 - capacityPercent}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className={`h-full rounded-full ${isAlmostFull ? 'bg-red-500' : 'bg-emerald-500'
                }`}
            />
          </div>
        </div>
      )}

      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#0a192f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#112240] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b161] focus-visible:ring-offset-2 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200"
      >
        {batch.isWaitlist ? 'Join Waitlist' : 'Enroll in this Batch'}
        <ChevronRight className="h-4 w-4" />
      </motion.button>
    </motion.div>
  );
};

// 4. PricingCard (Enhanced)
interface PricingCardProps {
  plan: PricingPlan;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan }) => {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      className={`relative flex flex-col rounded-xl border bg-white p-8 shadow-md hover:shadow-xl transition-all duration-300 dark:bg-gray-800 ${plan.isBestValue
          ? 'border-[#d6b161] ring-2 ring-[#d6b161]/30 shadow-lg'
          : 'border-gray-200 dark:border-gray-700'
        }`}
    >
      {plan.isBestValue && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#d6b161] to-[#c4a055] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#0a192f] shadow-lg">
            <Award className="h-3.5 w-3.5" />
            Best Value
          </span>
        </motion.div>
      )}

      {plan.discountLabel && (
        <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
          <TrendingUp className="h-3 w-3" />
          {plan.discountLabel}
        </span>
      )}

      <h3 className={`${plan.isBestValue ? 'mt-6' : 'mt-2'} text-lg font-bold text-[#0a192f] dark:text-gray-50`}>
        {plan.name}
      </h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{plan.description}</p>

      <div className="mt-6 mb-8">
        <p className="text-4xl font-bold text-[#0a192f] dark:text-gray-50">{plan.price}</p>
      </div>

      <ul className="mb-8 space-y-4 text-sm text-gray-700 dark:text-gray-300">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
            <span className="leading-relaxed">{feature}</span>
          </li>
        ))}
      </ul>

      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        className={`mt-auto inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-lg px-6 py-4 text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${plan.isBestValue
            ? 'bg-gradient-to-r from-[#d6b161] to-[#c4a055] text-[#0a192f] shadow-lg hover:shadow-xl focus-visible:ring-[#d6b161]'
            : 'bg-[#0a192f] text-white shadow-md hover:bg-[#112240] dark:bg-gray-700 dark:hover:bg-gray-600 focus-visible:ring-[#d6b161]'
          }`}
      >
        Secure Payment
        <ChevronRight className="h-4 w-4" />
      </motion.button>

      {plan.isBestValue && (
        <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          30-day money-back guarantee
        </p>
      )}
    </motion.div>
  );
};

// 5. CurriculumAccordion
interface CurriculumAccordionProps {
  modules: CurriculumModule[];
}

const badgeColors: Record<CurriculumItemType, string> = {
  LIVE: 'bg-red-500/10 text-red-500 border-red-500/40',
  RECORDED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40',
  NEW: 'bg-[#d6b161]/10 text-[#d6b161] border-[#d6b161]/40',
};

const CurriculumAccordion: React.FC<CurriculumAccordionProps> = ({ modules }) => {
  const [openId, setOpenId] = useState<string | null>(modules[0]?.id ?? null);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="space-y-3">
      {modules.map((module) => {
        const isOpen = module.id === openId;

        return (
          <div
            key={module.id}
            className="rounded-2xl border border-gray-200/70 bg-white/70 p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900/70"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : module.id)}
              aria-expanded={isOpen}
              aria-controls={`curriculum-panel-${module.id}`}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b161]"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#d6b161]">
                  {module.weekLabel}
                </p>
                <p className="text-sm font-semibold text-[#0a192f] dark:text-gray-50">
                  {module.title}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                  {module.summary}
                </p>
              </div>
              <span
                className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                aria-hidden="true"
              >
                {isOpen ? '−' : '+'}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`curriculum-panel-${module.id}`}
                  initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
                  animate={shouldReduceMotion ? { opacity: 1, height: 'auto' } : { opacity: 1, height: 'auto' }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                    {module.items.map((item, index) => (
                      <div
                        key={`${module.id}-${index}-${item.title}`}
                        className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-3 py-2 text-xs dark:bg-gray-800/60"
                      >
                        <div>
                          <p className="font-medium text-[#0a192f] dark:text-gray-100">{item.title}</p>
                          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                            {item.duration}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${badgeColors[item.type]}`}
                        >
                          {item.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

// 6. TrainerCard
interface TrainerCardProps {
  trainer: Trainer;
}

const TrainerCard: React.FC<TrainerCardProps> = ({ trainer }) => {
  return (
    <article className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <img
        src={trainer.avatarUrl}
        alt={trainer.name}
        className="mb-3 h-16 w-16 rounded-full object-cover"
        loading="lazy"
      />
      <h3 className="text-sm font-semibold text-[#0a192f] dark:text-gray-50">{trainer.name}</h3>
      <p className="mt-0.5 text-xs font-medium text-[#d6b161]">{trainer.role}</p>
      <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">{trainer.bio}</p>

      <div className="mt-3 flex gap-3">
        {trainer.linkedinUrl && (
          <a
            href={trainer.linkedinUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#0a192f] underline-offset-2 hover:underline dark:text-gray-100"
          >
            LinkedIn
          </a>
        )}
        {trainer.twitterUrl && (
          <a
            href={trainer.twitterUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#0a192f] underline-offset-2 hover:underline dark:text-gray-100"
          >
            Twitter
          </a>
        )}
      </div>
    </article>
  );
};

// 7. ReviewsList
interface ReviewsListProps {
  rating: number;
  totalReviews: number;
  students: number;
  reviews: Review[];
}

const AnimatedCounter: React.FC<{ value: number; suffix?: string }> = ({ value, suffix }) => {
  const shouldReduceMotion = useReducedMotion();
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useAnimationFrame((t) => {
    if (shouldReduceMotion) {
      count.set(value);
      return;
    }
    const progress = Math.min(t / 800, 1);
    count.set(progress * value);
  });

  return (
    <span className="font-semibold text-[#0a192f] dark:text-gray-50">
      {shouldReduceMotion ? value : (rounded as unknown as number)}
      {suffix}
    </span>
  );
};

const ReviewsList: React.FC<ReviewsListProps> = ({
  rating,
  totalReviews,
  students,
  reviews,
}) => {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
      <div className="grid gap-4 md:grid-cols-[2fr,minmax(0,3fr)]">
        <div className="flex flex-col justify-center gap-3 border-b border-gray-100 pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#0a192f] dark:text-gray-50">
              {rating.toFixed(1)}
            </span>
            <div className="flex">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={`h-4 w-4 ${index < Math.round(rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 dark:text-gray-600'
                    }`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Based on <AnimatedCounter value={totalReviews} /> verified reviews
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Trusted by <AnimatedCounter value={students} suffix="+" /> learners
          </p>
        </div>

        <div className="space-y-3">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl bg-gray-50 p-3 text-xs dark:bg-gray-800/60"
            >
              <p className="text-gray-700 dark:text-gray-100">“{review.quote}”</p>
              <p className="mt-2 text-[11px] font-semibold text-[#0a192f] dark:text-gray-50">
                {review.name}{' '}
                <span className="font-normal text-gray-500 dark:text-gray-400">
                  • {review.role}
                </span>
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

// 8. FAQAccordion
interface FAQAccordionProps {
  items: FAQItem[];
}

const FAQAccordion: React.FC<FAQAccordionProps> = ({ items }) => {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const isOpen = item.id === openId;
        return (
          <div
            key={item.id}
            className="rounded-2xl border border-gray-200 bg-white/80 p-3 dark:border-gray-700 dark:bg-gray-900/80"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${item.id}`}
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b161]"
            >
              <span className="text-sm font-medium text-[#0a192f] dark:text-gray-50">
                {item.question}
              </span>
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                aria-hidden="true"
              >
                {isOpen ? '−' : '+'}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`faq-panel-${item.id}`}
                  initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
                  animate={shouldReduceMotion ? { opacity: 1, height: 'auto' } : { opacity: 1, height: 'auto' }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

const CourseEnglishPage: React.FC = () => {
  const navigate = useNavigate();
  // Using English Data directly
  const course = englishCourseData;
  const [activeTrack, setActiveTrack] = React.useState<'LIVE' | 'RECORDED'>('LIVE');

  useEffect(() => {
    document.title = course.metaTitle;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute('content', course.metaDescription);
    }
  }, [course.metaTitle, course.metaDescription]);

  const activePricing = activeTrack === 'LIVE' ? course.pricingLive : course.pricingRecorded;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-50">
      <Header />

      {/* Breadcrumbs + back */}
      <nav
        aria-label="Breadcrumb"
        className="border-b border-gray-100 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-xs sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-full border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-[#0a192f] hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b161] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
            >
              ← Back
            </button>
            <span className="hidden sm:inline" aria-hidden="true">
              /
            </span>
            <ol className="hidden items-center gap-1 sm:flex">
              <li>
                <Link to="/" className="hover:underline">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link to="/language-training" className="hover:underline">
                  Courses
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="font-semibold text-[#0a192f] dark:text-gray-50">
                {course.hero.title}
              </li>
            </ol>
          </div>
        </div>
      </nav>

      <CourseHero
        title={course.hero.title}
        subtitle={course.hero.subtitle}
        levelBadge={course.hero.levelBadge}
        hasLiveSession={course.hero.hasLiveSession}
        activeTrack={activeTrack}
        onTrackChange={setActiveTrack}
      />

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        {/* Overview */}
        <section className="grid gap-8 rounded-3xl bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:bg-gray-900/80 md:grid-cols-[3fr,2fr]">
          <div>
            <h2 className="text-base font-semibold text-[#0a192f] dark:text-gray-50">
              Course overview
            </h2>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
              {course.overview.summary}
            </p>
            <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#d6b161]">
              What you will learn
            </h3>
            <ul className="mt-2 space-y-1.5 text-xs text-gray-700 dark:text-gray-200">
              {course.overview.outcomes.map((outcome) => (
                <li key={outcome} className="flex items-start gap-1.5">
                  <span
                    className="mt-[3px] h-1.5 w-1.5 rounded-full bg-[#d6b161]"
                    aria-hidden="true"
                  />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[#d6b161]">
              Who is this for
            </h3>
            <ul className="mt-2 space-y-1.5 text-xs text-gray-700 dark:text-gray-200">
              {course.overview.whoIsFor.map((item) => (
                <li key={item} className="flex items-start gap-1.5">
                  <span
                    className="mt-[3px] h-1.5 w-1.5 rounded-full bg-[#0a192f]"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Curriculum & Batches */}
        <section className="grid gap-8 md:grid-cols-[3fr,2fr]">
          <div id="curriculum">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#0a192f] dark:text-gray-50">
                Curriculum ({activeTrack === 'LIVE' ? 'Live + Recorded' : 'Self-Paced'})
              </h2>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {activeTrack === 'LIVE' ? 'Interactive Modules' : 'Video Library Access'}
              </span>
            </div>
            <CurriculumAccordion modules={course.curriculum} />
          </div>

          <div>
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              key={activeTrack}
              transition={{ duration: 0.3 }}
            >
              {activeTrack === 'LIVE' ? (
                <>
                  <h2 className="mb-3 text-base font-semibold text-[#0a192f] dark:text-gray-50">
                    Upcoming live batches
                  </h2>
                  <div className="grid gap-3">
                    {course.batchesLive.map((batch) => (
                      <BatchCard key={batch.id} batch={batch} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                  <h3 className="font-semibold text-[#0a192f] dark:text-white mb-2">Self-Paced Learning</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Start learning immediately with our comprehensive video library. No waiting for batches!
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Instant Access
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Lifetime Validity
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Learn at your pace
                    </li>
                  </ul>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Trainers & Pricing */}
        <section className="grid gap-8 md:grid-cols-[3fr,2fr]">
          <div>
            <h2 className="mb-3 text-base font-semibold text-[#0a192f] dark:text-gray-50">
              Meet your trainers
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {course.trainers.map((trainer) => (
                <TrainerCard key={trainer.id} trainer={trainer} />
              ))}
            </div>
          </div>

          <div id="pricing">
            <h2 className="mb-3 text-base font-semibold text-[#0a192f] dark:text-gray-50">
              Pricing & plans ({activeTrack === 'LIVE' ? 'Live' : 'Recorded'})
            </h2>
            <motion.div
              className="grid gap-3"
              layout
            >
              {activePricing.map((plan) => (
                <PricingCard key={plan.id} plan={plan} />
              ))}
            </motion.div>
          </div>
        </section>

        {/* Reviews */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-[#0a192f] dark:text-gray-50">
            Reviews & outcomes
          </h2>
          <ReviewsList
            rating={course.reviewsSummary.rating}
            totalReviews={course.reviewsSummary.totalReviews}
            students={course.reviewsSummary.students}
            reviews={course.reviews}
          />
        </section>

        {/* FAQ */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-[#0a192f] dark:text-gray-50">
            Frequently asked questions
          </h2>
          <FAQAccordion items={course.faq} />
        </section>
      </main>

      {/* Sticky enroll bar */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="sticky bottom-0 z-30 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(15,23,42,0.25)] backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/95"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold text-[#0a192f] dark:text-gray-50">
              Ready to start?
            </p>
            <p className="text-[11px] text-gray-600 dark:text-gray-400">
              {activeTrack === 'LIVE'
                ? 'Secure your seat in the next live cohort.'
                : 'Get instant access to all recorded lessons.'}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-[#d6b161] px-4 py-2 text-xs font-semibold text-[#0a192f] shadow-md hover:bg-[#c4a055] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b161]"
              onClick={() => {
                const pricingSection = document.getElementById('pricing');
                pricingSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              {activeTrack === 'LIVE' ? 'Enroll in Live Batch' : 'Buy Recorded Course'}
            </button>
            <button
              type="button"
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[#0a192f]/20 px-4 py-2 text-xs font-semibold text-[#0a192f] hover:bg-[#0a192f]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b161] dark:border-gray-600 dark:text-gray-50 dark:hover:bg-gray-800"
            >
              Talk to academic advisor
            </button>
          </div>
        </div>
      </motion.div>

      <Footer />
    </div>
  );
};

export default CourseEnglishPage;
