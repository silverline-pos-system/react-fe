import React, { useState, useEffect } from 'react';
import { getStatusColor } from '@/utils/helpers';
import storeService from '@/features/inventory/services/storeService';

const TransferApprovalScreen = ({ stockTransfers: initialTransfers, branches }) => {
    const [stockTransfers, setStockTransfers] = useState(initialTransfers || []);

    async function loadPendingTransfers() {
        try {
            const transfers = await storeService.getPendingTransfers();
            setStockTransfers(transfers);
        } catch (err) {
            console.error('Error loading pending transfers:', err);
        }
    }

    useEffect(() => {
        loadPendingTransfers();
    }, []);

    const handleApprove = async (transferId) => {
        try {
            await storeService.approveTransfer(transferId);
            await loadPendingTransfers();
            alert('Transfer approved successfully');
        } catch (err) {
            console.error('Error approving transfer:', err);
            alert('Failed to approve transfer');
        }
    };

    const handleReject = async (transferId) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        try {
            await storeService.rejectTransfer(transferId, reason);
            await loadPendingTransfers();
            alert('Transfer rejected');
        } catch (err) {
            console.error('Error rejecting transfer:', err);
            alert('Failed to reject transfer');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-500 drop-shadow-sm">Transfer Approval</h2>
                <p className="text-gray-600 mt-1">Review and approve stock transfers</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Transfer ID</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">From</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">To</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Items</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {stockTransfers.map((transfer) => {
                            const fromBranch = branches?.find(b => b.branch_id === transfer.fromBranch)?.name || 'Unknown';
                            const toBranch = branches?.find(b => b.branch_id === transfer.toBranch)?.name || 'Unknown';
                            return (
                                <tr key={transfer.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{transfer.id}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{fromBranch}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{toBranch}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{transfer.product_name} x {transfer.quantity}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{transfer.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transfer.status)}`}>
                                            {transfer.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {transfer.status === 'Pending' && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleApprove(transfer.transfer_id || transfer.id)} className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                                                    Approve
                                                </button>
                                                <button onClick={() => handleReject(transfer.transfer_id || transfer.id)} className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                        {transfer.status !== 'Pending' && (
                                            <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200">
                                                View Details
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransferApprovalScreen;
