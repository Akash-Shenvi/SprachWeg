import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { internshipApplicationAPI } from '../../lib/api';

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
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);

const FileText = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CheckSmall = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
type ApplicationStatus = 'submitted' | 'accepted' | 'rejected' | 'reviewed' | 'shortlisted';

interface ExistingApplication {
  _id: string;
  internshipTitle: string;
  status: ApplicationStatus;
  referenceCode: string;
}

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
  return 'SOV-' + Math.random().toString(36).substr(2, 8).toUpperCase();
}

function getStatusText(status: ApplicationStatus): string {
  switch (status) {
    case 'accepted':
      return 'Accepted';
    case 'reviewed':
      return 'Under Review';
    case 'shortlisted':
      return 'Shortlisted';
    case 'submitted':
      return 'Submitted';
    default:
      return 'Rejected';
  }
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
      <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
        {label}
        {required && <span className="text-[#d6b161] text-[10px]">*</span>}
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
      className="w-full appearance-none cursor-pointer rounded-lg border-[1.5px] border-gray-200 bg-white px-4 py-3 text-sm text-[#0a192f] outline-none transition-all duration-200 hover:border-[#d6b161]/50 focus:border-[#d6b161] focus:bg-white focus:ring-2 focus:ring-[#d6b161]/20 dark:border-white/10 dark:bg-[#0f223f] dark:text-white dark:focus:bg-[#112240] font-[Sora,system-ui]"
      {...props}
    >
      {children}
    </select>
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
      <ChevronDown />
    </span>
  </Field>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const InternshipApplicationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [step, setStep] = useState<number>(0);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [refCode, setRefCode] = useState<string>(generateRef());
  const [submitError, setSubmitError] = useState<string>('');
  const [checkingExistingApplication, setCheckingExistingApplication] = useState<boolean>(true);
  const [existingApplication, setExistingApplication] = useState<ExistingApplication | null>(null);
  const internshipTitle = searchParams.get('internship')?.trim() || 'General Internship';

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

  useEffect(() => {
    if (!user) return;

    const fullName = user.name?.trim().split(/\s+/).filter(Boolean) ?? [];
    const firstName = fullName[0] ?? '';
    const lastName = fullName.slice(1).join(' ');
    const dob = user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '';

    setForm(current => ({
      ...current,
      firstName: current.firstName || firstName,
      lastName: current.lastName || lastName,
      dob: current.dob || dob,
      email: current.email || user.email || '',
      whatsapp: current.whatsapp || user.phoneNumber || '',
    }));
  }, [user]);

  useEffect(() => {
    if (!user) {
      setExistingApplication(null);
      setCheckingExistingApplication(false);
      return;
    }

    let isMounted = true;

    const checkExistingApplication = async () => {
      setCheckingExistingApplication(true);

      try {
        const response = await internshipApplicationAPI.getMine();
        const matchedApplication = (response.applications || []).find((application: ExistingApplication) =>
          application.internshipTitle?.trim().toLowerCase() === internshipTitle.toLowerCase() &&
          application.status !== 'rejected'
        ) || null;

        if (!isMounted) return;

        setExistingApplication(matchedApplication);
        if (matchedApplication?.referenceCode) {
          setRefCode(matchedApplication.referenceCode);
        }
      } catch (err) {
        console.error('Failed to check existing internship applications:', err);
        if (!isMounted) return;
        setExistingApplication(null);
      } finally {
        if (isMounted) {
          setCheckingExistingApplication(false);
        }
      }
    };

    checkExistingApplication();

    return () => {
      isMounted = false;
    };
  }, [internshipTitle, user]);

  useEffect(() => {
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  const set = (field: keyof FormData, val: string) => {
    setForm(f => ({ ...f, [field]: val }));
    setSubmitError('');
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
    setSubmitError('');
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
    setSubmitError('');
    setErrors(e => ({ ...e, resume: '' }));
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleSubmit = async () => {
    if (!validateStep(2)) return;
    if (existingApplication) {
      setSubmitError('You have already applied for this internship.');
      return;
    }
    if (!resume) {
      setErrors(e => ({ ...e, resume: 'Please upload your resume to continue' }));
      return;
    }

    setSubmitError('');
    setLoading(true);

    try {
      const payload = new FormData();
      payload.append('internshipTitle', internshipTitle);
      payload.append('firstName', form.firstName.trim());
      payload.append('lastName', form.lastName.trim());
      payload.append('dob', form.dob);
      payload.append('email', form.email.trim());
      payload.append('whatsapp', form.whatsapp.trim());
      payload.append('college', form.college.trim());
      payload.append('registration', form.registration.trim());
      payload.append('department', form.department === 'Other' ? form.customDept.trim() : form.department);
      payload.append('semester', form.semester);
      payload.append('passingYear', form.passingYear === 'Other' ? form.customYear.trim() : form.passingYear);
      payload.append('address', form.address.trim());
      payload.append('source', form.source);
      payload.append('resume', resume);

      const response = await internshipApplicationAPI.submit(payload);
      setRefCode(response.application?.referenceCode || generateRef());
      setLoading(false);
      setSubmitted(true);
    } catch (err: any) {
      setLoading(false);
      setSubmitError(err.response?.data?.message || 'Failed to submit your application. Please try again.');
    }
  };

  // ─── Input class (shared) ───────────────────────────────────────────────────
  const inputCls =
    'w-full rounded-lg border-[1.5px] border-gray-200 bg-white px-4 py-3 text-sm text-[#0a192f] outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-[#d6b161]/50 focus:border-[#d6b161] focus:bg-white focus:ring-2 focus:ring-[#d6b161]/20 dark:border-white/10 dark:bg-[#0f223f] dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-[#112240] font-[Sora,system-ui]';
  const primaryButtonCls =
    'w-full flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-[15px] font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 bg-[#0a192f] text-white shadow-[0_10px_30px_rgba(10,25,47,0.18)] hover:bg-[#112240] hover:shadow-[0_14px_36px_rgba(10,25,47,0.24)] dark:bg-[#d6b161] dark:text-[#0a192f] dark:hover:bg-[#c4a055] dark:shadow-[0_10px_30px_rgba(214,177,97,0.16)]';

  const stepLabels = ['Personal', 'Academic', 'Resume'];
  const stepsDone = [step > 0, step > 1, submitted];
  const stepsActive = [step === 0, step === 1, step === 2];

  // ─── Success Screen ─────────────────────────────────────────────────────────
  if (checkingExistingApplication) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50 px-4 py-16 text-gray-900 transition-colors duration-300 dark:bg-[#0a192f] dark:text-gray-100">
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -left-36 -top-48 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#d6b161]/25 to-[#c4a055]/10 opacity-[0.22] blur-[100px] animate-[float1_18s_ease-in-out_infinite]" />
          <div className="absolute -bottom-36 -right-24 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#112240]/25 to-[#0a192f]/5 opacity-[0.2] blur-[100px] animate-[float2_22s_ease-in-out_infinite]" />
        </div>

        <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white/95 p-10 text-center shadow-[0_20px_60px_rgba(10,25,47,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-[#112240]/95 dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="mx-auto mb-5 h-12 w-12 rounded-full border-4 border-[#d6b161]/30 border-t-[#d6b161] animate-spin" />
          <h2 className="text-2xl font-bold text-[#0a192f] dark:text-white">Checking your application</h2>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            We&apos;re verifying whether you have already applied for this internship.
          </p>
        </div>
      </div>
    );
  }

  if (existingApplication) {
    return (
      <div className="relative flex min-h-screen items-start justify-center overflow-hidden bg-gray-50 px-4 py-16 text-gray-900 transition-colors duration-300 dark:bg-[#0a192f] dark:text-gray-100">
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -left-36 -top-48 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#d6b161]/25 to-[#c4a055]/10 opacity-[0.22] blur-[100px] animate-[float1_18s_ease-in-out_infinite]" />
          <div className="absolute -bottom-36 -right-24 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#112240]/25 to-[#0a192f]/5 opacity-[0.2] blur-[100px] animate-[float2_22s_ease-in-out_infinite]" />
        </div>

        <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-[0_20px_60px_rgba(10,25,47,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-[#112240]/95 dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="h-[3px] bg-gradient-to-r from-[#0a192f] via-[#d6b161] to-[#c4a055] dark:from-[#d6b161] dark:via-[#c4a055] dark:to-[#f1d18a]" />
          <div className="p-10 text-center">
            <div className="mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#d6b161]/15 text-[#d6b161] shadow-[0_0_0_12px_rgba(214,177,97,0.12)]">
              <FileText />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0a192f] dark:text-white">
              You have already applied
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Your application for <span className="font-semibold text-[#0a192f] dark:text-white">{internshipTitle}</span> is already on record.
              You can apply again only if this application gets rejected.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-left dark:border-white/10 dark:bg-[#0f223f]">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Reference ID</p>
                <p className="mt-2 font-mono text-sm font-bold text-[#0a192f] dark:text-white">{existingApplication.referenceCode}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-left dark:border-white/10 dark:bg-[#0f223f]">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Current Status</p>
                <p className="mt-2 text-sm font-bold text-[#0a192f] dark:text-white">{getStatusText(existingApplication.status)}</p>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <a
                href="/careers"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0a192f] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#112240] dark:bg-[#d6b161] dark:text-[#0a192f] dark:hover:bg-[#c4a055]"
              >
                <ArrowLeft />
                Back to Careers
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="relative flex min-h-screen items-start justify-center overflow-hidden bg-gray-50 px-4 py-16 text-gray-900 transition-colors duration-300 dark:bg-[#0a192f] dark:text-gray-100">
        {/* Animated blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -left-36 -top-48 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#d6b161]/25 to-[#c4a055]/10 opacity-[0.22] blur-[100px] animate-[float1_18s_ease-in-out_infinite]" />
          <div className="absolute -bottom-36 -right-24 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#112240]/25 to-[#0a192f]/5 opacity-[0.2] blur-[100px] animate-[float2_22s_ease-in-out_infinite]" />
        </div>

        <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-[0_20px_60px_rgba(10,25,47,0.12)] backdrop-blur-sm animate-[slideUp_0.5s_cubic-bezier(0.16,1,0.3,1)_both] dark:border-white/10 dark:bg-[#112240]/95 dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="h-[3px] bg-gradient-to-r from-[#0a192f] via-[#d6b161] to-[#c4a055] dark:from-[#d6b161] dark:via-[#c4a055] dark:to-[#f1d18a]" />
          <div className="p-12 text-center">
            <div className="w-18 h-18 mx-auto mb-6 flex items-center justify-center rounded-full bg-gradient-to-br from-[#d6b161] to-[#c4a055] text-[#0a192f] shadow-[0_0_0_12px_rgba(214,177,97,0.18)]" style={{ width: 72, height: 72 }}>
              <CheckIcon />
            </div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-[#0a192f] dark:text-white">Application Submitted!</h1>
            <p className="mx-auto max-w-xs text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Thank you, <strong className="text-[#0a192f] dark:text-white">{form.firstName}</strong>.
              Your application has been received. SoVir's team will reach out within 3–5 business days.
            </p>
            <div className="mt-4 inline-flex items-center justify-center rounded-full border border-[#d6b161]/30 bg-[#d6b161]/10 px-4 py-2 text-xs font-semibold text-[#b38f3f] dark:text-[#d6b161]">
              Applying for: {internshipTitle}
            </div>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#d6b161]/20 bg-[#0a192f]/5 px-4 py-2 font-mono text-sm font-medium text-[#0a192f] dark:bg-[#0a192f]/40 dark:text-[#d6b161]">
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
    <div className="relative flex min-h-screen items-start justify-center overflow-hidden bg-gray-50 px-4 py-12 text-gray-900 transition-colors duration-300 dark:bg-[#0a192f] dark:text-gray-100">

      {/* Animated background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -left-36 -top-48 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#d6b161]/25 to-[#c4a055]/10 opacity-[0.22] blur-[100px] animate-[float1_18s_ease-in-out_infinite]" />
        <div className="absolute -bottom-36 -right-24 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#112240]/25 to-[#0a192f]/5 opacity-[0.2] dark:opacity-[0.28] blur-[100px] animate-[float2_22s_ease-in-out_infinite]" />
        <div className="absolute right-[10%] top-[40%] h-[350px] w-[350px] rounded-full bg-gradient-to-br from-[#d6b161]/15 to-transparent opacity-[0.18] blur-[90px] animate-[float3_16s_ease-in-out_infinite]" />
        {/* Dot grid overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(214,177,97,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(214,177,97,0.06) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Form Card */}
      <div className="relative z-10 w-full max-w-[780px] overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-[0_20px_60px_rgba(10,25,47,0.12)] backdrop-blur-sm animate-[slideUp_0.5s_cubic-bezier(0.16,1,0.3,1)_both] dark:border-white/10 dark:bg-[#112240]/95 dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)]">

        {/* ─── Card Header ─────────────────────────────────────────────────── */}
        <div className="relative border-b border-gray-200 px-10 pb-6 pt-10 text-center dark:border-white/10">
          {/* Top gradient stripe */}
          <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#0a192f] via-[#d6b161] to-[#c4a055] dark:from-[#d6b161] dark:via-[#c4a055] dark:to-[#f1d18a]" />

          {/* Back button */}
          {step > 0 && (
            <button
              onClick={prevStep}
              className="absolute left-8 top-8 flex cursor-pointer items-center gap-1.5 rounded-lg border-none bg-transparent px-2.5 py-1.5 text-[13px] font-medium text-gray-500 transition-all duration-200 hover:bg-[#d6b161]/10 hover:text-[#d6b161] dark:text-gray-300"
            >
              <ArrowLeft />
              Back
            </button>
          )}

          {/* Badge */}
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#d6b161]/20 bg-[#d6b161]/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#d6b161]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#d6b161]" />
            SoVir Technologies
          </div>

          <h1 className="text-[30px] font-bold tracking-[-0.03em] leading-tight text-[#0a192f] dark:text-white">
            Internship <span className="text-[#d6b161]">Application</span>
          </h1>
          <p className="mt-1 text-[13px] tracking-wide text-gray-500 dark:text-gray-400">
            Industrial Training Portal · 2025
          </p>

          <div className="mt-4 inline-flex items-center justify-center rounded-full border border-[#d6b161]/30 bg-[#d6b161]/10 px-4 py-2 text-xs font-semibold text-[#b38f3f] dark:text-[#d6b161]">
            Applying for: {internshipTitle}
          </div>

          {/* Step tracker */}
          <div className="flex items-center justify-center gap-0 mt-6">
            {stepLabels.map((label, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  <div
                    className={`w-20 h-0.5 mx-1 mb-[22px] transition-colors duration-300 ${stepsDone[i - 1] ? 'bg-[#d6b161]' : 'bg-gray-200 dark:bg-white/10'
                      }`}
                  />
                )}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11px] font-bold font-mono transition-all duration-300 relative z-[2] ${stepsActive[i]
                      ? 'border-[#d6b161] bg-[#d6b161] text-[#0a192f] shadow-[0_0_0_4px_rgba(214,177,97,0.18)]'
                      : stepsDone[i]
                        ? 'border-[#d6b161] bg-[#d6b161] text-[#0a192f]'
                        : 'border-gray-200 bg-white text-gray-400 dark:border-white/10 dark:bg-[#112240] dark:text-gray-500'
                      }`}
                  >
                    {stepsDone[i] ? <CheckSmall /> : i + 1}
                  </div>
                  <span
                    className={`text-[10px] font-medium tracking-[0.05em] uppercase whitespace-nowrap ${stepsActive[i]
                      ? 'text-[#d6b161]'
                      : 'text-gray-400 dark:text-gray-500'
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
                <div className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full bg-[#d6b161] font-mono text-[11px] font-bold text-[#0a192f]">1</div>
                <span className="whitespace-nowrap font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#d6b161]">Personal Identity</span>
                <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="First Name" required error={errors.firstName}>
                  <input
                    type="text"
                    placeholder="Joylan"
                    value={form.firstName}
                    onChange={e => set('firstName', e.target.value)}
                    className={inputCls}
                  />
                </Field>

                <Field label="Last Name" required error={errors.lastName}>
                  <input
                    type="text"
                    placeholder="Dsouza"
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
                  className={primaryButtonCls}
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
                <div className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full bg-[#d6b161] font-mono text-[11px] font-bold text-[#0a192f]">2</div>
                <span className="whitespace-nowrap font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#d6b161]">Academic Background</span>
                <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
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
                  className={primaryButtonCls}
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
                <div className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full bg-[#d6b161] font-mono text-[11px] font-bold text-[#0a192f]">3</div>
                <span className="whitespace-nowrap font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#d6b161]">Resume Upload</span>
                <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
              </div>

              <p className="mb-5 text-[13px] leading-relaxed text-gray-600 dark:text-gray-300">
                Upload your most recent resume. Highlight academic projects, technical skills, and any prior experience.
              </p>

              {/* Idle — drag & drop zone */}
              {uploadState === 'idle' && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative cursor-pointer rounded-xl border-2 border-dashed bg-white p-10 text-center transition-all duration-250 dark:bg-[#0f223f] ${dragOver
                    ? 'scale-[1.01] border-[#d6b161] bg-[#d6b161]/10 dark:bg-[#d6b161]/10'
                    : 'border-gray-200 hover:border-[#d6b161] hover:bg-[#d6b161]/5 dark:border-white/10 dark:hover:bg-[#d6b161]/10'
                    }`}
                >
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={e => handleFile(e.target.files?.[0] ?? null)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#d6b161]/15 text-[#d6b161] transition-transform duration-200 hover:-translate-y-1">
                    <UploadCloud />
                  </div>
                  <p className="mb-1 text-[15px] font-semibold text-[#0a192f] dark:text-white">
                    Drag & Drop your Resume here
                  </p>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400">
                    or <span className="cursor-pointer text-[#d6b161] underline">click to browse</span>
                  </p>
                  <p className="mt-3 font-mono text-[12px] text-gray-400 dark:text-gray-500">
                    Accepted: <span className="font-medium text-[#d6b161]">PDF · DOC · DOCX</span>
                    &nbsp;·&nbsp; Max: <span className="font-medium text-[#d6b161]">5 MB</span>
                  </p>
                </div>
              )}

              {/* Uploading — progress bar */}
              {uploadState === 'uploading' && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#0f223f]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#d6b161]/15 text-[#d6b161]">
                      <FileText />
                    </div>
                    <div>
                      <p className="max-w-[240px] truncate font-mono text-sm font-semibold text-[#0a192f] dark:text-white">
                        {resume?.name}
                      </p>
                      <p className="font-mono text-xs text-gray-500 dark:text-gray-400">
                        {formatBytes(resume?.size ?? 0)}
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#d6b161] to-[#c4a055] transition-[width] duration-100 linear"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Uploading resume…</span>
                    <span className="font-mono text-xs font-bold text-[#d6b161]">{uploadProgress}%</span>
                  </div>
                </div>
              )}

              {/* Done — success state */}
              {uploadState === 'done' && (
                <div className="flex items-center gap-3 rounded-xl border border-[#d6b161]/20 bg-[#d6b161]/10 p-4 animate-[fadeIn_0.4s_ease]">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#d6b161] text-[#0a192f]">
                    <CheckIcon />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0a192f] dark:text-[#f7d78d]">Resume Uploaded Successfully</p>
                    <p className="font-mono text-xs text-gray-500 dark:text-gray-400">
                      {resume?.name} · {formatBytes(resume?.size ?? 0)}
                    </p>
                  </div>
                  <button
                    onClick={removeFile}
                    className="ml-auto rounded-md p-1 text-gray-500 transition-all duration-200 hover:bg-red-50 hover:text-red-500 dark:text-gray-400 dark:hover:bg-red-900/20"
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
              {submitError && (
                <div className="flex items-center gap-1 mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                  <AlertCircle />
                  {submitError}
                </div>
              )}

              {/* Submit */}
              <div className="mt-8 border-t border-gray-200 pt-6 dark:border-white/10">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-[15px] font-semibold transition-all duration-200 ${loading
                    ? 'cursor-not-allowed bg-[#0a192f]/70 text-white dark:bg-[#d6b161]/70 dark:text-[#0a192f]'
                    : primaryButtonCls
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
                <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
                  By submitting, you confirm all information is accurate and agree to{' '}
                  <a href="#" className="text-[#b38f3f] no-underline hover:underline dark:text-[#d6b161]">SoVir's privacy policy</a>.
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
