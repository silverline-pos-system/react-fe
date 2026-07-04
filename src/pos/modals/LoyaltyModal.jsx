import React, { useState, useEffect, useRef } from 'react';
import useEscapeClose from '../../hooks/useEscapeClose';
import { Crown, X, Search, User, Phone, Mail, Gift, Loader2, ArrowRight } from 'lucide-react';
import { posService } from '../../services/posService';

export default function LoyaltyModal({ onClose, onAttach }) {
    useEscapeClose(onClose);
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [activeSuggestion, setActiveSuggestion] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    // Debounced Search Effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!searchQuery.trim() || customer) {
                setSuggestions([]);
                return;
            }

            // Only search if not loading and query is long enough
            try {
                const res = await posService.findCustomer(searchQuery.trim());
                const data = res.data?.data || res.data;
                const results = Array.isArray(data) ? data : (data ? [data] : []);
                setSuggestions(results);
                setShowSuggestions(results.length > 0);
                setActiveSuggestion(-1);
            } catch (err) {
                // Silent catch for suggestions
                console.debug("Suggestion search failed", err);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, customer]);

    const selectCustomer = (cust) => {
        setCustomer({
            id: cust.customerId || cust.id,
            code: cust.code,
            name: cust.name,
            phone: cust.phone,
            email: cust.email,
            address: cust.address,
            city: cust.city,
            loyaltyPoints: cust.loyaltyPoints || cust.loyalty_points || 0,
            totalPurchases: cust.totalPurchases || cust.total_purchases || 0,
            isActive: cust.isActive !== false
        });
        setSuggestions([]);
        setShowSuggestions(false);
        setSearchQuery(""); // Optional: keep query or clear it? Keeping it clears context usually, but here we show the card.
    };

    const handleSearch = async (e) => {
        e?.preventDefault();
        if (!searchQuery.trim()) return;

        setLoading(true);
        setError(null);
        setSuggestions([]);

        try {
            const res = await posService.findCustomer(searchQuery.trim());
            const data = res.data?.data || res.data;

            if (!data || (Array.isArray(data) && data.length === 0)) {
                setError("Customer not found");
                setCustomer(null);
                return;
            }

            // If multiple found on explicit search, take first or show list?
            // Since suggestions cover the list part, explicit search can select the best match.
            const cust = Array.isArray(data) ? data[0] : data;
            selectCustomer(cust);

        } catch (err) {
            console.error("Customer search failed:", err);
            setError("Customer not found. Try a different query.");
            setCustomer(null);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        // Navigation in suggestions list
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestion(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestion(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (activeSuggestion >= 0) {
                    selectCustomer(suggestions[activeSuggestion]);
                } else {
                    // No active suggestion, treat as normal submit which is handled by form onSubmit usually, 
                    // but we can force it here if form logic isn't catching it due to preventDefault
                    handleSearch(e);
                }
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        } else if (e.key === 'Enter' && customer) {
            // If customer is already selected/visible, Enter key attaches it (Fast mode)
            e.preventDefault();
            onAttach(customer);
        }
    };

    // Calculate loyalty tier based on points
    const getLoyaltyTier = (points) => {
        if (points >= 1000) return { name: 'PLATINUM', color: 'text-purple-700', bg: 'bg-purple-100' };
        if (points >= 500) return { name: 'GOLD', color: 'text-yellow-700', bg: 'bg-yellow-100' };
        if (points >= 100) return { name: 'SILVER', color: 'text-slate-600', bg: 'bg-slate-100' };
        return { name: 'BRONZE', color: 'text-orange-600', bg: 'bg-orange-100' };
    };

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px]">
            <div className="bg-white w-[420px] rounded-xl shadow-2xl overflow-hidden min-h-[400px] flex flex-col">
                {/* Header */}
                <div className="bg-purple-900 px-4 py-3 flex justify-between items-center shrink-0">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <Crown className="w-5 h-5 text-yellow-400" /> Loyalty Lookup
                    </h3>
                    <button onClick={onClose} className="text-purple-300 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 flex-1 relative">
                    {/* Search Form */}
                    <div className="relative z-20">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer Phone or Name</label>
                        <form onSubmit={handleSearch} className="flex gap-2 mb-2">
                            <div className="flex-1 flex items-center border border-slate-300 rounded-lg px-3 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100 bg-white">
                                <Search className="w-4 h-4 text-slate-400 mr-2" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCustomer(null); // Clear previous result on edit
                                    }}
                                    onKeyDown={handleKeyDown}
                                    className="flex-1 py-2 text-sm font-mono focus:outline-none bg-transparent"
                                    placeholder="Search by phone or name..."
                                    autoComplete="off"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !searchQuery.trim()}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                            </button>
                        </form>

                        {/* Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-30">
                                {suggestions.map((cust, idx) => (
                                    <div
                                        key={cust.id || cust.customerId || idx}
                                        onClick={() => selectCustomer(cust)}
                                        className={`px-4 py-3 cursor-pointer border-b border-slate-50 last:border-none flex justify-between items-center transition-colors ${idx === activeSuggestion ? 'bg-purple-50' : 'hover:bg-slate-50'
                                            }`}
                                    >
                                        <div>
                                            <div className="font-bold text-slate-700 text-sm">{cust.name}</div>
                                            <div className="text-xs text-slate-500 font-mono">{cust.phone}</div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getLoyaltyTier(cust.loyaltyPoints).bg} ${getLoyaltyTier(cust.loyaltyPoints).color}`}>
                                                {getLoyaltyTier(cust.loyaltyPoints).name}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4 text-center mt-4">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Customer Card */}
                    {customer && (
                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 animate-in fade-in duration-200 mt-4 relative z-10">
                            <div className="flex items-start gap-3">
                                <div className="bg-purple-200 p-2.5 rounded-full">
                                    <User className="w-6 h-6 text-purple-700" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 text-lg">{customer.name}</h4>
                                    {customer.code && (
                                        <span className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                            {customer.code}
                                        </span>
                                    )}

                                    {/* Contact Info */}
                                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3 h-3 text-slate-400" />
                                            {customer.phone}
                                        </div>
                                        {customer.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3 h-3 text-slate-400" />
                                                {customer.email}
                                            </div>
                                        )}
                                    </div>

                                    {/* Loyalty Info */}
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <div className="bg-white rounded-lg p-2 border border-purple-200">
                                            <div className="flex items-center gap-1 text-purple-600 mb-1">
                                                <Gift className="w-3 h-3" />
                                                <span className="text-[10px] font-bold uppercase">Points</span>
                                            </div>
                                            <div className="font-mono font-bold text-lg text-purple-700">
                                                {customer.loyaltyPoints.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-lg p-2 border border-purple-200">
                                            <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">
                                                Tier
                                            </div>
                                            <div className={`font-bold text-sm ${getLoyaltyTier(customer.loyaltyPoints).color}`}>
                                                <span className={`px-2 py-0.5 rounded ${getLoyaltyTier(customer.loyaltyPoints).bg}`}>
                                                    {getLoyaltyTier(customer.loyaltyPoints).name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Total Purchases */}
                                    {customer.totalPurchases > 0 && (
                                        <div className="mt-2 text-xs text-slate-500">
                                            Total Purchases: <span className="font-mono font-bold text-slate-700">
                                                LKR {customer.totalPurchases.toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Attach Button */}
                            <button
                                onClick={() => onAttach(customer)}
                                className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 outline-none"
                            >
                                <Crown className="w-4 h-4" /> Attach to Bill <span className="text-white/60 text-[10px] ml-1 font-mono">(ENTER)</span>
                            </button>
                        </div>
                    )}

                    {/* Empty State */}
                    {!customer && !error && !loading && !searchQuery && (
                        <div className="text-center py-8 text-slate-400 mt-8">
                            <User className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Start typing to search...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}