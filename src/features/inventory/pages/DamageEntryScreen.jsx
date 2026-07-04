import React, { useState, useEffect } from 'react';
import storeService from '@/features/inventory/services/storeService';
import { useEnterKeyNavigation } from '@/hooks/useEnterKeyNavigation';
import Pagination from '@/components/common/Pagination';

const DamageEntryScreen = ({
    damageForm,
    setDamageForm,
    damageEntries: initialDamageEntries,
    setDamageEntries,
    items,
    batches
}) => {
    const [damageEntries, setLocalDamageEntries] = useState(initialDamageEntries || []);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const handleKeyDown = useEnterKeyNavigation();

    useEffect(() => {
        const loadDamages = async () => {
            try {
                const damageData = await storeService.getDamages();
                setLocalDamageEntries(damageData);
                if (setDamageEntries) setDamageEntries(damageData);
            } catch (err) {
                console.error('Error loading damages:', err);
            }
        };
        loadDamages();
    }, []);

    const handleAddDamage = async () => {
        if (damageForm.product_id && damageForm.quantity && damageForm.reason) {
            setLoading(true);
            try {
                const item = items.find(i => i.product_id === parseInt(damageForm.product_id));
                const batch = batches.find(b => b.batch_id === parseInt(damageForm.batch_id));

                const payload = {
                    product_id: parseInt(damageForm.product_id),
                    batch_id: damageForm.batch_id ? parseInt(damageForm.batch_id) : null,
                    damage_quantity: parseInt(damageForm.quantity),
                    damage_type: damageForm.reason,
                    notes: damageForm.note,
                    damage_date: damageForm.date || new Date().toISOString().split('T')[0]
                };

                const createdDamage = await storeService.createDamage(payload);

                const newDmg = {
                    ...createdDamage,
                    product_name: item?.name || '',
                    batch_code: batch?.batch_code || ''
                };

                const updatedDamages = [...damageEntries, newDmg];
                setLocalDamageEntries(updatedDamages);
                if (setDamageEntries) setDamageEntries(updatedDamages);

                setDamageForm({ product_id: '', batch_id: '', quantity: '', reason: '', date: '', note: '' });
            } catch (err) {
                console.error('Error creating damage entry:', err);
                alert('Failed to create damage entry');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-500 drop-shadow-sm">Damage / Wastage Entry</h2>
                <p className="text-gray-600 mt-1">Log damaged or wasted stock</p>
            </div>

            <form className="bg-white rounded-lg border border-gray-200 p-6" onKeyDown={handleKeyDown}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Damage Entry</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                        <select value={damageForm.product_id} onChange={(e) => setDamageForm({ ...damageForm, product_id: e.target.value })} className="w-full">
                            <option value="">Select Product</option>
                            {items.map((item) => <option key={item.product_id} value={item.product_id}>{item.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Batch</label>
                        <select value={damageForm.batch_id} onChange={(e) => setDamageForm({ ...damageForm, batch_id: e.target.value })} className="w-full">
                            <option value="">Select Batch</option>
                            {batches.filter(b => !damageForm.product_id || b.product_id === parseInt(damageForm.product_id)).map((batch) => <option key={batch.batch_id} value={batch.batch_id}>{batch.batch_code}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                        <input value={damageForm.quantity} onChange={(e) => setDamageForm({ ...damageForm, quantity: e.target.value })} type="number" placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                        <select value={damageForm.reason} onChange={(e) => setDamageForm({ ...damageForm, reason: e.target.value })} className="w-full">
                            <option value="">Select Reason</option>
                            <option value="Breakage">Breakage</option>
                            <option value="Expiry">Expiry</option>
                            <option value="Spillage">Spillage</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                        <input value={damageForm.date} onChange={(e) => setDamageForm({ ...damageForm, date: e.target.value })} type="date" className="w-full" />
                    </div>
                    <div></div>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Supporting Note</label>
                    <textarea value={damageForm.note} onChange={(e) => setDamageForm({ ...damageForm, note: e.target.value })} placeholder="Enter details..." className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows="2"></textarea>
                </div>
                <button type="button" onClick={handleAddDamage} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">{loading ? 'Creating...' : 'Log Damage Entry'}</button>
            </form>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Batch</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Note</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {damageEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((dmg) => (
                            <tr key={dmg.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{dmg.product_name}</td>
                                <td className="px-6 py-4 text-sm font-mono text-gray-600">{dmg.batch_code}</td>
                                <td className="px-6 py-4 text-center text-sm font-semibold text-red-600">{dmg.quantity}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{dmg.reason}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{dmg.date}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{dmg.note}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(damageEntries.length / itemsPerPage)}
                    onPageChange={setCurrentPage}
                    totalItems={damageEntries.length}
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                />
            </div>
        </div>
    );
};

export default DamageEntryScreen;
