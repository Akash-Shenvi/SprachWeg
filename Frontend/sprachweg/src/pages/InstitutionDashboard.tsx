import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2,
    CheckCircle2,
    Globe2,
    LogOut,
    Mail,
    MapPin,
    Phone,
    Plus,
    Send,
    Trash2,
    Users,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { institutionAPI } from '../lib/api';
import { institutionFieldClassName } from '../lib/formStyles';

interface InstitutionProfile {
    _id: string;
    name: string;
    email: string;
    role: string;
    phoneNumber?: string;
    institutionName?: string;
    institutionLogo?: string;
    institutionTagline?: string;
    contactPersonName?: string;
    city?: string;
    state?: string;
    address?: string;
}

interface GermanLevel {
    name: string;
    duration: string;
    price: string;
    outcome: string;
}

interface GermanCourse {
    _id: string;
    title: string;
    levels: GermanLevel[];
}

interface InstitutionSubmission {
    _id: string;
    courseTitle: string;
    levelName: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    studentCount: number;
    students: Array<{ name: string; email: string; createdUserId?: string | null }>;
    rejectionReason?: string | null;
}

interface DashboardResponse {
    institution: InstitutionProfile;
    language: 'German';
    course: GermanCourse | null;
    submissions: InstitutionSubmission[];
}

interface StudentRow {
    id: number;
    name: string;
    email: string;
    password: string;
}

const createStudentRow = (id: number): StudentRow => ({
    id,
    name: '',
    email: '',
    password: '',
});
const MAX_STUDENTS_PER_REQUEST = 25;

const getStatusClasses = (status: InstitutionSubmission['status']) => {
    if (status === 'APPROVED') {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300';
    }

    if (status === 'REJECTED') {
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
    }

    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300';
};

const InstitutionDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
    const [selectedLevelName, setSelectedLevelName] = useState('');
    const [studentRows, setStudentRows] = useState<StudentRow[]>([createStudentRow(1)]);
    const [nextRowId, setNextRowId] = useState(2);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await institutionAPI.getDashboard() as DashboardResponse;
            setDashboardData(response);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load institution dashboard.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchDashboard();
    }, []);

    useEffect(() => {
        if (!selectedLevelName && dashboardData?.course?.levels?.length) {
            setSelectedLevelName(dashboardData.course.levels[0].name);
        }
    }, [dashboardData, selectedLevelName]);

    const handleLogout = () => {
        logout();
        navigate('/institution/login');
    };

    const updateStudentRow = (id: number, key: keyof Omit<StudentRow, 'id'>, value: string) => {
        setStudentRows((current) => current.map((row) => (
            row.id === id ? { ...row, [key]: value } : row
        )));
    };

    const addStudentRow = () => {
        if (studentRows.length >= MAX_STUDENTS_PER_REQUEST) {
            setError(`You can add up to ${MAX_STUDENTS_PER_REQUEST} students in one request.`);
            return;
        }

        setError('');
        setStudentRows((current) => [...current, createStudentRow(nextRowId)]);
        setNextRowId((current) => current + 1);
    };

    const removeStudentRow = (id: number) => {
        setStudentRows((current) => (
            current.length === 1
                ? current
                : current.filter((row) => row.id !== id)
        ));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitting(true);
        setError('');
        setMessage('');

        if (!dashboardData?.course) {
            setError('German course data is not available yet. Please contact admin.');
            setSubmitting(false);
            return;
        }

        const payloadStudents = studentRows.map((row) => ({
            name: row.name.trim(),
            email: row.email.trim().toLowerCase(),
            password: row.password,
        }));

        if (!selectedLevelName) {
            setError('Please select a German level.');
            setSubmitting(false);
            return;
        }

        if (payloadStudents.some((student) => !student.name || !student.email || !student.password)) {
            setError('Every student row must include name, email, and password.');
            setSubmitting(false);
            return;
        }

        const duplicateEmails = payloadStudents
            .map((student) => student.email)
            .filter((email, index, collection) => collection.indexOf(email) !== index);

        if (duplicateEmails.length > 0) {
            setError('Duplicate student emails are not allowed in one submission.');
            setSubmitting(false);
            return;
        }

        if (payloadStudents.length > MAX_STUDENTS_PER_REQUEST) {
            setError(`You can submit up to ${MAX_STUDENTS_PER_REQUEST} students in one request.`);
            setSubmitting(false);
            return;
        }

        try {
            await institutionAPI.createSubmission({
                language: 'German',
                courseTitle: dashboardData.course.title,
                levelName: selectedLevelName,
                students: payloadStudents,
            });

            setMessage('Institution request submitted successfully and is now pending admin approval.');
            setStudentRows([createStudentRow(1)]);
            setNextRowId(2);
            await fetchDashboard();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit institution request.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a192f]">
            <Header />
            <main className="px-4 pt-28 pb-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl space-y-8">
                    <section className="rounded-[2rem] bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#18315a] p-8 text-white shadow-2xl sm:p-10">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-[#f0d79a]">
                                    <Building2 className="h-4 w-4" />
                                    Institution Dashboard
                                </div>
                                <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                                    Submit German course requests for your students.
                                </h1>
                                <p className="mt-4 max-w-3xl text-base leading-7 text-blue-100">
                                    Choose one German level, add student credentials, and submit the batch for admin approval.
                                    Students are activated only after the full request is accepted.
                                </p>
                            </div>

                            <Button
                                type="button"
                                className="rounded-2xl bg-white/10 px-5 py-3 text-white hover:bg-white/20"
                                onClick={handleLogout}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </Button>
                        </div>
                    </section>

                    {error ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                            {error}
                        </div>
                    ) : null}

                    {message ? (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
                            {message}
                        </div>
                    ) : null}

                    {loading ? (
                        <div className="rounded-[2rem] border border-gray-200 bg-white p-10 shadow-sm dark:border-gray-800 dark:bg-[#112240]">
                            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#d6b161] border-t-transparent" />
                        </div>
                    ) : dashboardData ? (
                        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
                            <div className="space-y-8">
                                <section className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-[#112240]">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d6b161]">Institution Profile</p>
                                            <h2 className="mt-3 text-2xl font-bold text-[#0a192f] dark:text-white">
                                                {dashboardData.institution.institutionName || dashboardData.institution.name}
                                            </h2>
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                                Contact person: {dashboardData.institution.contactPersonName || 'Not provided'}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl bg-[#d6b161]/10 p-3 text-[#d6b161]">
                                            <Users className="h-6 w-6" />
                                        </div>
                                    </div>

                                    <div className="mt-6 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-4 w-4 text-[#d6b161]" />
                                            <span>{dashboardData.institution.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-4 w-4 text-[#d6b161]" />
                                            <span>{dashboardData.institution.phoneNumber || 'Phone not provided'}</span>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MapPin className="mt-0.5 h-4 w-4 text-[#d6b161]" />
                                            <span>
                                                {dashboardData.institution.address || 'Address not provided'}
                                                {dashboardData.institution.city || dashboardData.institution.state
                                                    ? `, ${dashboardData.institution.city || ''}${dashboardData.institution.city && dashboardData.institution.state ? ', ' : ''}${dashboardData.institution.state || ''}`
                                                    : ''}
                                            </span>
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-[#112240]">
                                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d6b161]">Request Settings</p>
                                    <div className="mt-6 grid gap-4">
                                        <div className="rounded-2xl bg-[#f8f5ec] p-4 dark:bg-[#0a192f]">
                                            <div className="flex items-center gap-3">
                                                <Globe2 className="h-5 w-5 text-[#d6b161]" />
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Language</p>
                                                    <p className="mt-1 text-base font-semibold text-[#0a192f] dark:text-white">{dashboardData.language}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl bg-[#f8f5ec] p-4 dark:bg-[#0a192f]">
                                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Course</p>
                                            <p className="mt-2 text-base font-semibold text-[#0a192f] dark:text-white">
                                                {dashboardData.course?.title || 'German course not configured'}
                                            </p>
                                        </div>

                                        <label className="block">
                                            <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">German Level</span>
                                            <select
                                                value={selectedLevelName}
                                                onChange={(event) => setSelectedLevelName(event.target.value)}
                                                className={institutionFieldClassName}
                                                disabled={!dashboardData.course}
                                            >
                                                {dashboardData.course?.levels.map((level) => (
                                                    <option key={level.name} value={level.name}>
                                                        {level.name} - {level.duration}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-8">
                                <section className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-[#112240]">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d6b161]">New Submission</p>
                                            <h2 className="mt-3 text-2xl font-bold text-[#0a192f] dark:text-white">Add students for one German level</h2>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="rounded-2xl border-[#d6b161] text-[#d6b161]"
                                            onClick={addStudentRow}
                                            disabled={studentRows.length >= MAX_STUDENTS_PER_REQUEST}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            {studentRows.length >= MAX_STUDENTS_PER_REQUEST ? 'Limit Reached' : 'Add Student'}
                                        </Button>
                                    </div>

                                    <div className="mt-4 rounded-2xl border border-[#d6b161]/20 bg-[#d6b161]/10 px-4 py-3 text-sm text-[#7c6530] dark:border-[#d6b161]/30 dark:bg-[#d6b161]/10 dark:text-[#f0d79a]">
                                        Safe limit: up to {MAX_STUDENTS_PER_REQUEST} students per request.
                                        Current draft: {studentRows.length} student(s).
                                    </div>

                                    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                                        {studentRows.map((row, index) => (
                                            <div
                                                key={row.id}
                                                className="rounded-2xl border border-gray-200 bg-[#fcfbf7] p-5 dark:border-gray-800 dark:bg-[#0a192f]"
                                            >
                                                <div className="mb-4 flex items-center justify-between">
                                                    <p className="text-sm font-semibold text-[#0a192f] dark:text-white">
                                                        Student {index + 1}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeStudentRow(row.id)}
                                                        className="inline-flex items-center gap-1 text-sm font-semibold text-red-500 transition hover:text-red-600"
                                                        disabled={studentRows.length === 1}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Remove
                                                    </button>
                                                </div>

                                                <div className="grid gap-4 md:grid-cols-3">
                                                    <input
                                                        type="text"
                                                        value={row.name}
                                                        onChange={(event) => updateStudentRow(row.id, 'name', event.target.value)}
                                                        className={institutionFieldClassName}
                                                        placeholder="Student name"
                                                        autoComplete="name"
                                                        required
                                                    />
                                                    <input
                                                        type="email"
                                                        value={row.email}
                                                        onChange={(event) => updateStudentRow(row.id, 'email', event.target.value)}
                                                        className={institutionFieldClassName}
                                                        placeholder="student@example.com"
                                                        autoComplete="email"
                                                        required
                                                    />
                                                    <input
                                                        type="password"
                                                        value={row.password}
                                                        onChange={(event) => updateStudentRow(row.id, 'password', event.target.value)}
                                                        className={institutionFieldClassName}
                                                        placeholder="Set login password"
                                                        autoComplete="new-password"
                                                        minLength={6}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                        <Button
                                            type="submit"
                                            className="w-full rounded-2xl bg-[#d6b161] py-3 text-base font-semibold text-[#0a192f] hover:bg-[#c4a055]"
                                            disabled={submitting || !dashboardData.course}
                                        >
                                            <Send className="mr-2 h-4 w-4" />
                                            {submitting ? 'Submitting Request...' : 'Submit for Admin Approval'}
                                        </Button>
                                    </form>
                                </section>

                                <section className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-[#112240]">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d6b161]">Submission History</p>
                                            <h2 className="mt-3 text-2xl font-bold text-[#0a192f] dark:text-white">Track request status</h2>
                                        </div>
                                        <div className="rounded-2xl bg-[#d6b161]/10 px-4 py-2 text-sm font-semibold text-[#d6b161]">
                                            {dashboardData.submissions.length} request(s)
                                        </div>
                                    </div>

                                    <div className="mt-8 space-y-4">
                                        {dashboardData.submissions.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                                No institution requests submitted yet.
                                            </div>
                                        ) : (
                                            dashboardData.submissions.map((submission) => (
                                                <div
                                                    key={submission._id}
                                                    className="rounded-2xl border border-gray-200 bg-[#fcfbf7] p-5 dark:border-gray-800 dark:bg-[#0a192f]"
                                                >
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-[#0a192f] dark:text-white">
                                                                {submission.courseTitle} - {submission.levelName}
                                                            </h3>
                                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                                Submitted on {new Date(submission.createdAt).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(submission.status)}`}>
                                                            {submission.status}
                                                        </span>
                                                    </div>

                                                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                        <CheckCircle2 className="h-4 w-4 text-[#d6b161]" />
                                                        <span>{submission.studentCount} student(s) in this request</span>
                                                    </div>

                                                    {submission.rejectionReason ? (
                                                        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                                                            {submission.rejectionReason}
                                                        </div>
                                                    ) : null}

                                                    <div className="mt-4 flex flex-wrap gap-2">
                                                        {submission.students.map((student) => (
                                                            <div
                                                                key={`${submission._id}-${student.email}`}
                                                                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200 dark:bg-[#112240] dark:text-gray-200 dark:ring-gray-700"
                                                            >
                                                                {student.name} - {student.email}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    ) : null}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default InstitutionDashboard;
