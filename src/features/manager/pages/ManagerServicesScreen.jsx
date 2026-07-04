import React, { useState, useEffect } from 'react';
import {
    Wrench,
    Tv,
    CheckCircle,
    Clock,
    Search,
    Filter,
    Activity,
    DollarSign,
    X,
    Eye,
    ArrowLeft,
    Phone,
    User,
    Smartphone,
    Package,
    Calendar,
    RefreshCw,
    ChevronDown,
    Plus,
    Trash2
} from 'lucide-react';

import { servicesService } from '../services/servicesService';
import MobileRepairModal from '@/features/pos/modals/MobileRepairModal';
import DtvRequestModal from '@/features/pos/modals/DtvRequestModal';
import useEscapeClose from '@/hooks/useEscapeClose';

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

export default function ManagerServicesScreen() {
    const [activeTab, setActiveTab] = useState('phoneRepairs');
    const [loading, setLoading] = useState(false);

    const [phoneRepairs, setPhoneRepairs] = useState([]);
    const [dtvServices, setDtvServices] = useState([]);

    // Search & Filter & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('ALL'); // ALL, TODAY, WEEK, MONTH
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Modal State
    const [finalizeModal, setFinalizeModal] = useState({
        isOpen: false,
        repair: null,
        finalCost: ''
    });

    // Detail View
    const [selectedRepair, setSelectedRepair] = useState(null);

    useEscapeClose(() => setSelectedRepair(null), !!selectedRepair);
    useEscapeClose(() => setFinalizeModal({ isOpen: false, repair: null, finalCost: '' }), finalizeModal.isOpen);

    // New Service Modal state
    const [showNewRepairModal, setShowNewRepairModal] = useState(false);
    const [showNewDtvModal, setShowNewDtvModal] = useState(false);
    const [notification, setNotification] = useState(null);

    const getBranchId = () => {
        try {
            const u = JSON.parse(localStorage.getItem('user'));
            return u?.branchId || 1;
        } catch { return 1; }
    };

    const handleNotify = (type, title, message) => {
        setNotification({ type, title, message });
        setTimeout(() => setNotification(null), 4000);
    };

    // Auto-refresh timer
    const [lastRefresh, setLastRefresh] = useState(new Date());

    // Users for technician mapping
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            fetchData(true);
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, dateFilter, activeTab]);

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const { getStaffSummary } = await import('../services/managerService');
            const [repairsRes, dtvRes, staffRes] = await Promise.all([
                servicesService.getRepairs(),
                servicesService.getDtvServices(),
                getStaffSummary().catch(() => [])
            ]);
            const repairs = repairsRes.data || [];
            const dtvs = dtvRes.data || [];
            const fetchedUsers = Array.isArray(staffRes) ? staffRes : (staffRes?.data || []);

            repairs.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
            dtvs.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

            setPhoneRepairs(repairs);
            setDtvServices(dtvs);
            setUsers(fetchedUsers);
            setLastRefresh(new Date());
        } catch (error) {
            console.error("Failed to fetch services", error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const getTechnicianName = (technicianId) => {
        if (!technicianId) return 'Unassigned';
        const user = users.find(u => u.id === technicianId || u.userId === technicianId);
        return user ? (user.name || user.username || `Tech #${technicianId}`) : `Tech #${technicianId}`;
    };

    const handleCancelService = async (service, type) => {
        if (!window.confirm(`Are you sure you want to cancel this ${type === 'DTV' ? 'DTV Service' : 'Repair Job'}? This will remove it from technician assignment.`)) {
            return;
        }

        try {
            setLoading(true);
            const userStr = localStorage.getItem('user');
            const userObj = userStr ? JSON.parse(userStr) : {};
            const currentTechId = service.technicianId || null;

            if (type === 'DTV') {
                await servicesService.updateDtvServiceStatus(
                    service.serviceId, 
                    'CANCELLED', 
                    currentTechId
                );
            } else {
                await servicesService.updateRepairStatus(
                    service.repairId, 
                    'CANCELLED', 
                    currentTechId, 
                    `Cancelled by Manager${userObj.name ? ` (${userObj.name})` : ''}`
                );
            }
            
            handleNotify('success', 'Service Cancelled', `${type} service has been marked as cancelled.`);
            fetchData(true);
        } catch (error) {
            console.error("Cancellation Error:", error);
            const msg = error.response?.data?.message || error.message || 'Could not cancel the service.';
            handleNotify('error', 'Cancellation Failed', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleFinalizeSubmit = async (e) => {
        e.preventDefault();
        try {
            const userStr = localStorage.getItem('user');
            const userObj = userStr ? JSON.parse(userStr) : {};
            const managerId = userObj.id || userObj.userId || 1;

            if (!finalizeModal.finalCost || isNaN(finalizeModal.finalCost)) return;

            await servicesService.finalizeRepairCost(
                finalizeModal.repair.repairId,
                finalizeModal.finalCost,
                managerId
            );

            setFinalizeModal({ isOpen: false, repair: null, finalCost: '' });
            fetchData();
        } catch (error) {
            console.error("Finalize error", error);
            alert("Failed to finalize cost");
        }
    };

    const isToday = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        const today = new Date();
        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
    };

    const isThisWeek = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        return diff <= 7 * 24 * 60 * 60 * 1000;
    };

    const isThisMonth = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };

    const formatDate = (d) => {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatRepairNo = (repair) => {
        if (repair?.repairNo && String(repair.repairNo).trim()) return repair.repairNo;
        const id = String(repair?.repairId || '').padStart(6, '0');
        const d = new Date(repair?.createdAt || repair?.updatedAt || Date.now());
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        return `REP-${y}${m}-${id}`;
    };

    const pendingApproval = phoneRepairs.filter(r => r.status === 'WAITING_APPROVAL').length;
    const activeRepairs = phoneRepairs.filter(r => ['RECEIVED', 'DIAGNOSED', 'IN_PROGRESS'].includes(r.status)).length;
    const readyForPayment = phoneRepairs.filter(r => r.status === 'READY_FOR_PAYMENT').length;

    const completedRepairsToday = phoneRepairs.filter(r => ['PAID', 'DELIVERED'].includes(r.status) && isToday(r.updatedAt || r.createdAt)).length;
    const completedDtvTodayAmt = dtvServices.filter(j => j.serviceStatus === 'COMPLETED' && isToday(j.updatedAt || j.createdAt)).length;
    const completedToday = completedRepairsToday + completedDtvTodayAmt;

    const todaysPhoneRevenue = phoneRepairs
        .filter(r => ['PAID', 'DELIVERED'].includes(r.status) && isToday(r.updatedAt || r.createdAt))
        .reduce((sum, r) => sum + (parseFloat(r.finalCost) || 0), 0);
    const todaysDtvRevenue = dtvServices
        .filter(j => j.serviceStatus === 'COMPLETED' && isToday(j.updatedAt || j.createdAt))
        .reduce((sum, job) => sum + (parseFloat(job.serviceCharge) || parseFloat(job.balanceCollected) || 0), 0);
    const totalTodayRevenue = todaysPhoneRevenue + todaysDtvRevenue;

    const filteredRepairs = phoneRepairs.filter(repair => {
        if (statusFilter !== 'ALL' && repair.status !== statusFilter) return false;
        const dateRef = repair.updatedAt || repair.createdAt;
        if (dateFilter === 'TODAY' && !isToday(dateRef)) return false;
        if (dateFilter === 'WEEK' && !isThisWeek(dateRef)) return false;
        if (dateFilter === 'MONTH' && !isThisMonth(dateRef)) return false;
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            const techName = getTechnicianName(repair.technicianId).toLowerCase();
            if (!(repair.repairNo || '').toLowerCase().includes(q) &&
                !(`${repair.deviceBrand} ${repair.deviceModel}`).toLowerCase().includes(q) &&
                !(repair.status || '').toLowerCase().includes(q) &&
                !(repair.problemDescription || '').toLowerCase().includes(q) &&
                !techName.includes(q) &&
                !String(repair.customerId || '').includes(q)) return false;
        }
        return true;
    });

    const filteredDtvServices = dtvServices.filter(service => {
        if (statusFilter !== 'ALL' && service.serviceStatus !== statusFilter) return false;
        const dateRef = service.updatedAt || service.createdAt;
        if (dateFilter === 'TODAY' && !isToday(dateRef)) return false;
        if (dateFilter === 'WEEK' && !isThisWeek(dateRef)) return false;
        if (dateFilter === 'MONTH' && !isThisMonth(dateRef)) return false;
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            const techName = getTechnicianName(service.technicianId).toLowerCase();
            if (!(`SRV-${service.serviceId}`).toLowerCase().includes(q) &&
                !(service.customerName || '').toLowerCase().includes(q) &&
                !(service.contactNo || '').includes(q) &&
                !(service.serviceType || '').toLowerCase().includes(q) &&
                !(service.address || '').toLowerCase().includes(q) &&
                !techName.includes(q) &&
                !(service.serviceStatus || '').toLowerCase().includes(q)) return false;
        }
        return true;
    });

    const indexOfLastRepair = currentPage * itemsPerPage;
    const indexOfFirstRepair = indexOfLastRepair - itemsPerPage;
    const currentRepairs = filteredRepairs.slice(indexOfFirstRepair, indexOfLastRepair);
    const totalRepairPages = Math.ceil(filteredRepairs.length / itemsPerPage);

    const indexOfLastDtv = currentPage * itemsPerPage;
    const indexOfFirstDtv = indexOfLastDtv - itemsPerPage;
    const currentDtvServices = filteredDtvServices.slice(indexOfFirstDtv, indexOfLastDtv);
    const totalDtvPages = Math.ceil(filteredDtvServices.length / itemsPerPage);

    const PaginationControls = ({ totalPages }) => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-white">
                <div className="text-sm text-slate-500 font-medium">
                    Showing Page <span className="font-bold text-slate-800">{currentPage}</span> of <span className="font-bold text-slate-800">{totalPages}</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    const renderPhoneRepairs = () => (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                        <tr>
                            <th className="p-4 font-semibold">Repair No</th>
                            <th className="p-4 font-semibold">Device</th>
                            <th className="p-4 font-semibold">Technician</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold">Estimated</th>
                            <th className="p-4 font-semibold">Final Cost</th>
                            <th className="p-4 font-semibold">Date</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentRepairs.map((repair) => (
                            <tr key={repair.repairId} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedRepair(repair)}>
                                <td className="p-4">
                                    <span className="font-mono text-xs font-bold text-emerald-600">{formatRepairNo(repair)}</span>
                                </td>
                                <td className="p-4">
                                    <div className="font-medium text-slate-800">{repair.deviceBrand} {repair.deviceModel}</div>
                                    <div className="text-xs text-slate-500 max-w-xs truncate">{repair.problemDescription}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                            {(getTechnicianName(repair.technicianId) || 'U')[0].toUpperCase()}
                                        </div>
                                        <span className="font-medium text-slate-700">{getTechnicianName(repair.technicianId)}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <StatusBadge status={repair.status} />
                                </td>
                                <td className="p-4 font-medium text-slate-600">
                                    {repair.estimatedCost > 0 ? `LKR ${parseFloat(repair.estimatedCost).toLocaleString()}` : '-'}
                                </td>
                                <td className="p-4">
                                    {repair.finalCost > 0 ? (
                                        <span className="font-bold text-slate-800">LKR {parseFloat(repair.finalCost).toLocaleString()}</span>
                                    ) : '-'}
                                </td>
                                <td className="p-4 text-xs text-slate-500">
                                    {formatDate(repair.updatedAt || repair.createdAt)}
                                </td>
                                <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-2">
                                        {(repair.status === 'WAITING_APPROVAL') ? (
                                            <button
                                                onClick={() => setFinalizeModal({ isOpen: true, repair: repair, finalCost: repair.estimatedCost || '' })}
                                                className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold rounded-lg hover:from-emerald-600 hover:to-teal-600 shadow-sm transition-all flex items-center gap-1.5"
                                            >
                                                <DollarSign size={13} /> Finalize Cost
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setSelectedRepair(repair)}
                                                className="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                                            >
                                                <Eye size={13} /> View
                                            </button>
                                        )}
                                        {!['CANCELLED', 'DELIVERED', 'PAID'].includes(repair.status) && (
                                            <button
                                                onClick={() => handleCancelService(repair, 'REPAIR')}
                                                title="Cancel Service"
                                                className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {currentRepairs.length === 0 && (
                            <tr>
                                <td colSpan="8" className="p-12 text-center">
                                    <Search className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-medium">No phone repairs match your filters.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <PaginationControls totalPages={totalRepairPages} />
        </div>
    );

    const renderDTVRepairs = () => (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                        <tr>
                            <th className="p-4 font-semibold">Service No</th>
                            <th className="p-4 font-semibold">Customer</th>
                            <th className="p-4 font-semibold">Type</th>
                            <th className="p-4 font-semibold">Address</th>
                            <th className="p-4 font-semibold">Technician</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold">Charge</th>
                            <th className="p-4 font-semibold">Tech Collected</th>
                            <th className="p-4 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentDtvServices.map((service) => (
                            <tr key={service.serviceId} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 font-mono text-xs font-bold text-blue-600">SRV-{service.serviceId}</td>
                                <td className="p-4">
                                    <span className="block font-bold text-slate-800">{service.customerName || 'Walk-in'}</span>
                                    <span className="block text-xs text-slate-500">{service.contactNo || 'N/A'}</span>
                                </td>
                                <td className="p-4 font-medium">{service.serviceType.replace(/_/g, ' ')}</td>
                                <td className="p-4 text-slate-500 truncate max-w-[150px]" title={service.address}>{service.address || 'N/A'}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                            {(getTechnicianName(service.technicianId) || 'U')[0].toUpperCase()}
                                        </div>
                                        <span className="font-medium text-slate-700">{getTechnicianName(service.technicianId)}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${service.serviceStatus === 'PENDING'
                                        ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                        : service.serviceStatus === 'ASSIGNED'
                                            ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                            : service.serviceStatus === 'IN_PROGRESS'
                                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                        }`}>
                                        {service.serviceStatus.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td className="p-4 font-medium text-slate-700">
                                    {service.serviceCharge > 0 ? `LKR ${service.serviceCharge.toLocaleString()}` : '-'}
                                </td>
                                <td className="p-4 font-bold text-emerald-600">
                                    {service.balanceCollected > 0 ? `LKR ${service.balanceCollected.toLocaleString()}` : '-'}
                                </td>
                                <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-2">
                                        {!['CANCELLED', 'DELIVERED', 'COMPLETED'].includes(service.serviceStatus) && (
                                            <button
                                                onClick={() => handleCancelService(service, 'DTV')}
                                                title="Cancel Service"
                                                className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {currentDtvServices.length === 0 && (
                            <tr>
                                <td colSpan="9" className="p-12 text-center">
                                    <Tv className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-medium">{searchTerm || statusFilter !== 'ALL' || dateFilter !== 'ALL' ? 'No DTV services match your filters.' : 'No DTV services found.'}</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <PaginationControls totalPages={totalDtvPages} />
        </div>
    );

    return (
        <div className="w-full max-w-none space-y-6">
            {notification && (
                <div className={`fixed top-6 right-6 z-[70] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-5 duration-300 ${notification.type === 'success' ? 'bg-emerald-600 text-white' : notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                    }`}>
                    <CheckCircle size={18} />
                    <div>
                        <div className="font-bold text-sm">{notification.title}</div>
                        <div className="text-xs opacity-90">{notification.message}</div>
                    </div>
                    <button onClick={() => setNotification(null)} className="ml-2 p-1 hover:bg-white/20 rounded-lg"><X size={14} /></button>
                </div>
            )}

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Service & Repair Hub</h1>
                    <p className="text-sm text-slate-500 mt-1">Real-time overview of all service jobs across the branch.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                        onClick={() => setShowNewDtvModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-600 shadow-sm transition-all text-sm"
                    >
                        <Plus size={16} /> New DTV Service
                    </button>
                    <div className="text-xs text-slate-400">
                        Last updated: {lastRefresh.toLocaleTimeString()}
                    </div>
                    <button
                        onClick={() => fetchData()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-bold border border-blue-100 rounded-xl hover:bg-blue-100 transition"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        <span className="text-sm font-medium">Refresh</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <Clock size={22} />
                        </div>
                        <h3 className="font-semibold text-slate-600 text-sm">Pending Approval</h3>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{pendingApproval}</p>
                    <p className="text-xs text-slate-400 mt-2">Awaiting cost finalization</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Wrench size={22} />
                        </div>
                        <h3 className="font-semibold text-slate-600 text-sm">Active Repairs</h3>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{activeRepairs}</p>
                    <p className="text-xs text-slate-400 mt-2">Being diagnosed or repaired</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <DollarSign size={22} />
                        </div>
                        <h3 className="font-semibold text-slate-600 text-sm">Ready to Pay</h3>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{readyForPayment}</p>
                    <p className="text-xs text-slate-400 mt-2">Waiting to be collected</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <CheckCircle size={22} />
                        </div>
                        <h3 className="font-semibold text-slate-600 text-sm">Completed Today</h3>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{completedToday}</p>
                    <p className="text-xs text-slate-400 mt-2">Services finished today</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-200 text-emerald-700 rounded-lg">
                            <DollarSign size={22} />
                        </div>
                        <h3 className="font-semibold text-emerald-800 text-sm">Today's Revenue</h3>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">Rs {totalTodayRevenue.toLocaleString()}</p>
                    <div className="mt-2 text-xs font-semibold text-emerald-600">
                        <span className="block">From all services finished today</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 border-b border-slate-200 mt-8">
                <div className="flex flex-wrap gap-6">
                    <button
                        onClick={() => setActiveTab('phoneRepairs')}
                        className={`pb-4 text-sm font-semibold relative ${activeTab === 'phoneRepairs' ? 'text-brand-primary' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Wrench size={18} />
                            Mobile Phone Repairs
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{phoneRepairs.length}</span>
                        </div>
                        {activeTab === 'phoneRepairs' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-t-full"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('dtv')}
                        className={`pb-4 text-sm font-semibold relative ${activeTab === 'dtv' ? 'text-brand-primary' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Tv size={18} />
                            DTV Services & Installs
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{dtvServices.length}</span>
                        </div>
                        {activeTab === 'dtv' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-t-full"></div>
                        )}
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pb-3 xl:ml-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input
                            type="text"
                            placeholder={activeTab === 'phoneRepairs' ? 'Search repairs...' : 'Search DTV services...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-primary w-full sm:w-52"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition ${showFilters ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                    >
                        <Filter size={15} />
                        Filter
                        <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="flex flex-wrap items-end gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 -mt-2" style={{ animation: 'filterSlideIn 0.2s ease-out' }}>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white font-medium"
                        >
                            <option value="ALL">All Statuses</option>
                            {activeTab === 'phoneRepairs' ? (
                                <>
                                    <option value="RECEIVED">Received</option>
                                    <option value="DIAGNOSED">Diagnosed</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="WAITING_APPROVAL">Waiting Approval</option>
                                    <option value="READY_FOR_PAYMENT">Ready for Payment</option>
                                    <option value="PAID">Paid</option>
                                    <option value="DELIVERED">Delivered</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </>
                            ) : (
                                <>
                                    <option value="PENDING">Pending</option>
                                    <option value="ASSIGNED">Assigned</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="COMPLETED">Completed</option>
                                </>
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Date Range</label>
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white font-medium"
                        >
                            <option value="ALL">All Time</option>
                            <option value="TODAY">Today</option>
                            <option value="WEEK">This Week</option>
                            <option value="MONTH">This Month</option>
                        </select>
                    </div>
                    {(statusFilter !== 'ALL' || dateFilter !== 'ALL' || searchTerm) && (
                        <button
                            onClick={() => { setStatusFilter('ALL'); setDateFilter('ALL'); setSearchTerm(''); }}
                            className="ml-auto text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                            <X size={14} /> Clear Filters
                        </button>
                    )}
                </div>
            )}

            <div>
                {activeTab === 'phoneRepairs' && renderPhoneRepairs()}
                {activeTab === 'dtv' && renderDTVRepairs()}
            </div>

            {selectedRepair && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setSelectedRepair(null)}>
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: 'modalSlideIn 0.3s ease-out' }}>
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Smartphone size={20} className="text-emerald-600" />
                                    Repair Details
                                </h2>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">{formatRepairNo(selectedRepair)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <StatusBadge status={selectedRepair.status} />
                                <button onClick={() => setSelectedRepair(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Device</span>
                                    <p className="font-bold text-slate-800 text-lg">{selectedRepair.deviceBrand} {selectedRepair.deviceModel}</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">IMEI</span>
                                    <p className="font-mono text-slate-700 font-semibold">{selectedRepair.imeiNo || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Problem Description</span>
                                <p className="text-sm text-slate-700 mt-1">{selectedRepair.problemDescription}</p>
                            </div>

                            {selectedRepair.diagnosisNotes && (
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                    <span className="text-[10px] font-bold text-blue-500 uppercase">Diagnosis Notes</span>
                                    <p className="text-sm text-slate-700 mt-1">{selectedRepair.diagnosisNotes}</p>
                                </div>
                            )}

                            {selectedRepair.costNote && (
                                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                    <span className="text-[10px] font-bold text-purple-500 uppercase">Parts & Cost Note</span>
                                    <p className="text-sm text-slate-700 mt-1">{selectedRepair.costNote}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Estimated</span>
                                    <span className="text-lg font-bold text-slate-700">
                                        {selectedRepair.estimatedCost > 0 ? `Rs ${parseFloat(selectedRepair.estimatedCost).toLocaleString()}` : '-'}
                                    </span>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 text-center">
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase block mb-1">Final Cost</span>
                                    <span className="text-lg font-bold text-emerald-700">
                                        {selectedRepair.finalCost > 0 ? `Rs ${parseFloat(selectedRepair.finalCost).toLocaleString()}` : '-'}
                                    </span>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Created</span>
                                    <span className="text-sm font-semibold text-slate-600">{formatDate(selectedRepair.createdAt)}</span>
                                </div>
                            </div>

                            {selectedRepair.status === 'WAITING_APPROVAL' && (
                                <div className="pt-2">
                                    <button
                                        onClick={() => { setSelectedRepair(null); setFinalizeModal({ isOpen: true, repair: selectedRepair, finalCost: selectedRepair.estimatedCost || '' }); }}
                                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        <DollarSign size={18} /> Finalize Cost
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Finalize Modal */}
            {finalizeModal.isOpen && finalizeModal.repair && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" style={{ animation: 'modalSlideIn 0.2s ease-out' }}>
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <DollarSign size={20} className="text-emerald-600" />
                                Finalize Repair Cost
                            </h2>
                            <p className="text-sm text-slate-500 mt-0.5">Repair Ticket: <span className="font-mono font-bold text-emerald-600">{formatRepairNo(finalizeModal.repair)}</span></p>
                            <p className="text-sm text-slate-600 mt-1 font-medium">{finalizeModal.repair.deviceBrand} {finalizeModal.repair.deviceModel}</p>
                        </div>
                        <form onSubmit={handleFinalizeSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Estimated Cost by Technician (LKR)</label>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium">
                                    {finalizeModal.repair.estimatedCost ? `Rs ${parseFloat(finalizeModal.repair.estimatedCost).toLocaleString()}` : 'Not provided'}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Problem / Technician Note</label>
                                <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 max-h-24 overflow-y-auto">
                                    {finalizeModal.repair.costNote || finalizeModal.repair.diagnosisNotes || finalizeModal.repair.problemDescription}
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Final Approved Cost (LKR)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-4 py-3 border-2 border-emerald-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xl font-bold transition-all"
                                    value={finalizeModal.finalCost}
                                    onChange={(e) => setFinalizeModal({ ...finalizeModal, finalCost: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setFinalizeModal({ isOpen: false, repair: null, finalCost: '' })}
                                    className="flex-1 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl font-bold text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={16} /> Approve Cost
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showNewRepairModal && (
                <MobileRepairModal
                    onClose={() => { setShowNewRepairModal(false); fetchData(); }}
                    branchId={getBranchId()}
                    onNotify={handleNotify}
                />
            )}

            {showNewDtvModal && (
                <DtvRequestModal
                    onClose={() => { setShowNewDtvModal(false); fetchData(); }}
                    branchId={getBranchId()}
                    onNotify={handleNotify}
                />
            )}

            <style>{`
                @keyframes modalSlideIn {
                    0% { transform: translateY(20px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                @keyframes filterSlideIn {
                    0% { transform: translateY(-10px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
