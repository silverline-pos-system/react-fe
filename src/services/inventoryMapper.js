/**
 * Inventory Mapper - Maps between backend camelCase and frontend snake_case
 * Backend uses: productId, categoryId, brandId, isActive, createdAt, etc.
 * Frontend uses: product_id, category_id, brand_id, is_active, created_at, etc.
 */

// Helper function to convert camelCase to snake_case
const camelToSnake = (str) => {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

// Helper function to convert snake_case to camelCase
const snakeToCamel = (str) => {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

// Deep convert object keys from camelCase to snake_case
const convertKeysToSnake = (obj) => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(convertKeysToSnake);
    if (typeof obj !== 'object') return obj;

    const newObj = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const snakeKey = camelToSnake(key);
            newObj[snakeKey] = convertKeysToSnake(obj[key]);
        }
    }
    return newObj;
};

// Deep convert object keys from snake_case to camelCase
const convertKeysToCamel = (obj) => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(convertKeysToCamel);
    if (typeof obj !== 'object') return obj;

    const newObj = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const camelKey = snakeToCamel(key);
            newObj[camelKey] = convertKeysToCamel(obj[key]);
        }
    }
    return newObj;
};

// ============= PRODUCT MAPPERS =============

/**
 * Map backend product to frontend format
 * Backend: { productId, categoryId, brandId, supplierId, isActive, createdAt, updatedAt, ... }
 * Frontend: { product_id, category_id, brand_id, supplier_id, is_active, created_at, updated_at, ... }
 */
export const mapProductFromBackend = (backendProduct) => {
    if (!backendProduct) return null;
    const mapped = convertKeysToSnake(backendProduct);

    const normalizedName =
        mapped.name ||
        mapped.product_name ||
        mapped.item_name ||
        "";

    const normalizedQuantity = Number(
        mapped.quantity ??
        mapped.available_quantity ??
        mapped.stock_quantity ??
        mapped.current_stock ??
        mapped.on_hand_quantity ??
        mapped.qty ??
        0
    );

    const normalizedIsActive =
        typeof mapped.is_active === "boolean"
            ? mapped.is_active
            : String(mapped.status || "").toUpperCase() === "ACTIVE";

    return {
        ...mapped,
        name: normalizedName,
        quantity: Number.isNaN(normalizedQuantity) ? 0 : normalizedQuantity,
        is_active: normalizedIsActive,
    };
};

/**
 * Map frontend product to backend format
 * Frontend: { product_id, category_id, brand_id, supplier_id, is_active, created_at, updated_at, ... }
 * Backend: { productId, categoryId, brandId, supplierId, isActive, createdAt, updatedAt, ... }
 */
export const mapProductToBackend = (frontendProduct) => {
    if (!frontendProduct) return null;
    return convertKeysToCamel(frontendProduct);
};

/**
 * Map array of backend products to frontend format
 */
export const mapProductsFromBackend = (backendProducts) => {
    if (!Array.isArray(backendProducts)) return [];
    return backendProducts.map(mapProductFromBackend);
};
// ============= SUBCATEGORY MAPPERS =============

/**
 * Map backend subcategory to frontend format
 * Backend: { subcategoryId, categoryId, isActive, createdAt, ... }
 * Frontend: { subcategory_id, category_id, is_active, created_at, ... }
 */
export const mapSubCategoryFromBackend = (backendSubCategory) => {
    if (!backendSubCategory) return null;
    return convertKeysToSnake(backendSubCategory);
};

/**
 * Map frontend subcategory to backend format
 */
export const mapSubCategoryToBackend = (frontendSubCategory) => {
    if (!frontendSubCategory) return null;
    return convertKeysToCamel(frontendSubCategory);
};

/**
 * Map array of backend subcategories to frontend format
 */
export const mapSubCategoriesFromBackend = (backendSubCategories) => {
    if (!Array.isArray(backendSubCategories)) return [];
    return backendSubCategories.map(mapSubCategoryFromBackend);
};

