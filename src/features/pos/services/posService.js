import axios from 'axios';
import { API_V1 } from '@/lib/config';

const API_URL = `${API_V1}/pos`;

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
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
        return Promise.reject(error);
    }
);

export const posService = {
    // ========== SHIFT MANAGEMENT ==========
    // Opens a new cash shift - matches cash_shifts table
    openShift: (data) => {
        // Build clean payload - only include non-null values
        const payload = {
            cashierId: data.cashierId,
            branchId: data.branchId,
            openingCash: data.openingCash,
            supervisorUsername: data.supervisorUsername,
            supervisorPassword: data.supervisorPassword,
            status: 'OPEN' // Required for cash_shifts table - ENUM: OPEN, CLOSED
        };

        // Only add denominations if provided
        if (data.denominations && data.denominations.length > 0) {
            payload.denominations = data.denominations;
        }

        return api.post('/shift/open', payload);
    },

    // Close shift with cash count
    closeShift: (shiftId, data) => api.put(`/shift/${shiftId}/close`, {
        closingCash: data.closingCash,
        denominations: data.denominations, // Closing denominations
        notes: data.notes,
        supervisorUsername: data.supervisorUsername,
        supervisorPassword: data.supervisorPassword
    }),

    // Get shift totals for reconciliation
    getShiftTotals: (shiftId) => api.get(`/shift/${shiftId}/totals`),

    // Get current active shift
    getCurrentShift: async (cashierId) => {
        let url = `/shift/active`;
        if (cashierId) url += `?cashierId=${cashierId}`;
        try {
            const res = await api.get(url, { silent: true });
            if (res.data && res.data.success && res.data.data === null) {
                return { data: null };
            }
            return res;
        } catch (error) {
            // Return null if no active shift found (404)
            if (error.response && error.response.status === 404) {
                return { data: null };
            }
            throw error;
        }
    },

    // Get all cashiers for the branch
    getCashiers: (branchId) => api.get(`/cashiers?branchId=${branchId}`),

    // ========== PRODUCT OPERATIONS ==========
    // Scan product by barcode or SKU - matches products table
    getProduct: async (code, branchId) => {
        const endpoints = [
            { url: `/products/${encodeURIComponent(code)}`, params: { branchId } }, // Primary: includes stock validation
            { url: '/products/scan', params: { code, branchId } },
            { url: '/products/barcode', params: { barcode: code, branchId } },
            { url: '/products/sku', params: { sku: code, branchId } },
            { url: `/products/search`, params: { q: code, branchId } }
        ];

        for (const endpoint of endpoints) {
            try {
                const res = await api.get(endpoint.url, { params: endpoint.params });
                const data = res.data?.data || res.data;

                // If search returns array, find exact match
                if (Array.isArray(data)) {
                    const match = data.find(p =>
                        p.barcode === code ||
                        p.sku === code ||
                        String(p.productId) === code ||
                        String(p.id) === code
                    );
                    if (match) return { data: match };
                    if (data.length > 0) return { data: data[0] };
                    continue;
                }

                if (data && (data.productId || data.id || data.name)) {
                    return { data };
                }
            } catch (err) {
                if (err.response && err.response.status === 400) {
                    console.log('Stock/validation error on primary endpoint, fetching data from fallback endpoints...');
                }
                console.log(`Endpoint ${endpoint.url} failed, trying next...`);
            }
        }
        throw new Error('Product not found');
    },

    // Search products by name, sku, or barcode
    searchInventory: (query, branchId) => api.get(`/products/search`, { params: { q: query, branchId } }),

    // Get quick pick items for POS grid
    getQuickItems: (branchId) => api.get(`/products/quick`, { params: { branchId } }),

    // Add product to quick pick
    addToQuickPick: (productId, branchId) => api.post(`/products/quick/${productId}`, null, { params: { branchId } }),

    // Remove product from quick pick
    removeFromQuickPick: (productId, branchId) => api.delete(`/products/quick/${productId}`, { params: { branchId } }),

    // Get product stock level at branch
    getProductStock: (productId, branchId) => api.get(`/stock/${productId}`, { params: { branchId } }),

    // Check price by product code - tries multiple endpoints
    checkPrice: async (code, branchId) => {
        const endpoints = [
            { url: `/products/${encodeURIComponent(code)}`, params: { branchId, skipStockCheck: true } },
            { url: '/products/scan', params: { code, branchId, skipStockCheck: true } },
            { url: '/products/barcode', params: { barcode: code, branchId, skipStockCheck: true } },
            { url: `/products/search`, params: { q: code, branchId } }
        ];

        for (const endpoint of endpoints) {
            try {
                const res = await api.get(endpoint.url, { params: endpoint.params });
                const data = res.data?.data || res.data;

                // If search returns array, find exact match
                if (Array.isArray(data)) {
                    const match = data.find(p =>
                        p.barcode === code ||
                        p.sku === code ||
                        String(p.productId) === code ||
                        String(p.id) === code
                    );
                    if (match) return { data: match };
                    if (data.length > 0) return { data: data[0] };
                    continue;
                }

                if (data && (data.productId || data.id || data.name)) {
                    return { data };
                }
            } catch {
                console.log(`Price check endpoint ${endpoint.url} failed, trying next...`);
            }
        }
        throw new Error('Product not found');
    },

    // ========== SALES OPERATIONS ==========
    submitOrder: (orderData) => {
        const payload = {
            saleId: orderData.saleId || null,
            branchId: orderData.branchId || 1,
            cashierId: orderData.cashierId || 1,
            customerId: orderData.customerId || null,
            shiftId: orderData.shiftId,
            grossTotal: parseFloat(orderData.grossTotal) || 0,
            discount: parseFloat(orderData.discount) || 0,
            taxAmount: parseFloat(orderData.taxAmount) || 0,
            netTotal: parseFloat(orderData.netTotal) || 0,
            paidAmount: parseFloat(orderData.paidAmount) || 0,
            changeAmount: parseFloat(orderData.changeAmount) || 0,
            saleType: orderData.saleType || 'RETAIL',
            notes: orderData.notes || '',
            items: (orderData.items || []).map(item => ({
                productId: item.productId,
                serialId: item.serialId || null,
                batchId: item.batchId || null,
                quantity: parseInt(item.qty) || parseInt(item.quantity) || 1,
                unitPrice: parseFloat(item.unitPrice) || 0,
                discount: parseFloat(item.discount) || 0,
                taxRate: parseFloat(item.taxRate) || 0,
                lineTotal: parseFloat((item.unitPrice * (parseInt(item.qty) || 1)) - (item.discount || 0)) || 0
            })),
            payments: (orderData.payments || []).map(p => ({
                paymentType: p.paymentType || 'CASH',
                amount: parseFloat(p.amount) || 0,
                referenceNo: p.referenceNo || null,
                cardLast4: p.cardLast4 || null,
                bankName: p.bankName || null
            }))
        };

        return api.post('/orders', payload);
    },

    // Get sale by ID
    getSaleById: (saleId) => api.get(`/sales/${saleId}`),

    // Get last invoice number for generating next invoice
    getLastInvoiceNumber: (branchId) => api.get('/sales/last-invoice', { params: { branchId } }),

    // Get sales list with filters
    getSales: (params) => api.get('/sales', { params }),

    // Get held/parked bills
    getHeldBills: (branchId) => api.get(`/sales/held`, { params: { branchId } }),

    // Hold/Park a bill
    holdBill: (data) => api.post('/sales/hold', data),

    // Recall a held bill
    recallBill: (saleId) => api.post(`/sales/${saleId}/recall`),

    // Void a sale (requires approval)
    voidSale: (saleId, reason, supervisorCreds) => api.post(`/sales/${saleId}/void`, {
        reason,
        supervisorUsername: supervisorCreds.username,
        supervisorPassword: supervisorCreds.password
    }),

    // ========== RETURNS ==========
    getReturnableSales: (days = 7) => api.get('/sales/returnable', { params: { days } }),

    // Get sale for return by invoice number
    getSaleForReturn: (invoiceNo) => api.get(`/sales/invoice/${invoiceNo}`),

    // Process return
    processReturn: (data) => api.post('/returns', {
        saleId: data.saleId,
        branchId: data.branchId,
        reason: data.reason,
        refundMethod: data.refundMethod,
        items: data.items,
        supervisorUsername: data.supervisorUsername,
        supervisorPassword: data.supervisorPassword
    }),

    // ========== CUSTOMER OPERATIONS ==========
    findCustomer: (query) => api.get(`/customers/search`, { params: { query } }),

    // Find customer by code
    findCustomerByCode: (code) => api.get(`/customers/code/${code}`),

    // Create new customer
    createCustomer: (data) => api.post('/customers', {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        dateOfBirth: data.dateOfBirth || null
    }),

    // Update customer loyalty points
    updateLoyaltyPoints: (customerId, points) => api.patch(`/customers/${customerId}/loyalty`, { points }),

    // ========== CASH FLOW OPERATIONS ==========
    recordCashFlow: (data) => api.post('/cash-flows', {
        shiftId: data.shiftId,
        amount: data.amount,
        type: data.type,
        reason: data.reason,
        referenceNo: data.referenceNo || null
    }),

    // Get cash flows for shift
    getShiftCashFlows: (shiftId) => api.get(`/cash-flows/shift/${shiftId}`),

    // ========== DISCOUNT & APPROVALS ==========
    requestDiscountApproval: (data) => api.post('/approvals/discount', {
        branchId: data.branchId,
        saleId: data.saleId,
        discountAmount: data.discountAmount,
        discountPercent: data.discountPercent,
        reason: data.reason
    }),

    // Verify supervisor credentials
    verifySupervisor: (credentials) => api.post('/auth/verify-supervisor', credentials),

    // ========== REPORTS ==========
    getShiftReport: (shiftId) => api.get(`/reports/shift/${shiftId}`),

    // Get daily summary
    getDailySummary: (branchId, date) => api.get(`/reports/daily`, { params: { branchId, date } })
};
