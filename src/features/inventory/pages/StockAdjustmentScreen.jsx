import React, { useState, useEffect } from 'react';
import storeService from '@/features/inventory/services/storeService';
import { useEnterKeyNavigation } from '@/hooks/useEnterKeyNavigation';
import Pagination from '@/components/common/Pagination';

const StockAdjustmentScreen = ({
    adjustmentForm,
    setAdjustmentForm,
    adjustments: initialAdjustments,
    setAdjustments,
    items,
    batches
}) => {
    const [adjustments, setLocalAdjustments] = useState(initialAdjustments || []);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const handleKeyDown = useEnterKeyNavigation();

    useEffect(() => {
        const loadAdjustments = async () => {
            try {
                const adjustmentData = await storeService.getAdjustments();
                setLocalAdjustments(adjustmentData);
                if (setAdjustments) setAdjustments(adjustmentData);
            } catch (err) {
                console.error('Error loading adjustments:', err);
            }
        };
        loadAdjustments();
    }, []);

    const handleAddAdjustment = async () => {
        if (adjustmentForm.itemId && adjustmentForm.currentQty && adjustmentForm.physicalQty) {
            setLoading(true);
            try {
                const item = items.find(i => i.product_id === parseInt(adjustmentForm.itemId));
                const batch = batches.find(b => b.batch_id === parseInt(adjustmentForm.batchId));

                const payload = {
                    product_id: parseInt(adjustmentForm.itemId),
                    batch_id: adjustmentForm.batchId ? parseInt(adjustmentForm.batchId) : null,
                    adjustment_type: adjustmentForm.adjustmentType,
                    quantity_change: parseInt(adjustmentForm.physicalQty) - parseInt(adjustmentForm.currentQty),
                    reason_code: adjustmentForm.reason,
                    notes: `Approved by ${adjustmentForm.approvedBy}`,
                    approved_by: adjustmentForm.approvedBy
                };

                const createdAdjustment = await storeService.createAdjustment(payload);

                const newAdj = {
                    ...createdAdjustment,
                    itemName: item?.name || '',
                    batchNumber: batch?.batch_code || '',
                    previousQty: parseInt(adjustmentForm.currentQty),
                    currentQty: parseInt(adjustmentForm.physicalQty)
                };

                const updatedAdjustments = [...adjustments, newAdj];
                setLocalAdjustments(updatedAdjustments);
                if (setAdjustments) setAdjustments(updatedAdjustments);

                setAdjustmentForm({ itemId: '', batchId: '', currentQty: '', physicalQty: '', adjustmentType: 'Increase', reason: 'Audit', approvedBy: '' });
            } catch (err) {
                console.error('Error creating adjustment:', err);
                alert('Failed to create adjustment');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-500 drop-shadow-sm">Stock Adjustment</h2>
                <p className="text-gray-600 mt-1">Fix stock mismatches between system and physical count</p>
            </div>

            <form className="bg-white rounded-lg border border-gray-200 p-6" onKeyDown={handleKeyDown}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Stock Adjustment</h3>
                <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Item</label>
                        <select value={adjustmentForm.itemId} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, itemId: e.target.value })} className="w-full">
                            <option value="">Select Item</option>
                            {items.map((item) => <option key={item.product_id} value={item.product_id}>{item.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Batch</label>
                        <select value={adjustmentForm.batchId} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, batchId: e.target.value })} className="w-full">
                            <option value="">Select Batch</option>
                            {batches.filter(b => !adjustmentForm.itemId || b.product_id === parseInt(adjustmentForm.itemId)).map((batch) => <option key={batch.batch_id} value={batch.batch_id}>{batch.batch_code}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current System Qty</label>
                        <input value={adjustmentForm.currentQty} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, currentQty: e.target.value })} type="number" placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Physical Count Qty</label>
                        <input value={adjustmentForm.physicalQty} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, physicalQty: e.target.value })} type="number" placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Type</label>
                        <select value={adjustmentForm.adjustmentType} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, adjustmentType: e.target.value })} className="w-full">
                            <option value="Increase">Increase</option>
                            <option value="Decrease">Decrease</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                        <select value={adjustmentForm.reason} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })} className="w-full">
                            <option value="Damage">Damage</option>
                            <option value="Loss">Loss</option>
                            <option value="Audit">Audit</option>
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Approved By</label>
                        <input value={adjustmentForm.approvedBy} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, approvedBy: e.target.value })} type="text" placeholder="Enter name" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                </div>
                <button type="button" onClick={handleAddAdjustment} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">{loading ? 'Creating...' : 'Add Adjustment'}</button>
            </form>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Batch</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Previous Qty</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Current Qty</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Approved By</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {adjustments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((adj) => (
                            <tr key={adj.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{adj.itemName}</td>
                                <td className="px-6 py-4 text-sm font-mono text-gray-600">{adj.batchNumber}</td>
                                <td className="px-6 py-4 text-center text-sm text-gray-600">{adj.previousQty}</td>
                                <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">{adj.currentQty}</td>
                                <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded text-xs font-medium ${adj.adjustmentType === 'Increase' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{adj.adjustmentType}</span></td>
                                <td className="px-6 py-4 text-sm text-gray-600">{adj.reason}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{adj.approvedBy}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{adj.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(adjustments.length / itemsPerPage)}
                    onPageChange={setCurrentPage}
                    totalItems={adjustments.length}
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                />
            </div>
        </div>
    );
};

export default StockAdjustmentScreen;
