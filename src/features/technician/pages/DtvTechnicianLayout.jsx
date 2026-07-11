import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { Tv, Activity, CheckCircle, Clock, MapPin, Phone, User, Wrench, ChevronRight, CheckCircle2, DollarSign, Package, AlertTriangle, LogOut, X, Plus } from 'lucide-react';
import { servicesService } from '@/shared/services/servicesService';
import DtvRequestModal from '@/features/pos/modals/DtvRequestModal';
import SecondaryRoleBanner from '@/shared/components/SecondaryRoleBanner';
import { useSystemName } from '@/context/SystemNameContext';
import ConfirmActionModal from '@/shared/components/ConfirmActionModal';
import DtvServiceCard from '../components/DtvServiceCard';
import { isToday } from '../utils/techHelpers';

function TechDashboard() {
    const [user, setUser] = useState({});
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('POOL'); // 'POOL' or 'MY_TASKS'
    const [updatingId, setUpdatingId] = useState(null);
    const [filterToday, setFilterToday] = useState(false);
    const [showHandoverModal, setShowHandoverModal] = useState(false);
    const [handoverAmount, setHandoverAmount] = useState('');

    const [showNewDtvModal, setShowNewDtvModal] = useState(false);
    const [notification, setNotification] = useState(null);

    const handleNotify = (type, title, message) => {
        setNotification({ type, title, message });
        setTimeout(() => setNotification(null), 4000);
    };

    // Load handover records keyed by technician user ID for persistence across re-logins
    const techUserId = user.id || user.userId;
    const handoverKey = `dtv_handovers_${techUserId}`;
    const [handovers, setHandovers] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(handoverKey)) || [];
        } catch { return []; }
    });

    // Sync handovers from localStorage whenever user changes
    useEffect(() => {
        if (techUserId) {
            try {
                const stored = JSON.parse(localStorage.getItem(`dtv_handovers_${techUserId}`)) || [];
                setHandovers(stored);
            } catch { setHandovers([]); }
        }
    }, [techUserId]);

    useEffect(() => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            setUser(storedUser || {});
        } catch (e) {
            console.error('No logged in user found', e);
        }
        fetchJobs();
    }, []);

    const saveHandover = (to) => {
        if (!handoverAmount || isNaN(handoverAmount) || handoverAmount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }
        const newHandover = {
            id: Date.now(),
            date: new Date().toISOString(),
            amount: parseFloat(handoverAmount),
            to: to,
            technicianId: techUserId
        };
        const storageKey = `dtv_handovers_${techUserId}`;
        const updated = [...handovers, newHandover];
        setHandovers(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setShowHandoverModal(false);
        setHandoverAmount('');
        alert(`Successfully recorded handover to ${to === 'MANAGER' ? 'Manager' : 'Cashier'}`);
    };

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const response = await servicesService.getDtvServices();
            const allJobs = response.data?.data || response.data || [];
            // Sort by latest updated/created
            allJobs.sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt).getTime();
                const dateB = new Date(b.updatedAt || b.createdAt).getTime();
                return dateB - dateA; // recent on top
            });
            setJobs(allJobs);
            setError('');
        } catch (err) {
            setError('Failed to load DTV jobs');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTakeJob = async (serviceId) => {
        try {
            setUpdatingId(serviceId);
            await servicesService.updateDtvServiceStatus(serviceId, 'ASSIGNED', techUserId);
            // After taking it, swap to My Tasks tab
            setActiveTab('MY_TASKS');
            fetchJobs();
        } catch (error) {
            alert('Failed to assign job. It might have been taken by someone else.');
            console.error(error);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleUpdateStatus = async (serviceId, newStatus, balance, items) => {
        try {
            setUpdatingId(serviceId);
            await servicesService.updateDtvServiceStatus(serviceId, newStatus, techUserId, balance, items);
            fetchJobs();
        } catch (error) {
            alert('Failed to update status.');
            console.error(error);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleReturnToPool = async (serviceId) => {
        if (!window.confirm("Return this job to the pool? It will be available for other technicians.")) return;
        try {
            setUpdatingId(serviceId);
            // Updating to PENDING with current technician ID to satisfy FK constraint (backend should handle unassignment for PENDING status)
            await servicesService.updateDtvServiceStatus(serviceId, 'PENDING', techUserId);
            fetchJobs();
            // Automatically switch back to pool tab if tasks are empty
            const remainingJobs = myJobs.filter(j => j.serviceId !== serviceId && j.serviceStatus !== 'COMPLETED');
            if(remainingJobs.length === 0) setActiveTab('POOL');
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || error.message || 'Failed to return job to pool.';
            alert(msg);
        } finally {
            setUpdatingId(null);
        }
    };



    const filteredJobs = filterToday ? jobs.filter(j => isToday(j.createdAt) || isToday(j.updatedAt)) : jobs;

    // Derived states
    const poolJobs = filteredJobs.filter(j => j.serviceStatus === 'PENDING' && !j.technicianId);

    // For My Tasks, we only show jobs assigned to this technician that are not CANCELLED
    // COMPLETED jobs remain in My Tasks as history/done
    const myJobs = filteredJobs.filter(j =>
        j.technicianId === techUserId &&
        ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(j.serviceStatus)
    );
    const activeMyJobs = myJobs.filter(j => j.serviceStatus !== 'COMPLETED');
    const completedMyJobs = myJobs.filter(j => j.serviceStatus === 'COMPLETED');

    const completedJobsToday = myJobs.filter(j => j.serviceStatus === 'COMPLETED' && isToday(j.updatedAt));
    const handoversToday = handovers.filter(h => isToday(h.date));

    // Total collected today & total handed over today
    const totalCollectedToday = completedJobsToday.reduce((sum, job) => sum + (parseFloat(job.balanceCollected) || 0), 0);
    const totalHandedOverToday = handoversToday.reduce((sum, h) => sum + h.amount, 0);
    const currentBalanceToday = Math.max(0, totalCollectedToday - totalHandedOverToday);

    return (
        <div className="p-3 sm:p-4 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">DTV Installer Dashboard</h1>
                    <p className="text-slate-500">Pick up new requests and manage your current installations.</p>
                </div>
                <div className="flex flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto mt-2 md:mt-0">
                    <label className="flex flex-1 sm:flex-none justify-center items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white px-3 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 whitespace-nowrap">
                        <input type="checkbox" checked={filterToday} onChange={(e) => setFilterToday(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4" />
                        Today's Work Only
                    </label>
                    <button onClick={() => { setHandoverAmount(currentBalanceToday || ''); setShowHandoverModal(true); }} className="flex-1 sm:flex-none justify-center bg-emerald-50 border border-emerald-100 hover:border-emerald-300 hover:bg-emerald-100 transition-colors px-3 sm:px-4 py-2.5 rounded-xl flex items-center gap-2 sm:gap-3 text-left">
                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" />
                        <div>
                            <div className="text-[9px] sm:text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none mb-1">Remaining Cash</div>
                            <div className="text-sm sm:text-lg font-black text-emerald-700 leading-none">Rs {currentBalanceToday.toLocaleString()}</div>
                        </div>
                    </button>
                    <button
                        onClick={() => setShowNewDtvModal(true)}
                        className="w-full sm:w-auto justify-center px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 font-bold tracking-wide transition-colors flex items-center gap-2 shadow-sm text-sm"
                    >
                        <Plus size={18} className="shrink-0" /> New DTV
                    </button>
                    <button
                        onClick={fetchJobs}
                        className="w-full sm:w-auto justify-center px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 font-bold tracking-wide transition-colors flex items-center gap-2 text-sm"
                    >
                        <Activity size={18} className="shrink-0" /> Refresh
                    </button>
                </div>
            </div>

            {/* Dashboard Tabs */}
            <div className="flex bg-slate-200/50 p-1 rounded-lg sm:rounded-2xl w-full gap-1">
                <button
                    onClick={() => setActiveTab('POOL')}
                    className={`flex-1 py-2 sm:py-2.5 rounded-md sm:rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'POOL'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <div className="relative">
                        <Tv size={18} />
                        {poolJobs.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
                        )}
                    </div>
                    Available Pool ({poolJobs.length})
                </button>
                <button
                    onClick={() => setActiveTab('MY_TASKS')}
                    className={`flex-1 py-2 sm:py-2.5 rounded-md sm:rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'MY_TASKS'
                        ? 'bg-white text-blue-700 shadow-sm'
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

            {loading && jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Activity className="w-8 h-8 animate-spin mb-4" />
                    <p>Loading service requests...</p>
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Render Pool */}
                    {activeTab === 'POOL' && (
                        poolJobs.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                                <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <h3 className="text-lg font-bold text-slate-600">You're all caught up!</h3>
                                <p className="text-slate-400">There are no pending requests in the pool right now.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                                {poolJobs.map(job => (
                                    <DtvServiceCard
                                        key={job.serviceId}
                                        job={job}
                                        onAction={() => handleTakeJob(job.serviceId)}
                                        actionText="Take Job"
                                        actionColor="blue"
                                        icon={<Wrench size={16} />}
                                        isProcessing={updatingId === job.serviceId}
                                    />
                                ))}
                            </div>
                        )
                    )}

                    {/* Render My Tasks */}
                    {activeTab === 'MY_TASKS' && (
                        (activeMyJobs.length === 0 && completedMyJobs.length === 0) ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                                <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <h3 className="text-lg font-bold text-slate-600">No active tasks</h3>
                                <p className="text-slate-400">Pick up a job from the available pool to get started.</p>
                                <button
                                    onClick={() => setActiveTab('POOL')}
                                    className="mt-4 text-blue-600 font-bold hover:underline"
                                >
                                    View Pool
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {activeMyJobs.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                                        {activeMyJobs.map(job => (
                                            <DtvServiceCard
                                                key={job.serviceId}
                                                job={job}
                                                onAction={(balance, items) => {
                                                    if (job.serviceStatus === 'ASSIGNED') handleUpdateStatus(job.serviceId, 'IN_PROGRESS');
                                                    if (job.serviceStatus === 'IN_PROGRESS') handleUpdateStatus(job.serviceId, 'COMPLETED', balance, items);
                                                }}
                                                onReturnToPool={() => handleReturnToPool(job.serviceId)}
                                                actionText={
                                                    job.serviceStatus === 'ASSIGNED' ? 'Start Work' :
                                                        job.serviceStatus === 'IN_PROGRESS' ? 'Mark Complete' : 'Completed'
                                                }
                                                actionColor={
                                                    job.serviceStatus === 'ASSIGNED' ? 'orange' :
                                                        job.serviceStatus === 'IN_PROGRESS' ? 'emerald' : 'slate'
                                                }
                                                icon={
                                                    job.serviceStatus === 'ASSIGNED' ? <Activity size={16} /> :
                                                        job.serviceStatus === 'IN_PROGRESS' ? <CheckCircle size={16} /> : <CheckCircle2 size={16} />
                                                }
                                                disabled={false}
                                                isProcessing={updatingId === job.serviceId}
                                            />
                                        ))}
                                    </div>
                                )}

                                {completedMyJobs.length > 0 && (
                                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                                            <h3 className="font-bold text-slate-800">Completed Jobs</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">History of finished DTV jobs.</p>
                                        </div>
                                        {/* Desktop Table View */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full text-left text-sm text-slate-600">
                                                <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-700">
                                                    <tr>
                                                        <th className="p-4 font-semibold">Service No</th>
                                                        <th className="p-4 font-semibold">Customer</th>
                                                        <th className="p-4 font-semibold">Type</th>
                                                        <th className="p-4 font-semibold">Address</th>
                                                        <th className="p-4 font-semibold">Collected</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {completedMyJobs.map(job => (
                                                        <tr key={job.serviceId} className="border-b border-slate-100 hover:bg-slate-50/60">
                                                            <td className="p-4 font-mono text-xs font-bold text-blue-600">SRV-{job.serviceId}</td>
                                                            <td className="p-4">
                                                                <span className="block font-semibold text-slate-800">{job.customerName || 'Walk-in'}</span>
                                                                <span className="block text-xs text-slate-500">{job.contactNo || '-'}</span>
                                                            </td>
                                                            <td className="p-4">{job.serviceType.replace(/_/g, ' ')}</td>
                                                            <td className="p-4 text-slate-500 max-w-[220px] truncate" title={job.address}>{job.address || '-'}</td>
                                                            <td className="p-4 font-semibold text-emerald-600">{job.balanceCollected > 0 ? `Rs ${Number(job.balanceCollected).toLocaleString()}` : '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {/* Mobile Card View */}
                                        <div className="block md:hidden divide-y divide-slate-100">
                                            {completedMyJobs.map(job => (
                                                <div key={job.serviceId} className="p-4 bg-white hover:bg-slate-50/60 transition-colors">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="font-mono text-xs font-bold text-blue-600">SRV-{job.serviceId}</div>
                                                        <div className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md uppercase tracking-wide">
                                                            {job.serviceType.replace(/_/g, ' ')}
                                                        </div>
                                                    </div>
                                                    <div className="mb-2">
                                                        <span className="font-bold text-slate-800 text-sm block">{job.customerName || 'Walk-in'}</span>
                                                        <span className="text-xs text-slate-500 block">{job.contactNo || 'No contact'}</span>
                                                    </div>
                                                    {job.address && (
                                                        <div className="text-xs text-slate-500 mb-2 truncate">
                                                            <span className="font-semibold text-slate-400 mr-1">Addr:</span>
                                                            {job.address}
                                                        </div>
                                                    )}
                                                    <div className="text-sm font-semibold text-emerald-600">
                                                        {job.balanceCollected > 0 ? `Collected: Rs ${Number(job.balanceCollected).toLocaleString()}` : 'No Collection'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Handover Modal */}
            {showHandoverModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200 relative">
                        <button onClick={() => setShowHandoverModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                            <X size={20} />
                        </button>
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-slate-800">Handover Collected Cash</h3>
                            <p className="text-sm text-slate-500 mt-1">Transfer today's collected money to the Manager or Cashier.</p>

                            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-600">Total Collected Today:</span>
                                    <span className="font-bold text-slate-800">Rs {totalCollectedToday.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-600">Already Handed Over:</span>
                                    <span className="font-bold text-slate-800">Rs {totalHandedOverToday.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                    <span className="text-sm font-semibold text-emerald-600">Remaining Balance:</span>
                                    <span className="font-black text-emerald-700 text-lg">Rs {currentBalanceToday.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Amount to Handover (Rs)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max={currentBalanceToday}
                                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-lg font-bold shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                                    value={handoverAmount}
                                    onChange={(e) => setHandoverAmount(e.target.value)}
                                    placeholder="Enter amount..."
                                />
                            </div>
                        </div>
                        <div className="bg-slate-50 px-6 py-4 flex gap-3 border-t border-slate-100">
                            <button onClick={() => saveHandover('CASHIER')} className="flex-1 px-4 py-2.5 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow-sm transition-all text-center">
                                To Cashier
                            </button>
                            <button onClick={() => saveHandover('MANAGER')} className="flex-1 px-4 py-2.5 text-sm font-bold bg-purple-600 text-white hover:bg-purple-700 rounded-xl shadow-sm transition-all text-center">
                                To Manager
                            </button>
                        </div>
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

            {/* New DTV Service Modal */}
            {showNewDtvModal && (
                <DtvRequestModal
                    onClose={() => { setShowNewDtvModal(false); fetchJobs(); }}
                    branchId={user?.branchId || 1}
                    onNotify={handleNotify}
                />
            )}
        </div>
    );
}

export default function DtvTechnicianLayout() {
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
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
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
            <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-inner">
                            <Tv className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="font-bold text-lg text-slate-800 leading-tight">{systemName}</h1>
                            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest leading-none mt-0.5">DTV Technician</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <SecondaryRoleBanner />
                    <div className="hidden sm:flex flex-col items-end mr-2">
                        <span className="text-sm font-bold text-slate-800">Field Technician</span>
                        <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            Online
                        </span>
                    </div>
                    <button
                        onClick={handleLogoutClick}
                        className="group relative overflow-hidden flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-red-100 text-slate-700 hover:text-red-600 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                        <LogOut size={18} className="relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-x-0.5" />
                        <span className="relative z-10 hidden sm:inline text-sm font-semibold">Sign Out</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto w-full p-4 lg:p-8">
                <Routes>
                    <Route index element={<TechDashboard />} />
                </Routes>
            </main>
        </div>
    );
}
