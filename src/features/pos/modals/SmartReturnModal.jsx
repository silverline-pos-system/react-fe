import React, { useState, useEffect, useMemo, useRef } from 'react';
import useEscapeClose from '@/shared/hooks/useEscapeClose';
import {
    RotateCcw, X, Search, Clock, User, ShoppingCart, Receipt, AlertCircle,
    Loader2, CheckCircle, AlertTriangle, Package, CreditCard, Banknote,
    ChevronRight, ArrowLeft, Lock, ScanLine, Calendar
} from 'lucide-react';
import { posService } from '@/features/pos/services/posService';

const RETURN_CONDITIONS = [
    { value: 'GOOD', label: 'Good Condition', color: 'text-green-600 bg-green-50 border-green-200' },
    { value: 'DAMAGED', label: 'Damaged', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { value: 'DEFECTIVE', label: 'Defective', color: 'text-red-600 bg-red-50 border-red-200' },
    { value: 'WRONG_ITEM', label: 'Wrong Item', color: 'text-purple-600 bg-purple-50 border-purple-200' }
];

const RETURN_REASONS = [
    'Product Defective',
    'Wrong Item Delivered',
    'Customer Changed Mind',
    'Size/Color Mismatch',
    'Quality Issues',
    'Expired Product',
    'Price Dispute',
    'Other'
];

export default function SmartReturnModal({ branchId, onClose, onNotify, onReturnToCart }) {
    useEscapeClose(onClose);
    const [view, setView] = useState('search');
    const [searchTerm, setSearchTerm] = useState('');
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSale, setSelectedSale] = useState(null);
    const [returnItems, setReturnItems] = useState({});
    const [reason, setReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [supUser, setSupUser] = useState('');
    const [supPass, setSupPass] = useState('');
    const [refundMethod, setRefundMethod] = useState('CASH');
    const searchInputRef = useRef(null);

    useEffect(() => {
        fetchReturnableSales();
    }, [branchId]);

    useEffect(() => {
        if (view === 'search' && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [view]);

    const fetchReturnableSales = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await posService.getReturnableSales(7);
            const rawData = res.data?.data || res.data || [];

            const mappedSales = (Array.isArray(rawData) ? rawData : []).map(sale => ({
                ...sale,
                id: sale.saleId || sale.id,
                invoiceNo: sale.invoiceNo || `INV-${sale.saleId}`,
                saleDate: sale.saleDate || new Date().toISOString(),
                customerName: sale.customerName || 'Walk-in Customer',
                items: (sale.items || []).map(item => ({
                    ...item,
                    saleItemId: item.saleItemId || item.id,
                    productId: item.productId,
                    productName: item.productName || item.name || 'Unknown Product',
                    qty: item.quantity || item.qty || 1,
                    unitPrice: parseFloat(item.unitPrice || item.price || 0),
                    returnableQty: item.quantity || item.qty || 1,
                    alreadyReturned: item.returnedQty || 0
                }))
            }));

            setSales(mappedSales);
        } catch (err) {
            console.error('Failed to fetch returnable sales:', err);
            setError(err.response?.data?.message || 'Failed to load sales');
        } finally {
            setLoading(false);
        }
    };

    const handleInvoiceSearch = async () => {
        if (!searchTerm.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const res = await posService.getSaleForReturn(searchTerm.trim());
            const sale = res.data?.data || res.data;

            if (sale) {
                const mappedSale = {
                    ...sale,
                    id: sale.saleId || sale.id,
                    invoiceNo: sale.invoiceNo,
                    saleDate: sale.saleDate || new Date().toISOString(),
                    customerName: sale.customerName || 'Walk-in Customer',
                    items: (sale.items || []).map(item => ({
                        ...item,
                        saleItemId: item.saleItemId || item.id,
                        productId: item.productId,
                        productName: item.productName || item.name || 'Unknown Product',
                        qty: item.quantity || item.qty || 1,
                        unitPrice: parseFloat(item.unitPrice || item.price || 0),
                        returnableQty: item.quantity || item.qty || 1,
                        alreadyReturned: item.returnedQty || 0
                    }))
                };
                handleSelectSale(mappedSale);
            } else {
                setError('Invoice not found');
            }
        } catch (err) {
            console.error('Invoice search failed:', err);
            setError('Invoice not found or not eligible for return');
        } finally {
            setLoading(false);
        }
    };

    const filteredSales = useMemo(() => {
        if (!searchTerm.trim()) return sales;
        const term = searchTerm.toLowerCase();
        return sales.filter(sale =>
            sale.invoiceNo.toLowerCase().includes(term) ||
            sale.customerName.toLowerCase().includes(term)
        );
    }, [sales, searchTerm]);

    const handleSelectSale = (sale) => {
        setSelectedSale(sale);
        setReturnItems({});
        setView('select');
    };

    const toggleItem = (item, isSelected) => {
        setReturnItems(prev => {
            const next = { ...prev };
            if (isSelected) {
                next[item.saleItemId] = {
                    ...item,
                    returnQty: 1,
                    condition: 'GOOD'
                };
            } else {
                delete next[item.saleItemId];
            }
            return next;
        });
    };

    const updateReturnQty = (saleItemId, qty) => {
        setReturnItems(prev => {
            if (!prev[saleItemId]) return prev;
            const item = selectedSale.items.find(i => i.saleItemId === saleItemId);
            const maxQty = item ? (item.returnableQty - item.alreadyReturned) : 1;
            const newQty = Math.max(1, Math.min(qty, maxQty));
            return { ...prev, [saleItemId]: { ...prev[saleItemId], returnQty: newQty } };
        });
    };

    const updateCondition = (saleItemId, condition) => {
        setReturnItems(prev => {
            if (!prev[saleItemId]) return prev;
            return { ...prev, [saleItemId]: { ...prev[saleItemId], condition } };
        });
    };

    const totalRefund = useMemo(() => {
        return Object.values(returnItems).reduce((sum, item) => {
            return sum + (item.unitPrice * item.returnQty);
        }, 0);
    }, [returnItems]);

    const finalReason = reason === 'Other' ? customReason : reason;

    const handleProceedToConfirm = () => {
        if (Object.keys(returnItems).length === 0) {
            onNotify('error', 'No Items Selected', 'Please select items to return');
            return;
        }
        if (!finalReason.trim()) {
            onNotify('error', 'Reason Required', 'Please select or enter a reason for return');
            return;
        }
        setView('confirm');
    };

    const handleProcessReturn = async () => {
        if (!supUser || !supPass) {
            onNotify('error', 'Approval Required', 'Supervisor credentials are required');
            return;
        }

        setProcessing(true);
        try {
            const itemsToReturn = Object.values(returnItems).map(i => ({
                saleItemId: i.saleItemId,
                productId: i.productId,
                qty: i.returnQty,
                unitPrice: i.unitPrice,
                condition: i.condition
            }));

            const payload = {
                saleId: selectedSale.id,
                branchId: branchId,
                items: itemsToReturn,
                reason: finalReason,
                refundMethod: refundMethod,
                supervisorUsername: supUser,
                supervisorPassword: supPass
            };

            await posService.processReturn(payload);

            const negativeCartItems = Object.values(returnItems).map(i => ({
                id: i.productId,
                name: `[RETURN] ${i.productName}`,
                price: i.unitPrice,
                qty: -i.returnQty,
                discount: 0,
                taxRate: 0,
                isReturn: true,
                originalSaleId: selectedSale.id,
                originalInvoiceNo: selectedSale.invoiceNo,
            }));

            onNotify('success', 'Return Processed', `Refund: LKR ${totalRefund.toLocaleString(undefined, { minimumFractionDigits: 2 })}. Add replacement items to cart.`);
            
            if (onReturnToCart) {
                onReturnToCart(negativeCartItems, totalRefund);
            }
            onClose();
        } catch (err) {
            console.error('Return processing failed:', err);
            onNotify('error', 'Return Failed', err.response?.data?.message || 'Failed to process return');
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleString('en-LK', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        return `${diffDays} days ago`;
    };

    const renderSearchView = () => (
        <>
            <div className="p-4 bg-slate-50 border-b border-slate-200">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <ScanLine className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleInvoiceSearch()}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                            placeholder="Scan barcode or enter invoice number..."
                        />
                    </div>
                    <button
                        onClick={handleInvoiceSearch}
                        disabled={!searchTerm.trim() || loading}
                        className="px-4 py-2 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Search className="w-4 h-4" />
                        Search
                    </button>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    Showing sales from last 7 days eligible for return
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading && (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                    </div>
                )}

                {error && !loading && (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                        <p className="text-red-600 font-medium mb-2">{error}</p>
                        <button onClick={fetchReturnableSales} className="text-sm text-blue-600 hover:underline">
                            Try again
                        </button>
                    </div>
                )}

                {!loading && !error && filteredSales.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                        <Receipt className="w-16 h-16 text-slate-200 mb-4" />
                        <p className="text-slate-500 font-medium">
                            {searchTerm ? 'No matching sales found' : 'No returnable sales in last 7 days'}
                        </p>
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="mt-2 text-sm text-blue-600 hover:underline">
                                Clear search
                            </button>
                        )}
                    </div>
                )}

                {!loading && !error && filteredSales.length > 0 && (
                    <div className="divide-y divide-slate-100">
                        {filteredSales.map((sale) => (
                            <div
                                key={sale.id}
                                onClick={() => handleSelectSale(sale)}
                                className="p-4 hover:bg-rose-50 cursor-pointer transition-colors group"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono font-bold text-slate-800 text-sm bg-slate-100 px-2 py-0.5 rounded">
                                                {sale.invoiceNo}
                                            </span>
                                            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                                                PAID
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(sale.saleDate)}
                                                <span className="text-slate-400">({formatTimeAgo(sale.saleDate)})</span>
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {sale.customerName}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <ShoppingCart className="w-3 h-3" />
                                                {sale.items?.length || 0} items
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right flex items-center gap-3">
                                        <div>
                                            <div className="font-mono font-bold text-slate-900 text-lg">
                                                LKR {parseFloat(sale.netTotal || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-rose-500 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 text-xs text-slate-500 flex justify-between items-center">
                <span>Showing {filteredSales.length} of {sales.length} returnable sales</span>
                <button onClick={fetchReturnableSales} disabled={loading} className="text-blue-600 hover:underline flex items-center gap-1">
                    <RotateCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>
        </>
    );

    const renderSelectView = () => (
        <>
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <button onClick={() => setView('search')} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sales
                </button>
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Select Items to Return</h3>
                        <div className="text-sm text-slate-500">
                            Invoice: <span className="font-mono font-bold text-slate-700">{selectedSale?.invoiceNo}</span>
                            <span className="mx-2">•</span>
                            {formatDate(selectedSale?.saleDate)}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-slate-500">Original Total</div>
                        <div className="font-mono font-bold text-slate-800">
                            LKR {parseFloat(selectedSale?.netTotal || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                    {selectedSale?.items?.map((item) => {
                        const isSelected = !!returnItems[item.saleItemId];
                        const returnInfo = returnItems[item.saleItemId];
                        const maxReturnable = item.returnableQty - item.alreadyReturned;

                        return (
                            <div
                                key={item.saleItemId}
                                className={`p-4 rounded-xl border-2 transition-all ${isSelected
                                        ? 'bg-rose-50 border-rose-300 shadow-sm'
                                        : 'bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => toggleItem(item, e.target.checked)}
                                        disabled={maxReturnable <= 0}
                                        className="mt-1 w-5 h-5 accent-rose-600 rounded cursor-pointer disabled:opacity-50"
                                    />

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-bold text-slate-800">{item.productName}</div>
                                                <div className="text-sm text-slate-500 mt-0.5">
                                                    LKR {item.unitPrice.toLocaleString()} × {item.qty} qty
                                                    {item.alreadyReturned > 0 && (
                                                        <span className="ml-2 text-amber-600">
                                                            ({item.alreadyReturned} already returned)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono font-bold text-slate-700">
                                                    LKR {(item.unitPrice * item.qty).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div className="mt-4 pt-4 border-t border-rose-200 grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Return Qty</label>
                                                    <div className="flex items-center gap-2 bg-white rounded-lg border border-rose-200 px-2 py-1 w-fit">
                                                        <button
                                                            onClick={() => updateReturnQty(item.saleItemId, returnInfo.returnQty - 1)}
                                                            className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-bold"
                                                        >-</button>
                                                        <span className="w-10 text-center font-bold text-rose-700 text-lg">
                                                            {returnInfo.returnQty}
                                                        </span>
                                                        <button
                                                            onClick={() => updateReturnQty(item.saleItemId, returnInfo.returnQty + 1)}
                                                            className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-bold"
                                                        >+</button>
                                                        <span className="text-xs text-slate-400 ml-2">of {maxReturnable}</span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Condition</label>
                                                    <select
                                                        value={returnInfo.condition}
                                                        onChange={(e) => updateCondition(item.saleItemId, e.target.value)}
                                                        className="w-full border border-rose-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-rose-500"
                                                    >
                                                        {RETURN_CONDITIONS.map(c => (
                                                            <option key={c.value} value={c.value}>{c.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Return Reason</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500"
                        >
                            <option value="">Select reason...</option>
                            {RETURN_REASONS.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                        {reason === 'Other' && (
                            <input
                                type="text"
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder="Specify reason..."
                                className="w-full mt-2 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500"
                            />
                        )}
                    </div>

                    <div className="flex flex-col justify-between">
                        <div className="bg-white border border-rose-200 rounded-lg p-3">
                            <div className="flex justify-between text-sm text-slate-500 mb-1">
                                <span>Items to Return</span>
                                <span className="font-bold text-slate-700">{Object.keys(returnItems).length}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-rose-600">
                                <span>Refund Total</span>
                                <span className="font-mono">LKR {totalRefund.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                        <button
                            onClick={handleProceedToConfirm}
                            disabled={Object.keys(returnItems).length === 0 || !finalReason.trim()}
                            className="mt-2 w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <CheckCircle className="w-5 h-5" />
                            Continue to Approval
                        </button>
                    </div>
                </div>
            </div>
        </>
    );

    const renderConfirmView = () => (
        <>
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <button onClick={() => setView('select')} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Items
                </button>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-rose-600" />
                    Supervisor Approval Required
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 rounded-xl p-5 mb-6">
                    <h4 className="text-sm font-bold text-rose-700 uppercase mb-3">Return Summary</h4>

                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Invoice</span>
                            <span className="font-mono font-bold text-slate-800">{selectedSale?.invoiceNo}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Customer</span>
                            <span className="font-medium text-slate-800">{selectedSale?.customerName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Items Returning</span>
                            <span className="font-medium text-slate-800">{Object.keys(returnItems).length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Reason</span>
                            <span className="font-medium text-slate-800">{finalReason}</span>
                        </div>
                    </div>

                    <div className="border-t border-rose-200 pt-3">
                        <div className="flex justify-between items-center">
                            <span className="text-rose-700 font-bold">Total Refund</span>
                            <span className="font-mono font-black text-2xl text-rose-700">
                                LKR {totalRefund.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h4 className="text-sm font-bold text-slate-500 uppercase mb-2">Items Being Returned</h4>
                    <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                        {Object.values(returnItems).map(item => (
                            <div key={item.saleItemId} className="p-3 flex justify-between items-center">
                                <div>
                                    <div className="font-medium text-slate-800">{item.productName}</div>
                                    <div className="text-xs text-slate-500">
                                        Qty: {item.returnQty} • Condition: {RETURN_CONDITIONS.find(c => c.value === item.condition)?.label}
                                    </div>
                                </div>
                                <div className="font-mono font-bold text-slate-700">
                                    LKR {(item.unitPrice * item.returnQty).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mb-6">
                    <h4 className="text-sm font-bold text-slate-500 uppercase mb-2">Refund Method</h4>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setRefundMethod('CASH')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 font-medium transition-colors ${refundMethod === 'CASH'
                                    ? 'bg-green-50 border-green-500 text-green-700'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                        >
                            <Banknote className="w-5 h-5" />
                            Cash
                        </button>
                        <button
                            onClick={() => setRefundMethod('CARD')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 font-medium transition-colors ${refundMethod === 'CARD'
                                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                        >
                            <CreditCard className="w-5 h-5" />
                            Card Refund
                        </button>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Supervisor Authorization
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="text"
                            value={supUser}
                            onChange={(e) => setSupUser(e.target.value)}
                            placeholder="Supervisor Username"
                            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-rose-500"
                        />
                        <input
                            type="password"
                            value={supPass}
                            onChange={(e) => setSupPass(e.target.value)}
                            placeholder="Supervisor Password"
                            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-rose-500"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4">
                <button
                    onClick={handleProcessReturn}
                    disabled={processing || !supUser || !supPass}
                    className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                >
                    {processing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing Return...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-5 h-5" />
                            Authorize & Process Return
                        </>
                    )}
                </button>
            </div>
        </>
    );

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-[900px] h-[700px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <RotateCcw className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Smart Return</h2>
                            <p className="text-rose-200 text-sm">
                                {view === 'search' && 'Search or scan invoice to start return'}
                                {view === 'select' && 'Select items and quantities to return'}
                                {view === 'confirm' && 'Review and authorize the return'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                <div className="bg-rose-50 px-6 py-2 flex items-center gap-2 border-b border-rose-100">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${view === 'search' ? 'bg-rose-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                        <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center">1</span>
                        Find Sale
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${view === 'select' ? 'bg-rose-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                        <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center">2</span>
                        Select Items
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${view === 'confirm' ? 'bg-rose-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                        <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center">3</span>
                        Authorize
                    </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                    {view === 'search' && renderSearchView()}
                    {view === 'select' && renderSelectView()}
                    {view === 'confirm' && renderConfirmView()}
                </div>
            </div>
        </div>
    );
}
