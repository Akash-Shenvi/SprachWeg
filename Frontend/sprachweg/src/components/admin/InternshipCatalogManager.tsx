import React, { useEffect, useState } from 'react';
import { BriefcaseBusiness, Loader2, Pencil, Plus, RefreshCcw, Sparkles, Trash2 } from 'lucide-react';
import { internshipCatalogAPI } from '../../lib/api';
import { formatInternshipPrice, type InternshipListing, type InternshipPayload } from '../../types/internship';

interface InternshipFormState {
    title: string;
    shortDescription: string;
    description: string;
    duration: string;
    location: string;
    price: string;
    tags: string;
    isActive: boolean;
}

const defaultForm: InternshipFormState = {
    title: '',
    shortDescription: '',
    description: '',
    duration: '3-6 Months',
    location: 'Remote / Hybrid / Onsite',
    price: '',
    tags: '',
    isActive: true,
};

const cardClassName = 'rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#112240]';
const inputClassName = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-[#d6b161] focus:ring-2 focus:ring-[#d6b161]/20 dark:border-gray-700 dark:bg-[#0a192f] dark:text-white';

const toPayload = (form: InternshipFormState): InternshipPayload => ({
    title: form.title.trim(),
    shortDescription: form.shortDescription.trim(),
    description: form.description.trim(),
    duration: form.duration.trim(),
    location: form.location.trim(),
    price: Number(form.price),
    tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    isActive: form.isActive,
});

const InternshipCatalogManager: React.FC = () => {
    const [internships, setInternships] = useState<InternshipListing[]>([]);
    const [form, setForm] = useState<InternshipFormState>(defaultForm);
    const [editingInternshipId, setEditingInternshipId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deletingInternshipId, setDeletingInternshipId] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const fetchInternships = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await internshipCatalogAPI.getAllAdmin();
            setInternships(response.internships || []);
        } catch (err: any) {
            console.error('Failed to fetch internship catalog:', err);
            setError(err.response?.data?.message || 'Failed to load internship listings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInternships();
    }, []);

    const resetForm = () => {
        setForm(defaultForm);
        setEditingInternshipId(null);
        setFormError(null);
    };

    const handleChange = <K extends keyof InternshipFormState>(field: K, value: InternshipFormState[K]) => {
        setForm((currentForm) => ({ ...currentForm, [field]: value }));
        setFormError(null);
    };

    const handleEdit = (internship: InternshipListing) => {
        setEditingInternshipId(internship._id);
        setForm({
            title: internship.title,
            shortDescription: internship.shortDescription,
            description: internship.description,
            duration: internship.duration,
            location: internship.location,
            price: String(internship.price),
            tags: internship.tags.join(', '),
            isActive: internship.isActive,
        });
        setFormError(null);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!form.title.trim() || !form.shortDescription.trim() || !form.description.trim() || !form.duration.trim() || !form.location.trim()) {
            setFormError('Please complete all internship details before saving.');
            return;
        }

        if (!form.price.trim() || Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
            setFormError('Please provide a valid internship price.');
            return;
        }

        try {
            setSaving(true);
            setFormError(null);

            const payload = toPayload(form);
            const response = editingInternshipId
                ? await internshipCatalogAPI.update(editingInternshipId, payload)
                : await internshipCatalogAPI.create(payload);

            const savedInternship = response.internship as InternshipListing;

            setInternships((currentInternships) => {
                if (editingInternshipId) {
                    return currentInternships.map((internship) =>
                        internship._id === savedInternship._id ? savedInternship : internship
                    );
                }

                return [...currentInternships, savedInternship].sort((left, right) => {
                    const orderDifference = (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
                    if (orderDifference !== 0) return orderDifference;
                    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
                });
            });

            resetForm();
        } catch (err: any) {
            console.error('Failed to save internship:', err);
            setFormError(err.response?.data?.message || 'Failed to save internship.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (internship: InternshipListing) => {
        if (!window.confirm(`Delete "${internship.title}" from the live internship catalog?`)) {
            return;
        }

        try {
            setDeletingInternshipId(internship._id);
            await internshipCatalogAPI.delete(internship._id);
            setInternships((currentInternships) =>
                currentInternships.filter((currentInternship) => currentInternship._id !== internship._id)
            );

            if (editingInternshipId === internship._id) {
                resetForm();
            }
        } catch (err: any) {
            console.error('Failed to delete internship:', err);
            window.alert(err.response?.data?.message || 'Failed to delete internship.');
        } finally {
            setDeletingInternshipId(null);
        }
    };

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
                        <BriefcaseBusiness className="h-6 w-6 text-[#d6b161]" />
                        Manage Live Internships
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Add new internship listings, update prices, and remove openings that should no longer appear on the careers page.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={fetchInternships}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-[#d6b161] hover:text-[#b38f3f] disabled:opacity-60 dark:border-gray-700 dark:bg-[#112240] dark:text-gray-200"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    Refresh Catalog
                </button>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
                <div className={cardClassName}>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-[#b38f3f] dark:text-[#d6b161]">
                                {editingInternshipId ? 'Edit listing' : 'Create listing'}
                            </p>
                            <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                                {editingInternshipId ? 'Update internship details' : 'Add a new internship'}
                            </h3>
                        </div>
                        <div className="rounded-2xl bg-[#d6b161]/10 p-3 text-[#b38f3f] dark:text-[#d6b161]">
                            {editingInternshipId ? <Sparkles className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                        </div>
                    </div>

                    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                                <input
                                    value={form.title}
                                    onChange={(event) => handleChange('title', event.target.value)}
                                    className={inputClassName}
                                    placeholder="Full Stack Development Intern"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Short Description</label>
                                <textarea
                                    rows={2}
                                    value={form.shortDescription}
                                    onChange={(event) => handleChange('shortDescription', event.target.value)}
                                    className={`${inputClassName} resize-y`}
                                    placeholder="A crisp summary that appears on the card."
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                <textarea
                                    rows={4}
                                    value={form.description}
                                    onChange={(event) => handleChange('description', event.target.value)}
                                    className={`${inputClassName} resize-y`}
                                    placeholder="Detailed explanation shown on the internship detail and application flow."
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Duration</label>
                                <input
                                    value={form.duration}
                                    onChange={(event) => handleChange('duration', event.target.value)}
                                    className={inputClassName}
                                    placeholder="3-6 Months"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Price (INR)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.price}
                                    onChange={(event) => handleChange('price', event.target.value)}
                                    className={inputClassName}
                                    placeholder="9999"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Location / Format</label>
                                <input
                                    value={form.location}
                                    onChange={(event) => handleChange('location', event.target.value)}
                                    className={inputClassName}
                                    placeholder="Remote / Hybrid / Onsite"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
                                <input
                                    value={form.tags}
                                    onChange={(event) => handleChange('tags', event.target.value)}
                                    className={inputClassName}
                                    placeholder="React, Node.js, APIs"
                                />
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    Separate tags with commas.
                                </p>
                            </div>
                        </div>

                        <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-[#0a192f] dark:text-gray-200">
                            <input
                                type="checkbox"
                                checked={form.isActive}
                                onChange={(event) => handleChange('isActive', event.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-[#d6b161] focus:ring-[#d6b161]"
                            />
                            Show this internship on the public careers page
                        </label>

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
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingInternshipId ? <Sparkles className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                {editingInternshipId ? 'Update Internship' : 'Create Internship'}
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
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-[#b38f3f] dark:text-[#d6b161]">Published catalog</p>
                            <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                                {internships.length} internship{internships.length === 1 ? '' : 's'} in database
                            </h3>
                        </div>
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
                        ) : internships.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                No internship listings yet.
                            </div>
                        ) : (
                            internships.map((internship) => (
                                <article
                                    key={internship._id}
                                    className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-[#0a192f]"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="text-lg font-bold text-gray-900 dark:text-white">{internship.title}</h4>
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        internship.isActive
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                                                            : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                                    }`}
                                                >
                                                    {internship.isActive ? 'Live' : 'Hidden'}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                                                {internship.shortDescription}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-[#d6b161]/20 bg-[#d6b161]/10 px-4 py-2 text-right">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b6f2c] dark:text-[#e5c978]">Price</p>
                                            <p className="mt-1 text-lg font-bold text-[#0a192f] dark:text-white">
                                                {formatInternshipPrice(internship.price, internship.currency)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <span className="rounded-full border border-gray-200 px-3 py-1 dark:border-gray-700">{internship.duration}</span>
                                        <span className="rounded-full border border-gray-200 px-3 py-1 dark:border-gray-700">{internship.location}</span>
                                        {internship.tags.map((tag) => (
                                            <span key={tag} className="rounded-full border border-[#d6b161]/25 bg-[#d6b161]/10 px-3 py-1 text-[#8b6f2c] dark:text-[#f0d28a]">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(internship)}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-[#d6b161] hover:text-[#b38f3f] dark:border-gray-700 dark:bg-[#112240] dark:text-gray-200"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(internship)}
                                            disabled={deletingInternshipId === internship._id}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300"
                                        >
                                            {deletingInternshipId === internship._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            Delete
                                        </button>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default InternshipCatalogManager;
