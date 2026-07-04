import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Plus, Search, Filter, Download,
    RefreshCw, Package, AlertTriangle, TrendingUp,
    ChevronDown, CheckCircle, XCircle,
    BarChart3, Tag
} from 'lucide-react';
import Pagination from '@/components/common/Pagination';

const ItemListScreen = ({
    items,
    searchQuery,
    setSearchQuery,
    setIsAddModalOpen,
    setSelectedItemId,
    setActiveScreen,
    categories,
    onRefresh
}) => {
    const getProductId = useCallback((item) => item?.product_id ?? item?.productId ?? item?.id, []);

    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        category: '',
        stockStatus: '',
        status: ''
    });
    const filterRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showFilters && filterRef.current && !filterRef.current.contains(e.target)) {
                setShowFilters(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showFilters]);

    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [selectedItems, setSelectedItems] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [focusedIndex, setFocusedIndex] = useState(-1);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const getAvailableQty = useCallback((item) => {
        const rawQty = item?.quantity ?? item?.available_quantity ?? item?.stock_quantity ?? item?.current_stock ?? item?.qty ?? 0;
        const qty = Number(rawQty);
        return Number.isNaN(qty) ? 0 : qty;
    }, []);

    useEffect(() => {
        setCurrentPage(1);
        setFocusedIndex(-1);
    }, [searchQuery, filters, sortConfig]);

    const handleRefresh = useCallback(async (silent = false) => {
        if (!silent) setRefreshing(true);
        try {
            if (onRefresh) await onRefresh();
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Error refreshing items:', err);
        } finally {
            setRefreshing(false);
        }
    }, [onRefresh]);

    useEffect(() => {
        const interval = setInterval(() => {
            handleRefresh(true);
        }, 30000);

        return () => clearInterval(interval);
    }, [handleRefresh]);

    const stats = useMemo(() => {
        const totalItems = items.length;
        const activeItems = items.filter(i => i.is_active).length;
        const lowStockItems = items.filter(i => getAvailableQty(i) <= (i.reorder_level || 0) && getAvailableQty(i) > 0).length;
        const outOfStock = items.filter(i => getAvailableQty(i) <= 0).length;
        const totalValue = items.reduce((sum, i) => sum + getAvailableQty(i) * (i.selling_price || 0), 0);

        return { totalItems, activeItems, lowStockItems, outOfStock, totalValue };
    }, [items, getAvailableQty]);

    const filteredItems = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        let result = items.filter((item) => {
            const matchesSearch = !normalizedSearch ||
                (item.name || item.product_name || '').toLowerCase().includes(normalizedSearch) ||
                (item.sku || '').toLowerCase().includes(normalizedSearch) ||
                (item.barcode || '').toLowerCase().includes(normalizedSearch);

            const matchesCategory = filters.category ? item.category_id === filters.category : true;

            let matchesStock = true;
            if (filters.stockStatus === 'low') matchesStock = getAvailableQty(item) <= (item.reorder_level || 0) && getAvailableQty(item) > 0;
            else if (filters.stockStatus === 'out') matchesStock = getAvailableQty(item) <= 0;
            else if (filters.stockStatus === 'in') matchesStock = getAvailableQty(item) > (item.reorder_level || 0);

            const matchesStatus = filters.status === 'active' ? item.is_active :
                filters.status === 'inactive' ? !item.is_active : true;

            return matchesSearch && matchesCategory && matchesStock && matchesStatus;
        });

        result.sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];

            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [items, searchQuery, filters, sortConfig, getAvailableQty]);

    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredItems.slice(start, start + itemsPerPage);
    }, [filteredItems, currentPage, itemsPerPage]);

    const clearFilters = () => {
        setFilters({ category: '', stockStatus: '', status: '' });
    };

    const toggleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === filteredItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredItems.map(i => getProductId(i)).filter(Boolean));
        }
    };

    const toggleSelectItem = (productId, e) => {
        e.stopPropagation();
        setSelectedItems(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (paginatedItems.length === 0) return;

            if (document.activeElement.tagName === 'INPUT' && document.activeElement.placeholder !== "Search items by name, SKU, or barcode...") {
                return;
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedIndex(prev => (prev < paginatedItems.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
            } else if (e.key === 'Enter') {
                if (focusedIndex >= 0 && focusedIndex < paginatedItems.length) {
                    const item = paginatedItems[focusedIndex];
                    setSelectedItemId(getProductId(item));
                    setActiveScreen('item-detail');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [paginatedItems, focusedIndex, setSelectedItemId, setActiveScreen, getProductId]);

    const getStockIndicator = (item) => {
        const qty = getAvailableQty(item);
        const reorder = item.reorder_level || 0;

        if (qty <= 0) return { color: 'text-red-600 bg-red-50', label: 'Out of Stock', icon: XCircle };
        if (qty <= reorder) return { color: 'text-amber-600 bg-amber-50', label: 'Low Stock', icon: AlertTriangle };
        if (qty > reorder * 2) return { color: 'text-emerald-600 bg-emerald-50', label: 'In Stock', icon: CheckCircle };
        return { color: 'text-blue-600 bg-blue-50', label: 'Normal', icon: Package };
    };

    const handleExport = () => {
        const headers = ['📌 SKU', '📦 Item Name', '🏷️ Category', '📊 Quantity', '📉 Reorder Level', '🟢 Status'];
        const csvContent = [
            headers.join(','),
            ...filteredItems.map(item => {
                const availableQty = getAvailableQty(item);
                const isLowStock = availableQty <= (item.reorder_level || 0);
                const quantityWithEmoji = isLowStock ? `⚠️ ${availableQty}` : `✅ ${availableQty}`;
                const statusWithEmoji = item.is_active ? '✅ Active' : '❌ Inactive';

                return [
                    item.sku,
                    `"${item.name.replace(/"/g, '""')}"`,
                    `"${(categories?.find(c => c.category_id === item.category_id)?.name || item.category_id || '').replace(/"/g, '""')}"`,
                    quantityWithEmoji,
                    item.reorder_level,
                    statusWithEmoji
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `item_list_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-500 drop-shadow-sm">
                        Item List
                    </h2>
                    <p className="text-gray-600 mt-2 font-medium flex items-center gap-2">
                        Manage your inventory items
                        <span className="text-xs text-gray-400">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleRefresh(false)}
                        className={`p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}
                        disabled={refreshing}
                    >
                        <RefreshCw size={18} className="text-gray-500" />
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-brand-primary text-white rounded-lg flex items-center gap-2 hover:bg-brand-secondary transition-colors btn-hover-scale btn-interactive"
                    >
                        <Plus size={20} />
                        Add New Item
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-800 mt-3">{stats.totalItems}</p>
                    <p className="text-sm text-gray-500">Total Items</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 mt-3">{stats.activeItems}</p>
                    <p className="text-sm text-gray-500">Active Items</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-amber-600 mt-3">{stats.lowStockItems}</p>
                    <p className="text-sm text-gray-500">Low Stock</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-red-600 mt-3">{stats.outOfStock}</p>
                    <p className="text-sm text-gray-500">Out of Stock</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 mt-3">
                        LKR {(stats.totalValue / 1000).toFixed(1)}K
                    </p>
                    <p className="text-sm text-gray-500">Total Value</p>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search items by name, SKU, or barcode..."
                        className="w-full pl-10 pr-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <XCircle size={16} />
                        </button>
                    )}
                </div>
                <div className="relative" ref={filterRef}>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${showFilters || activeFilterCount > 0 ? 'border-brand-primary bg-blue-50 text-brand-primary' : 'border-gray-300 hover:bg-gray-50'}`}
                    >
                        <Filter size={20} />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="flex items-center justify-center bg-brand-primary text-white text-xs font-bold rounded-full w-5 h-5">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    {showFilters && (
                        <div className="absolute top-full mt-2 right-0 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Filter Items</h3>
                                {activeFilterCount > 0 && (
                                    <button onClick={clearFilters} className="text-xs text-red-600 hover:text-red-700 font-medium">
                                        Clear all
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Category</label>
                                    <select
                                        value={filters.category}
                                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                        className="w-full text-sm"
                                    >
                                        <option value="">All Categories</option>
                                        {categories?.map(cat => (
                                            <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Stock Status</label>
                                    <select
                                        value={filters.stockStatus}
                                        onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
                                        className="w-full text-sm"
                                    >
                                        <option value="">All Stock Levels</option>
                                        <option value="in">In Stock</option>
                                        <option value="low">Low Stock</option>
                                        <option value="out">Out of Stock</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Item Status</label>
                                    <div className="flex rounded-lg border border-gray-200 p-1">
                                        <button
                                            onClick={() => setFilters({ ...filters, status: '' })}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded ${!filters.status ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                        >
                                            All
                                        </button>
                                        <button
                                            onClick={() => setFilters({ ...filters, status: 'active' })}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded ${filters.status === 'active' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-900'}`}
                                        >
                                            Active
                                        </button>
                                        <button
                                            onClick={() => setFilters({ ...filters, status: 'inactive' })}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded ${filters.status === 'inactive' ? 'bg-red-100 text-red-700' : 'text-gray-500 hover:text-gray-900'}`}
                                        >
                                            Inactive
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <button
                    onClick={handleExport}
                    className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
                >
                    <Download size={20} />
                    Export
                </button>
            </div>

            <div className="flex items-center justify-between px-2 text-sm text-gray-600">
                <span>
                    Showing {filteredItems.length} of {items.length} items
                    {searchQuery && <span className="ml-1">for "{searchQuery}"</span>}
                </span>
                {selectedItems.length > 0 && (
                    <span className="text-brand-primary font-medium">
                        {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                    </span>
                )}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                />
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                                onClick={() => toggleSort('sku')}
                            >
                                <div className="flex items-center gap-1">
                                    SKU
                                    {sortConfig.key === 'sku' && (
                                        <ChevronDown className={`w-3 h-3 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                                    )}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                                onClick={() => toggleSort('name')}
                            >
                                <div className="flex items-center gap-1">
                                    Item Name
                                    {sortConfig.key === 'name' && (
                                        <ChevronDown className={`w-3 h-3 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                                    )}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Category</th>
                            <th
                                className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                                onClick={() => toggleSort('quantity')}
                            >
                                <div className="flex items-center gap-1">
                                    Quantity
                                    {sortConfig.key === 'quantity' && (
                                        <ChevronDown className={`w-3 h-3 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                                    )}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Stock Status</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="font-medium">No items found</p>
                                    <p className="text-sm mt-1">Try adjusting your search or filters</p>
                                </td>
                            </tr>
                        ) : (
                            paginatedItems.map((item, index) => {
                                const itemId = getProductId(item);
                                const stockIndicator = getStockIndicator(item);
                                const StockIcon = stockIndicator.icon;

                                return (
                                    <tr
                                        key={itemId || `${item.sku || 'item'}-${index}`}
                                        onClick={() => { setSelectedItemId(itemId); setActiveScreen('item-detail'); }}
                                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedItems.includes(itemId) ? 'bg-blue-50' : ''} ${focusedIndex === index ? 'bg-blue-100 ring-2 ring-inset ring-brand-primary' : ''}`}
                                    >
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.includes(itemId)}
                                                onChange={(e) => toggleSelectItem(itemId, e)}
                                                className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-900">{item.sku}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    <Package className="w-4 h-4 text-gray-500" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">{item.name || item.product_name || 'Unnamed Item'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                                                <Tag className="w-3 h-3" />
                                                {categories?.find(c => c.category_id === item.category_id)?.name || item.category_id}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-900">{getAvailableQty(item)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stockIndicator.color}`}>
                                                <StockIcon className="w-3 h-3" />
                                                {stockIndicator.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-xs font-medium rounded ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {item.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredItems.length / itemsPerPage)}
                    onPageChange={setCurrentPage}
                    totalItems={filteredItems.length}
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                />
            </div>
        </div>
    );
};

export default ItemListScreen;
