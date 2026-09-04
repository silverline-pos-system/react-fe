import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Tag, Trash2, Pencil, Power, X } from 'lucide-react';
import promotionService from '@/features/inventory/services/promotionService';
import { useInventoryNotification } from '@/features/inventory/context/InventoryNotificationContext';

const PROMO_TYPES = [
    { value: 'BUY_X_GET_Y_FREE', label: 'Buy X Get Y Free' },
    { value: 'PERCENT_OFF', label: 'Percentage Off' },
    { value: 'AMOUNT_OFF', label: 'Amount Off' },
    { value: 'N_FOR_FIXED', label: 'N for Fixed Price' },
    { value: 'BUNDLE', label: 'Bundle (fixed price)' },
    { value: 'EXPIRY_CLEARANCE', label: 'Expiry Clearance' },
];

const emptyForm = () => ({
    name: '', description: '', promoType: 'BUY_X_GET_Y_FREE',
    scopeType: 'PRODUCT', scopeRefId: '', branchId: '',
    buyQty: '', getQty: '', getProductId: '',
    discountPercent: '', discountAmount: '', fixedPrice: '',
    minCartAmount: '', clearanceDays: '',
    startAt: '', endAt: '', priority: 0, stackable: true, isActive: true, maxUses: '',
});

const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

