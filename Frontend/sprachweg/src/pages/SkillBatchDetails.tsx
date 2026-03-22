import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bell, BookOpen, ExternalLink, FileText, Users, Video } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import api, { getAssetUrl } from '../lib/api';

type TabKey = 'materials' | 'announcements' | 'students' | 'classes';

interface SkillBatchSummary {
    _id: string;
    name: string;
    isActive: boolean;
    schedule: { days: string[]; startTime: string; endTime: string };
    startDate: string | null;
    endDate: string | null;
    studentCount: number;
    trainer: { _id: string | null; name: string; email: string } | null;
    course: {
        _id: string | null;
        title: string;
        subtitle: string;
        description: string;
        level: string;
        category: string;
        duration: string;
        image: string;
        features: string[];
    };
}

interface AnnouncementItem {
    _id: string;
    title: string;
    content: string;
    isPinned: boolean;
    createdAt: string;
}

interface MaterialItem {
    _id: string;
    type: 'overview' | 'assignment' | 'class-resource';
    title: string;
    subtitle?: string;
    description: string;
    createdAt: string;
    dueDate?: string | null;
    attachments: string[];
    highlights: string[];
    submissionStatus?: string | null;
    feedback?: string;
    grade?: number | null;
}

interface StudentItem {
    _id: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    qualification?: string;
    avatar?: string;
}

interface ClassItem {
    _id: string;
    topic: string;
    startTime: string;
    endTime: string;
    meetingLink?: string;
    status: 'scheduled' | 'live' | 'completed' | 'cancelled';
    resources: string[];
    recordings: string[];
}

const formatDate = (value?: string | null) => {
    if (!value) return 'Not scheduled';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not scheduled';
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};

const formatDateTime = (value?: string | null) => {
    if (!value) return 'Not scheduled';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not scheduled';
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
};

