const camelToSnake = (str) => {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

const snakeToCamel = (str) => {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

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

export const mapProductToBackend = (frontendProduct) => {
    if (!frontendProduct) return null;
    return convertKeysToCamel(frontendProduct);
};

export const mapProductsFromBackend = (backendProducts) => {
    if (!Array.isArray(backendProducts)) return [];
    return backendProducts.map(mapProductFromBackend);
};

// ============= SUBCATEGORY MAPPERS =============

export const mapSubCategoryFromBackend = (backendSubCategory) => {
    if (!backendSubCategory) return null;
    return convertKeysToSnake(backendSubCategory);
};

export const mapSubCategoryToBackend = (frontendSubCategory) => {
    if (!frontendSubCategory) return null;
    return convertKeysToCamel(frontendSubCategory);
};

export const mapSubCategoriesFromBackend = (backendSubCategories) => {
    if (!Array.isArray(backendSubCategories)) return [];
    return backendSubCategories.map(mapSubCategoryFromBackend);
};

// ============= CATEGORY MAPPERS =============

export const mapCategoryFromBackend = (backendCategory) => {
    if (!backendCategory) return null;
    const mapped = convertKeysToSnake(backendCategory);
    return {
        ...mapped,
        icon: mapped.icon || 'Tag',
        color: mapped.color || 'blue'
    };
};

export const mapCategoryToBackend = (frontendCategory) => {
    if (!frontendCategory) return null;
    return convertKeysToCamel(frontendCategory);
};

export const mapCategoriesFromBackend = (backendCategories) => {
    if (!Array.isArray(backendCategories)) return [];
    return backendCategories.map(mapCategoryFromBackend);
};

// ============= BRAND MAPPERS =============

export const mapBrandFromBackend = (backendBrand) => {
    if (!backendBrand) return null;
    return convertKeysToSnake(backendBrand);
};

export const mapBrandToBackend = (frontendBrand) => {
    if (!frontendBrand) return null;
    return convertKeysToCamel(frontendBrand);
};

export const mapBrandsFromBackend = (backendBrands) => {
    if (!Array.isArray(backendBrands)) return [];
    return backendBrands.map(mapBrandFromBackend);
};

// ============= SUPPLIER MAPPERS =============

export const mapSupplierFromBackend = (backendSupplier) => {
    if (!backendSupplier) return null;
    return convertKeysToSnake(backendSupplier);
};

export const mapSupplierToBackend = (frontendSupplier) => {
    if (!frontendSupplier) return null;
    return convertKeysToCamel(frontendSupplier);
};

export const mapSuppliersFromBackend = (backendSuppliers) => {
    if (!Array.isArray(backendSuppliers)) return [];
    return backendSuppliers.map(mapSupplierFromBackend);
};

// ============= STOCK/BATCH MAPPERS =============

export const mapBatchFromBackend = (backendBatch) => {
    if (!backendBatch) return null;
    return convertKeysToSnake(backendBatch);
};

export const mapBatchToBackend = (frontendBatch) => {
    if (!frontendBatch) return null;
    return convertKeysToCamel(frontendBatch);
};

export const mapBatchesFromBackend = (backendBatches) => {
    if (!Array.isArray(backendBatches)) return [];
    return backendBatches.map(mapBatchFromBackend);
};

// ============= STOCK ADJUSTMENT MAPPERS =============

export const mapAdjustmentFromBackend = (backendAdjustment) => {
    if (!backendAdjustment) return null;
    return convertKeysToSnake(backendAdjustment);
};

export const mapAdjustmentToBackend = (frontendAdjustment) => {
    if (!frontendAdjustment) return null;
    return convertKeysToCamel(frontendAdjustment);
};

export const mapAdjustmentsFromBackend = (backendAdjustments) => {
    if (!Array.isArray(backendAdjustments)) return [];
    return backendAdjustments.map(mapAdjustmentFromBackend);
};

// ============= STOCK TRANSFER MAPPERS =============

export const mapTransferFromBackend = (backendTransfer) => {
    if (!backendTransfer) return null;
    return convertKeysToSnake(backendTransfer);
};

export const mapTransferToBackend = (frontendTransfer) => {
    if (!frontendTransfer) return null;
    return convertKeysToCamel(frontendTransfer);
};

export const mapTransfersFromBackend = (backendTransfers) => {
    if (!Array.isArray(backendTransfers)) return [];
    return backendTransfers.map(mapTransferFromBackend);
};

// ============= DAMAGE ENTRY MAPPERS =============

export const mapDamageFromBackend = (backendDamage) => {
    if (!backendDamage) return null;
    return convertKeysToSnake(backendDamage);
};

export const mapDamageToBackend = (frontendDamage) => {
    if (!frontendDamage) return null;
    return convertKeysToCamel(frontendDamage);
};

export const mapDamagesFromBackend = (backendDamages) => {
    if (!Array.isArray(backendDamages)) return [];
    return backendDamages.map(mapDamageFromBackend);
};

// ============= Dispatch MAPPERS =============

export const mapDispatchFromBackend = (backendDispatch) => {
    if (!backendDispatch) return null;
    return convertKeysToSnake(backendDispatch);
};

export const mapDispatchToBackend = (frontendDispatch) => {
    if (!frontendDispatch) return null;
    return convertKeysToCamel(frontendDispatch);
};

export const mapDispatchesFromBackend = (backendDispatches) => {
    if (!Array.isArray(backendDispatches)) return [];
    return backendDispatches.map(mapDispatchFromBackend);
};

// ============= Dispatch ITEM MAPPERS =============

export const mapDispatchItemFromBackend = (backendDispatchItem) => {
    if (!backendDispatchItem) return null;
    return convertKeysToSnake(backendDispatchItem);
};

export const mapDispatchItemToBackend = (frontendDispatchItem) => {
    if (!frontendDispatchItem) return null;
    return convertKeysToCamel(frontendDispatchItem);
};

export const mapDispatchItemsFromBackend = (backendDispatchItems) => {
    if (!Array.isArray(backendDispatchItems)) return [];
    return backendDispatchItems.map(mapDispatchItemFromBackend);
};

// ============= BRANCH MAPPERS =============

export const mapBranchFromBackend = (backendBranch) => {
    if (!backendBranch) return null;
    return convertKeysToSnake(backendBranch);
};

export const mapBranchToBackend = (frontendBranch) => {
    if (!frontendBranch) return null;
    return convertKeysToCamel(frontendBranch);
};

export const mapBranchesFromBackend = (backendBranches) => {
    if (!Array.isArray(backendBranches)) return [];
    return backendBranches.map(mapBranchFromBackend);
};

// ============= GENERIC MAPPERS =============

export const mapFromBackend = (backendData) => {
    if (!backendData) return null;
    return convertKeysToSnake(backendData);
};

export const mapToBackend = (frontendData) => {
    if (!frontendData) return null;
    return convertKeysToCamel(frontendData);
};

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
