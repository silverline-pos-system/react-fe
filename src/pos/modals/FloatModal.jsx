import React, { useState, useEffect, useMemo } from 'react';
import { Lock, User, ShieldCheck, Banknote, ChevronDown, ChevronUp, LogOut, Store } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { authService } from '../../services/authService';

// Standard Sri Lankan currency denominations
const DENOMINATIONS = [5000, 1000, 500, 100, 50, 20, 10, 5, 2, 1];

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
    // Initialize with default/loading state
    const [currentUser, setCurrentUser] = useState({ id: null, name: "Loading..." });
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState(initialBranchId || "");

    const [amount, setAmount] = useState("");
    const [supUser, setSupUser] = useState("");
    const [supPass, setSupPass] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showDenominations, setShowDenominations] = useState(false);
    const [counts, setCounts] = useState({});

    const { addNotification } = useNotification();

    // Calculate total from denominations
    const totalFromDenominations = useMemo(() => {
        return DENOMINATIONS.reduce((total, denom) => {
            return total + (denom * (parseInt(counts[denom]) || 0));
        }, 0);
    }, [counts]);

    // Sync denomination total with amount field
    useEffect(() => {
        if (showDenominations && totalFromDenominations > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAmount(totalFromDenominations.toString());
        }
    }, [totalFromDenominations, showDenominations]);

    // Load Logged-in User and Branches
    useEffect(() => {
        const loadInitialData = async () => {
            let parsedUser = null;

            // Load User
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

            // Load branches from session first (works for cashier), fallback to auth endpoint
            try {
                let normalized = normalizeBranches(parsedUser?.branches || []);

                if (normalized.length === 0) {
                    const branchList = await authService.getBranches();
                    normalized = normalizeBranches(branchList);
                }

                setBranches(normalized);

                // Set default selected branch in priority: prop -> user.branchId -> first branch
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
            // Build denominations array
            const denominationsData = showDenominations ? DENOMINATIONS
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
                selectedBranchId // Pass the SELECTED branch ID
            );
        } catch {
            setIsLoading(false);
        }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-[420px] rounded-xl shadow-2xl overflow-hidden border border-slate-200">

                {/* Header */}
                <div className="bg-slate-900 p-4 text-center">
                    <h2 className="text-white font-bold text-lg tracking-wide uppercase flex items-center justify-center gap-2">
                        <Lock className="w-5 h-5 text-yellow-400" /> Open Shift
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">Select branch and enter opening float</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Branch Selection */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                            <Store className="w-3 h-3" /> Select Selling Branch
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
                                onChange={e => {
                                    setAmount(e.target.value);
                                    if (showDenominations) setCounts({}); // Clear denominations when manually entering
                                }}
                                disabled={isLoading || showDenominations}
                                className="bg-transparent w-full text-lg font-mono font-bold text-slate-900 focus:outline-none disabled:text-slate-600"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Denomination Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowDenominations(!showDenominations)}
                        className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-700 py-1"
                    >
                        <span className="flex items-center gap-1">
                            <Banknote className="w-3 h-3" />
                            Count by Denomination
                        </span>
                        {showDenominations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {/* Denomination Grid */}
                    {showDenominations && (
                        <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-2 max-h-48 overflow-y-auto custom-scroll">
                            <div className="grid grid-cols-2 gap-2">
                                {DENOMINATIONS.map(denom => (
                                    <div key={denom} className="flex items-center gap-2 bg-white border border-slate-200 rounded px-2 py-1">
                                        <span className="w-12 text-right font-mono text-sm font-bold text-slate-700">{denom}</span>
                                        <span className="text-slate-400 text-xs">x</span>
                                        <input
                                            type="number"
                                            min="0"
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-mono text-sm focus:outline-none focus:border-blue-400 w-16"
                                            placeholder="0"
                                            value={counts[denom] || ""}
                                            onChange={(e) => handleCountChange(denom, e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                        />
                                        <span className="text-xs text-slate-400 w-16 text-right font-mono">
                                            = {(denom * (counts[denom] || 0)).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-600 uppercase">Total</span>
                                <span className="font-mono font-bold text-lg text-green-700">
                                    LKR {totalFromDenominations.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="h-px bg-slate-200 my-2"></div>

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
                                className="w-full border border-yellow-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                                placeholder="Supervisor Username"
                            />
                            <input
                                type="password"
                                value={supPass}
                                onChange={(e) => setSupPass(e.target.value)}
                                disabled={isLoading}
                                className="w-full border border-yellow-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                                placeholder="Supervisor Password"
                            />
                        </div>
                    </div>

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
                </form>
            </div>
        </div>
    );
}
