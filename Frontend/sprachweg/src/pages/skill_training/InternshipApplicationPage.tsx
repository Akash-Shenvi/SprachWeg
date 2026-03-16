import React, { useState, useRef, useCallback } from 'react';

// ─── Icon Components ──────────────────────────────────────────────────────────

const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const UploadCloud = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f4fa3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);

const FileText = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f4fa3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CheckSmall = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const AlertCircle = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  firstName: string;
  lastName: string;
  dob: string;
  email: string;
  whatsapp: string;
  college: string;
  registration: string;
  department: string;
  customDept: string;
  semester: string;
  passingYear: string;
  customYear: string;
  address: string;
  source: string;
}

type UploadState = 'idle' | 'uploading' | 'done';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Mechanical',
  'Electrical',
  'Civil',
  'Other',
];

const SEMESTERS = [
  '1st Semester', '2nd Semester', '3rd Semester', '4th Semester',
  '5th Semester', '6th Semester', '7th Semester', '8th Semester', 'Graduated',
];

const YEARS = ['2024', '2025', '2026', '2027', '2028', 'Other'];

const SOURCES = [
  'LinkedIn', 'College Faculty', 'Friends / Alumni',
  'Social Media', 'Internet Search', 'Other',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

function generateRef(): string {
  return 'SV-' + Math.random().toString(36).substr(2, 8).toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, required, error, children }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-xs font-semibold tracking-wide text-[#6b7a99] dark:text-[#8b9bbf] flex items-center gap-1 uppercase">
        {label}
        {required && <span className="text-[#1f4fa3] text-[10px]">*</span>}
      </label>
    )}
    <div className="relative">{children}</div>
    {error && (
      <div className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
        <AlertCircle />
        {error}
      </div>
    )}
  </div>
);

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

