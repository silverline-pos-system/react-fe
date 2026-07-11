import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, FileText, CheckCircle, Clock, Save, Trash2, ArrowLeft, Download, DollarSign, Printer } from 'lucide-react';
import { poService } from '@/features/procurement/services/poService';
import { useInventoryNotification } from '@/features/inventory/context/InventoryNotificationContext';
import { useEnterKeyNavigation } from '@/shared/hooks/useEnterKeyNavigation';
import Pagination from '@/shared/components/Pagination';

const POManagementScreen = ({ items, suppliers, branches, categories = [], subCategories = [], brands = [], setActiveScreen }) => {
    const { success, error, warning, confirm } = useInventoryNotification();
    const [view, setView] = useState('list'); // 'list', 'create', 'detail'
    const [pos, setPos] = useState([]);
    const [selectedPO, setSelectedPO] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [supplierFilter, setSupplierFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('');
    const [selectedPOItems, setSelectedPOItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [formData, setFormData] = useState({
        poNo: '',
        supplierId: '',
        poDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: '',
        paymentTerms: '',
        items: []
    });

    const [currentItem, setCurrentItem] = useState({
        productId: '',
        quantity: '',
        unitPrice: '',
        sellingPrice: '',
        mrp: '',
        batchCode: '',
        discount: '0'
    });

    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');
    const [selectedBrandId, setSelectedBrandId] = useState('');

    const AUTO_PO_PATTERN = /^PO-\d{8}-\d{3}$/;

    const generateReadablePONumber = (dateStr, customPos) => {
        const safeDate = dateStr || new Date().toISOString().split('T')[0];
        const compactDate = safeDate.replace(/-/g, '');
        const prefix = `PO-${compactDate}-`;
        const targetPos = customPos || pos || [];

        const maxSequence = targetPos.reduce((max, po) => {
            const poNo = String(po?.poNo || '').toUpperCase();
            if (!poNo.startsWith(prefix)) return max;
            const seq = parseInt(poNo.slice(prefix.length), 10);
            return Number.isFinite(seq) ? Math.max(max, seq) : max;
        }, 0);

        const nextSequence = String(maxSequence + 1).padStart(3, '0');
        return `${prefix}${nextSequence}`;
    };

    const filteredSubCategories = selectedCategoryId
        ? subCategories.filter(sc => sc.category_id === parseInt(selectedCategoryId))
        : [];

    const productOptions = items.filter(item => {
        if (selectedCategoryId && item.category_id !== parseInt(selectedCategoryId)) return false;
        if (selectedSubCategoryId && item.subcategory_id !== parseInt(selectedSubCategoryId)) return false;
        if (selectedBrandId && item.brand_id !== parseInt(selectedBrandId)) return false;
        return true;
    });

    const fetchPOs = useCallback(async () => {
        try {
            const res = await poService.getAllPOs();
            const rawData = res.data?.data || res.data || [];
            let poList = [];
            if (Array.isArray(rawData)) {
                poList = rawData;
            } else if (rawData.content && Array.isArray(rawData.content)) {
                poList = rawData.content;
            } else if (rawData.data && Array.isArray(rawData.data)) {
                poList = rawData.data;
            } else if (rawData.data?.content && Array.isArray(rawData.data.content)) {
                poList = rawData.data.content;
            }

            const sorted = poList.slice().sort((a, b) => {
                const idDiff = Number(b.poId || b.id || 0) - Number(a.poId || a.id || 0);
                if (idDiff !== 0) return idDiff;
                return new Date(b.poDate || b.createdAt || 0).getTime() - new Date(a.poDate || a.createdAt || 0).getTime();
            });
            setPos(sorted);
        } catch (error) {
            console.error("Failed to fetch POs", error);
        }
    }, []);

    useEffect(() => {
        fetchPOs();
    }, [fetchPOs]);

    useEffect(() => {
        if (view === 'create') {
            const draft = localStorage.getItem('poDraft');
            if (draft) {
                try {
                    const parsedDraft = JSON.parse(draft);
                    if (parsedDraft && Array.isArray(parsedDraft.items)) {
                        setFormData(parsedDraft);
                        return;
                    }
                } catch (e) {
                    console.error('Failed to parse PO draft', e);
                }
            }

            setFormData((prev) => ({
                ...prev,
                poNo: prev.poNo || generateReadablePONumber(prev.poDate),
            }));
        }
    }, [view]);

    const handleExportPdf = async () => {
        try {
            const blob = await poService.getPOListPdf();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `po_list_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            success('PO List exported successfully');
            return;
        } catch (pdfErr) {
            console.warn('PO PDF export unavailable, using CSV fallback:', pdfErr);
        }

        try {
            const rows = [
                ['PO No', 'Supplier', 'Date', 'Net Amount', 'Status'],
                ...filteredPOs.map((po) => ([
                    po.poNo || '-',
                    suppliers.find((s) => s.supplier_id === po.supplierId)?.name || po.supplierId || '-',
                    po.poDate || '-',
                    (po.netAmount || 0).toFixed(2),
                    po.status || '-'
                ]))
            ];

            const csv = rows
                .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
                .join('\n');

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `po_list_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            success('PO List exported as CSV');
        } catch (err) {
            console.error('Failed to export PO list:', err);
            error('Failed to export PO List');
        }
    };

    const filteredPOs = pos.filter(po => {
        const supplierName = suppliers.find(s => s.supplier_id === po.supplierId)?.name || '';
        const matchesSearch = !searchQuery || 
            po.poNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            supplierName.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;
        const matchesSupplier = supplierFilter === 'ALL' || String(po.supplierId) === String(supplierFilter);
        const matchesDate = !dateFilter || po.poDate === dateFilter;

        return matchesSearch && matchesStatus && matchesSupplier && matchesDate;
    });

    const paginatedPOs = filteredPOs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, supplierFilter, dateFilter]);

    const handleAddItem = () => {
        if (!currentItem.productId || !currentItem.quantity || !currentItem.unitPrice) {
            warning('Please fill in Product, Quantity and Cost Price');
            return;
        }

        const product = items.find(i => i.product_id === parseInt(currentItem.productId));
        const lineTotal = parseFloat(currentItem.quantity) * parseFloat(currentItem.unitPrice);
        const discountAmt = parseFloat(currentItem.discount || 0);

        const newItem = {
            ...currentItem,
            product_name: product?.name || 'Unknown',
            sku: product?.sku || '',
            subtotal: lineTotal - discountAmt
        };

        setFormData({
            ...formData,
            items: [...formData.items, newItem]
        });

        setCurrentItem({
            productId: '',
            quantity: '',
            unitPrice: '',
            sellingPrice: '',
            mrp: '',
            batchCode: '',
            discount: '0'
        });
        setSelectedCategoryId('');
        setSelectedSubCategoryId('');
        setSelectedBrandId('');
    };

    const handleAddItemKeyDown = useEnterKeyNavigation(handleAddItem);
    const handleSupplierInfoKeyDown = useEnterKeyNavigation();

    const handleRemoveItem = async (index) => {
        const confirmed = await confirm(
            'Remove Item',
            'Are you sure you want to remove this item?',
            'warning'
        );

        if (confirmed) {
            const newItems = [...formData.items];
            newItems.splice(index, 1);
            setFormData({ ...formData, items: newItems });
        }
    };

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + item.subtotal, 0);
    };

    const handleSubmit = async () => {
        if (!formData.supplierId) {
            warning('Please select a supplier');
            return;
        }
        if (formData.items.length === 0) {
            warning('Please add at least one item');
            return;
        }

        try {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const currentUserId = Number(currentUser.userId ?? currentUser.id);

            const payload = {
                poNo: formData.poNo || generateReadablePONumber(formData.poDate),
                supplierId: parseInt(formData.supplierId),
                poDate: formData.poDate,
                expectedDeliveryDate: formData.expectedDeliveryDate,
                paymentTerms: formData.paymentTerms,
                createdBy: Number.isFinite(currentUserId) ? currentUserId : undefined,
                items: formData.items.map(item => ({
                    productId: parseInt(item.productId),
                    qtyOrdered: parseFloat(item.quantity),
                    unitPrice: parseFloat(item.unitPrice),
                    sellingPrice: parseFloat(item.sellingPrice || 0),
                    mrp: parseFloat(item.mrp || 0),
                    discount: parseFloat(item.discount)
                }))
            };

            const res = await poService.createPO(payload);
            const createdPO = res.data?.data || res.data;
            let updatedPos = pos;
            if (createdPO) {
                updatedPos = [createdPO, ...pos];
                setPos(updatedPos);
            }

            success(`PO Created Successfully! PO No: ${createdPO?.poNo || 'New PO'}`);
            localStorage.removeItem('poDraft');
            setView('list');

            fetchPOs();

            setFormData({
                poNo: generateReadablePONumber(new Date().toISOString().split('T')[0], updatedPos),
                supplierId: '',
                poDate: new Date().toISOString().split('T')[0],
                expectedDeliveryDate: '',
                paymentTerms: '',
                items: []
            });
        } catch (err) {
            console.error("Error creating PO:", err);
            error('Failed to create PO');
        }
    };

    const handleViewPO = async (po) => {
        setSelectedPO(po);
        setView('detail');
        try {
            const res = await poService.getPOItems(po.poId);
            setSelectedPOItems(res.data?.data || res.data || []);
        } catch (error) {
            console.error("Failed to fetch PO items", error);
            setSelectedPOItems([]);
        }
    };

    const handleCreateDispatchFromPO = () => {
        const defaultBranch = branches?.find(b => String(b.branch_id) === String(selectedPO.branchId)) || branches?.[0];

        const dispatchDraft = {
            po_id: String(selectedPO.poId),
            supplier_id: String(selectedPO.supplierId),
            dispatch_date: new Date().toISOString().split('T')[0],
            invoice_no: '',
            invoice_date: new Date().toISOString().split('T')[0],
            notes: `Created from PO: ${selectedPO.poNo}`,
            branch_id: selectedPO.branchId || branches?.[0]?.branch_id || 1,
            items: selectedPOItems.map(poItem => {
                const product = items.find(i => i.product_id === poItem.productId);
                return {
                    product_id: String(poItem.productId),
                    product_name: product?.name || 'Unknown',
                    branch_id: selectedPO.branchId || branches?.[0]?.branch_id || 1,
                    branch_name: defaultBranch?.name || 'Main Branch',
                    quantity: poItem.qtyOrdered,
                    unit_price: poItem.unitPrice,
                    selling_price: poItem.sellingPrice || product?.selling_price || '',
                    mrp: poItem.mrp || product?.mrp || '',
                    batch_code: poItem.batchCode || '',
                    expiry_date: poItem.expiryDate || '',
                    imei: poItem.imei || '',
                    subtotal: poItem.qtyOrdered * poItem.unitPrice
                };
            })
        };
        localStorage.setItem('dispatchDraft', JSON.stringify(dispatchDraft));
        if (setActiveScreen) {
            setActiveScreen('dispatch-mgmt');
        }
    };

    const handleSaveDraft = () => {
        if (formData.items.length === 0 && !formData.supplierId) {
            warning('Nothing to save. Please select a supplier or add items first.');
            return;
        }
        const draftPayload = {
            ...formData,
            poNo: formData.poNo || generateReadablePONumber(formData.poDate),
        };
        localStorage.setItem('poDraft', JSON.stringify(draftPayload));
        success('PO saved as draft!');
        setView('list');
    };

    const handlePrintPO = () => {
        if (!selectedPO) return;
        const supplier = suppliers.find(s => s.supplier_id === selectedPO.supplierId);
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Purchase Order - ${selectedPO.poNo}</title>
                <style>
                    body { font-family: 'Inter', sans-serif; color: #333; margin: 40px; line-height: 1.5; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { font-size: 24px; font-weight: 800; color: #1e3a8a; margin: 0; }
                    .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
                    .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    .table th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 10px; font-size: 12px; font-weight: bold; text-align: left; }
                    .table td { border-bottom: 1px solid #e2e8f0; padding: 10px; font-size: 13px; }
                    .text-right { text-align: right; }
                    .summary { display: flex; justify-content: flex-end; margin-top: 30px; }
                    .summary-card { width: 300px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
                    .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
                    .summary-row.total { border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 15px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1>PURCHASE ORDER</h1>
                        <p style="font-size: 14px; color: #64748b; margin: 4px 0 0 0;">ROCS Inventory Management</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="font-size: 16px; font-weight: bold; font-family: monospace; margin: 0;">${selectedPO.poNo}</p>
                        <p style="font-size: 12px; margin: 4px 0 0 0; color: #64748b;">Date: ${selectedPO.poDate}</p>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                    <div>
                        <h3 style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Supplier</h3>
                        <p style="font-size: 14px; font-weight: bold; margin: 0;">${supplier?.name || selectedPO.supplierId}</p>
                        ${supplier?.contact ? `<p style="font-size: 13px; color: #475569; margin: 4px 0 0 0;">Contact: ${supplier.contact}</p>` : ''}
                        ${supplier?.address ? `<p style="font-size: 13px; color: #475569; margin: 4px 0 0 0;">Address: ${supplier.address}</p>` : ''}
                    </div>
                    <div style="text-align: right;">
                        <h3 style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Details</h3>
                        <p style="font-size: 13px; margin: 0;">Status: <strong>${selectedPO.status}</strong></p>
                        <p style="font-size: 13px; margin: 4px 0 0 0;">Expected Delivery: ${selectedPO.expectedDeliveryDate || 'N/A'}</p>
                        <p style="font-size: 13px; margin: 4px 0 0 0;">Payment Terms: ${selectedPO.paymentTerms || 'N/A'}</p>
                    </div>
                </div>

                <table class="table">
                    <thead>
                        <tr>
                            <th style="width: 5%;">#</th>
                            <th style="width: 45%;">Item / Product</th>
                            <th style="width: 15%; text-align: right;">Qty</th>
                            <th style="width: 15%; text-align: right;">Unit Price (LKR)</th>
                            <th style="width: 20%; text-align: right;">Total (LKR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${selectedPOItems.map((item, idx) => {
                            const product = items.find(i => i.product_id === item.productId);
                            return `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td>
                                        <strong>${product?.name || 'Unknown'}</strong>
                                        <div style="font-size: 11px; color: #64748b;">SKU: ${product?.sku || item.productId}</div>
                                    </td>
                                    <td class="text-right">${item.qtyOrdered}</td>
                                    <td class="text-right">${(item.unitPrice || 0).toFixed(2)}</td>
                                    <td class="text-right" style="font-weight: 500;">${(item.total || 0).toFixed(2)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>

                <div class="summary">
                    <div class="summary-card">
                        <div class="summary-row">
                            <span>Subtotal</span>
                            <span>LKR ${(selectedPO.totalAmount || 0).toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Discount</span>
                            <span>LKR ${(selectedPO.discountAmount || 0).toFixed(2)}</span>
                        </div>
                        <div class="summary-row total">
                            <span>Net Total</span>
                            <span>LKR ${(selectedPO.netAmount || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        const win = window.open("", "_blank", "width=900,height=750");
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => {
            win.print();
            win.close();
        }, 300);
    };

    if (view === 'detail' && selectedPO) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => { setView('list'); setSelectedPO(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                            <ArrowLeft size={20} className="text-gray-600" />
                        </button>
                        <div>
                            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-500 drop-shadow-sm">
                                PO Details - {selectedPO.poNo}
                            </h2>
                            <p className="text-gray-600 text-sm">View purchase order</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4">PO Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">PO No</label>
                                    <p className="text-base font-mono font-medium">{selectedPO.poNo}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Status</label>
                                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${selectedPO.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                        selectedPO.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-700' :
                                            selectedPO.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                'bg-gray-100 text-gray-700'
                                        }`}>
                                        {selectedPO.status}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Supplier</label>
                                    <p className="text-base">{selectedPO.supplierName || suppliers.find(s => s.supplier_id === selectedPO.supplierId)?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">PO Date</label>
                                    <p className="text-base">{selectedPO.poDate}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Expected Delivery</label>
                                    <p className="text-base font-mono">{selectedPO.expectedDeliveryDate || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Payment Terms</label>
                                    <p className="text-base">{selectedPO.paymentTerms || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-6 overflow-x-auto">
                            <h3 className="text-lg font-semibold mb-4">Items Ordered</h3>
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Product</th>
                                        <th className="px-4 py-2 text-right">Qty</th>
                                        <th className="px-4 py-2 text-right">Price</th>
                                        <th className="px-4 py-2 text-right">Discount</th>
                                        <th className="px-4 py-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {selectedPOItems.map((item, idx) => {
                                        const product = items.find(i => i.product_id === item.productId);
                                        return (
                                            <tr key={idx}>
                                                <td className="px-4 py-2">{product?.name || 'Unknown'} <span className="text-xs text-gray-500">({product?.sku || item.productId})</span></td>
                                                <td className="px-4 py-2 text-right">{item.qtyOrdered}</td>
                                                <td className="px-4 py-2 text-right">{(item.unitPrice || 0).toFixed(2)}</td>
                                                <td className="px-4 py-2 text-right">{(item.discount || 0).toFixed(2)}</td>
                                                <td className="px-4 py-2 text-right font-medium">LKR {(item.total || 0).toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                    {selectedPOItems.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No items found for this PO.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4">Summary</h3>
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Amount</span>
                                    <span className="font-medium">LKR {(selectedPO.totalAmount || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Discount Amount</span>
                                    <span className="font-medium">LKR {(selectedPO.discountAmount || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t pt-2">
                                    <span>Net Amount</span>
                                    <span>LKR {(selectedPO.netAmount || 0).toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="border-t pt-4 space-y-3">
                                <button
                                    onClick={handlePrintPO}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                                >
                                    <Printer size={20} /> Print PO Details
                                </button>

                                {selectedPO.status && String(selectedPO.status).toUpperCase() !== 'REJECTED' && (
                                    <button
                                        onClick={handleCreateDispatchFromPO}
                                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={20} /> Create Dispatch from PO
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'create') {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 rounded-full">
                            <ArrowLeft size={20} className="text-gray-600" />
                        </button>
                        <div>
                            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-500 drop-shadow-sm">Create PO</h2>
                            <p className="text-gray-600 text-sm">Purchase order request</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <form className="bg-white rounded-lg border border-gray-200 p-6" onKeyDown={handleSupplierInfoKeyDown}>
                            <h3 className="text-lg font-semibold mb-4">Supplier Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-100 text-gray-500 cursor-not-allowed select-none focus:outline-none"
                                        value={formData.poNo || generateReadablePONumber(formData.poDate)}
                                        readOnly
                                        disabled
                                        placeholder="PO-20260314-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                                    <select
                                        className="w-full"
                                        value={formData.supplierId}
                                        onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map(s => (
                                            <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">PO Date</label>
                                    <input
                                        type="date"
                                        className="w-full"
                                        value={formData.poDate}
                                        onChange={(e) => {
                                            const nextDate = e.target.value;
                                            setFormData((prev) => ({
                                                ...prev,
                                                poDate: nextDate,
                                                poNo: generateReadablePONumber(nextDate),
                                            }));
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label>
                                    <input
                                        type="date"
                                        className="w-full"
                                        value={formData.expectedDeliveryDate}
                                        onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg p-2.5"
                                        placeholder="e.g. Net 30"
                                        value={formData.paymentTerms}
                                        onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                                    />
                                </div>
                            </div>
                        </form>

                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4">Add Items</h3>
                            <form className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end mb-4" onKeyDown={handleAddItemKeyDown}>
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        className="w-full text-sm"
                                        value={selectedCategoryId}
                                        onChange={(e) => {
                                            setSelectedCategoryId(e.target.value);
                                            setSelectedSubCategoryId('');
                                        }}
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map(c => (
                                            <option key={c.category_id} value={c.category_id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Subcategory</label>
                                    <select
                                        className="w-full text-sm"
                                        value={selectedSubCategoryId}
                                        onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                                        disabled={!selectedCategoryId}
                                    >
                                        <option value="">All Subcategories</option>
                                        {filteredSubCategories.map(sc => (
                                            <option key={sc.subcategory_id} value={sc.subcategory_id}>{sc.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Brand</label>
                                    <select
                                        className="w-full text-sm"
                                        value={selectedBrandId}
                                        onChange={(e) => setSelectedBrandId(e.target.value)}
                                    >
                                        <option value="">All Brands</option>
                                        {brands.map(b => (
                                            <option key={b.brand_id} value={b.brand_id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Product</label>
                                    <select
                                        className="w-full text-sm"
                                        value={currentItem.productId}
                                        onChange={(e) => {
                                            const product = items.find(i => i.product_id === parseInt(e.target.value));
                                            setCurrentItem({
                                                ...currentItem,
                                                productId: e.target.value,
                                                unitPrice: product ? product.cost_price : '',
                                                sellingPrice: product ? product.selling_price : '',
                                                mrp: product ? product.mrp : '',
                                                quantity: ''
                                            });
                                        }}
                                    >
                                        <option value="">Select Product</option>
                                        {productOptions.map(i => (
                                            <option key={i.product_id} value={i.product_id}>{i.name} ({i.sku})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Qty Ordered</label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                        value={currentItem.quantity ?? ''}
                                        onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Cost Price</label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                        value={currentItem.unitPrice ?? ''}
                                        onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Selling Price</label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                        value={currentItem.sellingPrice ?? ''}
                                        onChange={(e) => setCurrentItem({ ...currentItem, sellingPrice: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">MRP</label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                        value={currentItem.mrp ?? ''}
                                        onChange={(e) => setCurrentItem({ ...currentItem, mrp: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Discount(Abs)</label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                        value={currentItem.discount ?? ''}
                                        onChange={(e) => setCurrentItem({ ...currentItem, discount: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="md:col-span-3 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="bg-blue-600 text-white px-4 py-2 w-full rounded-lg text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} /> Add Item
                                    </button>
                                </div>
                            </form>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Product</th>
                                            <th className="px-4 py-2 text-right">Qty</th>
                                            <th className="px-4 py-2 text-right">Cost</th>
                                            <th className="px-4 py-2 text-right">Selling Price</th>
                                            <th className="px-4 py-2 text-right">MRP</th>
                                            <th className="px-4 py-2 text-right">Total</th>
                                            <th className="px-4 py-2 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {formData.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-2">{item.product_name}</td>
                                                <td className="px-4 py-2 text-right">{item.quantity}</td>
                                                <td className="px-4 py-2 text-right">{parseFloat(item.unitPrice).toFixed(2)}</td>
                                                <td className="px-4 py-2 text-right">{item.sellingPrice ? parseFloat(item.sellingPrice).toFixed(2) : '-'}</td>
                                                <td className="px-4 py-2 text-right">{item.mrp ? parseFloat(item.mrp).toFixed(2) : '-'}</td>
                                                <td className="px-4 py-2 text-right font-medium">{item.subtotal.toFixed(2)}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <button
                                                        onClick={() => handleRemoveItem(idx)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {formData.items.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No items added yet</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
                            <h3 className="text-lg font-semibold mb-4">Summary</h3>
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Items</span>
                                    <span className="font-medium">{formData.items.length}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t pt-2">
                                    <span>Net Amount</span>
                                    <span>LKR {calculateTotal().toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <button
                                    onClick={handleSubmit}
                                    className="w-full bg-brand-primary text-white py-3 rounded-lg font-semibold hover:bg-brand-secondary flex items-center justify-center gap-2"
                                >
                                    <Save size={20} /> Request PO Approval
                                </button>
                                <button
                                    onClick={handleSaveDraft}
                                    className="w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 flex items-center justify-center gap-2"
                                >
                                    <Clock size={20} /> Save as Draft
                                </button>
                                <button
                                    onClick={() => setView('list')}
                                    className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-500 drop-shadow-sm">Purchase Orders (PO)</h2>
                    <p className="text-gray-600 mt-1">Manage outbound purchasing requests</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleExportPdf}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Download size={20} /> Export PDF
                    </button>
                    <button
                        onClick={() => setView('create')}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors"
                    >
                        <Plus size={20} /> Create PO
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-4">
                    <div className="flex flex-col min-w-[140px]">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-3 pr-8 py-2 text-xs border border-gray-200 rounded-lg bg-white cursor-pointer hover:border-gray-300 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PENDING_APPROVAL">Pending Approval</option>
                            <option value="APPROVED">Approved</option>
                            <option value="PAID">Paid</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>

                    <div className="flex flex-col min-w-[180px]">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Supplier</label>
                        <select
                            value={supplierFilter}
                            onChange={(e) => setSupplierFilter(e.target.value)}
                            className="pl-3 pr-8 py-2 text-xs border border-gray-200 rounded-lg bg-white cursor-pointer hover:border-gray-300 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="ALL">All Suppliers</option>
                            {suppliers.map(s => (
                                <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col min-w-[140px]">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">PO Date</label>
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {(statusFilter !== 'ALL' || supplierFilter !== 'ALL' || dateFilter || searchQuery) && (
                        <button
                            onClick={() => {
                                setStatusFilter('ALL');
                                setSupplierFilter('ALL');
                                setDateFilter('');
                                setSearchQuery('');
                            }}
                            className="self-end mb-1 text-xs text-red-500 hover:text-red-700 font-bold transition-colors"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">PO No</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Supplier</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Amount</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {paginatedPOs.length > 0 ? (
                            paginatedPOs.map((po) => (
                                <tr
                                    key={po.poId}
                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => handleViewPO(po)}
                                >
                                    <td className="px-6 py-4 text-sm font-mono font-medium text-brand-primary">{po.poNo}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{suppliers.find(s => s.supplier_id === po.supplierId)?.name || po.supplierId}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{po.poDate}</td>
                                    <td className="px-6 py-4 text-sm font-mono text-right font-medium">LKR {(po.netAmount || 0).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${po.status === 'APPROVED' || po.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                            po.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-700' :
                                                po.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'
                                            }`}>
                                            {po.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <FileText size={48} className="text-gray-300 mb-4" />
                                        <p className="text-lg font-medium text-gray-900">No POs Found</p>
                                        <p className="text-sm text-gray-500 mt-1">Create a new PO to get started</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredPOs.length / itemsPerPage)}
                    onPageChange={setCurrentPage}
                    totalItems={filteredPOs.length}
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                />
            </div>
        </div>
    );
};

export default POManagementScreen;
