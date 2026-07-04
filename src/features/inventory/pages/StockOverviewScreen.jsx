import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, Calendar, Download } from 'lucide-react';
import storeService from '@/features/inventory/services/storeService';

const StockOverviewScreen = ({
    items,
    categories,
    branches,
    stockFilterCategory,
    setStockFilterCategory,
    stockFilterBranch,
    setStockFilterBranch,
    stockFilterDate,
    setStockFilterDate
}) => {
    const [stockOverview, setStockOverview] = useState(null);

    useEffect(() => {
        const loadStockOverview = async () => {
            try {
                const overview = await storeService.getStockOverview();
                setStockOverview(overview);
            } catch (err) {
                console.error('Error loading stock overview:', err);
            }
        };
        loadStockOverview();
    }, []);

    const filteredItems = items.filter(item => {
        if (stockFilterCategory && item.category_id !== parseInt(stockFilterCategory)) return false;
        return true;
    });

    const lowStockItems = stockOverview?.low_stock_count || filteredItems.filter(i => i.reorder_level && i.reorder_level > 0).length;
    const outOfStockItems = stockOverview?.out_of_stock_count || 0;
    const expiringItems = stockOverview?.expiring_soon_count || 0;
    const totalValue = stockOverview?.total_stock_value || filteredItems.reduce((sum, i) => sum + (i.selling_price || 0), 0);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-500 drop-shadow-sm">Stock Overview</h2>
                <p className="text-gray-600 mt-1">Real-time inventory dashboard</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">By Category</label>
                        <select value={stockFilterCategory} onChange={(e) => setStockFilterCategory(e.target.value)} className="w-full">
                            <option value="">All Categories</option>
                            {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">By Branch / Store</label>
                        <select value={stockFilterBranch} onChange={(e) => setStockFilterBranch(e.target.value)} className="w-full">
                            <option value="">All Locations</option>
                            {branches.map((b) => <option key={b.branch_id} value={b.branch_id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry By Date</label>
                        <input value={stockFilterDate} onChange={(e) => setStockFilterDate(e.target.value)} type="date" className="w-full" />
                    </div>
                </div>
                <button onClick={() => { setStockFilterCategory(''); setStockFilterBranch(''); setStockFilterDate(''); }} className="mt-4 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Clear Filters</button>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-5 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Items</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{filteredItems.length}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg"><Package className="text-blue-600" size={24} /></div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Stock Value</p>
                            <p className="text-2xl font-bold text-green-600 mt-2">LKR {(totalValue / 1000).toFixed(1)}k</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg"><TrendingUp className="text-green-600" size={24} /></div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Low Stock Items</p>
                            <p className="text-3xl font-bold text-orange-600 mt-2">{lowStockItems}</p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg"><AlertTriangle className="text-orange-600" size={24} /></div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Out of Stock</p>
                            <p className="text-3xl font-bold text-red-600 mt-2">{outOfStockItems}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-lg"><AlertTriangle className="text-red-600" size={24} /></div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Expiring Soon</p>
                            <p className="text-3xl font-bold text-purple-600 mt-2">{expiringItems}</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg"><Calendar className="text-purple-600" size={24} /></div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Warehouse</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Expiry Date</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredItems.map((item) => (
                            <tr key={item.product_id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{item.category_id}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">-</td>
                                <td className="px-6 py-4 text-sm font-mono text-gray-900">-</td>
                                <td className="px-6 py-4 text-sm font-mono text-gray-900">LKR {item.selling_price.toFixed(2)}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">-</td>
                                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.is_active ? 'Active' : 'Inactive'}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockOverviewScreen;
