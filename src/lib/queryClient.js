import { QueryClient } from '@tanstack/react-query';

/**
 * Shared React Query client for server state (data fetched from the backend).
 *
 * Defaults tuned for an internal POS/ERP:
 * - staleTime 30s: identical reads within 30s are served from cache and deduped (kills the
 *   "same data fetched by several components" request volume).
 * - refetchOnWindowFocus: refresh when the user returns to the tab so data does not go stale.
 * - retry once: tolerate a transient blip without hammering the API.
 *
 * Writes (create sale, adjust stock, etc.) do NOT go through this - they stay as direct service
 * calls / useMutation, so the money-write path is unaffected.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

export default queryClient;
