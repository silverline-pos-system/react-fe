import React, { useRef, useEffect, useMemo, useState } from 'react';
import { ShoppingCart, X, Crown, Percent, Tag, Receipt, Smartphone } from 'lucide-react';

export default function BillPanel({ cart, customer, onItemClick, onDetachCustomer, totals, editingIndex, selectedIndex, onQuantityCommit, onQuantityCancel, billDiscount = 0 }) {
  const scrollRef = useRef(null);
  const qtyInputRef = useRef(null);
  const [editingValue, setEditingValue] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [cart]);

  useEffect(() => {
    if (editingIndex === null || editingIndex === undefined) return;
    const currentItem = cart[editingIndex];
    if (currentItem) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditingValue(String(currentItem.qty ?? 1));
      requestAnimationFrame(() => {
        const input = qtyInputRef.current;
        if (input) {
          input.focus();
          input.select();
        }
      });
    }
  }, [editingIndex, cart]);

  // Calculate totals if not provided - matches sale_items table structure
  const calculatedTotals = useMemo(() => {
    if (totals) return totals;

    let grossTotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;
    let totalQty = 0;

    cart.forEach(item => {
      const qty = item.qty || 1;
      const price = parseFloat(item.price) || 0;
      const discount = parseFloat(item.discount) || 0;

      const lineGross = price * qty;
      const lineDiscount = discount * qty;

      grossTotal += lineGross;
      discountAmount += lineDiscount;
      totalQty += qty;
    });

    // Tax/VAT removed: no tax is applied to sales.
    taxAmount = 0;

    return {
      grossTotal,
      discountAmount: discountAmount + billDiscount, // Include bill-level discount
      itemDiscountAmount: discountAmount,
      billDiscountAmount: billDiscount,
      taxAmount,
      netTotal: grossTotal - discountAmount - billDiscount,
      itemCount: cart.length,
      totalQty
    };
  }, [cart, totals, billDiscount]);

  // Format currency
  const formatCurrency = (amount) => {
    const numeric = Number(amount ?? 0);
    const safeValue = Number.isFinite(numeric) ? numeric : 0;
    return safeValue.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Calculate line total for display
  const getLineTotal = (item) => {
    const qty = item.qty || 1;
    const price = parseFloat(item.price) || 0;
    const discount = parseFloat(item.discount) || 0;
    return (price * qty) - (discount * qty);
  };

  return (
    <div className="w-4/12 bg-white flex flex-col border-r border-slate-300 shadow-xl z-20 h-full">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 p-2 flex justify-between items-center shrink-0">
        <div className="text-xs font-bold text-slate-600 uppercase flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-slate-400" /> Current Bill
          {billDiscount > 0 && (
            <span className="bg-yellow-100 border border-yellow-300 text-yellow-700 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
              <Percent className="w-2.5 h-2.5" />
              -{formatCurrency(billDiscount)}
            </span>
          )}
        </div>
        {customer && (
          <div className="bg-purple-100 border border-purple-200 rounded px-2 py-0.5 flex items-center gap-1.5">
            <Crown className="w-3 h-3 text-purple-600" />
            <span className="text-[10px] font-bold text-purple-800 uppercase truncate max-w-[100px]">{customer.name}</span>
            {customer.loyaltyPoints > 0 && (
              <span className="text-[9px] font-mono text-purple-600 bg-purple-50 px-1 rounded">
                {Number(customer.loyaltyPoints || 0).toLocaleString()} pts
              </span>
            )}
            <button onClick={onDetachCustomer} className="ml-1 text-purple-400 hover:text-red-500 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Column Headers */}
      <div className="bg-slate-50 border-b border-slate-200 px-3 pb-2 grid grid-cols-12 gap-1 text-[10px] font-bold text-slate-600 uppercase tracking-wider shrink-0">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-4">Description</div>
        <div className="col-span-2 text-center">Qty</div>
        <div className="col-span-2 text-right">Price</div>
        <div className="col-span-3 text-right">Amount</div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-0 bg-white relative custom-scroll" ref={scrollRef}>
        {cart.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 opacity-40 pointer-events-none">
            <Receipt className="w-16 h-16 mb-3" />
            <span className="text-lg font-bold uppercase">Ready to Scan</span>
            <span className="text-xs mt-1">Scan barcode or enter item code</span>
          </div>
        ) : (
          cart.map((item, index) => {
            const isReturnItem = item.isReturn || item.qty < 0;
            return (
              <div
                key={index}
                onClick={() => onItemClick(index)}
                className={`grid grid-cols-12 gap-1 px-3 py-2.5 border-b text-sm items-start cursor-pointer group transition-colors ${isReturnItem
                    ? 'bg-red-50 border-red-200 hover:bg-red-100'
                    : selectedIndex === index
                      ? 'bg-blue-100 ring-1 ring-blue-300 border-slate-100'
                      : 'hover:bg-blue-50 border-slate-100'
                  }`}
              >
                {/* Line Number */}
                <div className={`col-span-1 text-center font-mono text-xs pt-0.5 ${isReturnItem ? 'text-red-500 font-bold' : 'text-slate-400 group-hover:text-blue-500'}`}>
                  {isReturnItem ? '↩' : index + 1}
                </div>

                {/* Description with discount/tax indicators */}
                <div className="col-span-4">
                  <div className={`font-semibold truncate leading-tight ${isReturnItem ? 'text-red-700' : 'text-slate-800 group-hover:text-blue-700'}`}>
                    {item.name}
                  </div>
                  {/* Show IMEI/Serial if available */}
                  {item.serialNo && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Smartphone className="w-2.5 h-2.5 text-indigo-500" />
                      <span className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-tighter bg-indigo-50 px-1 rounded">
                        {item.serialNo}
                      </span>
                    </div>)}
                  {/* Show SKU if available */}
                  {!item.serialNo && item.sku && (
                    <div className="text-[9px] font-mono text-slate-400">{item.sku}</div>
                  )}
                  {/* Discount and Tax badges */}
                  <div className="flex items-center gap-1 mt-0.5">
                    {isReturnItem && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-red-600 bg-red-100 px-1 py-0.5 rounded">
                        RETURN
                      </span>
                    )}
                    {item.discount > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-orange-600 bg-orange-50 px-1 py-0.5 rounded">
                        <Percent className="w-2 h-2" />
                        -{formatCurrency(item.discount)}
                      </span>
                    )}
                    {item.taxRate > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-slate-500 bg-slate-100 px-1 py-0.5 rounded">
                        <Tag className="w-2 h-2" />
                        {item.taxRate}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Qty */}
                <div className="col-span-2 text-center pt-0.5">
                  {editingIndex === index && !isReturnItem ? (
                    <input
                      ref={qtyInputRef}
                      type="number"
                      min="1"
                      step="1"
                      value={editingValue}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          onQuantityCommit(index, editingValue);
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          onQuantityCancel?.();
                        }
                      }}
                      className="w-14 text-center bg-white border border-blue-400 rounded text-xs font-mono font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  ) : (
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${isReturnItem
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 group-hover:bg-blue-200 group-hover:text-blue-800 transition-colors'
                      }`}>
                      {item.qty}
                    </span>
                  )}
                </div>

                {/* Unit Price */}
                <div className={`col-span-2 text-right font-mono text-xs pt-0.5 ${isReturnItem ? 'text-red-500' : 'text-slate-600'}`}>
                  {formatCurrency(item.price)}
                </div>

                {/* Line Total */}
                <div className={`col-span-3 text-right font-mono font-bold pt-0.5 ${isReturnItem ? 'text-red-700' : 'text-slate-900 group-hover:text-blue-700'}`}>
                  {formatCurrency(getLineTotal(item))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Totals Footer */}
      <div className="bg-slate-900 text-white p-4 shrink-0 shadow-[0_-4px_8px_-1px_rgba(0,0,0,0.2)]">
        {/* Summary Row */}
        <div className="flex justify-between items-start mb-2 border-b border-slate-700 pb-2">
          <div className="text-left">
            <span className="text-slate-400 text-xs font-medium block">Items</span>
            <span className="text-white font-mono font-bold text-lg">{calculatedTotals.totalQty || cart.reduce((sum, item) => sum + item.qty, 0)}</span>
          </div>
          <div className="text-right space-y-0.5">
            {/* Subtotal */}
            <div className="flex justify-between gap-4 text-xs">
              <span className="text-slate-400">Subtotal:</span>
              <span className="font-mono text-slate-300">{formatCurrency(calculatedTotals.grossTotal)}</span>
            </div>
            {/* Item Discounts (if any) */}
            {(calculatedTotals.itemDiscountAmount || 0) > 0 && (
              <div className="flex justify-between gap-4 text-xs">
                <span className="text-orange-400">Item Disc:</span>
                <span className="font-mono text-orange-400">-{formatCurrency(calculatedTotals.itemDiscountAmount)}</span>
              </div>
            )}
            {/* Bill Discount (if any) */}
            {(calculatedTotals.billDiscountAmount || 0) > 0 && (
              <div className="flex justify-between gap-4 text-xs">
                <span className="text-yellow-400">Bill Disc:</span>
                <span className="font-mono text-yellow-400">-{formatCurrency(calculatedTotals.billDiscountAmount)}</span>
              </div>
            )}
            {/* Tax (if any) */}
            {calculatedTotals.taxAmount > 0 && (
              <div className="flex justify-between gap-4 text-xs">
                <span className="text-slate-400">Tax:</span>
                <span className="font-mono text-slate-300">+{formatCurrency(calculatedTotals.taxAmount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Grand Total */}
        <div className="bg-slate-800 rounded-lg px-3 py-3 flex justify-between items-center border border-slate-600">
          <div>
            <span className="text-xl font-bold tracking-tight text-white">TOTAL</span>
            <span className="text-[10px] text-slate-400 block uppercase">LKR</span>
          </div>
          <span className="text-4xl font-bold font-mono text-green-400">
            {formatCurrency(calculatedTotals.netTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
