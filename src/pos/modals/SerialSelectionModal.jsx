import React, { useState, useEffect } from 'react';
import { Smartphone, Search, X, Check, Loader2, AlertCircle } from 'lucide-react';
import inventoryService from '../../services/inventoryService';

const SerialSelectionModal = ({ isOpen, onClose, onSelect, productId, productName, branchId }) => {
    const [serials, setSerials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && productId) {
            fetchSerials();
        }
    }, [isOpen, productId]);

    const fetchSerials = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await inventoryService.getAvailableSerials(productId, branchId);
            setSerials(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching serials:', err);
            setError('Failed to load available serial numbers.');
        } finally {
            setLoading(false);
        }
    };

    const filteredSerials = serials.filter(s => 
        s.serialNo.toLowerCase().includes(filter.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-100 rounded-2xl text-indigo-600">
                            <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Select IMEI / Serial</h2>
                            <p className="text-sm text-slate-500 font-medium truncate max-w-[250px]">{productName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-slate-100 bg-white">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search serial numbers..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p className="font-medium">Fetching available serials...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-red-500 gap-3">
                            <AlertCircle className="w-8 h-8" />
                            <p className="font-medium">{error}</p>
                            <button onClick={fetchSerials} className="text-indigo-600 font-bold hover:underline">Try Again</button>
                        </div>
                    ) : filteredSerials.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="p-4 bg-slate-50 rounded-full inline-block mb-3">
                                <Smartphone className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-medium">No available serials found.</p>
                            {filter && <p className="text-xs text-slate-400 mt-1">Try a different search term.</p>}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {filteredSerials.map((serial) => (
                                <button
                                    key={serial.id || serial.serialId}
                                    onClick={() => onSelect(serial)}
                                    className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group shadow-sm active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                        <span className="font-mono font-bold text-slate-700 text-lg tracking-wider">
                                            {serial.serialNo}
                                        </span>
                                    </div>
                                    <Check className="w-5 h-5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <p className="text-xs text-center text-slate-400 font-bold uppercase tracking-widest">
                        Scan or Select to continue
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SerialSelectionModal;
