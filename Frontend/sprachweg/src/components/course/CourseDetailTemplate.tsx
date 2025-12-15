import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import CourseHero from './CourseHero';
import CurriculumAccordion from './CurriculumAccordion';
import BatchCard from './BatchCard';
import TrainerCard from './TrainerCard';
import PricingCard from './PricingCard';
import ReviewsList from './ReviewsList';
import FAQAccordion from './FAQAccordion';
import type { CourseData } from '../../lib/courseData';
import { Link, useNavigate } from 'react-router-dom';

export interface CourseDetailTemplateProps {
  course: CourseData;
}

const CourseDetailTemplate: React.FC<CourseDetailTemplateProps> = ({ course }) => {
  const navigate = useNavigate();
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

export default CourseDetailTemplate;


