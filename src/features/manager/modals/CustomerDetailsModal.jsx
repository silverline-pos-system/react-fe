import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, Award, Gift, Clock, Save, Loader2, Ban, ShieldCheck, ShoppingBag, Receipt, ArrowRight } from 'lucide-react';
import { updateCustomer, adjustCustomerPoints, getCustomerSales } from '../services/managerService';
import useEscapeClose from '@/hooks/useEscapeClose';

export default function CustomerDetailsModal({ customer, onClose, onUpdate }) {
    useEscapeClose(onClose);
    const [activeTab, setActiveTab] = useState('details');
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    const [transactions, setTransactions] = useState([]);
    const [loadingTx, setLoadingTx] = useState(false);

    const [pointsAdj, setPointsAdj] = useState({ amount: 0, reason: '' });
    const [adjLoading, setAdjLoading] = useState(false);
    const isBlocked = customer?.status === 'Inactive';

    useEffect(() => {
        if (customer) {
            setFormData({
                ...customer,
                dateOfBirth: customer.dateOfBirth || '',
                address: customer.address || '',
                city: customer.city || ''
            });
            fetchTransactions(customer.id);
        }
    }, [customer]);

    const fetchTransactions = async (id) => {
        setLoadingTx(true);
        try {
            const data = await getCustomerSales(id);
            setTransactions(data || []);
        } catch (e) {
            console.error("Failed to load transactions", e);
        } finally {
            setLoadingTx(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateCustomer(customer.id, formData);
            onUpdate();
            setEditMode(false);
        } catch {
            alert("Failed to update customer");
        } finally {
            setLoading(false);
        }
    };

    const handlePointsAdjustment = async (e) => {
        e.preventDefault();
        setAdjLoading(true);
        try {
            await adjustCustomerPoints(customer.id, parseInt(pointsAdj.amount), pointsAdj.reason);
            onUpdate();
            setPointsAdj({ amount: 0, reason: '' });
            alert("Points adjusted successfully");
        } catch {
            alert("Failed to adjust points");
        } finally {
            setAdjLoading(false);
        }
    };

    const toggleStatus = async () => {
        if (!confirm(`Are you sure you want to ${isBlocked ? 'UNBLOCK' : 'BLOCK'} this customer?`)) return;

        const newStatus = isBlocked ? 'Active' : 'Inactive';
        try {
            await updateCustomer(customer.id, { ...customer, status: newStatus });
            onUpdate();
        } catch {
            alert("Failed to change status");
        }
    };

    useEffect(() => {
        if (!customer) return;

        const handleKeyDown = (e) => {
            if (e.key !== 'Enter') return;

            const tag = (document.activeElement?.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

            e.preventDefault();
            if (editMode && !isBlocked) {
                handleSave();
            } else {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [customer, editMode, isBlocked, onClose]);

    if (!customer) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all ${isBlocked ? 'border-4 border-red-500' : ''
                }`}>

                {/* Header */}
                <div className={`p-6 flex justify-between items-start text-white transition-colors duration-300 ${isBlocked ? 'bg-red-600' : 'bg-slate-900'
                    }`}>
                    <div className="flex gap-4 items-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg transition-transform ${isBlocked ? 'bg-white text-red-600 scale-110' : 'bg-gradient-to-br from-brand-secondary to-brand scale-100'
                            }`}>
                            {customer.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                {customer.name}
                                {isBlocked && <Ban size={24} className="text-white drop-shadow-md" />}
                            </h2>
                            <div className="flex items-center gap-3 text-white/80 text-sm mt-1">
                                {isBlocked ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-white text-red-600 shadow-sm">
                                        Blocked / Inactive
                                    </span>
                                ) : (
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${customer.tier === 'Platinum' ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30' :
                                            customer.tier === 'Gold' ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30' :
                                                'bg-slate-700 text-slate-300'
                                        }`}>
                                        {customer.tier} Member
                                    </span>
                                )}
                                <span className="flex items-center gap-1 opacity-80">
                                    <Phone size={12} /> {customer.phone}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 bg-white">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Profile Details
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'history' ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Sales History
                    </button>
                    <button
                        onClick={() => setActiveTab('points')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'points' ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Points & Rewards
                    </button>
                </div>

                {/* Content */}
                <div className={`p-6 overflow-y-auto flex-1 ${isBlocked ? 'bg-red-50' : 'bg-white'}`}>

                    {/* DETAILS TAB */}
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 text-lg">Personal Information</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={toggleStatus}
                                        className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors shadow-sm ${!isBlocked
                                                ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200'
                                            }`}
                                    >
                                        {!isBlocked ? <><Ban size={14} /> BLOCK USER</> : <><ShieldCheck size={14} /> UNBLOCK USER</>}
                                    </button>
                                    {!isBlocked && (!editMode ? (
                                        <button onClick={() => setEditMode(true)} className="text-brand hover:text-brand-hover text-sm font-bold ml-2">Edit Details</button>
                                    ) : (
                                        <div className="flex gap-2 ml-2">
                                            <button onClick={() => setEditMode(false)} className="text-slate-500 hover:text-slate-700 text-sm font-bold">Cancel</button>
                                            <button onClick={handleSave} disabled={loading} className="bg-brand text-white px-3 py-1 rounded text-sm font-bold flex items-center gap-1">
                                                {loading && <Loader2 size={14} className="animate-spin" />} Save
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {isBlocked && (
                                <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                                    <Ban size={16} className="mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-bold">This account is currently blocked.</p>
                                        <p className="opacity-80">Editing details and earning points are disabled while the account is inactive.</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                                <FormItem label="Full Name" icon={User} value={formData.name} editMode={editMode && !isBlocked} onChange={v => setFormData({ ...formData, name: v })} disabled={isBlocked} />
                                <FormItem label="Phone Number" icon={Phone} value={formData.phone} editMode={editMode && !isBlocked} onChange={v => setFormData({ ...formData, phone: v })} disabled={isBlocked} />
                                <FormItem label="Email Address" icon={Mail} value={formData.email} editMode={editMode && !isBlocked} onChange={v => setFormData({ ...formData, email: v })} disabled={isBlocked} />
                                <FormItem label="Date of Birth" icon={Calendar} value={formData.dateOfBirth} type="date" editMode={editMode && !isBlocked} onChange={v => setFormData({ ...formData, dateOfBirth: v })} disabled={isBlocked} />
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2">
                                        <FormItem label="Address" icon={MapPin} value={formData.address} editMode={editMode && !isBlocked} onChange={v => setFormData({ ...formData, address: v })} disabled={isBlocked} />
                                    </div>
                                    <FormItem label="City" icon={MapPin} value={formData.city} editMode={editMode && !isBlocked} onChange={v => setFormData({ ...formData, city: v })} disabled={isBlocked} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HISTORY TAB */}
                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <ShoppingBag size={20} className="text-brand" /> Recent Purchases
                            </h3>

                            {loadingTx ? (
                                <div className="py-8 flex justify-center text-brand"><Loader2 size={32} className="animate-spin" /></div>
                            ) : transactions.length === 0 ? (
                                <div className="py-12 text-center text-slate-400 border-2 border-dashed rounded-xl">
                                    <ShoppingBag size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No recent transactions found.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {transactions.map((tx) => (
                                        <div key={tx.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center hover:bg-slate-100 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 text-brand-secondary shadow-sm">
                                                    <Receipt size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-700">{tx.invoiceNo}</div>
                                                    <div className="text-xs text-slate-400 flex items-center gap-1">
                                                        <Clock size={10} /> {tx.date}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono font-bold text-slate-800">LKR {tx.amount?.toLocaleString()}</div>
                                                <div className={`text-[10px] font-bold uppercase tracking-wider ${tx.paymentStatus === 'PAID' ? 'text-emerald-500' : 'text-orange-500'
                                                    }`}>
                                                    {tx.paymentStatus}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {transactions.length > 0 && (
                                <button className="w-full py-2 text-xs font-bold text-slate-400 hover:text-brand flex items-center justify-center gap-1 mt-2">
                                    View Full History <ArrowRight size={12} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* POINTS TAB */}
                    {activeTab === 'points' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                                    <div className="text-slate-500 text-xs font-bold uppercase mb-1">Available Points</div>
                                    <div className="text-2xl font-extrabold text-brand-secondary">{customer.availablePoints}</div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                                    <div className="text-slate-500 text-xs font-bold uppercase mb-1">Lifetime Spend</div>
                                    <div className="text-lg font-bold text-slate-800">{customer.totalSpend}</div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                                    <div className="text-slate-500 text-xs font-bold uppercase mb-1">Current Tier</div>
                                    <div className="text-lg font-bold text-brand">{customer.tier}</div>
                                </div>
                            </div>

                            {!isBlocked ? (
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Gift size={18} className="text-brand" /> Adjust Loyalty Points
                                    </h4>
                                    <form onSubmit={handlePointsAdjustment} className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Points (+/-)</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-3 py-2 border rounded font-mono text-sm"
                                                    placeholder="e.g. 100 or -50"
                                                    value={pointsAdj.amount}
                                                    onChange={e => setPointsAdj({ ...pointsAdj, amount: e.target.value })}
                                                    required
                                                 />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Reason</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border rounded text-sm"
                                                    placeholder="e.g. Manual Correction"
                                                    value={pointsAdj.reason}
                                                    onChange={e => setPointsAdj({ ...pointsAdj, reason: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={adjLoading || !pointsAdj.amount}
                                            className="w-full bg-slate-800 text-white py-2 rounded font-bold text-sm hover:bg-slate-900 transition flex justify-center items-center gap-2"
                                        >
                                            {adjLoading && <Loader2 size={16} className="animate-spin" />} Update Balance
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-xl border-dashed">
                                    <Ban size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="font-bold">Points operations disabled</p>
                                    <p className="text-xs">Unblock this customer to adjust points.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const FormItem = ({ label, icon: Icon, value, editMode, onChange, type = "text", disabled }) => (
    <div>
        <label className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
            <Icon size={12} /> {label}
        </label>
        {editMode && !disabled ? (
            <input
                type={type}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-brand"
                value={value || ''}
                onChange={e => onChange(e.target.value)}
            />
        ) : (
            <div className={`p-2 rounded border border-transparent ${!value ? 'text-slate-400 italic' : 'text-slate-800 font-medium'} ${disabled ? 'opacity-70' : ''}`}>
                {value || 'Not provided'}
            </div>
        )}
    </div>
);
