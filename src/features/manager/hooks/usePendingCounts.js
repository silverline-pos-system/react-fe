import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApprovals, usePendingUserRegistrations, usePendingPOs } from './managerQueries';

/**
 * Pending approval / PO / registration badge counts for the manager UI.
 *
 * Composes the shared canonical queries so these counts are cached and deduped with every other
 * consumer (the dashboard KPI, the approvals page, etc.) - one request and one 30s poll for all.
 * Replaces the sidebar's old hand-rolled setInterval + manual state.
 */
export function usePendingCounts() {
  const queryClient = useQueryClient();
  const pollOptions = { refetchInterval: 30_000 };

  const registrations = usePendingUserRegistrations(pollOptions);
  const approvals = useApprovals('PENDING', pollOptions);
  const pos = usePendingPOs(pollOptions);

  // Preserve the imperative refresh trigger fired after an approval action.
  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'approvals'] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'userRegistrations'] });
      queryClient.invalidateQueries({ queryKey: ['procurement', 'pendingPOs'] });
    };
    window.addEventListener('refresh-approval-count', handler);
    return () => window.removeEventListener('refresh-approval-count', handler);
  }, [queryClient]);

  const cashierPendingCount = (approvals.data || []).filter(
    (item) => item.category !== 'USER_REGISTRATION',
  ).length;

  return {
    pendingCount: (registrations.data || []).length,
    cashierPendingCount,
    inventoryPendingCount: (pos.data || []).length,
  };
}

export default usePendingCounts;