/**
 * Map backend category to frontend format
 * Backend: { categoryId, isActive, createdAt, updatedAt, ... }
 * Frontend: { category_id, is_active, created_at, updated_at, ... }
 */
export const mapCategoryFromBackend = (backendCategory) => {
    if (!backendCategory) return null;
    const mapped = convertKeysToSnake(backendCategory);
    // Ensure icon and color are preserved or set to defaults
    return {
        ...mapped,
        icon: mapped.icon || 'Tag',
        color: mapped.color || 'blue'
    };
};

/**
 * Map frontend category to backend format
 */
export const mapCategoryToBackend = (frontendCategory) => {
    if (!frontendCategory) return null;
    return convertKeysToCamel(frontendCategory);
};

/**
 * Map array of backend categories to frontend format
 */
export const mapCategoriesFromBackend = (backendCategories) => {
    if (!Array.isArray(backendCategories)) return [];
    return backendCategories.map(mapCategoryFromBackend);
};

// ============= BRAND MAPPERS =============

/**
 * Map backend brand to frontend format
 * Backend: { brandId, isActive, createdAt, updatedAt, ... }
 * Frontend: { brand_id, is_active, created_at, updated_at, ... }
 */
export const mapBrandFromBackend = (backendBrand) => {
    if (!backendBrand) return null;
    return convertKeysToSnake(backendBrand);
};

/**
 * Map frontend brand to backend format
 */
export const mapBrandToBackend = (frontendBrand) => {
    if (!frontendBrand) return null;
    return convertKeysToCamel(frontendBrand);
};

/**
 * Map array of backend brands to frontend format
 */
export const mapBrandsFromBackend = (backendBrands) => {
    if (!Array.isArray(backendBrands)) return [];
    return backendBrands.map(mapBrandFromBackend);
};

// ============= SUPPLIER MAPPERS =============

/**
 * Map backend supplier to frontend format
 * Backend: { supplierId, companyName, contactPerson, addressLine1, addressLine2, postalCode, 
 *            supplierType, supplierCategory, isActive, isVerified, createdAt, updatedAt, ... }
 * Frontend: { supplier_id, company_name, contact_person, address_line1, address_line2, postal_code,
 *             supplier_type, supplier_category, is_active, is_verified, created_at, updated_at, ... }
 */
export const mapSupplierFromBackend = (backendSupplier) => {
    if (!backendSupplier) return null;
    return convertKeysToSnake(backendSupplier);
};

/**
 * Map frontend supplier to backend format
 */
export const mapSupplierToBackend = (frontendSupplier) => {
    if (!frontendSupplier) return null;
    return convertKeysToCamel(frontendSupplier);
};

/**
 * Map array of backend suppliers to frontend format
 */
export const mapSuppliersFromBackend = (backendSuppliers) => {
    if (!Array.isArray(backendSuppliers)) return [];
    return backendSuppliers.map(mapSupplierFromBackend);
};

// ============= STOCK/BATCH MAPPERS =============

/**
 * Map backend stock/batch to frontend format
 * Backend: { batchId, productId, purchasePrice, sellingPrice, stockQuantity, 
 *            expiryDate, manufactureDate, isActive, createdAt, updatedAt, ... }
 * Frontend: { batch_id, product_id, purchase_price, selling_price, stock_quantity,
 *             expiry_date, manufacture_date, is_active, created_at, updated_at, ... }
 */
export const mapBatchFromBackend = (backendBatch) => {
    if (!backendBatch) return null;
    return convertKeysToSnake(backendBatch);
};

/**
 * Map frontend batch to backend format
 */
export const mapBatchToBackend = (frontendBatch) => {
    if (!frontendBatch) return null;
    return convertKeysToCamel(frontendBatch);
};

/**
 * Map array of backend batches to frontend format
 */
export const mapBatchesFromBackend = (backendBatches) => {
    if (!Array.isArray(backendBatches)) return [];
    return backendBatches.map(mapBatchFromBackend);
};

// ============= STOCK ADJUSTMENT MAPPERS =============

