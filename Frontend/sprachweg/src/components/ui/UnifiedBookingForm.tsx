import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, Check, AlertCircle, Mail, User, Globe, Zap, Languages } from 'lucide-react';
import api from '../../lib/api';

// Unified Booking Form for Landing Page "Book Free Trial"
// Allows selection of Language, Skill, or Both.

interface UnifiedBookingFormProps {
    isOpen: boolean;
    onClose: () => void;
}

interface FormData {
    fullName: string;
    countryCode: string;
    phone: string;
    email: string;
    interest: 'Language' | 'Skill' | 'Both';
    language: string;
    course: string;
    prepLevel: string;
    skillCourses: string[]; // Multi-select for skill courses
    comments: string;
}

const initialFormData: FormData = {
    fullName: '',
    countryCode: '+91',
    phone: '',
    email: '',
    interest: 'Language',
    language: '',
    course: '',
    prepLevel: '',
    skillCourses: [],
    comments: '',
};

const COURSES_BY_LANGUAGE: Record<string, string[]> = {
    german: [
        'A1 to B1', 'A1 to B2', 'A1', 'A2', 'B1', 'B2',
        'Preparation course 7 days (telc)', 'Preparation course 15 days (telc)'
    ],
    english: ['Academic IELTS', 'General IELTS'],
    japanese: ['N5', 'N4', 'N3', 'N2', 'N1']
};

const SKILL_COURSES = [
    'SCADA & HMI',
    'PLC Programming',
    'Industrial Drives',
    'Industry 4.0',
    'Customized Corporate Training'
];

const PREP_COURSES = ['Preparation course 7 days (telc)', 'Preparation course 15 days (telc)'];

