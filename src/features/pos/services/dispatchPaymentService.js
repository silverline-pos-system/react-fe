import axios from 'axios';
import { API_V1 } from '@/lib/config';

const API_URL = `${API_V1}/dispatch-payments`;

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, (error) => Promise.reject(error));

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
        return Promise.reject(error);
    }
);

export const dispatchPaymentService = {
    // Get payment requests for current branch (for POS display)
    getPaymentRequestsByBranch: (branchId) =>
        api.get('/branch', { params: { branchId } }),

    // Get pending count for notification badge
    getPendingCount: (branchId) =>
        api.get('/branch/pending-count', { params: { branchId } }),

    // Get payment requests by status
    getPaymentRequestsByStatus: (status) =>
        api.get(`/status/${status}`),

    // Get manager payment requests
    getManagerPaymentRequests: () =>
        api.get('/manager'),

    // Get manager pending count
    getManagerPendingCount: () =>
        api.get('/manager/pending-count'),

    // Get single payment request by ID
    getPaymentRequestById: (requestId) =>
        api.get(`/${requestId}`),

    // Transfer to manager with supervisor approval
    transferToManager: (requestId, data) =>
        api.post(`/${requestId}/transfer-to-manager`, {
            supervisorUsername: data.supervisorUsername,
            supervisorPassword: data.supervisorPassword,
            notes: data.notes,
            priority: data.priority
        }),

    // Request payout (same as transfer but marked as payout)
    requestPayout: (requestId, data) =>
        api.post(`/${requestId}/transfer-to-manager`, {
            supervisorUsername: data.supervisorUsername,
            supervisorPassword: data.supervisorPassword,
            notes: `[PAYOUT REQUEST] Payment Method: ${data.paymentMethod}${data.paymentReference ? ` | Ref: ${data.paymentReference}` : ''}\n${data.notes || ''}`.trim(),
            priority: 'HIGH'
        }),

    // Process payment (manager action)
    processPayment: (requestId, data) =>
        api.post(`/${requestId}/process-payment`, {
            paymentMethod: data.paymentMethod,
            paymentReference: data.paymentReference,
            amountPaid: data.amountPaid,
            notes: data.notes
        }),

    // Reject request
    rejectRequest: (requestId, reason) =>
        api.post(`/${requestId}/reject`, { reason })
};

export default dispatchPaymentService;