/**
 * Map backend stock adjustment to frontend format
 * Backend: { adjustmentId, productId, batchId, adjustmentType, quantityChange, 
 *            reasonCode, createdBy, createdAt, ... }
 * Frontend: { adjustment_id, product_id, batch_id, adjustment_type, quantity_change,
 *             reason_code, created_by, created_at, ... }
 */
export const mapAdjustmentFromBackend = (backendAdjustment) => {
    if (!backendAdjustment) return null;
    return convertKeysToSnake(backendAdjustment);
};

/**
 * Map frontend adjustment to backend format
 */
export const mapAdjustmentToBackend = (frontendAdjustment) => {
    if (!frontendAdjustment) return null;
    return convertKeysToCamel(frontendAdjustment);
};

/**
 * Map array of backend adjustments to frontend format
 */
export const mapAdjustmentsFromBackend = (backendAdjustments) => {
    if (!Array.isArray(backendAdjustments)) return [];
    return backendAdjustments.map(mapAdjustmentFromBackend);
};

// ============= STOCK TRANSFER MAPPERS =============

/**
 * Map backend stock transfer to frontend format
 * Backend: { transferId, fromBranch, toBranch, transferStatus, requestedBy, 
 *            approvedBy, createdAt, updatedAt, ... }
 * Frontend: { transfer_id, from_branch, to_branch, transfer_status, requested_by,
 *             approved_by, created_at, updated_at, ... }
 */
export const mapTransferFromBackend = (backendTransfer) => {
    if (!backendTransfer) return null;
    return convertKeysToSnake(backendTransfer);
};

/**
 * Map frontend transfer to backend format
 */
export const mapTransferToBackend = (frontendTransfer) => {
    if (!frontendTransfer) return null;
    return convertKeysToCamel(frontendTransfer);
};

/**
 * Map array of backend transfers to frontend format
 */
export const mapTransfersFromBackend = (backendTransfers) => {
    if (!Array.isArray(backendTransfers)) return [];
    return backendTransfers.map(mapTransferFromBackend);
};

// ============= DAMAGE ENTRY MAPPERS =============

/**
 * Map backend damage entry to frontend format
 * Backend: { damageId, productId, batchId, damageType, damageQuantity, 
 *            reportedBy, createdAt, ... }
 * Frontend: { damage_id, product_id, batch_id, damage_type, damage_quantity,
 *             reported_by, created_at, ... }
 */
export const mapDamageFromBackend = (backendDamage) => {
    if (!backendDamage) return null;
    return convertKeysToSnake(backendDamage);
};

/**
 * Map frontend damage to backend format
 */
export const mapDamageToBackend = (frontendDamage) => {
    if (!frontendDamage) return null;
    return convertKeysToCamel(frontendDamage);
};

/**
 * Map array of backend damages to frontend format
 */
export const mapDamagesFromBackend = (backendDamages) => {
    if (!Array.isArray(backendDamages)) return [];
    return backendDamages.map(mapDamageFromBackend);
};

// ============= Dispatch MAPPERS =============

/**
 * Map backend Dispatch to frontend format
 * Backend: { dispatchId, dispatchNo, branchId, supplierId, poId, dispatchDate, invoiceNo, invoiceDate, 
 *            totalAmount, netAmount, paymentStatus, status, createdBy, approvedBy, createdAt, ... }
 * Frontend: { dispatch_id, dispatch_no, branch_id, supplier_id, po_id, dispatch_date, invoice_no, invoice_date,
 *             total_amount, net_amount, payment_status, status, created_by, approved_by, created_at, ... }
 */
export const mapDispatchFromBackend = (backendDispatch) => {
    if (!backendDispatch) return null;
    return convertKeysToSnake(backendDispatch);
};

/**
 * Map frontend Dispatch to backend format
 */
export const mapDispatchToBackend = (frontendDispatch) => {
    if (!frontendDispatch) return null;
    return convertKeysToCamel(frontendDispatch);
};

/**
 * Map array of backend Dispatches to frontend format
 */
