import api from './api';
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
    mapSubCategoriesFromBackend,
    mapSubCategoryToBackend,
    mapSubCategoryFromBackend,
    mapBranchesFromBackend
} from './inventoryMapper';

/**
 * Inventory Service
 * Handles all inventory-related API calls (Products, Categories, Brands, Suppliers)
 * Backend returns: { success: boolean, data: any, message: string }
 * For lists, use response.data.data
 */

export const inventoryService = {
    // ============= PRODUCTS =============

    /**
     * Get all products
     * @returns {Promise} Array of products in frontend format (snake_case)
     */
    getProducts: async () => {
        try {
            console.log('[InventoryService] GET products');
            const response = await api.get('/inventory/products');
            console.log('[InventoryService] GET products response:', response.data);
            // Backend returns { success, data: [...], message }
            const products = response.data.data || response.data;
            const mapped = mapProductsFromBackend(products);
            console.log('[InventoryService] GET products mapped:', mapped.length, 'items');
            return mapped;
        } catch (error) {
            console.error('[InventoryService] GET products error:', error?.response || error);
            throw error;
        }
    },

    /**
     * Get product by ID
     * @param {number} productId - Product ID
     * @returns {Promise} Product object in frontend format
     */
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

    /**
     * Search products by query
     * @param {string} query - Search query
     * @returns {Promise} Array of products
     */
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

    /**
     * Get next available SKU
     * @returns {Promise} Next SKU string
     */
    getNextSku: async () => {
        try {
            const response = await api.get('/inventory/products/next-sku');
            return response.data.data || response.data;
        } catch (error) {
            console.error('Error fetching next SKU:', error);
            throw error;
        }
    },

    /**
     * Get sales data for a specific product
     * @param {number} productId - Product ID
     * @returns {Promise} Array of sales records for the product
     */
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
                    // If row has no product ID but we are in a product-specific context, we might keep it
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

        const extractFromSaleHeaders = (sales) => {
            const extracted = [];

            sales.forEach((sale) => {
                const saleDate = sale?.saleDate || sale?.date || sale?.createdAt || sale?.created_at || null;
                const lineItems = sale?.items || sale?.saleItems || sale?.orderItems || [];

                if (!Array.isArray(lineItems)) return;

                lineItems.forEach((line) => {
                    const rowProductId = line?.product_id ?? line?.productId ?? line?.item_id ?? line?.itemId ?? line?.id;
                    if (normalizeId(rowProductId) !== targetId) return;

                    const qty = toNumber(line?.quantity ?? line?.qty ?? line?.soldQty ?? line?.totalQuantity ?? line?.quantitySold ?? 0);
                    const unit = toNumber(line?.selling_price ?? line?.sellingPrice ?? line?.unit_price ?? line?.unitPrice ?? 0);
                    const revenue = toNumber(line?.lineTotal ?? line?.total ?? line?.netTotal ?? line?.totalRevenue ?? unit * qty);

                    const lineBranchId = line?.branch_id ?? line?.branchId ?? sale?.branch_id ?? sale?.branchId ?? null;
                    extracted.push({ date: saleDate, quantity: qty, revenue, branchId: lineBranchId });
                });
            });

            return extracted;
        };

        const fetchSalesRows = async (params) => {
            try {
                // 1. If productId is provided, try the specific sales history endpoint first
                if (params.productId) {
                    try {
                        const { productId, ...rest } = params;
                        const response = await api.get(`/sales/products/${productId}`, { params: rest, silent: true });
                        return asArray(response.data?.data || response.data);
                    } catch (e) {
                        console.debug('[InventoryService] Product specific sales endpoint failed, trying generic...');
                    }
                }

                // 2. Try generic sales endpoint (PosController v1)
                try {
                    const response = await api.get('/v1/pos/sales', { params, silent: true });
                    return asArray(response.data?.data || response.data);
                } catch (e) {
                    // 3. Last resort: try base /sales endpoint
                    try {
                        const response = await api.get('/sales', { params, silent: true });
                        return asArray(response.data?.data || response.data);
                    } catch (err) {
                        // Fail explicitly to allow caller to stop polling
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
            // Silently handle errors - sales data is not critical for item details
            // Throw so ItemDetailScreen can catch and kill polling
            throw err;
        }
    },

    /**
     * Create new product
     * @param {Object} productData - Product data in frontend format (snake_case)
     * @returns {Promise} Created product
     */
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

    /**
     * Update product
     * @param {number} productId - Product ID
     * @param {Object} productData - Product data in frontend format
     * @returns {Promise} Updated product
     */
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

    /**
     * Delete product
     * @param {number} productId - Product ID
     * @returns {Promise}
     */
    deleteProduct: async (productId) => {
        try {
            const response = await api.delete(`/inventory/products/${productId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    },

    /**
     * Get products by category
     * @param {number} categoryId - Category ID
     * @returns {Promise} Array of products
     */
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

    /**
     * Get products by brand
     * @param {number} brandId - Brand ID
     * @returns {Promise} Array of products
     */
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

    /**
     * Get all categories
     * @returns {Promise} Array of categories in frontend format
     */
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

    /**
     * Get category by ID
     * @param {number} categoryId - Category ID
     * @returns {Promise} Category object
     */
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

    /**
     * Create new category
     * @param {Object} categoryData - Category data in frontend format
     * @returns {Promise} Created category
     */
    createCategory: async (categoryData) => {
        try {
            // eslint-disable-next-line no-unused-vars
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

    /**
     * Update category
     * @param {number} categoryId - Category ID
     * @param {Object} categoryData - Category data in frontend format
     * @returns {Promise} Updated category
     */
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

    /**
     * Delete category
     * @param {number} categoryId - Category ID
     * @returns {Promise}
     */
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
    /**
     * Get all subcategories
     * @returns {Promise} Array of subcategories
     */
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

    /**
     * Create new subcategory
     * @param {Object} subCategoryData
     * @returns {Promise} Created subcategory
     */
    createSubCategory: async (subCategoryData) => {
        try {
            // eslint-disable-next-line no-unused-vars
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

    /**
     * Update subcategory
     * @param {number} subCategoryId
     * @param {Object} subCategoryData
     * @returns {Promise} Updated subcategory
     */
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

    /**
     * Delete subcategory
     * @param {number} subCategoryId
     * @returns {Promise}
     */
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

    /**
     * Get all brands
     * @returns {Promise} Array of brands in frontend format
     */
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

    /**
     * Get brand by ID
     * @param {number} brandId - Brand ID
     * @returns {Promise} Brand object
     */
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

    /**
     * Create new brand
     * @param {Object} brandData - Brand data in frontend format
     * @returns {Promise} Created brand
     */
    createBrand: async (brandData) => {
        try {
            // eslint-disable-next-line no-unused-vars
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

    /**
     * Update brand
     * @param {number} brandId - Brand ID
     * @param {Object} brandData - Brand data in frontend format
     * @returns {Promise} Updated brand
     */
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

    /**
     * Delete brand
     * @param {number} brandId - Brand ID
     * @returns {Promise}
     */
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

    /**
     * Get all branches
     * @returns {Promise} Array of branches in frontend format
     */
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

    /**
     * Get all Dispatches for a branch
     * @param {number} branchId - Branch ID
     * @returns {Promise} Array of Dispatches in frontend format
     */
    getDispatches: async (branchId) => {
        try {
            console.log('[InventoryService] GET Dispatches for branch:', branchId);
            // If no branchId provided, get from localStorage or use default
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

    /**
     * Search Dispatches with filters
     * @param {Object} filter - Filter object { branchId, supplierId, status, paymentStatus, startDate, endDate, dispatchNo, invoiceNo }
     * @returns {Promise} Array of Dispatches
     */
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

    /**
     * Get pending Dispatches for approval
     * @param {number} branchId - Optional branch ID filter
     * @returns {Promise} Array of pending Dispatches
     */
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

    /**
     * Get Dispatch by ID
     * @param {number} dispatchId - Dispatch ID
     * @returns {Promise} Dispatch object in frontend format
     */
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

    /**
     * Create new Dispatch
     * @param {Object} dispatchData - Dispatch data in frontend format (snake_case)
     * @returns {Promise} Created Dispatch
     */
    createDispatch: async (dispatchData) => {
        try {
            console.log('[InventoryService] Create Dispatch:', dispatchData);

            // Transform Dispatch data to backend format
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
                    unitPrice: item.unit_price ?? item.unitPrice,
                    sellingPrice: item.selling_price ?? item.sellingPrice ?? null,
                    mrp: item.mrp ?? null,
                    serialNo: item.serial_no ?? item.serialNo ?? null
                }))
            };

            console.log('[InventoryService] Create Dispatch backend data:', backendData);

            // Get current user ID
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
            console.error('[InventoryService] Error details:', error.response?.data);
            throw error;
        }
    },

    /**
     * Update Dispatch (only if pending)
     * @param {number} dispatchId - Dispatch ID
     * @param {Object} dispatchData - Dispatch update data
     * @returns {Promise} Updated Dispatch
     */
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

    /**
     * Approve Dispatch
     * @param {number} dispatchId - Dispatch ID
     * @returns {Promise} Approved Dispatch
     */
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

    /**
     * Reject Dispatch
     * @param {number} dispatchId - Dispatch ID
     * @param {string} reason - Rejection reason
     * @returns {Promise} Rejected Dispatch
     */
    rejectDispatch: async (dispatchId, reason) => {
        try {
            console.log('[InventoryService] Reject Dispatch:', dispatchId, reason);
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.userId || user.id || 1;

            const response = await api.put(`/inventory/dispatch/${dispatchId}/reject`, {}, {
                headers: {
                    'User-ID': userId
                },
                params: {
                    reason: reason
                }
            });
            const dispatch = response.data.data || response.data;
            return mapDispatchFromBackend(dispatch);
        } catch (error) {
            console.error('[InventoryService] Error rejecting Dispatch:', error);
            throw error;
        }
    },

    /**
     * Update Dispatch payment status
     * @param {number} dispatchId - Dispatch ID
     * @param {string} paymentStatus - Payment status (UNPAID, PARTIALLY_PAID, PAID)
     * @returns {Promise} Updated Dispatch
     */
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

    /**
     * Delete Dispatch (only if pending)
     * @param {number} dispatchId - Dispatch ID
     * @returns {Promise}
     */
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

    /**
     * Get Dispatch statistics for a branch
     * @param {number} branchId - Branch ID
     * @param {string} period - Optional period filter
     * @returns {Promise} Dispatch statistics
     */
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

    /**
     * Get Dispatch items by product
     * @param {number} productId - Product ID
     * @param {number} branchId - Optional branch ID filter
     * @returns {Promise} Array of Dispatch items
     */
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

    /**
     * Get Dispatches by supplier
     * @param {number} supplierId - Supplier ID
     * @returns {Promise} Array of Dispatches
     */
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

    /**
     * Check if Dispatch number exists
     * @param {string} dispatchNo - Dispatch number
     * @returns {Promise<boolean>} True if exists, false otherwise
     */
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

    // ============= SERIALS / IMEI =============
    /**
     * Get serial details by serial number (IMEI)
     * @param {string} serialNo - Serial number
     * @returns {Promise} Serial details
     */
    getSerialByNo: async (serialNo) => {
        try {
            const response = await api.get(`/inventory/serials/serial/${serialNo}`);
            return response.data.data || response.data;
        } catch (error) {
            console.error('Error fetching serial:', error);
            throw error;
        }
    },

    /**
     * Get available serials for a product and branch
     * @param {number} productId 
     * @param {number} branchId 
     * @returns {Promise} Array of serials
     */
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

    /**
     * Lookup IMEI/serial records with filters and pagination.
     * @param {Object} params
     * @returns {Promise<{rows: Array, page: number, size: number, totalElements: number, totalPages: number}>}
     */
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
            return {
                rows: payload.data || [],
                page: payload.page ?? 0,
                size: payload.size ?? 20,
                totalElements: payload.totalElements ?? 0,
                totalPages: payload.totalPages ?? 0
            };
        } catch (error) {
            console.error('Error looking up serials:', error);
            throw error;
        }
    },

    /**
     * Download Dispatch List as PDF
     * @returns {Promise<Blob>} PDF Blob
     */
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

    /**
     * Get all suppliers
     * @returns {Promise} Array of suppliers in frontend format
     */
    getSuppliers: async () => {
        try {
            console.log('[InventoryService] GET suppliers');
            const response = await api.get('/inventory/suppliers');
            console.log('[InventoryService] GET suppliers response:', response.data);
            const suppliers = response.data.data || response.data;
            const mapped = mapSuppliersFromBackend(suppliers);
            console.log('[InventoryService] GET suppliers mapped:', mapped.length, 'items');
            return mapped;
        } catch (error) {
            console.error('[InventoryService] GET suppliers error:', error?.response || error);
            throw error;
        }
    },

    /**
     * Get supplier by ID
     * @param {number} supplierId - Supplier ID
     * @returns {Promise} Supplier object
     */
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

    /**
     * Create new supplier
     * @param {Object} supplierData - Supplier data in frontend format
     * @returns {Promise} Created supplier
     */
    createSupplier: async (supplierData) => {
        try {
            // eslint-disable-next-line no-unused-vars
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

    /**
     * Update supplier
     * @param {number} supplierId - Supplier ID
     * @param {Object} supplierData - Supplier data in frontend format
     * @returns {Promise} Updated supplier
     */
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

    /**
     * Delete supplier
     * @param {number} supplierId - Supplier ID
     * @returns {Promise}
     */
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

