import React, { useState, useEffect, useCallback } from 'react';
import useEscapeClose from '../../hooks/useEscapeClose';
import {
    X, Receipt, Clock, CheckCircle,
    DollarSign, Loader2, RefreshCw, Banknote,
    FileText,
    Shield, CornerUpLeft
} from 'lucide-react';
import { poService } from '../../services/poService';
import { authService } from '../../services/authService';
import { printSupplierPaymentReceipt } from '../../utils/receiptPrinter';

export default function SupplierPaymentModal({ isOpen, onClose, onNotification }) {
    useEscapeClose(onClose, isOpen);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showPayModal, setShowPayModal] = useState(false);
    const [paying, setPaying] = useState(false);

    // Supervisor credentials for payout
    const [supervisorCreds, setSupervisorCreds] = useState({
        username: '',
        password: ''
    });

    // Payment form
    const [paymentForm, setPaymentForm] = useState({
        paymentMethod: 'CASH',
        paymentReference: '',
        notes: ''
    });

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await poService.getPOsByStatus('TRANSFERRED_TO_CASHIER');
            const data = res.data || [];
            setRequests(data);
        } catch (err) {
            console.error('Failed to fetch payment requests:', err);
            onNotification?.('error', 'Error', 'Failed to load supplier payment requests');
        } finally {
            setLoading(false);
        }
    }, [onNotification]);

    useEffect(() => {
        if (isOpen) {
            fetchRequests();
        }
    }, [isOpen, fetchRequests]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape') {
                if (showPayModal) {
                    setShowPayModal(false);
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, showPayModal, onClose]);

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (e.target.tagName === 'TEXTAREA') return;
            e.preventDefault();
            const formElements = Array.from(document.querySelectorAll('.pay-modal-input'));
            const index = formElements.indexOf(e.target);
            if (index > -1 && index < formElements.length - 1) {
                formElements[index + 1].focus();
            } else if (index === formElements.length - 1) {
                if (!paying && supervisorCreds.username && supervisorCreds.password) {
                    handlePayRequest();
                }
            }
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
            // Verify supervisor credentials
            const authRes = await authService.login({
                username: supervisorCreds.username,
                password: supervisorCreds.password
            });
            const approver = authRes.data || authRes;

            const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'SUPERVISOR'];
            const approverRole = (approver.role || approver.userRole || "").toUpperCase();

            if (!allowedRoles.includes(approverRole)) {
                throw new Error(`Access Denied: ${approverRole} cannot authorize payouts.`);
            }

            await poService.processPOPayment(selectedRequest.poId, {
                status: 'PAID',
                paymentMethod: paymentForm.paymentMethod,
                paymentReference: paymentForm.paymentReference,
                notes: paymentForm.notes,
                supervisorUsername: supervisorCreds.username
            });

            let currentUser = {};
            try {
                currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            } catch {
                currentUser = {};
            }

            await printSupplierPaymentReceipt({
                poNumber: selectedRequest.poNo,
                supplierName: selectedRequest.supplierName || selectedRequest.supplier || selectedRequest.supplierId,
                amount: Number(selectedRequest.netAmount || 0),
                paymentMethod: paymentForm.paymentMethod,
                paymentReference: paymentForm.paymentReference,
                notes: paymentForm.notes,
                cashierName: currentUser.fullName || currentUser.name || currentUser.username || 'Cashier',
                supervisorName: supervisorCreds.username,
                branchInfo: {
                    name: selectedRequest.branchName || currentUser.branchName || '',
                    address: selectedRequest.branchAddress || currentUser.branchAddress || '',
                    contact: selectedRequest.branchPhone || currentUser.phone || ''
                },
                timestamp: new Date().toISOString()
            });

            onNotification?.('success', 'Payout Successful', 'Supplier payment processed from till');
            setShowPayModal(false);
            setSelectedRequest(null);
            setSupervisorCreds({ username: '', password: '' });
            setPaymentForm({
                paymentMethod: 'CASH',
                paymentReference: '',
                notes: ''
            });
            fetchRequests();
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Payout failed';
            onNotification?.('error', 'Payout Failed', msg);
        } finally {
            setPaying(false);
        }
    };

    const openPayModal = (request) => {
        setSelectedRequest(request);
        setPaymentForm({
            paymentMethod: 'CASH',
            paymentReference: '',
            notes: ''
        });
        setShowPayModal(true);
    };

    const handleSendToManager = async (request) => {
        try {
            await poService.processPOPayment(request.poId, {
                status: 'APPROVED'
            });
            onNotification?.('success', 'Sent to Manager', `Payment request ${request.poNo} returned to manager.`);
            fetchRequests();
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Failed to return request';
            onNotification?.('error', 'Error', msg);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    if (!isOpen) return null;

    const isSubModalOpen = showPayModal;

    return (
        <>
            {/* Main Modal */}
            {!isSubModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Receipt className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Supplier Payment Requests</h2>
                                    <p className="text-sm text-blue-100">
                                        {requests.length} pending cash payouts
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

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                    <span className="ml-3 text-gray-600">Loading payment requests...</span>
                                </div>
                            ) : requests.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                                    <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                                        <Receipt className="w-8 h-8 text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-700">No Supplier Payouts</h3>
                                    <p className="text-gray-500 mt-1">When managers transfer payments to the cashier, they will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {requests.map((request) => (
                                        <div
                                            key={request.poId}
                                            className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="font-bold text-gray-800 text-lg">{request.poNo}</span>
                                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                                                        <Clock className="w-3 h-3 inline mr-1" />
                                                        Pending Payout
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-600 font-medium">
                                                    Authorised on: {request.poDate}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Payable Amount</div>
                                                    <div className="font-bold text-xl text-emerald-600">
                                                        {formatCurrency(request.netAmount)}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 min-w-[160px]">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openPayModal(request);
                                                        }}
                                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm font-semibold transition-colors text-sm w-full"
                                                    >
                                                        <Banknote className="w-4 h-4" />
                                                        Process Payout
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm("Are you sure you want to send this back to the manager?")) {
                                                                handleSendToManager(request);
                                                            }
                                                        }}
                                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg shadow-sm font-semibold transition-colors text-sm w-full"
                                                    >
                                                        <CornerUpLeft className="w-4 h-4" />
                                                        Send to Manager
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Pay Modal */}
            {showPayModal && selectedRequest && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-4 flex items-center justify-between shrink-0">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Banknote className="w-5 h-5" />
                                Process Supplier Payout
                            </h3>
                            <button
                                onClick={() => setShowPayModal(false)}
                                className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(100vh-120px)]">
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6 relative overflow-hidden">
                                <DollarSign className="w-24 h-24 absolute -right-4 -bottom-4 text-emerald-500 opacity-10" />
                                <div className="text-sm text-emerald-800 font-medium mb-1">
                                    {selectedRequest.poNo}
                                </div>
                                <div className="text-3xl font-extrabold text-emerald-700 tracking-tight">
                                    {formatCurrency(selectedRequest.netAmount)}
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                        Payment Method
                                    </label>
                                    <select
                                        autoFocus
                                        value={paymentForm.paymentMethod}
                                        onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                        onKeyDown={handleInputKeyDown}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm transition-colors pay-modal-input"
                                    >
                                        <option value="CASH">Cash (from Till)</option>
                                        <option value="BANK_TRANSFER">Bank Transfer</option>
                                    </select>
                                </div>

                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Shield className="w-5 h-5 text-amber-600" />
                                        <span className="text-sm text-amber-800 font-bold">
                                            Supervisor Authorization Required
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <input
                                                type="text"
                                                value={supervisorCreds.username}
                                                onChange={(e) => setSupervisorCreds(prev => ({ ...prev, username: e.target.value }))}
                                                onKeyDown={handleInputKeyDown}
                                                className="w-full px-4 py-2.5 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-amber-50/50 shadow-sm transition-colors placeholder:text-amber-300 pay-modal-input"
                                                placeholder="Supervisor Username"
                                                autoComplete="off"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="password"
                                                value={supervisorCreds.password}
                                                onChange={(e) => setSupervisorCreds(prev => ({ ...prev, password: e.target.value }))}
                                                onKeyDown={handleInputKeyDown}
                                                className="w-full px-4 py-2.5 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-amber-50/50 shadow-sm transition-colors placeholder:text-amber-300 pay-modal-input"
                                                placeholder="Supervisor Password"
                                                autoComplete="off"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <textarea
                                        value={paymentForm.notes}
                                        onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                                        onKeyDown={(e) => {
                                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                                e.preventDefault();
                                                if (!paying && supervisorCreds.username && supervisorCreds.password) {
                                                    handlePayRequest();
                                                }
                                            }
                                        }}
                                        rows={2}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 shadow-sm transition-colors resize-none placeholder:text-gray-400 pay-modal-input"
                                        placeholder="Add payment notes (optional)"
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowPayModal(false)}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 transition-colors shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handlePayRequest}
                                disabled={paying || !supervisorCreds.username || !supervisorCreds.password}
                                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                {paying ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Banknote className="w-5 h-5" />
                                        Confirm Payout
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
