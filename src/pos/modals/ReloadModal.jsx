import React, { useState, useEffect, useRef } from 'react';
import { X, Smartphone, Hash, Banknote, Check } from 'lucide-react';
import useEscapeClose from '../../hooks/useEscapeClose';

export default function ReloadModal({ onClose, onConfirm }) {
    useEscapeClose(onClose);
    const [provider, setProvider] = useState('DIALOG');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [amount, setAmount] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) return;
        if (!phoneNumber || phoneNumber.length < 9) return;

        onConfirm({
            provider,
            phoneNumber,
            amount: parseFloat(amount)
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-blue-600" />
                        Reload Sale
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Provider</label>
                        <select
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                        >
                            <option value="DIALOG">Dialog</option>
                            <option value="MOBITEL">Mobitel</option>
                            <option value="HUTCH">Hutch</option>
                            <option value="AIRTEL">Airtel</option>
                            <option value="SLT">SLT</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Hash className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                ref={inputRef}
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-lg"
                                placeholder="077xxxxxxx"
                                maxLength={10}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Reload Amount (LKR)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Banknote className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-lg font-bold text-slate-800"
                                placeholder="0.00"
                                min="1"
                                step="1"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={!amount || !phoneNumber}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Check className="w-5 h-5" />
                            Add to Cart
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
