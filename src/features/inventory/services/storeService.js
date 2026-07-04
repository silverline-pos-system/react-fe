import api from '@/lib/api';
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
} from '@/features/inventory/services/inventoryMapper';

export const storeService = {
    // ============= BATCHES / STOCK =============

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
            return [];
        }
    },

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

    getAdjustments: async (filters = {}) => {
        try {
            console.log('[StoreService] GET adjustments with filters:', filters);
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
            return [];
        }
    },

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

    getAdjustmentsByProduct: async (productId) => {
        try {
            return await storeService.getAdjustments({ productId });
        } catch (error) {
            console.error('Error fetching adjustments by product:', error);
            throw error;
        }
    },

    // ============= STOCK TRANSFERS =============

    getTransfers: async (filters = {}) => {
        try {
            console.log('[StoreService] GET transfers with filters:', filters);
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
            return [];
        }
    },

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

    submitTransfer: async (transferId) => {
        try {
            console.log('[StoreService] POST submit transfer:', transferId);
            const response = await api.post(`/inventory/transfers/${transferId}/submit`);
            console.log('[Submit transfer response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error submitting transfer:', error?.response?.data || error);
            throw error;
        }
    },

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

    getPendingTransfers: async () => {
        try {
            console.log('[StoreService] GET pending transfers');
            return await storeService.getTransfers({ status: 'PENDING' });
        } catch (error) {
            console.error('[StoreService] GET pending transfers error:', error?.response?.data || error?.response || error);
            return [];
        }
    },

    // ============= DAMAGE ENTRIES =============

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
            return [];
        }
    },

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
            return [];
        }
    },

    // ============= STOCK REPORTS =============

    getStockValuation: async () => {
        try {
            const response = await api.get('/reports/stock-valuation');
            return response.data.data || response.data;
        } catch (error) {
            console.error('Error fetching stock valuation:', error);
            throw error;
        }
    },

    getStockAging: async () => {
        try {
            const response = await api.get('/reports/stock-aging');
            return response.data.data || response.data;
        } catch (error) {
            console.error('Error fetching stock aging:', error);
            throw error;
        }
    },

    getStockOverview: async () => {
        try {
            console.log('[StoreService] GET stock overview');
            const response = await api.get('/inventory/stock-overview');
            console.log('[StoreService] GET stock overview response:', response.data);
            return response.data.data || response.data;
        } catch (error) {
            console.error('[StoreService] GET stock overview error:', error?.response?.data || error?.response || error);
            return [];
        }
    },

    getLowStockItems: async () => {
        try {
            const response = await api.get('/inventory/stock-overview/low-stock');
            const products = response.data.data || response.data;
            return mapBatchesFromBackend(products);
        } catch (error) {
            console.error('Error fetching low stock items:', error);
            return [];
        }
    }
};

export default storeService;
