import React, { useState, useEffect, useRef } from 'react';
import useEscapeClose from '@/hooks/useEscapeClose';
import { X, Wrench, Smartphone, Search, CheckCircle2, Phone, User, CreditCard, ChevronRight, Activity, ShoppingCart, Eye, ArrowLeft, Clock, DollarSign, Package } from 'lucide-react';
import { servicesService } from '@/features/manager/services/servicesService';
import { printMobileRepairReceipt } from '@/features/pos/utils/receiptPrinter';

const STATUS_COLORS = {
    RECEIVED: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
    DIAGNOSED: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
    IN_PROGRESS: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    WAITING_APPROVAL: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
    READY_FOR_PAYMENT: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    PAID: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
    DELIVERED: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
    CANCELLED: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-500' },
};

function StatusBadge({ status }) {
    const colors = STATUS_COLORS[status] || STATUS_COLORS.RECEIVED;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
            {(status || '').replace(/_/g, ' ')}
        </span>
    );
}

export default function MobileRepairModal({ onClose, branchId, onNotify, onAddToCart, enablePrintReceipt = false, branchInfo = null, cashierName = '' }) {
    useEscapeClose(onClose);
    const deviceBrandRef = useRef(null);
    const deviceModelRef = useRef(null);
    const imeiRef = useRef(null);
    const problemRef = useRef(null);
    const customerNameRef = useRef(null);
    const contactRef = useRef(null);
    const advanceRef = useRef(null);
    const paymentMethodRef = useRef(null);
    const [activeTab, setActiveTab] = useState('LOG');
    const [formData, setFormData] = useState({
        customerName: '',
        contactNo: '',
        deviceBrand: '',
        deviceModel: '',
        imeiNo: '',
        problemDescription: '',
        advancePayment: '',
        paymentMethod: 'CASH'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedRepair, setSelectedRepair] = useState(null);
    const [_payingId, _setPayingId] = useState(null);
    const searchInputRef = useRef(null);

    useEffect(() => {
        if (activeTab === 'FIND' && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [activeTab]);

    const formatRepairNo = (repair) => {
        const rawNo = String(repair?.repairNo || '').trim();
        if (rawNo && /[A-Za-z]+[-_/]\d/.test(rawNo)) return rawNo;

        const id = String(repair?.repairId || rawNo || '').replace(/\D/g, '').padStart(6, '0');
        const d = new Date(repair?.createdAt || repair?.updatedAt || Date.now());
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `MR-${y}${m}${day}-${id}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let userId = null;
            try {
                const userObj = JSON.parse(localStorage.getItem('user'));
                userId = userObj?.id || userObj?.userId;
            } catch {
                userId = null;
            }

            const res = await servicesService.logRepairJob({
                ...formData,
                branchId: branchId || 1,
                createdBy: userId
            });

            const createdRepair = res.data?.data || res.data || {};
            const displayRepairNo = formatRepairNo(createdRepair);

            if (enablePrintReceipt) {
                try {
                    await printMobileRepairReceipt({
                        repair: {
                            ...createdRepair,
                            customerName: createdRepair.customerName || formData.customerName,
                            customerPhone: createdRepair.customerPhone || formData.contactNo,
                            contactNo: createdRepair.contactNo || formData.contactNo,
                            deviceBrand: createdRepair.deviceBrand || formData.deviceBrand,
                            deviceModel: createdRepair.deviceModel || formData.deviceModel,
                            imeiNo: createdRepair.imeiNo || formData.imeiNo,
                            problemDescription: createdRepair.problemDescription || formData.problemDescription,
                            advancePayment: createdRepair.advancePayment ?? formData.advancePayment,
                            paymentMethod: createdRepair.paymentMethod || formData.paymentMethod,
                            repairNo: displayRepairNo,
                        },
                        branchInfo,
                        cashierName,
                    });
                } catch (printError) {
                    console.error('Failed to print mobile repair receipt:', printError);
                }
            }

            onNotify('success', 'Repair Logged', `Repair ${displayRepairNo} logged for ${formData.customerName}. Sent to Technician.`);
            onClose();
        } catch (error) {
            console.error('Failed to log repair job:', error);
            onNotify('error', 'Request Failed', error.response?.data?.message || 'Failed to submit the repair request.');
            setIsSubmitting(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        setSelectedRepair(null);
        try {
            const res = await servicesService.searchRepairs(searchQuery.trim());
            const data = res.data || [];
            data.sort((a, b) => {
                if (a.status === 'READY_FOR_PAYMENT' && b.status !== 'READY_FOR_PAYMENT') return -1;
                if (b.status === 'READY_FOR_PAYMENT' && a.status !== 'READY_FOR_PAYMENT') return 1;
                return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
            });
            setSearchResults(data);
        } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleAddRepairToCart = async (repair) => {
        if (!onAddToCart) {
            onNotify('error', 'Cart Unavailable', 'Cannot add repair charges to cart from this context.');
            return;
        }

        const balanceDue = parseFloat(repair.balanceDue) || parseFloat(repair.finalCost) || 0;
        if (balanceDue <= 0) {
            onNotify('info', 'No Balance', 'This repair has no outstanding balance.');
            return;
        }

        const repairCartItem = {
            productId: `REPAIR-${repair.repairId}`,
            id: `REPAIR-${repair.repairId}`,
            name: `Repair ${formatRepairNo(repair)} | ${repair.deviceBrand} ${repair.deviceModel} | ${repair.customerName || 'Walk-in'} | ${repair.customerPhone || '-'}`,
            price: balanceDue,
            sellingPrice: balanceDue,
            qty: 1,
            discount: 0,
            taxRate: 0,
            isService: true,
            repairData: {
                repairId: repair.repairId,
                repairNo: formatRepairNo(repair),
                customerName: repair.customerName,
                customerPhone: repair.customerPhone,
                deviceBrand: repair.deviceBrand,
                deviceModel: repair.deviceModel,
                finalCost: repair.finalCost,
                balanceDue: balanceDue
            }
        };

        onAddToCart(repairCartItem);
        onNotify('success', 'Added to Cart', `Repair charge of LKR ${balanceDue.toLocaleString()} for ${repair.deviceBrand} ${repair.deviceModel} added to cart.`);
        onClose();
    };

    const formatDate = (d) => {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const focusNextFieldOnEnter = (e, nextRef, allowShiftEnter = false) => {
        if (e.key !== 'Enter') return;
        if (!allowShiftEnter && e.shiftKey) return;
        e.preventDefault();
        nextRef?.current?.focus();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]" style={{ animation: 'modalSlideIn 0.3s ease-out' }}>

                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2.5 rounded-xl">
                            <Wrench className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-wide">Mobile Repair Center</h2>
                            <p className="text-emerald-100 text-xs mt-0.5">Log new repairs or find existing repair jobs</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-emerald-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-slate-100 px-4 pt-3 shrink-0">
                    <button
                        onClick={() => setActiveTab('LOG')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-bold transition-all ${activeTab === 'LOG'
                            ? 'bg-white text-emerald-700 shadow-sm border border-slate-200 border-b-white -mb-px z-10'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <Wrench size={16} />
                        Log New Repair
                    </button>
                    <button
                        onClick={() => setActiveTab('FIND')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-bold transition-all ${activeTab === 'FIND'
                            ? 'bg-white text-emerald-700 shadow-sm border border-slate-200 border-b-white -mb-px z-10'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <Search size={16} />
                        Find Repair Job
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col border-t border-slate-200">

                    {/* === LOG TAB === */}
                    {activeTab === 'LOG' && (
                        <>
                            <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
                                <form id="repairForm" onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 flex items-center gap-2">
                                            <Smartphone size={14} className="text-emerald-600" />
                                            Device Details
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Device Brand <span className="text-red-500">*</span></label>
                                                <input
                                                    ref={deviceBrandRef}
                                                    required
                                                    type="text"
                                                    placeholder="e.g. Samsung, Apple"
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                                    value={formData.deviceBrand}
                                                    onChange={(e) => setFormData({ ...formData, deviceBrand: e.target.value })}
                                                    onKeyDown={(e) => focusNextFieldOnEnter(e, deviceModelRef)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Model Number</label>
                                                <input
                                                    ref={deviceModelRef}
                                                    type="text"
                                                    placeholder="e.g. S22 Ultra"
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                                    value={formData.deviceModel}
                                                    onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
                                                    onKeyDown={(e) => focusNextFieldOnEnter(e, imeiRef)}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">IMEI / Serial Number</label>
                                                <div className="relative">
                                                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                    <input
                                                        ref={imeiRef}
                                                        type="text"
                                                        placeholder="Enter 15 digit IMEI"
                                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono tracking-wider transition-all"
                                                        value={formData.imeiNo}
                                                        onChange={(e) => setFormData({ ...formData, imeiNo: e.target.value })}
                                                        onKeyDown={(e) => focusNextFieldOnEnter(e, problemRef)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Problem Description <span className="text-red-500">*</span></label>
                                                <textarea
                                                    ref={problemRef}
                                                    required
                                                    rows="3"
                                                    placeholder="Describe the issue reported by customer..."
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                                    value={formData.problemDescription}
                                                    onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            customerNameRef.current?.focus();
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 flex items-center gap-2 mt-2">
                                            <User size={14} className="text-emerald-600" />
                                            Customer Info
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Name <span className="text-red-500">*</span></label>
                                                <input
                                                    ref={customerNameRef}
                                                    required
                                                    type="text"
                                                    placeholder="Customer Name"
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                                    value={formData.customerName}
                                                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                                    onKeyDown={(e) => focusNextFieldOnEnter(e, contactRef)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Contact Phone <span className="text-red-500">*</span></label>
                                                <input
                                                    ref={contactRef}
                                                    required
                                                    type="tel"
                                                    placeholder="07X XXX XXXX"
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                                    value={formData.contactNo}
                                                    onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                                                    onKeyDown={(e) => focusNextFieldOnEnter(e, advanceRef)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Advance Payment (LKR)</label>
                                                <input
                                                    ref={advanceRef}
                                                    type="number"
                                                    min="0"
                                                    placeholder="e.g. 5000"
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                                    value={formData.advancePayment}
                                                    onChange={(e) => setFormData({ ...formData, advancePayment: e.target.value })}
                                                    onKeyDown={(e) => focusNextFieldOnEnter(e, paymentMethodRef)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Payment Method</label>
                                                <select
                                                    ref={paymentMethodRef}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                                    value={formData.paymentMethod}
                                                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            document.getElementById('repairForm')?.requestSubmit();
                                                        }
                                                    }}
                                                >
                                                    <option value="CASH">Cash</option>
                                                    <option value="CARD">Card</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-2.5 text-slate-600 font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    form="repairForm"
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 group text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Log Repair Ticket
                                            <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}

                    {/* === FIND TAB === */}
                    {activeTab === 'FIND' && !selectedRepair && (
                        <>
                            <div className="p-4 bg-white border-b border-slate-200 shrink-0">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            placeholder="Search by phone number, device model, brand, or repair no..."
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSearch}
                                        disabled={searching || !searchQuery.trim()}
                                        className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {searching ? <Activity size={16} className="animate-spin" /> : <Search size={16} />}
                                        Search
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
                                {searching ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                        <Activity className="w-8 h-8 animate-spin mb-3" />
                                        <p className="font-medium">Searching repair jobs...</p>
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                        <Search className="w-12 h-12 text-slate-200 mb-4" />
                                        <h3 className="text-lg font-bold text-slate-500 mb-1">
                                            {searchQuery ? 'No repair jobs found' : 'Search for repair jobs'}
                                        </h3>
                                        <p className="text-sm text-slate-400">
                                            {searchQuery ? 'Try a different phone number, device model, or repair number.' : 'Enter a phone number, device model, brand or repair number to search.'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                                            {searchResults.length} repair job{searchResults.length !== 1 ? 's' : ''} found
                                        </div>
                                        {searchResults.map((repair) => {
                                            const balanceDue = parseFloat(repair.balanceDue) || 0;
                                            const isPayable = repair.status === 'READY_FOR_PAYMENT';
                                            const isCompleted = repair.status === 'PAID' || repair.status === 'DELIVERED';
                                            const isInProgress = ['RECEIVED', 'DIAGNOSED', 'IN_PROGRESS', 'WAITING_APPROVAL'].includes(repair.status);

                                            return (
                                                <div
                                                    key={repair.repairId}
                                                    className={`bg-white rounded-xl border transition-all hover:shadow-md ${isPayable
                                                        ? 'border-emerald-200 shadow-sm shadow-emerald-50'
                                                        : isCompleted
                                                            ? 'border-green-200 bg-green-50/30'
                                                            : 'border-slate-200'
                                                        }`}
                                                >
                                                    {isCompleted && (
                                                        <div className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white flex items-center gap-2 rounded-t-xl">
                                                            <CheckCircle2 size={16} />
                                                            <span className="text-xs font-bold uppercase tracking-wider">✅ Completed — Device Delivered to Customer</span>
                                                        </div>
                                                    )}

                                                    <div className="p-4">
                                                        <div className="flex items-start justify-between gap-3 mb-3">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-xs font-bold text-emerald-600 font-mono">{formatRepairNo(repair)}</span>
                                                                    <StatusBadge status={repair.status} />
                                                                </div>
                                                                <h4 className={`font-bold text-base ${isCompleted ? 'text-slate-500' : 'text-slate-800'}`}>
                                                                    {repair.deviceBrand} {repair.deviceModel}
                                                                </h4>
                                                            </div>
                                                            {repair.finalCost > 0 && (
                                                                <div className="text-right shrink-0">
                                                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Final Cost</div>
                                                                    <div className={`text-lg font-black ${isCompleted ? 'text-green-600' : 'text-slate-800'}`}>
                                                                        LKR {parseFloat(repair.finalCost).toLocaleString()}
                                                                    </div>
                                                                    {balanceDue > 0 && !isCompleted && (
                                                                        <div className="text-xs font-bold text-red-500">
                                                                            Balance: LKR {balanceDue.toLocaleString()}
                                                                        </div>
                                                                    )}
                                                                    {isCompleted && (
                                                                        <div className="text-xs font-bold text-green-600 flex items-center gap-1 justify-end">
                                                                            <CheckCircle2 size={12} /> Fully Paid
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
                                                            <span className="flex items-center gap-1">
                                                                <User size={12} /> {repair.customerName || 'Unknown'}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Phone size={12} /> {repair.customerPhone || 'N/A'}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock size={12} /> {formatDate(repair.createdAt)}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => setSelectedRepair(repair)}
                                                                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                                                            >
                                                                <Eye size={13} /> View Details
                                                            </button>

                                                            {isPayable && onAddToCart && (
                                                                <button
                                                                    onClick={() => handleAddRepairToCart(repair)}
                                                                    className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                                                                >
                                                                    <ShoppingCart size={13} /> Add to Cart
                                                                </button>
                                                            )}

                                                            {isInProgress && (
                                                                <span className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg flex items-center gap-1.5">
                                                                    <Activity size={13} /> Still being processed by technician
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* === DETAIL VIEW === */}
                    {activeTab === 'FIND' && selectedRepair && (
                        <>
                            <div className="p-4 bg-white border-b border-slate-200 shrink-0 flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedRepair(null)}
                                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-800">Repair Details</h3>
                                    <p className="text-xs text-slate-500 font-mono">{formatRepairNo(selectedRepair)}</p>
                                </div>
                                <StatusBadge status={selectedRepair.status} />
                            </div>

                            <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
                                <div className="max-w-lg mx-auto space-y-6">
                                    {/* Device Info Card */}
                                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Smartphone size={14} /> Device Information
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Brand</span>
                                                <p className="font-bold text-slate-800">{selectedRepair.deviceBrand}</p>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Model</span>
                                                <p className="font-bold text-slate-800">{selectedRepair.deviceModel || '-'}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">IMEI</span>
                                                <p className="font-mono text-slate-700">{selectedRepair.imeiNo || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Info Card */}
                                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <User size={14} /> Customer Information
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Name</span>
                                                <p className="font-bold text-slate-800">{selectedRepair.customerName}</p>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Phone</span>
                                                <p className="font-bold text-slate-800">{selectedRepair.customerPhone}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Job Details */}
                                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Package size={14} /> Job Details
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Problem Description</span>
                                                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg mt-1">{selectedRepair.problemDescription}</p>
                                            </div>
                                            {selectedRepair.diagnosisNotes && (
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Diagnosis Notes</span>
                                                    <p className="text-sm text-slate-700 bg-blue-50 p-3 rounded-lg mt-1">{selectedRepair.diagnosisNotes}</p>
                                                </div>
                                            )}
                                            {selectedRepair.costNote && (
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Parts & Cost Note</span>
                                                    <p className="text-sm text-slate-700 bg-purple-50 p-3 rounded-lg mt-1">{selectedRepair.costNote}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Payment Summary */}
                                    <div className="bg-white rounded-xl border border-emerald-200 p-5 shadow-sm">
                                        <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <DollarSign size={14} /> Payment Summary
                                        </h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Estimated Cost</span>
                                                <span className="font-semibold text-slate-700">
                                                    {selectedRepair.estimatedCost > 0 ? `LKR ${parseFloat(selectedRepair.estimatedCost).toLocaleString()}` : '-'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Final Cost (Manager Approved)</span>
                                                <span className="font-bold text-slate-800">
                                                    {selectedRepair.finalCost > 0 ? `LKR ${parseFloat(selectedRepair.finalCost).toLocaleString()}` : '-'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Already Paid</span>
                                                <span className="font-semibold text-green-600">
                                                    LKR {(parseFloat(selectedRepair.totalPaid) || 0).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="border-t border-emerald-100 pt-2 mt-2 flex justify-between">
                                                <span className="font-bold text-slate-800">Balance Due</span>
                                                <span className={`text-xl font-black ${(parseFloat(selectedRepair.balanceDue) || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    LKR {(parseFloat(selectedRepair.balanceDue) || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {selectedRepair.status === 'READY_FOR_PAYMENT' && (parseFloat(selectedRepair.balanceDue) || 0) > 0 && (
                                        <div className="flex gap-3">
                                            {onAddToCart && (
                                                <button
                                                    onClick={() => handleAddRepairToCart(selectedRepair)}
                                                    className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <ShoppingCart size={18} /> Add to Cart — LKR {(parseFloat(selectedRepair.balanceDue) || 0).toLocaleString()}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes modalSlideIn {
                    0% { transform: translateY(20px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