export const mapDispatchesFromBackend = (backendDispatches) => {
    if (!Array.isArray(backendDispatches)) return [];
    return backendDispatches.map(mapDispatchFromBackend);
};

// ============= Dispatch ITEM MAPPERS =============

/**
 * Map backend Dispatch Item to frontend format
 */
export const mapDispatchItemFromBackend = (backendDispatchItem) => {
    if (!backendDispatchItem) return null;
    return convertKeysToSnake(backendDispatchItem);
};

/**
 * Map frontend Dispatch Item to backend format
 */
export const mapDispatchItemToBackend = (frontendDispatchItem) => {
    if (!frontendDispatchItem) return null;
    return convertKeysToCamel(frontendDispatchItem);
};

/**
 * Map array of backend Dispatch Items to frontend format
 */
export const mapDispatchItemsFromBackend = (backendDispatchItems) => {
    if (!Array.isArray(backendDispatchItems)) return [];
    return backendDispatchItems.map(mapDispatchItemFromBackend);
};

// ============= BRANCH MAPPERS =============

/**
 * Map backend branch to frontend format
 */
export const mapBranchFromBackend = (backendBranch) => {
    if (!backendBranch) return null;
    return convertKeysToSnake(backendBranch);
};

/**
 * Map frontend branch to backend format
 */
export const mapBranchToBackend = (frontendBranch) => {
    if (!frontendBranch) return null;
    return convertKeysToCamel(frontendBranch);
};

/**
 * Map array of backend branches to frontend format
 */
export const mapBranchesFromBackend = (backendBranches) => {
    if (!Array.isArray(backendBranches)) return [];
    return backendBranches.map(mapBranchFromBackend);
};

// ============= GENERIC MAPPERS =============

/**
 * Generic mapper for any entity from backend to frontend
 */
export const mapFromBackend = (backendData) => {
    if (!backendData) return null;
    return convertKeysToSnake(backendData);
};

/**
 * Generic mapper for any entity from frontend to backend
 */
export const mapToBackend = (frontendData) => {
    if (!frontendData) return null;
    return convertKeysToCamel(frontendData);
};

/**
 * Generic mapper for arrays from backend to frontend
 */
export const mapArrayFromBackend = (backendArray) => {
    if (!Array.isArray(backendArray)) return [];
    return backendArray.map(convertKeysToSnake);
};

export default {
    // Product mappers
    mapProductFromBackend,
    mapProductToBackend,
    mapProductsFromBackend,

    // Category mappers
    mapCategoryFromBackend,
    mapCategoryToBackend,
    mapCategoriesFromBackend,

    // Subcategory mappers
    mapSubCategoryFromBackend,
    mapSubCategoryToBackend,
    mapSubCategoriesFromBackend,

    // Brand mappers
    mapBrandFromBackend,
    mapBrandToBackend,
    mapBrandsFromBackend,

    // Supplier mappers
    mapSupplierFromBackend,
    mapSupplierToBackend,
    mapSuppliersFromBackend,

    // Batch mappers
    mapBatchFromBackend,
    mapBatchToBackend,
    mapBatchesFromBackend,

    // Adjustment mappers
    mapAdjustmentFromBackend,
    mapAdjustmentToBackend,
    mapAdjustmentsFromBackend,

    // Transfer mappers
    mapTransferFromBackend,
    mapTransferToBackend,
    mapTransfersFromBackend,

    // Damage mappers
    mapDamageFromBackend,
    mapDamageToBackend,
    mapDamagesFromBackend,

    // Dispatch mappers
    mapDispatchFromBackend,
    mapDispatchToBackend,
    mapDispatchesFromBackend,
    mapDispatchItemFromBackend,
    mapDispatchItemToBackend,
    mapDispatchItemsFromBackend,

    // Generic mappers
    mapFromBackend,
    mapToBackend,
    mapArrayFromBackend,

    // Branch Mappers
    mapBranchFromBackend: mapFromBackend,
    mapBranchToBackend: mapToBackend,
    mapBranchesFromBackend: mapArrayFromBackend
};