const SelectField: React.FC<SelectFieldProps> = ({ label, required, error, children, ...props }) => (
  <Field label={label} required={required} error={error}>
    <select
      className="w-full px-4 py-3 bg-[#f8faff] dark:bg-[#0d1629] border-[1.5px] border-[#e0e7f5] dark:border-[#1f2d4a] rounded-lg text-sm text-[#0d1b3e] dark:text-[#e8eeff] font-[Sora,system-ui] outline-none transition-all duration-200 appearance-none cursor-pointer focus:border-[#1f4fa3] focus:bg-white dark:focus:bg-[#111f3a] focus:ring-2 focus:ring-[#1f4fa3]/20 hover:border-[#93b4e8]"
      {...props}
    >
      {children}
    </select>
    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#6b7a99]">
      <ChevronDown />
    </span>
  </Field>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const InternshipApplicationPage: React.FC = () => {
  const [step, setStep] = useState<number>(0);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [refCode] = useState<string>(generateRef());

  const [form, setForm] = useState<FormData>({
    firstName: '', lastName: '', dob: '', email: '', whatsapp: '',
    college: '', registration: '', department: 'Computer Science',
    customDept: '', semester: '', passingYear: '', customYear: '',
    address: '', source: '',
  });

  const [resume, setResume] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadError, setUploadError] = useState<string>('');
  const [dragOver, setDragOver] = useState<boolean>(false);

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const set = (field: keyof FormData, val: string) => {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};

    if (s === 0) {
      if (!form.firstName.trim()) errs.firstName = 'First name is required';
      if (!form.lastName.trim()) errs.lastName = 'Last name is required';
      if (!form.dob) errs.dob = 'Date of birth is required';
      if (!form.email.trim()) errs.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address';
      if (!form.whatsapp.trim()) errs.whatsapp = 'WhatsApp number is required';
    }

    if (s === 1) {
      if (!form.college.trim()) errs.college = 'College name is required';
      if (!form.registration.trim()) errs.registration = 'Registration number is required';
      if (form.department === 'Other' && !form.customDept.trim()) errs.customDept = 'Please specify your department';
      if (!form.semester) errs.semester = 'Please select your semester';
      if (!form.passingYear) errs.passingYear = 'Please select your passing year';
      if (form.passingYear === 'Other' && !form.customYear.trim()) errs.customYear = 'Please enter your passing year';
      if (!form.address.trim()) errs.address = 'Address is required';
      if (!form.source) errs.source = 'Please tell us how you found us';
    }

    if (s === 2) {
      if (uploadState !== 'done') errs.resume = 'Please upload your resume to continue';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(s => Math.min(s + 1, 2));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const handleFile = (file: File | null) => {
    setUploadError('');
    if (!file) return;

    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const validExt = /\.(pdf|doc|docx)$/i.test(file.name);

    if (!validTypes.includes(file.type) && !validExt) {
      setUploadError('Only PDF, DOC, and DOCX files are accepted.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File exceeds the 5 MB limit. Please compress and re-upload.');
      return;
    }

    setResume(file);
    setUploadProgress(0);
    setUploadState('uploading');

    let pct = 0;
    progressRef.current = setInterval(() => {
      pct += Math.random() * 8 + 4;
      if (pct >= 100) {
        pct = 100;
        clearInterval(progressRef.current!);
        setUploadProgress(100);
        setTimeout(() => setUploadState('done'), 300);
      }
      setUploadProgress(Math.min(Math.round(pct), 100));
    }, 120);
  };

  const removeFile = () => {
    if (progressRef.current) clearInterval(progressRef.current);
    setResume(null);
    setUploadProgress(0);
    setUploadState('idle');
    setUploadError('');
    setErrors(e => ({ ...e, resume: '' }));
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleSubmit = () => {
    if (!validateStep(2)) return;
    setLoading(true);

    // TODO: Replace with your actual API call
    // await submitApplication({ ...form, resume });
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 2200);
  };

  // ─── Input class (shared) ───────────────────────────────────────────────────
  const inputCls =
    'w-full px-4 py-3 bg-[#f8faff] dark:bg-[#0d1629] border-[1.5px] border-[#e0e7f5] dark:border-[#1f2d4a] rounded-lg text-sm text-[#0d1b3e] dark:text-[#e8eeff] font-[Sora,system-ui] outline-none transition-all duration-200 placeholder:text-[#9aa3b8] focus:border-[#1f4fa3] focus:bg-white dark:focus:bg-[#111f3a] focus:ring-2 focus:ring-[#1f4fa3]/20 hover:border-[#93b4e8]';

  const stepLabels = ['Personal', 'Academic', 'Resume'];
  const stepsDone = [step > 0, step > 1, submitted];
  const stepsActive = [step === 0, step === 1, step === 2];

  // ─── Success Screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f0f4ff] dark:bg-[#080e1f] flex items-start justify-center py-16 px-4 relative overflow-hidden transition-colors duration-300">
        {/* Animated blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute w-[600px] h-[600px] -top-48 -left-36 rounded-full bg-gradient-to-br from-blue-500 to-[#1f4fa3] opacity-[0.18] blur-[80px] animate-[float1_18s_ease-in-out_infinite]" />
          <div className="absolute w-[500px] h-[500px] -bottom-36 -right-24 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 opacity-[0.18] blur-[80px] animate-[float2_22s_ease-in-out_infinite]" />
        </div>

        <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#111827] border border-[#e0e7f5] dark:border-[#1f2d4a] rounded-2xl shadow-xl overflow-hidden animate-[slideUp_0.5s_cubic-bezier(0.16,1,0.3,1)_both]">
          <div className="h-[3px] bg-gradient-to-r from-[#1f4fa3] via-indigo-500 to-sky-400" />
          <div className="p-12 text-center">
            <div className="w-18 h-18 rounded-full bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center mx-auto mb-6 shadow-[0_0_0_12px_rgba(13,148,136,0.1)]" style={{ width: 72, height: 72 }}>
              <CheckIcon />
            </div>
            <h1 className="text-2xl font-bold text-[#0d1b3e] dark:text-[#e8eeff] tracking-tight mb-2">Application Submitted!</h1>
            <p className="text-sm text-[#6b7a99] dark:text-[#8b9bbf] leading-relaxed max-w-xs mx-auto">
              Thank you, <strong className="text-[#0d1b3e] dark:text-[#e8eeff]">{form.firstName}</strong>.
              Your application has been received. SoVir's team will reach out within 3–5 business days.
            </p>
            <div className="inline-flex items-center gap-2 mt-6 bg-[#dbe8ff] dark:bg-[#1a2d5a] border border-[#1f4fa3]/20 px-4 py-2 rounded-full font-mono text-sm font-medium text-[#1f4fa3]">
              <FileText />
              Reference: {refCode}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Form ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f0f4ff] dark:bg-[#080e1f] flex items-start justify-center py-12 px-4 relative overflow-hidden transition-colors duration-300">

      {/* Animated background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute w-[600px] h-[600px] -top-48 -left-36 rounded-full bg-gradient-to-br from-blue-500 to-[#1f4fa3] opacity-[0.18] dark:opacity-[0.22] blur-[80px] animate-[float1_18s_ease-in-out_infinite]" />
        <div className="absolute w-[500px] h-[500px] -bottom-36 -right-24 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 opacity-[0.18] dark:opacity-[0.22] blur-[80px] animate-[float2_22s_ease-in-out_infinite]" />
        <div className="absolute w-[350px] h-[350px] top-[40%] right-[10%] rounded-full bg-gradient-to-br from-sky-400 to-sky-600 opacity-[0.15] dark:opacity-[0.18] blur-[80px] animate-[float3_16s_ease-in-out_infinite]" />
        {/* Dot grid overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(31,79,163,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(31,79,163,0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Form Card */}
      <div className="relative z-10 w-full max-w-[780px] bg-white dark:bg-[#111827] border border-[#e0e7f5] dark:border-[#1f2d4a] rounded-2xl shadow-[0_4px_6px_rgba(0,0,0,0.04),0_20px_60px_rgba(31,79,163,0.08)] overflow-hidden animate-[slideUp_0.5s_cubic-bezier(0.16,1,0.3,1)_both]">

        {/* ─── Card Header ─────────────────────────────────────────────────── */}
        <div className="relative pt-10 pb-6 px-10 border-b border-[#e0e7f5] dark:border-[#1f2d4a] text-center">
          {/* Top gradient stripe */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#1f4fa3] via-indigo-500 to-sky-400" />

          {/* Back button */}
          {step > 0 && (
            <button
              onClick={prevStep}
              className="absolute top-8 left-8 flex items-center gap-1.5 text-[#6b7a99] dark:text-[#8b9bbf] text-[13px] font-medium bg-transparent border-none cursor-pointer px-2.5 py-1.5 rounded-lg hover:text-[#1f4fa3] hover:bg-[#dbe8ff] dark:hover:bg-[#1a2d5a] transition-all duration-200"
            >
              <ArrowLeft />
              Back
            </button>
          )}

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.1em] text-[#1f4fa3] bg-[#dbe8ff] dark:bg-[#1a2d5a] px-3 py-1 rounded-full uppercase font-mono mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1f4fa3] inline-block" />
            SoVir Technologies
          </div>

          <h1 className="text-[30px] font-bold text-[#0d1b3e] dark:text-[#e8eeff] tracking-[-0.03em] leading-tight">
            Internship <span className="text-[#1f4fa3]">Application</span>
          </h1>
          <p className="text-[13px] text-[#6b7a99] dark:text-[#8b9bbf] mt-1 tracking-wide">
            Industrial Training Portal · 2025
          </p>

          {/* Step tracker */}
          <div className="flex items-center justify-center gap-0 mt-6">
            {stepLabels.map((label, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  <div
                    className={`w-20 h-0.5 mx-1 mb-[22px] transition-colors duration-300 ${stepsDone[i - 1] ? 'bg-teal-500' : 'bg-[#e0e7f5] dark:bg-[#1f2d4a]'
                      }`}
                  />
                )}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11px] font-bold font-mono transition-all duration-300 relative z-[2] ${stepsActive[i]
                        ? 'border-[#1f4fa3] bg-[#1f4fa3] text-white shadow-[0_0_0_4px_rgba(31,79,163,0.15)]'
                        : stepsDone[i]
                          ? 'border-teal-500 bg-teal-500 text-white'
                          : 'border-[#e0e7f5] dark:border-[#1f2d4a] bg-white dark:bg-[#111827] text-[#9aa3b8]'
                      }`}
                  >
                    {stepsDone[i] ? <CheckSmall /> : i + 1}
                  </div>
                  <span
                    className={`text-[10px] font-medium tracking-[0.05em] uppercase whitespace-nowrap ${stepsActive[i]
                        ? 'text-[#1f4fa3]'
                        : 'text-[#9aa3b8] dark:text-[#4a5878]'
                      }`}
                  >
                    {label}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ─── Form Body ───────────────────────────────────────────────────── */}
        <div className="p-10">

          {/* ── STEP 0: Personal Identity ──────────────────────────────────── */}
          {step === 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-[26px] h-[26px] rounded-full bg-[#1f4fa3] text-white text-[11px] font-bold font-mono flex items-center justify-center flex-shrink-0">1</div>
                <span className="text-[11px] font-bold text-[#1f4fa3] uppercase tracking-[0.12em] font-mono whitespace-nowrap">Personal Identity</span>
                <div className="flex-1 h-px bg-[#e0e7f5] dark:bg-[#1f2d4a]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="First Name" required error={errors.firstName}>
                  <input
                    type="text"
                    placeholder="Aarav"
                    value={form.firstName}
                    onChange={e => set('firstName', e.target.value)}
                    className={inputCls}
                  />
                </Field>

                <Field label="Last Name" required error={errors.lastName}>
                  <input
                    type="text"
                    placeholder="Sharma"
                    value={form.lastName}
                    onChange={e => set('lastName', e.target.value)}
                    className={inputCls}
                  />
                </Field>

                <Field label="Date of Birth" required error={errors.dob}>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={e => set('dob', e.target.value)}
                    className={inputCls}
                  />
                </Field>

                <Field label="Professional Email" required error={errors.email}>
                  <input
                    type="email"
                    placeholder="aarav@example.com"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    className={inputCls}
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="WhatsApp Number" required error={errors.whatsapp}>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={form.whatsapp}
                      onChange={e => set('whatsapp', e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={nextStep}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-[#1f4fa3] hover:bg-[#173c7d] text-white rounded-xl text-[15px] font-semibold transition-all duration-200 shadow-[0_4px_15px_rgba(31,79,163,0.3)] hover:shadow-[0_8px_25px_rgba(31,79,163,0.4)] hover:-translate-y-0.5 active:translate-y-0"
                >
                  Continue to Academic Details
                  <ArrowRight />
                </button>
              </div>
            </section>
          )}

          {/* ── STEP 1: Academic Background ────────────────────────────────── */}
          {step === 1 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-[26px] h-[26px] rounded-full bg-[#1f4fa3] text-white text-[11px] font-bold font-mono flex items-center justify-center flex-shrink-0">2</div>
                <span className="text-[11px] font-bold text-[#1f4fa3] uppercase tracking-[0.12em] font-mono whitespace-nowrap">Academic Background</span>
                <div className="flex-1 h-px bg-[#e0e7f5] dark:bg-[#1f2d4a]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Field label="College / University" required error={errors.college}>
                    <input
                      type="text"
                      placeholder="IIT Bombay, NIT Trichy…"
                      value={form.college}
                      onChange={e => set('college', e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>

                <Field label="Registration Number" required error={errors.registration}>
                  <input
                    type="text"
                    placeholder="2021XXXXXX"
                    value={form.registration}
                    onChange={e => set('registration', e.target.value)}
                    className={inputCls}
                  />
                </Field>

                <div>
                  <SelectField
                    label="Department"
                    required
                    error={errors.department}
                    value={form.department}
                    onChange={e => set('department', e.target.value)}
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </SelectField>

                  {/* Dynamic "Other" reveal */}
                  {form.department === 'Other' && (
                    <div className="mt-3 animate-[fadeIn_0.3s_ease]">
                      <Field label="Specify Department" required error={errors.customDept}>
                        <input
                          type="text"
                          placeholder="Enter your department"
                          value={form.customDept}
                          onChange={e => set('customDept', e.target.value)}
                          className={inputCls}
                        />
                      </Field>
                    </div>
                  )}
                </div>

                <SelectField
                  label="Current Semester"
                  required
                  error={errors.semester}
                  value={form.semester}
                  onChange={e => set('semester', e.target.value)}
                >
                  <option value="" disabled>Select semester</option>
                  {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                </SelectField>

                <div>
                  <SelectField
                    label="Expected Passing Year"
                    required
                    error={errors.passingYear}
                    value={form.passingYear}
                    onChange={e => set('passingYear', e.target.value)}
                  >
                    <option value="" disabled>Select year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </SelectField>

                  {/* Dynamic "Other" reveal */}
                  {form.passingYear === 'Other' && (
                    <div className="mt-3 animate-[fadeIn_0.3s_ease]">
                      <Field label="Enter Passing Year" required error={errors.customYear}>
                        <input
                          type="text"
                          placeholder="e.g. 2029"
                          value={form.customYear}
                          onChange={e => set('customYear', e.target.value)}
                          className={inputCls}
                        />
                      </Field>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Field label="Current Residential Address" required error={errors.address}>
                    <textarea
                      placeholder="House/Flat No., Street, City, State, PIN"
                      value={form.address}
                      onChange={e => set('address', e.target.value)}
                      rows={3}
                      className={`${inputCls} resize-y min-h-[80px]`}
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <SelectField
                    label="How did you hear about us?"
                    required
                    error={errors.source}
                    value={form.source}
                    onChange={e => set('source', e.target.value)}
                  >
                    <option value="" disabled>Select a source</option>
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </SelectField>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={nextStep}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-[#1f4fa3] hover:bg-[#173c7d] text-white rounded-xl text-[15px] font-semibold transition-all duration-200 shadow-[0_4px_15px_rgba(31,79,163,0.3)] hover:shadow-[0_8px_25px_rgba(31,79,163,0.4)] hover:-translate-y-0.5 active:translate-y-0"
                >
                  Continue to Resume Upload
                  <ArrowRight />
                </button>
              </div>
            </section>
          )}

          {/* ── STEP 2: Resume Upload ──────────────────────────────────────── */}
          {step === 2 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-[26px] h-[26px] rounded-full bg-[#1f4fa3] text-white text-[11px] font-bold font-mono flex items-center justify-center flex-shrink-0">3</div>
                <span className="text-[11px] font-bold text-[#1f4fa3] uppercase tracking-[0.12em] font-mono whitespace-nowrap">Resume Upload</span>
                <div className="flex-1 h-px bg-[#e0e7f5] dark:bg-[#1f2d4a]" />
              </div>

              <p className="text-[13px] text-[#6b7a99] dark:text-[#8b9bbf] mb-5 leading-relaxed">
                Upload your most recent resume. Highlight academic projects, technical skills, and any prior experience.
              </p>

              {/* Idle — drag & drop zone */}
              {uploadState === 'idle' && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-250 bg-[#f8faff] dark:bg-[#0d1629] ${dragOver
                      ? 'border-[#1f4fa3] bg-[#dbe8ff] dark:bg-[#1a2d5a] scale-[1.01]'
                      : 'border-[#e0e7f5] dark:border-[#1f2d4a] hover:border-[#1f4fa3] hover:bg-[#dbe8ff] dark:hover:bg-[#1a2d5a]'
                    }`}
                >
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={e => handleFile(e.target.files?.[0] ?? null)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="w-12 h-12 bg-[#dbe8ff] dark:bg-[#1a2d5a] rounded-xl flex items-center justify-center mx-auto mb-4 transition-transform duration-200 hover:-translate-y-1">
                    <UploadCloud />
                  </div>
                  <p className="text-[15px] font-semibold text-[#0d1b3e] dark:text-[#e8eeff] mb-1">
                    Drag & Drop your Resume here
                  </p>
                  <p className="text-[13px] text-[#6b7a99] dark:text-[#8b9bbf]">
                    or <span className="text-[#1f4fa3] underline cursor-pointer">click to browse</span>
                  </p>
                  <p className="text-[12px] text-[#9aa3b8] mt-3 font-mono">
                    Accepted: <span className="text-[#1f4fa3] font-medium">PDF · DOC · DOCX</span>
                    &nbsp;·&nbsp; Max: <span className="text-[#1f4fa3] font-medium">5 MB</span>
                  </p>
                </div>
              )}

              {/* Uploading — progress bar */}
              {uploadState === 'uploading' && (
                <div className="bg-[#f8faff] dark:bg-[#0d1629] border border-[#e0e7f5] dark:border-[#1f2d4a] rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-[#dbe8ff] dark:bg-[#1a2d5a] rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0d1b3e] dark:text-[#e8eeff] font-mono truncate max-w-[240px]">
                        {resume?.name}
                      </p>
                      <p className="text-xs text-[#6b7a99] font-mono">
                        {formatBytes(resume?.size ?? 0)}
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#e0e7f5] dark:bg-[#1f2d4a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#1f4fa3] to-indigo-500 rounded-full transition-[width] duration-100 linear"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-[#6b7a99] font-medium">Uploading resume…</span>
                    <span className="text-xs font-bold text-[#1f4fa3] font-mono">{uploadProgress}%</span>
                  </div>
                </div>
              )}

              {/* Done — success state */}
              {uploadState === 'done' && (
                <div className="flex items-center gap-3 p-4 bg-teal-50 dark:bg-teal-900/20 border-[1.5px] border-teal-200 dark:border-teal-800 rounded-xl animate-[fadeIn_0.4s_ease]">
                  <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                    <CheckIcon />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">Resume Uploaded Successfully</p>
                    <p className="text-xs text-[#6b7a99] font-mono">
                      {resume?.name} · {formatBytes(resume?.size ?? 0)}
                    </p>
                  </div>
                  <button
                    onClick={removeFile}
                    className="ml-auto p-1 rounded-md text-[#6b7a99] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                    title="Remove file"
                  >
                    <XIcon />
                  </button>
                </div>
              )}

              {/* Errors */}
              {uploadError && (
                <div className="flex items-center gap-1 mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                  <AlertCircle />
                  {uploadError}
                </div>
              )}
              {errors.resume && (
                <div className="flex items-center gap-1 mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                  <AlertCircle />
                  {errors.resume}
                </div>
              )}

              {/* Submit */}
              <div className="mt-8 pt-6 border-t border-[#e0e7f5] dark:border-[#1f2d4a]">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-[15px] font-semibold text-white transition-all duration-200 shadow-[0_4px_15px_rgba(31,79,163,0.3)] ${loading
                      ? 'bg-[#1f4fa3]/70 cursor-not-allowed'
                      : 'bg-[#1f4fa3] hover:bg-[#173c7d] hover:shadow-[0_8px_25px_rgba(31,79,163,0.4)] hover:-translate-y-0.5 active:translate-y-0'
                    }`}
                >
                  {loading ? (
                    <>
                      <div className="w-[18px] h-[18px] rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Submitting Application…
                    </>
                  ) : (
                    <>
                      <SendIcon />
                      Submit Application
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-[#9aa3b8] mt-4">
                  By submitting, you confirm all information is accurate and agree to{' '}
                  <a href="#" className="text-[#1f4fa3] no-underline hover:underline">SoVir's privacy policy</a>.
                </p>
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
};

export default InternshipApplicationPage;

// ─── tailwind.config.js additions ────────────────────────────────────────────
//
// Add these keyframes to your tailwind.config.js → theme.extend.keyframes
// and animation entries to theme.extend.animation:
//
// keyframes: {
//   slideUp: {
//     from: { opacity: '0', transform: 'translateY(24px)' },
//     to:   { opacity: '1', transform: 'translateY(0)' },
//   },
//   fadeIn: {
//     from: { opacity: '0', transform: 'translateY(-6px)' },
//     to:   { opacity: '1', transform: 'translateY(0)' },
//   },
//   float1: {
//     '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
//     '33%':      { transform: 'translate(60px, 80px) scale(1.05)' },
//     '66%':      { transform: 'translate(-40px, 40px) scale(0.97)' },
//   },
//   float2: {
//     '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
//     '40%':      { transform: 'translate(-70px, -60px) scale(1.08)' },
//     '70%':      { transform: 'translate(30px, -30px) scale(0.95)' },
//   },
//   float3: {
//     '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
//     '50%':      { transform: 'translate(-50px, 70px) scale(1.1)' },
//   },
// },
// animation: {
//   slideUp: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
//   fadeIn:  'fadeIn 0.3s ease',
//   float1:  'float1 18s ease-in-out infinite',
//   float2:  'float2 22s ease-in-out infinite',
//   float3:  'float3 16s ease-in-out infinite',
// },