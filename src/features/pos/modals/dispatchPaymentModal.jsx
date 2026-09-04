import React, { useState, useEffect, useCallback } from 'react';
import useEscapeClose from '@/shared/hooks/useEscapeClose';
import {
    X, Receipt, Clock, AlertTriangle, CheckCircle,
    Send, DollarSign, Building, Calendar, User,
    Shield, ArrowRight, Loader2, RefreshCw, Banknote,
    CreditCard, FileText, Hash, ExternalLink
} from 'lucide-react';
import { grnPaymentService } from '@/features/pos/services/grnPaymentService';

const STATUS_CONFIG = {
    'PENDING': {
        label: 'Pending',
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: Clock
    },
    'SUPERVISOR_APPROVED': {
        label: 'Supervisor Approved',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: Shield
    },
    'TRANSFERRED_TO_MANAGER': {
        label: 'Sent to Manager',
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
    'URGENT': { label: 'Urgent', color: 'bg-red-500 text-white' },
    'HIGH': { label: 'High', color: 'bg-orange-500 text-white' },
    'NORMAL': { label: 'Normal', color: 'bg-blue-500 text-white' },
    'LOW': { label: 'Low', color: 'bg-gray-500 text-white' }
};

const PAYMENT_METHODS = [
    { value: 'CASH', label: 'Cash', icon: Banknote },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Building },
    { value: 'CHEQUE', label: 'Cheque', icon: FileText },
    { value: 'CARD', label: 'Card', icon: CreditCard }
];

