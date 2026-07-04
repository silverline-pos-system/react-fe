import React, { useState, useEffect, useCallback } from 'react';
import {
    DollarSign, Clock, CheckCircle, AlertTriangle,
    Send, Building, Calendar, Receipt, User, Filter,
    Loader2, RefreshCw, CreditCard, Banknote, FileText,
    ChevronDown, ChevronUp, X, Search
} from 'lucide-react';
import { dispatchPaymentService } from '@/features/pos/services/dispatchPaymentService';
import useEscapeClose from '@/hooks/useEscapeClose';

const STATUS_CONFIG = {
    'PENDING': {
        label: 'Pending',
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: Clock
    },
    'SUPERVISOR_APPROVED': {
        label: 'Supervisor Approved',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: CheckCircle
    },
    'TRANSFERRED_TO_MANAGER': {
        label: 'Awaiting Payment',
        color: 'bg-purple-100 text-purple-700 border-purple-200',
        icon: Send
    },
    'PROCESSING': {
        label: 'Processing',
        color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
        icon: Loader2
    },
    'PAID': {
        label: 'Paid',
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: CheckCircle
    },
    'REJECTED': {
        label: 'Rejected',
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: AlertTriangle
    }
};

const PRIORITY_CONFIG = {
    'URGENT': { label: 'Urgent', color: 'bg-red-500 text-white', order: 1 },
    'HIGH': { label: 'High', color: 'bg-orange-500 text-white', order: 2 },
    'NORMAL': { label: 'Normal', color: 'bg-blue-500 text-white', order: 3 },
    'LOW': { label: 'Low', color: 'bg-gray-500 text-white', order: 4 }
};

const PAYMENT_METHODS = [
    { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: CreditCard },
    { value: 'CHEQUE', label: 'Cheque', icon: FileText },
    { value: 'CASH', label: 'Cash', icon: Banknote }
];

