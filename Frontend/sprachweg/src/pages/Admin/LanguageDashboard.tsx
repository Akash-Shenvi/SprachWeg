import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ImageUpload from '../../components/admin/ImageUpload';
import Button from '../../components/ui/Button';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { languageAPI, getAssetUrl } from '../../lib/api';
import { formatTrainingPrice, getCourseStartingPrice } from '../../lib/trainingPricing';
// Define type locally or import if you put in types file
interface LanguageCourse {
    _id?: string;
    title: string;
    subtitle: string;
    description: string;
    image?: string;
    popular: boolean;
    startingPrice?: number;
    levels: {
        name: string;
        duration: string;
        price: string;
        features: string[];
        outcome: string;
        examPrep?: {
            title: string;
            details: string;
            price: string;
        };
    }[];
    createdAt?: string;
}

const LanguageDashboard: React.FC = () => {
    const [courses, setCourses] = useState<LanguageCourse[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        description: '',
        popular: false,
        startingPrice: '',
        image: null as File | null,
        levels: [] as {
            name: string;
            duration: string;
            price: string;
            features: string[];
            outcome: string;
            examPrep?: {
                title: string;
                details: string;
                price: string;
            };
        }[],
    });

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const data = await languageAPI.getAll();
            setCourses(data);
        } catch (error) {
            console.error('Error fetching language courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('subtitle', formData.subtitle);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('popular', String(formData.popular));
            formDataToSend.append('startingPrice', formData.startingPrice);
            formDataToSend.append('levels', JSON.stringify(formData.levels));

            if (formData.image) {
                formDataToSend.append('image', formData.image);
            }

            if (editingId) {
                await languageAPI.update(editingId, formDataToSend);
            } else {
                await languageAPI.create(formDataToSend);
            }

            await fetchCourses();
            resetForm();
            setShowForm(false);
        } catch (error) {
            console.error('Error saving language course:', error);
            alert('Failed to save language course');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (course: LanguageCourse) => {
        setFormData({
            title: course.title,
            subtitle: course.subtitle || '',
            description: course.description,
            popular: course.popular || false,
            startingPrice: typeof course.startingPrice === 'number' ? String(course.startingPrice) : '',
            image: null,
            levels: course.levels || [],
        });
        setEditingId(course._id || null);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this language course?')) return;

        try {
            setLoading(true);
            await languageAPI.delete(id);
            await fetchCourses();
        } catch (error) {
            console.error('Error deleting language course:', error);
            alert('Failed to delete language course');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            subtitle: '',
            description: '',
            popular: false,
            startingPrice: '',
            image: null,
            levels: [],
        });
        setEditingId(null);
    };

    // Level Management Methods
    const addLevel = () => {
        setFormData(prev => ({
            ...prev,
            levels: [...prev.levels, {
                name: '', duration: '', price: '', features: [], outcome: '',
                examPrep: { title: '', details: '', price: '' }
            }]
        }));
    };

    const removeLevel = (index: number) => {
        setFormData(prev => ({
            ...prev,
            levels: prev.levels.filter((_, i) => i !== index)
        }));
    };

    const updateLevel = (index: number, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            levels: prev.levels.map((lvl, i) => i === index ? { ...lvl, [field]: value } : lvl)
        }));
    };

    const updateLevelFeature = (levelIndex: number, featureIndex: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            levels: prev.levels.map((lvl, i) => {
                if (i !== levelIndex) return lvl;
                const newFeatures = [...lvl.features];
                newFeatures[featureIndex] = value;
                return { ...lvl, features: newFeatures };
            })
        }));
    };

    const addLevelFeature = (levelIndex: number) => {
        setFormData(prev => ({
            ...prev,
            levels: prev.levels.map((lvl, i) => i === levelIndex ? { ...lvl, features: [...lvl.features, ''] } : lvl)
        }));
    };

    const removeLevelFeature = (levelIndex: number, featureIndex: number) => {
        setFormData(prev => ({
            ...prev,
            levels: prev.levels.map((lvl, i) => i === levelIndex ? { ...lvl, features: lvl.features.filter((_, fi) => fi !== featureIndex) } : lvl)
        }));
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">
                            Language Courses
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage your language training courses (German, Japanese, etc.)
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            resetForm();
                            setShowForm(true);
                        }}
                        className="bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add Language
                    </Button>
                </div>

                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-[#112240] rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-[#112240] z-10">
                                <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">
                                    {editingId ? 'Edit Language' : 'Add New Language'}
                                </h2>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-[#0a192f] rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left Column */}
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language Title *</label>
                                            <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent" placeholder="e.g. German Language Training" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subtitle</label>
                                            <input type="text" value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                                            <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Starting Price (INR)</label>
                                            <input type="number" min="0" value={formData.startingPrice} onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0a192f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d6b161] focus:border-transparent" placeholder="e.g. 15999" />
                                        </div>
                                        <div className="flex items-center gap-4 py-2">
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                <input type="checkbox" checked={formData.popular} onChange={(e) => setFormData({ ...formData, popular: e.target.checked })} className="rounded border-gray-300 text-[#d6b161] focus:ring-[#d6b161]" />
                                                Mark as Popular
                                            </label>
                                        </div>
                                        <ImageUpload value={formData.image || undefined} onChange={(file) => setFormData({ ...formData, image: file })} />
                                    </div>

                                    {/* Right Column: Level List Preview or Hint */}
                                    <div className="space-y-6">
                                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                                            <p className="text-sm text-gray-500 mb-2">Levels Configured:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {formData.levels.map((l, i) => (
                                                    <span key={i} className="px-2 py-1 bg-[#d6b161]/20 text-[#d6b161] rounded text-xs font-bold">{l.name}</span>
                                                ))}
                                                {formData.levels.length === 0 && <span className="text-xs text-gray-400">No levels added yet</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Levels Editor */}
                                <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="block text-lg font-medium text-gray-900 dark:text-white">Language Levels (e.g. A1, A2, N5)</label>
                                        <button type="button" onClick={addLevel} className="text-sm bg-[#d6b161]/10 text-[#d6b161] px-3 py-1 rounded-lg hover:bg-[#d6b161]/20">+ Add Level</button>
                                    </div>
                                    <div className="space-y-6">
                                        {formData.levels.map((level, lIndex) => (
                                            <div key={lIndex} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                                <div className="flex justify-between mb-4">
                                                    <h4 className="font-bold dark:text-white">Level Configuration {lIndex + 1}</h4>
                                                    <button type="button" onClick={() => removeLevel(lIndex)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <input type="text" placeholder="Name (e.g. A1)" value={level.name} onChange={(e) => updateLevel(lIndex, 'name', e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#0a192f] dark:text-white" />
                                                    <input type="text" placeholder="Duration (e.g. 45 Hours)" value={level.duration} onChange={(e) => updateLevel(lIndex, 'duration', e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#0a192f] dark:text-white" />
                                                    <input type="text" placeholder="Price (e.g. ₹15,999)" value={level.price} onChange={(e) => updateLevel(lIndex, 'price', e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#0a192f] dark:text-white" />
                                                    <input type="text" placeholder="Outcome" value={level.outcome} onChange={(e) => updateLevel(lIndex, 'outcome', e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#0a192f] dark:text-white" />
                                                </div>

                                                {/* Level Features */}
                                                <div className="mb-4">
                                                    <label className="text-xs font-semibold text-gray-500 uppercase">Features</label>
                                                    <div className="space-y-2 mt-2">
                                                        {level.features.map((feat, fIndex) => (
                                                            <div key={fIndex} className="flex gap-2">
                                                                <input type="text" value={feat} onChange={(e) => updateLevelFeature(lIndex, fIndex, e.target.value)} className="flex-1 px-3 py-1 rounded bg-white dark:bg-[#112240] border border-gray-300 dark:border-gray-600 text-sm dark:text-white" />
                                                                <button type="button" onClick={() => removeLevelFeature(lIndex, fIndex)} className="text-red-400"><X className="w-4 h-4" /></button>
                                                            </div>
                                                        ))}
                                                        <button type="button" onClick={() => addLevelFeature(lIndex)} className="text-xs text-[#d6b161] font-semibold">+ Add Feature</button>
                                                    </div>
                                                </div>

                                                {/* Exam Prep Optional */}
                                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                                    <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Exam Prep Add-on (Optional)</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <input type="text" placeholder="Title" value={level.examPrep?.title || ''} onChange={(e) => updateLevel(lIndex, 'examPrep', { ...level.examPrep, title: e.target.value })} className="px-3 py-1 rounded bg-white dark:bg-[#112240] border border-gray-300 dark:border-gray-600 text-sm dark:text-white" />
                                                        <input type="text" placeholder="Details" value={level.examPrep?.details || ''} onChange={(e) => updateLevel(lIndex, 'examPrep', { ...level.examPrep, details: e.target.value })} className="px-3 py-1 rounded bg-white dark:bg-[#112240] border border-gray-300 dark:border-gray-600 text-sm dark:text-white" />
                                                        <input type="text" placeholder="Price" value={level.examPrep?.price || ''} onChange={(e) => updateLevel(lIndex, 'examPrep', { ...level.examPrep, price: e.target.value })} className="px-3 py-1 rounded bg-white dark:bg-[#112240] border border-gray-300 dark:border-gray-600 text-sm dark:text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                                    <Button type="submit" disabled={loading} className="flex-1 bg-[#d6b161] hover:bg-[#c4a055] text-[#0a192f] flex items-center justify-center gap-2"><Save className="w-5 h-5" />{loading ? 'Saving...' : editingId ? 'Update Language' : 'Create Language'}</Button>
                                    <Button type="button" onClick={() => setShowForm(false)} variant="outline" className="flex-1">Cancel</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Courses Grid */}
                {loading && !showForm ? (
                    <div className="text-center py-12">
                        <div className="inline-block w-8 h-8 border-4 border-[#d6b161] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <div key={course._id} className="bg-white dark:bg-[#112240] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden group hover:shadow-lg transition-shadow">
                                {course.image && (
                                    <div className="relative h-48">
                                        <img src={getAssetUrl(`uploads/${course.image}`)} alt={course.title} className="w-full h-full object-cover" />
                                        {course.popular && <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Popular</div>}
                                    </div>
                                )}
                                <div className="p-6">
                                    <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-1">{course.title}</h3>
                                    {course.subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{course.subtitle}</p>}

                                    <div className="mb-4 rounded-lg bg-[#d6b161]/10 px-3 py-2 text-sm font-semibold text-[#8b6f2c] dark:text-[#f0d28a]">
                                        Starting at {formatTrainingPrice(getCourseStartingPrice(course))}
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                        {course.levels.map((l, i) => (
                                            <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">{l.name}</span>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex gap-2 w-full justify-end">
                                            <button onClick={() => handleEdit(course)} className="p-2 bg-[#d6b161]/10 text-[#d6b161] rounded-lg hover:bg-[#d6b161]/20"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(course._id!)} className="p-2 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && courses.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400">
                            No language courses yet. Click "Add Language" to create your first course.
                        </p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default LanguageDashboard;
