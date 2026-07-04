import api from '@/lib/api';

export const expenseService = {
    // --- Categories ---
    getAllCategories: () => api.get('/v1/manager/expense-categories'),
    getActiveCategories: () => api.get('/v1/manager/expense-categories/active'),
    createCategory: (data) => api.post('/v1/manager/expense-categories', data),
    updateCategory: (id, data) => api.put(`/v1/manager/expense-categories/${id}`, data),
    toggleCategoryStatus: (id) => api.patch(`/v1/manager/expense-categories/${id}/toggle`),

    // --- Expenses ---
    getAllExpenses: (branchId) => {
        const url = branchId ? `/v1/manager/expenses?branchId=${branchId}` : '/v1/manager/expenses';
        return api.get(url);
    },
    getExpenseById: (id) => api.get(`/v1/manager/expenses/${id}`),
    createExpense: (data) => api.post('/v1/manager/expenses', data),
    updateExpense: (id, data) => api.put(`/v1/manager/expenses/${id}`, data),
    deleteExpense: (id) => api.delete(`/v1/manager/expenses/${id}`),

    // --- Payments ---
    addPayment: (data) => api.post('/v1/manager/expenses/payments', data),
    deletePayment: (id) => api.delete(`/v1/manager/expenses/payments/${id}`),
    
    // --- Dashboard ---
    getDashboardMetrics: () => api.get('/v1/manager/expenses/dashboard')
};
