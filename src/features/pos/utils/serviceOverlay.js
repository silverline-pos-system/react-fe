/**
 * Service-sales overlay: DTV/repair/reload service payments are tracked per shift in localStorage
 * and merged into the shift totals for display/reconciliation. These are pure helpers (localStorage
 * + arguments), extracted from POSScreen so the component body is not carrying them inline.
 */

const EMPTY_OVERLAY = {
  cashSales: 0,
  cardSales: 0,
  otherSales: 0,
  expectedCash: 0,
  totalSales: 0,
  transactionCount: 0,
  dtvSales: 0,
  repairSales: 0,
  reloadSales: 0,
};

export const getServiceOverlayKey = (shiftId) => `pos_service_overlay_shift_${shiftId}`;

export function getServiceOverlay(shiftId) {
  if (!shiftId) {
    return { ...EMPTY_OVERLAY };
  }
  try {
    const raw = localStorage.getItem(getServiceOverlayKey(shiftId));
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') throw new Error('invalid');
    return {
      cashSales: Number(parsed.cashSales || 0),
      cardSales: Number(parsed.cardSales || 0),
      otherSales: Number(parsed.otherSales || 0),
      expectedCash: Number(parsed.expectedCash || 0),
      totalSales: Number(parsed.totalSales || 0),
      transactionCount: Number(parsed.transactionCount || 0),
      dtvSales: Number(parsed.dtvSales || 0),
      repairSales: Number(parsed.repairSales || 0),
      reloadSales: Number(parsed.reloadSales || 0),
    };
  } catch {
    return { ...EMPTY_OVERLAY };
  }
}

export function mergeTotalsWithOverlay(baseTotals, shiftId) {
  const overlay = getServiceOverlay(shiftId);
  const base = baseTotals || {};
  return {
    ...base,
    cashSales: Number(base.cashSales || base.cashTotal || base.cashAmount || 0) + overlay.cashSales,
    cardSales: Number(base.cardSales || base.cardTotal || base.cardAmount || 0) + overlay.cardSales,
    cardTotal: Number(base.cardTotal || base.cardSales || base.cardAmount || 0) + overlay.cardSales,
    otherPayments: Number(base.otherPayments || base.otherTotal || base.qrTotal || base.qrSales || 0) + overlay.otherSales,
    totalSales: Number(base.totalSales || base.netTotal || base.netSales || 0) + overlay.totalSales,
    netTotal: Number(base.netTotal || base.totalSales || 0) + overlay.totalSales,
    transactionCount: Number(base.transactionCount || base.totalBills || base.totalTransactions || base.billCount || 0) + overlay.transactionCount,
    totalBills: Number(base.totalBills || base.transactionCount || base.totalTransactions || base.billCount || 0) + overlay.transactionCount,
    expectedCash: Number(base.expectedCash || base.expectedCashInDrawer || 0) + overlay.expectedCash,
    expectedCashInDrawer: Number(base.expectedCashInDrawer || base.expectedCash || 0) + overlay.expectedCash,
    serviceDtvSales: overlay.dtvSales,
    serviceRepairSales: overlay.repairSales,
    serviceReloadSales: overlay.reloadSales,
  };
}
