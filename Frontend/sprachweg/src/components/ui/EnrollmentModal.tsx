import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, Check, AlertCircle, GraduationCap, Phone, Mail, User, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Tokens
// --brand-navy: #0a192f
// --brand-gold: #d6b161
// --brand-white: #ffffff

interface EnrollmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    origin: 'english' | 'german' | 'japanese';
    originPath?: string;
}

interface FormData {
    name: string;
    phone: string;
    countryCode: string;
    email: string;
    dob: string;
    education: string;
    educationOther: string;
    guardianName: string;
    guardianPhone: string;
}

const initialFormData: FormData = {
    name: '',
    phone: '',
    countryCode: '+91',
    email: '',
    dob: '',
    education: '',
    educationOther: '',
    guardianName: '',
    guardianPhone: '',
};

const EnrollmentModal: React.FC<EnrollmentModalProps> = ({ isOpen, onClose, origin, originPath }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const shouldReduceMotion = useReducedMotion();
    const modalRef = useRef<HTMLDivElement>(null);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);


    // Autofill from User Context
    useEffect(() => {
        if (user && isOpen) {
            let formattedDob = '';
            if (user.dateOfBirth) {
                try {
                    const date = new Date(user.dateOfBirth);
                    if (!isNaN(date.getTime())) {
                        formattedDob = date.toISOString().split('T')[0];
                    }
                } catch (e) {
                    console.error("Invalid DOB in profile", e);
                }
            }

            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || '',
                phone: user.phoneNumber || '',
                education: user.qualification || '',
                guardianName: user.guardianName || '',
                guardianPhone: user.guardianPhone || '',
                dob: formattedDob,
            }));
        }
    }, [user, isOpen]);

    // Focus trap
    useEffect(() => {
        if (isOpen) {
            const focusableElements = modalRef.current?.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements?.[0] as HTMLElement;
            const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement;

            const handleTab = (e: KeyboardEvent) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement?.focus();
                        }
                    } else {
                        if (document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement?.focus();
                        }
                    }
                }
            };

            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape') handleBack();
            };

            document.addEventListener('keydown', handleTab);
            document.addEventListener('keydown', handleEscape);
            firstElement?.focus();

            // Scroll to top
            modalRef.current?.scrollTo({ top: 0, behavior: 'auto' });

            return () => {
                document.removeEventListener('keydown', handleTab);
                document.removeEventListener('keydown', handleEscape);
            };
        }
    }, [isOpen]);

    // Age validation removed/simplified as per request (Guardian info mandatory for all)
    // We still track it if we need it for other logic, but validation won't depend on it for hiding fields.


    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof FormData, string>> = {};
        let isValid = true;

        if (!formData.name.trim()) { newErrors.name = 'Name is required'; isValid = false; }
        if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
            newErrors.phone = 'Valid phone number is required (10 digits)'; isValid = false;
        }
        if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Valid email is required'; isValid = false;
        }

        // Age Check
        if (!formData.dob) {
            newErrors.dob = 'Date of birth is required'; isValid = false;
        } else {
            const birthDate = new Date(formData.dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age < 16) {
                newErrors.dob = 'You must be at least 16 years old to enroll'; isValid = false;
            }
        }

        if (!formData.education) { newErrors.education = 'Education level is required'; isValid = false; }
        if (formData.education === 'Other' && !formData.educationOther.trim()) {
            newErrors.educationOther = 'Please specify your education'; isValid = false;
        }

        // Mandatory Guardian Info for ALL users
        if (!formData.guardianName.trim()) { newErrors.guardianName = 'Guardian name is required'; isValid = false; }
        if (!formData.guardianPhone.trim()) { newErrors.guardianPhone = 'Guardian phone is required'; isValid = false; }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        // Transient success toast simulation
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate validation/prep

        setIsSubmitting(false);
        setShowSuccess(true);

        // TODO: POST to /api/enroll
        console.log('Enrolling user:', formData, 'Origin:', origin);
    };

    const handleBack = () => {
        onClose();
        if (originPath) {
            navigate(originPath);
        }
        // If no originPath, onClose effectively keeps us on the page or we could use window.history.back()
        // but typically modals are overlay, so closing is enough. 
        // If strict redirect needed: form closes, and we ensure we are at origin.
    };

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {/* Overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={handleBack}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    aria-hidden="true"
                />

                {/* Modal Panel */}
                <motion.div
                    ref={modalRef}
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300, duration: shouldReduceMotion ? 0 : 0.5 }}
                    className="relative flex h-full w-full flex-col overflow-y-auto bg-white dark:bg-[#0a192f] md:h-auto md:max-h-[90vh] md:w-full md:max-w-4xl md:rounded-2xl shadow-2xl"
                >
                    {showSuccess ? (
                        <SuccessView onClose={handleBack} />
                    ) : (
                        <>
                            {/* Sticky Mobile Header / Desktop Header */}
                            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-[#0a192f]/95">
                                <button
                                    onClick={handleBack}
                                    className="group flex items-center gap-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-[#0a192f] dark:text-gray-400 dark:hover:text-white"
                                    aria-label="Back to course"
                                >
                                    <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
                                    Back
                                </button>
                                <h2 id="modal-title" className="text-lg font-bold text-[#0a192f] dark:text-white">
                                    Enrollment
                                </h2>
                                <div className="w-16" /> {/* Spacer for balance */}
                            </div>

                            <div className="flex flex-col md:flex-row h-full">
                                {/* Visual Side Panel (Desktop only) */}
                                <div className="hidden md:flex md:w-1/3 flex-col justify-between bg-[#0a192f] p-8 text-white relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#0a192f] to-[#112240]" />
                                    <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-[#d6b161]/10 blur-2xl" />

                                    <div className="relative z-10">
                                        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
                                            <BookOpen className="h-6 w-6 text-[#d6b161]" />
                                        </div>
                                        <h3 className="mb-2 text-2xl font-bold">Start Your Journey</h3>
                                        <p className="text-blue-100">Join thousands of students mastering new languages today.</p>
                                    </div>

                                    <div className="relative z-10 space-y-4 text-sm text-blue-200">
                                        <div className="flex items-center gap-3">
                                            <Check className="h-4 w-4 text-[#d6b161]" />
                                            <span>Verified Certificates</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Check className="h-4 w-4 text-[#d6b161]" />
                                            <span>Expert Instructors</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Check className="h-4 w-4 text-[#d6b161]" />
                                            <span>Lifetime Access</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Content */}
                                <form onSubmit={handleSubmit} className="flex-1 p-6 md:p-8">
                                    <div className="grid gap-6 md:grid-cols-2">

                                        {/* Personal Info Group */}
                                        <div className="md:col-span-2">
                                            <h4 className="flex items-center gap-2 mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                                                <User className="h-4 w-4" /> Personal Information
                                            </h4>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="md:col-span-2">
                                                    <InputField
                                                        label="Name"
                                                        required
                                                        error={errors.name}
                                                        value={formData.name}
                                                        onChange={(v: string) => handleInputChange('name', v)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contact Info */}
                                        <div className="md:col-span-2">
                                            <h4 className="flex items-center gap-2 mb-4 mt-2 text-sm font-semibold uppercase tracking-wider text-gray-400">
                                                <Phone className="h-4 w-4" /> Contact Details
                                            </h4>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1.5 block text-sm font-semibold text-[#0a192f] dark:text-gray-200">
                                                        Phone <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all focus-within:ring-2 focus-within:ring-[#d6b161]">
                                                        <select
                                                            className="rounded-l-lg bg-gray-50 px-3 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:outline-none"
                                                            value={formData.countryCode}
                                                            onChange={e => handleInputChange('countryCode', e.target.value)}
                                                        >
                                                            <option value="+91">+91 (IN)</option>
                                                            <option value="+1">+1 (US)</option>
                                                            <option value="+44">+44 (UK)</option>
                                                            <option value="+49">+49 (DE)</option>
                                                            <option value="+81">+81 (JP)</option>
                                                        </select>
                                                        <input
                                                            type="tel"
                                                            className="w-full flex-1 rounded-r-lg bg-transparent px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
                                                            placeholder="9876543210"
                                                            value={formData.phone}
                                                            onChange={e => handleInputChange('phone', e.target.value)}
                                                        />
                                                    </div>
                                                    {errors.phone && <span className="mt-1 text-xs text-red-500">{errors.phone}</span>}
                                                </div>
                                                <InputField
                                                    label="Email Address"
                                                    type="email"
                                                    icon={<Mail className="h-4 w-4" />}
                                                    required
                                                    error={errors.email}
                                                    value={formData.email}
                                                    onChange={(v: string) => handleInputChange('email', v)}
                                                />
                                            </div>
                                        </div>

                                        {/* Education & DOB */}
                                        <div className="md:col-span-2">
                                            <h4 className="flex items-center gap-2 mb-4 mt-2 text-sm font-semibold uppercase tracking-wider text-gray-400">
                                                <GraduationCap className="h-4 w-4" /> Background
                                            </h4>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <InputField
                                                    label="Date of Birth"
                                                    type="date"
                                                    required
                                                    error={errors.dob}
                                                    value={formData.dob}
                                                    onChange={(v: string) => handleInputChange('dob', v)}
                                                />
                                                <div>
                                                    <label className="mb-1.5 block text-sm font-semibold text-[#0a192f] dark:text-gray-200">
                                                        Highest Education <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        className={`w-full appearance-none rounded-lg border bg-white px-4 py-2.5 text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-[#d6b161] dark:bg-gray-800 dark:text-white
                                   ${errors.education ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-gray-700'}
                                 `}
                                                        value={formData.education}
                                                        onChange={e => handleInputChange('education', e.target.value)}
                                                    >
                                                        <option value="">Select Level</option>
                                                        <option value="High School">High School</option>
                                                        <option value="Diploma">Diploma</option>
                                                        <option value="Bachelor">Bachelor Info</option>
                                                        <option value="Master">Master Degree</option>
                                                        <option value="PhD">PhD</option>
                                                        <option value="Other">Other</option>
                                                        {formData.education && !["High School", "Diploma", "Bachelor", "Master", "PhD", "Other", ""].includes(formData.education) && (
                                                            <option value={formData.education}>{formData.education}</option>
                                                        )}
                                                    </select>
                                                    {errors.education && <span className="mt-1 text-xs text-red-500">{errors.education}</span>}

                                                    {formData.education === 'Other' && (
                                                        <div className="mt-2">
                                                            <input
                                                                type="text"
                                                                placeholder="Please specify"
                                                                className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d6b161]"
                                                                value={formData.educationOther}
                                                                onChange={e => handleInputChange('educationOther', e.target.value)}
                                                            />
                                                            {errors.educationOther && <span className="mt-1 text-xs text-red-500">{errors.educationOther}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Guardian Info (Mandatory) */}
                                        <div className="md:col-span-2 rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                                            <h4 className="flex items-center gap-2 mb-4 text-sm font-semibold text-[#0a192f] dark:text-blue-100">
                                                <ShieldIcon className="h-4 w-4" /> Guardian Information
                                            </h4>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <InputField
                                                    label="Guardian Name"
                                                    required
                                                    error={errors.guardianName}
                                                    value={formData.guardianName}
                                                    onChange={(v: string) => handleInputChange('guardianName', v)}
                                                />
                                                <InputField
                                                    label="Guardian Phone"
                                                    type="tel"
                                                    required
                                                    error={errors.guardianPhone}
                                                    value={formData.guardianPhone}
                                                    onChange={(v: string) => handleInputChange('guardianPhone', v)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submission Error Summary */}
                                    {Object.keys(errors).length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-6 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                        >
                                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                            <p>There are errors in the form. Please check the fields marked in red.</p>
                                        </motion.div>
                                    )}

                                    {/* Actions */}
                                    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                        <button
                                            type="button"
                                            onClick={handleBack}
                                            className="rounded-lg border border-gray-200 px-6 py-3 font-semibold text-gray-600 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#d6b161] px-8 py-3 font-bold text-[#0a192f] shadow-lg transition-all hover:bg-[#c4a055] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#d6b161] focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed dark:focus:ring-offset-[#0a192f]"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a192f] border-t-transparent" />
                                                    Processing...
                                                </>
                                            ) : (
                                                'Submit Enrollment'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

// Reusable Input Component
const InputField = ({ label, type = 'text', required, error, value, onChange, icon }: any) => (
    <div>
        <label className="mb-1.5 block text-sm font-semibold text-[#0a192f] dark:text-gray-200">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {icon}
                </div>
            )}
            <input
                type={type}
                className={`w-full rounded-lg border bg-white px-4 py-2.5 text-gray-900 transition-all placeholder:text-gray-400 focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white
             ${icon ? 'pl-10' : ''}
             ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-[#d6b161] dark:border-gray-700'}
          `}
                value={value}
                onChange={e => onChange(e.target.value)}
            />
        </div>
        {error && <span className="mt-1 text-xs text-red-500">{error}</span>}
    </div>
);

// Success View
const SuccessView = ({ onClose }: { onClose: () => void }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex h-full flex-col items-center justify-center p-8 text-center"
    >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <Check className="h-10 w-10" />
        </div>
        <h2 className="mb-2 text-3xl font-bold text-[#0a192f] dark:text-white">Enrollment Successful!</h2>
        <p className="mb-8 max-w-sm text-gray-600 dark:text-gray-300">
            We have received your enrollment request. Our admissions team will contact you shortly to finalize your schedule.
        </p>
        <button
            onClick={onClose}
            className="rounded-lg bg-[#0a192f] px-8 py-3 font-semibold text-white transition-transform hover:scale-105 hover:shadow-lg dark:bg-gray-700"
        >
            Return to Course Page
        </button>
    </motion.div>
);

const ShieldIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
);

export default EnrollmentModal;
