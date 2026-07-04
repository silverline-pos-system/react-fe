import React from 'react';

const StockAgingScreen = ({ batches }) => {
    const today = new Date('2026-01-11');
    const getAgingBucket = (purchaseDate) => {
        const daysInStock = Math.floor((today - new Date(purchaseDate)) / (1000 * 60 * 60 * 24));
        if (daysInStock <= 30) return '0-30 days';
        if (daysInStock <= 60) return '31-60 days';
        if (daysInStock <= 90) return '61-90 days';
        return '90+ days';
    };

    const agingData = batches.map(batch => ({
        ...batch,
        daysInStock: Math.floor((today - new Date(batch.manufacturing_date)) / (1000 * 60 * 60 * 24)),
        agingBucket: getAgingBucket(batch.manufacturing_date)
    }));

    const buckets = { '0-30 days': 0, '31-60 days': 0, '61-90 days': 0, '90+ days': 0 };
    agingData.forEach(item => buckets[item.agingBucket]++);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-500 drop-shadow-sm">Stock Aging Report</h2>
                <p className="text-gray-600 mt-1">Identify dead stock and optimize purchasing decisions</p>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-semibold">0-30 Days</p>
                    <p className="text-2xl font-bold text-green-700 mt-2">{buckets['0-30 days']}</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-600 font-semibold">31-60 Days</p>
                    <p className="text-2xl font-bold text-yellow-700 mt-2">{buckets['31-60 days']}</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm text-orange-600 font-semibold">61-90 Days</p>
                    <p className="text-2xl font-bold text-orange-700 mt-2">{buckets['61-90 days']}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-600 font-semibold">90+ Days</p>
                    <p className="text-2xl font-bold text-red-700 mt-2">{buckets['90+ days']}</p>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Batch Code</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Mfg Date</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Expiry Date</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Days in Stock</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Aging Bucket</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {agingData.map((item) => {
                            let bucketColor = 'bg-green-100 text-green-700';
                            if (item.agingBucket === '31-60 days') bucketColor = 'bg-yellow-100 text-yellow-700';
                            if (item.agingBucket === '61-90 days') bucketColor = 'bg-orange-100 text-orange-700';
                            if (item.agingBucket === '90+ days') bucketColor = 'bg-red-100 text-red-700';
                            return (
                                <tr key={item.batch_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{item.batch_code}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{item.manufacturing_date}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{item.expiry_date}</td>
                                    <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">{item.daysInStock}</td>
                                    <td className="px-6 py-4 text-center text-sm font-mono">{item.qty}</td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${bucketColor}`}>{item.agingBucket}</span></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockAgingScreen;
