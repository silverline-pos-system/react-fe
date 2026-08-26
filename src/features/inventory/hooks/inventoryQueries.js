import { useQuery } from '@tanstack/react-query';
import inventoryService from '@/features/inventory/services/inventoryService';
import storeService from '@/features/inventory/services/storeService';

/**
 * Cached inventory reference-data queries. These lists were previously fetched on every mount of
 * InventorySystem and held in local state; CRUD handlers mutated that state optimistically.
 *
 * Now they are React Query's source of truth: components read from the query, and CRUD handlers
 * invalidate the relevant key (which refetches and re-applies the icon/color metadata merge). The
 * merge runs in queryFn so it happens once per fetch, matching the old mount-time enhancement.
 */

const REF_STALE_TIME = 5 * 60_000; // reference data changes rarely within a session

function mergeMetadata(list, metaKey, idKey, defaults) {
  let meta = {};
  try {
    meta = JSON.parse(localStorage.getItem(metaKey) || '{}');
  } catch {
    meta = {};
  }
  return (list || []).map((item) => ({
    ...item,
    icon: meta[item[idKey]]?.icon || item.icon || defaults.icon,
    color: meta[item[idKey]]?.color || item.color || defaults.color,
  }));
}

export function useInventoryBranches(options = {}) {
  return useQuery({
    queryKey: ['inventory', 'branches'],
    queryFn: () => inventoryService.getBranches().catch(() => []),
    staleTime: REF_STALE_TIME,
    ...options,
  });
}

export function useInventoryCategories(options = {}) {
  return useQuery({
    queryKey: ['inventory', 'categories'],
    queryFn: async () =>
      mergeMetadata(await inventoryService.getCategories(), 'category_metadata', 'category_id', { icon: 'Tag', color: 'blue' }),
    staleTime: REF_STALE_TIME,
    ...options,
  });
}

export function useInventoryBrands(options = {}) {
  return useQuery({
    queryKey: ['inventory', 'brands'],
    queryFn: async () =>
      mergeMetadata(await inventoryService.getBrands(), 'brand_metadata', 'brand_id', { icon: 'Archive', color: 'blue' }),
    staleTime: REF_STALE_TIME,
    ...options,
  });
}

export function useInventorySuppliers(options = {}) {
  return useQuery({
    queryKey: ['inventory', 'suppliers'],
    queryFn: () => inventoryService.getSuppliers(),
    staleTime: REF_STALE_TIME,
    ...options,
  });
}

export function useInventorySubCategories(options = {}) {
  return useQuery({
    queryKey: ['inventory', 'subcategories'],
    queryFn: () => inventoryService.getSubCategories(),
    staleTime: REF_STALE_TIME,
    ...options,
  });
}

export function useInventoryProducts(options = {}) {
  return useQuery({
    queryKey: ['inventory', 'products'],
    queryFn: () => inventoryService.getProducts(),
    ...options,
  });
}

export function useInventoryBatches(options = {}) {
  return useQuery({
    queryKey: ['inventory', 'batches'],
    queryFn: () => storeService.getBatches().catch(() => []),
    ...options,
  });
}
