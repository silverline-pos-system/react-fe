/**
 * Pure builder for the sale/order payload sent to the backend at checkout.
 *
 * Extracted from POSScreen.processPayment so the money-relevant payload construction (totals,
 * line items, payments, service detection) is isolated and unit-testable. The submit call and all
 * post-sale side effects (loyalty, receipt, shift overlay, reset) stay in the component.
 *
 * Note: the backend is authoritative on price; unitPrice here is what the POS displayed. Tax is 0
 * (VAT removed): net = gross - item discounts - bill discount.
 *
 * @returns {{ orderData: object, netTotal: number, isServiceOnly: boolean,
 *             serviceTypeTotals: {dtv:number, repair:number, reload:number} }}
 */
export function buildSaleOrder(cart, billDiscount, ctx, paymentDetails) {
  const grossTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const itemDiscount = cart.reduce((sum, item) => sum + ((item.discount || 0) * item.qty), 0);
  const totalDiscount = itemDiscount + billDiscount;
  const taxAmount = 0; // Tax/VAT removed: no tax is applied to sales.
  const netTotal = grossTotal - totalDiscount;

  const productItems = cart.filter(item => !item.isService && !item.dtvData && !item.repairData && !item.isReturn);
  const mappedItems = productItems.map(item => ({
    productId: item.id,
    serialId: item.serialId || null,
    batchId: item.batchId || null,
    qty: item.qty,
    unitPrice: item.price,
    discount: item.discount || 0,
  }));

  const paymentList = paymentDetails.payments.map(p => ({
    paymentType: p.paymentType,
    amount: p.amount,
    referenceNo: p.referenceNo || null,
    bankName: p.bankName || null,
    cardLast4: p.cardLast4 || null,
  }));

  const hasServiceItems = cart.some(item => item.isService || item.dtvData || item.repairData);
  const isServiceOnly = mappedItems.length === 0 && hasServiceItems;

  const serviceTypeTotals = cart.reduce((acc, item) => {
    const line = Number(item.price || 0) * Number(item.qty || 1);
    if (item.dtvData) acc.dtv += line;
    else if (item.repairData) acc.repair += line;
    else if (item.type === 'RELOAD') acc.reload += line;
    return acc;
  }, { dtv: 0, repair: 0, reload: 0 });

  const orderData = {
    saleId: ctx.currentSaleId,
    branchId: ctx.branchId,
    cashierId: ctx.session.userId,
    customerId: ctx.customer ? ctx.customer.customerId || ctx.customer.id : null,
    shiftId: ctx.session.shiftId,
    grossTotal,
    discount: totalDiscount,
    taxAmount,
    netTotal,
    paidAmount: paymentDetails.totalPaid,
    changeAmount: paymentDetails.changeAmount || 0,
    idempotencyKey: ctx.idempotencyKey,
    saleType: isServiceOnly ? "SERVICE" : "RETAIL",
    notes: isServiceOnly
      ? `Service payment: ${cart.map(i => i.repairData?.repairNo || i.dtvData?.refNo || (i.type === 'RELOAD' ? i.name : null) || (i.isService ? i.name : null)).filter(Boolean).join(', ')}`
      : "",
    items: mappedItems,
    payments: paymentList,
  };

  return { orderData, netTotal, isServiceOnly, serviceTypeTotals };
}

export default buildSaleOrder;
