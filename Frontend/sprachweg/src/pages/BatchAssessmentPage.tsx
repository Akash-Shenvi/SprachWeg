import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle2,
    CircleX,
    ClipboardList,
    ExternalLink,
    Loader2,
    Plus,
    RotateCcw,
    Trash2,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

type TrainingType = 'language' | 'skill';
type AssessmentQuestionType = 'mcq' | 'true_false' | 'fill_blank';
type AttemptStatus = 'passed' | 'failed';

interface AssessmentQuestion {
    _id?: string;
    type: AssessmentQuestionType;
    prompt: string;
    options?: string[];
    correctOptionIndex?: number;
    correctBoolean?: boolean;
    blankAnswer?: string;
}

interface AssessmentAttemptSummary {
    _id: string;
    attemptNumber: number;
    correctCount: number;
    totalQuestions: number;
    scorePercentage: number;
    status: AttemptStatus;
    createdAt: string;
}

interface TrainerAssessmentSummary {
    attemptCount: number;
    passedStudents: number;
    studentsPendingPass: number;
}

interface StudentAssessmentProgress {
    attemptCount: number;
    latestAttempt: AssessmentAttemptSummary | null;
    latestScore: number | null;
    passed: boolean;
    finalized: boolean;
    canRetry: boolean;
    attempts: AssessmentAttemptSummary[];
}

interface AssessmentDetail {
    _id: string;
    batchId: string;
    trainingType: TrainingType;
    title: string;
    description: string;
    passPercentage: number;
    publishedAt: string;
    createdAt: string;
    courseTitle: string;
    batchName: string;
    questionCount: number;
    questions: AssessmentQuestion[];
    summary?: TrainerAssessmentSummary;
    studentProgress?: StudentAssessmentProgress;
}

interface AssessmentSubmissionResult {
    message: string;
    attempt: AssessmentAttemptSummary;
    passed: boolean;
    finalized: boolean;
    canRetry: boolean;
}

interface QuestionDraft {
    clientId: string;
    type: AssessmentQuestionType;
    prompt: string;
    options: string[];
    correctOptionIndex: number;
    correctBoolean: boolean;
    blankAnswer: string;
}

interface StudentAnswerDraft {
    selectedOptionIndex?: number;
    booleanAnswer?: boolean;
    textAnswer?: string;
}

interface BatchAssessmentPageProps {
    trainingType?: TrainingType;
}

const createClientId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const createQuestionDraft = (): QuestionDraft => ({
    clientId: createClientId(),
    type: 'mcq',
    prompt: '',
    options: ['', ''],
    correctOptionIndex: 0,
    correctBoolean: true,
    blankAnswer: '',
});

