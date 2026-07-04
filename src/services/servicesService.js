import api from './api';

export const servicesService = {
    // Mobile Repairs
    logRepairJob: (data) => api.post('/v1/services/repairs', data),
    getRepairs: (branchId) => branchId
        ? api.get(`/v1/services/repairs?branchId=${branchId}`)
        : api.get('/v1/services/repairs'),
    finalizeRepairCost: (repairId, finalCost, managerId) =>
        api.put(`/v1/services/repairs/${repairId}/finalize`, { finalCost, managerId }),
    updateRepairStatus: (repairId, status, technicianId, notes) =>
        api.put(`/v1/services/repairs/${repairId}/status`, { status, technicianId, notes }),
    requestFinalizeCost: (repairId, managerId, estimatedCost, costNote) =>
        api.put(`/v1/services/repairs/${repairId}/request-finalize`, { managerId, estimatedCost, costNote }),
    searchRepairs: (query) =>
        api.get(`/v1/services/repairs/search`, { params: { query } }),
    markRepairPaid: (repairId, amount, paymentMethod, receivedBy) =>
        api.put(`/v1/services/repairs/${repairId}/pay`, { amount, paymentMethod, receivedBy }),

    // DTV Services
    createDtvService: (data) => api.post('/v1/services/dtv', data),
    getDtvServices: (branchId) => branchId
        ? api.get(`/v1/services/dtv?branchId=${branchId}`)
        : api.get('/v1/services/dtv'),
    updateDtvServiceStatus: (serviceId, status, technicianId, balanceCollected, additionalItems) =>
        api.put(`/v1/services/dtv/${serviceId}/status`, { status, technicianId, balanceCollected, additionalItems }),
    // Fetch Managers for Approval
    getManagers: () => api.get('/v1/admin/users/managers')
};