const SkillBatchDetails: React.FC = () => {
    const { batchId } = useParams<{ batchId: string }>();
    const navigate = useNavigate();
    const [batch, setBatch] = useState<SkillBatchSummary | null>(null);
    const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
    const [materials, setMaterials] = useState<MaterialItem[]>([]);
    const [students, setStudents] = useState<StudentItem[]>([]);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [activeTab, setActiveTab] = useState<TabKey>('materials');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!batchId) {
            setError('Skill batch not found.');
            setLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                const [detailsRes, announcementsRes, materialsRes, studentsRes, classesRes] = await Promise.all([
                    api.get(`/skill-batches/${batchId}`),
                    api.get(`/skill-batches/${batchId}/announcements`, { params: { page: 1, limit: 50 } }),
                    api.get(`/skill-batches/${batchId}/materials`, { params: { page: 1, limit: 50 } }),
                    api.get(`/skill-batches/${batchId}/students`, { params: { page: 1, limit: 50 } }),
                    api.get(`/skill-batches/${batchId}/classes`, { params: { page: 1, limit: 50 } }),
                ]);

                setBatch(detailsRes.data);
                setAnnouncements(announcementsRes.data.data || []);
                setMaterials(materialsRes.data.data || []);
                setStudents(studentsRes.data.data || []);
                setClasses(classesRes.data.data || []);
            } catch (loadError) {
                console.error('Failed to load skill batch details:', loadError);
                setError('We could not load this skill batch right now.');
            } finally {
                setLoading(false);
            }
        };

        void loadData();
    }, [batchId]);

    const scheduleSummary = batch?.schedule?.days?.length
        ? `${batch.schedule.days.join(', ')}${batch.schedule.startTime ? ` • ${batch.schedule.startTime}` : ''}${batch.schedule.endTime ? ` - ${batch.schedule.endTime}` : ''}`
        : 'Schedule will be shared soon';

    const tabCounts = {
        materials: materials.length,
        announcements: announcements.length,
        students: students.length,
        classes: classes.length,
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020817]">
            <Header />
            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <button
                    type="button"
                    onClick={() => navigate('/student-dashboard')}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#d6b161] hover:text-[#d6b161] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to dashboard
                </button>

                {loading ? (
                    <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-300">Loading skill batch...</p>
                    </div>
                ) : error || !batch ? (
                    <div className="mt-8 rounded-3xl border border-rose-200 bg-white p-10 shadow-sm dark:border-rose-500/30 dark:bg-slate-900">
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Skill batch unavailable</h1>
                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{error || 'This batch could not be found.'}</p>
                    </div>
                ) : (
                    <>
                        <section className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
                            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                                <div className="p-8 sm:p-10">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="rounded-full bg-[#d6b161]/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#d6b161]">Skill Batch</span>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${batch.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>{batch.isActive ? 'Active' : 'Inactive'}</span>
                                    </div>
                                    <h1 className="mt-5 text-3xl font-bold text-slate-950 dark:text-white sm:text-4xl">{batch.course.title}</h1>
                                    <p className="mt-3 text-lg font-medium text-[#d6b161]">{batch.name}</p>
                                    <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{batch.course.description}</p>
                                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/70">
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Trainer</p>
                                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{batch.trainer?.name || 'Not assigned yet'}</p>
                                        </div>
                                        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/70">
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Schedule</p>
                                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{scheduleSummary}</p>
                                        </div>
                                        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/70">
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Start Date</p>
                                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{formatDate(batch.startDate)}</p>
                                        </div>
                                        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/70">
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Duration</p>
                                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{batch.course.duration || 'Shared by trainer'}</p>
                                        </div>
                                    </div>
                                    {batch.course.features.length > 0 && (
                                        <div className="mt-6 flex flex-wrap gap-2">
                                            {batch.course.features.map((feature) => (
                                                <span key={feature} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">{feature}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="border-t border-slate-200 bg-slate-950 p-8 text-white dark:border-slate-800 lg:border-l lg:border-t-0">
                                    {batch.course.image ? (
                                        <img src={getAssetUrl(batch.course.image)} alt={batch.course.title} className="h-56 w-full rounded-[1.75rem] object-cover shadow-2xl" />
                                    ) : (
                                        <div className="flex h-56 w-full items-center justify-center rounded-[1.75rem] bg-white/5">
                                            <BookOpen className="h-10 w-10 text-[#d6b161]" />
                                        </div>
                                    )}
                                    <div className="mt-6 grid grid-cols-2 gap-4">
                                        <div className="rounded-2xl bg-white/5 p-4">
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Students</p>
                                            <p className="mt-2 text-2xl font-semibold">{batch.studentCount}</p>
                                        </div>
                                        <div className="rounded-2xl bg-white/5 p-4">
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Category</p>
                                            <p className="mt-2 text-sm font-semibold">{batch.course.category || 'Skill training'}</p>
                                        </div>
                                        <div className="rounded-2xl bg-white/5 p-4">
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Level</p>
                                            <p className="mt-2 text-sm font-semibold">{batch.course.level || 'Professional'}</p>
                                        </div>
                                        <div className="rounded-2xl bg-white/5 p-4">
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Batch Window</p>
                                            <p className="mt-2 text-sm font-semibold">{`${formatDate(batch.startDate)} to ${formatDate(batch.endDate)}`}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="mt-8">
                            <div className="flex flex-wrap gap-3">
                                {([
                                    ['materials', 'Materials', <BookOpen className="h-4 w-4" />],
                                    ['announcements', 'Announcements', <Bell className="h-4 w-4" />],
                                    ['students', 'Students', <Users className="h-4 w-4" />],
                                    ['classes', 'Classes', <Video className="h-4 w-4" />],
                                ] as Array<[TabKey, string, React.ReactNode]>).map(([key, label, icon]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setActiveTab(key)}
                                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${activeTab === key ? 'border-[#d6b161] bg-[#d6b161] text-[#0a192f]' : 'border-slate-200 bg-white text-slate-700 hover:border-[#d6b161] hover:text-[#d6b161] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'}`}
                                    >
                                        {icon}
                                        <span>{label}</span>
                                        <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === key ? 'bg-[#0a192f]/10 text-[#0a192f]' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>{tabCounts[key]}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6 space-y-4">
                                {activeTab === 'materials' && materials.map((material) => (
                                    <article key={material._id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="rounded-full bg-[#d6b161]/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#d6b161]">{material.type === 'overview' ? 'Course overview' : material.type === 'assignment' ? 'Assignment' : 'Class resource'}</span>
                                            <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{formatDateTime(material.createdAt)}</span>
                                            {material.dueDate && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">Due {formatDate(material.dueDate)}</span>}
                                        </div>
                                        <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">{material.title}</h3>
                                        {material.subtitle && <p className="mt-1 text-sm font-medium text-[#d6b161]">{material.subtitle}</p>}
                                        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{material.description}</p>
                                        {material.highlights.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{material.highlights.map((highlight) => <span key={`${material._id}-${highlight}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">{highlight}</span>)}</div>}
                                        {(material.submissionStatus || material.feedback || (material.grade !== null && material.grade !== undefined)) && <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-950/70 dark:text-slate-300">{material.submissionStatus && <p><span className="font-semibold text-slate-900 dark:text-white">Submission:</span> {material.submissionStatus}</p>}{material.grade !== null && material.grade !== undefined && <p className="mt-2"><span className="font-semibold text-slate-900 dark:text-white">Grade:</span> {material.grade}</p>}{material.feedback && <p className="mt-2"><span className="font-semibold text-slate-900 dark:text-white">Feedback:</span> {material.feedback}</p>}</div>}
                                        {material.attachments.length > 0 && <div className="mt-5 flex flex-wrap gap-3">{material.attachments.map((attachment, index) => <a key={`${material._id}-${attachment}-${index}`} href={getAssetUrl(attachment)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-[#0a192f] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 dark:bg-[#d6b161] dark:text-[#0a192f]"><FileText className="h-4 w-4" />Open file {index + 1}</a>)}</div>}
                                    </article>
                                ))}

                                {activeTab === 'announcements' && announcements.map((announcement) => (
                                    <article key={announcement._id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                        <div className="flex flex-wrap items-center gap-3">
                                            {announcement.isPinned && <span className="rounded-full bg-[#d6b161]/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#d6b161]">Pinned</span>}
                                            <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{formatDateTime(announcement.createdAt)}</span>
                                        </div>
                                        <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">{announcement.title}</h3>
                                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{announcement.content}</p>
                                    </article>
                                ))}

                                {activeTab === 'students' && <div className="grid gap-4 md:grid-cols-2">{students.map((student) => (
                                    <article key={student._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                        <div className="flex items-center gap-4">
                                            {student.avatar ? <img src={getAssetUrl(student.avatar)} alt={student.name} className="h-14 w-14 rounded-2xl object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d6b161]/15 text-lg font-semibold text-[#d6b161]">{student.name.slice(0, 1).toUpperCase()}</div>}
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{student.name}</h3>
                                                {student.email && <p className="text-sm text-slate-600 dark:text-slate-300">{student.email}</p>}
                                            </div>
                                        </div>
                                        {(student.phoneNumber || student.qualification) && <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-950/70 dark:text-slate-300">{student.phoneNumber && <p><span className="font-semibold text-slate-900 dark:text-white">Phone:</span> {student.phoneNumber}</p>}{student.qualification && <p className="mt-2"><span className="font-semibold text-slate-900 dark:text-white">Qualification:</span> {student.qualification}</p>}</div>}
                                    </article>
                                ))}</div>}

                                {activeTab === 'classes' && classes.map((skillClass) => (
                                    <article key={skillClass._id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="rounded-full bg-[#d6b161]/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#d6b161]">{skillClass.status}</span>
                                            <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{formatDateTime(skillClass.startTime)}</span>
                                        </div>
                                        <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">{skillClass.topic}</h3>
                                        <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-950/70 dark:text-slate-300 md:grid-cols-2">
                                            <p><span className="font-semibold text-slate-900 dark:text-white">Starts:</span> {formatDateTime(skillClass.startTime)}</p>
                                            <p><span className="font-semibold text-slate-900 dark:text-white">Ends:</span> {formatDateTime(skillClass.endTime)}</p>
                                        </div>
                                        <div className="mt-5 flex flex-wrap gap-3">
                                            {skillClass.meetingLink && <a href={skillClass.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-[#0a192f] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 dark:bg-[#d6b161] dark:text-[#0a192f]"><ExternalLink className="h-4 w-4" />Join class</a>}
                                            {skillClass.resources.map((resource, index) => <a key={`${skillClass._id}-resource-${index}`} href={getAssetUrl(resource)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#d6b161] hover:text-[#d6b161] dark:border-slate-700 dark:text-slate-200"><FileText className="h-4 w-4" />Resource {index + 1}</a>)}
                                            {skillClass.recordings.map((recording, index) => <a key={`${skillClass._id}-recording-${index}`} href={getAssetUrl(recording)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#d6b161] hover:text-[#d6b161] dark:border-slate-700 dark:text-slate-200"><Video className="h-4 w-4" />Recording {index + 1}</a>)}
                                        </div>
                                    </article>
                                ))}

                                {activeTab === 'materials' && materials.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">No materials shared yet for this skill batch.</div>}
                                {activeTab === 'announcements' && announcements.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">No announcements shared yet.</div>}
                                {activeTab === 'students' && students.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">No students are assigned to this batch yet.</div>}
                                {activeTab === 'classes' && classes.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">No classes have been scheduled for this batch yet.</div>}
                            </div>
                        </section>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default SkillBatchDetails;