export default function PromotionsScreen({ items = [], categories = [], branches = [] }) {
    const { success, error, confirm } = useInventoryNotification();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm());

    const load = async () => {
        try {
            setLoading(true);
            setRows(await promotionService.list());
        } catch (err) {
            console.error(err);
            error('Failed to load promotions.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const branchName = (id) => id == null ? 'All branches'
        : (branches.find((b) => String(b.branch_id) === String(id))?.name || `Branch ${id}`);

    const productName = (id) => id == null ? ''
        : (items.find((p) => String(p.product_id) === String(id))?.name || `#${id}`);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const openNew = () => { setForm(emptyForm()); setEditingId(null); setShowForm(true); };

    const openEdit = (p) => {
        setForm({
            name: p.name || '', description: p.description || '', promoType: p.promoType,
            scopeType: p.scopeType || 'ALL', scopeRefId: p.scopeRefId ?? '', branchId: p.branchId ?? '',
            buyQty: p.buyQty ?? '', getQty: p.getQty ?? '', getProductId: p.getProductId ?? '',
            discountPercent: p.discountPercent ?? '', discountAmount: p.discountAmount ?? '', fixedPrice: p.fixedPrice ?? '',
            minCartAmount: p.minCartAmount ?? '', clearanceDays: p.clearanceDays ?? '',
            startAt: p.startAt ? p.startAt.slice(0, 16) : '', endAt: p.endAt ? p.endAt.slice(0, 16) : '',
            priority: p.priority ?? 0, stackable: p.stackable ?? true, isActive: p.isActive ?? true, maxUses: p.maxUses ?? '',
        });
        setEditingId(p.promotionId);
        setShowForm(true);
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { error('Name is required.'); return; }
        const dto = {
            name: form.name.trim(), description: form.description, promoType: form.promoType,
            scopeType: form.scopeType, scopeRefId: form.scopeType === 'ALL' ? null : num(form.scopeRefId),
            branchId: num(form.branchId),
            buyQty: num(form.buyQty), getQty: num(form.getQty), getProductId: num(form.getProductId),
            discountPercent: num(form.discountPercent), discountAmount: num(form.discountAmount), fixedPrice: num(form.fixedPrice),
            minCartAmount: num(form.minCartAmount), clearanceDays: num(form.clearanceDays),
            startAt: form.startAt || null, endAt: form.endAt || null,
            priority: num(form.priority) ?? 0, stackable: !!form.stackable, isActive: !!form.isActive, maxUses: num(form.maxUses),
        };
        try {
            if (editingId) { await promotionService.update(editingId, dto); success('Promotion updated.'); }
            else { await promotionService.create(dto); success('Promotion created.'); }
            setShowForm(false);
            load();
        } catch (err) {
            error(err?.response?.data?.message || 'Failed to save promotion.');
        }
    };

    const toggle = async (p) => {
        try { await promotionService.toggle(p.promotionId, !p.isActive); load(); }
        catch { error('Failed to toggle promotion.'); }
    };

    const remove = async (p) => {
        if (!(await confirm('Delete Promotion', `Delete "${p.name}"?`, 'danger'))) return;
        try { await promotionService.remove(p.promotionId); success('Promotion deleted.'); load(); }
        catch { error('Failed to delete promotion.'); }
    };

    const t = form.promoType;
    const typeFields = useMemo(() => ({
        showBuyGet: t === 'BUY_X_GET_Y_FREE',
        showPercent: t === 'PERCENT_OFF' || t === 'EXPIRY_CLEARANCE',
        showAmount: t === 'AMOUNT_OFF',
        showFixed: t === 'N_FOR_FIXED' || t === 'BUNDLE',
        showBuyQty: t === 'N_FOR_FIXED',
        showGetProduct: t === 'BUY_X_GET_Y_FREE' || t === 'BUNDLE',
        showClearance: t === 'EXPIRY_CLEARANCE',
    }), [t]);

    const inputCls = 'w-full border border-slate-300 rounded-lg p-2 text-sm';
    const labelCls = 'block text-[11px] font-bold text-slate-500 uppercase mb-1';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                        <Tag className="text-purple-600" /> Promotions
                    </h2>
                    <p className="text-sm text-slate-500">Offers and marketing campaigns applied at checkout</p>
                </div>
                <button onClick={openNew} className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold text-sm">
                    <Plus size={16} /> New Promotion
                </button>
            </div>

            {showForm && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800">{editingId ? 'Edit' : 'New'} Promotion</h3>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                    </div>
                    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className={labelCls}>Name</label>
                            <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Buy 3 Yogurt Get 1 Free" />
                        </div>
                        <div>
                            <label className={labelCls}>Type</label>
                            <select className={inputCls} value={form.promoType} onChange={(e) => set('promoType', e.target.value)}>
                                {PROMO_TYPES.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className={labelCls}>Branch</label>
                            <select className={inputCls} value={form.branchId} onChange={(e) => set('branchId', e.target.value)}>
                                <option value="">All branches</option>
                                {branches.map((b) => <option key={b.branch_id} value={b.branch_id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Scope</label>
                            <select className={inputCls} value={form.scopeType} onChange={(e) => set('scopeType', e.target.value)}>
                                <option value="ALL">All products</option>
                                <option value="PRODUCT">Specific product</option>
                                <option value="CATEGORY">Category</option>
                            </select>
                        </div>
                        {form.scopeType === 'PRODUCT' && (
                            <div>
                                <label className={labelCls}>Product</label>
                                <select className={inputCls} value={form.scopeRefId} onChange={(e) => set('scopeRefId', e.target.value)}>
                                    <option value="">Select product</option>
                                    {items.map((p) => <option key={p.product_id} value={p.product_id}>{p.name}</option>)}
                                </select>
                            </div>
                        )}
                        {form.scopeType === 'CATEGORY' && (
                            <div>
                                <label className={labelCls}>Category</label>
                                <select className={inputCls} value={form.scopeRefId} onChange={(e) => set('scopeRefId', e.target.value)}>
                                    <option value="">Select category</option>
                                    {categories.map((c) => <option key={c.category_id || c.id} value={c.category_id || c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        )}

                        {typeFields.showBuyQty && (
                            <div><label className={labelCls}>Buy Qty</label><input type="number" className={inputCls} value={form.buyQty} onChange={(e) => set('buyQty', e.target.value)} /></div>
                        )}
                        {typeFields.showBuyGet && (
                            <>
                                <div><label className={labelCls}>Buy Qty</label><input type="number" className={inputCls} value={form.buyQty} onChange={(e) => set('buyQty', e.target.value)} /></div>
                                <div><label className={labelCls}>Free Qty</label><input type="number" className={inputCls} value={form.getQty} onChange={(e) => set('getQty', e.target.value)} /></div>
                            </>
                        )}
                        {typeFields.showGetProduct && (
                            <div>
                                <label className={labelCls}>Free / Paired Product (optional)</label>
                                <select className={inputCls} value={form.getProductId} onChange={(e) => set('getProductId', e.target.value)}>
                                    <option value="">Same product</option>
                                    {items.map((p) => <option key={p.product_id} value={p.product_id}>{p.name}</option>)}
                                </select>
                            </div>
                        )}
                        {typeFields.showPercent && (
                            <div><label className={labelCls}>Discount %</label><input type="number" className={inputCls} value={form.discountPercent} onChange={(e) => set('discountPercent', e.target.value)} /></div>
                        )}
                        {typeFields.showAmount && (
                            <div><label className={labelCls}>Amount Off (LKR)</label><input type="number" className={inputCls} value={form.discountAmount} onChange={(e) => set('discountAmount', e.target.value)} /></div>
                        )}
                        {typeFields.showFixed && (
                            <div><label className={labelCls}>Fixed Price (LKR)</label><input type="number" className={inputCls} value={form.fixedPrice} onChange={(e) => set('fixedPrice', e.target.value)} /></div>
                        )}
                        {typeFields.showClearance && (
                            <div><label className={labelCls}>Within Days of Expiry</label><input type="number" className={inputCls} value={form.clearanceDays} onChange={(e) => set('clearanceDays', e.target.value)} /></div>
                        )}

                        <div><label className={labelCls}>Min Cart Amount</label><input type="number" className={inputCls} value={form.minCartAmount} onChange={(e) => set('minCartAmount', e.target.value)} /></div>
                        <div><label className={labelCls}>Starts</label><input type="datetime-local" className={inputCls} value={form.startAt} onChange={(e) => set('startAt', e.target.value)} /></div>
                        <div><label className={labelCls}>Ends</label><input type="datetime-local" className={inputCls} value={form.endAt} onChange={(e) => set('endAt', e.target.value)} /></div>
                        <div><label className={labelCls}>Priority</label><input type="number" className={inputCls} value={form.priority} onChange={(e) => set('priority', e.target.value)} /></div>
                        <div><label className={labelCls}>Max Uses (blank = unlimited)</label><input type="number" className={inputCls} value={form.maxUses} onChange={(e) => set('maxUses', e.target.value)} /></div>
                        <div className="flex items-end gap-4">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600"><input type="checkbox" checked={form.stackable} onChange={(e) => set('stackable', e.target.checked)} /> Stackable</label>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600"><input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Active</label>
                        </div>

                        <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-semibold text-sm">Cancel</button>
                            <button type="submit" className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm">{editingId ? 'Save' : 'Create'}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                            <th className="text-left p-3">Name</th>
                            <th className="text-left p-3">Type</th>
                            <th className="text-left p-3">Scope</th>
                            <th className="text-left p-3">Branch</th>
                            <th className="text-right p-3">Uses</th>
                            <th className="text-center p-3">Active</th>
                            <th className="text-center p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="7" className="p-8 text-center text-slate-400">Loading...</td></tr>
                        ) : rows.length === 0 ? (
                            <tr><td colSpan="7" className="p-8 text-center text-slate-400">No promotions yet</td></tr>
                        ) : rows.map((p) => (
                            <tr key={p.promotionId} className="hover:bg-slate-50">
                                <td className="p-3 font-semibold text-slate-800">{p.name}</td>
                                <td className="p-3 text-slate-600">{PROMO_TYPES.find((x) => x.value === p.promoType)?.label || p.promoType}</td>
                                <td className="p-3 text-slate-600">
                                    {p.scopeType === 'PRODUCT' ? productName(p.scopeRefId)
                                        : p.scopeType === 'CATEGORY' ? `Category ${p.scopeRefId}` : 'All products'}
                                </td>
                                <td className="p-3 text-slate-600">{branchName(p.branchId)}</td>
                                <td className="p-3 text-right font-mono text-slate-600">{p.usesCount ?? 0}{p.maxUses ? `/${p.maxUses}` : ''}</td>
                                <td className="p-3 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                        {p.isActive ? 'Active' : 'Off'}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center justify-center gap-1">
                                        <button onClick={() => toggle(p)} title="Toggle" className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"><Power size={15} /></button>
                                        <button onClick={() => openEdit(p)} title="Edit" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil size={15} /></button>
                                        <button onClick={() => remove(p)} title="Delete" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
