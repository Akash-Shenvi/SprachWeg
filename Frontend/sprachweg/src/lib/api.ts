import axios from 'axios';
import type { InternshipPayload } from '../types/internship';
import type { WebinarPayload } from '../types/webinar';

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
            const nextAuthPath = window.location.pathname.startsWith('/institution')
                ? '/institution/login'
                : '/login';
            window.location.href = nextAuthPath;
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

export const trainingCheckoutAPI = {
    async create(data: { origin: string; selectedLevel?: string }) {
        const response = await api.post('/training-checkout/create', data);
        return response.data;
    },
    async verify(data: {
        attemptId: string;
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    }) {
        const response = await api.post('/training-checkout/verify', data);
        return response.data;
    },
    async recordFailure(data: {
        attemptId: string;
        status: 'failed' | 'cancelled';
        reason?: string;
        error?: Record<string, unknown>;
    }) {
        const response = await api.post('/training-checkout/failure', data);
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
            `/training-checkout/admin/payment-attempts${queryString ? `?${queryString}` : ''}`
        );
        return response.data;
    },
    async deletePaymentAttemptAdmin(paymentAttemptId: string) {
        const response = await api.delete(`/training-checkout/admin/payment-attempts/${paymentAttemptId}`);
        return response.data;
    },
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

export const webinarCatalogAPI = {
    async getAll() {
        const response = await api.get('/webinars');
        return response.data;
    },
    async getBySlug(slug: string) {
        const response = await api.get(`/webinars/${slug}`);
        return response.data;
    },
    async getAllAdmin() {
        const response = await api.get('/webinars/admin');
        return response.data;
    },
    async getAssignedTrainer() {
        const response = await api.get('/webinars/trainer/assigned');
        return response.data;
    },
    async create(data: WebinarPayload) {
        const response = await api.post('/webinars/admin', data);
        return response.data;
    },
    async update(id: string, data: WebinarPayload) {
        const response = await api.put(`/webinars/admin/${id}`, data);
        return response.data;
    },
};

export const webinarRegistrationAPI = {
    async createCheckout(data: { webinarId: string }) {
        const response = await api.post('/webinar-registrations/checkout', data);
        return response.data;
    },
    async verifyPayment(data: {
        attemptId: string;
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    }) {
        const response = await api.post('/webinar-registrations/verify-payment', data);
        return response.data;
    },
    async recordPaymentFailure(data: {
        attemptId: string;
        status: 'failed' | 'cancelled';
        reason?: string;
        error?: Record<string, unknown>;
    }) {
        const response = await api.post('/webinar-registrations/payment-failure', data);
        return response.data;
    },
    async getApprovedMine() {
        const response = await api.get('/webinar-registrations/me/approved');
        return response.data;
    },
    async getAllAdmin(params?: { page?: number; limit?: number; search?: string; status?: string }) {
        const searchParams = new URLSearchParams();

        if (params?.page) {
            searchParams.set('page', String(params.page));
        }

        if (params?.limit) {
            searchParams.set('limit', String(params.limit));
        }

        if (params?.search) {
            searchParams.set('search', params.search);
        }

        if (params?.status) {
            searchParams.set('status', params.status);
        }

        const queryString = searchParams.toString();
        const response = await api.get(`/webinar-registrations/admin${queryString ? `?${queryString}` : ''}`);
        return response.data;
    },
    async updateStatus(id: string, status: 'accepted' | 'rejected') {
        const response = await api.patch(`/webinar-registrations/admin/${id}/status`, { status });
        return response.data;
    },
};

export const institutionAPI = {
    async getDashboard() {
        const response = await api.get('/institutions/dashboard');
        return response.data;
    },
    async getSubmissions() {
        const response = await api.get('/institutions/submissions');
        return response.data;
    },
    async createSubmission(data: {
        language: 'German';
        courseTitle: string;
        levelName: string;
        students: Array<{ name: string; email: string; password: string }>;
    }) {
        const response = await api.post('/institutions/submissions', data);
        return response.data;
    },
    async getAdminRequests(params?: { status?: string; search?: string }) {
        const searchParams = new URLSearchParams();

        if (params?.status) {
            searchParams.set('status', params.status);
        }

        if (params?.search) {
            searchParams.set('search', params.search);
        }

        const queryString = searchParams.toString();
        const response = await api.get(`/admin/institutions/requests${queryString ? `?${queryString}` : ''}`);
        return response.data;
    },
    async approveRequest(id: string) {
        const response = await api.post(`/admin/institutions/requests/${id}/approve`);
        return response.data;
    },
    async rejectRequest(id: string, reason?: string) {
        const response = await api.post(`/admin/institutions/requests/${id}/reject`, reason ? { reason } : {});
        return response.data;
    },
};

export default api;

