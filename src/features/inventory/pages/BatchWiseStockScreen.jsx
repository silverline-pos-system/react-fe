import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Download, Search, RefreshCw, Package, AlertTriangle, Calendar, ChevronDown, X, ArrowUp, ArrowDown } from 'lucide-react';
import storeService from '@/features/inventory/services/storeService';
import Pagination from '@/shared/components/Pagination';

const BatchWiseStockScreen = ({
    batches: initialBatches,
    items,
    batchFilterItem,
    setBatchFilterItem
}) => {
    const [batches, setBatches] = useState(initialBatches || []);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
        if (initialBatches && initialBatches.length > 0) {
            setBatches(initialBatches);
        }
    }, [initialBatches]);

    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const searchInputRef = useRef(null);
    const suggestionsRef = useRef(null);

    const [sortConfig, setSortConfig] = useState({ key: 'expiry_date', direction: 'asc' });

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const loadBatches = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const batchData = await storeService.getBatches();
            setBatches(batchData);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Error loading batches:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadBatches();
    }, [loadBatches]);

    useEffect(() => {
        const interval = setInterval(() => {
            loadBatches(true);
        }, 30000);

        return () => clearInterval(interval);
    }, [loadBatches]);

    const today = useMemo(() => new Date(), []);
    const thirtyDaysLater = useMemo(() => new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), [today]);

    const getBatchAlert = useCallback((expiryDate) => {
        const expiry = new Date(expiryDate);
        if (expiry < today) return 'Expired';
        if (expiry < thirtyDaysLater) return 'Near Expiry';
        return 'Safe';
    }, [today, thirtyDaysLater]);

    const suggestions = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase();
        return items
            .filter(item =>
                item.name?.toLowerCase().includes(query) ||
                item.sku?.toLowerCase().includes(query) ||
                item.barcode?.toLowerCase().includes(query)
            )
            .slice(0, 8);
    }, [searchQuery, items]);

    const filteredBatches = useMemo(() => {
        let result = batches;

        if (batchFilterItem) {
            result = result.filter(b => b.product_id === parseInt(batchFilterItem));
        }

        if (searchQuery.trim() && !batchFilterItem) {
            const query = searchQuery.toLowerCase();
            const matchingProductIds = items
                .filter(item =>
                    item.name?.toLowerCase().includes(query) ||
                    item.sku?.toLowerCase().includes(query)
                )
                .map(item => item.product_id);
            result = result.filter(b => matchingProductIds.includes(b.product_id));
        }

        result.sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];

            if (sortConfig.key === 'expiry_date' || sortConfig.key === 'manufacturing_date') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [batches, batchFilterItem, searchQuery, items, sortConfig]);

    const paginatedBatches = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredBatches.slice(start, start + itemsPerPage);
    }, [filteredBatches, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [batchFilterItem, searchQuery, sortConfig]);

    const stats = useMemo(() => {
        return {
            expired: filteredBatches.filter(b => getBatchAlert(b.expiry_date) === 'Expired').length,
            nearExpiry: filteredBatches.filter(b => getBatchAlert(b.expiry_date) === 'Near Expiry').length,
            safe: filteredBatches.filter(b => getBatchAlert(b.expiry_date) === 'Safe').length,
            totalQty: filteredBatches.reduce((sum, b) => sum + (b.qty || 0), 0),
            totalValue: filteredBatches.reduce((sum, b) => sum + (b.qty || 0) * (b.cost_price || 0), 0)
        };
    }, [filteredBatches, getBatchAlert]);

    const handleSearchKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedSuggestionIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedSuggestionIndex(prev =>
                    prev > 0 ? prev - 1 : suggestions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedSuggestionIndex >= 0) {
                    selectSuggestion(suggestions[selectedSuggestionIndex]);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedSuggestionIndex(-1);
                break;
        }
    };

    const selectSuggestion = (item) => {
        setBatchFilterItem(item.product_id.toString());
        setSearchQuery(item.name);
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setBatchFilterItem('');
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        searchInputRef.current?.focus();
    };

    const toggleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
                searchInputRef.current && !searchInputRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExportReport = () => {
        const headers = ['📌 Product Name', '📌 Batch Code', '📊 Quantity', '💵 Selling Price', '🏷️ MRP', '💰 Cost Price', '📅 Expiry Date', '📅 Mfg Date', '⚠️ Alert Status'];

        const csvContent = [
            headers.join(','),
            ...filteredBatches.map(b => {
                const product = items.find(i => i.product_id === b.product_id);
                const alertStatus = getBatchAlert(b.expiry_date);

                let statusWithEmoji = alertStatus;
                if (alertStatus === 'Expired') statusWithEmoji = '🔴 Expired';
                else if (alertStatus === 'Near Expiry') statusWithEmoji = '🟡 Near Expiry';
                else statusWithEmoji = '🟢 Safe';

                const safeName = `"${(product?.name || '').replace(/"/g, '""')}"`;
                const safeBatch = `"${(b.batch_code || '').replace(/"/g, '""')}"`;

                const sellingPrice = b.selling_price != null ? Number(b.selling_price) : (product?.selling_price || 0);
                const mrp = b.mrp != null ? Number(b.mrp) : (product?.mrp || 0);

                return [
                    safeName,
                    safeBatch,
                    b.qty,
                    sellingPrice.toFixed(2),
                    mrp.toFixed(2),
                    (b.cost_price || 0).toFixed(2),
                    b.expiry_date,
                    b.manufacturing_date,
                    statusWithEmoji
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `batch_stock_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="ml-3 text-gray-600">Loading batch data...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-500 drop-shadow-sm">
                        Batch-wise Stock View
                    </h2>
                    <p className="text-gray-600 mt-1 flex items-center gap-2">
                        Track inventory by batch with expiry monitoring
                        <span className="text-xs text-gray-400">
                            Auto-updates every 30s • Last: {lastUpdated.toLocaleTimeString()}
                        </span>
                    </p>
                </div>
                <button
                    onClick={() => loadBatches(true)}
                    disabled={refreshing}
                    className={`p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}
                >
                    <RefreshCw size={18} className="text-gray-500" />
                </button>
            </div>

            <div className="grid grid-cols-5 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 hover:shadow-md transition-all">
                    <p className="text-sm text-red-600 font-semibold">Expired Stock</p>
                    <p className="text-2xl font-bold text-red-700 mt-2">{stats.expired}</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 hover:shadow-md transition-all">
                    <p className="text-sm text-yellow-600 font-semibold">Near Expiry</p>
                    <p className="text-2xl font-bold text-yellow-700 mt-2">{stats.nearExpiry}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-all">
                    <p className="text-sm text-green-600 font-semibold">Safe Stock</p>
                    <p className="text-2xl font-bold text-green-700 mt-2">{stats.safe}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-all">
                    <p className="text-sm text-blue-600 font-semibold">Total Quantity</p>
                    <p className="text-2xl font-bold text-blue-700 mt-2">{stats.totalQty.toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-all">
                    <p className="text-sm text-purple-600 font-semibold">Stock Value</p>
                    <p className="text-2xl font-bold text-purple-700 mt-2">
                        LKR {(stats.totalValue / 1000).toFixed(1)}K
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-end gap-4">
                    <div className="flex-1 relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Product
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                    setSelectedSuggestionIndex(-1);
                                    if (!e.target.value.trim()) setBatchFilterItem('');
                                }}
                                onFocus={() => searchQuery && setShowSuggestions(true)}
                                onKeyDown={handleSearchKeyDown}
                                placeholder="Search by product name, SKU, or barcode..."
                                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {showSuggestions && suggestions.length > 0 && (
                            <div
                                ref={suggestionsRef}
                                className="absolute z-50 top-full mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-64 overflow-y-auto"
                            >
                                <div className="p-2 text-xs text-gray-500 border-b border-gray-100 flex items-center gap-2">
                                    <ArrowUp className="w-3 h-3" />
                                    <ArrowDown className="w-3 h-3" />
                                    <span>Navigate</span>
                                    <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-xs">Enter</span>
                                    <span>Select</span>
                                </div>
                                {suggestions.map((item, index) => (
                                    <div
                                        key={item.product_id}
                                        onClick={() => selectSuggestion(item)}
                                        className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${index === selectedSuggestionIndex
                                            ? 'bg-blue-50 border-l-3 border-blue-500'
                                            : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                            <Package className="w-4 h-4 text-gray-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                            <p className="text-xs text-gray-500">
                                                SKU: {item.sku} • LKR {item.selling_price?.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-mono ${(item.quantity || 0) <= (item.reorder_level || 0)
                                                ? 'text-red-600'
                                                : 'text-green-600'
                                                }`}>
                                                {item.quantity || 0} in stock
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="w-64">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by Product
                        </label>
                        <select
                            value={batchFilterItem}
                            onChange={(e) => {
                                setBatchFilterItem(e.target.value);
                                if (e.target.value) {
                                    const item = items.find(i => i.product_id === parseInt(e.target.value));
                                    setSearchQuery(item?.name || '');
                                } else {
                                    setSearchQuery('');
                                }
                            }}
                            className="w-full"
                        >
                            <option value="">All Products</option>
                            {items.map((item) => (
                                <option key={item.product_id} value={item.product_id}>{item.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleExportReport}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
                    >
                        <Download size={18} />
                        Export Report
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between px-2 text-sm text-gray-600">
                <span>
                    Showing {filteredBatches.length} batch{filteredBatches.length !== 1 ? 'es' : ''}
                    {batchFilterItem && (
                        <span className="ml-1">
                            for "{items.find(i => i.product_id === parseInt(batchFilterItem))?.name}"
                        </span>
                    )}
                </span>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th
                                className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                                onClick={() => toggleSort('product_id')}
                            >
                                <div className="flex items-center gap-1">
                                    Product Name
                                    {sortConfig.key === 'product_id' && (
                                        <ChevronDown className={`w-3 h-3 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                                    )}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Batch Code</th>
                            <th
                                className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                                onClick={() => toggleSort('qty')}
                            >
                                <div className="flex items-center gap-1">
                                    Quantity
                                    {sortConfig.key === 'qty' && (
                                        <ChevronDown className={`w-3 h-3 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                                    )}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Selling Price</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">MRP</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Cost Price</th>
                            <th
                                className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                                onClick={() => toggleSort('expiry_date')}
                            >
                                <div className="flex items-center gap-1">
                                    Expiry Date
                                    {sortConfig.key === 'expiry_date' && (
                                        <ChevronDown className={`w-3 h-3 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                                    )}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Mfg Date</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Alert</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredBatches.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="font-medium">No batches found</p>
                                    <p className="text-sm mt-1">Try adjusting your search or filter</p>
                                </td>
                            </tr>
                        ) : (
                            paginatedBatches.map((b) => {
                                const product = items.find(i => i.product_id === b.product_id);
                                const sellingPrice = b.selling_price != null ? Number(b.selling_price) : (product?.selling_price || 0);
                                const mrp = b.mrp != null ? Number(b.mrp) : (product?.mrp || 0);
                                const isBatchSpecificSelling = b.selling_price != null;
                                const isBatchSpecificMrp = b.mrp != null;

                                const isAboutToExpire = (date) => {
                                    if (!date) return false;
                                    const expiry = new Date(date);
                                    const now = new Date();
                                    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
                                    return diffDays <= 30 && diffDays > 0;
                                };

                                const isExpired = (date) => {
                                    if (!date) return false;
                                    return new Date(date) < new Date();
                                };

                                return (
                                    <tr key={b.batch_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                    <Package size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                                                        {product?.name || 'Unknown Product'}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-mono tracking-wider">
                                                        {product?.sku || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5 font-mono text-sm font-medium text-gray-700">
                                                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                                {b.batch_code}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${Number(b.qty) <= (product?.reorder_level || 5) ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                                {Number(b.qty).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-sm font-mono font-bold ${isBatchSpecificSelling ? 'text-brand-primary' : 'text-gray-600'}`}>
                                                    LKR {sellingPrice.toFixed(2)}
                                                </span>
                                                {isBatchSpecificSelling && (
                                                    <span className="text-[9px] px-1 bg-blue-50 text-blue-600 rounded mt-0.5 font-bold uppercase tracking-tighter">Batch Price</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-sm font-mono font-bold ${isBatchSpecificMrp ? 'text-amber-700' : 'text-gray-600'}`}>
                                                    LKR {mrp.toFixed(2)}
                                                </span>
                                                {isBatchSpecificMrp && (
                                                    <span className="text-[9px] px-1 bg-amber-50 text-amber-600 rounded mt-0.5 font-bold uppercase tracking-tighter">Batch MRP</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right text-sm font-mono text-gray-600">
                                            LKR {Number(b.cost_price || 0).toFixed(2)}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`text-xs font-medium ${isAboutToExpire(b.expiry_date) || isExpired(b.expiry_date) ? 'text-red-600' : 'text-gray-600'}`}>
                                                    {b.expiry_date || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center text-xs text-gray-500">
                                            {b.manufacturing_date || '-'}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {isExpired(b.expiry_date) ? (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase">Expired</span>
                                            ) : isAboutToExpire(b.expiry_date) ? (
                                                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase">Soon</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Good</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredBatches.length / itemsPerPage)}
                    onPageChange={setCurrentPage}
                    totalItems={filteredBatches.length}
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                />
            </div>
        </div>
    );
};

export default BatchWiseStockScreen;
