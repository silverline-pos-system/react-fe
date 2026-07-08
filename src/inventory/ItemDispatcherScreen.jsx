import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2, FileText, History, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import inventoryService from '../services/inventoryService';
import storeService from '../services/storeService';
import { poService } from '../services/poService';
import { useInventoryNotification } from './context/InventoryNotificationContext';
import { useEnterKeyNavigation } from '../hooks/useEnterKeyNavigation';
import Pagination from '../components/Pagination';

const ItemDispatcherScreen = ({ items, suppliers, branches, onOpenIMEIFinder }) => {
    const { success, error, warning, confirm } = useInventoryNotification();

    const [loading, setLoading] = useState(false);
    const [fetchingPOs, setFetchingPOs] = useState(false);
    const [dispatches, setDispatches] = useState([]);
    const [approvedPOs, setApprovedPOs] = useState([]);
    const [completedPOIds, setCompletedPOIds] = useState(new Set());
    const [selectedPOItems, setSelectedPOItems] = useState([]);
    const [batches, setBatches] = useState([]);

    const [historyStatusFilter, setHistoryStatusFilter] = useState('');
    const [historyBranchFilter, setHistoryBranchFilter] = useState('');
    const [historyDateFrom, setHistoryDateFrom] = useState('');
    const [historyDateTo, setHistoryDateTo] = useState('');
    const [historySearchQuery, setHistorySearchQuery] = useState('');
    const [historyPage, setHistoryPage] = useState(1);
    const [historyPerPage, setHistoryPerPage] = useState(8);

    const [formData, setFormData] = useState({
        po_id: '',
        supplier_id: '',
        dispatch_date: new Date().toISOString().split('T')[0],
        invoice_no: '',
        invoice_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: []
    });

    const [currentItem, setCurrentItem] = useState({
        product_id: '',
        branch_id: '',
        quantity: '',
        unit_price: '',
        selling_price: '',
        mrp: '',
        selected_batch_id: '',
        batch_code: '',
        expiry_date: '',
        item_type: 'normal',
        imeis: []
    });

    const toOptionalNumber = (...values) => {
        for (const value of values) {
            if (value === null || value === undefined || value === '') continue;
            const num = Number(value);
            if (Number.isFinite(num)) return num;
        }
        return null;
    };

    const handleAddItemKeyDown = useEnterKeyNavigation(() => handleAddItem());

    const loadDispatchHistory = async () => {
        try {
            setLoading(true);
            const branchIds = (branches || []).map((b) => b.branch_id).filter(Boolean);
            const historyResponses = await Promise.all(
                branchIds.map(async (branchId) => {
                    try {
                        const data = await inventoryService.getDispatches(branchId);
                        return Array.isArray(data) ? data : [];
                    } catch {
                        return [];
                    }
                })
            );

            const merged = historyResponses.flat();
            const deduped = Array.from(new Map(merged.map((x) => [x.dispatch_id, x])).values());
            deduped.sort((a, b) => new Date(b.dispatch_date) - new Date(a.dispatch_date));
            setDispatches(deduped);
            return deduped;
        } catch (err) {
            console.error('Failed to load dispatch history', err);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const getReceivedQtyFromHistory = (history, poId, productId, poItems) => {
        let backendQty = 0;
        
        // Check backend tracked quantity
        if (poItems && poItems.length > 0) {
            const poItem = poItems.find(pi => String(pi.productId || pi.product_id) === String(productId));
            if (poItem) {
                const qty = poItem.qtyReceived ?? poItem.qty_received;
                if (qty != null) {
                    backendQty = Number(qty);
                }
            }
        }

        // Check historically tracked quantity
        const historyQty = history
            .filter((dispatch) => String(dispatch.po_id || dispatch.poId) === String(poId) && dispatch.status === 'APPROVED')
            .flatMap((dispatch) => dispatch.items || [])
            .filter((item) => String(item.product_id || item.productId) === String(productId))
            .reduce((sum, item) => sum + Number(item.qty_received || item.quantity || item.qtyReceived || 0), 0);
            
        // Use whichever is larger to ensure backwards compatibility with old dispatches that didn't update the PO natively
        return Math.max(backendQty, historyQty);
    };

    const loadEligiblePOs = async (historySnapshot) => {
        try {
            setFetchingPOs(true);
            // Load APPROVED, PAID, and PARTIALLY_RECEIVED POs
            const [approvedRes, paidRes, partialRes, transferredRes] = await Promise.all([
                poService.getPOsByStatus('APPROVED'),
                poService.getPOsByStatus('PAID'),
                poService.getPOsByStatus('PARTIALLY_RECEIVED'),
                poService.getPOsByStatus('TRANSFERRED_TO_CASHIER')
            ]);

            const allPOs = [
                ...(approvedRes.data?.data || approvedRes.data || []),
                ...(paidRes.data?.data || paidRes.data || []),
                ...(partialRes.data?.data || partialRes.data || []),
                ...(transferredRes.data?.data || transferredRes.data || [])
            ];
            const uniquePOs = Array.from(new Map(allPOs.map((po) => [po.poId, po])).values());

            const poItemResponses = await Promise.all(
                uniquePOs.map(async (po) => {
                    try {
                        const res = await poService.getPOItems(po.poId);
                        return { poId: po.poId, items: res.data?.data || res.data || [] };
                    } catch {
                        return { poId: po.poId, items: [] };
                    }
                })
            );

            const completionMap = new Set();
            poItemResponses.forEach(({ poId, items: poItems }) => {
                if (!poItems.length) return;

                const isFullyDispatched = poItems.every((poItem) => {
                    const ordered = Number(poItem.qtyOrdered ?? poItem.qty_ordered ?? 0);
                    const received = getReceivedQtyFromHistory(historySnapshot, poId, poItem.productId || poItem.product_id, poItems);
                    return ordered > 0 ? received >= ordered : true;
                });

                if (isFullyDispatched) {
                    completionMap.add(poId);
                }
            });

            setCompletedPOIds(completionMap);
            setApprovedPOs(uniquePOs.filter((po) => !completionMap.has(po.poId)));
        } catch (err) {
            console.error('Failed to load approved/paid POs', err);
            setApprovedPOs([]);
            setCompletedPOIds(new Set());
        } finally {
            setFetchingPOs(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            const historySnapshot = await loadDispatchHistory();
            try {
                const batchData = await storeService.getBatches();
                setBatches(batchData || []);
            } catch (err) {
                console.error('Failed to load batches', err);
            }

            await loadEligiblePOs(historySnapshot);
        };

        init();
    }, [branches]);

    useEffect(() => {
        const fetchPOItems = async () => {
            if (!formData.po_id) {
                setSelectedPOItems([]);
                return;
            }
            try {
                const res = await poService.getPOItems(formData.po_id);
                setSelectedPOItems(res.data?.data || res.data || []);
            } catch (err) {
                console.error('Failed to fetch PO items', err);
                setSelectedPOItems([]);
            }
        };
        fetchPOItems();
    }, [formData.po_id]);

    const dispatchSummaryByBranch = useMemo(() => {
        return formData.items.reduce((acc, item) => {
            const branchKey = String(item.branch_id || 'unknown');
            if (!acc[branchKey]) {
                acc[branchKey] = {
                    branchName: item.branch_name || branches.find((b) => String(b.branch_id) === branchKey)?.name || 'Unknown Branch',
                    totalQty: 0,
                    totalLines: 0,
                    totalValue: 0
                };
            }
            acc[branchKey].totalQty += Number(item.quantity || 0);
            acc[branchKey].totalLines += 1;
            acc[branchKey].totalValue += Number(item.subtotal || 0);
            return acc;
        }, {});
    }, [formData.items, branches]);

    const historyFiltered = useMemo(() => {
        const search = historySearchQuery.trim().toLowerCase();
        return dispatches
            .filter((dispatch) => {
                const matchesStatus = !historyStatusFilter || dispatch.status === historyStatusFilter;
                const matchesBranch = !historyBranchFilter || String(dispatch.branch_id) === String(historyBranchFilter);

                const date = dispatch.dispatch_date ? new Date(dispatch.dispatch_date) : null;
                const from = historyDateFrom ? new Date(historyDateFrom) : null;
                const to = historyDateTo ? new Date(historyDateTo) : null;
                const matchesFrom = !from || (date && date >= from);
                const matchesTo = !to || (date && date <= to);

                const supplierName = suppliers.find((s) => s.supplier_id === dispatch.supplier_id)?.name || '';
                const itemNameText = (dispatch.items || [])
                    .map((item) => resolveItemName(item))
                    .join(' ')
                    .toLowerCase();
                const matchesSearch =
                    !search ||
                    (dispatch.dispatch_no || '').toLowerCase().includes(search) ||
                    (dispatch.invoice_no || '').toLowerCase().includes(search) ||
                    supplierName.toLowerCase().includes(search) ||
                    itemNameText.includes(search);

                return matchesStatus && matchesBranch && matchesFrom && matchesTo && matchesSearch;
            })
            .sort((a, b) => new Date(b.dispatch_date) - new Date(a.dispatch_date));
    }, [dispatches, historyStatusFilter, historyBranchFilter, historyDateFrom, historyDateTo, historySearchQuery, suppliers]);

    const paginatedHistory = historyFiltered.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage);

    useEffect(() => {
        setHistoryPage(1);
    }, [historyStatusFilter, historyBranchFilter, historyDateFrom, historyDateTo, historySearchQuery]);

    const calculateTotal = () => formData.items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);

    const availablePriceBatches = useMemo(() => {
        if (!currentItem.product_id) return [];

        return (batches || [])
            .filter((batch) => Number(batch.product_id ?? batch.productId) === Number(currentItem.product_id))
            .map((batch, idx) => {
                const rawCode = String(batch.batch_code ?? batch.batchCode ?? 'BATCH');
                const id = String(batch.batch_id ?? batch.batchId ?? `${rawCode}-${batch.branch_id ?? batch.branchId ?? 'na'}-${idx}`);
                const code = rawCode;
                const cost = toOptionalNumber(
                    batch.cost_price,
                    batch.costPrice,
                    batch.purchase_price,
                    batch.purchasePrice,
                    batch.unit_price,
                    batch.unitPrice
                );
                const selling = toOptionalNumber(
                    batch.selling_price,
                    batch.sellingPrice,
                    batch.retail_price,
                    batch.retailPrice,
                    batch.unit_selling_price,
                    batch.unitSellingPrice
                );
                const mrp = toOptionalNumber(batch.mrp, batch.maximum_retail_price, batch.maximumRetailPrice);
                const qty = toOptionalNumber(batch.qty, batch.quantity, batch.stock_quantity, batch.stockQuantity, 0) ?? 0;
                const expiryDate = batch.expiry_date ?? batch.expiryDate ?? null;
                const branchId = batch.branch_id ?? batch.branchId ?? null;
                const branchName = branches.find((branch) => String(branch.branch_id) === String(branchId))?.name;

                return {
                    id,
                    code,
                    cost,
                    selling,
                    mrp,
                    qty,
                    expiryDate,
                    branchId,
                    branchName
                };
            })
            .sort((a, b) => {
                const dateA = a.expiryDate ? new Date(a.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
                const dateB = b.expiryDate ? new Date(b.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
                if (dateA !== dateB) return dateA - dateB;

                const codeCompare = String(a.code).localeCompare(String(b.code));
                if (codeCompare !== 0) return codeCompare;

                return String(a.id).localeCompare(String(b.id));
            });
    }, [batches, branches, currentItem.product_id]);

    const allocatedQtyForCurrentProduct = useMemo(() => {
        if (!currentItem.product_id) return 0;
        return formData.items
            .filter((line) => String(line.product_id) === String(currentItem.product_id))
            .reduce((sum, line) => sum + Number(line.quantity || 0), 0);
    }, [formData.items, currentItem.product_id]);

    const currentPOItem = useMemo(() => {
        if (!currentItem.product_id) return null;
        return selectedPOItems.find((poItem) => String(poItem.productId) === String(currentItem.product_id)) || null;
    }, [selectedPOItems, currentItem.product_id]);

    const remainingQtyForCurrentProduct = useMemo(() => {
        if (!currentPOItem) return null;
        const ordered = Number(currentPOItem.qtyOrdered ?? currentPOItem.qty_ordered ?? 0);
        
        // Use the robust combined getter!
        const alreadyReceived = getReceivedQtyFromHistory(dispatches, formData.po_id, currentItem.product_id, selectedPOItems);
        
        // Subtract what's already dispatched AND what's currently allocated in the UI form
        return Math.max(0, ordered - alreadyReceived - allocatedQtyForCurrentProduct);
    }, [currentPOItem, allocatedQtyForCurrentProduct, dispatches, formData.po_id, currentItem.product_id, selectedPOItems]);

    function resolveItemName(lineItem) {
        if (!lineItem) return '-';
        return (
            lineItem.product_name ||
            lineItem.productName ||
            items.find((p) => String(p.product_id) === String(lineItem.product_id || lineItem.productId))?.name ||
            `Product ${lineItem.product_id || lineItem.productId || ''}`
        );
    }

    const exportHistoryPdf = () => {
        if (!historyFiltered.length) {
            warning('No records found for current filters.');
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
        const generatedAt = new Date().toLocaleString();

        doc.setFontSize(14);
        doc.text('Dispatch History Report', 40, 36);
        doc.setFontSize(9);
        doc.text(`Generated: ${generatedAt}`, 40, 52);
        doc.text(
            `Filters - Status: ${historyStatusFilter || 'All'} | Branch: ${historyBranchFilter || 'All'} | From: ${historyDateFrom || '-'} | To: ${historyDateTo || '-'} | Search: ${historySearchQuery || '-'}`,
            40,
            66
        );

        const rows = historyFiltered.map((dispatch) => {
            const firstItem = (dispatch.items || [])[0];
            const itemName = resolveItemName(firstItem);
            const qty = (dispatch.items || []).reduce((sum, item) => sum + Number(item.qty_received || item.quantity || 0), 0);
            const unitSellingPrice = Number(firstItem?.selling_price || firstItem?.sellingPrice || firstItem?.unit_price || 0);
            const branchName = branches.find((b) => String(b.branch_id) === String(dispatch.branch_id))?.name || `Branch ${dispatch.branch_id}`;
            const supplierName = suppliers.find((s) => s.supplier_id === dispatch.supplier_id)?.name || '-';

            return [
                dispatch.invoice_no || dispatch.dispatch_no || '-',
                branchName,
                itemName,
                String(qty),
                new Date(dispatch.dispatch_date).toLocaleDateString(),
                `LKR ${unitSellingPrice.toFixed(2)}`,
                supplierName,
                dispatch.status || '-'
            ];
        });

        autoTable(doc, {
            startY: 80,
            head: [['Dispatch No', 'To', 'Item Name', 'Qty', 'Date', 'Selling Price (Unit)', 'Supplier', 'Status']],
            body: rows,
            styles: { fontSize: 8, cellPadding: 4 },
            headStyles: { fillColor: [31, 41, 55] }
        });

        doc.save(`dispatch-history-${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    const buildDispatchReference = (branchId) => {
        const selectedPO = approvedPOs.find((po) => String(po.poId) === String(formData.po_id));
        const branchCode = (branches.find((b) => String(b.branch_id) === String(branchId))?.code || `B${branchId}`)
            .toString()
            .replace(/[^A-Za-z0-9]/g, '')
            .toUpperCase();
        const poNo = (selectedPO?.poNo || `PO${formData.po_id || 'NA'}`)
            .toString()
            .replace(/[^A-Za-z0-9]/g, '')
            .toUpperCase()
            .slice(0, 12);
        const datePart = formData.dispatch_date ? formData.dispatch_date.replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `DSP-${branchCode}-${poNo}-${datePart}`;
    };

    const handlePOSelect = (poId) => {
        const selectedPO = approvedPOs.find((po) => String(po.poId) === String(poId));
        if (!selectedPO) {
            if (poId && completedPOIds.has(Number(poId))) {
                warning('This PO is fully dispatched and cannot be selected again.');
            }
            setFormData((prev) => ({ ...prev, po_id: '', supplier_id: '', items: [] }));
            return;
        }

        setFormData((prev) => ({
            ...prev,
            po_id: String(selectedPO.poId),
            supplier_id: String(selectedPO.supplierId),
            items: []
        }));

        success(`PO ${selectedPO.poNo} selected for dispatch.`);
    };

    const handleProductSelect = (rawProductId) => {
        const productId = parseInt(rawProductId, 10);
        if (!productId) {
            setCurrentItem((prev) => ({ ...prev, product_id: '' }));
            return;
        }

        const poItem = selectedPOItems.find((x) => Number(x.productId) === productId);
        const product = items.find((x) => Number(x.product_id) === productId);

        const productBatches = batches.filter((b) => Number(b.product_id) === productId);
        let nextBatchCode = '1';
        if (productBatches.length > 0) {
            const maxCode = productBatches.reduce((max, b) => {
                const found = String(b.batch_code || '').match(/\d+/);
                if (!found) return max;
                const value = Number(found[0]);
                return value > max ? value : max;
            }, 0);
            nextBatchCode = String(maxCode + 1);
        }

        setCurrentItem((prev) => ({
            ...prev,
            product_id: String(productId),
            unit_price: poItem?.unitPrice ?? product?.cost_price ?? '',
            selling_price: poItem?.sellingPrice ?? product?.selling_price ?? '',
            mrp: poItem?.mrp ?? product?.mrp ?? '',
            selected_batch_id: '',
            batch_code: nextBatchCode,
            quantity: '',
            branch_id: '',
            item_type: product?.isSerialized ? 'imei' : 'normal',
            imeis: Array(Math.floor(Number(poItem?.qtyOrdered || 0))).fill('')
        }));
    };

    const handleBatchPriceSelection = (batchId) => {
        if (!batchId) {
            setCurrentItem((prev) => ({ ...prev, selected_batch_id: '' }));
            return;
        }

        const selectedBatch = availablePriceBatches.find((batch) => String(batch.id) === String(batchId));
        if (!selectedBatch) return;

        setCurrentItem((prev) => ({
            ...prev,
            selected_batch_id: String(batchId),
            unit_price: selectedBatch.cost ?? prev.unit_price,
            selling_price: selectedBatch.selling ?? prev.selling_price,
            mrp: selectedBatch.mrp ?? prev.mrp,
            batch_code: selectedBatch.code || prev.batch_code,
            expiry_date: selectedBatch.expiryDate || prev.expiry_date
        }));
    };

    const handleAddItem = () => {
        if (!formData.po_id) {
            warning('Select a PO before adding dispatch lines.');
            return;
        }
        if (!currentItem.product_id) {
            warning('Select a product first.');
            return;
        }

        const unitPrice = Number(currentItem.unit_price);
        if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
            warning('Set a valid cost price before quantity.');
            return;
        }

        const qty = Number(currentItem.quantity);
        if (!Number.isFinite(qty) || qty <= 0) {
            warning('Quantity must be a valid positive number.');
            return;
        }

        if (!currentItem.branch_id) {
            warning('Select destination branch after entering quantity.');
            return;
        }

        const poItem = selectedPOItems.find((x) => String(x.productId || x.product_id) === String(currentItem.product_id));
        if (poItem) {
            const alreadyAllocated = formData.items
                .filter((x) => String(x.product_id) === String(currentItem.product_id))
                .reduce((sum, x) => sum + Number(x.quantity || 0), 0);

            // Use the robust multi-source getter for safe checking
            const alreadyReceived = getReceivedQtyFromHistory(dispatches, formData.po_id, currentItem.product_id, selectedPOItems);
            const orderedQty = Number(poItem.qtyOrdered ?? poItem.qty_ordered ?? 0);
            const remaining = orderedQty - alreadyReceived - alreadyAllocated;
            
            if (qty > remaining) {
                warning(`Cannot exceed PO quantity. Ordered: ${orderedQty}, Already Received: ${alreadyReceived}, In this dispatch: ${alreadyAllocated}. Remaining: ${Math.max(0, remaining)}`);
                return;
            }
        }

        // IMEI validation
        if (currentItem.item_type === 'imei') {
            const validImeis = (currentItem.imeis || []).filter((x) => String(x || '').trim());
            if (validImeis.length < Math.floor(qty)) {
                warning(`Enter ${Math.floor(qty)} IMEI/Serial values for serialized dispatch.`);
                return;
            }

            // Check for duplicates within current IMEI list
            const imeiSet = new Set();
            for (const imei of validImeis) {
                const trimmed = imei.trim();
                if (imeiSet.has(trimmed)) {
                    warning(`Duplicate IMEI detected: ${trimmed}`);
                    return;
                }
                imeiSet.add(trimmed);
            }

            // Check against other dispatch lines already added
            const existingImeis = formData.items
                .filter(line => line.item_type === 'imei' && Array.isArray(line.imeis))
                .flatMap(line => line.imeis.filter(x => String(x || '').trim()).map(x => x.trim()));
            for (const imei of validImeis) {
                if (existingImeis.includes(imei.trim())) {
                    warning(`IMEI ${imei.trim()} is already used in another dispatch line.`);
                    return;
                }
            }
        }

        // Expiry validation
        if (currentItem.item_type === 'expiry' && currentItem.expiry_date) {
            const expDate = new Date(currentItem.expiry_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (expDate < today) {
                warning('Cannot dispatch with an expired batch. Expiry date is in the past.');
                return;
            }
        }

        const product = items.find((x) => Number(x.product_id) === Number(currentItem.product_id));
        const branch = branches.find((x) => String(x.branch_id) === String(currentItem.branch_id));

        const normalizedQty = Math.floor(qty);
        const line = {
            ...currentItem,
            quantity: normalizedQty,
            unit_price: unitPrice,
            selling_price: Number(currentItem.selling_price || 0),
            product_name: product?.name || 'Unknown Product',
            branch_name: branch?.name || `Branch ${currentItem.branch_id}`,
            subtotal: normalizedQty * unitPrice
        };

        setFormData((prev) => ({ ...prev, items: [...prev.items, line] }));
        setCurrentItem({
            product_id: '',
            branch_id: '',
            quantity: '',
            unit_price: '',
            selling_price: '',
            mrp: '',
            selected_batch_id: '',
            batch_code: '',
            expiry_date: '',
            item_type: 'normal',
            imeis: []
        });

        success('Dispatch line added.');
    };

    const handleRemoveItem = async (index) => {
        const ok = await confirm('Remove Line', 'Remove this dispatch line?', 'warning');
        if (!ok) return;
        setFormData((prev) => ({ ...prev, items: prev.items.filter((_, idx) => idx !== index) }));
    };

    const handleSubmit = async () => {
        if (!formData.po_id) {
            warning('PO is required.');
            return;
        }
        if (!formData.supplier_id) {
            warning('Supplier must come from selected PO.');
            return;
        }
        if (!formData.items.length) {
            warning('Add at least one dispatch line.');
            return;
        }

        const groupedByBranch = formData.items.reduce((acc, item) => {
            const key = String(item.branch_id);
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {});

        const branchIds = Object.keys(groupedByBranch);
        let successCount = 0;
        const failures = [];
        const imeiBranchIds = new Set();
        const imeiProductIds = new Set();
        const imeiValues = new Set();

        setLoading(true);
        try {
            for (const branchId of branchIds) {
                try {
                    const branchItems = groupedByBranch[branchId];
                    const flattened = [];

                    branchItems.forEach((line) => {
                        if (line.item_type === 'imei' && Array.isArray(line.imeis) && line.imeis.length > 0) {
                            imeiBranchIds.add(Number(branchId));
                            imeiProductIds.add(Number(line.product_id));
                            line.imeis
                                .filter((x) => String(x || '').trim())
                                .forEach((serial) => {
                                    imeiValues.add(String(serial).trim());
                                    flattened.push({
                                        ...line,
                                        quantity: 1,
                                        serial_no: serial,
                                        expiry_date: line.expiry_date || null
                                    });
                                });
                        } else {
                            flattened.push({
                                ...line,
                                serial_no: null,
                                expiry_date: line.expiry_date || null
                            });
                        }
                    });

                    const payload = {
                        po_id: Number(formData.po_id),
                        supplier_id: Number(formData.supplier_id),
                        branch_id: Number(branchId),
                        dispatch_date: formData.dispatch_date,
                        invoice_no: formData.invoice_no || buildDispatchReference(branchId),
                        invoice_date: formData.invoice_date,
                        notes: formData.notes,
                        items: flattened.map((x) => ({
                            product_id: Number(x.product_id),
                            quantity: Number(x.quantity),
                            unit_price: Number(x.unit_price),
                            selling_price: x.selling_price ? Number(x.selling_price) : null,
                            mrp: x.mrp ? Number(x.mrp) : null,
                            batch_code: x.batch_code || null,
                            expiry_date: x.expiry_date || null,
                            serial_no: x.serial_no || null
                        }))
                    };

                    const created = await inventoryService.createDispatch(payload);
                    const createdId = created?.dispatch_id || created?.dispatchId;
                    if (!createdId) {
                        throw new Error('Dispatch created but ID was not returned for auto-finalize');
                    }

                    // Auto-approve so branch stock updates immediately.
                    await inventoryService.approveDispatch(createdId);
                    successCount += 1;
                } catch (branchErr) {
                    const msg = branchErr?.response?.data?.message || branchErr?.message || 'Dispatch failed';
                    failures.push(`Branch ${branchId}: ${msg}`);
                }
            }

            if (successCount === branchIds.length) {
                success(`Dispatch completed and stock updated for ${successCount} branch(es).`);

                if (imeiValues.size > 0 && typeof onOpenIMEIFinder === 'function') {
                    onOpenIMEIFinder({
                        branchIds: Array.from(imeiBranchIds),
                        productIds: Array.from(imeiProductIds),
                        imeis: Array.from(imeiValues)
                    });
                }

                setFormData((prev) => ({
                    ...prev,
                    po_id: '',
                    supplier_id: '',
                    invoice_no: '',
                    notes: '',
                    items: []
                }));
                setSelectedPOItems([]);
                const historySnapshot = await loadDispatchHistory();
                await loadEligiblePOs(historySnapshot);
            } else if (successCount > 0) {
                error(`Partial dispatch success (${successCount}/${branchIds.length}).\n${failures.join('\n')}`);
                const historySnapshot = await loadDispatchHistory();
                await loadEligiblePOs(historySnapshot);
            } else {
                error(`Dispatch failed.\n${failures.join('\n')}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-500">Item Dispatcher</h2>
                    <p className="text-gray-600 text-sm mt-1">Real-world branch dispatch from approved and paid POs</p>
                </div>
                {loading && <span className="text-sm font-semibold text-blue-700">Processing...</span>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2 mb-4">
                            <FileText className="text-blue-600" /> 1. PO Selection
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Purchase Order</label>
                                <select
                                    className="w-full border-2 border-blue-300 rounded-xl p-3 font-semibold"
                                    value={formData.po_id}
                                    onChange={(e) => handlePOSelect(e.target.value)}
                                    disabled={fetchingPOs}
                                >
                                    <option value="">{fetchingPOs ? 'Loading POs...' : 'Select Approved/Paid PO'}</option>
                                    {approvedPOs.map((po) => {
                                        const supplierName = suppliers.find((s) => s.supplier_id === po.supplierId)?.name || 'Unknown Supplier';
                                        return (
                                            <option key={po.poId} value={po.poId}>
                                                PO-{po.poNo} [{po.status}] | {supplierName} | LKR {Number(po.netAmount || 0).toLocaleString()}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Dispatch Date</label>
                                <input
                                    type="date"
                                    className="w-full border border-gray-300 rounded-xl p-3"
                                    value={formData.dispatch_date}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, dispatch_date: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Reference No</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-xl p-3"
                                    placeholder="Auto: DSP-BRANCH-PO-YYYYMMDD"
                                    value={formData.invoice_no}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, invoice_no: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">2. Dispatch Lines</h3>

                        <form onKeyDown={handleAddItemKeyDown}>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                    <div className="md:col-span-4">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Step 1: PO Product</label>
                                        <select
                                            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 font-semibold"
                                            value={currentItem.product_id}
                                            onChange={(e) => handleProductSelect(e.target.value)}
                                            disabled={!formData.po_id}
                                        >
                                            <option value="">{formData.po_id ? 'Select Product' : 'Select PO First'}</option>
                                            {items
                                                .filter((item) => selectedPOItems.some((poi) => Number(poi.productId) === Number(item.product_id)))
                                                .map((item) => (
                                                    <option key={item.product_id} value={item.product_id}>
                                                        {item.name} (SKU: {item.sku})
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    <div className="md:col-span-4">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Step 2 (Optional): Price Batch</label>
                                        <select
                                            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 font-semibold text-xs"
                                            value={currentItem.selected_batch_id}
                                            onChange={(e) => handleBatchPriceSelection(e.target.value)}
                                            disabled={!currentItem.product_id}
                                        >
                                            <option value="">Manual / PO Price</option>
                                            {availablePriceBatches.map((batch) => (
                                                <option key={batch.id} value={batch.id}>
                                                    {batch.code} | Cost: LKR {Number(batch.cost ?? 0).toFixed(2)} | Sell: LKR {Number(batch.selling ?? 0).toFixed(2)} | Qty: {Number(batch.qty ?? 0)}{batch.expiryDate ? ` | EXP: ${batch.expiryDate}` : ''}{batch.branchName ? ` | ${batch.branchName}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Step 2: Cost Price</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 font-semibold"
                                            value={currentItem.unit_price}
                                            onChange={(e) => setCurrentItem((prev) => ({ ...prev, unit_price: e.target.value }))}
                                            disabled={!currentItem.product_id}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Step 3: Quantity</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 font-semibold"
                                            value={currentItem.quantity}
                                            onChange={(e) => {
                                                const rawQty = Number(e.target.value || 0);
                                                const qty = Math.max(0, Math.floor(rawQty));
                                                setCurrentItem((prev) => ({ ...prev, quantity: qty, imeis: Array(qty).fill('') }));
                                            }}
                                            disabled={!currentItem.product_id || Number(currentItem.unit_price || 0) <= 0}
                                        />
                                        {remainingQtyForCurrentProduct !== null && (
                                            <p className="mt-1 text-[10px] text-slate-500">Remaining PO qty: {remainingQtyForCurrentProduct}</p>
                                        )}
                                    </div>

                                    <div className="md:col-span-3">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Step 4: To Branch</label>
                                        <select
                                            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 font-semibold"
                                            value={currentItem.branch_id}
                                            onChange={(e) => setCurrentItem((prev) => ({ ...prev, branch_id: e.target.value }))}
                                            disabled={!currentItem.product_id || Number(currentItem.quantity || 0) <= 0}
                                        >
                                            <option value="">Select Branch</option>
                                            {branches.map((b) => (
                                                <option key={b.branch_id} value={b.branch_id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Selling Price</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 font-semibold"
                                            value={currentItem.selling_price}
                                            onChange={(e) => setCurrentItem((prev) => ({ ...prev, selling_price: e.target.value }))}
                                            disabled={!currentItem.product_id}
                                        />
                                    </div>

                                    <div className="md:col-span-3">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Type</label>
                                        <div className="flex bg-white rounded-lg p-1 border border-slate-300 shadow-sm">
                                            <button
                                                type="button"
                                                onClick={() => setCurrentItem((prev) => ({ ...prev, item_type: 'normal' }))}
                                                className={`flex-1 py-1.5 px-3 text-[10px] font-bold rounded-md transition-all ${currentItem.item_type === 'normal' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                                            >
                                                Normal
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCurrentItem((prev) => ({ ...prev, item_type: 'imei' }))}
                                                className={`flex-1 py-1.5 px-3 text-[10px] font-bold rounded-md transition-all ${currentItem.item_type === 'imei' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                                            >
                                                IMEI
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCurrentItem((prev) => ({ ...prev, item_type: 'expiry' }))}
                                                className={`flex-1 py-1.5 px-3 text-[10px] font-bold rounded-md transition-all ${currentItem.item_type === 'expiry' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                                            >
                                                Expiry
                                            </button>
                                        </div>
                                    </div>

                                    {currentItem.item_type === 'expiry' && (
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Expiry Date</label>
                                            <input
                                                type="date"
                                                className="w-full bg-amber-50 border border-amber-200 rounded-lg p-2.5 font-semibold"
                                                value={currentItem.expiry_date}
                                                onChange={(e) => setCurrentItem((prev) => ({ ...prev, expiry_date: e.target.value }))}
                                            />
                                        </div>
                                    )}

                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Batch</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 font-semibold"
                                            value={currentItem.batch_code}
                                            onChange={(e) => setCurrentItem((prev) => ({ ...prev, batch_code: e.target.value }))}
                                        />
                                    </div>

                                    <div className="md:col-span-3">
                                        <button
                                            type="button"
                                            onClick={handleAddItem}
                                            className="w-full bg-slate-900 text-white rounded-lg p-3 font-bold text-xs uppercase tracking-wide hover:bg-slate-800 flex items-center justify-center gap-2"
                                        >
                                            <Plus size={16} /> Add Dispatch Line
                                        </button>
                                    </div>
                                </div>

                                {currentItem.item_type === 'imei' && Number(currentItem.quantity) > 0 && (
                                    <div className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                                        <label className="block text-[11px] font-black text-indigo-700 uppercase tracking-widest mb-3">
                                            Enter IMEI / Serial Numbers ({Number(currentItem.quantity)} Units)
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                            {Array.from({ length: Number(currentItem.quantity) }).map((_, i) => (
                                                <input
                                                    key={i}
                                                    type="text"
                                                    placeholder={`Unit #${i + 1}`}
                                                    className="w-full p-2 text-xs border border-indigo-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-400 outline-none font-mono"
                                                    value={currentItem.imeis?.[i] || ''}
                                                    onChange={(e) => {
                                                        const nextImeis = [...(currentItem.imeis || [])];
                                                        nextImeis[i] = e.target.value;
                                                        setCurrentItem((prev) => ({ ...prev, imeis: nextImeis }));
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase text-slate-500">To Branch</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase text-slate-500">Product</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase text-slate-500">Batch/Expiry</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase text-slate-500">Type/IMEI</th>
                                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase text-slate-500">Qty</th>
                                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase text-slate-500">Unit Cost</th>
                                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase text-slate-500">Selling</th>
                                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase text-slate-500">Total</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-bold uppercase text-slate-500">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {formData.items.map((line, idx) => (
                                        <tr key={`${line.product_id}-${line.branch_id}-${idx}`} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-semibold text-indigo-700">{line.branch_name}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-800">{line.product_name}</td>
                                            <td className="px-4 py-3 text-xs text-slate-600">{line.batch_code || '-'} {line.expiry_date ? `| EXP: ${line.expiry_date}` : ''}</td>
                                            <td className="px-4 py-3 text-xs text-slate-600">
                                                <div className="font-semibold text-slate-700 uppercase">{line.item_type || 'normal'}</div>
                                                {line.item_type === 'imei' && Array.isArray(line.imeis) && line.imeis.length > 0 && (
                                                    <div className="mt-1 text-[10px] text-indigo-700">{line.imeis.filter((x) => String(x || '').trim()).slice(0, 2).join(', ')}{line.imeis.filter((x) => String(x || '').trim()).length > 2 ? ' ...' : ''}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-indigo-700">{line.quantity}</td>
                                            <td className="px-4 py-3 text-right text-slate-600">{Number(line.unit_price).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right text-slate-600">{Number(line.selling_price || 0).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-900">LKR {Number(line.subtotal).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => handleRemoveItem(idx)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {formData.items.length === 0 && (
                                        <tr>
                                            <td colSpan="9" className="px-4 py-8 text-center text-gray-500">No dispatch lines added yet</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
                        <h3 className="text-lg font-semibold mb-3">Branch Dispatch Summary</h3>
                        <div className="text-xs font-semibold text-gray-700 mb-3 rounded-lg bg-blue-50 border border-blue-100 p-2">
                            FROM: Warehouse
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm"><span>Total Lines</span><span className="font-semibold">{formData.items.length}</span></div>
                            <div className="flex justify-between text-sm"><span>Total Quantity</span><span className="font-semibold">{formData.items.reduce((s, i) => s + Number(i.quantity || 0), 0)}</span></div>
                            <div className="flex justify-between text-base font-bold border-t pt-2"><span>Total Value</span><span>LKR {calculateTotal().toFixed(2)}</span></div>
                        </div>

                        <div className="space-y-2 mb-5">
                            {Object.keys(dispatchSummaryByBranch).length === 0 && (
                                <div className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-3">
                                    Add dispatch lines to see branch movement summary.
                                </div>
                            )}
                            {Object.entries(dispatchSummaryByBranch).map(([branchId, summary]) => (
                                <div key={branchId} className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                                    <div className="text-sm font-semibold text-gray-900">TO: {summary.branchName}</div>
                                    <div className="text-xs text-gray-600 mt-1">Lines: {summary.totalLines} | Qty: {summary.totalQty} | Value: LKR {summary.totalValue.toFixed(2)}</div>
                                    <div className="text-xs text-gray-700 mt-2">Warehouse: -{summary.totalQty} | {summary.branchName}: +{summary.totalQty}</div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full bg-brand-primary text-white py-3 rounded-lg font-semibold hover:bg-brand-secondary flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                <Save size={18} /> Dispatch Items
                            </button>
                            <button
                                onClick={() => setFormData((prev) => ({ ...prev, items: [] }))}
                                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50"
                            >
                                Clear Dispatch Lines
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-slate-50 border-b border-gray-200">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <History size={20} className="text-emerald-600" /> Dispatch History
                        </h3>
                        <button
                            type="button"
                            onClick={exportHistoryPdf}
                            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100"
                        >
                            <FileText size={14} /> Download PDF
                        </button>
                    </div>
                </div>

                <div className="px-6 py-4 border-b border-gray-200 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status</label>
                            <select className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={historyStatusFilter} onChange={(e) => setHistoryStatusFilter(e.target.value)}>
                                <option value="">All</option>
                                <option value="APPROVED">Approved</option>
                                <option value="PENDING">Pending</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">To Branch</label>
                            <select className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={historyBranchFilter} onChange={(e) => setHistoryBranchFilter(e.target.value)}>
                                <option value="">All Branches</option>
                                {branches.map((b) => (
                                    <option key={b.branch_id} value={b.branch_id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">From Date</label>
                            <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={historyDateFrom} onChange={(e) => setHistoryDateFrom(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">To Date</label>
                            <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={historyDateTo} onChange={(e) => setHistoryDateTo(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Search</label>
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg pl-8 p-2 text-sm"
                                    placeholder="Dispatch/supplier/item name"
                                    value={historySearchQuery}
                                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Dispatch No</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">To</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Item Name</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Selling Price (Unit)</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {paginatedHistory.length > 0 ? (
                            paginatedHistory.map((dispatch) => (
                                <tr key={dispatch.dispatch_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-mono font-medium text-brand-primary">{dispatch.invoice_no || dispatch.dispatch_no}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{branches.find((b) => String(b.branch_id) === String(dispatch.branch_id))?.name || `Branch ${dispatch.branch_id}`}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {(() => {
                                            const lineItems = dispatch.items || [];
                                            const firstItem = lineItems[0];
                                            if (!firstItem) return '-';
                                            const productName =
                                                firstItem.product_name ||
                                                firstItem.productName ||
                                                items.find((p) => String(p.product_id) === String(firstItem.product_id || firstItem.productId))?.name ||
                                                `Product ${firstItem.product_id || firstItem.productId}`;

                                            if (lineItems.length === 1) return productName;
                                            return `${productName} +${lineItems.length - 1} more`;
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-semibold">
                                        {(dispatch.items || []).reduce((sum, item) => sum + Number(item.qty_received || item.quantity || 0), 0)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(dispatch.dispatch_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm font-mono text-right font-medium text-gray-900">
                                        {(() => {
                                            const firstItem = (dispatch.items || [])[0];
                                            if (!firstItem) return 'LKR 0.00';
                                            const selling = Number(firstItem.selling_price || firstItem.sellingPrice || firstItem.unit_price || 0);
                                            return `LKR ${selling.toFixed(2)}`;
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full inline-block ${
                                            dispatch.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                            dispatch.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                            dispatch.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {dispatch.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <History size={40} className="text-gray-300 mb-3" />
                                        <p className="text-base font-medium text-gray-900">No dispatch records found</p>
                                        <p className="text-sm text-gray-500 mt-1">Dispatch items to populate history.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <Pagination
                    currentPage={historyPage}
                    totalPages={Math.ceil(historyFiltered.length / historyPerPage)}
                    onPageChange={setHistoryPage}
                    totalItems={historyFiltered.length}
                    itemsPerPage={historyPerPage}
                    setItemsPerPage={setHistoryPerPage}
                />
            </div>
        </div>
    );
};

export default ItemDispatcherScreen;

