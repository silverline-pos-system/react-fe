import React, { useState, useEffect } from 'react';
import useEscapeClose from '@/hooks/useEscapeClose';
import { RotateCcw, X, Search, Clock, CornerUpLeft, Loader2, User, ShoppingCart, Receipt, AlertCircle } from 'lucide-react';
import { posService } from '@/features/pos/services/posService';

export default function ListModal({ type, onClose, onSelect, branchId }) {
    useEscapeClose(onClose);
    const [searchTerm, setSearchTerm] = useState("");
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const resultsRef = React.useRef(null);

    const isRecall = type === 'RECALL';
    const title = isRecall ? 'Recall Held Bill' : 'Return Sale';
    const Icon = isRecall ? RotateCcw : CornerUpLeft;

    useEffect(() => {
        fetchBills();
    }, [type, branchId]);

    const fetchBills = async () => {
        setLoading(true);
        setError(null);
        try {
            let res;
            if (isRecall) {
                res = await posService.getHeldBills(branchId);
            } else {
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);

                res = await posService.getSales({
                    branchId: branchId,
                    status: 'COMPLETED',
                    limit: 100,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                });
            }

            const rawData = res.data?.data || res.data || [];

            const mappedData = (Array.isArray(rawData) ? rawData : []).map(item => ({
                id: item.saleId || item.id,
                invoiceNo: item.invoiceNo || item.invoice_no || item.id || `INV-${item.saleId}`,
                saleDate: item.saleDate || item.sale_date || item.createdAt || new Date(),
                customerName: (item.customer && item.customer.name) ? item.customer.name : (item.customerName || 'Walk-in Customer'),
                customerId: item.customerId || item.customer_id,
                itemCount: (typeof item.items === 'number') ? item.items : (item.itemCount || (item.items ? item.items.length : 0)),
                grossTotal: parseFloat(item.grossTotal || item.gross_total || 0),
                discountAmount: parseFloat(item.discountAmount || item.discount_amount || 0),
                taxAmount: parseFloat(item.taxAmount || item.tax_amount || 0),
                netTotal: parseFloat(item.netTotal || item.net_total || 0),
                status: item.status || 'COMPLETED',
                cashierName: (item.cashier && item.cashier.name) ? item.cashier.name : (item.cashierName || ''),
                items: item.items || [],
                payments: item.payments || []
            }));

            setData(mappedData);
        } catch (err) {
            console.error("Failed to fetch bills:", err);
            setError(err.response?.data?.message || "Failed to load bills");
        } finally {
            setLoading(false);
        }
    };

    const filteredData = data.filter(item =>
        item.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        setSelectedIndex(-1);
    }, [searchTerm, data]);

    const handleKeyDown = (e) => {
        if (filteredData.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < filteredData.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < filteredData.length) {
                onSelect(filteredData[selectedIndex]);
            }
        }
    };

    useEffect(() => {
        if (selectedIndex >= 0 && resultsRef.current) {
            const list = resultsRef.current;
            const element = list.children[selectedIndex];
            if (element) {
                element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [selectedIndex]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleString('en-LK', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const styles = {
            'HELD': 'bg-amber-100 text-amber-700 border-amber-200',
            'COMPLETED': 'bg-green-100 text-green-700 border-green-200',
            'VOIDED': 'bg-red-100 text-red-700 border-red-200',
            'RETURNED': 'bg-purple-100 text-purple-700 border-purple-200'
        };
        return styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px]">
            <div className="bg-white w-[680px] h-[560px] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className={`px-4 py-3 flex justify-between items-center shrink-0 ${isRecall ? 'bg-amber-600' : 'bg-rose-600'}`}>
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <Icon className="w-5 h-5" /> {title}
                    </h3>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            autoFocus
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="Search by Invoice No or Customer Name..."
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scroll">
                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">Loading {isRecall ? 'held bills' : 'sales'}...</p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center p-4">
                                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
                                <p className="text-red-600 font-medium mb-2">{error}</p>
                                <button
                                    onClick={fetchBills}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !error && filteredData.length === 0 && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center p-8">
                                <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">
                                    {searchTerm ? 'No matching records found' : `No ${isRecall ? 'held bills' : 'completed sales'} available`}
                                </p>
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="mt-2 text-sm text-blue-600 hover:underline"
                                    >
                                        Clear search
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Results List */}
                    {!loading && !error && filteredData.length > 0 && (
                        <div className="divide-y divide-slate-100" ref={resultsRef}>
                            {filteredData.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={`flex justify-between items-center p-4 cursor-pointer transition-colors group ${index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-slate-50'
                                        }`}
                                    onClick={() => onSelect(item)}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="bg-slate-100 rounded px-2 py-0.5 font-mono flex items-center gap-0.5">
                                                {(() => {
                                                    const parts = item.invoiceNo.split('-');
                                                    if (parts.length >= 3) {
                                                        return (
                                                            <>
                                                                <span className="text-xs text-blue-600 font-bold">{parts[0]}</span>
                                                                <span className="text-slate-400">-</span>
                                                                <span className="text-xs text-cyan-600 font-bold">{parts[1]}</span>
                                                                <span className="text-slate-400">-</span>
                                                                <span className="text-base text-slate-800 font-black">{parts[2]}</span>
                                                            </>
                                                        );
                                                    }
                                                    return <span className="text-sm font-bold text-slate-800">{item.invoiceNo}</span>;
                                                })()}
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${getStatusBadge(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(item.saleDate)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {item.customerName}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <ShoppingCart className="w-3 h-3" />
                                                {item.itemCount} items
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right ml-4">
                                        <div className="font-mono font-bold text-slate-900 text-lg">
                                            LKR {item.netTotal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                        </div>
                                        <button className={`mt-1 text-[10px] px-3 py-1.5 rounded font-bold uppercase tracking-wide transition-colors ${isRecall
                                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200'
                                            : 'bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200'
                                            }`}>
                                            {isRecall ? 'Recall' : 'Return'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 text-xs text-slate-500 flex justify-between items-center shrink-0">
                    <span>
                        Showing {filteredData.length} of {data.length} {isRecall ? 'held bills' : 'sales'}
                    </span>
                    <button
                        onClick={fetchBills}
                        disabled={loading}
                        className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                        <RotateCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>
        </div>
    );
}
