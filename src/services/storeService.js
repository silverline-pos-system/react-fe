import api from './api';
import {
    mapBatchFromBackend,
    mapBatchToBackend,
    mapBatchesFromBackend,
    mapAdjustmentFromBackend,
    mapAdjustmentToBackend,
    mapAdjustmentsFromBackend,
    mapTransferFromBackend,
    mapTransferToBackend,
    mapTransfersFromBackend,
    mapDamageFromBackend,
    mapDamageToBackend,
    mapDamagesFromBackend
} from './inventoryMapper';

/**
 * Store Service
 * Handles all store/stock management API calls (Batches, Adjustments, Transfers, Damages, Expiry)
 * Backend returns: { success: boolean, data: any, message: string }
 * For lists, use response.data.data
 */

export const storeService = {
    // ============= BATCHES / STOCK =============

    /**
     * Get all batches
     * @returns {Promise} Array of batches in frontend format
     */
    getBatches: async () => {
        try {
            console.log('[StoreService] GET batches');
            const response = await api.get('/inventory/batches');
            console.log('[StoreService] GET batches response:', response.data);
            const batches = response.data.data || response.data;
            const mapped = mapBatchesFromBackend(batches);
            console.log('[StoreService] GET batches mapped:', mapped.length, 'items');
            return mapped;
        } catch (error) {
            console.error('[StoreService] GET batches error:', error?.response?.data || error?.response || error);
            // Return empty array as fallback
            return [];
        }
    },

    /**
     * Get batch by ID
     * @param {number} batchId - Batch ID
     * @returns {Promise} Batch object
     */
    getBatchById: async (batchId) => {
        try {
            const response = await api.get(`/batches/${batchId}`);
            const batch = response.data.data || response.data;
            return mapBatchFromBackend(batch);
        } catch (error) {
            console.error('Error fetching batch:', error);
            throw error;
        }
    },

    /**
     * Get batches by product ID
     * @param {number} productId - Product ID
     * @returns {Promise} Array of batches
     */
    getBatchesByProduct: async (productId) => {
        try {
            const response = await api.get(`/batches/product/${productId}`);
            const batches = response.data.data || response.data;
            return mapBatchesFromBackend(batches);
        } catch (error) {
            console.error('Error fetching batches by product:', error);
            throw error;
        }
    },

    /**
     * Create new batch
     * @param {Object} batchData - Batch data in frontend format
     * @returns {Promise} Created batch
     */
    createBatch: async (batchData) => {
        try {
            const backendData = mapBatchToBackend(batchData);
            const response = await api.post('/inventory/batches', backendData);
            const batch = response.data.data || response.data;
            return mapBatchFromBackend(batch);
        } catch (error) {
            console.error('Error creating batch:', error);
            throw error;
        }
    },

    /**
     * Update batch
     * @param {number} batchId - Batch ID
     * @param {Object} batchData - Batch data in frontend format
     * @returns {Promise} Updated batch
     */
    updateBatch: async (batchId, batchData) => {
        try {
            const backendData = mapBatchToBackend(batchData);
            const response = await api.put(`/batches/${batchId}`, backendData);
            const batch = response.data.data || response.data;
            return mapBatchFromBackend(batch);
        } catch (error) {
            console.error('Error updating batch:', error);
            throw error;
        }
    },

    /**
     * Delete batch
     * @param {number} batchId - Batch ID
     * @returns {Promise}
     */
    deleteBatch: async (batchId) => {
        try {
            const response = await api.delete(`/batches/${batchId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting batch:', error);
            throw error;
        }
    },

    // ============= STOCK ADJUSTMENTS =============

    /**
     * Get all stock adjustments with optional filters
     * @param {Object} filters - Filter options { branchId, productId }
     * @returns {Promise} Array of adjustments
     */
    getAdjustments: async (filters = {}) => {
        try {
            console.log('[StoreService] GET adjustments with filters:', filters);
            
            // Build query parameters
            const params = new URLSearchParams();
            if (filters.branchId) params.append('branchId', filters.branchId);
            if (filters.productId) params.append('productId', filters.productId);
            
            const url = params.toString() ? `/inventory/adjustments?${params.toString()}` : '/inventory/adjustments';
            const response = await api.get(url);
            console.log('[StoreService] GET adjustments response:', response.data);
            
            const adjustments = response.data.data || response.data;
            const mapped = mapAdjustmentsFromBackend(adjustments);
            console.log('[StoreService] GET adjustments mapped:', mapped.length, 'items');
            return mapped;
        } catch (error) {
            console.error('[StoreService] GET adjustments error:', error?.response?.data || error?.response || error);
            // Return empty array as fallback
            return [];
        }
    },

    /**
     * Get adjustment by ID (Note: Backend doesn't have this endpoint yet)
     * @param {number} adjustmentId - Adjustment ID
     * @returns {Promise} Adjustment object
     */
    getAdjustmentById: async (adjustmentId) => {
        try {
            const response = await api.get(`/inventory/adjustments/${adjustmentId}`);
            const adjustment = response.data.data || response.data;
            return mapAdjustmentFromBackend(adjustment);
        } catch (error) {
            console.error('Error fetching adjustment:', error);
            throw error;
        }
    },

    /**
     * Create stock adjustment
     * @param {Object} adjustmentData - Adjustment data in frontend format
     * @returns {Promise} Created adjustment
     */
    createAdjustment: async (adjustmentData) => {
        try {
            console.log('[StoreService] POST adjustment:', adjustmentData);
            const backendData = mapAdjustmentToBackend(adjustmentData);
            console.log('[StoreService] POST adjustment (mapped):', backendData);
            const response = await api.post('/inventory/adjustments', backendData);
            console.log('[StoreService] POST adjustment response:', response.data);
            const adjustment = response.data.data || response.data;
            return mapAdjustmentFromBackend(adjustment);
        } catch (error) {
            console.error('[StoreService] POST adjustment error:', error?.response || error);
            throw error;
        }
    },

    /**
     * Get adjustments by product (Use getAdjustments with productId filter instead)
     * @param {number} productId - Product ID
     * @returns {Promise} Array of adjustments
     */
    getAdjustmentsByProduct: async (productId) => {
        try {
            // Use the main getAdjustments with productId filter
            return await storeService.getAdjustments({ productId });
        } catch (error) {
            console.error('Error fetching adjustments by product:', error);
            throw error;
        }
    },

    // ============= STOCK TRANSFERS =============

    /**
     * Get all stock transfers with optional filters
     * @param {Object} filters - Filter options { status, fromBranchId, toBranchId, requestedBy }
     * @returns {Promise} Array of transfers
     */
    getTransfers: async (filters = {}) => {
        try {
            console.log('[StoreService] GET transfers with filters:', filters);
            
            // Build query parameters object for Axios
            const params = {};
            if (filters.status) params.status = filters.status;
            if (filters.fromBranchId) params.fromBranchId = filters.fromBranchId;
            if (filters.toBranchId) params.toBranchId = filters.toBranchId;
            if (filters.requestedBy) params.requestedBy = filters.requestedBy;
            
            const response = await api.get('/inventory/transfers', { params });
            console.log('[StoreService] GET transfers response:', response.data);
            
            const transfers = response.data.data || response.data;
            const mapped = mapTransfersFromBackend(transfers);
            console.log('[StoreService] GET transfers mapped:', mapped.length, 'items');
            return mapped;
        } catch (error) {
            console.error('[StoreService] GET transfers error:', error?.response || error);
            return []; // Return empty array on error
        }
    },

    /**
     * Get transfer by ID
     * @param {number} transferId - Transfer ID
     * @returns {Promise} Transfer object
     */
    getTransferById: async (transferId) => {
        try {
            console.log('[StoreService] GET transfer by ID:', transferId);
            const response = await api.get(`/inventory/transfers/${transferId}`);
            const transfer = response.data.data || response.data;
            return mapTransferFromBackend(transfer);
        } catch (error) {
            console.error('[StoreService] GET transfer by ID error:', error?.response?.data || error?.response || error);
            throw error;
        }
    },

    /**
     * Create stock transfer
     * @param {Object} transferData - Transfer data in frontend format
     * @returns {Promise} Created transfer
     */
    createTransfer: async (transferData) => {
        try {
            console.log('[StoreService] POST create transfer:', transferData);
            const backendData = mapTransferToBackend(transferData);
            console.log('[StoreService] Mapped backend data:', backendData);
            
            const response = await api.post('/inventory/transfers', backendData);
            console.log('[StoreService] Create transfer response:', response.data);
            
            const transfer = response.data.data || response.data;
            return mapTransferFromBackend(transfer);
        } catch (error) {
            console.error('[StoreService] Create transfer error:', error?.response?.data || error?.response || error);
            throw error;
        }
    },

    /**
     * Update transfer (only DRAFT status)
     * @param {number} transferId - Transfer ID
     * @param {Object} transferData - Transfer data in frontend format
     * @returns {Promise} Updated transfer
     */
    updateTransfer: async (transferId, transferData) => {
        try {
            console.log('[StoreService] PUT update transfer:', transferId, transferData);
            const backendData = mapTransferToBackend(transferData);
            const response = await api.put(`/inventory/transfers/${transferId}`, backendData);
            const transfer = response.data.data || response.data;
            return mapTransferFromBackend(transfer);
        } catch (error) {
            console.error('Error updating transfer:', error?.response?.data || error);
            throw error;
        }
    },

    /**
     * Submit transfer for approval (DRAFT -> PENDING)
     * @param {number} transferId - Transfer ID
     * @returns {Promise} Submit response
     */
    submitTransfer: async (transferId) => {
        try {
            console.log('[StoreService] POST submit transfer:', transferId);
            const response = await api.post(`/inventory/transfers/${transferId}/submit`);
            console.log('[StoreService] Submit transfer response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error submitting transfer:', error?.response?.data || error);
            throw error;
        }
    },

    /**
     * Approve stock transfer
     * @param {number} transferId - Transfer ID
     * @param {string} approvalNotes - Optional approval notes
     * @returns {Promise} Approval response
     */
    approveTransfer: async (transferId, approvalNotes = '') => {
        try {
            console.log('[StoreService] POST approve transfer:', transferId, approvalNotes);
            const response = await api.post(
                `/inventory/transfers/${transferId}/approve`, 
                null,
                { params: { approvalNotes } }
            );
            console.log('[StoreService] Approve transfer response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error approving transfer:', error?.response?.data || error);
            throw error;
        }
    },

    /**
     * Reject stock transfer
     * @param {number} transferId - Transfer ID
     * @param {string} rejectionReason - Rejection reason
     * @returns {Promise} Rejection response
     */
    rejectTransfer: async (transferId, rejectionReason) => {
        try {
            console.log('[StoreService] POST reject transfer:', transferId, rejectionReason);
            const response = await api.post(
                `/inventory/transfers/${transferId}/reject`, 
                null,
                { params: { rejectionReason } }
            );
            console.log('[StoreService] Reject transfer response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error rejecting transfer:', error?.response?.data || error);
            throw error;
        }
    },

    /**
     * Delete transfer (only DRAFT status)
     * @param {number} transferId - Transfer ID
     * @returns {Promise} Delete response
     */
    deleteTransfer: async (transferId) => {
        try {
            console.log('[StoreService] DELETE transfer:', transferId);
            const response = await api.delete(`/inventory/transfers/${transferId}`);
            console.log('[StoreService] Delete transfer response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error deleting transfer:', error?.response?.data || error);
            throw error;
        }
    },

    /**
     * Get pending transfers (for approval)
     * @returns {Promise} Array of pending transfers
     */
    getPendingTransfers: async () => {
        try {
            console.log('[StoreService] GET pending transfers');
            // Use the main getTransfers with status filter
            return await storeService.getTransfers({ status: 'PENDING' });
        } catch (error) {
            console.error('[StoreService] GET pending transfers error:', error?.response?.data || error?.response || error);
            // Return empty array as fallback
            return [];
        }
    },

    // ============= DAMAGE ENTRIES =============

    /**
     * Get all damage entries
     * @returns {Promise} Array of damages
     */
    getDamages: async () => {
        try {
            console.log('[StoreService] GET damages');
            const response = await api.get('/inventory/damages');
            console.log('[StoreService] GET damages response:', response.data);
            const damages = response.data.data || response.data;
            const mapped = mapDamagesFromBackend(damages);
            console.log('[StoreService] GET damages mapped:', mapped.length, 'items');
            return mapped;
        } catch (error) {
            console.error('[StoreService] GET damages error:', error?.response?.data || error?.response || error);
            // Return empty array as fallback
            return [];
        }
    },

    /**
     * Get damage by ID
     * @param {number} damageId - Damage ID
     * @returns {Promise} Damage object
     */
    getDamageById: async (damageId) => {
        try {
            const response = await api.get(`/damages/${damageId}`);
            const damage = response.data.data || response.data;
            return mapDamageFromBackend(damage);
        } catch (error) {
            console.error('Error fetching damage:', error);
            throw error;
        }
    },

    /**
     * Create damage entry
     * @param {Object} damageData - Damage data in frontend format
     * @returns {Promise} Created damage entry
     */
    createDamage: async (damageData) => {
        try {
            const backendData = mapDamageToBackend(damageData);
            const response = await api.post('/inventory/damages', backendData);
            const damage = response.data.data || response.data;
            return mapDamageFromBackend(damage);
        } catch (error) {
            console.error('Error creating damage:', error);
            throw error;
        }
    },

    /**
     * Get damages by product
     * @param {number} productId - Product ID
     * @returns {Promise} Array of damages
     */
    getDamagesByProduct: async (productId) => {
        try {
            const response = await api.get(`/damages/product/${productId}`);
            const damages = response.data.data || response.data;
            return mapDamagesFromBackend(damages);
        } catch (error) {
            console.error('Error fetching damages by product:', error);
            throw error;
        }
    },

    // ============= EXPIRY MANAGEMENT =============

    /**
     * Get products expiring soon
     * @param {number} days - Number of days to check (default: 30)
     * @returns {Promise} Array of batches expiring soon
     */
    getExpiringProducts: async (days = 30) => {
        try {
            const response = await api.get(`/batches/expiring?days=${days}`);
            const batches = response.data.data || response.data;
            return mapBatchesFromBackend(batches);
        } catch (error) {
            console.error('Error fetching expiring products:', error);
            throw error;
        }
    },

    /**
     * Get expired products
     * @returns {Promise} Array of expired batches
     */
    getExpiredProducts: async () => {
        try {
            const response = await api.get('/inventory/batches/expired');
            const batches = response.data.data || response.data;
            return mapBatchesFromBackend(batches);
        } catch (error) {
            console.error('Error fetching expired products:', error);
            throw error;
        }
    },

    /**
     * Get expiry calendar data
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise} Array of batches expiring in date range
     */
    getExpiryCalendar: async (startDate, endDate) => {
        try {
            console.log('[StoreService] GET expiry calendar', { startDate, endDate });
            const response = await api.get(`/inventory/expiry-calendar?start=${startDate}&end=${endDate}`);
            console.log('[StoreService] GET expiry calendar response:', response.data);
            const batches = response.data.data || response.data;
            const mapped = mapBatchesFromBackend(batches);
            console.log('[StoreService] GET expiry calendar mapped:', mapped.length, 'items');
            return mapped;
        } catch (error) {
            console.error('[StoreService] GET expiry calendar error:', error?.response?.data || error?.response || error);
            // Return empty array as fallback
            return [];
        }
    },

    // ============= STOCK REPORTS =============

    /**
     * Get stock valuation report
     * @returns {Promise} Stock valuation data
     */
    getStockValuation: async () => {
        try {
            const response = await api.get('/reports/stock-valuation');
            return response.data.data || response.data;
        } catch (error) {
            console.error('Error fetching stock valuation:', error);
            throw error;
        }
    },

    /**
     * Get stock aging report
     * @returns {Promise} Stock aging data
     */
    getStockAging: async () => {
        try {
            const response = await api.get('/reports/stock-aging');
            return response.data.data || response.data;
        } catch (error) {
            console.error('Error fetching stock aging:', error);
            throw error;
        }
    },

    /**
     * Get stock overview
     * @returns {Promise} Stock overview data
     */
    getStockOverview: async () => {
        try {
            console.log('[StoreService] GET stock overview');
            const response = await api.get('/inventory/stock-overview');
            console.log('[StoreService] GET stock overview response:', response.data);
            return response.data.data || response.data;
        } catch (error) {
            console.error('[StoreService] GET stock overview error:', error?.response?.data || error?.response || error);
            // Return empty array as fallback since backend returns List<StockDTO>
            return [];
        }
    },

    /**
     * Get low stock items
     * @returns {Promise} Array of products with low stock
     */
    getLowStockItems: async () => {
        try {
            const response = await api.get('/inventory/stock-overview/low-stock');
            const products = response.data.data || response.data;
            return mapBatchesFromBackend(products);
        } catch (error) {
            console.error('Error fetching low stock items:', error);
            // Return empty array as fallback
            return [];
        }
    }
};

export default storeService;
