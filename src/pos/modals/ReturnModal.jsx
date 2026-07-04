import React, { useState, useMemo } from 'react';
import useEscapeClose from '../../hooks/useEscapeClose';
import { RotateCcw, X, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { posService } from '../../services/posService';

export default function ReturnModal({ sale, branchId, onClose, onNotify }) {
    useEscapeClose(onClose);
    const [returnItems, setReturnItems] = useState({});
    const [reason, setReason] = useState("");
    const [processing, setProcessing] = useState(false);
    const [supUser, setSupUser] = useState("");
    const [supPass, setSupPass] = useState("");

    // Initialize return items map based on sale items
    // We only include items that can be returned (qty > 0)
    // In a real app, we'd check if they were already returned.

    const toggleItem = (item, isSelected) => {
        setReturnItems(prev => {
            const next = { ...prev };
            if (isSelected) {
                // Default to returning 1 or 0? Default max?
                next[item.productId] = {
                    ...item,
                    returnQty: 1
                };
            } else {
                delete next[item.productId];
            }
            return next;
        });
    };

    const updateQty = (productId, qty) => {
        setReturnItems(prev => {
            if (!prev[productId]) return prev;

            const originalItem = sale.items.find(i => (i.productId || i.id) === productId);
            const max = originalItem ? originalItem.qty : 0;

            // clamping
            const newQty = Math.max(1, Math.min(qty, max));

            return {
                ...prev,
                [productId]: {
                    ...prev[productId],
                    returnQty: newQty
                }
            };
        });
    };

    const totalRefund = useMemo(() => {
        return Object.values(returnItems).reduce((sum, item) => {
            const unitPrice = item.unitPrice || item.price || 0;
            // Subtract proportional discount if simple; logic depends on complexity
            // Here assume unitPrice is net of per-unit discount or calculate?
            // sale.items has discount info. 
            // item.unitPrice usually is the price SOLD at.
            // Adjust for line discount?
            // Simple: unitPrice * qty
            return sum + (unitPrice * item.returnQty);
        }, 0);
    }, [returnItems]);

    const handleProcessReturn = async () => {
        if (Object.keys(returnItems).length === 0) {
            onNotify('error', 'No Items', 'Select items to return');
            return;
        }
        if (!reason.trim()) {
            onNotify('error', 'Reason Required', 'Enter a reason for return');
            return;
        }

        setProcessing(true);
        try {
            // Construct payload
            const itemsToReturn = Object.values(returnItems).map(i => ({
                saleItemId: i.saleItemId,
                productId: i.productId,
                qty: i.returnQty,
                unitPrice: i.unitPrice,
                condition: 'GOOD' // Default
            }));

            const payload = {
                saleId: sale.id || sale.saleId,
                branchId: branchId,
                items: itemsToReturn,
                reason: reason,
                refundMethod: 'CASH', // Default to CASH for now
                supervisorUsername: supUser,
                supervisorPassword: supPass
            };

            await posService.processReturn(payload);

            onNotify('success', 'Return Processed', `Refund: LKR ${totalRefund.toFixed(2)}`);
            onClose();
        } catch (err) {
            console.error(err);
            onNotify('error', 'Return Failed', err.response?.data?.message || 'Failed to process return');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-[800px] h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-b border-slate-200">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <RotateCcw className="w-6 h-6 text-rose-600" />
                            Process Return
                        </h2>
                        <div className="text-sm text-slate-500 mt-1">
                            Invoice: <span className="font-mono font-bold text-slate-700">{sale.invoiceNo}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Item Selection */}
                    <div className="w-2/3 p-6 flex flex-col gap-4 overflow-hidden">
                        <h3 className="text-sm font-bold text-slate-500 uppercase">Select Items</h3>
                        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 p-2 custom-scroll">
                            {sale.items.map((item, idx) => {
                                const isSelected = !!returnItems[item.productId || item.id];
                                const currentReturnQty = isSelected ? returnItems[item.productId || item.id].returnQty : 0;

                                return (
                                    <div key={idx} className={`p-3 mb-2 rounded-lg border flex items-center gap-3 transition-colors ${isSelected ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200 hover:border-slate-300'
                                        }`}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => toggleItem(item, e.target.checked)}
                                            className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                                        />

                                        <div className="flex-1">
                                            <div className="font-bold text-slate-800 text-sm truncate">{item.productName || item.name}</div>
                                            <div className="text-xs text-slate-500">
                                                Sold at: {Number(item.unitPrice).toLocaleString()} | Qty: {item.qty}
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div className="flex items-center gap-2 bg-white rounded-lg border border-rose-200 px-2 py-1">
                                                <button
                                                    onClick={() => updateQty(item.productId, currentReturnQty - 1)}
                                                    className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-bold"
                                                >-</button>
                                                <span className="w-8 text-center font-bold text-rose-700">{currentReturnQty}</span>
                                                <button
                                                    onClick={() => updateQty(item.productId, currentReturnQty + 1)}
                                                    className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-bold"
                                                >+</button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Summary & Action */}
                    <div className="w-1/3 bg-slate-50 border-l border-slate-200 p-6 flex flex-col gap-6">
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Refund Summary</h3>
                            <div className="bg-white border border-slate-200 rounded-xl p-4">
                                <div className="flex justify-between items-center mb-2 text-sm text-slate-500">
                                    <span>Items Returning</span>
                                    <span className="font-bold text-slate-700">{Object.keys(returnItems).length}</span>
                                </div>
                                <div className="border-t border-dashed border-slate-200 my-2"></div>
                                <div className="flex justify-between items-center text-lg font-bold text-rose-600">
                                    <span>Refund Total</span>
                                    <span className="font-mono">LKR {totalRefund.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Reason</h3>
                            <textarea
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                className="w-full h-24 p-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-rose-500 resize-none"
                                placeholder="Defective, Wrong Item, etc."
                            ></textarea>
                        </div>

                        {/* Supervisor Approval */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Supervisor Approval</h3>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={supUser}
                                    onChange={e => setSupUser(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500"
                                    placeholder="Supervisor Username"
                                />
                                <input
                                    type="password"
                                    value={supPass}
                                    onChange={e => setSupPass(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500"
                                    placeholder="Supervisor Password"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleProcessReturn}
                            disabled={processing || Object.keys(returnItems).length === 0 || !supUser || !supPass}
                            className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {processing ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                            ) : (
                                <><CheckCircle className="w-5 h-5" /> Confirm Refund</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>

    );
}
