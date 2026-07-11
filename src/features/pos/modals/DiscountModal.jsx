import React, { useState, useEffect, useRef } from 'react';
import useEscapeClose from '@/shared/hooks/useEscapeClose';
import { X, Percent, DollarSign, Tag } from 'lucide-react';

export default function DiscountModal({ onClose, onApply, selectedItem, cartTotal }) {
    useEscapeClose(onClose);
    const [discountType, setDiscountType] = useState('amount'); // 'amount' or 'percent'
    const [value, setValue] = useState('');
    const [scope, setScope] = useState(selectedItem ? 'item' : 'bill'); // 'item' or 'bill'
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    const calculateDiscount = () => {
        const numValue = parseFloat(value) || 0;
        if (discountType === 'percent') {
            const base = scope === 'item' && selectedItem
                ? (selectedItem.price * selectedItem.qty)
                : cartTotal;
            return (base * numValue) / 100;
        }
        return numValue;
    };

    const handleApply = () => {
        const discountAmount = calculateDiscount();
        if (discountAmount <= 0) {
            onClose();
            return;
        }
        onApply({
            scope,
            discountType,
            value: parseFloat(value) || 0,
            discountAmount
        });
        onClose();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleApply();
        if (e.key === 'Escape') onClose();
    };

    const presets = [5, 10, 15, 20, 25];

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px]">
            <div className="bg-white w-[420px] rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-500 to-amber-500 px-4 py-3 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <Percent className="w-5 h-5" /> Apply Discount
                    </h3>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Scope Selection */}
                    {selectedItem && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
                                Apply To
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setScope('item')}
                                    className={`py-2 px-3 rounded-lg border-2 text-sm font-bold transition-colors ${scope === 'item'
                                            ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <Tag className="w-4 h-4 inline mr-1" />
                                    Selected Item
                                </button>
                                <button
                                    onClick={() => setScope('bill')}
                                    className={`py-2 px-3 rounded-lg border-2 text-sm font-bold transition-colors ${scope === 'bill'
                                            ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <DollarSign className="w-4 h-4 inline mr-1" />
                                    Whole Bill
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Discount Type */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
                            Discount Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setDiscountType('amount')}
                                className={`py-2 px-3 rounded-lg border-2 text-sm font-bold transition-colors ${discountType === 'amount'
                                        ? 'bg-green-100 border-green-400 text-green-800'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                LKR Amount
                            </button>
                            <button
                                onClick={() => setDiscountType('percent')}
                                className={`py-2 px-3 rounded-lg border-2 text-sm font-bold transition-colors ${discountType === 'percent'
                                        ? 'bg-green-100 border-green-400 text-green-800'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                % Percentage
                            </button>
                        </div>
                    </div>

                    {/* Value Input */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
                            {discountType === 'percent' ? 'Percentage' : 'Amount (LKR)'}
                        </label>
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="number"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full px-4 py-3 text-2xl font-mono font-bold text-center border-2 border-slate-300 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
                                placeholder="0"
                                min="0"
                                max={discountType === 'percent' ? 100 : undefined}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                                {discountType === 'percent' ? '%' : 'LKR'}
                            </span>
                        </div>
                    </div>

                    {/* Quick Presets (for percentage) */}
                    {discountType === 'percent' && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
                                Quick Select
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {presets.map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setValue(String(p))}
                                        className={`py-2 rounded-lg text-sm font-bold transition-colors ${value === String(p)
                                                ? 'bg-yellow-500 text-white'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                    >
                                        {p}%
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Discount Amount:</span>
                            <span className="text-xl font-bold text-green-600">
                                LKR {calculateDiscount().toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={!value || parseFloat(value) <= 0}
                        className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Apply Discount
                    </button>
                </div>
            </div>
        </div>
    );
}
