import React, { useState, useEffect } from 'react';
import { 
    Plus, Search, Filter, Calendar, FileText, CheckCircle, 
    XCircle, Clock, CreditCard, DollarSign, Settings, 
    List, ArrowRight, Wallet, PieChart, Activity, X, PlusCircle, Pencil, Save, Trash2
} from 'lucide-react';
import { expenseService } from '../services/expenseService';
import { authService } from '@/features/auth/services/authService';

const ExpenseDetailsModal = ({ expense, onClose, onPaymentAdded }) => {
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleAddPayment = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            const payload = {
                expenseId: expense.expenseId,
                paymentDate: new Date().toISOString().split('T')[0],
                paymentMethod,
                amount: parseFloat(amount),
                referenceNo: reference,
                notes
            };
            await expenseService.addPayment(payload);
            setAmount('');
            setReference('');
            setNotes('');
            onPaymentAdded();
        } catch (err) {
            setError(err.response?.data || err.message || 'Failed to add payment');
        } finally {
            setLoading(false);
        }
    };

    if (!expense) return null;

    const balance = expense.balance;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Expense Details - {expense.expenseNo}</h2>
                        <p className="text-sm text-slate-500">{expense.description}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:flex gap-6">
                    <div className="md:w-1/2 space-y-6">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Information</h3>
                            
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-500">Date</span>
                                <span className="text-sm font-semibold">{expense.expenseDate}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-500">Category</span>
                                <span className="text-sm font-semibold">{expense.categoryName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-500">Branch</span>
                                <span className="text-sm font-semibold">{expense.branchName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-500">Total Amount</span>
                                <span className="text-base font-bold text-slate-800">Rs. {expense.amount?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-slate-200">
                                <span className="text-sm font-bold text-slate-700">Total Paid</span>
                                <span className="text-base font-bold text-emerald-600">Rs. {expense.totalPaid?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-slate-200">
                                <span className="text-sm font-bold text-slate-700">Balance</span>
                                <span className={`text-base font-bold ${balance > 0 ? 'text-red-500' : 'text-slate-400'}`}>Rs. {balance?.toLocaleString()}</span>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <List size={16} className="text-slate-400"/> Payment History
                            </h3>
                            {(!expense.payments || expense.payments.length === 0) ? (
                                <p className="text-sm text-slate-400 italic bg-slate-50 p-3 rounded-lg text-center">No payments recorded</p>
                            ) : (
                                <div className="space-y-3">
                                    {expense.payments.map((p, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                            <div>
                                                <div className="text-sm font-bold text-slate-700">{p.paymentDate}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded uppercase text-[10px] font-bold text-slate-600">{p.paymentMethod}</span>
                                                    {p.referenceNo && <span>• Ref: {p.referenceNo}</span>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-emerald-600">+Rs. {p.amount?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="md:w-1/2 mt-6 md:mt-0">
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <PlusCircle size={16} className="text-brand"/> Record Payment
                            </h3>
                            {balance <= 0 ? (
                                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm text-center font-medium">
                                    <CheckCircle size={20} className="mx-auto mb-2 opacity-50"/>
                                    This expense is fully paid.
                                </div>
                            ) : (
                                <form onSubmit={handleAddPayment} className="space-y-4">
                                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{error}</div>}
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Payment Method *</label>
                                        <select 
                                            value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                                        >
                                            <option value="CASH">CASH</option>
                                            <option value="BANK">BANK / TRANSFER</option>
                                            <option value="CARD">CARD</option>
                                            <option value="CHEQUE">CHEQUE</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Amount * (Max: {balance})</label>
                                        <input 
                                            type="number" step="0.01" max={balance} required
                                            value={amount} onChange={(e) => setAmount(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none font-mono"
                                            placeholder={`0.00`}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Reference No.</label>
                                        <input 
                                            type="text"
                                            value={reference} onChange={(e) => setReference(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                                            placeholder="Receipt / Cheque No."
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Notes</label>
                                        <textarea 
                                            rows="2"
                                            value={notes} onChange={(e) => setNotes(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                                            placeholder="Optional notes"
                                        ></textarea>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
                                        className="w-full bg-brand text-white py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-brand/20 hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Activity size={16} className="animate-spin" /> : <Save size={16} />} 
                                        Save Payment
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ExpenseFormModal = ({ onClose, categories, branches, onSuccess }) => {
    const [formData, setFormData] = useState({
        branchId: '',
        categoryId: '',
        expenseDate: new Date().toISOString().split('T')[0],
        amount: '',
        paymentMethod: 'UNPAID',
        referenceNo: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            const payload = { ...formData, amount: parseFloat(formData.amount) };
            await expenseService.createExpense(payload);
            onSuccess();
        } catch (err) {
            setError(err.response?.data || err.message || 'Failed to save expense');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><PlusCircle size={18}/> New Expense</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{error}</div>}
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Branch *</label>
                            <select 
                                value={formData.branchId} onChange={(e) => setFormData({...formData, branchId: e.target.value})} required
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none"
                            >
                                <option value="">Select Branch</option>
                                {branches.map(b => (
                                    <option key={b.branchId || b.id} value={b.branchId || b.id}>{b.name || b.branchName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Category *</label>
                            <select 
                                value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})} required
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none"
                            >
                                <option value="">Select Category</option>
                                {categories.map(c => (
                                    <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Date *</label>
                            <input 
                                type="date" required value={formData.expenseDate} onChange={(e) => setFormData({...formData, expenseDate: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Amount (Rs) *</label>
                            <input 
                                type="number" step="0.01" min="0.01" required placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:border-brand outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Initial Payment Method</label>
                        <select 
                            value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none text-slate-600"
                        >
                            <option value="UNPAID">None (Unpaid)</option>
                            <option value="CASH">Fully Paid - CASH</option>
                            <option value="BANK">Fully Paid - BANK</option>
                            <option value="CARD">Fully Paid - CARD</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Reference No. (Optional)</label>
                        <input 
                            type="text" placeholder="Bill / Receipt No." value={formData.referenceNo} onChange={(e) => setFormData({...formData, referenceNo: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                        <textarea 
                            rows="2" placeholder="What was this expense for?" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none"
                        ></textarea>
                    </div>
                    
                    <button 
                        type="submit" disabled={loading}
                        className="w-full bg-brand text-white py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-brand/20 hover:bg-brand-hover flex justify-center mt-2 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Expense Record'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const CategoriesManagerModal = ({ onClose }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await expenseService.getAllCategories();
            setCategories(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);
            await expenseService.createCategory({ name, description: desc, isActive: true });
            setName('');
            setDesc('');
            fetchCategories();
        } catch (err) {
            setError(err.response?.data || 'Failed to create category');
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (id) => {
        try {
            await expenseService.toggleCategoryStatus(id);
            fetchCategories();
        } catch {
            alert('Failed to update status');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Settings size={18}/> Manage Categories</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
                </div>

                <div className="p-6 bg-slate-50 border-b border-slate-100">
                    <form onSubmit={handleCreate} className="flex gap-3 items-start">
                        <div className="flex-1">
                            <input type="text" placeholder="Category Name (e.g., Electricity)" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none" />
                        </div>
                        <div className="flex-1">
                            <input type="text" placeholder="Description (Optional)" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none" />
                        </div>
                        <button type="submit" disabled={saving || !name} className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-brand/20 hover:bg-brand-hover disabled:opacity-50">Add</button>
                    </form>
                    {error && <div className="mt-2 text-xs text-red-600 font-semibold">{error}</div>}
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center p-8"><Activity className="animate-spin text-brand" /></div>
                    ) : (
                        <div className="space-y-3">
                            {categories.map(c => (
                                <div key={c.categoryId} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">{c.name}</div>
                                        <div className="text-xs text-slate-500">{c.description || 'No description'}</div>
                                    </div>
                                    <button 
                                        onClick={() => toggleStatus(c.categoryId)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold ${c.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    >
                                        {c.isActive ? 'Active' : 'Disabled'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [dashboard, setDashboard] = useState(null);
    const [categories, setCategories] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [showCategories, setShowCategories] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [expRes, dashRes, catRes, branchRes] = await Promise.all([
                expenseService.getAllExpenses(),
                expenseService.getDashboardMetrics(),
                expenseService.getActiveCategories(),
                authService.getBranches()
            ]);
            setExpenses(expRes.data || []);
            setDashboard(dashRes.data || null);
            setCategories(catRes.data || []);
            setBranches(branchRes || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filteredExpenses = expenses.filter(e => {
        const matchesSearch = e.expenseNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              e.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory ? e.categoryId.toString() === filterCategory : true;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                        <Wallet className="text-brand"/> Expense Management
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Track and manage business operational expenses.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowCategories(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50">
                        <Settings size={16}/> Categories
                    </button>
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold shadow-lg shadow-brand/20 hover:bg-brand-hover">
                        <Plus size={16}/> New Expense
                    </button>
                </div>
            </div>

            {dashboard && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Today's Expenses</p>
                            <h3 className="text-2xl font-extrabold text-slate-800">Rs. {dashboard.todayExpenses?.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-brand-light/10 text-brand rounded-xl"><DollarSign size={20}/></div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">This Month</p>
                            <h3 className="text-2xl font-extrabold text-slate-800">Rs. {dashboard.monthlyExpenses?.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><PieChart size={20}/></div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Unpaid Balance</p>
                            <h3 className="text-2xl font-extrabold text-red-600">Rs. {dashboard.unpaidExpenses?.toLocaleString()}</h3>
                            <p className="text-[10px] text-slate-500 font-medium mt-1">Settle to clear</p>
                        </div>
                        <div className="p-3 bg-red-50 text-red-500 rounded-xl"><Clock size={20}/></div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Top Category</p>
                            <h3 className="text-lg font-extrabold text-slate-800 truncate max-w-[120px]">{dashboard.topCategoryName}</h3>
                            <p className="text-[11px] text-slate-500 font-bold mt-1">Rs. {dashboard.topCategoryAmount?.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Activity size={20}/></div>
                    </div>
                </div>
            )}

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                        type="text" placeholder="Search expenses..." 
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand"
                    />
                </div>
                <div className="relative">
                    <select 
                        value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                        className="pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 focus:outline-none appearance-none cursor-pointer"
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Expense ID</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4 text-right">Amount (Rs)</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">Loading expenses...</td></tr>
                            ) : filteredExpenses.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400 bg-slate-50/50">
                                    <FileText className="mx-auto mb-2 opacity-50" size={32}/>
                                    No expenses found.
                                </td></tr>
                            ) : (
                                filteredExpenses.map(e => (
                                    <tr key={e.expenseId} onClick={() => setSelectedExpense(e)} className="hover:bg-slate-50 cursor-pointer group transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-slate-700">{e.expenseNo}</td>
                                        <td className="px-6 py-4 text-slate-600">{e.expenseDate}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md uppercase">{e.categoryName}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]">{e.description || '-'}</td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                                            {e.amount?.toLocaleString()}
                                            <div className="text-[10px] text-slate-400 mt-0.5 font-sans whitespace-nowrap">
                                                Bal: <span className={e.balance > 0 ? "text-red-500 font-bold" : "text-emerald-500 font-bold"}>{e.balance?.toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {e.balance <= 0 ? (
                                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-200">
                                                    <CheckCircle size={10}/> Paid
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full border border-orange-200">
                                                    <Clock size={10}/> Pending
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showForm && (
                <ExpenseFormModal 
                    onClose={() => setShowForm(false)} 
                    categories={categories} 
                    branches={branches} 
                    onSuccess={() => { setShowForm(false); fetchData(); }} 
                />
            )}
            
            {showCategories && (
                <CategoriesManagerModal onClose={() => setShowCategories(false)} />
            )}

            {selectedExpense && (
                <ExpenseDetailsModal 
                    expense={selectedExpense} 
                    onClose={() => setSelectedExpense(null)}
                    onPaymentAdded={() => { setSelectedExpense(null); fetchData(); }}
                />
            )}
        </div>
    );
}
