import api from '@/lib/api';
import {
    mapProductFromBackend,
    mapProductToBackend,
    mapProductsFromBackend,
    mapCategoryFromBackend,
    mapCategoryToBackend,
    mapCategoriesFromBackend,
    mapBrandFromBackend,
    mapBrandToBackend,
    mapBrandsFromBackend,
    mapSupplierFromBackend,
    mapSupplierToBackend,
    mapSuppliersFromBackend,
    mapDispatchFromBackend,
    mapDispatchToBackend,
    mapDispatchesFromBackend,
    mapGrnFromBackend,
    mapGrnToBackend,
    mapGrnsFromBackend,
    mapSubCategoriesFromBackend,
    mapSubCategoryToBackend,
    mapSubCategoryFromBackend,
    mapBranchesFromBackend
} from '@/features/inventory/services/inventoryMapper';

export const inventoryService = {
    // ============= PRODUCTS =============

    getProducts: async () => {
        try {
            console.log('[InventoryService] GET products');
            const response = await api.get('/inventory/products');
            console.log('[InventoryService] GET products response:', response.data);
            const products = response.data.data || response.data;
            const mapped = mapProductsFromBackend(products);
            console.log('[InventoryService] GET products mapped:', mapped.length, 'items');
            return mapped;
        } catch (error) {
            console.error('[InventoryService] GET products error:', error?.response || error);
            throw error;
        }
    },

    getProductById: async (productId) => {
        try {
            const response = await api.get(`/inventory/products/${productId}`);
            const product = response.data.data || response.data;
            return mapProductFromBackend(product);
        } catch (error) {
            console.error('Error fetching product:', error);
            throw error;
        }
    },

    searchProducts: async (query) => {
        try {
            const response = await api.get(`/products/search?q=${query}`);
            const products = response.data.data || response.data;
            return mapProductsFromBackend(products);
        } catch (error) {
            console.error('Error searching products:', error);
            throw error;
        }
    },

    getNextSku: async () => {
        try {
            const response = await api.get('/inventory/products/next-sku');
            return response.data.data || response.data;
        } catch (error) {
            console.error('Error fetching next SKU:', error);
            throw error;
        }
    },

    getProductSales: async (productId, branchId = null) => {
        const normalizeId = (value) => (value == null ? '' : String(value));
        const targetId = normalizeId(productId);
        const toNumber = (value) => {
            const num = Number(value);
            return Number.isFinite(num) ? num : 0;
        };

        const asArray = (payload) => {
            if (Array.isArray(payload)) return payload;
            if (Array.isArray(payload?.content)) return payload.content;
            if (Array.isArray(payload?.items)) return payload.items;
            return [];
        };

        const extractFromFlatRows = (rows) => {
            return rows
                .filter((row) => {
                    const rowProductId = row?.product_id ?? row?.productId ?? row?.item_id ?? row?.itemId ?? row?.id;
                    if (!rowProductId && targetId) return true; 
                    return normalizeId(rowProductId) === targetId;
                })
                .map((row) => {
                    const qty = toNumber(row?.quantity ?? row?.qty ?? row?.totalQuantity ?? row?.soldQty ?? row?.quantitySold ?? 0);
                    const revenue = toNumber(row?.revenue ?? row?.total ?? row?.lineTotal ?? row?.netTotal ?? row?.totalRevenue ?? 0);
                    const date = row?.date || row?.saleDate || row?.created_at || row?.createdAt || null;
                    const rowBranchId = row?.branch_id ?? row?.branchId ?? row?.storeId ?? null;
                    return { date, quantity: qty, revenue, branchId: rowBranchId };
                });
        };

        const fetchSalesRows = async (params) => {
            try {
                if (params.productId) {
                    try {
                        const { productId, ...rest } = params;
                        const response = await api.get(`/sales/products/${productId}`, { params: rest, silent: true });
                        return asArray(response.data?.data || response.data);
                    } catch (e) {
                        console.debug('[InventoryService] Product specific sales endpoint failed, trying generic...');
                    }
                }
                try {
                    const response = await api.get('/v1/pos/sales', { params, silent: true });
                    return asArray(response.data?.data || response.data);
                } catch (e) {
                    try {
                        const response = await api.get('/sales', { params, silent: true });
                        return asArray(response.data?.data || response.data);
                    } catch (err) {
                        throw err;
                    }
                }
            } catch (error) {
                throw error;
            }
        };

        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            
            const directRows = await fetchSalesRows({ 
                productId, 
                branchId: branchId || undefined, 
                limit: 200,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString() 
            });
            const fromDirect = extractFromFlatRows(directRows);
            const directFiltered = branchId
                ? fromDirect.filter((r) => normalizeId(r.branchId) === normalizeId(branchId) || !r.branchId)
                : fromDirect;

            return directFiltered;
        } catch (err) {
            throw err;
        }
    },

    createProduct: async (productData) => {
        try {
            const backendData = mapProductToBackend(productData);
            const response = await api.post('/inventory/products', backendData);
            const product = response.data.data || response.data;
            return mapProductFromBackend(product);
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    },

    updateProduct: async (productId, productData) => {
        try {
            const backendData = mapProductToBackend(productData);
            const response = await api.put(`/inventory/products/${productId}`, backendData);
            const product = response.data.data || response.data;
            return mapProductFromBackend(product);
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    },

    deleteProduct: async (productId) => {
        try {
            const response = await api.delete(`/inventory/products/${productId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    },

    getProductsByCategory: async (categoryId) => {
        try {
            const response = await api.get(`/products/category/${categoryId}`);
            const products = response.data.data || response.data;
            return mapProductsFromBackend(products);
        } catch (error) {
            console.error('Error fetching products by category:', error);
            throw error;
        }
    },

    getProductsByBrand: async (brandId) => {
        try {
            const response = await api.get(`/products/brand/${brandId}`);
            const products = response.data.data || response.data;
            return mapProductsFromBackend(products);
        } catch (error) {
            console.error('Error fetching products by brand:', error);
            throw error;
        }
    },

    // ============= CATEGORIES =============

    getCategories: async () => {
        try {
            console.log('[InventoryService] GET categories');
            const response = await api.get('/inventory/categories');
            console.log('[InventoryService] GET categories response:', response.data);
            const categories = response.data.data || response.data;
            const mapped = mapCategoriesFromBackend(categories);
            console.log('[InventoryService] GET categories mapped:', mapped.length, 'items');
            return mapped;
        } catch (error) {
            console.error('[InventoryService] GET categories error:', error?.response || error);
            throw error;
        }
    },

    getCategoryById: async (categoryId) => {
        try {
            const response = await api.get(`/inventory/categories/${categoryId}`);
            const category = response.data.data || response.data;
            return mapCategoryFromBackend(category);
        } catch (error) {
            console.error('Error fetching category:', error);
            throw error;
        }
    },

    createCategory: async (categoryData) => {
        try {
            const { category_id, ...rest } = categoryData;
            console.log('[InventoryService] POST category:', rest);
            const backendData = mapCategoryToBackend(rest);
            console.log('[InventoryService] POST category (mapped):', backendData);
            const response = await api.post('/inventory/categories', backendData);
            console.log('[InventoryService] POST category response:', response.data);
            const category = response.data.data || response.data;
            return mapCategoryFromBackend(category);
        } catch (error) {
            console.error('[InventoryService] POST category error:', error?.response || error);
            throw error;
        }
    },

    updateCategory: async (categoryId, categoryData) => {
        try {
            const backendData = mapCategoryToBackend(categoryData);
            const response = await api.put(`/categories/${categoryId}`, backendData);
            const category = response.data.data || response.data;
            return mapCategoryFromBackend(category);
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    },

    deleteCategory: async (categoryId) => {
        try {
            const response = await api.delete(`/inventory/categories/${categoryId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    },

    // ============= SUBCATEGORIES =============
    getSubCategories: async () => {
        try {
            const response = await api.get('/inventory/subcategories');
            const subcategories = response.data.data || response.data;
            return mapSubCategoriesFromBackend(subcategories);
        } catch (error) {
            console.error('Error fetching subcategories:', error);
            throw error;
        }
    },

    createSubCategory: async (subCategoryData) => {
        try {
            const { subcategory_id, ...rest } = subCategoryData;
            const backendData = mapSubCategoryToBackend(rest);
            const response = await api.post('/inventory/subcategories', backendData);
            const subCategory = response.data.data || response.data;
            return mapSubCategoryFromBackend(subCategory);
        } catch (error) {
            console.error('Error creating subcategory:', error);
            throw error;
        }
    },

    updateSubCategory: async (subCategoryId, subCategoryData) => {
        try {
            const backendData = mapSubCategoryToBackend(subCategoryData);
            const response = await api.put(`/subcategories/${subCategoryId}`, backendData);
            const subCategory = response.data.data || response.data;
            return mapSubCategoryFromBackend(subCategory);
        } catch (error) {
            console.error('Error updating subcategory:', error);
            throw error;
        }
    },

    deleteSubCategory: async (subCategoryId) => {
        try {
            const response = await api.delete(`/inventory/subcategories/${subCategoryId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting subcategory:', error);
            throw error;
        }
    },

    // ============= BRANDS =============

    getBrands: async () => {
        try {
            console.log('[InventoryService] GET brands');
            const response = await api.get('/inventory/brands');
            console.log('[InventoryService] GET brands response:', response.data);
            const brands = response.data.data || response.data;
            const mapped = mapBrandsFromBackend(brands);
            console.log('[InventoryService] GET brands mapped:', mapped.length, 'items');
            return mapped;
        } catch (error) {
            console.error('[InventoryService] GET brands error:', error?.response || error);
            throw error;
        }
    },

    getBrandById: async (brandId) => {
        try {
            const response = await api.get(`/inventory/brands/${brandId}`);
            const brand = response.data.data || response.data;
            return mapBrandFromBackend(brand);
        } catch (error) {
            console.error('Error fetching brand:', error);
            throw error;
        }
    },

    createBrand: async (brandData) => {
        try {
            const { brand_id, ...rest } = brandData;
            const backendData = mapBrandToBackend(rest);
            const response = await api.post('/inventory/brands', backendData);
            const brand = response.data.data || response.data;
            return mapBrandFromBackend(brand);
        } catch (error) {
            console.error('Error creating brand:', error);
            throw error;
        }
    },

    updateBrand: async (brandId, brandData) => {
        try {
            const backendData = mapBrandToBackend(brandData);
            const response = await api.put(`/brands/${brandId}`, backendData);
            const brand = response.data.data || response.data;
            return mapBrandFromBackend(brand);
        } catch (error) {
            console.error('Error updating brand:', error);
            throw error;
        }
    },

    deleteBrand: async (brandId) => {
        try {
            const response = await api.delete(`/inventory/brands/${brandId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting brand:', error);
            throw error;
        }
    },

    // ============= BRANCHES =============

    getBranches: async () => {
        try {
            console.log('[InventoryService] GET branches');
            const response = await api.get('/inventory/branches');
            console.log('[InventoryService] GET branches response:', response.data);
            const branches = response.data.data || response.data;
            const mapped = mapBranchesFromBackend(branches);
            console.log('[InventoryService] GET branches mapped:', mapped.length, 'items');
            return mapped;
        } catch (error) {
            console.error('[InventoryService] GET branches error:', error?.response || error);
            throw error;
        }
    },

    // ============= DispatchS =============

    getDispatches: async (branchId) => {
        try {
            console.log('[InventoryService] GET Dispatches for branch:', branchId);
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const effectiveBranchId = branchId || user.branchId || 1;

            const response = await api.get(`/inventory/dispatch/branch/${effectiveBranchId}`);
            const dispatches = response.data.data || response.data;
            const mapped = mapDispatchesFromBackend(dispatches);
            console.log('[InventoryService] GET Dispatches mapped:', mapped.length, 'items');
            return mapped;
        } catch (error) {
            console.error('[InventoryService] Error fetching Dispatches:', error);
            throw error;
        }
    },

    searchDispatches: async (filter = {}) => {
        try {
            console.log('[InventoryService] Search Dispatches with filter:', filter);
            const backendFilter = mapDispatchToBackend(filter);
            const response = await api.post('/inventory/dispatch/search', backendFilter);
            const dispatches = response.data.data || response.data;
            return mapDispatchesFromBackend(dispatches);
        } catch (error) {
            console.error('[InventoryService] Error searching Dispatches:', error);
            throw error;
        }
    },

    getPendingDispatches: async (branchId) => {
        try {
            console.log('[InventoryService] GET pending Dispatches for branch:', branchId);
            const response = await api.get('/inventory/dispatch/pending', {
                params: branchId ? { branchId } : {}
            });
            const dispatches = response.data.data || response.data;
            return mapDispatchesFromBackend(dispatches);
        } catch (error) {
            console.error('[InventoryService] Error fetching pending Dispatches:', error);
            throw error;
        }
    },

    getDispatchById: async (dispatchId) => {
        try {
            console.log('[InventoryService] GET Dispatch by ID:', dispatchId);
            const response = await api.get(`/inventory/dispatch/${dispatchId}`);
            const dispatch = response.data.data || response.data;
            return mapDispatchFromBackend(dispatch);
        } catch (error) {
            console.error('[InventoryService] Error fetching Dispatch:', error);
            throw error;
        }
    },

    createDispatch: async (dispatchData) => {
        try {
            console.log('[InventoryService] Create Dispatch:', dispatchData);
            const backendData = {
                branchId: dispatchData.branch_id ?? dispatchData.branchId,
                supplierId: dispatchData.supplier_id ?? dispatchData.supplierId,
                poId: dispatchData.po_id ?? dispatchData.poId ?? null,
                dispatchDate: dispatchData.dispatch_date ?? dispatchData.dispatchDate,
                invoiceNo: dispatchData.invoice_no ?? dispatchData.invoiceNo,
                invoiceDate: dispatchData.invoice_date ?? dispatchData.invoiceDate,
                items: dispatchData.items.map(item => ({
                    productId: item.product_id ?? item.productId,
                    batchCode: item.batch_code ?? item.batchCode ?? null,
                    expiryDate: item.expiry_date ?? item.expiryDate ?? null,
                    qtyReceived: item.quantity ?? item.qtyReceived,
                    qtyDispatched: item.quantity ?? item.qtyReceived ?? item.qtyDispatched,
                    unitPrice: item.unit_price ?? item.unitPrice,
                    sellingPrice: item.selling_price ?? item.sellingPrice ?? null,
                    mrp: item.mrp ?? null,
                    serialNo: item.serial_no ?? item.serialNo ?? null
                }))
            };

            console.log('[InventoryService] Create Dispatch backend data:', backendData);
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.userId || user.id || 1;

            const response = await api.post('/inventory/dispatch', backendData, {
                headers: {
                    'User-ID': userId
                }
            });

            const dispatch = response.data.data || response.data;
            console.log('[InventoryService] Create Dispatch response:', dispatch);
            return mapDispatchFromBackend(dispatch);
        } catch (error) {
            console.error('[InventoryService] Error creating Dispatch:', error);
            throw error;
        }
    },

    updateDispatch: async (dispatchId, dispatchData) => {
        try {
            console.log('[InventoryService] Update Dispatch:', dispatchId, dispatchData);
            const backendData = {
                dispatchDate: dispatchData.dispatch_date,
                invoiceNo: dispatchData.invoice_no,
                invoiceDate: dispatchData.invoice_date,
                items: dispatchData.items?.map(item => ({
                    productId: item.product_id,
                    batchCode: item.batch_code || null,
                    expiryDate: item.expiry_date || null,
                    qtyReceived: item.quantity,
                    unitPrice: item.unit_price
                }))
            };

            const response = await api.put(`/inventory/dispatch/${dispatchId}`, backendData);
            const dispatch = response.data.data || response.data;
            return mapDispatchFromBackend(dispatch);
        } catch (error) {
            console.error('[InventoryService] Error updating Dispatch:', error);
            throw error;
        }
    },

    approveDispatch: async (dispatchId) => {
        try {
            console.log('[InventoryService] Approve Dispatch:', dispatchId);
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.userId || user.id || 1;

            const response = await api.put(`/inventory/dispatch/${dispatchId}/approve`, {}, {
                headers: {
                    'User-ID': userId
                }
            });
            const dispatch = response.data.data || response.data;
            return mapDispatchFromBackend(dispatch);
        } catch (error) {
            console.error('[InventoryService] Error approving Dispatch:', error);
            throw error;
        }
    },

    rejectDispatch: async (dispatchId, reason) => {
        try {
            console.log('[InventoryService] Reject Dispatch:', dispatchId, reason);
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.userId || user.id || 1;

            const response = await api.put(`/inventory/dispatch/${dispatchId}/reject`, {}, {
                headers: {
                    'User-ID': userId
                },
                params: { reason }
            });
            const dispatch = response.data.data || response.data;
            return mapDispatchFromBackend(dispatch);
        } catch (error) {
            console.error('[InventoryService] Error rejecting Dispatch:', error);
            throw error;
        }
    },

    updateDispatchPaymentStatus: async (dispatchId, paymentStatus) => {
        try {
            console.log('[InventoryService] Update Dispatch payment status:', dispatchId, paymentStatus);
            const response = await api.put(`/inventory/dispatch/${dispatchId}/payment-status`, null, {
                params: { paymentStatus }
            });
            const dispatch = response.data.data || response.data;
            return mapDispatchFromBackend(dispatch);
        } catch (error) {
            console.error('[InventoryService] Error updating Dispatch payment status:', error);
            throw error;
        }
    },

    deleteDispatch: async (dispatchId) => {
        try {
            console.log('[InventoryService] Delete Dispatch:', dispatchId);
            const response = await api.delete(`/inventory/dispatch/${dispatchId}`);
            return response.data;
        } catch (error) {
            console.error('[InventoryService] Error deleting Dispatch:', error);
            throw error;
        }
    },

    getDispatchStats: async (branchId, period) => {
        try {
            console.log('[InventoryService] GET Dispatch stats:', branchId, period);
            const params = period ? { period } : {};
            const response = await api.get(`/inventory/dispatch/branch/${branchId}/stats`, { params });
            const stats = response.data.data || response.data;
            return mapDispatchFromBackend(stats);
        } catch (error) {
            console.error('[InventoryService] Error fetching Dispatch stats:', error);
            throw error;
        }
    },

    getDispatchItemsByProduct: async (productId, branchId) => {
        try {
            console.log('[InventoryService] GET Dispatch items by product:', productId, branchId);
            const params = branchId ? { branchId } : {};
            const response = await api.get(`/inventory/dispatch/product/${productId}/items`, { params });
            const items = response.data.data || response.data;
            return mapDispatchesFromBackend(items);
        } catch (error) {
            console.error('[InventoryService] Error fetching Dispatch items by product:', error);
            throw error;
        }
    },

    getDispatchesBySupplier: async (supplierId) => {
        try {
            console.log('[InventoryService] GET Dispatches by supplier:', supplierId);
            const response = await api.get(`/inventory/dispatch/supplier/${supplierId}`);
            const dispatches = response.data.data || response.data;
            return mapDispatchesFromBackend(dispatches);
        } catch (error) {
            console.error('[InventoryService] Error fetching Dispatches by supplier:', error);
            throw error;
        }
    },

    checkDispatchNumber: async (dispatchNo) => {
        try {
            console.log('[InventoryService] Check Dispatch number:', dispatchNo);
            const response = await api.get(`/inventory/dispatch/check-number/${dispatchNo}`);
            return response.data.data || response.data;
        } catch (error) {
            console.error('[InventoryService] Error checking Dispatch number:', error);
            throw error;
        }
    },

    // ============= GRN (Goods Received Notes) =============

    getGrns: async (branchId) => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const effectiveBranchId = branchId || user.branchId || 1;
            const response = await api.get(`/inventory/grn/branch/${effectiveBranchId}`);
            const grns = response.data.data || response.data;
            return mapGrnsFromBackend(grns);
        } catch (error) {
            console.error('[InventoryService] Error fetching GRNs:', error);
            throw error;
        }
    },

    searchGrns: async (filter = {}) => {
        try {
            const backendFilter = mapGrnToBackend(filter);
            const response = await api.post('/inventory/grn/search', backendFilter);
            const grns = response.data.data || response.data;
            return mapGrnsFromBackend(grns);
        } catch (error) {
            console.error('[InventoryService] Error searching GRNs:', error);
            throw error;
        }
    },

    getGrnById: async (grnId) => {
        try {
            const response = await api.get(`/inventory/grn/${grnId}`);
            const grn = response.data.data || response.data;
            return mapGrnFromBackend(grn);
        } catch (error) {
            console.error('[InventoryService] Error fetching GRN:', error);
            throw error;
        }
    },

    createGrn: async (grnData) => {
        try {
            const backendData = {
                branchId: grnData.branch_id ?? grnData.branchId,
                supplierId: grnData.supplier_id ?? grnData.supplierId,
                poId: grnData.po_id ?? grnData.poId ?? null,
                grnDate: grnData.grn_date ?? grnData.grnDate ?? grnData.dispatch_date,
                invoiceNo: grnData.invoice_no ?? grnData.invoiceNo,
                invoiceDate: grnData.invoice_date ?? grnData.invoiceDate,
                items: grnData.items.map(item => ({
                    productId: item.product_id ?? item.productId,
                    batchCode: item.batch_code ?? item.batchCode ?? null,
                    expiryDate: item.expiry_date ?? item.expiryDate ?? null,
                    qtyReceived: item.quantity ?? item.qty_received ?? item.qtyReceived,
                    unitPrice: item.unit_price ?? item.unitPrice,
                    sellingPrice: item.selling_price ?? item.sellingPrice ?? null,
                    mrp: item.mrp ?? null,
                    serialNo: item.serial_no ?? item.serialNo ?? null
                }))
            };
            const response = await api.post('/inventory/grn', backendData);
            const grn = response.data.data || response.data;
            return mapGrnFromBackend(grn);
        } catch (error) {
            console.error('[InventoryService] Error creating GRN:', error);
            throw error;
        }
    },

    postGrn: async (grnId) => {
        try {
            const response = await api.put(`/inventory/grn/${grnId}/post`, {});
            const grn = response.data.data || response.data;
            return mapGrnFromBackend(grn);
        } catch (error) {
            console.error('[InventoryService] Error posting GRN:', error);
            throw error;
        }
    },

    deleteGrn: async (grnId) => {
        try {
            const response = await api.delete(`/inventory/grn/${grnId}`);
            return response.data;
        } catch (error) {
            console.error('[InventoryService] Error deleting GRN:', error);
            throw error;
        }
    },

    // ============= SERIALS / IMEI =============
    getSerialByNo: async (serialNo) => {
        try {
            const response = await api.get(`/inventory/serials/serial/${serialNo}`);
            return response.data.data || response.data;
        } catch (error) {
            console.error('Error fetching serial:', error);
            throw error;
        }
    },

    getAvailableSerials: async (productId, branchId) => {
        try {
            const response = await api.get('/inventory/serials/available', {
                params: { productId, branchId }
            });
            return response.data.data || response.data;
        } catch (error) {
            console.error('Error fetching available serials:', error);
            throw error;
        }
    },

    getAvailableTransferSerials: async (productId, branchId) => {
        try {
            const response = await api.get('/inventory/serials/available-transfer', {
                params: { productId, branchId }
            });
            return response.data.data || response.data;
        } catch (error) {
            console.error('Error fetching available transfer serials:', error);
            throw error;
        }
    },

    lookupSerials: async (params = {}) => {
        try {
            const response = await api.get('/inventory/serials/lookup', {
                params: {
                    branchId: params.branchId || undefined,
                    productId: params.productId || undefined,
                    branchIds: Array.isArray(params.branchIds) && params.branchIds.length ? params.branchIds.join(',') : undefined,
                    productIds: Array.isArray(params.productIds) && params.productIds.length ? params.productIds.join(',') : undefined,
                    status: params.status || undefined,
                    search: params.search || undefined,
                    page: Number.isFinite(params.page) ? params.page : 0,
                    size: Number.isFinite(params.size) ? params.size : 20
                }
            });

            const payload = response.data || {};
            const innerData = payload.data || {};
            return {
                rows: innerData.items || [],
                page: innerData.page ?? 0,
                size: innerData.size ?? 20,
                totalElements: innerData.totalElements ?? 0,
                totalPages: innerData.totalPages ?? 0
            };
        } catch (error) {
            console.error('Error looking up serials:', error);
            throw error;
        }
    },

    getDispatchListPdf: async () => {
        try {
            const response = await api.get('/inventory/dispatch/reports/pdf', {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error downloading Dispatch List PDF:', error);
            throw error;
        }
    },

    // ============= SUPPLIERS =============

    getSuppliers: async () => {
        try {
            console.log('[InventoryService] GET suppliers');
            const response = await api.get('/inventory/suppliers');
            console.log('[InventoryService] GET suppliers response:', response.data);
            const resData = response.data.data || response.data;
            const suppliers = Array.isArray(resData) ? resData : (Array.isArray(resData?.content) ? resData.content : []);
            const mapped = mapSuppliersFromBackend(suppliers);
            console.log('[InventoryService] GET suppliers mapped:', mapped.length, 'items');
            return mapped;
        } catch (error) {
            console.error('[InventoryService] GET suppliers error:', error?.response || error);
            throw error;
        }
    },

    getSupplierById: async (supplierId) => {
        try {
            const response = await api.get(`/inventory/suppliers/${supplierId}`);
            const supplier = response.data.data || response.data;
            return mapSupplierFromBackend(supplier);
        } catch (error) {
            console.error('Error fetching supplier:', error);
            throw error;
        }
    },

    createSupplier: async (supplierData) => {
        try {
            const { supplier_id, ...rest } = supplierData;
            const backendData = mapSupplierToBackend(rest);
            const response = await api.post('/inventory/suppliers', backendData);
            const supplier = response.data.data || response.data;
            return mapSupplierFromBackend(supplier);
        } catch (error) {
            console.error('Error creating supplier:', error);
            throw error;
        }
    },

    updateSupplier: async (supplierId, supplierData) => {
        try {
            const backendData = mapSupplierToBackend(supplierData);
            const response = await api.put(`/inventory/suppliers/${supplierId}`, backendData);
            const supplier = response.data.data || response.data;
            return mapSupplierFromBackend(supplier);
        } catch (error) {
            console.error('Error updating supplier:', error);
            throw error;
        }
    },

    deleteSupplier: async (supplierId) => {
        try {
            const response = await api.delete(`/inventory/suppliers/${supplierId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting supplier:', error);
            throw error;
        }
    }
};

export default inventoryService;
