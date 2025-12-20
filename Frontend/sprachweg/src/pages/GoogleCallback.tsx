import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const GoogleCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const code = searchParams.get('code');

    useEffect(() => {
        if (code) {
            handleCallback();
        } else {
            navigate('/dashboard');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code, navigate]);

    const handleCallback = async () => {
        try {
            await api.post('/auth/google/callback', { code });

            // Get the return URL from sessionStorage (stored before OAuth redirect)
            const returnUrl = sessionStorage.getItem('googleOAuthReturnUrl');

            sessionStorage.removeItem('googleOAuthReturnUrl'); // Clean up

            // Redirect back to where they came from, or to their dashboard
            if (returnUrl) {

                navigate(`${returnUrl}?googleConnected=true`);
            } else {

                // Fallback to role-based dashboard
                const dashboard = user?.role === 'trainer' ? '/trainer-dashboard' : '/dashboard';
                navigate(dashboard);
            }
        } catch (error) {
            console.error('Google Auth Failed', error);
            alert('Failed to connect Google Calendar.');
            const dashboard = user?.role === 'trainer' ? '/trainer-dashboard' : '/dashboard';
            navigate(dashboard);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d6b161] border-t-transparent mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Connecting to Google...</h2>
                <p className="text-gray-500">Please wait while we complete the setup.</p>
            </div>
        </div>
    );
};

export default GoogleCallback;