export default function ManagerPayments() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // pending, all, paid
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEscapeClose(() => { setShowPaymentModal(false); setSelectedRequest(null); }, showPaymentModal);

    const [paymentForm, setPaymentForm] = useState({
        paymentMethod: 'BANK_TRANSFER',
        paymentReference: '',
        notes: ''
    });

    const [stats, setStats] = useState({
        pending: 0,
        totalPending: 0,
        paidToday: 0
    });

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            let res;
            if (filter === 'pending') {
                res = await dispatchPaymentService.getManagerPaymentRequests();
            } else if (filter === 'paid') {
                res = await dispatchPaymentService.getPaymentRequestsByStatus('PAID');
            } else {
                const [pending, paid, rejected] = await Promise.all([
                    dispatchPaymentService.getManagerPaymentRequests(),
                    dispatchPaymentService.getPaymentRequestsByStatus('PAID'),
                    dispatchPaymentService.getPaymentRequestsByStatus('REJECTED')
                ]);
                const all = [
                    ...(pending.data?.data || []),
                    ...(paid.data?.data || []),
                    ...(rejected.data?.data || [])
                ];
                setRequests(all);
                calculateStats(all);
                setLoading(false);
                return;
            }

            const data = res.data?.data || res.data || [];
            setRequests(Array.isArray(data) ? data : []);
            calculateStats(data);
        } catch (err) {
            console.error('Failed to fetch payment requests:', err);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    const calculateStats = (data) => {
        const pending = data.filter(r =>
            r.status === 'TRANSFERRED_TO_MANAGER' || r.status === 'PROCESSING'
        );
        const totalPending = pending.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

        const today = new Date().toDateString();
        const paidToday = data.filter(r =>
            r.status === 'PAID' &&
            r.processedAt &&
            new Date(r.processedAt).toDateString() === today
        ).reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

        setStats({
            pending: pending.length,
            totalPending,
            paidToday
        });
    };

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleProcessPayment = async () => {
        if (!selectedRequest) return;
        if (!paymentForm.paymentReference) {
            alert('Please enter a payment reference');
            return;
        }

        setProcessing(true);
        try {
            await dispatchPaymentService.processPayment(selectedRequest.requestId, {
                paymentMethod: paymentForm.paymentMethod,
                paymentReference: paymentForm.paymentReference,
                amountPaid: selectedRequest.amount,
                notes: paymentForm.notes
            });

            setShowPaymentModal(false);
            setSelectedRequest(null);
            setPaymentForm({ paymentMethod: 'BANK_TRANSFER', paymentReference: '', notes: '' });
            fetchRequests();
        } catch (err) {
            console.error('Payment processing failed:', err);
            alert(err.response?.data?.message || 'Failed to process payment');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async (requestId, reason) => {
        try {
            await dispatchPaymentService.rejectRequest(requestId, reason || 'Rejected by manager');
            fetchRequests();
        } catch (err) {
            console.error('Rejection failed:', err);
            alert('Failed to reject request');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredRequests = requests.filter(r => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            r.dispatchNo?.toLowerCase().includes(q) ||
            r.supplierName?.toLowerCase().includes(q) ||
            r.invoiceNo?.toLowerCase().includes(q)
        );
    }).sort((a, b) => {
        const priorityA = PRIORITY_CONFIG[a.priority]?.order || 3;
        const priorityB = PRIORITY_CONFIG[b.priority]?.order || 3;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dispatch Payments</h1>
                    <p className="text-gray-500 mt-1">Manage and process supplier payment requests</p>
                </div>
                <button
                    onClick={fetchRequests}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-5 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Pending Payments</p>
                            <p className="text-3xl font-bold mt-1">{stats.pending}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-amber-100 text-sm font-medium">Total Pending Amount</p>
                            <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalPending)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-emerald-100 text-sm font-medium">Paid Today</p>
                            <p className="text-2xl font-bold mt-1">{formatCurrency(stats.paidToday)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 flex flex-col md:flex-row gap-4">
                <div className="flex gap-2">
                    {[
                        { key: 'pending', label: 'Pending' },
                        { key: 'paid', label: 'Paid' },
                        { key: 'all', label: 'All' }
                    ].map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.key
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                        placeholder="Search by Dispatch No, Supplier, or Invoice..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        <span className="ml-3 text-gray-600">Loading payment requests...</span>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <Receipt className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700">No Payment Requests</h3>
                        <p className="text-gray-500 mt-1">
                            {filter === 'pending'
                                ? 'No pending payment requests at the moment.'
                                : 'No payment requests match your criteria.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Dispatch / Invoice</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Supplier</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Request Date</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Priority</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Due Date</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Paid Date</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Paid By</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-right px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRequests.map((request) => {
                                    const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG['PENDING'];
                                    const StatusIcon = statusConfig.icon;
                                    const priorityConfig = PRIORITY_CONFIG[request.priority] || PRIORITY_CONFIG['NORMAL'];
                                    const isActionable = ['TRANSFERRED_TO_MANAGER', 'PROCESSING'].includes(request.status);

                                    return (
                                        <tr key={request.requestId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-800">{request.dispatchNo}</div>
                                                <div className="text-sm text-gray-500">{request.invoiceNo || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Building className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-700">{request.supplierName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 text-sm">
                                                {formatDate(request.createdAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-gray-800">
                                                    {formatCurrency(request.amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-bold rounded ${priorityConfig.color}`}>
                                                    {priorityConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 text-sm">
                                                {formatDate(request.dueDate)?.split(',')[0] || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 text-sm">
                                                {request.status === 'PAID' ? formatDate(request.processedAt) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 text-sm">
                                                {request.status === 'PAID' ? (request.processedByName || 'Manager') : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusConfig.color}`}>
                                                    <StatusIcon className="w-3 h-3 inline mr-1" />
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {isActionable && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedRequest(request);
                                                                setShowPaymentModal(true);
                                                            }}
                                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            Process Payment
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const reason = prompt('Enter rejection reason:');
                                                                if (reason) handleReject(request.requestId, reason);
                                                            }}
                                                            className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                                {request.status === 'PAID' && (
                                                    <span className="text-sm text-emerald-600 font-medium">
                                                        ✓ Completed
                                                    </span>
                                                )}
                                                {request.status === 'REJECTED' && (
                                                    <span className="text-sm text-red-600 font-medium">
                                                        ✕ Rejected
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Process Payment Modal */}
            {showPaymentModal && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">Process Payment</h3>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="p-1 rounded hover:bg-white/20 text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="bg-emerald-50 rounded-lg p-4 mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-gray-800">{selectedRequest.dispatchNo}</span>
                                    <span className="text-sm text-gray-600">{selectedRequest.invoiceNo}</span>
                                </div>
                                <div className="text-sm text-gray-600">{selectedRequest.supplierName}</div>
                                <div className="text-2xl font-bold text-emerald-700 mt-2">
                                    {formatCurrency(selectedRequest.amount)}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Payment Method
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {PAYMENT_METHODS.map((method) => {
                                            const MethodIcon = method.icon;
                                            return (
                                                <button
                                                    key={method.value}
                                                    onClick={() => setPaymentForm(prev => ({ ...prev, paymentMethod: method.value }))}
                                                    className={`p-3 rounded-lg border-2 text-center transition-all ${paymentForm.paymentMethod === method.value
                                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                        }`}
                                                >
                                                    <MethodIcon className="w-5 h-5 mx-auto mb-1" />
                                                    <span className="text-xs font-medium">{method.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Payment Reference / Transaction ID *
                                    </label>
                                    <input
                                        type="text"
                                        value={paymentForm.paymentReference}
                                        onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentReference: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="Enter reference number"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={paymentForm.notes}
                                        onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="Add payment notes..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleProcessPayment}
                                    disabled={processing || !paymentForm.paymentReference}
                                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Confirm Payment
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
