import React, { useState, useEffect, useRef } from 'react';
import useEscapeClose from '@/shared/hooks/useEscapeClose';
import { Package, X, Check } from 'lucide-react';

export default function QuantityModal({ item, onClose, onConfirm }) {
  useEscapeClose(onClose);
  const [qty, setQty] = useState(item.qty.toString());
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newQty = parseFloat(qty);
    
    if (!newQty || newQty <= 0) {
        alert("Please enter a valid quantity greater than 0.");
        return;
    }

    onConfirm(newQty);
  };

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px]">
        <div className="bg-white w-96 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-blue-900 px-4 py-3 flex justify-between items-center">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-300"/> Edit Quantity
                </h3>
                <button onClick={onClose} className="text-blue-300 hover:text-white">
                    <X className="w-5 h-5"/>
                </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="text-center mb-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Item Name</p>
                    <p className="text-lg font-bold text-slate-800 leading-tight">{item.name}</p>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Quantity</label>
                    <div className="flex items-center border-2 border-blue-500 rounded-lg bg-white px-3 py-2 shadow-sm focus-within:ring-4 focus-within:ring-blue-100 transition-all">
                        <input 
                            ref={inputRef}
                            type="number" 
                            step="0.01"
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            className="w-full text-3xl font-mono font-bold text-center text-slate-900 focus:outline-none" 
                        />
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-300 rounded-lg text-slate-700 font-bold text-sm hover:bg-slate-50">
                        Cancel
                    </button>
                    <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md">
                        Update Qty
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
}