const UnifiedBookingForm: React.FC<UnifiedBookingFormProps> = ({ isOpen, onClose }) => {
    const shouldReduceMotion = useReducedMotion();
    const modalRef = useRef<HTMLDivElement>(null);

    // State
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Focus Trap & Scroll Lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = ''; };
        }
    }, [isOpen]);

    const validateStep1 = (): boolean => {
        const newErrors: Partial<Record<keyof FormData, string>> = {};
        let isValid = true;

        if (formData.fullName.trim().length < 2) { newErrors.fullName = 'Name must be at least 2 characters'; isValid = false; }
        if (!formData.phone.trim()) { newErrors.phone = 'Phone number is required'; isValid = false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { newErrors.email = 'Valid email is required'; isValid = false; }

        setErrors(prev => ({ ...prev, ...newErrors }));
        return isValid;
    };

    const validateStep2 = (): boolean => {
        // Step 2 is interest selection - always valid if one is selected (default provided)
        return true;
    };

    const validateStep3 = (): boolean => {
        const newErrors: Partial<Record<keyof FormData, string>> = {};
        let isValid = true;

        if (formData.interest === 'Language' || formData.interest === 'Both') {
            if (!formData.language) { newErrors.language = 'Please select a language'; isValid = false; }
            if (!formData.course) { newErrors.course = 'Please select a course'; isValid = false; }
            if (formData.language === 'german' && PREP_COURSES.includes(formData.course)) {
                if (!formData.prepLevel) { newErrors.prepLevel = 'Please select a level'; isValid = false; }
            }
        }

        if (formData.interest === 'Skill' || formData.interest === 'Both') {
            if (formData.skillCourses.length === 0) { newErrors.skillCourses = 'Please select at least one skill course'; isValid = false; }
        }

        setErrors(prev => ({ ...prev, ...newErrors }));
        return isValid;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
        } else if (step === 2 && validateStep2()) {
            setStep(3);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep3()) return;

        setIsSubmitting(true);
        try {
            // Log the data being sent
            console.log('Submitting trial request:', formData);

            // Use the shared api instance (baseURL is already configured)
            const response = await api.post('/trials', formData);
            console.log('Trial request response:', response.data);

            setShowSuccess(true);
            setTimeout(() => {
                handleClose();
            }, 2500);
        } catch (error: any) {
            console.error('Request error:', error);
            console.error('Error response:', error.response?.data);
            alert(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setStep(1);
            setFormData(initialFormData);
            setErrors({});
            setShowSuccess(false);
        }, 300);
    };

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => {
            const next = { ...prev, [field]: value };
            // Reset dependent fields
            if (field === 'language') { next.course = ''; next.prepLevel = ''; }
            if (field === 'course') { next.prepLevel = ''; }
            return next;
        });
        setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const toggleSkillCourse = (course: string) => {
        setFormData(prev => {
            const current = prev.skillCourses;
            const updated = current.includes(course)
                ? current.filter(c => c !== course)
                : [...current, course];
            return { ...prev, skillCourses: updated };
        });
        if (errors.skillCourses) setErrors(prev => ({ ...prev, skillCourses: undefined }));
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center sm:items-end md:items-center" role="dialog" aria-modal="true">
                {/* Overlay */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => handleClose()}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Panel */}
                <motion.div
                    ref={modalRef}
                    initial={{ y: '100%', opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: '100%', opacity: 0, scale: 0.95 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.4, type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative flex h-[90vh] w-full flex-col overflow-hidden bg-white dark:bg-[#0a192f] sm:h-auto sm:max-h-[85vh] sm:rounded-t-2xl md:h-auto md:w-full md:max-w-3xl md:rounded-2xl shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 dark:border-gray-800 dark:bg-[#0a192f]">
                        <button onClick={() => step > 1 ? setStep(step - 1) : handleClose()} className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-[#0a192f] dark:text-gray-400 dark:hover:text-white">
                            <ChevronLeft className="h-5 w-5" />
                            {step > 1 ? 'Back' : 'Close'}
                        </button>
                        <h2 className="text-lg font-bold text-[#0a192f] dark:text-white">Book Free Trial</h2>
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-400">
                            Step <span className="text-[#d6b161]">{step}</span>/3
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1 w-full bg-gray-100 dark:bg-gray-800">
                        <motion.div className="h-full bg-[#d6b161]" initial={{ width: '0%' }} animate={{ width: `${(step / 3) * 100}%` }} transition={{ duration: 0.3 }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                        {showSuccess ? (
                            <SuccessView />
                        ) : (
                            <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
                                {/* Error Summary */}
                                {Object.keys(errors).length > 0 && (
                                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400 flex gap-2 animate-pulse">
                                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                        <span>Please correct the errors below.</span>
                                    </div>
                                )}

                                <AnimatePresence mode="wait">
                                    {step === 1 && (
                                        <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                            <div>
                                                <h3 className="text-xl font-bold text-[#0a192f] dark:text-white mb-1">Personal Details</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Let's get to know you</p>
                                            </div>
                                            <div className="space-y-4">
                                                <InputField label="Full Name" required icon={<User className="h-4 w-4" />} value={formData.fullName} onChange={(v: string) => handleInputChange('fullName', v)} error={errors.fullName} placeholder="John Doe" />
                                                <InputField label="Email Address" required type="email" icon={<Mail className="h-4 w-4" />} value={formData.email} onChange={(v: string) => handleInputChange('email', v)} error={errors.email} placeholder="john@example.com" />
                                                <div>
                                                    <label className="mb-1.5 block text-sm font-semibold text-[#0a192f] dark:text-gray-200">Phone <span className="text-red-500">*</span></label>
                                                    <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-[#d6b161]">
                                                        <select className="rounded-l-lg bg-gray-50 px-2 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600 outline-none" value={formData.countryCode} onChange={e => handleInputChange('countryCode', e.target.value)}>
                                                            <option value="+91">+91</option><option value="+1">+1</option><option value="+44">+44</option><option value="+49">+49</option><option value="+81">+81</option>
                                                        </select>
                                                        <input type="tel" className="w-full flex-1 rounded-r-lg bg-transparent px-3 py-2.5 text-gray-900 dark:text-white outline-none" placeholder="9876543210" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} />
                                                    </div>
                                                    {errors.phone && <span className="mt-1 text-xs text-red-500">{errors.phone}</span>}
                                                </div>
                                            </div>
                                            <button type="button" onClick={handleNext} className="w-full rounded-lg bg-[#0a192f] py-4 font-bold text-white shadow-lg hover:bg-[#112240] dark:bg-[#d6b161] dark:text-[#0a192f] dark:hover:bg-[#c4a055]">Continue</button>
                                        </motion.div>
                                    )}

                                    {step === 2 && (
                                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                            <div>
                                                <h3 className="text-xl font-bold text-[#0a192f] dark:text-white mb-1">What are you interested in?</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Select the training path relevant to you</p>
                                            </div>
                                            <div className="grid gap-4">
                                                <InterestCard title="Language Training" description="German, English, Japanese" icon={<Languages className="w-6 h-6" />} selected={formData.interest === 'Language'} onClick={() => handleInputChange('interest', 'Language')} />
                                                <InterestCard title="Skill Training" description="PLC, SCADA, Industry 4.0, etc." icon={<Zap className="w-6 h-6" />} selected={formData.interest === 'Skill'} onClick={() => handleInputChange('interest', 'Skill')} />
                                                <InterestCard title="Both" description="I want to explore everything" icon={<Globe className="w-6 h-6" />} selected={formData.interest === 'Both'} onClick={() => handleInputChange('interest', 'Both')} />
                                            </div>
                                            <button type="button" onClick={handleNext} className="w-full rounded-lg bg-[#0a192f] py-4 font-bold text-white shadow-lg hover:bg-[#112240] dark:bg-[#d6b161] dark:text-[#0a192f] dark:hover:bg-[#c4a055]">Continue</button>
                                        </motion.div>
                                    )}

                                    {step === 3 && (
                                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                            <div>
                                                <h3 className="text-xl font-bold text-[#0a192f] dark:text-white mb-1">Specific Preferences</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Tell us exactly what you need</p>
                                            </div>

                                            {(formData.interest === 'Language' || formData.interest === 'Both') && (
                                                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-white/5">
                                                    <h4 className="font-bold text-[#d6b161] mb-3 flex items-center gap-2"><Languages className="w-4 h-4" /> Language Training</h4>

                                                    <div className="space-y-3">
                                                        <SelectField
                                                            label="Select Language"
                                                            value={formData.language}
                                                            onChange={(v: string) => handleInputChange('language', v)}
                                                            error={errors.language}
                                                            options={[
                                                                { label: 'Select Language...', value: '' },
                                                                { label: 'German', value: 'german' },
                                                                { label: 'English', value: 'english' },
                                                                { label: 'Japanese', value: 'japanese' },
                                                            ]}
                                                        />

                                                        {formData.language && (
                                                            <SelectField
                                                                label="Select Course"
                                                                value={formData.course}
                                                                onChange={(v: string) => handleInputChange('course', v)}
                                                                error={errors.course}
                                                                options={[
                                                                    { label: 'Select Course...', value: '' },
                                                                    ...(COURSES_BY_LANGUAGE[formData.language] || []).map(c => ({ label: c, value: c }))
                                                                ]}
                                                            />
                                                        )}

                                                        {formData.language === 'german' && PREP_COURSES.includes(formData.course) && (
                                                            <SelectField
                                                                label="Target Level"
                                                                value={formData.prepLevel}
                                                                onChange={(v: string) => handleInputChange('prepLevel', v)}
                                                                error={errors.prepLevel}
                                                                options={[
                                                                    { label: 'Select Level...', value: '' },
                                                                    { label: 'B1', value: 'B1' },
                                                                    { label: 'B2', value: 'B2' }
                                                                ]}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {(formData.interest === 'Skill' || formData.interest === 'Both') && (
                                                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-white/5">
                                                    <h4 className="font-bold text-[#d6b161] mb-3 flex items-center gap-2"><Zap className="w-4 h-4" /> Skill Training</h4>
                                                    <div className="space-y-2">
                                                        {SKILL_COURSES.map(course => (
                                                            <div key={course} onClick={() => toggleSkillCourse(course)} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formData.skillCourses.includes(course) ? 'border-[#d6b161] bg-[#d6b161]/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                                                                <div className={`w-5 h-5 rounded flex items-center justify-center border ${formData.skillCourses.includes(course) ? 'bg-[#d6b161] border-[#d6b161] text-[#0a192f]' : 'border-gray-400'}`}>
                                                                    {formData.skillCourses.includes(course) && <Check className="w-3.5 h-3.5" />}
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{course}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {errors.skillCourses && <p className="text-xs text-red-500 mt-2">{errors.skillCourses}</p>}
                                                </div>
                                            )}

                                            <div>
                                                <label className="mb-1.5 block text-sm font-semibold text-[#0a192f] dark:text-gray-200">Any Questions?</label>
                                                <textarea rows={3} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm focus:ring-2 focus:ring-[#d6b161] outline-none dark:text-white" placeholder="Optional..." value={formData.comments} onChange={e => handleInputChange('comments', e.target.value)} />
                                            </div>

                                            <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-[#d6b161] py-4 font-bold text-[#0a192f] shadow-lg hover:bg-[#c4a055] disabled:opacity-70">{isSubmitting ? 'Submitting...' : 'Submit Request'}</button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

// --- Subcomponents ---

const InterestCard: React.FC<{ title: string; description: string; icon: React.ReactNode; selected: boolean; onClick: () => void }> = ({ title, description, icon, selected, onClick }) => (
    <div onClick={onClick} className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${selected ? 'border-[#d6b161] bg-[#d6b161]/10' : 'border-gray-200 dark:border-gray-700 hover:border-[#d6b161]/50'}`}>
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${selected ? 'bg-[#d6b161] text-[#0a192f]' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>{icon}</div>
            <div>
                <h4 className="font-bold text-[#0a192f] dark:text-white">{title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            {selected && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#d6b161]"><Check className="w-6 h-6" /></div>}
        </div>
    </div>
);

const InputField: React.FC<{ label: string; required?: boolean; error?: string; icon?: React.ReactNode; onChange: (value: string) => void; value: string; type?: string; placeholder?: string }> = ({ label, required, error, icon, onChange, ...props }) => (
    <div>
        <label className="mb-1.5 block text-sm font-semibold text-[#0a192f] dark:text-gray-200">{label} {required && <span className="text-red-500">*</span>}</label>
        <div className="relative">
            {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</div>}
            <input {...props} onChange={(e) => onChange(e.target.value)} className={`w-full rounded-lg border bg-white px-4 py-2.5 pl-10 text-gray-900 focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-[#d6b161] dark:border-gray-700'}`} />
        </div>
        {error && <span className="mt-1 text-xs text-red-500">{error}</span>}
    </div>
);

const SelectField: React.FC<{ label: string; onChange: (value: string) => void; error?: string; options: { label: string; value: string }[]; value: string }> = ({ label, onChange, error, options, value }) => (
    <div>
        <label className="mb-1.5 block text-sm font-semibold text-[#0a192f] dark:text-gray-200">{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)} className={`w-full rounded-lg border bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white ${error ? 'border-red-500' : 'border-gray-200 focus:ring-[#d6b161] dark:border-gray-700'}`}>
            {options.map((o: { label: string; value: string }) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {error && <span className="mt-1 text-xs text-red-500">{error}</span>}
    </div>
);

const SuccessView = () => (
    <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 animate-pulse"><Check className="h-12 w-12" /></div>
        <h3 className="mb-2 text-2xl font-bold text-[#0a192f] dark:text-white">Request Sent!</h3>
        <p className="max-w-xs text-gray-600 dark:text-gray-300">We'll be in touch shortly to schedule your free trial.</p>
    </div>
);

export default UnifiedBookingForm;
