import React, { useState, useEffect, useCallback } from 'react';
import {
    DollarSign, Clock, CheckCircle, AlertTriangle,
    Send, Building, Calendar, Receipt, User, Filter,
    Loader2, RefreshCw, CreditCard, Banknote, FileText,
    X, Search, ArrowRight, List, Info, ChevronDown
} from 'lucide-react';
import { poService } from '@/features/procurement/services/poService';
import inventoryService from '@/features/inventory/services/inventoryService';
import useEscapeClose from '@/shared/hooks/useEscapeClose';

const PAYMENT_STATUS_CONFIG = {
    'UNPAID': {
        label: 'Unpaid',
        color: 'bg-red-50 text-red-700 border-red-100',
        icon: AlertTriangle
    },
    'PARTIALLY_PAID': {
        label: 'Partially Paid',
        color: 'bg-amber-50 text-amber-700 border-amber-100',
        icon: Clock
    },
    'PAID': {
        label: 'Paid',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        icon: CheckCircle
    }
};

const PO_STATUS_CONFIG = {
    'PENDING_APPROVAL': { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800' },
    'APPROVED': { label: 'Approved', color: 'bg-blue-100 text-blue-800' },
    'REJECTED': { label: 'Rejected', color: 'bg-red-100 text-red-800' },
    'PARTIALLY_RECEIVED': { label: 'Partially Received', color: 'bg-purple-100 text-purple-800' },
    'FULLY_RECEIVED': { label: 'Fully Received', color: 'bg-teal-100 text-teal-800' },
    'RECEIVED': { label: 'Received', color: 'bg-emerald-100 text-emerald-800' },
    'PAID': { label: 'Paid', color: 'bg-green-100 text-green-800' }
};

const PAYMENT_METHODS = [
    { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: CreditCard },
    { value: 'CHEQUE', label: 'Cheque', icon: FileText },
    { value: 'CASH', label: 'Cash', icon: Banknote }
];

export default function SupplierPayments() {
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // pending, paid, all
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPO, setSelectedPO] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Slideout close on Escape key
    useEscapeClose(() => {
        setShowDetailModal(false);
        setSelectedPO(null);
    }, showDetailModal);

    // Details caches
    const [poItems, setPoItems] = useState([]);
    const [poPayments, setPoPayments] = useState([]);
    const [suppliersMap, setSuppliersMap] = useState({});
    const [productsMap, setProductsMap] = useState({});

    // Payment Form state
    const [paymentForm, setPaymentForm] = useState({
        amountPaid: '',
        paymentMethod: 'BANK_TRANSFER',
        paymentReference: '',
        notes: ''
    });

    const [stats, setStats] = useState({
        totalPurchases: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        pendingCount: 0
    });

    // Fetch suppliers lookup
    useEffect(() => {
        const loadSuppliers = async () => {
            try {
                const data = await inventoryService.getSuppliers();
                const map = {};
                (data || []).forEach(s => {
                    map[s.supplier_id] = s.name || s.company_name || `Supplier #${s.supplier_id}`;
                });
                setSuppliersMap(map);
            } catch (err) {
                console.error('Failed to load suppliers:', err);
            }
        };
        loadSuppliers();
    }, []);

    // Fetch products lookup
    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await inventoryService.getProducts();
                const map = {};
                (data || []).forEach(p => {
                    const id = p.product_id ?? p.productId;
                    if (id !== undefined && id !== null) {
                        map[id] = p.name || p.product_name || `Product #${id}`;
                    }
                });
                setProductsMap(map);
            } catch (err) {
                console.error('Failed to load products:', err);
            }
        };
        loadProducts();
    }, []);

    const normalizePO = useCallback((po = {}) => {
        const netAmt = Number(po.netAmount ?? po.netTotal ?? po.totalAmount ?? po.total ?? 0);
        const paidAmt = Number(po.paidAmount ?? 0);
        const outstanding = Math.max(0, netAmt - paidAmt);
        
        let payStatus = po.paymentStatus || 'UNPAID';
        if (paidAmt > 0) {
            payStatus = outstanding === 0 ? 'PAID' : 'PARTIALLY_PAID';
        }

        return {
            ...po,
            poId: po.poId ?? po.id,
            poNo: po.poNo ?? po.poNumber ?? '-',
            supplierId: po.supplierId ?? po.supplier_id,
            supplierName: po.supplierName ?? suppliersMap[po.supplierId ?? po.supplier_id] ?? 'Unknown Supplier',
            netAmount: netAmt,
            paidAmount: paidAmt,
            outstanding,
            paymentStatus: payStatus,
            status: po.status || 'DRAFT'
        };
    }, [suppliersMap]);

    const calculateStats = useCallback((list) => {
        let totalPurchases = 0;
        let totalPaid = 0;
        let totalOutstanding = 0;
        let pendingCount = 0;

        list.forEach(po => {
            totalPurchases += po.netAmount;
            totalPaid += po.paidAmount;
            totalOutstanding += po.outstanding;
            if (po.paymentStatus !== 'PAID' && (po.status === 'APPROVED' || po.status === 'FULLY_RECEIVED' || po.status === 'PARTIALLY_RECEIVED' || po.status === 'RECEIVED')) {
                pendingCount++;
            }
        });

        setStats({
            totalPurchases,
            totalPaid,
            totalOutstanding,
            pendingCount
        });
    }, []);

    const fetchPOs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await poService.getAllPOs();
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

            const normalized = poList.map(normalizePO);
            // Sort by PO id descending (newest first)
            normalized.sort((a, b) => Number(b.poId) - Number(a.poId));

            setPurchaseOrders(normalized);
            calculateStats(normalized);
        } catch (err) {
            console.error('Failed to load purchase orders:', err);
        } finally {
            setLoading(false);
        }
    }, [normalizePO, calculateStats]);

    useEffect(() => {
        fetchPOs();
    }, [fetchPOs]);

    const handleRowClick = async (po) => {
        setSelectedPO(po);
        setShowDetailModal(true);
        setLoadingDetails(true);
        setPaymentForm({
            amountPaid: po.outstanding.toFixed(2),
            paymentMethod: 'BANK_TRANSFER',
            paymentReference: '',
            notes: ''
        });

        try {
            // Load items
            const itemsRes = await poService.getPOItems(po.poId);
            const rawItems = itemsRes.data?.data || itemsRes.data || [];
            const mappedItems = rawItems.map(item => ({
                ...item,
                productName: item.productName || productsMap[item.productId] || `Product #${item.productId}`
            }));
            setPoItems(mappedItems);

            // Load payments
            const payRes = await poService.getPOPayments(po.poId);
            const rawPayments = payRes.data?.data || payRes.data || [];
            setPoPayments(rawPayments);
        } catch (err) {
            console.error('Failed to load PO details:', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPO) return;

        const amt = parseFloat(paymentForm.amountPaid);
        if (isNaN(amt) || amt <= 0) {
            alert('Please enter a valid payment amount greater than zero');
            return;
        }

        if (paymentForm.paymentMethod !== 'CASH' && !paymentForm.paymentReference.trim()) {
            alert('Please enter a reference number for non-cash payment methods');
            return;
        }

        setProcessing(true);
        try {
            // Format notes meta
            const notes = [
                paymentForm.notes.trim(),
                `Payment Method: ${paymentForm.paymentMethod}`,
                paymentForm.paymentReference ? `Ref: ${paymentForm.paymentReference}` : ''
            ].filter(Boolean).join('\n');

            await poService.processPOPayment(selectedPO.poId, {
                status: 'PAID',
                paymentMethod: paymentForm.paymentMethod,
                paymentReference: paymentForm.paymentReference,
                amountPaid: amt,
                notes: notes,
                paidAt: new Date().toISOString()
            });

            // Reload and refresh
            await fetchPOs();
            
            // Re-fetch detail view
            const updatedPO = purchaseOrders.find(p => p.poId === selectedPO.poId) || selectedPO;
            const outstanding = Math.max(0, updatedPO.netAmount - (updatedPO.paidAmount + amt));
            
            setSelectedPO({
                ...updatedPO,
                paidAmount: updatedPO.paidAmount + amt,
                outstanding,
                paymentStatus: outstanding === 0 ? 'PAID' : 'PARTIALLY_PAID'
            });

            setPaymentForm(prev => ({
                ...prev,
                amountPaid: outstanding.toFixed(2),
                paymentReference: '',
                notes: ''
            }));

            // Refresh payments list
            const payRes = await poService.getPOPayments(selectedPO.poId);
            setPoPayments(payRes.data?.data || payRes.data || []);
            
            alert('Payment processed successfully!');
        } catch (err) {
            console.error('Failed to process payment:', err);
            alert(err.response?.data?.message || 'Failed to submit payment. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 2
        }).format(val || 0);
    };

    // Filter and search logic
    const filteredPOs = purchaseOrders.filter(po => {
        // Tab status filter
        if (filter === 'pending') {
            const isApprovedOrRec = ['APPROVED', 'FULLY_RECEIVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'PAID'].includes(po.status);
            if (po.paymentStatus === 'PAID' || !isApprovedOrRec) return false;
        } else if (filter === 'paid') {
            if (po.paymentStatus !== 'PAID') return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return (
                po.poNo.toLowerCase().includes(query) ||
                po.supplierName.toLowerCase().includes(query) ||
                (po.paymentTerms && po.paymentTerms.toLowerCase().includes(query))
            );
        }

        return true;
    });

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-200">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Supplier Payments</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage vendor disbursements and payments tied to Purchase Orders</p>
                </div>
                <button
                    onClick={fetchPOs}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-brand-primary active:scale-95 transition-all shadow-sm disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin text-brand-primary' : ''} />
                    Refresh
                </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Receipt size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Purchases</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">{formatCurrency(stats.totalPurchases)}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Paid</p>
                        <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(stats.totalPaid)}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outstanding Balance</p>
                        <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(stats.totalOutstanding)}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending PO Payments</p>
                        <p className="text-xl font-bold text-amber-600 mt-1">{stats.pendingCount} POs</p>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Tabs */}
                <div className="flex p-1 bg-slate-100 rounded-xl self-start">
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                            filter === 'pending'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Pending Payment
                    </button>
                    <button
                        onClick={() => setFilter('paid')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                            filter === 'paid'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Fully Paid
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                            filter === 'all'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        All Orders
                    </button>
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by PO No, supplier, terms..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-primary transition-all text-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="animate-spin text-brand-primary" size={36} />
                        <p className="text-sm font-semibold text-slate-500">Loading purchase orders...</p>
                    </div>
                ) : filteredPOs.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center text-center max-w-md mx-auto gap-4">
                        <div className="p-4 bg-slate-50 text-slate-400 rounded-full">
                            <Receipt size={36} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-700">No Purchase Orders Found</h3>
                            <p className="text-sm text-slate-400 mt-1">There are no purchase orders matching your selected filter or search criteria.</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">PO Number</th>
                                    <th className="px-6 py-4">Supplier</th>
                                    <th className="px-6 py-4">Order Date</th>
                                    <th className="px-6 py-4 text-right">Net Amount</th>
                                    <th className="px-6 py-4 text-right">Paid Amount</th>
                                    <th className="px-6 py-4 text-right">Outstanding</th>
                                    <th className="px-6 py-4 text-center">PO Status</th>
                                    <th className="px-6 py-4 text-center">Payment Status</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                                {filteredPOs.map((po) => {
                                    const poStatus = PO_STATUS_CONFIG[po.status] || { label: po.status, color: 'bg-slate-100 text-slate-800' };
                                    const payStatus = PAYMENT_STATUS_CONFIG[po.paymentStatus] || { label: po.paymentStatus, color: 'bg-slate-100 text-slate-800', icon: Info };
                                    const PayStatusIcon = payStatus.icon;

                                    return (
                                        <tr
                                            key={po.poId}
                                            onClick={() => handleRowClick(po)}
                                            className="hover:bg-slate-50/50 cursor-pointer transition-colors group"
                                        >
                                            <td className="px-6 py-4 font-mono font-bold text-slate-800 group-hover:text-brand-primary transition-colors">
                                                {po.poNo}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-700">
                                                {po.supplierName}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {po.poDate ? new Date(po.poDate).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-slate-800">
                                                {formatCurrency(po.netAmount)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-emerald-600 font-semibold">
                                                {formatCurrency(po.paidAmount)}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-bold ${po.outstanding > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                                {formatCurrency(po.outstanding)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${poStatus.color}`}>
                                                    {poStatus.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${payStatus.color}`}>
                                                    <PayStatusIcon size={12} />
                                                    {payStatus.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRowClick(po);
                                                    }}
                                                    className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-100 hover:bg-brand-primary hover:text-white text-slate-500 transition-all active:scale-95 shadow-sm"
                                                >
                                                    <ArrowRight size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Slideout Detail Panel */}
            {showDetailModal && selectedPO && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
                    <div className="w-full max-w-5xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
                        {/* Slideout Header */}
                        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-lg font-bold text-slate-800">PO Details - <span className="font-mono">{selectedPO.poNo}</span></h2>
                                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${PO_STATUS_CONFIG[selectedPO.status]?.color || 'bg-slate-100 text-slate-800'}`}>
                                        {PO_STATUS_CONFIG[selectedPO.status]?.label || selectedPO.status}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full border ${PAYMENT_STATUS_CONFIG[selectedPO.paymentStatus]?.color || 'bg-slate-100 text-slate-800'}`}>
                                        {PAYMENT_STATUS_CONFIG[selectedPO.paymentStatus]?.label || selectedPO.paymentStatus}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Record supplier payments or review payment details</p>
                            </div>
                            <button
                                onClick={() => { setShowDetailModal(false); setSelectedPO(null); }}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Slideout Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 lg:flex lg:gap-6 lg:space-y-0">
                            {/* Left Pane - PO Details & Items */}
                            <div className="lg:w-7/12 space-y-6">
                                {/* Header Details Card */}
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supplier</p>
                                        <p className="text-sm font-semibold text-slate-800 mt-1">{selectedPO.supplierName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order Date</p>
                                        <p className="text-sm font-semibold text-slate-800 mt-1">
                                            {selectedPO.poDate ? new Date(selectedPO.poDate).toLocaleDateString() : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Delivery Date</p>
                                        <p className="text-sm font-semibold text-slate-800 mt-1">
                                            {selectedPO.expectedDeliveryDate ? new Date(selectedPO.expectedDeliveryDate).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Terms</p>
                                        <p className="text-sm font-semibold text-slate-800 mt-1">{selectedPO.paymentTerms || 'COD'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Requested By</p>
                                        <p className="text-sm font-semibold text-slate-800 mt-1">{selectedPO.requestedBy || 'Storekeeper'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Branch ID</p>
                                        <p className="text-sm font-semibold text-slate-800 mt-1">Branch #{selectedPO.branchId}</p>
                                    </div>
                                </div>

                                {/* PO Items Table */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                        <List size={16} className="text-slate-400" /> Ordered Items List
                                    </h3>
                                    <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white">
                                        {loadingDetails ? (
                                            <div className="p-8 flex items-center justify-center gap-2">
                                                <Loader2 className="animate-spin text-brand-primary" size={20} />
                                                <span className="text-sm text-slate-400">Loading items...</span>
                                            </div>
                                        ) : poItems.length === 0 ? (
                                            <p className="p-4 text-sm text-slate-400 italic text-center">No items listed</p>
                                        ) : (
                                            <table className="w-full text-left text-sm">
                                                <thead>
                                                    <tr className="bg-slate-50 text-xs font-bold text-slate-500 border-b border-slate-100 uppercase">
                                                        <th className="px-4 py-2.5">Item Name</th>
                                                        <th className="px-4 py-2.5 text-center">Qty Ordered</th>
                                                        <th className="px-4 py-2.5 text-right">Unit Price</th>
                                                        <th className="px-4 py-2.5 text-right">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-slate-600">
                                                    {poItems.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-4 py-3 font-medium text-slate-800">{item.productName}</td>
                                                            <td className="px-4 py-3 text-center">{item.qtyOrdered}</td>
                                                            <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                                                            <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(item.total)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Pane - Payments & Submit Payment Form */}
                            <div className="lg:w-5/12 space-y-6">
                                {/* Totals Breakdown */}
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Financial Summary</h3>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Net Amount</span>
                                        <span className="font-semibold text-slate-800">{formatCurrency(selectedPO.netAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                                        <span className="text-slate-500 font-medium">Total Paid</span>
                                        <span className="font-semibold text-emerald-600">{formatCurrency(selectedPO.paidAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-base pt-2 border-t border-slate-200">
                                        <span className="font-bold text-slate-700">Remaining Balance</span>
                                        <span className={`font-bold ${selectedPO.outstanding > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                            {formatCurrency(selectedPO.outstanding)}
                                        </span>
                                    </div>
                                </div>

                                {/* Record New Payment Form */}
                                {selectedPO.outstanding > 0 && (
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                            <DollarSign size={18} className="text-brand-primary" /> Record Supplier Payment
                                        </h3>
                                        <form onSubmit={handlePaymentSubmit} className="space-y-3.5">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 block mb-1">Amount to Pay (LKR)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={paymentForm.amountPaid}
                                                    max={selectedPO.outstanding}
                                                    onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                                                    required
                                                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-primary transition-all font-semibold text-slate-800"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-slate-500 block mb-1">Payment Method</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {PAYMENT_METHODS.map((m) => {
                                                        const MethodIcon = m.icon;
                                                        return (
                                                            <button
                                                                key={m.value}
                                                                type="button"
                                                                onClick={() => setPaymentForm({ ...paymentForm, paymentMethod: m.value })}
                                                                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all text-xs font-bold ${
                                                                    paymentForm.paymentMethod === m.value
                                                                        ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                                                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                <MethodIcon size={16} />
                                                                {m.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {paymentForm.paymentMethod !== 'CASH' && (
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 block mb-1">
                                                        Reference / Cheque Number <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={paymentForm.paymentReference}
                                                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentReference: e.target.value })}
                                                        required
                                                        placeholder={paymentForm.paymentMethod === 'CHEQUE' ? 'Enter Cheque Number' : 'Enter Bank Transaction Ref'}
                                                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-primary transition-all text-slate-800"
                                                    />
                                                </div>
                                            )}

                                            <div>
                                                <label className="text-xs font-bold text-slate-500 block mb-1">Notes / Remarks</label>
                                                <textarea
                                                    rows="2"
                                                    value={paymentForm.notes}
                                                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                                    placeholder="Add any processing logs, bank branch details, etc."
                                                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-primary transition-all text-slate-800 resize-none"
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-hover shadow-md rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
                                            >
                                                {processing ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" />
                                                        Processing Payment...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle size={16} />
                                                        Submit Payment
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {/* Payment History Logs */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <List size={16} className="text-slate-400" /> Payment History Logs
                                    </h3>
                                    {loadingDetails ? (
                                        <div className="p-6 flex items-center justify-center gap-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            <Loader2 className="animate-spin text-brand-primary" size={16} />
                                            <span className="text-xs text-slate-400">Loading history...</span>
                                        </div>
                                    ) : poPayments.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center border border-dashed border-slate-200">
                                            No payments recorded for this PO yet
                                        </p>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {poPayments.map((p, idx) => (
                                                <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-1.5">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="font-mono text-slate-500">
                                                            {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '-'}
                                                        </span>
                                                        <span className="font-bold text-emerald-600">
                                                            + {formatCurrency(p.amountPaid)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="font-semibold text-slate-700">
                                                            Method: {p.paymentMethod}
                                                        </span>
                                                        {p.paymentReference && (
                                                            <span className="font-mono text-slate-500">
                                                                Ref: {p.paymentReference}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {p.notes && (
                                                        <p className="text-xs text-slate-400 whitespace-pre-line border-t border-slate-200 pt-1 mt-1">
                                                            {p.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
