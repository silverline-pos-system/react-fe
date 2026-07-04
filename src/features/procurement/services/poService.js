import api from '@/lib/api';

export const poService = {
    createPO: (data, config = {}) => api.post('/inventory/po', data, config),
    getAllPOs: () => api.get('/inventory/po'),
    getPOListPdf: () => api.get('/inventory/po/reports/pdf', { responseType: 'blob' }),
    getPendingPOs: () => api.get('/inventory/po/pending'),
    getPOsByStatus: (status) => api.get(`/inventory/po/status/${status}`),
    getPOItems: (poId) => api.get(`/inventory/po/${poId}/items`),
    getPOPayments: (poId) => api.get(`/inventory/po/${poId}/payments`),
    processPOPayment: (poId, data) => api.post(`/inventory/po/${poId}/process`, data)
};
