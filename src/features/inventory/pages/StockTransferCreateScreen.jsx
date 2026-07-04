import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, Clock } from 'lucide-react';
import storeService from '@/features/inventory/services/storeService';
import Pagination from '@/components/common/Pagination';

const StockTransferCreateScreen = ({
    transferForm,
    setTransferForm,
    transfers: initialTransfers,
    setTransfers,
    branches,
    items,
    batches
}) => {
    const [transfers, setLocalTransfers] = useState(initialTransfers || []);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const [historyPage, setHistoryPage] = useState(1);
    const [historyPerPage, setHistoryPerPage] = useState(5);

    useEffect(() => {
        const loadTransfers = async () => {
            try {
                const transferData = await storeService.getTransfers();
                setLocalTransfers(transferData);
                if (setTransfers) setTransfers(transferData);
            } catch (err) {
                console.error('Error loading transfers:', err);
            }
        };
        loadTransfers();
    }, []);

    const handleRefresh = async () => {
        try {
            const transferData = await storeService.getTransfers();
            setLocalTransfers(transferData);
            if (setTransfers) setTransfers(transferData);
        } catch (err) {
            console.error('Error refreshing transfers:', err);
        }
    };

    const handleCreateTransfer = async (submit = false) => {
        if (transferForm.fromBranch && transferForm.toBranch && transferForm.product_id && transferForm.quantity) {
            setLoading(true);
            try {
                const item = items.find(i => i.product_id === parseInt(transferForm.product_id));
                const batch = batches.find(b => b.batch_id === parseInt(transferForm.batch_id));

                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const userId = user.userId || user.id || 1;

                const payload = {
                    from_branch: transferForm.fromBranch,
                    to_branch: transferForm.toBranch,
                    product_id: parseInt(transferForm.product_id),
                    batch_id: transferForm.batch_id ? parseInt(transferForm.batch_id) : null,
                    quantity: parseInt(transferForm.quantity),
                    transfer_date: transferForm.transferDate || new Date().toISOString().split('T')[0],
                    remarks: transferForm.remarks,
                    transfer_status: submit ? 'PENDING' : 'DRAFT',
                    requested_by: userId
                };

                const createdTransfer = await storeService.createTransfer(payload);

                const newTransfer = {
                    ...createdTransfer,
                    product_name: item?.name || '',
                    batch_code: batch?.batch_code || '',
                    requestedBy: 'Current User',
                    requested_time: new Date().toISOString()
                };

                const updatedTransfers = [...transfers, newTransfer];
                setLocalTransfers(updatedTransfers);
                if (setTransfers) setTransfers(updatedTransfers);

                setTransferForm({ fromBranch: '', toBranch: '', product_id: '', quantity: '', batch_id: '', transferDate: '', remarks: '', status: 'Draft' });
                setShowCreateForm(false);

                if (submit) {
                    alert('Transfer request submitted successfully');
                } else {
                    alert('Transfer saved as draft');
                }
            } catch (err) {
                console.error('Error creating transfer:', err);
                alert('Failed to create transfer');
            } finally {
                setLoading(false);
            }
        } else {
            alert('Please fill all required fields');
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    const getBranchName = (branchId) => {
        const branch = branches.find(b => b.branch_id === parseInt(branchId));
        return branch?.name || branchId;
    };

    const pendingRequests = transfers.filter(t => t.transfer_status === 'DRAFT' || t.transfer_status === 'PENDING');
    const completedRequests = transfers.filter(t => t.transfer_status === 'APPROVED' || t.transfer_status === 'REJECTED');
    const paginatedCompletedRequests = completedRequests.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Transfer Requests</h2>
                </div>
                <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                    <RefreshCw size={16} />
                    Refresh Data
                </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">Create New Transfer</h3>
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            {showCreateForm ? 'Cancel' : '+ New Transfer'}
                        </button>
                    </div>
                </div>

                {showCreateForm && (
                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">From Branch *</label>
                                <select
                                    value={transferForm.fromBranch}
                                    onChange={(e) => setTransferForm({ ...transferForm, fromBranch: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Source Branch</option>
                                    {branches.map((b) => <option key={b.branch_id} value={b.branch_id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">To Branch *</label>
                                <select
                                    value={transferForm.toBranch}
                                    onChange={(e) => setTransferForm({ ...transferForm, toBranch: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Destination Branch</option>
                                    {branches.filter(b => b.branch_id !== parseInt(transferForm.fromBranch)).map((b) => <option key={b.branch_id} value={b.branch_id}>{b.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Product *</label>
                                <select
                                    value={transferForm.product_id}
                                    onChange={(e) => setTransferForm({ ...transferForm, product_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Product</option>
                                    {items.map((item) => <option key={item.product_id} value={item.product_id}>{item.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Batch</label>
                                <select
                                    value={transferForm.batch_id}
                                    onChange={(e) => setTransferForm({ ...transferForm, batch_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Batch (Optional)</option>
                                    {batches.filter(b => !transferForm.product_id || b.product_id === parseInt(transferForm.product_id)).map((batch) => <option key={batch.batch_id} value={batch.batch_id}>{batch.batch_code}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                                <input
                                    value={transferForm.quantity}
                                    onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                                    type="number"
                                    placeholder="Enter quantity"
                                    min="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Date</label>
                                <input
                                    value={transferForm.transferDate}
                                    onChange={(e) => setTransferForm({ ...transferForm, transferDate: e.target.value })}
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                                <input
                                    value={transferForm.remarks}
                                    onChange={(e) => setTransferForm({ ...transferForm, remarks: e.target.value })}
                                    type="text"
                                    placeholder="Enter remarks (optional)"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => handleCreateTransfer(false)}
                                disabled={loading}
                                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {loading ? 'Saving...' : 'Save as Draft'}
                            </button>
                            <button
                                onClick={() => handleCreateTransfer(true)}
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {loading ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Pending Requests</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Reference</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">From → To</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Item</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Qty</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {pendingRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <Clock size={48} className="mb-3 opacity-50" />
                                            <p className="text-sm">No pending requests found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                pendingRequests.map((tr, index) => (
                                    <tr key={tr.transfer_id || index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">Transfer Out</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">#{tr.transfer_id || 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {getBranchName(tr.from_branch)} → {getBranchName(tr.to_branch)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{tr.product_name}</td>
                                        <td className="px-6 py-4 text-center text-sm font-mono font-semibold text-gray-900">{tr.quantity}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(tr.requested_time || tr.transfer_date)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${tr.transfer_status === 'DRAFT'
                                                    ? 'bg-gray-100 text-gray-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {tr.transfer_status || 'Draft'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center gap-2">
                    <Clock size={20} className="text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Request History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Reference</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">From → To</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Item</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Qty</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Requested Time</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Processed Time</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {completedRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <CheckCircle size={48} className="mb-3 opacity-50" />
                                            <p className="text-sm">No completed requests found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedCompletedRequests.map((tr, index) => (
                                    <tr key={tr.transfer_id || index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">Transfer Out</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">#{tr.transfer_id || 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {getBranchName(tr.from_branch)} → {getBranchName(tr.to_branch)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{tr.product_name}</td>
                                        <td className="px-6 py-4 text-center text-sm font-mono font-semibold text-gray-900">{tr.quantity}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(tr.requested_time || tr.transfer_date)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(tr.approved_time || tr.transfer_date)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${tr.transfer_status === 'APPROVED'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {tr.transfer_status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {completedRequests.length > 0 && (
                    <Pagination
                        currentPage={historyPage}
                        totalPages={Math.ceil(completedRequests.length / historyPerPage)}
                        onPageChange={setHistoryPage}
                        totalItems={completedRequests.length}
                        itemsPerPage={historyPerPage}
                        setItemsPerPage={setItemsPerPage}
                    />
                )}
            </div>
        </div>
    );
};

export default StockTransferCreateScreen;
