import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Loader2, AlertCircle, RefreshCw, Tag, X, Trash2 } from 'lucide-react';
import { posService } from '../../services/posService';
import { useNotification } from '../context/NotificationContext';

export default function ProductGrid({ onAddToCart, onAddQuickItemClick, refreshTrigger, branchId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const { addNotification } = useNotification();

  // Load quick items from backend on mount and when branchId or refreshTrigger changes
  const loadQuickItems = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
        const res = await posService.getQuickItems(branchId);
        const rawList = res.data?.data || res.data || [];
        
        const mappedList = (Array.isArray(rawList) ? rawList : [rawList]).map(item => ({
            id: item.productId || item.id,
            sku: item.sku,
            barcode: item.barcode,
            name: item.name || item.productName,
            price: parseFloat(item.sellingPrice ?? item.selling_price ?? item.price ?? item.unitPrice ?? item.unit_price ?? 0),
            taxRate: parseFloat(item.taxRate || 0),
            isActive: true
        }));
        setProducts(mappedList);
    } catch (err) {
        console.error("Failed to load quick items from backend", err);
        addNotification('error', 'Error', 'Failed to load branch quick items.');
        setProducts([]);
    } finally {
        setLoading(false);
    }
  }, [branchId, addNotification]);

  useEffect(() => {
    loadQuickItems();
  }, [loadQuickItems, refreshTrigger]);

  // Add a product to quick pick (called from QuickAddModal)
    const _addToQuickPick = async (product) => {
    if (!branchId) return false;
    
    // Check if already exists in local list to avoid duplicate calls
    const productId = product.productId || product.id;
    const exists = products.some(p => p.id === productId);
    
    if (!exists) {
        try {
            await posService.addToQuickPick(productId, branchId);
            loadQuickItems(); // Reload to get fresh data
            return true;
        } catch (err) {
            console.error("Failed to add to quick pick", err);
            addNotification('error', 'Error', 'Failed to add item to quick pick.');
            return false;
        }
    }
    return !exists;
  };

  // Remove a product from quick pick
  const removeFromQuickPick = async (productId) => {
    if (!branchId) return;
    try {
        await posService.removeFromQuickPick(productId, branchId);
        setProducts(prev => prev.filter(p => p.id !== productId));
        addNotification('success', 'Removed', 'Item removed from quick pick.');
    } catch (err) {
        console.error("Failed to remove from quick pick", err);
        addNotification('error', 'Error', 'Failed to remove item.');
    }
  };

  // Clear all quick pick items - Not implemented in backend yet, so just filter all
  const clearAllQuickPick = async () => {
    // For now, we'll just show a message or remove one by one if necessary
    // But usually clearing all is not as common as individual removal
    addNotification('info', 'Note', 'Please remove items individually to clear.');
    setEditMode(false);
  };

  // Handle adding product to cart - pass full product object
  const handleAddProduct = (product) => {
    onAddToCart(product);
  };

  // Format price with proper locale
  const formatPrice = (price) => {
        const numeric = Number(price ?? 0);
        const safeValue = Number.isFinite(numeric) ? numeric : 0;
        return safeValue.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="flex-1 bg-slate-100 p-4 overflow-y-auto custom-scroll">
      
      {/* Header */}
      <div className="mb-3 flex justify-between items-center">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Package className="w-4 h-4" /> Quick Pick Items
            <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-full text-slate-600">
                {products.length}
            </span>
        </h2>
        <div className="flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin"/>}
            {products.length > 0 && (
                <button 
                    onClick={() => setEditMode(!editMode)}
                    className={`text-xs font-bold px-2 py-1 rounded transition-colors ${
                        editMode 
                            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                >
                    {editMode ? 'Done' : 'Edit'}
                </button>
            )}
            {editMode && products.length > 0 && (
                <button 
                    onClick={clearAllQuickPick}
                    className="text-xs font-bold px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"
                >
                    <Trash2 className="w-3 h-3" /> Clear All
                </button>
            )}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-4 gap-3 content-start">
        
        {/* Render Saved Items */}
        {products.map((product) => (
            <div key={product.id} className="relative">
                {/* Remove button in edit mode */}
                {editMode && (
                    <button 
                        onClick={() => removeFromQuickPick(product.id)}
                        className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
                <button 
                    onClick={() => !editMode && handleAddProduct(product)}
                    disabled={editMode}
                    className={`w-full bg-white border rounded-xl p-3 h-28 flex flex-col justify-between shadow-sm transition-all active:scale-[0.98] group ${
                        editMode 
                            ? 'border-red-200 bg-red-50 cursor-default animate-pulse' 
                            : 'border-slate-200 hover:shadow-md hover:border-blue-400 hover:bg-blue-50'
                    }`}
                >
                    {/* SKU Badge */}
                    <div className="w-full flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded group-hover:bg-white group-hover:text-blue-500 transition-colors font-mono">
                            {product.sku || `P${product.id}`}
                        </span>
                    </div>
                    
                    {/* Product Name */}
                    <div className="text-sm font-bold text-slate-700 leading-tight line-clamp-2 group-hover:text-blue-700 text-left">
                        {product.name}
                    </div>
                    
                    {/* Price */}
                    <div className="w-full flex justify-end">
                        <span className="text-sm font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {formatPrice(product.price)}
                        </span>
                    </div>
                </button>
            </div>
        ))}

        {/* Manual Add Button */}
        <button 
            onClick={onAddQuickItemClick}
            className="border-2 border-dashed border-slate-300 rounded-xl p-3 h-28 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all active:scale-[0.98]"
        >
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <Plus className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wide">Add item</span>
        </button>

      </div>

      {/* Empty State */}
      {!loading && products.length === 0 && (
        <div className="text-center py-8 text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No quick pick items yet</p>
            <p className="text-xs mt-1">Click "Add item" to search and add products</p>
        </div>
      )}
    </div>
  );
}