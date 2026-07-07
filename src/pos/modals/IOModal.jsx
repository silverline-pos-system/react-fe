import React, { useEffect, useRef, useState } from 'react';
import useEscapeClose from '../../hooks/useEscapeClose';
import { ArrowUpRight, ArrowDownLeft, X, Loader2 } from 'lucide-react';
import { posService } from '../../services/posService';
import { getMyApprovals } from '../../services/managerService';
import { printPayInOutReceipt } from '../../utils/receiptPrinter';

export default function IOModal({ type, shiftId, cashierName, branchInfo, onClose, onNotify }) {
  useEscapeClose(onClose);
  const inputRef = useRef(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
    const [takenByManager, setTakenByManager] = useState(false);
  const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('REQUEST');
    const [payoutRequests, setPayoutRequests] = useState([]);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [processingPayoutId, setProcessingPayoutId] = useState(null);
    const [processedPayoutIds, setProcessedPayoutIds] = useState(() => {
        try {
            const raw = localStorage.getItem('pos_processed_paid_out');
            const parsed = raw ? JSON.parse(raw) : [];
            const values = Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
            return new Set(values);
        } catch {
            return new Set();
        }
    });

  const isPaidIn = type === 'PAID_IN';
  const Icon = isPaidIn ? ArrowUpRight : ArrowDownLeft;

    const getApprovalRows = (payload) => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.data?.data)) return payload.data.data;
        if (Array.isArray(payload?.rows)) return payload.rows;
        return [];
    };

    const getCashFlowRows = (payload) => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.data?.data)) return payload.data.data;
        if (Array.isArray(payload?.rows)) return payload.rows;
        return [];
    };

    const parsePayloadJson = (row) => {
        const raw = row?.payload_json ?? row?.payloadJson ?? row?.payload;
        if (!raw) return {};
        if (typeof raw === 'object') return raw;
        if (typeof raw !== 'string') return {};
        try {
            return JSON.parse(raw);
        } catch {
            return {};
        }
    };

    const toPaidOutKey = (row) => {
        // Preference: flowId (CashFlow) or referenceId (Approval)
        const id = row?.flowId ?? row?.flow_id ?? row?.referenceId ?? row?.reference_id ?? row?.approvalId ?? row?.approval_id ?? row?.id;
        if (id) return String(id);
        
        // Fallback to reference number
        if (row?.referenceNo || row?.reference_no) {
            const ref = String(row?.referenceNo || row?.reference_no);
            if (ref.startsWith('CF-')) return ref.substring(3);
            return ref;
        }
        
        return `${row?.amount || 0}-${row?.createdAt || row?.created_at || ''}`;
    };

    const isPaidOutApproval = (row) => {
        const category = String(row?.category || row?.approvalCategory || '').toUpperCase();
        const type = String(row?.type || row?.flowType || row?.approvalType || '').toUpperCase();
        const payload = parsePayloadJson(row);
        const payloadType = String(payload?.type || payload?.flowType || payload?.cashFlowType || '').toUpperCase();
        const text = `${row?.reason || ''} ${row?.description || ''} ${row?.notes || ''} ${row?.requestNotes || ''} ${row?.request_notes || ''} ${row?.approvalNotes || ''} ${row?.approval_notes || ''}`.toUpperCase();
        const isPaidOutLike =
            category.includes('PAID_OUT') ||
            category.includes('CASH_FLOW_PAID_OUT') ||
            type.includes('PAID_OUT') ||
            (type.includes('CASH_FLOW') && payloadType.includes('PAID_OUT')) ||
            payloadType.includes('PAID_OUT') ||
            text.includes('PAID_OUT') ||
            text.includes('PAYOUT') ||
            text.includes('CASH OUT') ||
            text.includes('CASH_OUT');
        return isPaidOutLike;
    };

    const isPaidOutCashFlow = (row) => {
        const flowType = String(row?.type || row?.flowType || row?.cashFlowType || '').toUpperCase();
        return flowType === 'PAID_OUT';
    };

    const fetchPayoutRequests = async () => {
        try {
            setRequestsLoading(true);
            const merged = [];

            // 1. Fetch manager approvals specifically for this user
            try {
                const approvalsRes = await getMyApprovals();
                const approvalRows = getApprovalRows(approvalsRes).filter(isPaidOutApproval);
                approvalRows.forEach((row) => {
                    const id = toPaidOutKey(row);
                    merged.push({
                        id,
                        referenceId: row.referenceId,
                        referenceNo: row.referenceNo || row.reference || `APP-${row.id}`,
                        amount: Number(row.amount || 0),
                        reason: row.reason || row.description || row.notes || row.requestNotes || row.request_notes || row.approvalNotes || row.approval_notes || 'Payout Request',
                        status: String(row.status || 'PENDING').toUpperCase(),
                        createdAt: row.time || row.createdAt || row.created_at,
                        isFromApproval: true
                    });
                });
            } catch (err) {
                if (err?.response?.status !== 403) {
                    console.error('Failed to fetch manager approvals in Paid Out modal:', err);
                }
            }

            // 2. Fetch local shift cash flows
            if (shiftId) {
                try {
                    const cashFlowRes = await posService.getShiftCashFlows(shiftId);
                    const cashFlowRows = getCashFlowRows(cashFlowRes).filter(isPaidOutCashFlow);
                    cashFlowRows.forEach((row) => {
                        const flowId = String(row.flowId || row.id);
                        // Try to find if we already added an approval that points to this flowId
                        const existingIndex = merged.findIndex(m => String(m.referenceId) === flowId || m.id === flowId);

                        if (existingIndex === -1) {
                            merged.push({
                                id: flowId,
                                referenceNo: row.referenceNo || `CF-${flowId}`,
                                amount: Number(row.amount || 0),
                                reason: row.reason || 'Payout Request',
                                status: String(row.status || 'PENDING').toUpperCase(),
                                createdAt: row.createdAt || row.created_at,
                                isFromCashFlow: true
                            });
                        }
                    });
                } catch (err) {
                    console.error('Failed to fetch shift cash flows in Paid Out modal:', err);
                }
            }

            const isToday = (dateStr) => {
                if (!dateStr) return false;
                try {
                    const date = new Date(dateStr);
                    if (isNaN(date.getTime())) return false;
                    const today = new Date();
                    return date.getDate() === today.getDate() &&
                        date.getMonth() === today.getMonth() &&
                        date.getFullYear() === today.getFullYear();
                } catch {
                    return false;
                }
            };

            // Deduplicate and sort by newest first
            const dedup = new Map();
            merged.forEach(item => {
                if (!dedup.has(item.id)) {
                    dedup.set(item.id, item);
                }
            });

            const rows = Array.from(dedup.values())
                .filter((r) => isToday(r.createdAt))
                .sort((a, b) => {
                    const ta = new Date(a.createdAt || 0).getTime();
                    const tb = new Date(b.createdAt || 0).getTime();
                    return tb - ta;
                });

            console.log("Deduplicated Today Payout Rows:", rows);
            setPayoutRequests(rows);
        } catch (err) {
            console.error('Failed to fetch payout requests:', err);
            setPayoutRequests([]);
        } finally {
            setRequestsLoading(false);
        }
    };

    const handleProcessApprovedPayout = async (row) => {
        try {
            setProcessingPayoutId(row.id);
            const payoutAmount = Number(row.amount || 0);
            const reasonText = String(row.reason || row.description || row.notes || 'Approved payout').replace(/\[TAKEN_BY_MANAGER\]\s*/gi, '').trim();

            await printPayInOutReceipt({
                type: 'PAID_OUT',
                amount: payoutAmount,
                reason: reasonText,
                referenceNo: row.referenceNo || row.id,
                cashierName: cashierName || '--',
                branchInfo,
            });

            setProcessedPayoutIds((prev) => {
                const next = new Set(prev);
                next.add(String(row.id));
                localStorage.setItem('pos_processed_paid_out', JSON.stringify(Array.from(next)));
                return next;
            });

            setPayoutRequests((prev) => prev.filter((item) => item.id !== row.id));
            onNotify('success', 'Payout Completed', `Paid-out receipt printed for approval #${row.id}.`);
        } catch (err) {
            console.error('Failed to process approved payout from modal:', err);
            onNotify('error', 'Payout Failed', err?.message || 'Failed to print payout receipt.');
        } finally {
            setProcessingPayoutId(null);
        }
    };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

    useEffect(() => {
        if (!isPaidIn && viewMode === 'APPROVED') {
            fetchPayoutRequests();
        }
    }, [isPaidIn, viewMode, processedPayoutIds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        onNotify('error', 'Invalid Amount', 'Please enter a valid amount greater than 0.');
        return;
    }

    const normalizedReason = reason.trim();
    if (!normalizedReason) {
        onNotify('error', 'Reason Required', 'Please enter a reason for this transaction.');
        return;
    }

    if (!shiftId) {
        onNotify('error', 'No Active Shift', 'Cannot record cash flow without an active shift.');
        return;
    }

        const reasonForApi = !isPaidIn && takenByManager
            ? `[TAKEN_BY_MANAGER] ${normalizedReason}`
            : normalizedReason;

    setLoading(true);

    try {
        // Record cash flow to backend - matches cash_flows table
        await posService.recordCashFlow({
            shiftId: shiftId,
            amount: parsedAmount,
            type: type, // PAID_IN or PAID_OUT
            reason: reasonForApi,
            referenceNo: referenceNo.trim() || null,
            takenByManager: !isPaidIn ? takenByManager : false,
        });

        // Print immediately only for Paid In. Paid Out receipt is printed after manager approval.
        if (isPaidIn) {
            printPayInOutReceipt({
                type,
                amount: parsedAmount,
                reason: normalizedReason,
                referenceNo: referenceNo.trim() || null,
                cashierName: cashierName || '--',
                branchInfo,
            });
        }

        // Success notification
        const title = isPaidIn ? 'Cash In Recorded' : 'Cash Out Requested';
        const msg = isPaidIn
            ? `Amount: LKR ${parsedAmount.toFixed(2)} | Reason: ${normalizedReason}`
            : `Payout request submitted. Print will happen after manager approval.${takenByManager ? ' | Taken by manager' : ''}`;
        
        onNotify('success', title, msg);
        onClose();
    } catch (err) {
        console.error("Cash flow error:", err);
        const errorMsg = err.response?.data?.message || 'Failed to record cash flow';
        onNotify('error', 'Transaction Failed', errorMsg);
        setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px]">
                <div className={`bg-white ${!isPaidIn ? 'w-[760px]' : 'w-[420px]'} max-w-[95vw] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}>
            {/* Header */}
            <div className={`px-4 py-3 flex justify-between items-center ${isPaidIn ? 'bg-blue-900' : 'bg-red-900'}`}>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${isPaidIn ? 'text-blue-300' : 'text-red-300'}`} />
                    {isPaidIn ? 'Paid In (Cash In)' : 'Paid Out (Cash Out)'}
                </h3>
                <button onClick={onClose} className="text-white/60 hover:text-white">
                    <X className="w-5 h-5"/>
                </button>
            </div>

                        {!isPaidIn && (
                            <div className="px-4 pt-3 pb-2 bg-red-50 border-b border-red-100">
                                <div className="inline-flex rounded-lg bg-white border border-red-100 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('REQUEST')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                                            viewMode === 'REQUEST' ? 'bg-red-600 text-white' : 'text-red-700 hover:bg-red-100'
                                        }`}
                                    >
                                        New Request
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('APPROVED')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                                            viewMode === 'APPROVED' ? 'bg-red-600 text-white' : 'text-red-700 hover:bg-red-100'
                                        }`}
                                    >
                                        Status
                                    </button>
                                </div>
                            </div>
                        )}
            
            {/* Form */}
                        {isPaidIn || viewMode === 'REQUEST' ? (
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Description */}
                <div className={`p-3 rounded-lg border ${isPaidIn ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
                    <p className={`text-xs ${isPaidIn ? 'text-blue-700' : 'text-red-700'}`}>
                        {isPaidIn 
                            ? 'Record cash being added to the register (e.g., change from bank, petty cash)'
                            : 'Record cash being removed from the register (e.g., expenses, cash pickups)'
                        }
                    </p>
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount *</label>
                    <div className={`flex items-center border rounded-lg bg-white px-3 py-2 focus-within:ring-2 ${
                        isPaidIn ? 'border-blue-300 focus-within:border-blue-500 focus-within:ring-blue-100' 
                                 : 'border-red-300 focus-within:border-red-500 focus-within:ring-red-100'
                    }`}>
                        <span className="text-slate-400 font-mono mr-2">LKR</span>
                        <input 
                            ref={inputRef}
                            type="number" 
                            step="0.01"
                            min="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={loading}
                            className="bg-transparent w-full text-xl font-mono font-bold text-slate-900 focus:outline-none" 
                            placeholder="0.00" 
                        />
                    </div>
                </div>

                {/* Reason */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reason / Description *</label>
                    <textarea 
                        rows="2" 
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        disabled={loading}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" 
                        placeholder="Enter reason for this transaction..."
                    ></textarea>
                </div>

                {/* Reference No (Optional) */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Reference No. <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input 
                        type="text"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        disabled={loading}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" 
                        placeholder="Receipt/Voucher number..."
                    />
                </div>

                                {!isPaidIn && (
                                    <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={takenByManager}
                                            onChange={(e) => setTakenByManager(e.target.checked)}
                                            disabled={loading}
                                            className="w-4 h-4"
                                        />
                                        <span className="font-medium">Taken by manager</span>
                                    </label>
                                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        disabled={loading}
                        className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-bold text-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`flex-1 py-2.5 text-white rounded-lg font-bold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-50 transition-colors ${
                            isPaidIn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
                        }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Recording...
                            </>
                        ) : (
                            <>
                                <Icon className="w-4 h-4" /> Confirm {isPaidIn ? 'Paid In' : 'Paid Out'}
                            </>
                        )}
                    </button>
                </div>
            </form>
                        ) : (
                            <div className="p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <p className="text-xs text-slate-600">Track your payout requests. Once <span className="font-bold text-green-600">APPROVED</span>, click Pay & Print.</p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={fetchPayoutRequests}
                                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                                        >
                                            Refresh
                                        </button>
                                    </div>
                                </div>

                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    {requestsLoading ? (
                                        <div className="p-10 text-center text-slate-500 text-sm">
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                                            Loading payout requests...
                                        </div>
                                    ) : payoutRequests.length === 0 ? (
                                        <div className="p-10 text-center text-slate-500 text-sm">No payout requests found for today.</div>
                                    ) : (
                                        <div className="max-h-[420px] overflow-y-auto">
                                            <table className="w-full text-left text-sm text-slate-700">
                                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0">
                                                    <tr>
                                                        <th className="p-3 font-semibold">Status</th>
                                                        <th className="p-3 font-semibold">Reason</th>
                                                        <th className="p-3 font-semibold">Amount</th>
                                                        <th className="p-3 font-semibold text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {payoutRequests.map((row) => (
                                                        <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                                                            <td className="p-3 font-mono text-xs font-bold">
                                                                <span className={`px-2 py-1 rounded-full ${row.status === 'APPROVED' ? 'bg-green-100 text-green-700' : row.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                    {row.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-slate-600">{String(row.reason || row.description || row.notes || 'Payout request').replace(/\[TAKEN_BY_MANAGER\]\s*/gi, '')}</td>
                                                            <td className="p-3 font-semibold text-slate-800">LKR {Number(row.amount || 0).toLocaleString()}</td>
                                                            <td className="p-3 text-right">
                                                                {row.status === 'APPROVED' ? (
                                                                    processedPayoutIds.has(String(row.id)) ? (
                                                                        <span className="text-xs text-green-600 font-bold flex items-center justify-end gap-1">✓ Printed</span>
                                                                    ) : (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleProcessApprovedPayout(row)}
                                                                            disabled={processingPayoutId === row.id}
                                                                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-60"
                                                                        >
                                                                            {processingPayoutId === row.id ? 'Processing...' : 'Pay & Print'}
                                                                        </button>
                                                                    )
                                                                ) : row.status === 'REJECTED' ? (
                                                                    <span className="text-xs text-red-500 font-bold">Rejected</span>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400 italic">Waiting...</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
        </div>
    </div>
  );
}