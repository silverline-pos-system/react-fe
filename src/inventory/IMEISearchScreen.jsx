import React, { useEffect, useMemo, useState } from 'react';
import { Search, Loader2, Tag, Calendar, MapPin, User, CheckCircle, Smartphone, AlertCircle, History, Filter } from 'lucide-react';
import inventoryService from '../services/inventoryService';
import Pagination from '../components/Pagination';

const IMEISearchScreen = ({ branches = [], items = [], initialFilters = null }) => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [serialData, setSerialData] = useState(null);
    const [error, setError] = useState(null);

    const [listLoading, setListLoading] = useState(false);
    const [listRows, setListRows] = useState([]);
    const [listPage, setListPage] = useState(1);
    const [listPerPage, setListPerPage] = useState(20);
    const [listTotalPages, setListTotalPages] = useState(0);
    const [listTotalItems, setListTotalItems] = useState(0);

    const [branchFilter, setBranchFilter] = useState('');
    const [productFilter, setProductFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchFilter, setSearchFilter] = useState('');

    const [branchIdsFilter, setBranchIdsFilter] = useState([]);
    const [productIdsFilter, setProductIdsFilter] = useState([]);

    useEffect(() => {
        if (!initialFilters) return;

        if (Array.isArray(initialFilters.branchIds) && initialFilters.branchIds.length > 0) {
            setBranchIdsFilter(initialFilters.branchIds);
            if (initialFilters.branchIds.length === 1) {
                setBranchFilter(String(initialFilters.branchIds[0]));
            }
        }

        if (Array.isArray(initialFilters.productIds) && initialFilters.productIds.length > 0) {
            setProductIdsFilter(initialFilters.productIds);
            if (initialFilters.productIds.length === 1) {
                setProductFilter(String(initialFilters.productIds[0]));
            }
        }

        if (Array.isArray(initialFilters.imeis) && initialFilters.imeis.length > 0) {
            setSearchFilter(initialFilters.imeis[0]);
            setQuery(initialFilters.imeis[0]);
        }
    }, [initialFilters]);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setSerialData(null);

        try {
            const result = await inventoryService.getSerialByNo(query.trim());
            if (result) {
                setSerialData(result);
            } else {
                setError('No serial record found for this IMEI/Serial number.');
            }
        } catch (err) {
            console.error('Error fetching serial:', err);
            setError(err.response?.data?.message || 'Failed to search serial. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchList = async () => {
        setListLoading(true);
        try {
            const useBranchIds = branchFilter ? [] : branchIdsFilter;
            const useProductIds = productFilter ? [] : productIdsFilter;

            const result = await inventoryService.lookupSerials({
                branchId: branchFilter ? Number(branchFilter) : undefined,
                productId: productFilter ? Number(productFilter) : undefined,
                branchIds: useBranchIds,
                productIds: useProductIds,
                status: statusFilter || undefined,
                search: searchFilter || undefined,
                page: listPage - 1,
                size: listPerPage
            });

            setListRows(result.rows || []);
            setListTotalPages(result.totalPages || 0);
            setListTotalItems(result.totalElements || 0);
        } catch (err) {
            console.error('Failed to load serial list', err);
            setListRows([]);
            setListTotalPages(0);
            setListTotalItems(0);
        } finally {
            setListLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, [listPage, listPerPage, branchFilter, productFilter, statusFilter, searchFilter, branchIdsFilter, productIdsFilter]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'IN_STOCK': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'SOLD': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'DAMAGED': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'RETURNED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const statusSummary = useMemo(() => {
        if (!Array.isArray(listRows)) return {};
        return listRows.reduce((acc, row) => {
            const key = row?.status || 'UNKNOWN';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
    }, [listRows]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-800">IMEI / Serial Finder</h1>
                <p className="text-slate-500">Track serialized items by branch, product, and status in real time.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Scan or Enter IMEI / Serial Number..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-200"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        Search
                    </button>
                </form>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-600">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {serialData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                        <div className="p-1 px-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Item Information</span>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${getStatusColor(serialData.status)}`}>
                                {serialData.status}
                            </span>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-indigo-50 rounded-lg"><Smartphone className="w-5 h-5 text-indigo-600" /></div>
                                <div>
                                    <p className="text-sm text-slate-500">Product Name</p>
                                    <p className="font-bold text-slate-900">{serialData.productName}</p>
                                    <p className="text-xs text-slate-400 font-mono">SKU: {serialData.productSku}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-50 rounded-lg"><Tag className="w-5 h-5 text-slate-600" /></div>
                                <div>
                                    <p className="text-sm text-slate-500">IMEI/Serial Number</p>
                                    <p className="font-bold text-slate-900 font-mono">{serialData.serialNo}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-50 rounded-lg"><MapPin className="w-5 h-5 text-slate-600" /></div>
                                <div>
                                    <p className="text-sm text-slate-500">Current Branch</p>
                                    <p className="font-semibold text-slate-800">{serialData.branchName || 'Branch ' + serialData.branchId}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-50 rounded-lg"><History className="w-5 h-5 text-slate-600" /></div>
                                <div>
                                    <p className="text-sm text-slate-500">Batch Code</p>
                                    <p className="font-semibold text-slate-800">{serialData.batchCode || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                        <div className="p-1 px-4 bg-slate-50 border-b border-slate-100">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Lifecycle Details</span>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Calendar className="w-4 h-4" /> Received Details</h3>
                                <div className="pl-6 border-l-2 border-slate-100 space-y-3">
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-semibold">Received On</p>
                                        <p className="text-sm text-slate-800 font-medium">{formatDate(serialData.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-semibold">Dispatch / Dispatch Ref</p>
                                        <p className="text-sm text-indigo-600 font-semibold">{serialData.dispatchId ? 'Dispatch-' + serialData.dispatchId : 'Direct'}</p>
                                    </div>
                                </div>
                            </div>

                            {serialData.status === 'SOLD' && (
                                <div className="space-y-4 pt-2 border-t border-slate-100">
                                    <h3 className="text-sm font-bold text-amber-600 flex items-center gap-2"><Smartphone className="w-4 h-4" /> Sale Information</h3>
                                    <div className="pl-6 border-l-2 border-amber-200 space-y-3">
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-semibold">Sold On</p>
                                            <p className="text-sm text-slate-800 font-medium">{formatDate(serialData.soldAt)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-semibold">Invoice Number</p>
                                            <p className="text-sm text-emerald-600 font-bold">{serialData.invoiceNo || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-semibold">Customer</p>
                                            <div className="flex items-center gap-2"><User className="w-3 h-3 text-slate-400" /><p className="text-sm text-slate-800 font-semibold">{serialData.customerName || 'Walk-in Customer'}</p></div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-semibold">Sold By</p>
                                            <p className="text-sm text-slate-800">{serialData.cashierName || 'System'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {serialData.status === 'IN_STOCK' && (
                                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <CheckCircle className="w-10 h-10 text-emerald-500 mb-2 opacity-50" />
                                    <p className="text-slate-500 text-sm font-medium">Item is currently in stock and available for sale.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2"><Filter size={16} className="text-indigo-600" /> Branch/Product IMEI View</h2>
                    <div className="text-xs text-slate-500">Total: {listTotalItems}</div>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3 border-b border-slate-100">
                    <select className="border border-slate-300 rounded-lg p-2 text-sm" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
                        <option value="">All Branches</option>
                        {branches.map((branch) => <option key={branch.branch_id} value={branch.branch_id}>{branch.name}</option>)}
                    </select>

                    <select className="border border-slate-300 rounded-lg p-2 text-sm" value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
                        <option value="">All Products</option>
                        {items.map((product) => <option key={product.product_id} value={product.product_id}>{product.name}</option>)}
                    </select>

                    <select className="border border-slate-300 rounded-lg p-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All Statuses</option>
                        <option value="IN_STOCK">IN_STOCK</option>
                        <option value="SOLD">SOLD</option>
                        <option value="DAMAGED">DAMAGED</option>
                        <option value="RETURNED">RETURNED</option>
                    </select>

                    <input
                        type="text"
                        className="border border-slate-300 rounded-lg p-2 text-sm"
                        placeholder="Search IMEI"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                    />

                    <button
                        type="button"
                        className="border border-slate-300 rounded-lg p-2 text-sm hover:bg-slate-50"
                        onClick={() => {
                            setBranchFilter('');
                            setProductFilter('');
                            setStatusFilter('');
                            setSearchFilter('');
                            setBranchIdsFilter([]);
                            setProductIdsFilter([]);
                        }}
                    >
                        Reset
                    </button>
                </div>

                <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap gap-2 text-xs">
                    {Object.keys(statusSummary).length === 0 && <span className="text-slate-400">No status summary available.</span>}
                    {Object.entries(statusSummary).map(([status, count]) => (
                        <span key={status} className={`px-2 py-1 rounded-full border font-semibold ${getStatusColor(status)}`}>
                            {status}: {count}
                        </span>
                    ))}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">IMEI/Serial</th>
                                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Product</th>
                                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Branch</th>
                                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Status</th>
                                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Batch</th>
                                <th className="text-left px-4 py-3 text-xs uppercase text-slate-500">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {listLoading && (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                                        <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" /> Loading serials...
                                    </td>
                                </tr>
                            )}
                            {!listLoading && (!Array.isArray(listRows) || listRows.length === 0) && (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500">No IMEI/serial records found for current filters.</td>
                                </tr>
                            )}
                            {!listLoading && Array.isArray(listRows) && listRows.map((row) => (
                                <tr key={row.serialId || row.serialNo} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">{row.serialNo}</td>
                                    <td className="px-4 py-3 text-slate-700">{row.productName || 'Product ' + row.productId}</td>
                                    <td className="px-4 py-3 text-slate-700">{row.branchName || 'Branch ' + row.branchId}</td>
                                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full border text-xs font-semibold ${getStatusColor(row.status)}`}>{row.status}</span></td>
                                    <td className="px-4 py-3 text-slate-600">{row.batchCode || '-'}</td>
                                    <td className="px-4 py-3 text-slate-600">{formatDate(row.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={listPage}
                    totalPages={listTotalPages || 1}
                    onPageChange={setListPage}
                    totalItems={listTotalItems}
                    itemsPerPage={listPerPage}
                    setItemsPerPage={setListPerPage}
                />
            </div>
        </div>
    );
};

export default IMEISearchScreen;

