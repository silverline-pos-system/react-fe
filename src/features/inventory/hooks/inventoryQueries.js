import { useQuery } from '@tanstack/react-query';
import inventoryService from '@/features/inventory/services/inventoryService';

/**
 * Cached inventory reference-data queries. These lists were previously fetched on every mount of
 * InventorySystem and held in local state. Moving them to React Query caches them (they rarely
 * change) and lets CRUD handlers invalidate a single source of truth.
 *
 * Migrated incrementally, safest (read-only) entities first.
 */

export function useInventoryBranches(options = {}) {
  return useQuery({
    queryKey: ['inventory', 'branches'],
    queryFn: () => inventoryService.getBranches().catch(() => []),
    staleTime: 5 * 60_000, // branches rarely change during a session
    ...options,
  });
}
