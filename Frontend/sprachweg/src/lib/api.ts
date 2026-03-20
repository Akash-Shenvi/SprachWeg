import axios from 'axios';
import type { InternshipPayload } from '../types/internship';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const getAssetUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    if (cleanPath.startsWith('/uploads')) {
        return `${API_BASE_URL}/api${cleanPath}`;
    }
    return `${API_BASE_URL}${cleanPath}`;
};

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    async resetPassword(data: { email: string; otp: string; newPassword: string }) {
        const response = await api.post('/auth/reset-password', data);
        return response.data;
    },
    async forgotPassword(email: string) {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },
};

// Dashboard API
export const dashboardAPI = {
    getStudentData: async () => {
        const response = await api.get('/dashboard/student');
        return response.data;
    },
    getTrainerData: async () => {
        const response = await api.get('/dashboard/trainer');
        return response.data;
    }
};

export const enrollmentAPI = {
    enroll: async (courseId: string) => {
        const response = await api.post('/enrollment/enroll', { courseId });
        return response.data;
    },
    getPending: async () => {
        const response = await api.get('/enrollment/pending');
        return response.data;
    },
    accept: async (enrollmentId: string) => {
        const response = await api.post('/enrollment/accept', { enrollmentId });
        return response.data;
    },
    reject: async (enrollmentId: string) => {
        const response = await api.post('/enrollment/reject', { enrollmentId });
        return response.data;
    }
};

// Skill Course API
export const skillAPI = {
    async getAll(search?: string) {
        const url = search ? `/skills?search=${encodeURIComponent(search)}` : '/skills';
        const response = await api.get(url);
        return response.data;
    },

    async create(data: FormData) {
        const response = await api.post('/skills', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async update(id: string, data: FormData) {
        const response = await api.put(`/skills/${id}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async delete(id: string) {
        const response = await api.delete(`/skills/${id}`);
        return response.data;
    },
};

// Language Course API
export const languageAPI = {
    async getAll() {
        const response = await api.get('/languages');
        return response.data;
    },

    async create(data: FormData) {
        const response = await api.post('/languages', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async update(id: string, data: FormData) {
        const response = await api.put(`/languages/${id}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async delete(id: string) {
        const response = await api.delete(`/languages/${id}`);
        return response.data;
    },
};

export const skillTrainingDetailAPI = {
    async get(courseId: string) {
        const response = await api.get(`/skill-training-details/${courseId}`);
        return response.data;
    },
    async update(data: any) {
        const response = await api.post('/skill-training-details', data);
        return response.data;
    }
};

export const internshipApplicationAPI = {
    async createCheckout(data: FormData) {
        const response = await api.post('/internship-applications', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    async verifyPayment(data: {
        attemptId: string;
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    }) {
        const response = await api.post('/internship-applications/verify-payment', data);
        return response.data;
    },
    async recordPaymentFailure(data: {
        attemptId: string;
        status: 'failed' | 'cancelled';
        reason?: string;
        error?: Record<string, unknown>;
    }) {
        const response = await api.post('/internship-applications/payment-failure', data);
        return response.data;
    },
    async getMine() {
        const response = await api.get('/internship-applications/me');
        return response.data;
    },
    async getMyEnrolled() {
        const response = await api.get('/internship-applications/me/enrolled');
        return response.data;
    },
    async getAllAdmin() {
        const response = await api.get('/internship-applications/admin');
        return response.data;
    },
    async getAllPaymentAttemptsAdmin(params?: { page?: number; limit?: number; issuesOnly?: boolean; status?: string }) {
        const searchParams = new URLSearchParams();

        if (params?.page) {
            searchParams.set('page', String(params.page));
        }

        if (params?.limit) {
            searchParams.set('limit', String(params.limit));
        }

        if (params?.issuesOnly) {
            searchParams.set('issuesOnly', 'true');
        }

        if (params?.status) {
            searchParams.set('status', params.status);
        }

        const queryString = searchParams.toString();
        const response = await api.get(
            `/internship-applications/admin/payment-attempts${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    },
    async deletePaymentAttemptAdmin(paymentAttemptId: string) {
        const response = await api.delete(`/internship-applications/admin/payment-attempts/${paymentAttemptId}`);
        return response.data;
    },
    async updateStatus(applicationId: string, status: 'accepted' | 'rejected') {
        const response = await api.patch(`/internship-applications/admin/${applicationId}/status`, { status });
        return response.data;
    },
    async deleteRejected(applicationId: string) {
        const response = await api.delete(`/internship-applications/admin/${applicationId}`);
        return response.data;
    },
};

export const internshipCatalogAPI = {
    async getAll() {
        const response = await api.get('/internships');
        return response.data;
    },
    async getBySlug(slug: string) {
        const response = await api.get(`/internships/${slug}`);
        return response.data;
    },
    async getAllAdmin() {
        const response = await api.get('/internships/admin');
        return response.data;
    },
    async create(data: InternshipPayload) {
        const response = await api.post('/internships/admin', data);
        return response.data;
    },
    async update(id: string, data: InternshipPayload) {
        const response = await api.put(`/internships/admin/${id}`, data);
        return response.data;
    },
    async delete(id: string) {
        const response = await api.delete(`/internships/admin/${id}`);
        return response.data;
    },
};

export default api;

