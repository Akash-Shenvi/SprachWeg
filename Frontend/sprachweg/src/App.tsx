import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ScrollToTop from './components/layout/ScrollToTop';
import ProfileCompletionModal from './components/auth/ProfileCompletionModal';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import StudentDashboard from './pages/StudentDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import AdminDashboard from './pages/Admin/AdminDashboard';
import SkillDashboard from './pages/Admin/SkillDashboard';
import SkillDashboard1 from './pages/Admin/SkillDashboard1';
import LanguageDashboard from './pages/Admin/LanguageDashboard';
import LanguageEnrollmentDetails from './pages/Admin/LanguageEnrollmentDetails';
import LanguageBatches from './pages/Admin/LanguageBatches';
import LanguageBatchDetails from './pages/LanguageBatchDetails';
import LanguageTraining from './pages/LanguageTraining';
import CourseEnglishPage from './pages/CourseEnglishPage';
import CourseGermanPage from './pages/CourseGermanPage';
import CourseJapanesePage from './pages/CourseJapanesePage';
import SkillTrainingOverviewPage from './pages/skill_training/SkillTrainingOverviewPage';
import SCADAAndHMIPage from './pages/skill_training/SCADAAndHMIPage';
import PLCIndustrialAutomationPage from './pages/skill_training/PLCIndustrialAutomationPage';
import IndustrialDrivesMotionPage from './pages/skill_training/IndustrialDrivesMotionPage';
import AdvancedIndustry4Page from './pages/skill_training/AdvancedIndustry4Page';
import CustomizedCorporateTrainingPage from './pages/skill_training/CustomizedCorporateTrainingPage';
import NotFound404 from './pages/NotFound404';
import AboutPage from './pages/About';
import GoogleCallback from './pages/GoogleCallback';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import ContactPage from './pages/ContactPage';
import AdminContactMessages from './pages/Admin/AdminContactMessages';


// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'trainer') return <Navigate to="/trainer-dashboard" replace />;
    return <Navigate to="/student-dashboard" replace />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const TrainerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user || user.role !== 'trainer') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const { user } = useAuth();

  // Determine if profile is incomplete
  // user.isProfileComplete is virtual from backend, so it relies on the response
  // If undefined, we assume false or check specific fields if needed. 
  // But safer to rely on flag if backend sends it.
  const isProfileIncomplete = user && user.isProfileComplete === false;

  return (
    <>
      <ScrollToTop />
      <ProfileCompletionModal isOpen={!!isProfileIncomplete} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/language-training" element={<LanguageTraining />} />
        <Route path="/training/english" element={<CourseEnglishPage />} />
        <Route path="/training/german" element={<CourseGermanPage />} />
        <Route path="/training/japanese" element={<CourseJapanesePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/contact" element={<ContactPage />} />


        {/* Skill Training Routes */}
        <Route path="/skill-training" element={<SkillTrainingOverviewPage />} />
        <Route path="/skill-training/scada" element={<SCADAAndHMIPage />} />
        <Route path="/skill-training/plc" element={<PLCIndustrialAutomationPage />} />
        <Route path="/skill-training/drives" element={<IndustrialDrivesMotionPage />} />
        <Route path="/skill-training/industry4" element={<AdvancedIndustry4Page />} />
        <Route path="/skill-training/industry4" element={<AdvancedIndustry4Page />} />
        <Route path="/skill-training/corporate" element={<CustomizedCorporateTrainingPage />} />


        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer-dashboard"
          element={
            <TrainerRoute>
              <TrainerDashboard />
            </TrainerRoute>
          }
        />

        {/* Admin Routes */}
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route
          path="/admin-dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/skills"
          element={
            <AdminRoute>
              <SkillDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/skills-details"
          element={
            <AdminRoute>
              <SkillDashboard1 />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/languages"
          element={
            <AdminRoute>
              <LanguageDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/language-enrollment-details"
          element={
            <AdminRoute>
              <LanguageEnrollmentDetails />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/language-batches"
          element={
            <AdminRoute>
              <LanguageBatches />
            </AdminRoute>
          }
        />
        <Route
          path="/language-batch/:batchId"
          element={
            <ProtectedRoute>
              <LanguageBatchDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/messages"
          element={
            <AdminRoute>
              <AdminContactMessages />
            </AdminRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<NotFound404 />} />
      </Routes >
    </>
  );
};

const App = () => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default App;