export const getDashboardPathForRole = (role?: string | null) => {
    switch (String(role || '').trim().toLowerCase()) {
        case 'admin':
            return '/admin-dashboard';
        case 'trainer':
            return '/trainer-dashboard';
        case 'institution':
            return '/institution-dashboard';
        case 'institution_student':
        case 'student':
        default:
            return '/student-dashboard';
    }
};
