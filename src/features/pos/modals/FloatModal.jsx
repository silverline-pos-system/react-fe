import React, { useState, useEffect, useMemo } from 'react';
import { Lock, User, ShieldCheck, Banknote, LogOut, Store } from 'lucide-react';
import { useNotification } from '@/features/pos/context/NotificationContext';
import { authService } from '@/features/auth/services/authService';

const NOTES = [5000, 1000, 500, 100, 50, 20];
const COINS = [10, 5, 2, 1];
const ALL_DENOMINATIONS = [...NOTES, ...COINS];

const normalizeBranches = (list) => {
    if (!Array.isArray(list)) return [];
    return list
        .map((b) => {
            const id = b?.branchId ?? b?.branch_id ?? b?.id ?? null;
            const name = b?.name ?? b?.branchName ?? 'Unnamed Branch';
            const location = b?.location ?? b?.code ?? '';
            return id != null ? { id: String(id), name, location } : null;
        })
        .filter(Boolean);
};

export default function FloatModal({ onApprove, initialBranchId }) {
    const [currentUser, setCurrentUser] = useState({ id: null, name: "Loading..." });
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState(initialBranchId || "");

    const [amount, setAmount] = useState("");
    const [supUser, setSupUser] = useState("");
    const [supPass, setSupPass] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [counts, setCounts] = useState({});

    const { addNotification } = useNotification();

    const totalFromDenominations = useMemo(() => {
        return ALL_DENOMINATIONS.reduce((total, denom) => {
            return total + (denom * (parseInt(counts[denom]) || 0));
        }, 0);
    }, [counts]);

    // Synchronize denomination total to Amount input
    useEffect(() => {
        if (totalFromDenominations > 0) {
            setAmount(totalFromDenominations.toString());
        }
    }, [totalFromDenominations]);

    useEffect(() => {
        const loadInitialData = async () => {
            let parsedUser = null;

            try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    parsedUser = JSON.parse(storedUser);
                    setCurrentUser({
                        id: parsedUser.userId || parsedUser.id,
                        name: parsedUser.username || parsedUser.fullName || parsedUser.name,
                        branchId: parsedUser.branchId
                    });
                }
            } catch (error) {
                console.error('Failed to parse user session', error);
            }

            try {
                let normalized = normalizeBranches(parsedUser?.branches || []);

                if (normalized.length === 0) {
                    const branchList = await authService.getBranches();
                    normalized = normalizeBranches(branchList);
                }

                setBranches(normalized);

                if (!selectedBranchId) {
                    const preferredId = initialBranchId ?? parsedUser?.branchId ?? normalized[0]?.id;
                    if (preferredId != null) {
                        setSelectedBranchId(String(preferredId));
                    }
                }
            } catch (error) {
                console.error('Failed to load branches', error);
                addNotification('error', 'Error', 'Failed to load branch list.');
            }
        };

        loadInitialData();
    }, [addNotification, initialBranchId, selectedBranchId]);

    const handleCountChange = (denom, qty) => {
        const numQty = parseInt(qty) || 0;
        if (numQty < 0) return;
        setCounts(prev => ({ ...prev, [denom]: numQty }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedBranchId) {
            addNotification('warning', 'Selection Required', 'Please select a branch to open the shift.');
            return;
        }

        if (!currentUser.id) {
            addNotification('error', 'System Error', 'Cashier ID not identified. Please re-login.');
            return;
        }

        const floatAmount = parseFloat(amount);
        if (!amount || floatAmount < 0) {
            addNotification('warning', 'Float Required', 'Please enter a valid opening cash amount.');
            return;
        }

        if (!supUser || !supPass) {
            addNotification('warning', 'Supervisor Required', 'Supervisor credentials are required to open the shift.');
            return;
        }

        setIsLoading(true);

        try {
            const denominationsData = totalFromDenominations > 0 ? ALL_DENOMINATIONS
                .filter(denom => (counts[denom] || 0) > 0)
                .map(denom => ({
                    denominationValue: denom,
                    quantity: counts[denom],
                    type: 'OPENING'
                })) : null;

            await onApprove(
                currentUser,
                amount,
                { username: supUser, password: supPass },
                denominationsData,
                selectedBranchId
            );
        } catch {
            setIsLoading(false);
        }
    };

    const renderDenomRow = (denom) => {
        return (
            <div key={denom} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2 shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="w-12 text-right font-mono text-sm font-bold text-slate-700">{denom}</span>
                    <span className="text-slate-400 text-xs">x</span>
                    <input
                        type="number"
                        min="0"
                        className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-mono text-sm focus:outline-none focus:border-blue-400 focus:bg-white"
                        placeholder="0"
                        value={counts[denom] || ""}
                        onChange={(e) => handleCountChange(denom, e.target.value)}
                        onFocus={(e) => e.target.select()}
                    />
                </div>
                <span className="text-sm font-mono font-bold text-slate-600 text-right">
                    LKR {(denom * (counts[denom] || 0)).toLocaleString()}
                </span>
            </div>
        );
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-[880px] max-w-[95%] rounded-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">

                {/* Header */}
                <div className="bg-slate-900 p-4 text-center">
                    <h2 className="text-white font-bold text-lg tracking-wide uppercase flex items-center justify-center gap-2">
                        <Lock className="w-5 h-5 text-yellow-400" /> Open Shift
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">Select branch and enter opening float details</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row min-h-[480px]">
                    {/* Left Form: Main Details & Supervisor Auth */}
                    <div className="flex-1 p-6 space-y-4 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200">
                        <div className="space-y-4">
                            {/* Branch Selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                    <Store className="w-3 h-3 text-slate-500" /> Select Selling Branch
                                </label>
                                <select
                                    value={selectedBranchId}
                                    onChange={(e) => setSelectedBranchId(e.target.value)}
                                    disabled={isLoading}
                                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-400"
                                >
                                    <option value="" disabled>--- SELECT BRANCH ---</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.location ? `${b.name} (${b.location})` : b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Cashier Display (Read Only) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cashier</label>
                                <div className="flex items-center border border-slate-200 rounded bg-slate-100 px-3 py-2">
                                    <User className="w-4 h-4 text-slate-500 mr-2" />
                                    <input
                                        type="text"
                                        disabled
                                        value={currentUser.name}
                                        className="bg-transparent w-full text-sm font-bold text-slate-700 focus:outline-none uppercase cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Opening Float Amount</label>
                                <div className="flex items-center border border-blue-300 rounded bg-white px-3 py-2 shadow-sm">
                                    <span className="text-slate-400 font-mono mr-2">LKR</span>
                                    <input
                                        autoFocus
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        disabled={isLoading || totalFromDenominations > 0}
                                        className="bg-transparent w-full text-lg font-mono font-bold text-slate-900 focus:outline-none disabled:text-slate-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                {totalFromDenominations > 0 && (
                                    <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
                                        Amount locked to Denomination Calculator total.
                                    </span>
                                )}
                            </div>

                            {/* Supervisor Auth */}
                            <div className="bg-yellow-50 p-3 rounded border border-yellow-100">
                                <p className="text-[10px] font-bold text-yellow-800 uppercase mb-2 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> Supervisor Approval Required
                                </p>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={supUser}
                                        onChange={(e) => setSupUser(e.target.value)}
                                        disabled={isLoading}
                                        className="w-full border border-yellow-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 bg-white"
                                        placeholder="Supervisor Username"
                                    />
                                    <input
                                        type="password"
                                        value={supPass}
                                        onChange={(e) => setSupPass(e.target.value)}
                                        disabled={isLoading}
                                        className="w-full border border-yellow-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 bg-white"
                                        placeholder="Supervisor Password"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2 pt-4">
                            <button
                                type="submit"
                                disabled={isLoading || !currentUser.id}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold py-3 rounded-lg shadow-md uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Verifying...
                                    </>
                                ) : (
                                    "Approve & Open Shift"
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => window.location.href = '/login'}
                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-lg border border-slate-300 uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2"
                            >
                                <LogOut className="w-4 h-4" /> Exit
                            </button>
                        </div>
                    </div>

                    {/* Right Panel: Cash Notes & Coins Counter */}
                    <div className="w-full md:w-[420px] bg-slate-50 p-6 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Banknote className="w-4 h-4 text-emerald-600" /> Denomination Calculator
                                </h3>
                                {totalFromDenominations > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCounts({});
                                            setAmount("");
                                        }}
                                        className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
                                    >
                                        Clear Calculator
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 custom-scroll">
                                {/* Banknotes Section */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Banknotes</h4>
                                    <div className="space-y-1.5">
                                        {NOTES.map(denom => renderDenomRow(denom))}
                                    </div>
                                </div>

                                {/* Coins Section */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Coins</h4>
                                    <div className="space-y-1.5">
                                        {COINS.map(denom => renderDenomRow(denom))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Calculated Total Section */}
                        <div className="border-t border-slate-200 pt-4 mt-4 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-600 uppercase">Calculator Total</span>
                            <span className="font-mono font-bold text-lg text-emerald-700">
                                LKR {totalFromDenominations.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
