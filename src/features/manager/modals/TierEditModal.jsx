import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Info } from 'lucide-react';
import { getTierRules, updateTierRules } from '../services/managerService';
import useEscapeClose from '@/hooks/useEscapeClose';

export default function TierEditModal({ onClose, onUpdate }) {
    useEscapeClose(onClose);
    const [rules, setRules] = useState({ Silver: 0, Gold: 0, Platinum: 0 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        try {
            const data = await getTierRules();
            setRules({
                Silver: data.Silver || 10000,
                Gold: data.Gold || 50000,
                Platinum: data.Platinum || 100000
            });
        } catch (error) {
            console.error("Failed to load tier rules", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateTierRules(rules);
            onUpdate();
            onClose();
        } catch {
            alert("Failed to save rules");
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key !== 'Enter' || loading || saving) return;

            const tag = (document.activeElement?.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

            e.preventDefault();
            onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [loading, saving, onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Info size={20} className="text-brand-secondary" /> Tier Point Rules
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center py-8 text-brand"><Loader2 className="animate-spin" size={32} /></div>
                    ) : (
                        <form onSubmit={handleSave} className="space-y-4">
                            <p className="text-sm text-slate-500 mb-4">
                                Define the minimum total spend (LKR) required for customers to reach each loyalty tier. Changes apply immediately.
                            </p>

                            {['Silver', 'Gold', 'Platinum'].map((tier) => (
                                <div key={tier}>
                                    <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">{tier} Threshold</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-mono">LKR</span>
                                        <input
                                            type="number"
                                            value={rules[tier]}
                                            onChange={(e) => setRules({ ...rules, [tier]: parseFloat(e.target.value) })}
                                            className="w-full pl-12 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                                            placeholder="0.00"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 text-sm">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-brand text-white font-bold rounded-lg hover:bg-brand-hover text-sm flex justify-center items-center gap-2 shadow-lg shadow-brand/20">
                                    {saving && <Loader2 size={16} className="animate-spin" />} Save Changes
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
