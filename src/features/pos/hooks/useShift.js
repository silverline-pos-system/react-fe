import { useState } from 'react';
import { posService } from '@/features/pos/services/posService';
import { mergeTotalsWithOverlay } from '@/features/pos/utils/serviceOverlay';

/**
 * Shift/session state for the POS screen: the current cash-shift session, its totals, and the
 * cashier summary. Extracted from POSScreen to isolate shift state from the large handler body.
 *
 * The complex lifecycle handlers (restore-on-mount, open/close shift, which are coupled to modal
 * state and receipt printing) stay in POSScreen and use setSession from here. This hook owns the
 * state and the shift-totals refresh. addNotification is injected.
 */
export function useShift({ addNotification }) {
  const [session, setSession] = useState({
    isOpen: false,
    cashier: '--',
    shiftId: null,
    userId: null,
  });
  const [shiftTotals, setShiftTotals] = useState(null);
  const [cashierSummary, setCashierSummary] = useState(null);
  const [cashierSummaryLoading, setCashierSummaryLoading] = useState(false);

  // Refresh shift totals from the backend, merged with the local service-sales overlay.
  const fetchShiftTotals = async () => {
    if (session.shiftId) {
      try {
        const res = await posService.getShiftTotals(session.shiftId);
        const data = res.data?.data || res.data || {};
        setShiftTotals(mergeTotalsWithOverlay(data, session.shiftId));
      } catch (e) {
        console.error('Failed to fetch shift totals:', e);
        addNotification('error', 'Sync Failed', 'Could not refresh shift totals.');
      }
    }
  };

  return {
    session,
    setSession,
    shiftTotals,
    setShiftTotals,
    cashierSummary,
    setCashierSummary,
    cashierSummaryLoading,
    setCashierSummaryLoading,
    fetchShiftTotals,
  };
}

export default useShift;
