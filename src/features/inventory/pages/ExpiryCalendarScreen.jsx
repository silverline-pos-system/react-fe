import React, { useState, useEffect, useMemo } from 'react';
import { Download, Calendar, AlertTriangle, XCircle, CheckCircle, Search, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import storeService from '@/features/inventory/services/storeService';

const ExpiryCalendarScreen = ({ batches: initialBatches }) => {
    const [batches, setBatches] = useState(initialBatches || []);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortDirection, setSortDirection] = useState('asc');
    const [daysRange, setDaysRange] = useState(90);
    const [expandedDates, setExpandedDates] = useState({});

    const loadExpiryData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const endDate = new Date(Date.now() + daysRange * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const expiryData = await storeService.getExpiryCalendar(startDate, endDate);
            setBatches(expiryData);
        } catch (err) {
            console.error('Error loading expiry data:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadExpiryData();
    }, [daysRange]);

    useEffect(() => {
        const interval = setInterval(() => loadExpiryData(true), 60000);
        return () => clearInterval(interval);
    }, [daysRange]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getExpiryStatus = (expiryDate) => {
        const date = new Date(expiryDate);
        date.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { status: 'expired', label: 'Expired', daysText: `${Math.abs(diffDays)} days ago`, color: 'red', priority: 0 };
        if (diffDays === 0) return { status: 'expired', label: 'Expires Today', daysText: 'Today', color: 'red', priority: 0 };
        if (diffDays <= 7) return { status: 'near-expiry', label: 'Critical', daysText: `${diffDays} day${diffDays !== 1 ? 's' : ''} left`, color: 'orange', priority: 1 };
        if (diffDays <= 30) return { status: 'warning', label: 'Near Expiry', daysText: `${diffDays} days left`, color: 'yellow', priority: 2 };
        return { status: 'safe', label: 'Safe', daysText: `${diffDays} days left`, color: 'green', priority: 3 };
    };

    const processedData = useMemo(() => {
        const dateMap = {};

        batches.forEach(batch => {
            if (!batch.expiry_date) return;
            const expiryInfo = getExpiryStatus(batch.expiry_date);
            const dateStr = batch.expiry_date;
            const productName = batch.product_name || batch.name || batch.batch_code || 'Unknown Product';

            if (!dateMap[dateStr]) {
                dateMap[dateStr] = { date: dateStr, ...expiryInfo, items: [], totalQty: 0 };
            }
            dateMap[dateStr].items.push({ ...batch, productName, expiryInfo });
            dateMap[dateStr].totalQty += Number(batch.qty || 0);
        });

        let entries = Object.values(dateMap);

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            entries = entries.map(entry => ({
                ...entry,
                items: entry.items.filter(item =>
                    (item.productName || '').toLowerCase().includes(q) ||
                    (item.batch_code || '').toLowerCase().includes(q) ||
                    (item.product_id || '').toString().includes(q)
                )
            })).filter(entry => entry.items.length > 0);
        }

        if (statusFilter !== 'all') {
            entries = entries.filter(entry => entry.status === statusFilter);
        }

        entries.sort((a, b) => {
            const comp = a.date.localeCompare(b.date);
            return sortDirection === 'asc' ? comp : -comp;
        });

        return entries;
    }, [batches, searchQuery, statusFilter, sortDirection]);

    const stats = useMemo(() => {
        let expired = 0, nearExpiry = 0, warning = 0, safe = 0;
        batches.forEach(batch => {
            if (!batch.expiry_date) return;
            const info = getExpiryStatus(batch.expiry_date);
            if (info.status === 'expired') expired++;
            else if (info.status === 'near-expiry') nearExpiry++;
            else if (info.status === 'warning') warning++;
            else safe++;
        });
        return { expired, nearExpiry, warning, safe, total: batches.length };
    }, [batches]);

    const toggleDateExpand = (dateStr) => {
        setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
    };

    const handleExportReport = () => {
        const nearExpiryItems = [];
        batches.forEach(batch => {
            if (!batch.expiry_date) return;
            const info = getExpiryStatus(batch.expiry_date);
            if (info.status === 'expired' || info.status === 'near-expiry' || info.status === 'warning') {
                nearExpiryItems.push({
                    productName: batch.product_name || batch.name || batch.batch_code || 'Unknown',
                    batchCode: batch.batch_code || 'N/A',
                    quantity: batch.qty || 0,
                    expiryDate: batch.expiry_date,
                    status: info.label,
                    daysRemaining: info.daysText,
                    branch: batch.branch_id || 'N/A'
                });
            }
        });

        nearExpiryItems.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

        const headers = ['Product Name', 'Batch Code', 'Quantity', 'Expiry Date', 'Status', 'Days Remaining', 'Branch'];
        const csvContent = [
            headers.join(','),
            ...nearExpiryItems.map(item => [
                `"${item.productName.replace(/"/g, '""')}"`,
                item.batchCode,
                item.quantity,
                item.expiryDate,
                item.status,
                `"${item.daysRemaining}"`,
                item.branch
            ].join(','))
        ].join('\n');

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `near_expiry_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'expired': return { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-800', dot: 'bg-red-500' };
            case 'near-expiry': return { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' };
            case 'warning': return { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' };
            case 'safe': return { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-800', dot: 'bg-green-500' };
            default: return { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-800', dot: 'bg-gray-500' };
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-500 drop-shadow-sm">Expiry Calendar</h2>
                    <p className="text-gray-600 mt-1">Monitor inventory expiry dates in real-time</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => loadExpiryData(true)}
                        className={`p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}
                        disabled={refreshing}
                        title="Refresh"
                    >
                        <RefreshCw size={18} className="text-gray-500" />
                    </button>
                    <button
                        onClick={handleExportReport}
                        className="px-4 py-2 bg-brand-primary text-white rounded-lg flex items-center gap-2 hover:bg-brand-secondary transition-colors"
                    >
                        <Download size={18} />
                        Export Near Expiry Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <button onClick={() => setStatusFilter('all')} className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all text-left ${statusFilter === 'all' ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-semibold text-gray-500 uppercase">Total</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                    <p className="text-xs text-gray-500">Batches tracked</p>
                </button>
                <button onClick={() => setStatusFilter(statusFilter === 'expired' ? 'all' : 'expired')} className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all text-left ${statusFilter === 'expired' ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-xs font-semibold text-gray-500 uppercase">Expired</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                    <p className="text-xs text-gray-500">Already expired</p>
                </button>
                <button onClick={() => setStatusFilter(statusFilter === 'near-expiry' ? 'all' : 'near-expiry')} className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all text-left ${statusFilter === 'near-expiry' ? 'border-orange-400 ring-2 ring-orange-100' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        <span className="text-xs font-semibold text-gray-500 uppercase">Critical</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">{stats.nearExpiry}</p>
                    <p className="text-xs text-gray-500">Within 7 days</p>
                </button>
                <button onClick={() => setStatusFilter(statusFilter === 'warning' ? 'all' : 'warning')} className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all text-left ${statusFilter === 'warning' ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <span className="text-xs font-semibold text-gray-500 uppercase">Near Expiry</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
                    <p className="text-xs text-gray-500">Within 30 days</p>
                </button>
                <button onClick={() => setStatusFilter(statusFilter === 'safe' ? 'all' : 'safe')} className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all text-left ${statusFilter === 'safe' ? 'border-green-400 ring-2 ring-green-100' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-xs font-semibold text-gray-500 uppercase">Safe</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{stats.safe}</p>
                    <p className="text-xs text-gray-500">&gt;30 days remaining</p>
                </button>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by product name, batch code..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    value={daysRange}
                    onChange={(e) => setDaysRange(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                    <option value={30}>Next 30 days</option>
                    <option value={60}>Next 60 days</option>
                    <option value={90}>Next 90 days</option>
                    <option value={180}>Next 6 months</option>
                    <option value={365}>Next 1 year</option>
                </select>
                <button
                    onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50"
                >
                    {sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {sortDirection === 'asc' ? 'Soonest First' : 'Latest First'}
                </button>
            </div>

            <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 text-xs">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div> Expired
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 text-xs">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div> Critical (≤7 days)
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 text-xs">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div> Near Expiry (≤30 days)
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 text-xs">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div> Safe (&gt;30 days)
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-8"></th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Expiry Date</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Products</th>
                            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Total Qty</th>
                            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Time Remaining</th>
                            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {processedData.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="font-medium">No expiry data found</p>
                                    <p className="text-sm mt-1">Try adjusting your search or date range</p>
                                </td>
                            </tr>
                        ) : (
                            processedData.map((entry) => {
                                const styles = getStatusStyles(entry.status);
                                const isExpanded = expandedDates[entry.date];
                                const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
                                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                                });

                                return (
                                    <React.Fragment key={entry.date}>
                                        <tr
                                            className={`${styles.bg} cursor-pointer hover:opacity-90 transition-opacity`}
                                            onClick={() => toggleDateExpand(entry.date)}
                                        >
                                            <td className="px-5 py-4 text-center">
                                                {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="text-sm font-semibold text-gray-900">{formattedDate}</div>
                                                <div className="text-xs text-gray-500">{entry.date}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="text-sm text-gray-700">
                                                    {entry.items.length} product{entry.items.length !== 1 ? 's' : ''}
                                                </div>
                                                {entry.items.length <= 2 && entry.items.map((item, idx) => (
                                                    <div key={idx} className="text-xs text-gray-500 truncate max-w-[200px]">
                                                        {item.productName}
                                                    </div>
                                                ))}
                                            </td>
                                            <td className="px-5 py-4 text-center text-sm font-mono font-medium">{entry.totalQty}</td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="text-sm font-medium" style={{ color: entry.color === 'red' ? '#dc2626' : entry.color === 'orange' ? '#ea580c' : entry.color === 'yellow' ? '#ca8a04' : '#16a34a' }}>
                                                    {entry.daysText}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles.badge}`}>
                                                    {entry.label}
                                                </span>
                                            </td>
                                        </tr>
                                        {isExpanded && entry.items.map((item, idx) => (
                                            <tr key={`${entry.date}-${idx}`} className="bg-white border-l-4" style={{ borderLeftColor: entry.color === 'red' ? '#dc2626' : entry.color === 'orange' ? '#ea580c' : entry.color === 'yellow' ? '#ca8a04' : '#16a34a' }}>
                                                <td className="px-5 py-3"></td>
                                                <td className="px-5 py-3 text-xs text-gray-500">
                                                    Batch: <span className="font-mono font-medium text-gray-700">{item.batch_code || 'N/A'}</span>
                                                </td>
                                                <td className="px-5 py-3 text-sm text-gray-800 font-medium">{item.productName}</td>
                                                <td className="px-5 py-3 text-center text-sm font-mono">{item.qty || 0}</td>
                                                <td className="px-5 py-3 text-center text-xs text-gray-500">
                                                    {item.branch_id ? `Branch: ${item.branch_id}` : ''}
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className={`px-2 py-0.5 text-xs rounded-full ${styles.badge}`}>
                                                        {item.expiryInfo.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExpiryCalendarScreen;
