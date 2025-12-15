import React from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import LiveRecordedToggle from './LiveRecordedToggle';
export interface CourseHeroProps {
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
  const y = useTransform(scrollY, [0, 200], [0, shouldReduceMotion ? 0 : -40]);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1a365d]">
      {/* Subtle parallax background orb */}
      <motion.div
        style={{ y }}
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-32 h-72 w-72 rounded-full bg-[#d6b161]/20 blur-3xl"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pt-28 pb-16 text-center sm:px-6 lg:px-8 lg:pt-32 lg:pb-20">
        {levelBadge && (
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-4 inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[#d6b161]"
          >
            {levelBadge}
          </motion.span>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 24, scale: shouldReduceMotion ? 1 : 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-4 max-w-3xl font-serif text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mx-auto mb-8 max-w-2xl text-sm text-gray-300 sm:text-base"
        >
          {subtitle}
        </motion.p>

        {/* Action Buttons for Scroll */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <LiveRecordedToggle
            isLiveActive={activeTrack === 'LIVE'}
            onLiveClick={() => onTrackChange('LIVE')}
            onRecordedClick={() => onTrackChange('RECORDED')}
            hasLiveSession={hasLiveSession}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-4 text-xs text-gray-400"
        >
          <span>
            {activeTrack === 'LIVE' ? '✨ Interactive Live Classes' : '📹 Self-Paced Learning'}
          </span>
          <span>•</span>
          <span>
            {activeTrack === 'LIVE' ? '👥 Cohort Based' : '♾️ Lifetime Access'}
          </span>
        </motion.div>
      </div>
    </section>
  );
};

export default CourseHero;


