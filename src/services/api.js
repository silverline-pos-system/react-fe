import axios from 'axios';

// Configuration
const API_URL = "http://localhost:8080/api";

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Interceptor to add token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Add Branch ID header if selected
    const selectedBranchId = localStorage.getItem('selectedBranchId');
    if (selectedBranchId) {
        config.headers['X-Branch-ID'] = selectedBranchId;
    }

    // Suppress logging for print-settings requests (optional config)
    const isPrintSettings = config.url?.includes('print-settings');
    if (!isPrintSettings) {
        console.log('[API] Request:', config.method?.toUpperCase(), config.baseURL + config.url);
    }
    return config;
}, (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
});

// Response interceptor to handle common errors
api.interceptors.response.use(
    (response) => {
        // Suppress logging for print-settings responses (optional config)
        const isPrintSettings = response.config?.url?.includes('print-settings');
        if (!isPrintSettings) {
            console.log('[API] Response:', response.config?.method?.toUpperCase(), response.config?.url, 'Status:', response.status);
        }
        return response;
    },
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url || '';

        if (status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }

        // Suppress 404 errors for print settings (expected when branch has no custom settings)
        const isPrintSettingsNotFound = status === 404 && url.includes('print-settings');
        if (!isPrintSettingsNotFound && !error.config?.silent) {
            console.error('[API] Error:', error.response?.status, error.response?.data);
        }
        return Promise.reject(error);
    }
);

export default api;
