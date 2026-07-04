import React, { useEffect, useCallback, useRef } from 'react';
import { X, Tag, Package, DollarSign, Layers, AlertCircle, ChevronRight, Zap } from 'lucide-react';
import useEscapeClose from '../../hooks/useEscapeClose';

/**
 * PriceSelectionModal - Professional POS multi-price selection modal.
 * 
 * When a scanned product has multiple selling prices (from different batches),
 * this modal presents all available price options to the cashier. The cashier
 * selects the correct price based on the physical item's labeled price.
 * 
 * Features:
 * - Aggregated stock display per unique price point
 * - Keyboard shortcuts (1-9) for instant selection
 * - Auto-select when only one price (safety net)
 * - Visual price highlighting with MRP comparison
 * - Batch details (code, stock, expiry) grouped per price
 * - Sound feedback via browser beep on selection
 */
const PriceSelectionModal = ({ isOpen, onClose, product, onSelectPrice }) => {
    useEscapeClose(onClose, isOpen);
    const buttonRefs = useRef([]);
    const [focusedIndex, setFocusedIndex] = React.useState(0);
    const productData = product?.productData || {};

    // Aggregate batches by selling price for display
    // options already contains unique prices from POSScreen, but we may want to show 
    // all batches with that price for transparency
    const allBatches = productData.availablePrices || [];

    // Build aggregated price groups: group all batches sharing the same selling price
    const priceGroupsMap = new Map();
    for (const batch of allBatches) {
        if (batch.sellingPrice == null) continue;
        const priceKey = parseFloat(batch.sellingPrice).toFixed(2);

        if (!priceGroupsMap.has(priceKey)) {
            priceGroupsMap.set(priceKey, {
                sellingPrice: parseFloat(batch.sellingPrice),
                mrp: batch.mrp ? parseFloat(batch.mrp) : null,
                totalStock: 0,
                batches: [],
                primaryBatchId: batch.batchId
            });
        }

        const group = priceGroupsMap.get(priceKey);
        group.totalStock += parseFloat(batch.stockQty || 0);
        group.batches.push({
            batchId: batch.batchId,
            batchCode: batch.batchCode,
            stockQty: parseFloat(batch.stockQty || 0),
            expiryDate: batch.expiryDate,
            mrp: batch.mrp ? parseFloat(batch.mrp) : null
        });

        // Update MRP if this batch has a higher one
        if (batch.mrp && (!group.mrp || parseFloat(batch.mrp) > group.mrp)) {
            group.mrp = parseFloat(batch.mrp);
        }
    }

    // Convert map to sorted array (cheapest first - typical POS behavior)
    const priceGroups = Array.from(priceGroupsMap.values())
        .sort((a, b) => a.sellingPrice - b.sellingPrice);

    const handleSelect = useCallback((priceGroup) => {
        onSelectPrice(priceGroup.sellingPrice);
        onClose();
    }, [onClose, onSelectPrice]);

    // Keyboard handler: 1-9 for quick selection, Up/Down for navigation, Enter to select, Escape to cancel
    const handleKeyDown = useCallback((e) => {
        if (!isOpen) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedIndex(prev => (prev + 1) % priceGroups.length);
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedIndex(prev => (prev - 1 + priceGroups.length) % priceGroups.length);
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (priceGroups[focusedIndex]) {
                handleSelect(priceGroups[focusedIndex]);
            }
            return;
        }

        const num = parseInt(e.key);
        if (num >= 1 && num <= priceGroups.length && num <= 9) {
            e.preventDefault();
            handleSelect(priceGroups[num - 1]);
        }
    }, [focusedIndex, handleSelect, isOpen, onClose, priceGroups]);

    // Register keyboard listener
    useEffect(() => {
        if (!isOpen) return undefined;
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown, isOpen]);

    // Focus the selected button to ensure smooth scrolling
    useEffect(() => {
        if (!isOpen) return;
        if (buttonRefs.current[focusedIndex]) {
            buttonRefs.current[focusedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [focusedIndex, isOpen]);

    if (!isOpen || !product) return null;

    // If after aggregation there's still only 1 price, auto-select it
    if (priceGroups.length <= 1 && priceGroups.length > 0) {
        // Shouldn't normally reach here (POSScreen filters single prices),
        // but just in case - auto-select and close
        setTimeout(() => {
            onSelectPrice(priceGroups[0].sellingPrice);
            onClose();
        }, 0);
        return null;
    }

    // If somehow no price groups, close modal
    if (priceGroups.length === 0) {
        setTimeout(() => onClose(), 0);
        return null;
    }

    // Essential variables

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ animation: 'modalFadeIn 0.2s ease-out' }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto z-10 flex flex-col overflow-hidden"
                style={{
                    animation: 'modalSlideUp 0.25s ease-out',
                    maxHeight: '85vh'
                }}
            >
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <Tag size={22} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold tracking-tight">Multiple Prices Detected</h3>
                                <p className="text-amber-100 text-xs font-medium">
                                    Select the price matching the item label
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                            title="Cancel (Esc)"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Product Info Strip */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-200 rounded-lg flex items-center justify-center">
                            <Package size={18} className="text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm truncate">
                                {productData.name || productData.productName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                                {productData.barcode && (
                                    <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                        {productData.barcode}
                                    </span>
                                )}
                                {productData.sku && (
                                    <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                        SKU: {productData.sku}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-gray-400 font-semibold block">PRICES</span>
                            <span className="text-lg font-black text-amber-600">{priceGroups.length}</span>
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2 shrink-0">
                    <AlertCircle size={14} className="text-blue-500 shrink-0" />
                    <p className="text-[11px] text-blue-700 font-medium">
                        Check the item's price sticker and select the matching price below. Press <kbd className="px-1 py-0.5 bg-blue-100 border border-blue-200 rounded text-[10px] font-bold">1</kbd>-<kbd className="px-1 py-0.5 bg-blue-100 border border-blue-200 rounded text-[10px] font-bold">{priceGroups.length}</kbd> for quick selection.
                    </p>
                </div>

                {/* Price Options */}
                <div className="p-4 overflow-y-auto flex-1" style={{ maxHeight: '50vh' }}>
                    <div className="space-y-3">
                        {priceGroups.map((group, index) => {
                            return (
                                <button
                                    key={index}
                                    ref={el => buttonRefs.current[index] = el}
                                    onClick={() => handleSelect(group)}
                                    className={`w-full text-left rounded-xl border-2 transition-all duration-200 
                                             group focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200
                                             active:scale-[0.99] overflow-hidden
                                             ${index === focusedIndex
                                            ? 'border-amber-500 bg-amber-50 hover:bg-amber-100 shadow-xl shadow-amber-100/50'
                                            : 'border-gray-200 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-100/50'
                                        }`}
                                >
                                    {/* Main Price Row */}
                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-3">
                                            {/* Keyboard Shortcut Badge */}
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-amber-500 
                                                          flex items-center justify-center transition-colors shrink-0">
                                                <span className="text-lg font-black text-slate-400 group-hover:text-white transition-colors">
                                                    {index + 1}
                                                </span>
                                            </div>

                                            <div>
                                                {/* Selling Price */}
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-xs text-gray-400 font-semibold">LKR</span>
                                                    <span className="text-2xl font-black text-gray-900 group-hover:text-amber-700 transition-colors tracking-tight">
                                                        {group.sellingPrice.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>

                                                {/* MRP comparison */}
                                                {group.mrp > 0 && (
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[11px] text-gray-400">
                                                            MRP: {group.mrp.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Side - Stock & Arrow */}
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold
                                                    ${group.totalStock > 10
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : group.totalStock > 0
                                                            ? 'bg-amber-50 text-amber-700'
                                                            : 'bg-red-50 text-red-600'
                                                    }`}
                                                >
                                                    <Layers size={12} />
                                                    {group.totalStock} in stock
                                                </div>
                                            </div>
                                            <ChevronRight
                                                size={20}
                                                className="text-gray-300 group-hover:text-amber-500 transition-colors"
                                            />
                                        </div>
                                    </div>

                                </button>
                            );
                        })}
                    </div>

                    </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Zap size={12} />
                        <span>Press number key to select instantly</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 
                                 bg-white border border-gray-200 rounded-lg hover:border-gray-300 
                                 transition-colors"
                    >
                        Cancel <span className="text-gray-400 ml-1">(Esc)</span>
                    </button>
                </div>
            </div>

            {/* Animation Styles */}
            <style>{`
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalSlideUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(20px) scale(0.98); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0) scale(1); 
                    }
                }
            `}</style>
        </div>
    );
};

export default PriceSelectionModal;
