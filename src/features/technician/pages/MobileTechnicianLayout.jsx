import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { Wrench, CheckCircle, Activity, Play, TabletSmartphone, Cpu, User, AlertCircle, CheckCircle2, DollarSign, LogOut, ChevronRight, X, Phone, MapPin, Plus } from 'lucide-react';
import { servicesService } from '@/services/servicesService';
import { createApprovalRequest } from '@/services/managerService';
import MobileRepairModal from '@/features/pos/modals/MobileRepairModal';
import SecondaryRoleBanner from '@/components/common/SecondaryRoleBanner';
import useEscapeClose from '@/hooks/useEscapeClose';
import { useSystemName } from '@/context/SystemNameContext';
import ConfirmActionModal from '@/components/common/ConfirmActionModal';

function RepairDashboard() {
    const [user, setUser] = useState({});
    const [jobs, setJobs] = useState([]);
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('POOL'); // 'POOL' or 'MY_TASKS'
    const [updatingId, setUpdatingId] = useState(null);
    const [showFinalizeModal, setShowFinalizeModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [finalForm, setFinalForm] = useState({ managerId: '', estimatedCost: '', costNote: '' });
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // PO Request State
    const [showPOModal, setShowPOModal] = useState(false);
    const [poForm, setPoForm] = useState({ amount: '', notes: '' });
    const [poSubmitting, setPoSubmitting] = useState(false);

    // New Repair Modal State
    const [showNewRepairModal, setShowNewRepairModal] = useState(false);
    const [notification, setNotification] = useState(null);

    const handleNotify = (type, title, message) => {
        setNotification({ type, title, message });
        setTimeout(() => setNotification(null), 4000);
    };

    useEscapeClose(() => setShowDetailsModal(false), showDetailsModal);
    useEscapeClose(() => setShowFinalizeModal(false), showFinalizeModal);
    useEscapeClose(() => setShowPOModal(false), showPOModal);

    useEffect(() => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            setUser(storedUser || {});
        } catch (e) {
            console.error('No logged in user found', e);
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const userStr = localStorage.getItem('user');
            let isUserAdminOrManager = false;
            if (userStr) {
                const userObj = JSON.parse(userStr);
                const role = userObj.role || '';
                isUserAdminOrManager = ['ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(role);
            }

            const jobsPromise = servicesService.getRepairs();
            const managersPromise = isUserAdminOrManager 
                ? servicesService.getManagers().catch(() => ({ data: { data: [] } }))
                : Promise.resolve({ data: { data: [] } });

            const [jobsRes, managersRes] = await Promise.all([jobsPromise, managersPromise]);
            
            let allJobs = jobsRes.data?.data || jobsRes.data || [];
            allJobs.sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt).getTime();
                const dateB = new Date(b.updatedAt || b.createdAt).getTime();
                return dateB - dateA; // recent on top
            });
            setJobs(allJobs);
            setManagers(managersRes.data?.data || managersRes.data || []);
            setError('');
        } catch (err) {
            setError('Failed to load data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTakeJob = async (repairId) => {
        try {
            setUpdatingId(repairId);
            await servicesService.updateRepairStatus(repairId, 'DIAGNOSED', user.id || user.userId, 'Job picked up by technician');
            setActiveTab('MY_TASKS');
            fetchData();
        } catch (error) {
            alert('Failed to assign job. It might have been taken by someone else.');
            console.error(error);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleUpdateStatus = async (repairId, newStatus, notes = '') => {
        try {
            setUpdatingId(repairId);
            await servicesService.updateRepairStatus(repairId, newStatus, user.id || user.userId, notes);
            fetchData();
        } catch (error) {
            alert('Failed to update status.');
            console.error(error);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleReturnToPool = async (e, repairId) => {
        e.stopPropagation();
        if(!window.confirm("Return this job to the pool? It will be available for other technicians.")) return;
        try {
            setUpdatingId(repairId);
            await servicesService.updateRepairStatus(repairId, 'RECEIVED', user.id || user.userId, 'Returned to pool by technician');
            fetchData();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Failed to return job to pool.';
            alert(msg);
        } finally {
            setUpdatingId(null);
        }
    };

    const handlePORequest = async (e) => {
        e.preventDefault();
        const requestedAmount = Number.parseFloat(String(poForm.amount || '').trim());
        if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        setPoSubmitting(true);
        try {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const branchId = storedUser.branchId || localStorage.getItem('selectedBranchId') || null;
            const approvalReference = `TECH-PO-${Date.now()}`;
            const approvalPayload = {
                type: 'CASH_FLOW_PAID_OUT',
                category: 'CASH_FLOW_PAID_OUT',
                status: 'PENDING',
                reference: approvalReference,
                referenceNo: approvalReference,
                amount: requestedAmount,
                reason: `PO request for repair parts${poForm.notes ? ` | ${poForm.notes.trim()}` : ''}`,
                description: poForm.notes.trim(),
                notes: 'Technician PO request submitted from the mobile repair dashboard.',
                requestedBy: storedUser.fullName || storedUser.name || storedUser.username || 'Technician',
                email: storedUser.email || '',
                branchId: branchId ? Number(branchId) : null,
                takenByManager: false
            };

            await createApprovalRequest(approvalPayload);
            setShowPOModal(false);
            setPoForm({ amount: '', notes: '' });
            alert('PO request sent to the Manager for approval. The cashier can process it after approval.');
        } catch (error) {
            if (error.response?.status === 403) {
                alert('You do not have permission to submit PO requests. Please ask a Manager.');
            } else {
                console.error('Failed to create PO request:', error);
                const msg = error.response?.data?.message || 'Failed to send PO request.';
                alert(msg);
            }
        } finally {
            setPoSubmitting(false);
        }
    };

    const handleRequestFinalize = async (e) => {
        e.preventDefault();
        if (!finalForm.managerId || !finalForm.estimatedCost) {
            alert('Please select a manager and enter an estimated cost.');
            return;
        }

        try {
            setUpdatingId(selectedJob.repairId);
            await servicesService.requestFinalizeCost(selectedJob.repairId, finalForm.managerId, finalForm.estimatedCost, finalForm.costNote);
            setShowFinalizeModal(false);
            setFinalForm({ managerId: '', estimatedCost: '', costNote: '' });
            setSelectedJob(null);
            fetchData();
        } catch (error) {
            alert('Failed to send finalize request');
            console.error(error);
        } finally {
            setUpdatingId(null);
        }
    };

    const openFinalizeModal = (job) => {
        setSelectedJob(job);
        const defaultManager = managers.length === 1 ? managers[0].userId : (managers.length === 0 ? 1 : '');
        setFinalForm({ managerId: defaultManager, estimatedCost: job.estimatedCost || '', costNote: '' });
        setShowFinalizeModal(true);
    };

    const poolJobs = jobs.filter(j => j.status === 'RECEIVED' && !j.technicianId);
    const myJobs = jobs.filter(j =>
        j.technicianId === (user.id || user.userId) &&
        ['DIAGNOSED', 'IN_PROGRESS', 'WAITING_APPROVAL', 'READY_FOR_PAYMENT', 'PAID', 'DELIVERED'].includes(j.status)
    );
    const activeMyJobs = myJobs.filter(j => !['PAID', 'DELIVERED'].includes(j.status));
    const completedDeliveredJobs = myJobs.filter(j => ['PAID', 'DELIVERED'].includes(j.status));

    const formatRepairNo = (job) => {
        if (job?.repairNo && String(job.repairNo).trim()) return job.repairNo;
        const id = String(job?.repairId || '').padStart(6, '0');
        const d = new Date(job?.createdAt || job?.updatedAt || Date.now());
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        return `REP-${y}${m}-${id}`;
    };

    const getStatusBadgeColor = (status) => {
        const colors = {
            RECEIVED: 'bg-yellow-100 text-yellow-700',
            DIAGNOSED: 'bg-orange-100 text-orange-700',
            IN_PROGRESS: 'bg-blue-100 text-blue-700',
            WAITING_APPROVAL: 'bg-purple-100 text-purple-700',
            READY_FOR_PAYMENT: 'bg-emerald-100 text-emerald-700',
            PAID: 'bg-green-100 text-green-700',
            DELIVERED: 'bg-slate-100 text-slate-700'
        };
        return colors[status] || 'bg-slate-100 text-slate-700';
    };

    return (
        <div className="p-3 sm:p-4 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Mobile Repair Dashboard</h1>
                    <p className="text-slate-500">Pick up new logs, diagnose, and report costs.</p>
                </div>
                <div className="flex flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto mt-2 md:mt-0">
                    <button
                        onClick={() => setShowNewRepairModal(true)}
                        className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 font-bold tracking-wide transition-colors flex items-center gap-2 shadow-sm text-sm"
                    >
                        <Plus size={18} className="shrink-0" /> <span className="whitespace-nowrap">New Repair</span>
                    </button>
                      <button
                          onClick={() => setShowPOModal(true)}
                          className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 font-bold tracking-wide transition-colors flex items-center gap-2 text-sm"
                      >
                          <DollarSign size={18} className="shrink-0" /> <span className="whitespace-nowrap">PO Request</span>
                      </button>
                    <button
                        onClick={fetchData}
                        className="w-full sm:w-auto justify-center px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 font-bold tracking-wide transition-colors flex items-center gap-2 text-sm"
                    >
                        <Activity size={18} className="shrink-0" /> Refresh
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-200/50 p-1 rounded-lg sm:rounded-2xl w-full gap-1">
                <button
                    onClick={() => setActiveTab('POOL')}
                    className={`flex-1 py-2 sm:py-2.5 rounded-md sm:rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'POOL'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <TabletSmartphone size={18} />
                    Available Pool ({poolJobs.length})
                </button>
                <button
                    onClick={() => setActiveTab('MY_TASKS')}
                    className={`flex-1 py-2 sm:py-2.5 rounded-md sm:rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'MY_TASKS'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Wrench size={18} />
                    My Tasks ({activeMyJobs.length})
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl font-medium">{error}</div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Activity className="w-8 h-8 animate-spin mb-4" />
                    <p>Loading repair jobs...</p>
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'POOL' && (
                        poolJobs.length === 0 ? (
                            <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                                <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <h3 className="text-lg font-bold text-slate-600">You're all caught up!</h3>
                                <p className="text-slate-400">There are no pending requests in the pool right now.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                                {poolJobs.map(job => (
                                    <div key={job.repairId} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-emerald-100 hover:shadow-md transition-shadow flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="text-xs font-bold text-emerald-600">{formatRepairNo(job)}</div>
                                                <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeColor(job.status)}`}>
                                                    {job.status.replace(/_/g, ' ')}
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-slate-800 text-lg mb-1">{job.deviceBrand} {job.deviceModel}</h3>
                                            <div className="flex items-center gap-2 text-sm text-slate-600 font-mono mb-4 text-xs">
                                                <span>IMEI: {job.imeiNo || 'N/A'}</span>
                                            </div>
                                            <div className="mb-4">
                                                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Problem Description</div>
                                                <p className="text-sm text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg">{job.problemDescription}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleTakeJob(job.repairId)}
                                            disabled={updatingId === job.repairId}
                                            className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            {updatingId === job.repairId ? <Activity size={18} className="animate-spin" /> : <Play size={18} />}
                                            Take Job
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {activeTab === 'MY_TASKS' && (
                        (activeMyJobs.length === 0 && completedDeliveredJobs.length === 0) ? (
                            <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                                <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <h3 className="text-lg font-bold text-slate-600">No active tasks</h3>
                                <p className="text-slate-400">Pick up a job from the available pool to get started.</p>
                            </div>
                        ) : (
                            <>
                                {activeMyJobs.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                                        {activeMyJobs.map(job => (
                                            <div key={job.repairId} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 cursor-pointer hover:border-emerald-300 transition-colors" onClick={() => { setSelectedJob(job); setShowDetailsModal(true); }}>
                                                <div className="px-5 py-3 flex justify-between items-center bg-slate-50 border-b border-slate-100">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
                                                            <Cpu size={16} />
                                                        </div>
                                                        <span className="font-mono text-sm font-bold text-slate-700">{formatRepairNo(job)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {!['READY_FOR_PAYMENT', 'PAID', 'DELIVERED'].includes(job.status) && (
                                                            <button
                                                                onClick={(e) => handleReturnToPool(e, job.repairId)}
                                                                className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg transition-all shadow-sm"
                                                                title="Return to Pool"
                                                            >
                                                                <LogOut size={14} />
                                                            </button>
                                                        )}
                                                        <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeColor(job.status)}`}>
                                                            {job.status.replace(/_/g, ' ')}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-5">
                                                    <h3 className="font-bold text-slate-800 text-lg">{job.deviceBrand} {job.deviceModel}</h3>
                                                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">{job.problemDescription}</p>
                                                     <div className="mt-4 flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                                                        View Details & Update Status <ChevronRight size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {completedDeliveredJobs.length > 0 && (
                                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                                            <h3 className="font-bold text-slate-800">Completed & Delivered Jobs</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">Historical jobs history.</p>
                                        </div>
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full text-left text-sm text-slate-600">
                                                <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-700">
                                                    <tr>
                                                        <th className="p-4 font-semibold">Repair No</th>
                                                        <th className="p-4 font-semibold">Device</th>
                                                        <th className="p-4 font-semibold">Customer</th>
                                                        <th className="p-4 font-semibold">Status</th>
                                                        <th className="p-4 font-semibold text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {completedDeliveredJobs.map(job => (
                                                        <tr key={job.repairId} className="border-b border-slate-100 hover:bg-slate-50/60">
                                                            <td className="p-4 font-mono text-xs font-bold text-emerald-600">{formatRepairNo(job)}</td>
                                                            <td className="p-4">
                                                                <span className="font-semibold text-slate-800">{job.deviceBrand} {job.deviceModel}</span>
                                                                <span className="block text-xs text-slate-500">IMEI: {job.imeiNo || 'N/A'}</span>
                                                            </td>
                                                            <td className="p-4">
                                                                <span className="block text-slate-700 font-medium">{job.customerName || 'Walk-in'}</span>
                                                                <span className="block text-xs text-slate-500">{job.customerPhone || '-'}</span>
                                                            </td>
                                                            <td className="p-4">
                                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeColor(job.status)}`}>
                                                                    {job.status.replace(/_/g, ' ')}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <button
                                                                    onClick={() => { setSelectedJob(job); setShowDetailsModal(true); }}
                                                                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                                                                >
                                                                    View
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="block md:hidden divide-y divide-slate-100">
                                            {completedDeliveredJobs.map(job => (
                                                <div key={job.repairId} className="p-4 bg-white hover:bg-slate-50/60 transition-colors flex flex-col gap-2">
                                                    <div className="flex justify-between items-start">
                                                        <div className="font-mono text-xs font-bold text-emerald-600">{formatRepairNo(job)}</div>
                                                        <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${getStatusBadgeColor(job.status)}`}>
                                                            {job.status.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-800 text-sm block">{job.deviceBrand} {job.deviceModel}</span>
                                                        <span className="text-xs text-slate-500 block">IMEI: {job.imeiNo || 'N/A'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-slate-700 font-medium block">{job.customerName || 'Walk-in'}</span>
                                                        <span className="text-xs text-slate-500 block">{job.customerPhone || 'No contact'}</span>
                                                    </div>
                                                    <div className="mt-2 text-right">
                                                        <button
                                                            onClick={() => { setSelectedJob(job); setShowDetailsModal(true); }}
                                                            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                                                        >
                                                            View Details
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )
                    )}
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setShowDetailsModal(false)}>
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Cpu size={24} className="text-emerald-600" />
                                Repair Details
                            </h2>
                            <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Repair No</p>
                                    <p className="font-mono text-slate-800 font-semibold">{formatRepairNo(selectedJob)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Status</p>
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider inline-block ${getStatusBadgeColor(selectedJob.status)}`}>
                                        {selectedJob.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Device details</p>
                                    <p className="text-slate-800 font-bold">{selectedJob.deviceBrand} {selectedJob.deviceModel}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">IMEI</p>
                                    <p className="font-mono text-slate-800 font-semibold">{selectedJob.imeiNo || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Customer Name</p>
                                    <p className="text-slate-800 font-semibold">{selectedJob.customerName || 'Walk-in Customer'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Customer Phone</p>
                                    <p className="font-mono text-slate-800 font-semibold">{selectedJob.customerPhone || selectedJob.contactNo || 'N/A'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Received At</p>
                                    <p className="text-slate-700 font-semibold">{new Date(selectedJob.createdAt || selectedJob.updatedAt || Date.now()).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Problem Description</p>
                                <p className="text-slate-700">{selectedJob.problemDescription}</p>
                            </div>

                            <div className="Actions mt-6 border-t border-slate-100 pt-6">
                                <h3 className="text-sm font-bold text-slate-800 mb-4">Update Status Actions</h3>
                                <div className="flex flex-wrap gap-3">
                                    {selectedJob.status === 'DIAGNOSED' && (
                                        <button onClick={() => { setShowDetailsModal(false); handleUpdateStatus(selectedJob.repairId, 'IN_PROGRESS', 'Began repair work'); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center gap-2">
                                            <Play size={16} /> Start Repair Work
                                        </button>
                                    )}

                                    {selectedJob.status === 'IN_PROGRESS' && (
                                        <button onClick={() => { setShowDetailsModal(false); openFinalizeModal(selectedJob); }} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center gap-2">
                                            <CheckCircle size={16} /> Complete & Finalize Cost
                                        </button>
                                    )}

                                    {['WAITING_APPROVAL', 'READY_FOR_PAYMENT', 'PAID'].includes(selectedJob.status) && (
                                        <p className="text-sm text-slate-500 italic flex items-center gap-2">
                                            <CheckCircle2 className="text-emerald-500" size={16} />
                                            Repair work complete. Waiting for manager/payment.
                                        </p>
                                    )}
                                    {selectedJob.status === 'DELIVERED' && (
                                        <p className="text-sm text-emerald-600 font-bold flex items-center gap-2">
                                            <CheckCircle2 size={16} /> Device Delivered to Customer
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Request Finalize Modal */}
            {showFinalizeModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 bg-purple-50 text-purple-800 border-b border-purple-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <DollarSign size={20} /> Request Finalize Cost
                            </h3>
                            <button onClick={() => setShowFinalizeModal(false)} className="text-purple-400 hover:text-purple-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleRequestFinalize} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Select Manager / Supervisor</label>
                                {managers.length > 0 ? (
                                    <select
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-semibold"
                                        value={finalForm.managerId}
                                        onChange={e => setFinalForm({ ...finalForm, managerId: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Select Person --</option>
                                        {managers.map(m => (
                                            <option key={m.userId} value={m.userId}>{m.fullName} ({m.role.replace(/_/g, ' ')})</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-semibold"
                                        value={finalForm.managerId}
                                        onChange={e => setFinalForm({ ...finalForm, managerId: e.target.value })}
                                        placeholder="Enter Manager ID (e.g. 1)"
                                        required
                                    />
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Estimated / Final Cost (Rs)</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg font-bold"
                                    value={finalForm.estimatedCost}
                                    onChange={e => setFinalForm({ ...finalForm, estimatedCost: e.target.value })}
                                    required
                                    min="0"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Notes / Replaced Parts Details</label>
                                <textarea
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                    value={finalForm.costNote}
                                    onChange={e => setFinalForm({ ...finalForm, costNote: e.target.value })}
                                    rows="3"
                                    placeholder="Explain the work done and parts used"
                                />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setShowFinalizeModal(false)} className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={updatingId === selectedJob?.repairId} className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-sm transition-colors flex justify-center items-center gap-2">
                                    {updatingId === selectedJob?.repairId ? <Activity size={18} className="animate-spin" /> : 'Send Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PO Request Modal */}
            {showPOModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 bg-blue-50 text-blue-800 border-b border-blue-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <DollarSign size={20} /> Request Parts Funds (PO)
                            </h3>
                            <button onClick={() => setShowPOModal(false)} className="text-blue-400 hover:text-blue-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handlePORequest} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Estimated Amount Needed (Rs)</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold"
                                    value={poForm.amount}
                                    onChange={e => setPoForm({ ...poForm, amount: e.target.value })}
                                    required
                                    min="1"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Parts Needed / Notes</label>
                                <textarea
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    value={poForm.notes}
                                    onChange={e => setPoForm({ ...poForm, notes: e.target.value })}
                                    rows="3"
                                    required
                                    placeholder="List the parts you need to buy and the repair job number if applicable..."
                                />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setShowPOModal(false)} className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={poSubmitting} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors flex justify-center items-center gap-2">
                                    {poSubmitting ? <Activity size={18} className="animate-spin" /> : 'Send PO Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-6 right-6 z-[80] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-5 duration-300 ${notification.type === 'success' ? 'bg-emerald-600 text-white' : notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                    }`}>
                    <CheckCircle size={18} />
                    <div>
                        <div className="font-bold text-sm">{notification.title}</div>
                        <div className="text-xs opacity-90">{notification.message}</div>
                    </div>
                    <button onClick={() => setNotification(null)} className="ml-2 p-1 hover:bg-white/20 rounded-lg"><X size={14} /></button>
                </div>
            )}

            {/* New Repair Modal */}
            {showNewRepairModal && (
                <MobileRepairModal
                    onClose={() => { setShowNewRepairModal(false); fetchData(); }}
                    branchId={user?.branchId || 1}
                    onNotify={handleNotify}
                />
            )}
        </div>
    );
}

export default function MobileTechnicianLayout() {
    const navigate = useNavigate();
    const { systemName } = useSystemName();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <ConfirmActionModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={logout}
                title="Sign Out"
                message="Are you sure you want to sign out of the Technician Portal?"
                type="danger"
                confirmLabel="Sign Out"
                cancelLabel="Cancel"
            />
            <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 shrink-0 shadow-sm z-30">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl shadow-inner">
                        <TabletSmartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-slate-800 leading-tight">{systemName}</h1>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest leading-none mt-0.5">Mobile Technician</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <SecondaryRoleBanner />
                    <button
                        onClick={handleLogoutClick}
                        className="group relative overflow-hidden flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-red-100 text-slate-700 hover:text-red-600 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                        <LogOut size={18} className="relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-x-0.5" />
                        <span className="relative z-10 hidden sm:inline text-sm font-semibold">Sign Out</span>
                    </button>
                </div>
            </header>
            <main className="flex-1 overflow-auto">
                <Routes>
                    <Route index element={<RepairDashboard />} />
                </Routes>
            </main>
        </div>
    );
}
