import { useEffect, useMemo, useState } from 'react';

/**
 * Cart state container for the POS screen: the line items, the bill-level discount, the selection
 * indices, and the derived totals. Extracted from POSScreen to isolate cart state from the large
 * handler/JSX body. The complex add/void handlers stay in POSScreen and use setCart from here.
 *
 * Totals math is unchanged (tax removed; net = gross - item discounts - bill discount).
 */
export function useCart() {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('pos_cart_draft');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [billDiscount, setBillDiscount] = useState(0); // Bill-level discount amount
  const [editingCartIndex, setEditingCartIndex] = useState(null);
  const [selectedCartIndex, setSelectedCartIndex] = useState(null);

  const cartTotals = useMemo(() => {
    const grossTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const itemDiscountAmount = cart.reduce((sum, item) => sum + ((item.discount || 0) * item.qty), 0);
    // Tax/VAT removed: no tax is applied to sales.
    const taxAmount = 0;
    const totalDiscount = itemDiscountAmount + billDiscount;
    const netTotal = grossTotal - totalDiscount;

    return {
      grossTotal,
      itemDiscountAmount,
      billDiscountAmount: billDiscount,
      totalDiscount,
      taxAmount,
      netTotal,
      itemCount: cart.length,
      totalQty: cart.reduce((sum, item) => sum + item.qty, 0),
    };
  }, [cart, billDiscount]);

  // Keep the selected row index within bounds when the cart changes.
  useEffect(() => {
    if (selectedCartIndex === null || selectedCartIndex === undefined) return;
    if (selectedCartIndex < 0 || selectedCartIndex >= cart.length) {
      setSelectedCartIndex(null);
    }
  }, [cart, selectedCartIndex]);

  return {
    cart,
    setCart,
    cartTotals,
    billDiscount,
    setBillDiscount,
    editingCartIndex,
    setEditingCartIndex,
    selectedCartIndex,
    setSelectedCartIndex,
  };
}

export default useCart;
