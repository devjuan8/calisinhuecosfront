import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 segundos de timeout para peticiones grandes (como crear reportes con imágenes)
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
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

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Reports
export const reportsAPI = {
  getAll: (params) => api.get('/reports', { params }),
  getById: (id) => api.get(`/reports/${id}`),
  create: (data) => api.post('/reports', data),
  vote: (id) => api.post(`/reports/${id}/vote`),
  updateStatus: (id, data) => api.put(`/reports/${id}/status`, data),
  assign: (id, data) => api.put(`/reports/${id}/assign`, data),
  getForMap: (params) => api.get('/reports/map', { params }),
  getPending: () => api.get('/reports/pending'),
  approve: (id) => api.put(`/reports/${id}/approve`),
  reject: (id, reason) => api.put(`/reports/${id}/reject`, { rejectionReason: reason }),
};

// Donations
export const donationsAPI = {
  create: (data) => api.post('/donations', data),
  getByReport: (reportId) => api.get(`/donations/report/${reportId}`),
  getMyDonations: () => api.get('/donations/my-donations'),
  getStats: () => api.get('/donations/stats'),
};

// Users
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getDashboard: () => api.get('/users/dashboard'),
  getMyReports: () => api.get('/users/my-reports'),
  createRepairer: (data) => api.post('/users/create-repairer', data),
  getRepairers: () => api.get('/users/repairers'),
};

export default api;

