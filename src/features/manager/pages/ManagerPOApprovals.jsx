import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    CheckCircle, AlertTriangle, Send, Loader2, RefreshCw,
    Banknote, FileText, X, Search, DollarSign, Package, Clock
} from 'lucide-react';
import { poService } from '@/features/procurement/services/poService';
import inventoryService from '@/features/inventory/services/inventoryService';
import useEscapeClose from '@/shared/hooks/useEscapeClose';

// Reject Modal Component
function RejectModal({ isOpen, onClose, onConfirm, loading }) {
    const [reason, setReason] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setReason("");
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-800">Reject Purchase Order</h3>
                    <p className="text-sm text-slate-500 mt-1">Please enter the reason for rejecting this purchase order request.</p>
                    <textarea
                        ref={inputRef}
                        className="w-full mt-4 p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 text-sm resize-none"
                        placeholder="e.g. Invalid item pricing or incorrect quantities"
                        rows="3"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>
                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(reason)}
                        disabled={loading || !reason.trim()}
                        className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-750 shadow-sm rounded-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? "Rejecting..." : "Reject"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ManagerPOApprovals() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // pending, approved, history
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [selectedPO, setSelectedPO] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [poItems, setPoItems] = useState([]);
    const [poPayments, setPoPayments] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Suppliers lookup
    const [suppliersMap, setSuppliersMap] = useState({});
    const [paymentDetailsCache, setPaymentDetailsCache] = useState({});
    const [productsMap, setProductsMap] = useState({});

    // Payment form state
    const [paymentForm, setPaymentForm] = useState({
        paymentMethod: 'BANK_TRANSFER',
        paymentReference: '',
        notes: ''
    });

    useEffect(() => {
        try {
            const stored = localStorage.getItem('poPaymentDetailsCache');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && typeof parsed === 'object') {
                    setPaymentDetailsCache(parsed);
                }
            }
        } catch (e) {
            console.error('Failed to load PO payment cache:', e);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('poPaymentDetailsCache', JSON.stringify(paymentDetailsCache));
        } catch (e) {
            console.error('Failed to persist PO payment cache:', e);
        }
    }, [paymentDetailsCache]);

    useEscapeClose(() => { setShowModal(false); setSelectedPO(null); setPoItems([]); setPoPayments([]); }, showModal);

    // Fetch suppliers for name lookup
    useEffect(() => {
        const loadSuppliers = async () => {
            try {
                const suppliers = await inventoryService.getSuppliers();
                const map = {};
                suppliers.forEach(s => { map[s.supplier_id] = s.name || s.company_name || s.supplier_id; });
                setSuppliersMap(map);
            } catch (err) {
                console.error('Failed to load suppliers for name lookup:', err);
            }
        };
        loadSuppliers();
    }, []);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const products = await inventoryService.getProducts();
                const map = {};
                (products || []).forEach((p) => {
                    const id = p.product_id ?? p.productId;
                    if (id !== undefined && id !== null) {
                        map[id] = p.name || p.product_name || p.productName;
                    }
                });
                setProductsMap(map);
            } catch (err) {
                console.error('Failed to load products for PO name lookup:', err);
            }
        };

        loadProducts();
    }, []);

    const getSupplierName = (supplierId) => suppliersMap[supplierId] || supplierId;

    const normalizePOItem = (item = {}) => {
        const qty = Number(item.qtyOrdered ?? item.quantity ?? item.qty ?? 0);
        const unitPrice = Number(item.unitPrice ?? item.unit_price ?? item.price ?? 0);
        const total = Number(item.total ?? item.lineTotal ?? item.subtotal ?? (qty * unitPrice));

        return {
            ...item,
            productId: item.productId ?? item.product_id ?? item.itemId ?? item.id,
            productName: item.productName ?? item.product_name ?? item.name ?? item.itemName,
            qtyOrdered: qty,
            unitPrice,
            total,
        };
    };

    const getProductName = (item = {}) => {
        const candidateId = item.productId ?? item.product_id ?? item.itemId ?? item.id;
        const lookupName = productsMap[candidateId];
        return item.productName || item.product_name || item.name || lookupName || (candidateId ? `Item #${candidateId}` : 'Unknown Item');
    };

    const toDateOnly = (value) => {
        if (!value) return 'N/A';
        if (typeof value === 'string') {
            if (value.includes('T')) return value.split('T')[0];
            const match = value.match(/^\d{4}-\d{2}-\d{2}/);
            if (match) return match[0];
        }
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
        }
        return String(value);
    };

    const parsePaymentDetailsFromNotes = (notes = '') => {
        if (!notes || typeof notes !== 'string') return {};
        const methodMatch = notes.match(/Payment\s*Method\s*:\s*([^|\n]+)/i);
        const refMatch = notes.match(/(?:Ref(?:erence)?|Cheque(?:\s*No)?)\s*:\s*([^|\n]+)/i);
        return {
            paymentMethod: methodMatch ? methodMatch[1].trim().toUpperCase().replace(/\s+/g, '_') : undefined,
            paymentReference: refMatch ? refMatch[1].trim() : undefined,
        };
    };

    const normalizePayment = (p = {}) => ({
        ...p,
        paymentMethod: p.paymentMethod ?? p.payment_method,
        paymentReference: p.paymentReference ?? p.payment_reference ?? p.referenceNo,
        amountPaid: Number(p.amountPaid ?? p.amount_paid ?? p.amount ?? 0),
        paidAt: p.paidAt ?? p.paid_at ?? p.paymentDate ?? p.payment_date ?? p.createdAt,
        notes: p.notes ?? p.note,
    });

    const normalizePO = (r = {}) => ({
        ...r,
        poId: r.poId ?? r.id,
        poNo: r.poNo ?? r.poNumber ?? r.referenceNo ?? '-',
        poDate: r.poDate ?? r.createdAt ?? r.createdDate ?? '-',
        supplierId: r.supplierId ?? r.supplier_id,
        supplierName: r.supplierName ?? r.supplier_name,
        totalAmount: Number(r.totalAmount ?? r.grossAmount ?? r.total ?? 0),
        taxAmount: Number(r.taxAmount ?? r.tax ?? r.vatAmount ?? 0),
        discountAmount: Number(r.discountAmount ?? r.discount ?? 0),
        netAmount: Number(r.netAmount ?? r.netTotal ?? r.payableAmount ?? r.totalAmount ?? r.total ?? 0),
        status: (r.status || '').toUpperCase(),
        paymentMethod: r.paymentMethod ?? r.payment_method ?? r.method ?? r.paymentType,
        paymentReference: r.paymentReference ?? r.payment_reference ?? r.transactionReference ?? r.transactionId ?? r.referenceNo ?? r.chequeNo,
        paidDate: r.paidDate ?? r.paid_date ?? r.paymentDate ?? r.payment_date ?? r.processedAt ?? r.processed_at,
        approvedBy: r.approvedByName ?? r.approvedBy ?? r.approved_by,
        notes: r.notes ?? r.note,
        transferredBy: r.transferredBy ?? r.transferred_by ?? r.sentBy,
        transferredAt: r.transferredAt ?? r.transferred_at ?? r.sentAt,
        requestedBy: r.requestedBy || r.requestedByName || r.createdByName || (r.createdBy ? `User #${r.createdBy}` : '-'),
    });

    const getResponseData = (res) => {
        if (!res) return [];
        return res.data?.data || res.data || [];
    };

    const mergePaymentCache = (po) => {
        if (!po || po.status !== 'PAID') return po;
        const cached = paymentDetailsCache[po.poId];
        if (!cached) return po;
        return {
            ...po,
            paymentMethod: po.paymentMethod || cached.paymentMethod,
            paymentReference: po.paymentReference || cached.paymentReference,
            paidDate: po.paidDate || cached.paidDate,
        };
    };

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            let res;
            if (filter === 'pending') {
                res = await poService.getPendingPOs();
                setRequests(getResponseData(res).map(normalizePO).map(mergePaymentCache));
            } else if (filter === 'approved') {
                res = await poService.getPOsByStatus('APPROVED');
                setRequests(getResponseData(res).map(normalizePO).map(mergePaymentCache));
            } else {
                const [paid, rejected, transferred] = await Promise.all([
                    poService.getPOsByStatus('PAID'),
                    poService.getPOsByStatus('REJECTED'),
                    poService.getPOsByStatus('TRANSFERRED_TO_CASHIER')
                ]);
                const allHistory = [
                    ...getResponseData(paid),
                    ...getResponseData(rejected),
                    ...getResponseData(transferred)
                ].map(normalizePO).map(mergePaymentCache);
                allHistory.sort((a, b) => Number(b.poId || 0) - Number(a.poId || 0));
                setRequests(allHistory);
            }
        } catch (err) {
            console.error('Failed to fetch POs:', err);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleRowClick = async (po) => {
        setSelectedPO(po);
        setShowModal(true);
        setLoadingItems(true);
        try {
            const res = await poService.getPOItems(po.poId);
            setPoItems(getResponseData(res).map(normalizePOItem));

            if (po.status === 'PAID') {
                try {
                    const payRes = await poService.getPOPayments(po.poId);
                    const normalizedPayments = getResponseData(payRes).map(normalizePayment);
                    normalizedPayments.sort((a, b) => new Date(b.paidAt || 0).getTime() - new Date(a.paidAt || 0).getTime());
                    setPoPayments(normalizedPayments);
                } catch (payErr) {
                    console.error('Failed to fetch PO payment history:', payErr);
                    setPoPayments([]);
                }
            } else {
                setPoPayments([]);
            }

            if (po.status === 'PAID') {
                const hasPaymentDetails = Boolean(po.paymentMethod || po.paymentReference || po.paidDate);
                if (!hasPaymentDetails) {
                    try {
                        const paidRes = await poService.getPOsByStatus('PAID');
                        const paidRecord = getResponseData(paidRes).map(normalizePO).find((r) => r.poId === po.poId);
                        if (paidRecord) {
                            setSelectedPO((prev) => (prev ? { ...prev, ...paidRecord } : prev));
                        }
                    } catch (lookupErr) {
                        console.error('Failed to load additional paid PO details:', lookupErr);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch PO items:', err);
            setPoItems([]);
        } finally {
            setLoadingItems(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedPO) return;
        setProcessing(true);
        try {
            await poService.processPOPayment(selectedPO.poId, { status: 'APPROVED' });
            setShowModal(false);
            setSelectedPO(null);
            fetchRequests();
        } catch (err) {
            console.error('Approval failed:', err);
            alert('Failed to approve PO');
        } finally {
            setProcessing(false);
        }
    };

    const handleRejectConfirm = async (reason) => {
        if (!selectedPO) return;
        setProcessing(true);
        try {
            await poService.processPOPayment(selectedPO.poId, { status: 'REJECTED', notes: reason });
            setIsRejectModalOpen(false);
            setShowModal(false);
            setSelectedPO(null);
            fetchRequests();
        } catch (err) {
            console.error('Rejection failed:', err);
            alert('Failed to reject PO');
        } finally {
            setProcessing(false);
        }
    };

    const handlePaymentAction = async (status) => {
        if (!selectedPO) return;
        if (status === 'PAID' && !paymentForm.paymentReference && paymentForm.paymentMethod !== 'CASH') {
            alert('Please enter a payment reference for non-cash payments');
            return;
        }

        setProcessing(true);
        try {
            const cachedPaymentDetails = status === 'PAID'
                ? {
                    paymentMethod: paymentForm.paymentMethod,
                    paymentReference: paymentForm.paymentReference,
                    paidDate: new Date().toISOString(),
                }
                : null;

            const paymentMetaNotes = status === 'PAID'
                ? [
                    paymentForm.notes || '',
                    `Payment Method: ${paymentForm.paymentMethod}`,
                    paymentForm.paymentReference ? `Reference: ${paymentForm.paymentReference}` : ''
                ].filter(Boolean).join('\n')
                : paymentForm.notes;

            await poService.processPOPayment(selectedPO.poId, {
                status: status,
                paymentMethod: paymentForm.paymentMethod,
                paymentReference: paymentForm.paymentReference,
                amountPaid: Number(selectedPO.netAmount || 0),
                paidAt: cachedPaymentDetails?.paidDate,
                notes: paymentMetaNotes
            });

            if (cachedPaymentDetails) {
                setPaymentDetailsCache((prev) => ({
                    ...prev,
                    [selectedPO.poId]: cachedPaymentDetails,
                }));

                setSelectedPO((prev) => prev ? ({
                    ...prev,
                    paymentMethod: prev.paymentMethod || cachedPaymentDetails.paymentMethod,
                    paymentReference: prev.paymentReference || cachedPaymentDetails.paymentReference,
                    paidDate: prev.paidDate || cachedPaymentDetails.paidDate,
                    notes: paymentMetaNotes || prev.notes,
                }) : prev);

                setPoPayments((prev) => ([
                    {
                        paymentMethod: cachedPaymentDetails.paymentMethod,
                        paymentReference: cachedPaymentDetails.paymentReference,
                        amountPaid: Number(selectedPO.netAmount || 0),
                        paidAt: cachedPaymentDetails.paidDate,
                        notes: paymentMetaNotes,
                    },
                    ...prev,
                ]));
            }

            setShowModal(false);
            setSelectedPO(null);
            setPaymentForm({ paymentMethod: 'BANK_TRANSFER', paymentReference: '', notes: '' });
            fetchRequests();
        } catch (err) {
            console.error('Payment processing failed:', err);
            alert(err.response?.data?.message || 'Failed to process payment');
        } finally {
            setProcessing(false);
        }
    };

    const StatusBadge = ({ status }) => {
        switch (status) {
            case 'PENDING_APPROVAL':
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">Pending</span>;
            case 'APPROVED':
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Approved</span>;
            case 'TRANSFERRED_TO_CASHIER':
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">Sent to Cashier</span>;
            case 'PAID':
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">Paid</span>;
            case 'REJECTED':
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Rejected</span>;
            default:
                return <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    const filteredRequests = requests.filter(r => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return r.poNo?.toLowerCase().includes(q) || 
               (r.supplierName || getSupplierName(r.supplierId))?.toLowerCase().includes(q) ||
               r.requestedBy?.toLowerCase().includes(q);
    });

    const latestPayment = poPayments[0] || null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">PO Approvals & Payments</h1>
                    <p className="text-gray-500 mt-1">Review history, approve POs, and manage supplier payments.</p>
                </div>
                <button
                    onClick={fetchRequests}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    {[
                        { key: 'pending', label: 'Pending Approval' },
                        { key: 'approved', label: 'Approved & Pending Payout' },
                        { key: 'history', label: 'Completed History' }
                    ].map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all shadow-sm ${filter === f.key
                                ? 'bg-white text-indigo-600 border border-gray-200'
                                : 'text-gray-600 hover:text-gray-900 shadow-none border-transparent'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="flex-1 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by PO No or Supplier..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                        <span className="text-gray-600 font-medium">Loading records...</span>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="w-20 h-20 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-5">
                            <FileText className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">No Records Found</h3>
                        <p className="text-gray-500 mt-2">No matching purchase orders in this category.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">PO Number</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Supplier</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Net Amount</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Requested By</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRequests.map((request) => (
                                    <tr
                                        key={request.poId}
                                        onClick={() => handleRowClick(request)}
                                        className="hover:bg-indigo-50 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 font-medium">{request.poDate || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                {request.poNo}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-700 font-medium">
                                                {request.supplierName || getSupplierName(request.supplierId)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-black text-gray-700">
                                                LKR {(request.netAmount || 0).toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                                    {request.requestedBy?.charAt(0)}
                                                </div>
                                                <div className="text-sm text-gray-600 font-medium">{request.requestedBy}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={request.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && selectedPO && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setSelectedPO(null); setPoItems([]); setPoPayments([]); } }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[95vh] relative z-10 overflow-hidden">
                        <div className={`px-6 py-5 flex items-center justify-between shrink-0 ${selectedPO.status === 'PENDING_APPROVAL' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                            selectedPO.status === 'APPROVED' ? 'bg-gradient-to-r from-indigo-600 to-blue-600' :
                                selectedPO.status === 'PAID' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                                    'bg-gradient-to-r from-gray-700 to-gray-600'
                            }`}>
                            <div className="text-white">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-xl font-bold">Purchase Order Overview</h3>
                                    <span className="px-2.5 py-1 text-[10px] font-black tracking-widest uppercase bg-white/20 rounded border border-white/30 backdrop-blur-sm">
                                        {selectedPO.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <p className="text-white/80 text-sm font-medium">{selectedPO.poNo}</p>
                            </div>
                            <button
                                onClick={() => { setShowModal(false); setSelectedPO(null); setPoItems([]); setPoPayments([]); }}
                                className="p-2 rounded-xl hover:bg-white/20 text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 bg-gray-50 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">General Details</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 text-sm font-medium">PO Number</span>
                                            <span className="font-bold text-gray-900">{selectedPO.poNo}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 text-sm font-medium">Created Date</span>
                                            <span className="font-bold text-gray-900">{selectedPO.poDate}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 text-sm font-medium">Supplier</span>
                                            <span className="font-bold text-gray-900">{selectedPO.supplierName || getSupplierName(selectedPO.supplierId)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 text-sm font-medium">Payment Terms</span>
                                            <span className="font-bold text-gray-900">{selectedPO.paymentTerms || 'Standard'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 text-sm font-medium">Expected Delivery Date</span>
                                            <span className="font-bold text-gray-900">{selectedPO.expectedDeliveryDate || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-gray-50 mt-1">
                                            <span className="text-gray-500 text-sm font-medium">Requested By</span>
                                            <span className="font-bold text-indigo-600">{selectedPO.requestedBy}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm relative overflow-hidden">
                                    <DollarSign className="w-32 h-32 absolute -right-6 -bottom-6 text-gray-50 opacity-10" />
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2 relative z-10">Financial Summary</h4>
                                    <div className="space-y-3 relative z-10">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 text-sm font-medium">Gross Total</span>
                                            <span className="font-bold text-gray-900">LKR {(selectedPO.totalAmount || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 text-sm font-medium">Tax Amount</span>
                                            <span className="font-bold text-gray-900">LKR {(selectedPO.taxAmount || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 text-sm font-medium">Discount</span>
                                            <span className="font-bold text-red-600">- LKR {(selectedPO.discountAmount || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between pt-3 border-t border-dashed border-gray-200 mt-1">
                                            <span className="font-black text-gray-800 uppercase text-sm">Net Payable</span>
                                            <span className="text-xl font-black text-indigo-600">LKR {(selectedPO.netAmount || 0).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                                <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-indigo-500" />
                                    <h4 className="font-bold text-gray-800">Purchased Items</h4>
                                </div>
                                {loadingItems ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                             <thead className="bg-white text-gray-500 font-bold uppercase text-xs tracking-wider border-b border-gray-100">
                                                 <tr>
                                                     <th className="px-5 py-4">Product Name</th>
                                                     <th className="px-5 py-4 text-center">Qty Ordered</th>
                                                     <th className="px-5 py-4 text-right">Unit Price</th>
                                                     <th className="px-5 py-4 text-right">Selling Price</th>
                                                     <th className="px-5 py-4 text-right">MRP</th>
                                                     <th className="px-5 py-4 text-right">Discount</th>
                                                     <th className="px-5 py-4 text-right">Total</th>
                                                 </tr>
                                             </thead>
                                             <tbody className="divide-y divide-gray-50">
                                                 {poItems.length === 0 ? (
                                                     <tr><td colSpan="7" className="text-center py-8 text-gray-400">No items found.</td></tr>
                                                 ) : poItems.map((item, idx) => (
                                                     <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                         <td className="px-5 py-4 font-semibold text-gray-800">{getProductName(item)}</td>
                                                         <td className="px-5 py-4 text-center font-bold text-indigo-600 bg-indigo-50/30">{item.qtyOrdered}</td>
                                                         <td className="px-5 py-4 text-right text-gray-600">LKR {(item.unitPrice || 0).toFixed(2)}</td>
                                                         <td className="px-5 py-4 text-right text-gray-600">LKR {(item.sellingPrice || 0).toFixed(2)}</td>
                                                         <td className="px-5 py-4 text-right text-gray-600">LKR {(item.mrp || 0).toFixed(2)}</td>
                                                         <td className="px-5 py-4 text-right text-red-500 font-medium">- LKR {(item.discount || 0).toFixed(2)}</td>
                                                         <td className="px-5 py-4 text-right font-black text-gray-900">LKR {(item.total || 0).toFixed(2)}</td>
                                                     </tr>
                                                 ))}
                                             </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {selectedPO.status === 'PAID' && (
                                <div className="bg-white rounded-xl border border-emerald-200 p-5 shadow-sm">
                                    <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 border-b border-emerald-100 pb-2 flex items-center gap-2">
                                        <Banknote className="w-4 h-4" /> Payment Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-3">
                                            <span className="text-gray-500 text-sm font-medium">Payment Method</span>
                                            <span className="font-bold text-gray-900 uppercase">
                                                {String(latestPayment?.paymentMethod || selectedPO.paymentMethod || parsePaymentDetailsFromNotes(selectedPO.notes).paymentMethod || paymentDetailsCache[selectedPO.poId]?.paymentMethod || 'N/A').replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-3">
                                            <span className="text-gray-500 text-sm font-medium">Reference / Cheque No</span>
                                            <span className="font-bold text-gray-900 font-mono">
                                                {latestPayment?.paymentReference || selectedPO.paymentReference || parsePaymentDetailsFromNotes(selectedPO.notes).paymentReference || paymentDetailsCache[selectedPO.poId]?.paymentReference || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-3">
                                            <span className="text-gray-500 text-sm font-medium">Paid Date</span>
                                            <span className="font-bold text-gray-900">
                                                {toDateOnly(latestPayment?.paidAt || selectedPO.paidDate || selectedPO.paymentDate || paymentDetailsCache[selectedPO.poId]?.paidDate || selectedPO.updatedAt)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-3">
                                            <span className="text-gray-500 text-sm font-medium">Amount Paid</span>
                                            <span className="font-black text-emerald-600 text-lg">
                                                LKR {(latestPayment?.amountPaid || selectedPO.netAmount || 0).toFixed(2)}
                                            </span>
                                        </div>
                                        {selectedPO.notes && (
                                            <div className="md:col-span-2 bg-gray-50 rounded-lg px-4 py-3">
                                                <span className="text-gray-500 text-sm font-medium block mb-1">Notes</span>
                                                <span className="text-gray-800 text-sm">{selectedPO.notes}</span>
                                            </div>
                                        )}
                                        {selectedPO.approvedBy && (
                                            <div className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-3">
                                                <span className="text-gray-500 text-sm font-medium">Approved By</span>
                                                <span className="font-bold text-gray-900">{selectedPO.approvedBy}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedPO.status === 'TRANSFERRED_TO_CASHIER' && (
                                <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-sm">
                                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4 border-b border-indigo-100 pb-2 flex items-center gap-2">
                                        <Send className="w-4 h-4" /> Cashier Transfer Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-3">
                                            <span className="text-gray-500 text-sm font-medium">Transferred By</span>
                                            <span className="font-bold text-gray-900">{selectedPO.transferredBy || selectedPO.approvedBy || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-3">
                                            <span className="text-gray-500 text-sm font-medium">Transferred At</span>
                                            <span className="font-bold text-gray-900">{selectedPO.transferredAt || selectedPO.updatedAt || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-3">
                                            <span className="text-gray-500 text-sm font-medium">Amount for Cashier</span>
                                            <span className="font-black text-indigo-600 text-lg">LKR {(selectedPO.netAmount || 0).toFixed(2)}</span>
                                        </div>
                                        {selectedPO.notes && (
                                            <div className="md:col-span-2 bg-gray-50 rounded-lg px-4 py-3">
                                                <span className="text-gray-500 text-sm font-medium block mb-1">Notes</span>
                                                <span className="text-gray-800 text-sm">{selectedPO.notes}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedPO.status === 'APPROVED' && (
                                <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-sm bg-indigo-50/10">
                                    <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-4 border-b border-indigo-100 pb-2">Supplier Payment Processing</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 block">Payment Method</label>
                                            <select
                                                value={paymentForm.paymentMethod}
                                                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium shadow-sm transition-colors"
                                            >
                                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                                <option value="CHEQUE">Cheque</option>
                                                <option value="CASH">Cash Deposit</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 block">Reference ID (Auth / Cheque No)</label>
                                            <input
                                                type="text"
                                                value={paymentForm.paymentReference}
                                                onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentReference: e.target.value }))}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-colors"
                                                placeholder="REF-XXX..."
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 block">Additional Notes (Optional)</label>
                                            <textarea
                                                value={paymentForm.notes}
                                                onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-colors resize-none"
                                                placeholder="Any additional accounting notes regarding this payment..."
                                                rows="2"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-white border-t border-gray-200 flex flex-wrap gap-3 shrink-0 justify-end rounded-b-2xl">
                            {selectedPO.status === 'PENDING_APPROVAL' && (
                                <>
                                    <button
                                        onClick={() => setIsRejectModalOpen(true)}
                                        disabled={processing}
                                        className="px-6 py-3 border-2 border-red-200 hover:bg-red-50 text-red-600 rounded-xl font-bold transition-colors disabled:opacity-50"
                                    >
                                        Reject Purchase Order
                                    </button>
                                    <button
                                        onClick={handleApprove}
                                        disabled={processing}
                                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow hover:shadow-lg disabled:opacity-50 rounded-xl font-bold flex items-center gap-2 transition-all"
                                    >
                                        {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                        Authorize Approval
                                    </button>
                                </>
                            )}

                            {selectedPO.status === 'APPROVED' && (
                                <>
                                    <button
                                        onClick={() => handlePaymentAction('TRANSFERRED_TO_CASHIER')}
                                        disabled={processing}
                                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 text-white shadow hover:shadow-lg rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                                    >
                                        {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        Send To Cashier
                                    </button>
                                    <button
                                        onClick={() => handlePaymentAction('PAID')}
                                        disabled={processing || (paymentForm.paymentMethod !== 'CASH' && !paymentForm.paymentReference)}
                                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white shadow-emerald-500/20 shadow-lg rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                                    >
                                        {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Banknote className="w-5 h-5" />}
                                        Confirm Pay Supplier
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isRejectModalOpen && (
                <RejectModal
                    isOpen={isRejectModalOpen}
                    onClose={() => setIsRejectModalOpen(false)}
                    onConfirm={handleRejectConfirm}
                    loading={processing}
                />
            )}
        </div>
    );
}
