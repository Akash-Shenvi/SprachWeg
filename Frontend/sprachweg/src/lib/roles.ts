export const isLearnerRole = (role?: string | null) => {
    const normalizedRole = String(role || '').trim().toLowerCase();
    return normalizedRole === 'student' || normalizedRole === 'institution_student';
};

export const isInstitutionStudentRole = (role?: string | null) =>
    String(role || '').trim().toLowerCase() === 'institution_student';

export const formatRoleLabel = (role?: string | null) => {
    const normalizedRole = String(role || '').trim();
    if (!normalizedRole) {
        return 'User';
    }

    return normalizedRole
        .split('_')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};