const formatDateTime = (value?: string | null) => {
    if (!value) return 'Not available';

    return new Date(value).toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const BatchAssessmentPage: React.FC<BatchAssessmentPageProps> = ({ trainingType = 'language' }) => {
    const { batchId, assessmentId } = useParams<{ batchId: string; assessmentId?: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isCreateMode = !assessmentId;
    const isTrainerLike = user?.role === 'trainer' || user?.role === 'admin';
    const batchBasePath = trainingType === 'language' ? '/language-batch' : '/skill-batch';
    const batchPath = `${batchBasePath}/${batchId}`;
    const apiBasePath = `/trainer-batches/${trainingType}`;

    const [loading, setLoading] = useState(!isCreateMode);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [detail, setDetail] = useState<AssessmentDetail | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState<QuestionDraft[]>([createQuestionDraft()]);
    const [answers, setAnswers] = useState<Record<string, StudentAnswerDraft>>({});
    const [latestSubmission, setLatestSubmission] = useState<AssessmentSubmissionResult | null>(null);
    const [showStudentForm, setShowStudentForm] = useState(true);

    const effectiveStudentResult = useMemo(() => {
        if (latestSubmission) {
            return latestSubmission;
        }

        if (!detail?.studentProgress?.latestAttempt) {
            return null;
        }

        return {
            message: detail.studentProgress.passed
                ? 'Assessment already passed and finalized.'
                : 'Previous attempt did not meet the passing score.',
            attempt: detail.studentProgress.latestAttempt,
            passed: detail.studentProgress.passed,
            finalized: detail.studentProgress.finalized,
            canRetry: detail.studentProgress.canRetry,
        } satisfies AssessmentSubmissionResult;
    }, [detail, latestSubmission]);

    const fetchAssessmentDetail = async () => {
        if (!assessmentId) return;

        try {
            setLoading(true);
            setError('');
            const response = await api.get(`${apiBasePath}/assessments/${assessmentId}`);
            const nextDetail = response.data as AssessmentDetail;
            setDetail(nextDetail);

            if (nextDetail.studentProgress) {
                setShowStudentForm(nextDetail.studentProgress.attemptCount === 0 && !nextDetail.studentProgress.finalized);
            } else {
                setShowStudentForm(false);
            }
        } catch (fetchError: unknown) {
            const message = fetchError instanceof Error ? fetchError.message : 'Failed to load assessment.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isCreateMode) {
            void fetchAssessmentDetail();
        }
    }, [assessmentId, isCreateMode, trainingType]);

    const updateQuestion = (clientId: string, updater: (question: QuestionDraft) => QuestionDraft) => {
        setQuestions((current) => current.map((question) => (
            question.clientId === clientId ? updater(question) : question
        )));
    };

    const handleQuestionTypeChange = (clientId: string, type: AssessmentQuestionType) => {
        updateQuestion(clientId, (question) => ({
            ...question,
            type,
            options: type === 'mcq' ? (question.options.length >= 2 ? question.options : ['', '']) : [],
            correctOptionIndex: 0,
            correctBoolean: true,
            blankAnswer: '',
        }));
    };

    const addOption = (clientId: string) => {
        updateQuestion(clientId, (question) => ({
            ...question,
            options: [...question.options, ''],
        }));
    };

    const removeOption = (clientId: string, optionIndex: number) => {
        updateQuestion(clientId, (question) => {
            if (question.options.length <= 2) {
                return question;
            }

            const nextOptions = question.options.filter((_, index) => index !== optionIndex);
            const nextCorrectIndex = question.correctOptionIndex >= nextOptions.length
                ? nextOptions.length - 1
                : question.correctOptionIndex === optionIndex
                    ? 0
                    : question.correctOptionIndex > optionIndex
                        ? question.correctOptionIndex - 1
                        : question.correctOptionIndex;

            return {
                ...question,
                options: nextOptions,
                correctOptionIndex: nextCorrectIndex,
            };
        });
    };

    const validateDraft = () => {
        if (!title.trim()) {
            return 'Assessment title is required.';
        }

        if (questions.length === 0) {
            return 'Add at least one question.';
        }

        for (let index = 0; index < questions.length; index += 1) {
            const question = questions[index];
            if (!question.prompt.trim()) {
                return `Question ${index + 1} needs a prompt.`;
            }

            if (question.type === 'mcq') {
                const nonEmptyOptions = question.options.map((option) => option.trim()).filter(Boolean);
                if (nonEmptyOptions.length < 2) {
                    return `Question ${index + 1} needs at least two answer options.`;
                }
            }

            if (question.type === 'fill_blank' && !question.blankAnswer.trim()) {
                return `Question ${index + 1} needs a fill-in-the-blank answer.`;
            }
        }

        return '';
    };

    const handleCreateAssessment = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!batchId) return;

        const validationError = validateDraft();
        if (validationError) {
            window.alert(validationError);
            return;
        }

        try {
            setSaving(true);
            setError('');

            const payload = {
                batchId,
                title: title.trim(),
                description: description.trim(),
                questions: questions.map((question) => ({
                    type: question.type,
                    prompt: question.prompt.trim(),
                    options: question.type === 'mcq'
                        ? question.options.map((option) => option.trim()).filter(Boolean)
                        : [],
                    correctOptionIndex: question.type === 'mcq' ? question.correctOptionIndex : undefined,
                    correctBoolean: question.type === 'true_false' ? question.correctBoolean : undefined,
                    blankAnswer: question.type === 'fill_blank' ? question.blankAnswer.trim() : undefined,
                })),
            };

            const response = await api.post(`${apiBasePath}/assessments`, payload);
            const createdAssessment = response.data as { _id: string };
            navigate(`${batchPath}/assessments/${createdAssessment._id}`, { replace: true });
        } catch (createError: unknown) {
            const message = createError instanceof Error ? createError.message : 'Failed to create assessment.';
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitAssessment = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!assessmentId || !detail) {
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            const payload = {
                answers: detail.questions.map((question) => ({
                    questionId: question._id,
                    ...(answers[question._id || ''] || {}),
                })),
            };

            const response = await api.post(`${apiBasePath}/assessments/${assessmentId}/submit`, payload);
            const result = response.data as AssessmentSubmissionResult;

            setLatestSubmission(result);
            setShowStudentForm(false);
            setAnswers({});
            await fetchAssessmentDetail();
        } catch (submitError: unknown) {
            const message = submitError instanceof Error ? submitError.message : 'Failed to submit assessment.';
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRetry = () => {
        setLatestSubmission(null);
        setAnswers({});
        setShowStudentForm(true);
    };

    const renderQuestionEditor = (question: QuestionDraft, index: number) => (
        <div key={question.clientId} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d6b161]">Question {index + 1}</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Choose the type, write the prompt, and set the correct answer.</p>
                </div>
                {questions.length > 1 && (
                    <button
                        type="button"
                        onClick={() => setQuestions((current) => current.filter((item) => item.clientId !== question.clientId))}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                    >
                        <Trash2 className="h-4 w-4" />
                        Remove
                    </button>
                )}
            </div>

            <div className="space-y-4">
                <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Question Type</label>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {([
                            { value: 'mcq', label: 'Multiple Choice' },
                            { value: 'true_false', label: 'True / False' },
                            { value: 'fill_blank', label: 'Fill in the Blank' },
                        ] as Array<{ value: AssessmentQuestionType; label: string }>).map((typeOption) => (
                            <button
                                key={typeOption.value}
                                type="button"
                                onClick={() => handleQuestionTypeChange(question.clientId, typeOption.value)}
                                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                                    question.type === typeOption.value
                                        ? 'border-[#d6b161] bg-[#d6b161]/10 text-[#d6b161]'
                                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-[#d6b161]/40 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300'
                                }`}
                            >
                                {typeOption.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Prompt</label>
                    <textarea
                        value={question.prompt}
                        onChange={(event) => updateQuestion(question.clientId, (current) => ({
                            ...current,
                            prompt: event.target.value,
                        }))}
                        rows={3}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 dark:border-gray-700 dark:bg-gray-900/40 dark:text-white"
                        placeholder="Write the question students should answer..."
                    />
                </div>

                {question.type === 'mcq' && (
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">Answer Options</label>
                            <button
                                type="button"
                                onClick={() => addOption(question.clientId)}
                                className="text-sm font-semibold text-[#d6b161]"
                            >
                                Add option
                            </button>
                        </div>
                        <div className="space-y-3">
                            {question.options.map((option, optionIndex) => (
                                <div key={`${question.clientId}-${optionIndex}`} className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name={`correct-option-${question.clientId}`}
                                        checked={question.correctOptionIndex === optionIndex}
                                        onChange={() => updateQuestion(question.clientId, (current) => ({
                                            ...current,
                                            correctOptionIndex: optionIndex,
                                        }))}
                                        className="h-4 w-4 border-gray-300 text-[#d6b161] focus:ring-[#d6b161]"
                                    />
                                    <input
                                        type="text"
                                        value={option}
                                        onChange={(event) => updateQuestion(question.clientId, (current) => ({
                                            ...current,
                                            options: current.options.map((existingOption, existingIndex) => (
                                                existingIndex === optionIndex ? event.target.value : existingOption
                                            )),
                                        }))}
                                        className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 dark:border-gray-700 dark:bg-gray-900/40 dark:text-white"
                                        placeholder={`Option ${optionIndex + 1}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeOption(question.clientId, optionIndex)}
                                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                                        aria-label={`Remove option ${optionIndex + 1}`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {question.type === 'true_false' && (
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Correct Answer</label>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {([
                                { label: 'True', value: true },
                                { label: 'False', value: false },
                            ] as const).map((booleanOption) => (
                                <button
                                    key={String(booleanOption.value)}
                                    type="button"
                                    onClick={() => updateQuestion(question.clientId, (current) => ({
                                        ...current,
                                        correctBoolean: booleanOption.value,
                                    }))}
                                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                                        question.correctBoolean === booleanOption.value
                                            ? 'border-[#d6b161] bg-[#d6b161]/10 text-[#d6b161]'
                                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-[#d6b161]/40 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300'
                                    }`}
                                >
                                    {booleanOption.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {question.type === 'fill_blank' && (
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Correct Answer</label>
                        <input
                            type="text"
                            value={question.blankAnswer}
                            onChange={(event) => updateQuestion(question.clientId, (current) => ({
                                ...current,
                                blankAnswer: event.target.value,
                            }))}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 dark:border-gray-700 dark:bg-gray-900/40 dark:text-white"
                            placeholder="Example: Guten Morgen"
                        />
                    </div>
                )}
            </div>
        </div>
    );

    const renderQuestionPreview = (question: AssessmentQuestion, index: number, revealAnswers: boolean) => (
        <div key={question._id || `${question.type}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-3 flex items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d6b161]">Question {index + 1}</p>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                    {question.type === 'mcq' ? 'Multiple Choice' : question.type === 'true_false' ? 'True / False' : 'Fill Blank'}
                </span>
            </div>
            <p className="text-base font-semibold text-gray-900 dark:text-white">{question.prompt}</p>

            {question.type === 'mcq' && question.options && (
                <div className="mt-4 space-y-2">
                    {question.options.map((option, optionIndex) => (
                        <div
                            key={`${question._id || index}-${optionIndex}`}
                            className={`rounded-xl border px-4 py-3 text-sm ${
                                revealAnswers && question.correctOptionIndex === optionIndex
                                    ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300'
                                    : 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-200'
                            }`}
                        >
                            {option}
                        </div>
                    ))}
                </div>
            )}

            {question.type === 'true_false' && revealAnswers && (
                <p className="mt-4 text-sm font-semibold text-green-600 dark:text-green-400">
                    Correct answer: {question.correctBoolean ? 'True' : 'False'}
                </p>
            )}

            {question.type === 'fill_blank' && revealAnswers && (
                <p className="mt-4 text-sm font-semibold text-green-600 dark:text-green-400">
                    Correct answer: {question.blankAnswer}
                </p>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors dark:bg-gray-900 dark:text-white">
            <Header />
            <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1f3a5f] p-6 text-white shadow-xl sm:p-8">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                        <button
                            type="button"
                            onClick={() => navigate(batchPath)}
                            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 font-semibold transition hover:border-white/30 hover:bg-white/10"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Batch
                        </button>
                        <span className="rounded-full border border-white/10 px-3 py-1 font-semibold capitalize text-[#f0d79a]">
                            {trainingType} batch
                        </span>
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#f0d79a]">
                                {isCreateMode ? 'Create Assessment' : 'Assessment Workspace'}
                            </p>
                            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                                {detail?.title || title || 'Batch Assessment'}
                            </h1>
                            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/75 sm:text-base">
                                {detail
                                    ? `${detail.courseTitle} • ${detail.batchName}`
                                    : 'Build a batch-level assessment with multiple choice, true or false, and fill in the blank questions.'}
                            </p>
                        </div>

                        {!isCreateMode && detail && (
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm">
                                <p className="font-semibold text-white">Passing Score</p>
                                <p className="mt-1 text-2xl font-bold text-[#f0d79a]">{detail.passPercentage}%</p>
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                        {error}
                    </div>
                )}

                {isCreateMode ? (
                    isTrainerLike ? (
                        <form onSubmit={handleCreateAssessment} className="space-y-6">
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="grid gap-5">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Assessment Title</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(event) => setTitle(event.target.value)}
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 dark:border-gray-700 dark:bg-gray-900/40 dark:text-white"
                                            placeholder="Example: Chapter 1 Assessment"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Description</label>
                                        <textarea
                                            value={description}
                                            onChange={(event) => setDescription(event.target.value)}
                                            rows={4}
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 dark:border-gray-700 dark:bg-gray-900/40 dark:text-white"
                                            placeholder="Optional instructions for students..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {questions.map(renderQuestionEditor)}

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                    type="button"
                                    onClick={() => setQuestions((current) => [...current, createQuestionDraft()])}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d6b161]/40 bg-[#d6b161]/10 px-5 py-3 text-sm font-semibold text-[#b38f3f] transition hover:bg-[#d6b161]/20"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Question
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d6b161] px-6 py-3 text-sm font-bold text-[#0a192f] transition hover:bg-[#c4a055] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Publish Assessment
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">Only trainers and admins can create assessments.</p>
                        </div>
                    )
                ) : loading ? (
                    <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center gap-3 text-sm font-semibold text-gray-500 dark:text-gray-300">
                            <Loader2 className="h-5 w-5 animate-spin text-[#d6b161]" />
                            Loading assessment...
                        </div>
                    </div>
                ) : detail ? (
                    <div className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Questions</p>
                                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{detail.questionCount}</p>
                            </div>
                            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Published</p>
                                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{formatDateTime(detail.publishedAt)}</p>
                            </div>
                            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Pass Mark</p>
                                <p className="mt-2 text-3xl font-bold text-[#d6b161]">{detail.passPercentage}%</p>
                            </div>
                        </div>

                        {detail.description && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <p className="text-sm leading-7 text-gray-600 dark:text-gray-300">{detail.description}</p>
                            </div>
                        )}

                        {(user?.role === 'trainer' || user?.role === 'admin') && detail.summary && (
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Attempts</p>
                                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{detail.summary.attemptCount}</p>
                                </div>
                                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Students Passed</p>
                                    <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{detail.summary.passedStudents}</p>
                                </div>
                                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Pending Pass</p>
                                    <p className="mt-2 text-3xl font-bold text-orange-500">{detail.summary.studentsPendingPass}</p>
                                </div>
                            </div>
                        )}

                        {detail.studentProgress && effectiveStudentResult && !showStudentForm && (
                            <div className={`rounded-2xl border p-6 shadow-sm ${
                                effectiveStudentResult.passed
                                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                                    : 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20'
                            }`}>
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-start gap-3">
                                        {effectiveStudentResult.passed ? (
                                            <CheckCircle2 className="mt-0.5 h-6 w-6 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <CircleX className="mt-0.5 h-6 w-6 text-orange-500" />
                                        )}
                                        <div>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                {effectiveStudentResult.passed ? 'Passed and Finalized' : 'Attempt Complete'}
                                            </p>
                                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{effectiveStudentResult.message}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="rounded-xl bg-white/80 px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm dark:bg-gray-800/80 dark:text-gray-200">
                                            Score: {effectiveStudentResult.attempt.scorePercentage}%
                                        </div>
                                        <div className="rounded-xl bg-white/80 px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm dark:bg-gray-800/80 dark:text-gray-200">
                                            Correct: {effectiveStudentResult.attempt.correctCount}/{effectiveStudentResult.attempt.totalQuestions}
                                        </div>
                                        {!effectiveStudentResult.passed && effectiveStudentResult.canRetry && (
                                            <button
                                                type="button"
                                                onClick={handleRetry}
                                                className="inline-flex items-center gap-2 rounded-xl bg-[#d6b161] px-4 py-3 text-sm font-bold text-[#0a192f] transition hover:bg-[#c4a055]"
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                                Retry Assessment
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {detail.studentProgress && detail.studentProgress.attempts.length > 0 && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <p className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Attempt History</p>
                                <div className="space-y-3">
                                    {detail.studentProgress.attempts.map((attempt) => (
                                        <div key={attempt._id} className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900/40 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="font-semibold text-gray-900 dark:text-white">Attempt {attempt.attemptNumber}</span>
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    attempt.status === 'passed'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                                                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
                                                }`}>
                                                    {attempt.status === 'passed' ? 'Passed' : 'Failed'}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-gray-600 dark:text-gray-300">
                                                <span>{attempt.scorePercentage}%</span>
                                                <span>{attempt.correctCount}/{attempt.totalQuestions} correct</span>
                                                <span>{formatDateTime(attempt.createdAt)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {detail.studentProgress && showStudentForm && (
                            <form onSubmit={handleSubmitAssessment} className="space-y-6">
                                {detail.questions.map((question, index) => (
                                    <div key={question._id || `${question.type}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d6b161]">Question {index + 1}</p>
                                        <p className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">{question.prompt}</p>

                                        {question.type === 'mcq' && question.options && (
                                            <div className="mt-5 space-y-3">
                                                {question.options.map((option, optionIndex) => (
                                                    <label
                                                        key={`${question._id || index}-${optionIndex}`}
                                                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                                                            answers[question._id || '']?.selectedOptionIndex === optionIndex
                                                                ? 'border-[#d6b161] bg-[#d6b161]/10 text-[#b38f3f]'
                                                                : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-[#d6b161]/40 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-200'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`question-${question._id}`}
                                                            checked={answers[question._id || '']?.selectedOptionIndex === optionIndex}
                                                            onChange={() => setAnswers((current) => ({
                                                                ...current,
                                                                [question._id || '']: { selectedOptionIndex: optionIndex },
                                                            }))}
                                                            className="h-4 w-4 border-gray-300 text-[#d6b161] focus:ring-[#d6b161]"
                                                        />
                                                        <span>{option}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {question.type === 'true_false' && (
                                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                                {([
                                                    { label: 'True', value: true },
                                                    { label: 'False', value: false },
                                                ] as const).map((option) => (
                                                    <label
                                                        key={`${question._id || index}-${String(option.value)}`}
                                                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                                                            answers[question._id || '']?.booleanAnswer === option.value
                                                                ? 'border-[#d6b161] bg-[#d6b161]/10 text-[#b38f3f]'
                                                                : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-[#d6b161]/40 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-200'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`question-${question._id}`}
                                                            checked={answers[question._id || '']?.booleanAnswer === option.value}
                                                            onChange={() => setAnswers((current) => ({
                                                                ...current,
                                                                [question._id || '']: { booleanAnswer: option.value },
                                                            }))}
                                                            className="h-4 w-4 border-gray-300 text-[#d6b161] focus:ring-[#d6b161]"
                                                        />
                                                        <span>{option.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {question.type === 'fill_blank' && (
                                            <div className="mt-5">
                                                <input
                                                    type="text"
                                                    value={answers[question._id || '']?.textAnswer || ''}
                                                    onChange={(event) => setAnswers((current) => ({
                                                        ...current,
                                                        [question._id || '']: { textAnswer: event.target.value },
                                                    }))}
                                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 dark:border-gray-700 dark:bg-gray-900/40 dark:text-white"
                                                    placeholder="Type your answer"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="inline-flex items-center gap-2 rounded-xl bg-[#d6b161] px-6 py-3 text-sm font-bold text-[#0a192f] transition hover:bg-[#c4a055] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                        Submit Assessment
                                    </button>
                                </div>
                            </form>
                        )}

                        {(!detail.studentProgress || user?.role === 'trainer' || user?.role === 'admin') && (
                            <div className="space-y-6">
                                {detail.questions.map((question, index) => renderQuestionPreview(question, index, true))}
                            </div>
                        )}

                        {detail.studentProgress && !showStudentForm && !effectiveStudentResult && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <ClipboardList className="mx-auto mb-4 h-12 w-12 text-[#d6b161]" />
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">Assessment ready to start</p>
                                <button
                                    type="button"
                                    onClick={() => setShowStudentForm(true)}
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#d6b161] px-5 py-3 text-sm font-bold text-[#0a192f] transition hover:bg-[#c4a055]"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Start Assessment
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">Assessment not found.</p>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default BatchAssessmentPage;
