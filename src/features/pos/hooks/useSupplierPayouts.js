import { useCallback, useEffect, useState } from 'react';
import { poService } from '@/features/procurement/services/poService';
import { getApprovals } from '@/features/manager/services/managerService';
import { printPayInOutReceipt } from '@/features/pos/utils/receiptPrinter';

/**
 * Supplier-payment / approved-payout notifications shown on the POS screen. This is a self-contained
 * feature separate from the sale/checkout flow, so it is extracted from POSScreen. Behavior is
 * unchanged: same polling, same processed-id persistence, same receipt printing.
 *
 * Returns values with the same names POSScreen used, so the JSX is untouched.
 */
export function useSupplierPayouts({ session, branchInfo, addNotification }) {
  const [supplierPaymentCount, setSupplierPaymentCount] = useState(0);
  const [approvedPayouts, setApprovedPayouts] = useState([]);
  const [rejectedPayouts, setRejectedPayouts] = useState([]);
  const [processingPayoutId, setProcessingPayoutId] = useState(null);
  const [processedPayoutIds, setProcessedPayoutIds] = useState(() => {
    try {
      const raw = localStorage.getItem('pos_processed_paid_out');
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set();
    }
  });

  const fetchSupplierPaymentCount = useCallback(async () => {
    try {
      const res = await poService.getPOsByStatus('TRANSFERRED_TO_CASHIER');
      const rawData = res.data?.data || res.data || [];
      let poList = [];
      if (Array.isArray(rawData)) {
        poList = rawData;
      } else if (rawData.content && Array.isArray(rawData.content)) {
        poList = rawData.content;
      } else if (rawData.data && Array.isArray(rawData.data)) {
        poList = rawData.data;
      } else if (rawData.data?.content && Array.isArray(rawData.data.content)) {
        poList = rawData.data.content;
      }
      setSupplierPaymentCount(poList.length);
    } catch (err) {
      if (err?.response?.status !== 403) {
        console.error('Failed to fetch supplier payment count:', err);
      }
    }
  }, []);

  useEffect(() => {
    fetchSupplierPaymentCount();
    const interval = setInterval(() => {
      fetchSupplierPaymentCount();
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [fetchSupplierPaymentCount]);

  const getApprovalRows = useCallback((payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload?.rows)) return payload.rows;
    return [];
  }, []);

  const isApprovedPaidOutApproval = useCallback((row) => {
    const status = String(row?.status || '').toUpperCase();
    const category = String(row?.category || '').toUpperCase();
    const type = String(row?.type || row?.flowType || '').toUpperCase();
    const text = `${row?.reason || ''} ${row?.description || ''} ${row?.notes || ''}`.toUpperCase();
    const isPaidOutLike =
      category.includes('PAID_OUT') ||
      category.includes('CASH_FLOW_PAID_OUT') ||
      type.includes('PAID_OUT') ||
      text.includes('PAID_OUT') ||
      text.includes('PAYOUT') ||
      text.includes('CASH OUT') ||
      text.includes('CASH_OUT');
    return status === 'APPROVED' && isPaidOutLike;
  }, []);

  const isRejectedPaidOutApproval = useCallback((row) => {
    const status = String(row?.status || '').toUpperCase();
    const category = String(row?.category || '').toUpperCase();
    const type = String(row?.type || row?.flowType || '').toUpperCase();
    const text = `${row?.reason || ''} ${row?.description || ''} ${row?.notes || ''}`.toUpperCase();
    const isPaidOutLike =
      category.includes('PAID_OUT') ||
      category.includes('CASH_FLOW_PAID_OUT') ||
      type.includes('PAID_OUT') ||
      text.includes('PAID_OUT') ||
      text.includes('PAYOUT') ||
      text.includes('CASH OUT') ||
      text.includes('CASH_OUT');
    return status === 'REJECTED' && isPaidOutLike;
  }, []);

  const fetchApprovedPayouts = useCallback(async () => {
    try {
      const response = await getApprovals();
      const rows = getApprovalRows(response);
      const list = rows.filter(isApprovedPaidOutApproval);
      setApprovedPayouts(list.filter((r) => !processedPayoutIds.has(r.id)));
      const rejectedList = rows.filter(isRejectedPaidOutApproval);
      setRejectedPayouts(rejectedList);
    } catch (err) {
      if (err?.response?.status !== 403) {
        console.error('Failed to fetch approved payouts:', err);
      }
    }
  }, [getApprovalRows, isApprovedPaidOutApproval, isRejectedPaidOutApproval, processedPayoutIds]);

  useEffect(() => {
    fetchApprovedPayouts();
    const interval = setInterval(fetchApprovedPayouts, 60000);
    return () => clearInterval(interval);
  }, [fetchApprovedPayouts]);

  const handleProcessApprovedPayout = async (row) => {
    try {
      setProcessingPayoutId(row.id);
      const amount = Number(row.amount || 0);
      const reasonText = String(row.reason || row.description || row.notes || 'Approved payout').replace(/\[TAKEN_BY_MANAGER\]\s*/gi, '').trim();

      await printPayInOutReceipt({
        type: 'PAID_OUT',
        amount,
        reason: reasonText,
        referenceNo: row.referenceNo || row.id,
        cashierName: session.cashier,
        branchInfo,
      });

      setProcessedPayoutIds((prev) => {
        const next = new Set(prev);
        next.add(row.id);
        localStorage.setItem('pos_processed_paid_out', JSON.stringify(Array.from(next)));
        return next;
      });

      setApprovedPayouts((prev) => prev.filter((item) => item.id !== row.id));
      addNotification('success', 'Payout Completed', `Paid-out receipt printed for approval #${row.id}.`);
    } catch (err) {
      console.error('Failed to process approved payout:', err);
      addNotification('error', 'Payout Failed', err?.message || 'Failed to print payout receipt.');
    } finally {
      setProcessingPayoutId(null);
    }
  };

  return {
    supplierPaymentCount,
    approvedPayouts,
    rejectedPayouts,
    processingPayoutId,
    handleProcessApprovedPayout,
    fetchSupplierPaymentCount,
  };
}

export default useSupplierPayouts;