export default function DispatchPaymentModal({ isOpen, onClose, branchId, onNotification }) {
    useEscapeClose(onClose, isOpen);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);
    const [transferring, setTransferring] = useState(false);
    const [paying, setPaying] = useState(false);

    const [supervisorCreds, setSupervisorCreds] = useState({
        username: '',
        password: ''
    });
    const [transferNotes, setTransferNotes] = useState('');
    const [transferPriority, setTransferPriority] = useState('NORMAL');

    const [paymentForm, setPaymentForm] = useState({
        paymentMethod: 'CASH',
        paymentReference: '',
        amountPaid: 0,
        notes: ''
    });

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await grnPaymentService.getPaymentRequestsByBranch(branchId);
            const data = res.data?.data || res.data || [];
            setRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch payment requests:', err);
            onNotification?.('error', 'Error', 'Failed to load payment requests');
        } finally {
            setLoading(false);
        }
    }, [branchId, onNotification]);

    useEffect(() => {
        if (isOpen) {
            fetchRequests();
        }
    }, [isOpen, fetchRequests]);

    const handleTransferToManager = async () => {
        if (!selectedRequest) return;
        if (!supervisorCreds.username || !supervisorCreds.password) {
            onNotification?.('error', 'Validation Error', 'Please enter supervisor credentials');
            return;
        }

        setTransferring(true);
        try {
            await grnPaymentService.transferToManager(selectedRequest.requestId, {
                supervisorUsername: supervisorCreds.username,
                supervisorPassword: supervisorCreds.password,
                notes: transferNotes,
                priority: transferPriority
            });

            onNotification?.('success', 'Transferred', 'Payment request sent to manager');
            setShowTransferModal(false);
            setSelectedRequest(null);
            setSupervisorCreds({ username: '', password: '' });
            setTransferNotes('');
            setTransferPriority('NORMAL');
            fetchRequests();
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Transfer failed';
            onNotification?.('error', 'Transfer Failed', msg);
        } finally {
            setTransferring(false);
        }
    };

    const handlePayRequest = async () => {
        if (!selectedRequest) return;
        if (!supervisorCreds.username || !supervisorCreds.password) {
            onNotification?.('error', 'Validation Error', 'Please enter supervisor credentials');
            return;
        }

        setPaying(true);
        try {
            await grnPaymentService.transferToManager(selectedRequest.requestId, {
                supervisorUsername: supervisorCreds.username,
                supervisorPassword: supervisorCreds.password,
                notes: `PAYOUT REQUEST\n${paymentForm.notes}\nPayment Method: ${paymentForm.paymentMethod}\nReference: ${paymentForm.paymentReference || 'N/A'}`,
                priority: 'HIGH'
            });

            onNotification?.('success', 'Payout Requested', 'Payment request sent to manager for payout approval');
            setShowPayModal(false);
            setSelectedRequest(null);
            setSupervisorCreds({ username: '', password: '' });
            setPaymentForm({
                paymentMethod: 'CASH',
                paymentReference: '',
                amountPaid: 0,
                notes: ''
            });
            fetchRequests();
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Payout request failed';
            onNotification?.('error', 'Payout Failed', msg);
        } finally {
            setPaying(false);
        }
    };

    const openTransferModal = (request) => {
        setSelectedRequest(request);
        setShowTransferModal(true);
    };

    const openPayModal = (request) => {
        setSelectedRequest(request);
        setPaymentForm({
            paymentMethod: 'CASH',
            paymentReference: '',
            amountPaid: request.amount,
            notes: ''
        });
        setShowPayModal(true);
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
            day: 'numeric'
        });
    };

    if (!isOpen) return null;

    const pendingRequests = requests.filter(r => r.status === 'PENDING' || r.status === 'SUPERVISOR_APPROVED');
    const processedRequests = requests.filter(r => !['PENDING', 'SUPERVISOR_APPROVED'].includes(r.status));

    const isSubModalOpen = showPayModal || showTransferModal;

    return (
        <>
            {!isSubModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Receipt className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">GRN Payment Requests</h2>
                                    <p className="text-sm text-indigo-100">
                                        {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={fetchRequests}
                                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                                    title="Refresh"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                    <span className="ml-3 text-gray-600">Loading payment requests...</span>
                                </div>
                            ) : requests.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                        <Receipt className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-700">No Payment Requests</h3>
                                    <p className="text-gray-500 mt-1">When GRNs are posted, payment requests will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {pendingRequests.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                                                Pending Requests ({pendingRequests.length})
                                            </h3>
                                            <div className="space-y-3">
                                                {pendingRequests.map((request) => {
                                                    const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG['PENDING'];
                                                    const StatusIcon = statusConfig.icon;
                                                    const priorityConfig = PRIORITY_CONFIG[request.priority] || PRIORITY_CONFIG['NORMAL'];

                                                    return (
                                                        <div
                                                            key={request.requestId}
                                                            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <span className="font-bold text-gray-800">{request.grnNo}</span>
                                                                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${priorityConfig.color}`}>
                                                                            {priorityConfig.label}
                                                                        </span>
                                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${statusConfig.color}`}>
                                                                            <StatusIcon className="w-3 h-3 inline mr-1" />
                                                                            {statusConfig.label}
                                                                        </span>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                                        <div className="flex items-center gap-2 text-gray-600">
                                                                            <Building className="w-4 h-4 text-gray-400" />
                                                                            <span>{request.supplierName}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-gray-600">
                                                                            <DollarSign className="w-4 h-4 text-gray-400" />
                                                                            <span className="font-semibold text-gray-800">
                                                                                {formatCurrency(request.amount)}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-gray-600">
                                                                            <Calendar className="w-4 h-4 text-gray-400" />
                                                                            <span>Due: {formatDate(request.dueDate)}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-gray-600">
                                                                            <Receipt className="w-4 h-4 text-gray-400" />
                                                                            <span>{request.invoiceNo || '-'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openPayModal(request);
                                                                        }}
                                                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                                                                    >
                                                                        <Banknote className="w-4 h-4" />
                                                                        Pay
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openTransferModal(request);
                                                                        }}
                                                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                                                                    >
                                                                        <Send className="w-4 h-4" />
                                                                        Transfer
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {processedRequests.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                                                Processed ({processedRequests.length})
                                            </h3>
                                            <div className="space-y-2">
                                                {processedRequests.slice(0, 5).map((request) => {
                                                    const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG['PENDING'];
                                                    const StatusIcon = statusConfig.icon;

                                                    return (
                                                        <div
                                                            key={request.requestId}
                                                            className="bg-gray-50 border border-gray-100 rounded-lg p-3 flex items-center justify-between"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-medium text-gray-700">{request.grnNo}</span>
                                                                <span className="text-gray-500">{request.supplierName}</span>
                                                                <span className="font-semibold text-gray-800">
                                                                    {formatCurrency(request.amount)}
                                                                </span>
                                                            </div>
                                                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusConfig.color}`}>
                                                                <StatusIcon className="w-3 h-3 inline mr-1" />
                                                                {statusConfig.label}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showPayModal && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Banknote className="w-5 h-5 text-emerald-600" />
                                Process Payout
                            </h3>
                            <button
                                onClick={() => setShowPayModal(false)}
                                className="p-1 rounded hover:bg-gray-100"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="bg-emerald-50 rounded-lg p-3 mb-4">
                            <div className="text-sm text-gray-600">
                                <strong>{selectedRequest.grnNo}</strong> - {selectedRequest.supplierName}
                            </div>
                            <div className="text-lg font-bold text-emerald-700 mt-1">
                                {formatCurrency(selectedRequest.amount)}
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                    Payment Method
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {PAYMENT_METHODS.map((method) => {
                                        const Icon = method.icon;
                                        return (
                                            <button
                                                key={method.value}
                                                type="button"
                                                onClick={() => setPaymentForm(prev => ({ ...prev, paymentMethod: method.value }))}
                                                className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${paymentForm.paymentMethod === method.value
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span className="text-sm font-medium">{method.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">
                                    Reference Number
                                </label>
                                <input
                                    type="text"
                                    value={paymentForm.paymentReference}
                                    onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentReference: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                    placeholder="Cheque no, transfer ref, etc."
                                    autoComplete="off"
                                />
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <Shield className="w-5 h-5 text-amber-600" />
                                <span className="text-sm text-amber-800 font-medium">
                                    Supervisor approval required for payout
                                </span>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">
                                    Supervisor Username
                                </label>
                                <input
                                    type="text"
                                    value={supervisorCreds.username}
                                    onChange={(e) => setSupervisorCreds(prev => ({ ...prev, username: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                    placeholder="Enter supervisor username"
                                    autoComplete="off"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">
                                    Supervisor Password
                                </label>
                                <input
                                    type="password"
                                    value={supervisorCreds.password}
                                    onChange={(e) => setSupervisorCreds(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                                    placeholder="Enter supervisor password"
                                    autoComplete="off"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                                    placeholder="Payment notes..."
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowPayModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handlePayRequest}
                                disabled={paying || !supervisorCreds.username || !supervisorCreds.password}
                                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {paying ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Banknote className="w-4 h-4" />
                                        Request Payout
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showTransferModal && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Transfer to Manager</h3>
                            <button
                                onClick={() => setShowTransferModal(false)}
                                className="p-1 rounded hover:bg-gray-100"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="bg-indigo-50 rounded-lg p-3 mb-4">
                            <div className="text-sm text-gray-600">
                                <strong>{selectedRequest.grnNo}</strong> - {selectedRequest.supplierName}
                            </div>
                            <div className="text-lg font-bold text-indigo-700 mt-1">
                                {formatCurrency(selectedRequest.amount)}
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <Shield className="w-5 h-5 text-amber-600" />
                                <span className="text-sm text-amber-800 font-medium">
                                    Supervisor approval required
                                </span>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">
                                    Supervisor Username
                                </label>
                                <input
                                    type="text"
                                    value={supervisorCreds.username}
                                    onChange={(e) => setSupervisorCreds(prev => ({ ...prev, username: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    placeholder="Enter supervisor username"
                                    autoComplete="off"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">
                                    Supervisor Password
                                </label>
                                <input
                                    type="password"
                                    value={supervisorCreds.password}
                                    onChange={(e) => setSupervisorCreds(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    placeholder="Enter supervisor password"
                                    autoComplete="off"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">
                                    Priority
                                </label>
                                <select
                                    value={transferPriority}
                                    onChange={(e) => setTransferPriority(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                >
                                    <option value="LOW">Low</option>
                                    <option value="NORMAL">Normal</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={transferNotes}
                                    onChange={(e) => setTransferNotes(e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                                    placeholder="Add any notes for the manager..."
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowTransferModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleTransferToManager}
                                disabled={transferring || !supervisorCreds.username || !supervisorCreds.password}
                                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {transferring ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Transferring...
                                    </>
                                ) : (
                                    <>
                                        <ArrowRight className="w-4 h-4" />
                                        Transfer to Manager
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
