export const LEARNER_ROLES = ['student', 'institution_student'] as const;

export const isLearnerRole = (role?: string | null) =>
    LEARNER_ROLES.includes(String(role || '').trim().toLowerCase() as (typeof LEARNER_ROLES)[number]);
