import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Loader2, Pencil, Plus, RefreshCcw, Radio, Sparkles, Video } from 'lucide-react';
import api, { webinarCatalogAPI } from '../../lib/api';
import type { WebinarCalendarSyncStatus, WebinarListing, WebinarPayload, WebinarTrainerSummary } from '../../types/webinar';
import { formatWebinarDateTime, formatWebinarPrice } from '../../types/webinar';

interface WebinarFormState {
    title: string;
    shortDescription: string;
    description: string;
    trainerId: string;
    scheduledAt: string;
    price: string;
    isActive: boolean;
}

const defaultForm: WebinarFormState = {
    title: '',
    shortDescription: '',
    description: '',
    trainerId: '',
    scheduledAt: '',
    price: '',
    isActive: true,
};

const cardClassName = 'rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#112240]';
const inputClassName = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 dark:border-gray-700 dark:bg-[#0a192f] dark:text-white';

const toDateTimeLocalValue = (value?: string) => {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
};

const toPayload = (form: WebinarFormState): WebinarPayload => ({
    title: form.title.trim(),
    shortDescription: form.shortDescription.trim(),
    description: form.description.trim(),
    trainerId: form.trainerId,
    scheduledAt: form.scheduledAt,
    price: Number(form.price),
    isActive: form.isActive,
});

const getCalendarStatusMeta = (status?: WebinarCalendarSyncStatus) => {
    if (status === 'scheduled') {
        return {
            label: 'Calendar Scheduled',
            className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        };
    }

    if (status === 'needs_trainer_connection') {
        return {
            label: 'Needs Google Calendar',
            className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        };
    }

    if (status === 'sync_error') {
        return {
            label: 'Sync Error',
            className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        };
    }

    return {
        label: 'Draft',
        className: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    };
};

const WebinarCatalogManager: React.FC = () => {
    const [webinars, setWebinars] = useState<WebinarListing[]>([]);
    const [trainers, setTrainers] = useState<WebinarTrainerSummary[]>([]);
    const [form, setForm] = useState<WebinarFormState>(defaultForm);
    const [editingWebinarId, setEditingWebinarId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const fetchCatalogData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [webinarResponse, trainerResponse] = await Promise.all([
                webinarCatalogAPI.getAllAdmin(),
                api.get('/language-training/admin/trainers'),
            ]);
            setWebinars(webinarResponse.webinars || []);
            setTrainers(trainerResponse.data || []);
        } catch (err: any) {
            console.error('Failed to fetch webinar catalog:', err);
            setError(err.response?.data?.message || 'Failed to load webinar listings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchCatalogData();
    }, []);

    const resetForm = () => {
        setForm(defaultForm);
        setEditingWebinarId(null);
        setFormError(null);
    };

    const handleChange = <K extends keyof WebinarFormState>(field: K, value: WebinarFormState[K]) => {
        setForm((currentForm) => ({ ...currentForm, [field]: value }));
        setFormError(null);
    };

    const editingWebinar = useMemo(
        () => webinars.find((webinar) => webinar._id === editingWebinarId) || null,
        [editingWebinarId, webinars]
    );
    const selectedTrainer = useMemo(
        () => trainers.find((trainer) => trainer._id === form.trainerId) || null,
        [form.trainerId, trainers]
    );

    const handleEdit = (webinar: WebinarListing) => {
        setEditingWebinarId(webinar._id);
        setForm({
            title: webinar.title,
            shortDescription: webinar.shortDescription,
            description: webinar.description,
            trainerId: webinar.trainer?._id || webinar.trainerId || '',
            scheduledAt: toDateTimeLocalValue(webinar.scheduledAt),
            price: String(webinar.price),
            isActive: webinar.isActive,
        });
        setFormError(null);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!form.title.trim() || !form.shortDescription.trim() || !form.description.trim() || !form.scheduledAt || !form.trainerId) {
            setFormError('Please complete all webinar details before saving.');
            return;
        }

        if (!form.price.trim() || Number.isNaN(Number(form.price)) || Number(form.price) <= 0) {
            setFormError('Please provide a valid webinar price.');
            return;
        }

        if (form.isActive && !selectedTrainer?.googleCalendarConnected) {
            setFormError('This trainer must connect Google Calendar before the webinar can be published.');
            return;
        }

        try {
            setSaving(true);
            setFormError(null);

            const payload = toPayload(form);
            const response = editingWebinarId
                ? await webinarCatalogAPI.update(editingWebinarId, payload)
                : await webinarCatalogAPI.create(payload);

            const savedWebinar = response.webinar as WebinarListing;

            setWebinars((currentWebinars) => {
                if (editingWebinarId) {
                    return currentWebinars.map((webinar) =>
                        webinar._id === savedWebinar._id ? savedWebinar : webinar
                    );
                }

                return [...currentWebinars, savedWebinar].sort((left, right) => {
                    const orderDifference = (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
                    if (orderDifference !== 0) return orderDifference;
                    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
                });
            });

            resetForm();
        } catch (err: any) {
            console.error('Failed to save webinar:', err);
            setFormError(err.response?.data?.message || 'Failed to save webinar.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
                        <Radio className="h-6 w-6 text-[#d6b161]" />
                        Manage Webinar Catalog
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Create webinars, assign a trainer, and publish only when the trainer has Google Calendar connected for the auto-generated event.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void fetchCatalogData()}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-[#d6b161] hover:text-[#b38f3f] disabled:opacity-60 dark:border-gray-700 dark:bg-[#112240] dark:text-gray-200"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    Refresh Catalog
                </button>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_1fr]">
                <div className={cardClassName}>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-[#b38f3f] dark:text-[#d6b161]">
                                {editingWebinarId ? 'Edit webinar' : 'Create webinar'}
                            </p>
                            <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                                {editingWebinarId ? 'Update webinar details' : 'Add a new webinar'}
                            </h3>
                        </div>
                        <div className="rounded-2xl bg-[#d6b161]/10 p-3 text-[#b38f3f] dark:text-[#d6b161]">
                            {editingWebinarId ? <Sparkles className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                        </div>
                    </div>

                    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                        <div className="grid gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                                <input
                                    value={form.title}
                                    onChange={(event) => handleChange('title', event.target.value)}
                                    className={inputClassName}
                                    placeholder="Industry 4.0 Career Readiness"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Short Description</label>
                                <textarea
                                    rows={2}
                                    value={form.shortDescription}
                                    onChange={(event) => handleChange('shortDescription', event.target.value)}
                                    className={`${inputClassName} resize-y`}
                                    placeholder="A compact summary for the webinar card."
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                <textarea
                                    rows={4}
                                    value={form.description}
                                    onChange={(event) => handleChange('description', event.target.value)}
                                    className={`${inputClassName} resize-y`}
                                    placeholder="Full webinar overview shown on the public page."
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Assigned Trainer</label>
                                <select
                                    value={form.trainerId}
                                    onChange={(event) => handleChange('trainerId', event.target.value)}
                                    className={inputClassName}
                                >
                                    <option value="">Select a trainer</option>
                                    {trainers.map((trainer) => (
                                        <option key={trainer._id} value={trainer._id}>
                                            {trainer.name} {trainer.googleCalendarConnected ? '(Calendar connected)' : '(Calendar not connected)'}
                                        </option>
                                    ))}
                                </select>
                                {selectedTrainer && (
                                    <p className={`mt-2 text-xs ${selectedTrainer.googleCalendarConnected ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                        {selectedTrainer.googleCalendarConnected
                                            ? 'This trainer is ready for automatic Google Calendar event creation.'
                                            : 'This trainer can only be saved as draft until Google Calendar is connected.'}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Scheduled Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={form.scheduledAt}
                                        onChange={(event) => handleChange('scheduledAt', event.target.value)}
                                        className={inputClassName}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Price (INR)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={form.price}
                                        onChange={(event) => handleChange('price', event.target.value)}
                                        className={inputClassName}
                                        placeholder="499"
                                    />
                                </div>
                            </div>
                        </div>

                        <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-[#0a192f] dark:text-gray-200">
                            <input
                                type="checkbox"
                                checked={form.isActive}
                                onChange={(event) => handleChange('isActive', event.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#d6b161] focus:ring-[#d6b161]"
                            />
                            <span>
                                Show this webinar on the public webinars page
                                <span className="mt-1 block text-xs font-normal text-gray-500 dark:text-gray-400">
                                    Publishing requires an assigned trainer with Google Calendar connected. Draft webinars can still be saved while inactive.
                                </span>
                            </span>
                        </label>

                        {editingWebinar && (
                            <div className="rounded-2xl border border-[#d6b161]/20 bg-[#d6b161]/10 p-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getCalendarStatusMeta(editingWebinar.calendarSyncStatus).className}`}>
                                        {getCalendarStatusMeta(editingWebinar.calendarSyncStatus).label}
                                    </span>
                                    {editingWebinar.calendarReady && (
                                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                            Trainer ready
                                        </span>
                                    )}
                                </div>
                                <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                    <p>
                                        Generated join link:{' '}
                                        {editingWebinar.joinLink ? (
                                            <a href={editingWebinar.joinLink} target="_blank" rel="noreferrer" className="font-semibold text-[#8b6f2c] underline dark:text-[#f0d28a]">
                                                Open Google Meet link
                                            </a>
                                        ) : (
                                            <span className="text-gray-500 dark:text-gray-400">Will be created automatically when the webinar is synced.</span>
                                        )}
                                    </p>
                                    {editingWebinar.calendarSyncError && (
                                        <p className="text-xs text-red-600 dark:text-red-400">{editingWebinar.calendarSyncError}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {formError && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">
                                {formError}
                            </div>
                        )}

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0a192f] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#112240] disabled:opacity-60 dark:bg-[#d6b161] dark:text-[#0a192f] dark:hover:bg-[#c9a653]"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingWebinarId ? <Sparkles className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                {editingWebinarId ? 'Update Webinar' : 'Create Webinar'}
                            </button>

                            <button
                                type="button"
                                onClick={resetForm}
                                disabled={saving}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-[#d6b161] hover:text-[#b38f3f] disabled:opacity-60 dark:border-gray-700 dark:bg-[#112240] dark:text-gray-200"
                            >
                                Reset Form
                            </button>
                        </div>
                    </form>
                </div>

                <div className={cardClassName}>
                    <div>
                        <p className="text-sm font-semibold text-[#b38f3f] dark:text-[#d6b161]">Published catalog</p>
                        <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                            {webinars.length} webinar{webinars.length === 1 ? '' : 's'} in database
                        </h3>
                    </div>

                    <div className="mt-6 space-y-4">
                        {loading ? (
                            <div className="flex justify-center py-16">
                                <Loader2 className="h-8 w-8 animate-spin text-[#d6b161]" />
                            </div>
                        ) : error ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">
                                {error}
                            </div>
                        ) : webinars.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                No webinars added yet.
                            </div>
                        ) : (
                            webinars.map((webinar) => {
                                const calendarMeta = getCalendarStatusMeta(webinar.calendarSyncStatus);

                                return (
                                    <article
                                        key={webinar._id}
                                        className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-[#0a192f]"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{webinar.title}</h4>
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                            webinar.isActive
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                                                                : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                                        }`}
                                                    >
                                                        {webinar.isActive ? 'Live' : 'Hidden'}
                                                    </span>
                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${calendarMeta.className}`}>
                                                        {calendarMeta.label}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                                                    {webinar.shortDescription}
                                                </p>
                                            </div>

                                            <div className="rounded-2xl border border-[#d6b161]/20 bg-[#d6b161]/10 px-4 py-2 text-right">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b6f2c] dark:text-[#e5c978]">Price</p>
                                                <p className="mt-1 text-lg font-bold text-[#0a192f] dark:text-white">
                                                    {formatWebinarPrice(webinar.price, webinar.currency || 'INR')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-[#112240]">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                <Calendar className="h-4 w-4 text-[#d6b161]" />
                                                {formatWebinarDateTime(webinar.scheduledAt)}
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                <span className="inline-flex items-center gap-1">
                                                    <Video className="h-3.5 w-3.5 text-[#d6b161]" />
                                                    {webinar.trainer?.name || 'Trainer not assigned'}
                                                </span>
                                                <span>
                                                    Approved students: <strong className="text-gray-700 dark:text-gray-200">{webinar.approvedRegistrationsCount || 0}</strong>
                                                </span>
                                                <span>
                                                    {webinar.trainer?.googleCalendarConnected ? 'Trainer calendar connected' : 'Trainer calendar not connected'}
                                                </span>
                                            </div>
                                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                                                {webinar.description}
                                            </p>
                                            {webinar.calendarSyncError && (
                                                <p className="mt-3 text-xs text-red-600 dark:text-red-400">{webinar.calendarSyncError}</p>
                                            )}
                                        </div>

                                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(webinar)}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-[#d6b161] hover:text-[#b38f3f] dark:border-gray-700 dark:bg-[#112240] dark:text-gray-200"
                                            >
                                                <Pencil className="h-4 w-4" />
                                                Edit
                                            </button>
                                            {webinar.joinLink ? (
                                                <a
                                                    href={webinar.joinLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d6b161]/25 bg-[#d6b161]/10 px-4 py-2.5 text-sm font-semibold text-[#8b6f2c] transition-colors hover:bg-[#d6b161]/20 dark:text-[#f0d28a]"
                                                >
                                                    Open Join Link
                                                </a>
                                            ) : (
                                                <span className="inline-flex items-center justify-center rounded-xl border border-dashed border-gray-300 px-4 py-2.5 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                                                    Join link will be generated automatically
                                                </span>
                                            )}
                                        </div>
                                    </article>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default WebinarCatalogManager;
