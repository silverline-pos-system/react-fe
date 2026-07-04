import React, { useState, useEffect } from 'react';
import { Printer, AlertTriangle, Smartphone, Tag, MapPin, History, FileText, ArrowLeft } from 'lucide-react';
import inventoryService from '@/features/inventory/services/inventoryService';

const ITEM_DETAIL_TABS = ['summary', 'prices-batches', 'sales'];

const ItemDetailScreen = ({
    items,
    itemDetails,
    selectedItemId,
    setSelectedItemId,
    setActiveScreen,
    selectedItemTab,
    setSelectedItemTab,
    batches,
    categories,
    brands,
    subCategories,
    suppliers = [],
    branches = []
}) => {
    const normalizeId = (value) => (value == null ? '' : String(value));
    const getProductId = (record) => record?.product_id ?? record?.productId ?? record?.id;
    const getBatchQty = (batch) => {
        const qty = Number(batch?.qty ?? batch?.quantity ?? batch?.stock_quantity ?? 0);
        return Number.isNaN(qty) ? 0 : qty;
    };
    const toNumber = (value, fallback = 0) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };
    const formatCurrency = (value) => toNumber(value).toFixed(2);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

            const currentIndex = ITEM_DETAIL_TABS.indexOf(selectedItemTab);
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % ITEM_DETAIL_TABS.length;
                setSelectedItemTab(ITEM_DETAIL_TABS[nextIndex]);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const prevIndex = (currentIndex - 1 + ITEM_DETAIL_TABS.length) % ITEM_DETAIL_TABS.length;
                setSelectedItemTab(ITEM_DETAIL_TABS[prevIndex]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedItemTab, setSelectedItemTab]);

    const itemId = selectedItemId ?? getProductId(items[0]);
    const item = items.find((i) => normalizeId(getProductId(i)) === normalizeId(itemId));
    const detail = itemDetails?.[itemId] || {};
    const productBatches = batches.filter((b) => normalizeId(b.product_id ?? b.productId) === normalizeId(itemId));
    const productSuppliers = item
        ? suppliers.filter((s) => normalizeId(s.supplier_id ?? s.supplierId) === normalizeId(item.supplier_id ?? item.supplierId))
        : [];

    const [salesData, setSalesData] = useState([]);
    const [salesLoading, setSalesLoading] = useState(false);
    const [selectedDetailBranchId, setSelectedDetailBranchId] = useState(localStorage.getItem('selectedBranchId') || '');
    const [salesPage, setSalesPage] = useState(1);
    const salesPerPage = 10;

    const branchFilteredBatches = selectedDetailBranchId
        ? productBatches.filter((b) => normalizeId(b.branch_id ?? b.branchId) === normalizeId(selectedDetailBranchId))
        : productBatches;

    const branchStockSummary = productBatches.reduce((acc, batch) => {
        const bId = normalizeId(batch.branch_id ?? batch.branchId);
        const branchName = branches.find((br) => normalizeId(br.branch_id) === bId)?.name || `Branch ${bId || '-'}`;
        if (!acc[bId]) {
            acc[bId] = { branchId: bId, branchName, qty: 0 };
        }
        acc[bId].qty += getBatchQty(batch);
        return acc;
    }, {});

    useEffect(() => {
        if (!itemId) {
            setSalesData([]);
            return;
        }
        let cancelled = false;
        let interval;
        const fetchSales = async () => {
            setSalesLoading(true);
            try {
                const sales = await inventoryService.getProductSales(itemId, selectedDetailBranchId || null);
                if (!cancelled) {
                    const dateMap = {};
                    (Array.isArray(sales) ? sales : []).forEach(sale => {
                        const date = sale.date || sale.saleDate || sale.created_at?.split('T')[0] || sale.createdAt?.split('T')[0] || 'Unknown';
                        const qty = Number(sale.quantity || sale.qty || sale.totalQuantity || 0);
                        const revenue = Number(sale.revenue || sale.total || sale.netTotal || sale.lineTotal || 0);
                        if (!dateMap[date]) dateMap[date] = { date, quantity: 0, revenue: 0 };
                        dateMap[date].quantity += qty;
                        dateMap[date].revenue += revenue;
                    });
                    const aggregated = Object.values(dateMap).sort((a, b) => b.date.localeCompare(a.date));
                    setSalesData(aggregated);
                }
            } catch (err) {
                if (!cancelled) setSalesData([]);
                if (interval) clearInterval(interval);
            } finally {
                if (!cancelled) setSalesLoading(false);
            }
        };
        fetchSales();
        interval = setInterval(fetchSales, 30000);
        return () => { cancelled = true; clearInterval(interval); };
    }, [itemId, selectedDetailBranchId]);

    useEffect(() => {
        setSalesPage(1);
    }, [selectedDetailBranchId, itemId]);

    const categoryName = categories?.find(c => c.category_id === item?.category_id)?.name || item?.category_id || 'N/A';
    const subCategoryName = subCategories?.find(s => s.subcategory_id === item?.subcategory_id)?.name || item?.subcategory_id || 'N/A';
    const brandName = brands?.find(b => b.brand_id === item?.brand_id)?.name || item?.brand_id || 'N/A';

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');

        const batchRows = productBatches.map(batch => `
            <tr>
                <td>${batch.batch_code}</td>
                <td style="text-align: center">${getBatchQty(batch)}</td>
                <td>${batch.manufacturing_date}</td>
                <td>${batch.expiry_date}</td>
                <td>${batch.branch_id}</td>
            </tr>
        `).join('');

        const historyRows = (detail?.stockHistory || []).map(entry => `
            <tr>
                <td>${entry.date}</td>
                <td>${entry.type}</td>
                <td>${entry.reference}</td>
                <td style="text-align: center; color: ${entry.quantity > 0 ? 'green' : 'red'}">${entry.quantity > 0 ? '+' : ''}${entry.quantity}</td>
                <td>${entry.notes}</td>
            </tr>
        `).join('');

        const supplierRows = (detail?.supplierHistory || productSuppliers).map(supplier => `
            <tr>
                <td>${supplier.name}</td>
                <td>${supplier.lastPO || 'N/A'}</td>
                <td>${supplier.leadTime || 'N/A'}</td>
            </tr>
        `).join('');

        const salesRows = (salesData || []).map(sale => `
            <tr>
                <td>${sale.date}</td>
                <td style="text-align: center">${sale.quantity}</td>
                <td style="text-align: right">LKR ${formatCurrency(sale.revenue)}</td>
            </tr>
        `).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Item Report - ${item.name}</title>
                <style>
                    body { font-family: sans-serif; margin: 20px; color: #111827; }
                    .container { max-width: 900px; margin: 0 auto; }
                    h1 { margin-bottom: 5px; color: #1e3a8a; }
                    .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
                    
                    .section { margin-bottom: 30px; page-break-inside: avoid; }
                    .section-title { 
                        font-size: 16px; font-weight: bold; border-bottom: 2px solid #e5e7eb; 
                        padding-bottom: 8px; margin-bottom: 15px; color: #374151;
                    }
                    
                    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                    .card { border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px; }
                    .label { font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
                    .value { font-size: 15px; font-weight: 600; margin-top: 2px; }
                    
                    table { width: 100%; border-collapse: collapse; font-size: 13px; }
                    th { background: #f9fafb; padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #374151; }
                    td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
                    
                    .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; }
                    .badge-active { background: #dcfce7; color: #166534; }
                    .badge-inactive { background: #fee2e2; color: #991b1b; }
                    
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h1>${item.name}</h1>
                            <div class="subtitle">SKU: ${item.sku} &bull; Barcode: ${item.barcode}</div>
                        </div>
                        <div style="text-align: right;">
                             <span class="badge ${item.is_active ? 'badge-active' : 'badge-inactive'}">
                                ${item.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                            <div style="margin-top: 5px; font-size: 12px; color: #6b7280;">${new Date().toLocaleDateString()}</div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">Overview</div>
                        <div class="grid-2">
                            <div class="card">
                                <div class="label">Price Information</div>
                                <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                                    <div>
                                        <div class="label">Cost Price</div>
                                        <div class="value">LKR ${formatCurrency(item.cost_price)}</div>
                                    </div>
                                    <div>
                                        <div class="label">Selling Price</div>
                                        <div class="value">LKR ${formatCurrency(item.selling_price)}</div>
                                    </div>
                                    <div>
                                        <div class="label">MRP</div>
                                        <div class="value">LKR ${formatCurrency(item.mrp)}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="card">
                                <div class="label">Stock Information</div>
                                <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                                    <div>
                                        <div class="label">Current Stock</div>
                                        <div class="value" style="font-size: 18px;">${item.quantity || 0}</div>
                                    </div>
                                    <div>
                                        <div class="label">Reorder Level</div>
                                        <div class="value">${item.reorder_level}</div>
                                    </div>
                                    <div>
                                        <div class="label">Category</div>
                                        <div class="value" style="font-size: 13px;">${categoryName}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    ${batchRows ? `
                    <div class="section">
                        <div class="section-title">Active Batches</div>
                        <table>
                            <thead><tr><th>Batch Code</th><th style="text-align: center">Qty</th><th>Mfg Date</th><th>Expiry Date</th><th>Branch</th></tr></thead>
                            <tbody>${batchRows}</tbody>
                        </table>
                    </div>` : ''}

                    ${historyRows ? `
                    <div class="section">
                        <div class="section-title">Stock History (Last 10 Actions)</div>
                        <table>
                            <thead><tr><th>Date</th><th>Type</th><th>Reference</th><th style="text-align: center">Qty Change</th><th>Notes</th></tr></thead>
                            <tbody>${historyRows}</tbody>
                        </table>
                    </div>` : ''}

                    ${supplierRows ? `
                    <div class="section">
                        <div class="section-title">Supplier Information</div>
                        <table>
                            <thead><tr><th>Supplier</th><th>Last PO</th><th>Lead Time</th></tr></thead>
                            <tbody>${supplierRows}</tbody>
                        </table>
                    </div>` : ''}
                    
                    ${salesRows ? `
                    <div class="section">
                        <div class="section-title">Recent Sales</div>
                        <table>
                            <thead><tr><th>Date</th><th style="text-align: center">Qty</th><th style="text-align: right">Revenue</th></tr></thead>
                            <tbody>${salesRows}</tbody>
                        </table>
                    </div>` : ''}

                </div>
                <script>
                    setTimeout(() => {
                        window.print();
                        window.close();
                    }, 500);
                </script>
            </body>
            </html>
        `;
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    if (!item) {
        return (
            <div className="p-6">
                <p className="text-gray-900 font-semibold mb-4">Item not found or no item selected</p>
                <button onClick={() => setActiveScreen('item-list')} className="text-blue-600 hover:text-blue-700">
                    ← Back to List
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <button onClick={() => { setSelectedItemId(null); setActiveScreen('item-list'); }} className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    ← Back to List
                </button>
                <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
                <button onClick={handlePrint} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2" title="Print Item Details">
                    <Printer size={20} />
                    <span className="text-sm">Print</span>
                </button>
            </div>

            <div className="flex gap-2 border-b border-gray-200">
                {['summary', 'prices-batches', 'sales'].map((tab) => (
                    <button key={tab} onClick={() => setSelectedItemTab(tab)} className={`px-4 py-3 font-medium border-b-2 ${selectedItemTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                        {tab === 'summary' && 'Summary'}
                        {tab === 'prices-batches' && 'Prices, Batches & Suppliers'}
                        {tab === 'sales' && 'Sales'}
                    </button>
                ))}
            </div>

            {selectedItemTab === 'summary' && (
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Information</h3>
                        <div className="space-y-3">
                            <div><label className="text-sm text-gray-600">Product ID:</label><p className="font-mono">{item.product_id}</p></div>
                            <div><label className="text-sm text-gray-600">Barcode:</label><p className="font-mono">{item.barcode}</p></div>
                            <div><label className="text-sm text-gray-600">SKU:</label><p className="font-mono">{item.sku}</p></div>
                            <div><label className="text-sm text-gray-600">Category:</label><p>{categoryName}</p></div>
                            <div><label className="text-sm text-gray-600">Subcategory:</label><p>{subCategoryName}</p></div>
                            <div><label className="text-sm text-gray-600">Brand:</label><p>{brandName}</p></div>
                            <div><label className="text-sm text-gray-600">Description:</label><p>{item.description}</p></div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Stock</h3>
                        <div className="space-y-3">
                            <div><label className="text-sm text-gray-600">Cost Price:</label><p className="text-lg font-bold">LKR {formatCurrency(item.cost_price)}</p></div>
                            <div><label className="text-sm text-gray-600">Selling Price:</label><p className="text-lg font-bold">LKR {formatCurrency(item.selling_price)}</p></div>
                            <div><label className="text-sm text-gray-600">MRP:</label><p className="text-lg font-bold">LKR {formatCurrency(item.mrp)}</p></div>
                            <div><label className="text-sm text-gray-600">Reorder Level:</label><p className="text-lg font-bold">{toNumber(item.reorder_level)} units</p></div>
                            <div><label className="text-sm text-gray-600">Status:</label><p><span className={`px-2 py-1 text-xs font-medium rounded-full ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.is_active ? 'Active' : 'Inactive'}</span></p></div>
                        </div>
                    </div>
                </div>
            )}

            {selectedItemTab === 'prices-batches' && (() => {
                const batchPrices = branchFilteredBatches.map(b => ({
                    selling: b.selling_price != null ? Number(b.selling_price) : Number(item.selling_price),
                    cost: b.cost_price != null ? Number(b.cost_price) : Number(item.cost_price),
                    mrp: b.mrp != null ? Number(b.mrp) : Number(item.mrp),
                    batch_code: b.batch_code
                }));
                const uniqueSellingPrices = [...new Set(batchPrices.map(p => p.selling))];
                const uniqueCostPrices = [...new Set(batchPrices.map(p => p.cost))];
                const hasMultiplePrices = uniqueSellingPrices.length > 1 || uniqueCostPrices.length > 1;

                return (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Branch Filter</label>
                                    <select
                                        value={selectedDetailBranchId}
                                        onChange={(e) => setSelectedDetailBranchId(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    >
                                        <option value="">All Branches</option>
                                        {branches.map((branch) => (
                                            <option key={branch.branch_id} value={branch.branch_id}>{branch.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Branch-wise Quantity</label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.values(branchStockSummary).length === 0 && (
                                            <span className="text-xs text-gray-500">No branch stock data available</span>
                                        )}
                                        {Object.values(branchStockSummary).map((row) => (
                                            <span key={row.branchId} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-100">
                                                {row.branchName}: {row.qty}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {hasMultiplePrices && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
                                <span className="text-amber-500 text-lg mt-0.5">⚠</span>
                                <div>
                                    <p className="text-sm font-semibold text-amber-800">Multiple Prices Detected</p>
                                    <p className="text-xs text-amber-700 mt-0.5">This product has different prices across batches. Check the table below for batch-specific pricing details.</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Batch-wise Pricing & Stock</h3>
                                    <p className="text-sm text-gray-500 mt-1">{branchFilteredBatches.length} batch{branchFilteredBatches.length !== 1 ? 'es' : ''} for this product</p>
                                </div>
                                {hasMultiplePrices && (
                                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">Multiple Prices</span>
                                )}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Batch</th>
                                            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Qty</th>
                                            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Cost Price</th>
                                            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Selling Price</th>
                                            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase">MRP</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Expiry</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Branch</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {branchFilteredBatches.length > 0 ? (
                                            branchFilteredBatches.map((batch) => {
                                                const batchCost = batch.cost_price != null ? Number(batch.cost_price) : null;
                                                const batchSelling = batch.selling_price != null ? Number(batch.selling_price) : null;
                                                const batchMrp = batch.mrp != null ? Number(batch.mrp) : null;

                                                const costDiffers = batchCost !== null && batchCost !== Number(item.cost_price);
                                                const sellingDiffers = batchSelling !== null && batchSelling !== Number(item.selling_price);
                                                const mrpDiffers = batchMrp !== null && batchMrp !== Number(item.mrp);

                                                return (
                                                    <tr key={batch.batch_id} className="hover:bg-gray-50">
                                                        <td className="px-5 py-4 text-sm font-mono font-medium text-gray-900">{batch.batch_code}</td>
                                                        <td className="px-5 py-4 text-center text-sm font-medium">{getBatchQty(batch)}</td>
                                                        <td className={`px-5 py-4 text-right text-sm font-mono ${costDiffers ? 'text-amber-700 font-bold bg-amber-50' : ''}`}>
                                                            LKR {formatCurrency(batchCost ?? item.cost_price)}
                                                            {costDiffers && <span className="block text-[10px] text-amber-500">differs</span>}
                                                        </td>
                                                        <td className={`px-5 py-4 text-right text-sm font-mono ${sellingDiffers ? 'text-amber-700 font-bold bg-amber-50' : ''}`}>
                                                            LKR {formatCurrency(batchSelling ?? item.selling_price)}
                                                            {sellingDiffers && <span className="block text-[10px] text-amber-500">differs</span>}
                                                        </td>
                                                        <td className={`px-5 py-4 text-right text-sm font-mono ${mrpDiffers ? 'text-amber-700 font-bold bg-amber-50' : ''}`}>
                                                            LKR {formatCurrency(batchMrp ?? item.mrp)}
                                                            {mrpDiffers && <span className="block text-[10px] text-amber-500">differs</span>}
                                                        </td>
                                                        <td className="px-5 py-4 text-sm text-gray-600">{batch.expiry_date || '-'}</td>
                                                        <td className="px-5 py-4 text-sm text-gray-600">{branches.find((b) => normalizeId(b.branch_id) === normalizeId(batch.branch_id))?.name || batch.branch_id}</td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="px-5 py-10 text-center text-sm text-gray-500">No batches found for this product</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-lg font-semibold text-gray-900">Supplier Information</h3>
                                <p className="text-sm text-gray-500 mt-1">Suppliers linked to this product</p>
                            </div>
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Supplier</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Contact/Info</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {(detail?.supplierHistory || productSuppliers).length > 0 ? (
                                        (detail?.supplierHistory || productSuppliers).map((supplier, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{supplier.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{supplier.phone || supplier.email || 'N/A'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="2" className="px-6 py-8 text-center text-sm text-gray-500">No supplier data available</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })()}

            {selectedItemTab === 'sales' && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Sales History</h3>
                            <p className="text-sm text-gray-500 mt-1">Branch-based sales history (auto-refreshes every 30s)</p>
                        </div>
                        {salesData.length > 0 && (
                            <div className="flex gap-4 text-sm">
                                <span className="font-medium text-gray-600">Total Qty: <span className="text-gray-900 font-bold">{salesData.reduce((sum, s) => sum + s.quantity, 0)}</span></span>
                                <span className="font-medium text-gray-600">Total Revenue: <span className="text-green-600 font-bold">LKR {formatCurrency(salesData.reduce((sum, s) => sum + toNumber(s.revenue), 0))}</span></span>
                            </div>
                        )}
                    </div>
                    <div className="px-6 py-3 border-b border-gray-200 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Branch</label>
                                <select
                                    value={selectedDetailBranchId}
                                    onChange={(e) => setSelectedDetailBranchId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">All Branches</option>
                                    {branches.map((branch) => (
                                        <option key={branch.branch_id} value={branch.branch_id}>{branch.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Quantity Sold</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {salesLoading ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-sm text-gray-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            Loading sales data...
                                        </div>
                                    </td>
                                </tr>
                            ) : salesData.length > 0 ? (
                                salesData
                                    .slice((salesPage - 1) * salesPerPage, salesPage * salesPerPage)
                                    .map((sale, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm">{sale.date}</td>
                                        <td className="px-6 py-4 text-center text-sm font-mono">{sale.quantity}</td>
                                        <td className="px-6 py-4 text-right text-sm font-mono text-green-600">LKR {formatCurrency(sale.revenue)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-sm text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            <p className="font-medium">No sales recorded yet</p>
                                            <p className="text-xs text-gray-400">Sales data will appear here when this product is sold via POS</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {salesData.length > 0 && (
                        <div className="px-6 py-3 border-t border-gray-200 bg-white">
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-600">Showing {(salesPage - 1) * salesPerPage + 1}-{Math.min(salesPage * salesPerPage, salesData.length)} of {salesData.length}</div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSalesPage((p) => Math.max(1, p - 1))}
                                        disabled={salesPage === 1}
                                        className="px-3 py-1 text-xs border border-gray-300 rounded disabled:opacity-50"
                                    >
                                        Prev
                                    </button>
                                    <span className="text-xs font-semibold">Page {salesPage}</span>
                                    <button
                                        type="button"
                                        onClick={() => setSalesPage((p) => (p * salesPerPage < salesData.length ? p + 1 : p))}
                                        disabled={salesPage * salesPerPage >= salesData.length}
                                        className="px-3 py-1 text-xs border border-gray-300 rounded disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ItemDetailScreen;
