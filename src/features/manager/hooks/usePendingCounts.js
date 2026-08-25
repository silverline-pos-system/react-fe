import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserRegistrations, getApprovals } from '../services/managerService';
import { poService } from '@/features/procurement/services/poService';

const EMPTY = { pendingCount: 0, cashierPendingCount: 0, inventoryPendingCount: 0 };

async function fetchPendingCounts() {
  const [userData, approvalData, poRes] = await Promise.all([
    getUserRegistrations('PENDING').catch(() => []),
    getApprovals('PENDING').catch(() => []),
    poService.getPendingPOs().catch(() => ({ data: [] })),
  ]);

  const pendingCount = Array.isArray(userData) ? userData.length : 0;

  const cashierPendingCount = Array.isArray(approvalData)
    ? approvalData.filter((item) => item.category !== 'USER_REGISTRATION').length
    : 0;

  const poRaw = poRes?.data?.data || poRes?.data || [];
  let poList = [];
  if (Array.isArray(poRaw)) poList = poRaw;
  else if (Array.isArray(poRaw.content)) poList = poRaw.content;
  else if (Array.isArray(poRaw.data)) poList = poRaw.data;
  else if (Array.isArray(poRaw.data?.content)) poList = poRaw.data.content;

  return { pendingCount, cashierPendingCount, inventoryPendingCount: poList.length };
}

/**
 * Pending approval / PO badge counts for the manager UI.
 *
 * Backed by React Query so every component that needs these counts shares ONE cached, deduped
 * request and ONE background poll (previously each poller hit the API independently). Replaces
 * the hand-rolled setInterval + manual state in the sidebar.
 */
export function usePendingCounts() {
  const { data, refetch } = useQuery({
    queryKey: ['manager', 'pendingCounts'],
    queryFn: fetchPendingCounts,
    refetchInterval: 30_000,
    initialData: EMPTY,
  });

  // Preserve the existing imperative refresh trigger (fired after an approval action).
  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('refresh-approval-count', handler);
    return () => window.removeEventListener('refresh-approval-count', handler);
  }, [refetch]);

  return data ?? EMPTY;
}

export default usePendingCounts;
