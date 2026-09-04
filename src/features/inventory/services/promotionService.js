import api from '@/lib/api';

// Promotions management API. base is `${origin}/api`, so paths hit /api/v1/promotions.
const unwrap = (res) => res?.data?.data ?? res?.data;

export const promotionService = {
    list: async (branchId) => {
        const res = await api.get('/v1/promotions', { params: branchId ? { branchId } : {} });
        const data = unwrap(res);
        return Array.isArray(data) ? data : [];
    },

    get: async (id) => unwrap(await api.get(`/v1/promotions/${id}`)),

    create: async (dto) => unwrap(await api.post('/v1/promotions', dto)),

    update: async (id, dto) => unwrap(await api.put(`/v1/promotions/${id}`, dto)),

    toggle: async (id, active) => unwrap(await api.patch(`/v1/promotions/${id}/toggle`, { active })),

    remove: async (id) => unwrap(await api.delete(`/v1/promotions/${id}`)),
};

export default promotionService;
