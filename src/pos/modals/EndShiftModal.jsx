import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Power, ArrowRight, ShieldCheck, Banknote, AlertTriangle, CheckCircle, Calculator, CreditCard, ArrowUpRight, ArrowDownLeft, X, QrCode, RefreshCw } from 'lucide-react';
import useEscapeClose from '../../hooks/useEscapeClose';

const DENOMINATIONS = [5000, 1000, 500, 100, 50, 20, 10, 5, 2, 1];

export default function EndShiftModal({ cashierName, shiftId, expectedTotals, onClose, onConfirm, onRefresh }) {
    const [step, setStep] = useState(1);
    const [counts, setCounts] = useState({});
    const [supUser, setSupUser] = useState("");
    const [supPass, setSupPass] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEscapeClose(onClose);

    const handleRefresh = async () => {
        if (onRefresh) {
            setRefreshing(true);
            await onRefresh();
            setRefreshing(false);
        }
    };

    const totalCountedCash = useMemo(() => {
        return DENOMINATIONS.reduce((total, denom) => {
            return total + (denom * (parseInt(counts[denom]) || 0));
        }, 0);
    }, [counts]);

    const handleCountChange = (denom, qty) => {
        const numQty = parseInt(qty) || 0;
        if (numQty < 0) return;
        setCounts(prev => ({ ...prev, [denom]: numQty }));
    };

    const handleFinalSubmit = useCallback(async () => {
        if (!supUser || !supPass) {
            setError("Supervisor approval is required to finalize the shift.");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            // Build denominations array for cash_shift_denominations table
            const denominationsData = DENOMINATIONS
                .filter(denom => (counts[denom] || 0) > 0)
                .map(denom => ({
                    denominationValue: denom,
                    quantity: counts[denom],
                    type: 'CLOSING'
                }));

            await onConfirm(
                totalCountedCash,
                { username: supUser, password: supPass },
                denominationsData
            );
        } catch (err) {
            console.error("Logout Error:", err);
            setError(err.message || "Failed to close shift. Please try again.");
            setLoading(false);
        }
    }, [supUser, supPass, counts, totalCountedCash, onConfirm]);

    // Handle Enter key for step navigation and submission
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (step === 1) {
                setStep(2);
            } else if (step === 2 && supUser && supPass && !loading && !(expectedTotals?.pendingRequests > 0)) {
                handleFinalSubmit();
            }
        }
    }, [step, supUser, supPass, loading, expectedTotals, handleFinalSubmit]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // SAFE CALCULATION: Handle missing API data
    const hasData = !!expectedTotals;
    const systemCash = hasData ? (expectedTotals.expectedCash || 0) : 0;
    const variance = totalCountedCash - systemCash;
    const isBalanced = Math.abs(variance) < 1.0;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
            <div className="bg-white w-[750px] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* HEADER */}
                <div className="bg-slate-900 p-4 shrink-0 flex justify-between items-center">
                    <div>
                        <h2 className="text-white font-bold text-lg tracking-wide uppercase flex items-center gap-2">
                            <Power className="w-5 h-5 text-red-500" /> End of Shift
                        </h2>
                        <div className="flex gap-4 mt-1">
                            <p className="text-slate-400 text-xs">Cashier: <span className="text-white font-bold">{cashierName}</span></p>
                            {shiftId && <p className="text-slate-400 text-xs">Shift: <span className="text-green-400 font-bold">#{shiftId}</span></p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {onRefresh && (
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex flex-col items-center disabled:opacity-50"
                                title="Refresh Status"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                <span className="text-[9px] font-bold uppercase mt-1">Sync</span>
                            </button>
                        )}
                        <div className="text-right">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Step</span>
                            <div className="text-white font-mono font-bold text-xl leading-none">{step} / 2</div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-700">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* STEP 1: CASH COUNTING */}
                {step === 1 && (
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="bg-slate-50 p-3 border-b border-slate-200">
                            <h3 className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2">
                                <Banknote className="w-4 h-4 text-blue-600" /> Cash Declaration
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Count all cash in the drawer and enter the quantities below</p>
                        </div>

                        <div className="overflow-y-auto overflow-x-hidden p-4 custom-scroll grid grid-cols-2 gap-3">
                            {DENOMINATIONS.map(denom => (
                                <div key={denom} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 hover:border-blue-300 transition-colors">
                                    <div className="w-16 shrink-0 font-mono font-bold text-slate-700 text-right">{denom.toLocaleString()}</div>
                                    <span className="text-slate-400 text-xs">x</span>
                                    <input
                                        type="number"
                                        min="0"
                                        className="flex-1 min-w-0 bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-center font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        placeholder="0"
                                        value={counts[denom] || ""}
                                        onChange={(e) => handleCountChange(denom, e.target.value)}
                                        onFocus={(e) => e.target.select()}
                                    />
                                    <span className="w-20 text-right text-xs font-mono text-slate-500">
                                        = {(denom * (counts[denom] || 0)).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-slate-100 border-t border-slate-200 shrink-0">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-bold text-slate-600 uppercase">Total Declared Cash</span>
                                <span className="text-3xl font-mono font-bold text-slate-900">
                                    <span className="text-sm text-slate-400 mr-1">LKR</span>
                                    {totalCountedCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 border border-slate-300 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-colors"
                                >
                                    Next: View Summary <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: SUMMARY & APPROVAL */}
                {step === 2 && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scroll">

                            {/* VARIANCE CARD */}
                            <div className={`rounded-xl border-2 p-4 ${!hasData ? 'bg-slate-50 border-slate-200' : isBalanced ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className={`text-sm font-bold uppercase flex items-center gap-2 ${!hasData ? 'text-slate-600' : isBalanced ? 'text-green-800' : 'text-red-800'}`}>
                                        {!hasData ? <Calculator className="w-5 h-5" /> : isBalanced ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                        {!hasData ? "Syncing..." : isBalanced ? "Shift Balanced ✓" : variance > 0 ? "Excess" : "Shortage"}
                                    </h3>
                                    {hasData && (
                                        <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${isBalanced ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                            {variance > 0 ? "+" : ""}{variance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                                        <span className="text-xs text-slate-500 uppercase font-bold">System Expected</span>
                                        <div className="font-mono font-bold text-xl text-slate-900 mt-1">
                                            {hasData ? `LKR ${systemCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : "---"}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                                        <span className="text-xs text-slate-500 uppercase font-bold">You Declared</span>
                                        <div className="font-mono font-bold text-xl text-slate-900 mt-1">
                                            LKR {totalCountedCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SALES SUMMARY */}
                            {hasData && (
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                        <div className="flex items-center gap-2 text-green-700 mb-1">
                                            <Banknote className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase">Cash Sales</span>
                                        </div>
                                        <div className="font-mono font-bold text-lg text-green-800">
                                            {(expectedTotals.cashSales || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                                        <div className="flex items-center gap-2 text-purple-700 mb-1">
                                            <CreditCard className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase">Card Sales</span>
                                        </div>
                                        <div className="font-mono font-bold text-lg text-purple-800">
                                            {(expectedTotals.cardTotal || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                        <div className="flex items-center gap-2 text-blue-700 mb-1">
                                            <QrCode className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase">QR/Other</span>
                                        </div>
                                        <div className="font-mono font-bold text-lg text-blue-800">
                                            {(expectedTotals.otherPayments || 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* CASH FLOW BREAKDOWN */}
                            {hasData && (
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Shift History & Cash Flow</h4>
                                    <div className="bg-slate-50 rounded-lg border border-slate-200 text-sm overflow-hidden">
                                        <div className="flex justify-between p-3 border-b border-slate-100 bg-white">
                                            <span className="text-slate-600">Opening Float</span>
                                            <span className="font-mono font-bold text-slate-700">
                                                {(expectedTotals.openingFloat || expectedTotals.openingCash || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between p-3 border-b border-slate-100">
                                            <span className="text-slate-600">Total Sales</span>
                                            <span className="font-mono font-bold text-green-600">
                                                +{(expectedTotals.totalSales || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between p-3 border-b border-slate-100 bg-white">
                                            <span className="text-slate-600 font-semibold">Total Transactions</span>
                                            <span className="font-mono font-bold text-slate-800 text-base">
                                                {(expectedTotals.transactionCount || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between p-3 border-b border-slate-100 bg-white">
                                            <span className="text-slate-600">Total Returns</span>
                                            <span className="font-mono font-bold text-red-500">
                                                -{(expectedTotals.totalReturns || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between p-3 border-b border-slate-100">
                                            <span className="text-slate-600 flex items-center gap-1">
                                                <ArrowUpRight className="w-3 h-3 text-blue-500" /> Paid In
                                            </span>
                                            <span className="font-mono font-bold text-blue-600">
                                                +{(expectedTotals.paidIn || expectedTotals.totalPaidIn || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between p-3 border-b border-slate-100">
                                            <span className="text-slate-600 flex items-center gap-1">
                                                <ArrowDownLeft className="w-3 h-3 text-red-500" /> Paid Out
                                            </span>
                                            <span className="font-mono font-bold text-red-600">
                                                -{(expectedTotals.paidOut || expectedTotals.totalPaidOut || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between p-3 bg-slate-100 font-bold">
                                            <span className="text-slate-800">Expected Cash in Drawer</span>
                                            <span className="font-mono text-slate-900">
                                                LKR {systemCash.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!hasData && (
                                <div className="text-center p-6 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                                    <RefreshCw className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-spin" />
                                    <p className="text-slate-400 text-sm">Loading shift details...</p>
                                </div>
                            )}

                            {/* PENDING APPROVALS WARNING */}
                            {hasData && (expectedTotals.pendingRequests > 0) && (
                                <div className="bg-orange-50 rounded-xl border border-orange-200 p-4 flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-orange-800 text-sm uppercase">Approvals Pending</h4>
                                        <p className="text-xs text-orange-700 mt-1">
                                            There are <span className="font-bold">{expectedTotals.pendingRequests} pending cash flow requests</span> (Paid In/Out) that require Manager approval.
                                        </p>
                                        <p className="text-xs text-orange-700 mt-1 font-semibold">
                                            You cannot close the shift until these are approved or rejected.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* SUPERVISOR APPROVAL */}
                            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                                <h3 className="text-xs font-bold text-amber-800 uppercase mb-3 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> Supervisor Approval Required
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={supUser}
                                        onChange={e => setSupUser(e.target.value)}
                                        className="border border-amber-200 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                                        placeholder="Supervisor Username"
                                    />
                                    <input
                                        type="password"
                                        value={supPass}
                                        onChange={e => setSupPass(e.target.value)}
                                        className="border border-amber-200 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                                        placeholder="Supervisor Password"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* FOOTER BUTTONS */}
                        <div className="p-4 bg-white border-t border-slate-100 grid grid-cols-2 gap-3 shrink-0">
                            <button
                                onClick={() => setStep(1)}
                                disabled={loading}
                                className="py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm uppercase border border-slate-200"
                            >
                                ← Back to Count
                            </button>
                            <button
                                onClick={handleFinalSubmit}
                                disabled={loading || !supUser || !supPass || (expectedTotals.pendingRequests > 0)}
                                className="py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-red-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:shadow-none"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <Power className="w-4 h-4" /> Close Shift
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}