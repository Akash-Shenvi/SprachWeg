import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

interface User {
    _id: string;
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    role: string;
    isEmailVerified: boolean;
    isProfileComplete?: boolean;
    avatar?: string;
    guardianName?: string;
    guardianPhone?: string;
    qualification?: string;
    dateOfBirth?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, phoneNumber: string, password: string, germanLevel?: string) => Promise<void>;
    googleLogin: (token: string) => Promise<void>;
    verifyOtp: (email: string, otp: string) => Promise<void>;
    resendOtp: (email: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    updateProfile: (data: Partial<User> | FormData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
            refreshUser();
        } else {
            setLoading(false);
        }
    }, []);

    const refreshUser = async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
        } catch (error) {
            console.error('Failed to refresh user:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const register = async (
        name: string,
        email: string,
        phoneNumber: string,
        password: string,
        germanLevel?: string
    ) => {
        const response = await api.post('/auth/register', {
            name,
            email,
            phoneNumber,
            password,
            germanLevel,
        });
        return response.data;
    };

    const verifyOtp = async (email: string, otp: string) => {
        const response = await api.post('/auth/verify-otp', { email, otp });
        const { token, user: userData } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const resendOtp = async (email: string) => {
        await api.post('/auth/resend-otp', { email });
    };

    const login = async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        const { token, user: userData } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const googleLogin = async (token: string) => {
        const response = await api.post('/auth/google', { token });
        const { token: jwtToken, user: userData } = response.data;

        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const updateProfile = async (data: Partial<User> | FormData) => {
        const isFormData = data instanceof FormData;
        const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
        const response = await api.put('/auth/profile/complete', data, config);
        const updatedUser = response.data;

        // Merge with existing token if needed, but usually we just update user data
        // API returns full user object
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                googleLogin,
                register,
                verifyOtp,
                resendOtp,
                logout,
                refreshUser,
                updateProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
