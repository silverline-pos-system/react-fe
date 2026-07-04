import axios from 'axios';

/**
 * Inventory API Client
 * Base URL: http://localhost:8080/api/inventory
 * Authorization: Bearer token from localStorage
 * Response format: { success: boolean, data: any, message: string }
 * Access data via: response.data.data
 */

// Base URL matches backend inventory module
const BASE_URL = 'http://localhost:8080/api/inventory';

// Create axios instance
const inventoryApi = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor - Add Authorization header
inventoryApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        console.log('[InventoryAPI] Token:', token ? 'EXISTS' : 'MISSING');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        console.log('[InventoryAPI] Request:', config.method.toUpperCase(), config.baseURL + config.url);
        return config;
    },
    (error) => {
        console.error('[InventoryAPI] Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor - Handle common responses and errors
inventoryApi.interceptors.response.use(
    (response) => {
        console.log('[InventoryAPI] Response:', response.config.method.toUpperCase(), response.config.url,
            'Status:', response.status, 'Data:', response.data);
        return response;
    },
    (error) => {
        console.error('[InventoryAPI] Error:', error.config?.method.toUpperCase(), error.config?.url,
            'Status:', error.response?.status, 'Message:', error.message,
            'Response:', error.response?.data);

        if (error.response?.status === 401) {
            console.error('[InventoryAPI] 401 Unauthorized - Token invalid or expired');
            localStorage.removeItem('token');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

/**
 * ========== CATEGORIES ==========
 */
export const getCategories = async () => {
    console.log('[InventoryAPI] GET categories');
    const response = await inventoryApi.get('/categories');
    console.log('[InventoryAPI] GET categories response:', response.data);
    return response.data.data || response.data;
};

export const createCategory = async (categoryData) => {
    console.log('[InventoryAPI] POST category:', categoryData);
    const response = await inventoryApi.post('/categories', categoryData);
    console.log('[InventoryAPI] POST category response:', response.data);
    return response.data.data || response.data;
};

export const updateCategory = async (id, categoryData) => {
    console.log('[InventoryAPI] PUT category:', id, categoryData);
    const response = await inventoryApi.put(`/categories/${id}`, categoryData);
    console.log('[InventoryAPI] PUT category response:', response.data);
    return response.data.data || response.data;
};

export const deleteCategory = async (id) => {
    console.log('[InventoryAPI] DELETE category:', id);
    const response = await inventoryApi.delete(`/categories/${id}`);
    console.log('[InventoryAPI] DELETE category response:', response.data);
    return response.data;
};

/**
 * ========== PRODUCTS ==========
 */
export const getProducts = async () => {
    console.log('[InventoryAPI] GET products');
    const response = await inventoryApi.get('/products');
    console.log('[InventoryAPI] GET products response:', response.data);
    return response.data.data || response.data;
};

export const createProduct = async (productData) => {
    console.log('[InventoryAPI] POST product:', productData);
    const response = await inventoryApi.post('/products', productData);
    console.log('[InventoryAPI] POST product response:', response.data);
    return response.data.data || response.data;
};

export const updateProduct = async (id, productData) => {
    console.log('[InventoryAPI] PUT product:', id, productData);
    const response = await inventoryApi.put(`/products/${id}`, productData);
    console.log('[InventoryAPI] PUT product response:', response.data);
    return response.data.data || response.data;
};

export const deleteProduct = async (id) => {
    console.log('[InventoryAPI] DELETE product:', id);
    const response = await inventoryApi.delete(`/products/${id}`);
    console.log('[InventoryAPI] DELETE product response:', response.data);
    return response.data;
};

/**
 * ========== BRANDS ==========
 */
export const getBrands = async () => {
    console.log('[InventoryAPI] GET brands');
    const response = await inventoryApi.get('/brands');
    console.log('[InventoryAPI] GET brands response:', response.data);
    return response.data.data || response.data;
};

export const createBrand = async (brandData) => {
    console.log('[InventoryAPI] POST brand:', brandData);
    const response = await inventoryApi.post('/brands', brandData);
    console.log('[InventoryAPI] POST brand response:', response.data);
    return response.data.data || response.data;
};

export const updateBrand = async (id, brandData) => {
    console.log('[InventoryAPI] PUT brand:', id, brandData);
    const response = await inventoryApi.put(`/brands/${id}`, brandData);
    console.log('[InventoryAPI] PUT brand response:', response.data);
    return response.data.data || response.data;
};

export const deleteBrand = async (id) => {
    console.log('[InventoryAPI] DELETE brand:', id);
    const response = await inventoryApi.delete(`/brands/${id}`);
    console.log('[InventoryAPI] DELETE brand response:', response.data);
    return response.data;
};

/**
 * ========== SUPPLIERS ==========
 */
export const getSuppliers = async () => {
    console.log('[InventoryAPI] GET suppliers');
    const response = await inventoryApi.get('/suppliers');
    console.log('[InventoryAPI] GET suppliers response:', response.data);
    return response.data.data || response.data;
};

export const createSupplier = async (supplierData) => {
    console.log('[InventoryAPI] POST supplier:', supplierData);
    const response = await inventoryApi.post('/suppliers', supplierData);
    console.log('[InventoryAPI] POST supplier response:', response.data);
    return response.data.data || response.data;
};

export const updateSupplier = async (id, supplierData) => {
    console.log('[InventoryAPI] PUT supplier:', id, supplierData);
    const response = await inventoryApi.put(`/suppliers/${id}`, supplierData);
    console.log('[InventoryAPI] PUT supplier response:', response.data);
    return response.data.data || response.data;
};

export const deleteSupplier = async (id) => {
    console.log('[InventoryAPI] DELETE supplier:', id);
    const response = await inventoryApi.delete(`/suppliers/${id}`);
    console.log('[InventoryAPI] DELETE supplier response:', response.data);
    return response.data;
};

/**
 * ========== STOCK ==========
 */
export const getStock = async () => {
    console.log('[InventoryAPI] GET stock');
    const response = await inventoryApi.get('/stock');
    console.log('[InventoryAPI] GET stock response:', response.data);
    return response.data.data || response.data;
};

export const getBatches = async () => {
    console.log('[InventoryAPI] GET batches');
    const response = await inventoryApi.get('/batches');
    console.log('[InventoryAPI] GET batches response:', response.data);
    return response.data.data || response.data;
};

export const getTransfers = async () => {
    console.log('[InventoryAPI] GET transfers');
    const response = await inventoryApi.get('/transfers');
    console.log('[InventoryAPI] GET transfers response:', response.data);
    return response.data.data || response.data;
};

export const createAdjustment = async (adjustmentData) => {
    console.log('[InventoryAPI] POST stock adjustment:', adjustmentData);
    const response = await inventoryApi.post('/stock/adjustments', adjustmentData);
    console.log('[InventoryAPI] POST stock adjustment response:', response.data);
    return response.data.data || response.data;
};

/**
 * ========== Dispatch (Goods Received Note) ==========
 */

/**
 * Get all Dispatches for a branch
 * GET /api/inventory/dispatch/branch/{branchId}
 */
export const getDispatchesByBranch = async (branchId) => {
    console.log('[InventoryAPI] GET Dispatches by branch:', branchId);
    const response = await inventoryApi.get(`/dispatch/branch/${branchId}`);
    console.log('[InventoryAPI] GET Dispatches by branch response:', response.data);
    return response.data.data || response.data;
};

/**
 * Get Dispatch by ID
 * GET /api/inventory/dispatch/{dispatchId}
 */
export const getDispatchById = async (dispatchId) => {
    console.log('[InventoryAPI] GET Dispatch by ID:', dispatchId);
    const response = await inventoryApi.get(`/dispatch/${dispatchId}`);
    console.log('[InventoryAPI] GET Dispatch by ID response:', response.data);
    return response.data.data || response.data;
};

/**
 * Search Dispatches with filters
 * POST /api/inventory/dispatch/search
 */
export const searchDispatches = async (filterData) => {
    console.log('[InventoryAPI] POST Dispatch search:', filterData);
    const response = await inventoryApi.post('/dispatch/search', filterData);
    console.log('[InventoryAPI] POST Dispatch search response:', response.data);
    return response.data.data || response.data;
};

/**
 * Create new Dispatch
 * POST /api/inventory/dispatch
 */
export const createDispatch = async (dispatchData) => {
    console.log('[InventoryAPI] POST Dispatch:', dispatchData);
    // Get current user ID from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.userId || user.id || 1;
    
    const config = {
        headers: {
            'User-ID': userId
        }
    };
    
    const response = await inventoryApi.post('/dispatch', dispatchData, config);
    console.log('[InventoryAPI] POST Dispatch response:', response.data);
    return response.data.data || response.data;
};

/**
 * Update Dispatch (only if pending)
 * PUT /api/inventory/dispatch/{dispatchId}
 */
export const updateDispatch = async (dispatchId, dispatchData) => {
    console.log('[InventoryAPI] PUT Dispatch:', dispatchId, dispatchData);
    const response = await inventoryApi.put(`/dispatch/${dispatchId}`, dispatchData);
    console.log('[InventoryAPI] PUT Dispatch response:', response.data);
    return response.data.data || response.data;
};

/**
 * Approve Dispatch
 * PUT /api/inventory/dispatch/{dispatchId}/approve
 */
export const approveDispatch = async (dispatchId) => {
    console.log('[InventoryAPI] PUT Dispatch approve:', dispatchId);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.userId || user.id || 1;
    
    const config = {
        headers: {
            'User-ID': userId
        }
    };
    
    const response = await inventoryApi.put(`/dispatch/${dispatchId}/approve`, {}, config);
    console.log('[InventoryAPI] PUT Dispatch approve response:', response.data);
    return response.data.data || response.data;
};

/**
 * Reject Dispatch
 * PUT /api/inventory/dispatch/{dispatchId}/reject
 */
export const rejectDispatch = async (dispatchId, reason) => {
    console.log('[InventoryAPI] PUT Dispatch reject:', dispatchId, reason);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.userId || user.id || 1;
    
    const config = {
        headers: {
            'User-ID': userId
        },
        params: {
            reason: reason
        }
    };
    
    const response = await inventoryApi.put(`/dispatch/${dispatchId}/reject`, {}, config);
    console.log('[InventoryAPI] PUT Dispatch reject response:', response.data);
    return response.data.data || response.data;
};

/**
 * Update Dispatch payment status
 * PUT /api/inventory/dispatch/{dispatchId}/payment-status
 */
export const updateDispatchPaymentStatus = async (dispatchId, paymentStatus) => {
    console.log('[InventoryAPI] PUT Dispatch payment status:', dispatchId, paymentStatus);
    const response = await inventoryApi.put(`/dispatch/${dispatchId}/payment-status`, null, {
        params: { paymentStatus }
    });
    console.log('[InventoryAPI] PUT Dispatch payment status response:', response.data);
    return response.data.data || response.data;
};

/**
 * Delete Dispatch (only if pending)
 * DELETE /api/inventory/dispatch/{dispatchId}
 */
export const deleteDispatch = async (dispatchId) => {
    console.log('[InventoryAPI] DELETE Dispatch:', dispatchId);
    const response = await inventoryApi.delete(`/dispatch/${dispatchId}`);
    console.log('[InventoryAPI] DELETE Dispatch response:', response.data);
    return response.data;
};

/**
 * Get Dispatch statistics for a branch
 * GET /api/inventory/dispatch/branch/{branchId}/stats
 */
export const getDispatchStats = async (branchId, period) => {
    console.log('[InventoryAPI] GET Dispatch stats:', branchId, period);
    const params = period ? { period } : {};
    const response = await inventoryApi.get(`/dispatch/branch/${branchId}/stats`, { params });
    console.log('[InventoryAPI] GET Dispatch stats response:', response.data);
    return response.data.data || response.data;
};

/**
 * Get pending Dispatches for approval
 * GET /api/inventory/dispatch/pending
 */
export const getPendingDispatches = async (branchId) => {
    console.log('[InventoryAPI] GET pending Dispatches:', branchId);
    const params = branchId ? { branchId } : {};
    const response = await inventoryApi.get('/dispatch/pending', { params });
    console.log('[InventoryAPI] GET pending Dispatches response:', response.data);
    return response.data.data || response.data;
};

/**
 * Get Dispatch items by product
 * GET /api/inventory/dispatch/product/{productId}/items
 */
export const getDispatchItemsByProduct = async (productId, branchId) => {
    console.log('[InventoryAPI] GET Dispatch items by product:', productId, branchId);
    const params = branchId ? { branchId } : {};
    const response = await inventoryApi.get(`/dispatch/product/${productId}/items`, { params });
    console.log('[InventoryAPI] GET Dispatch items by product response:', response.data);
    return response.data.data || response.data;
};

/**
 * Get Dispatches by supplier
 * GET /api/inventory/dispatch/supplier/{supplierId}
 */
export const getDispatchesBySupplier = async (supplierId) => {
    console.log('[InventoryAPI] GET Dispatches by supplier:', supplierId);
    const response = await inventoryApi.get(`/dispatch/supplier/${supplierId}`);
    console.log('[InventoryAPI] GET Dispatches by supplier response:', response.data);
    return response.data.data || response.data;
};

/**
 * Check if Dispatch number exists
 * GET /api/inventory/dispatch/check-number/{dispatchNo}
 */
export const checkDispatchNumber = async (dispatchNo) => {
    console.log('[InventoryAPI] GET check Dispatch number:', dispatchNo);
    const response = await inventoryApi.get(`/dispatch/check-number/${dispatchNo}`);
    console.log('[InventoryAPI] GET check Dispatch number response:', response.data);
    return response.data.data || response.data;
};

export default inventoryApi;

