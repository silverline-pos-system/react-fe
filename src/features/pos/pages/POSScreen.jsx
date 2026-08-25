import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_V1 } from '@/lib/config';
import { User, LogOut, Bell, Store, Receipt, FileText } from 'lucide-react';
import BillPanel from '@/features/pos/components/BillPanel';
import ControlPanel from '@/features/pos/components/ControlPanel';
import ProductGrid from '@/features/pos/components/ProductGrid';
import { posService } from '@/features/pos/services/posService';
import { authService } from '@/features/auth/services/authService';
import { poService } from '@/features/procurement/services/poService';
import { servicesService } from '@/shared/services/servicesService';
import { getApprovals } from '@/features/manager/services/managerService';
import { NotificationProvider, useNotification } from '@/features/pos/context/NotificationContext';
import NotificationPanel from '@/features/pos/components/NotificationPanel';
import { printReceiptPDF, printShiftSummary, printPayInOutReceipt } from '@/features/pos/utils/receiptPrinter';
import { useFeatures } from '@/context/FeatureContext';
import { useSystemName } from '@/context/SystemNameContext';
import SecondaryRoleBanner from '@/shared/components/SecondaryRoleBanner';

// Modals
import PriceCheckModal from '@/features/pos/modals/PriceCheckModal';
import LoyaltyModal from '@/features/pos/modals/LoyaltyModal';
import LoyaltyRedeemModal from '@/features/pos/modals/LoyaltyRedeemModal';
import IOModal from '@/features/pos/modals/IOModal';
import RegisterModal from '@/features/pos/modals/RegisterModal';
import ConfirmModal from '@/features/pos/modals/ConfirmModal';
import ListModal from '@/features/pos/modals/ListModal';
import FloatModal from '@/features/pos/modals/FloatModal';
import EndShiftModal from '@/features/pos/modals/EndShiftModal';
import PaymentModal from '@/features/pos/modals/PaymentModal';
import QuickAddModal from '@/features/pos/modals/QuickAddModal';
import ReloadModal from '@/features/pos/modals/ReloadModal'; // Added ReloadModal
import CashierSummaryModal from '@/features/pos/modals/CashierSummaryModal';
import ReturnModal from '@/features/pos/modals/ReturnModal';
import SmartReturnModal from '@/features/pos/modals/SmartReturnModal';
import DiscountModal from '@/features/pos/modals/DiscountModal';
import SupplierPaymentModal from '@/features/pos/modals/SupplierPaymentModal';
import DtvRequestModal from '@/features/pos/modals/DtvRequestModal';
import MobileRepairModal from '@/features/pos/modals/MobileRepairModal';
import PriceSelectionModal from '@/features/pos/modals/PriceSelectionModal';
import SerialSelectionModal from '@/features/pos/modals/SerialSelectionModal';

// Get branch from localStorage or use defaults
const getBranchId = () => {
    const user = localStorage.getItem('user');
    if (user) {
        const parsed = JSON.parse(user);
        return parsed.branchId || 1;
    }
    return 1;
};

function POSContent() {
    const navigate = useNavigate();
    const { isFeatureActive } = useFeatures();
    const { systemName } = useSystemName();
    // Check if out-of-stock sales are allowed via feature flag
    const isOosAllowed = isFeatureActive('ALLOW_OUT_OF_STOCK');
    const [branchId, setBranchId] = useState(getBranchId());
    const [session, setSession] = useState({
        isOpen: false,
        cashier: "--",
        shiftId: null,
        userId: null
    });
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('pos_cart_draft');
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [customer, setCustomer] = useState(() => {
        const savedCustomer = localStorage.getItem('pos_customer_draft');
        return savedCustomer ? JSON.parse(savedCustomer) : null;
    });
    const [inputBuffer, setInputBuffer] = useState("");
    const [invoiceId, setInvoiceId] = useState(() => {
        return localStorage.getItem('pos_invoice_draft') || "INV-READY";
    });
    const [nextInvoiceNo, setNextInvoiceNo] = useState(1); // Track next invoice number
    const [shiftTotals, setShiftTotals] = useState(null);
    const [branchInfo, setBranchInfo] = useState({ name: "Loading...", code: "" });

    // Auto-save drafts to localStorage
    useEffect(() => {
        if (cart.length > 0) {
            localStorage.setItem('pos_cart_draft', JSON.stringify(cart));
        } else {
            localStorage.removeItem('pos_cart_draft');
        }

        if (customer) {
            localStorage.setItem('pos_customer_draft', JSON.stringify(customer));
        } else {
            localStorage.removeItem('pos_customer_draft');
        }

        if (invoiceId && invoiceId !== "INV-READY") {
            localStorage.setItem('pos_invoice_draft', invoiceId);
        } else {
            localStorage.removeItem('pos_invoice_draft');
        }
    }, [cart, customer, invoiceId]);

    const [activeModal, setActiveModal] = useState(null); // Wait for shift check before showing FLOAT
    const [confirmConfig, setConfirmConfig] = useState(null); // { title: "", message: "", onYes: () => {} }
    const [listConfig, setListConfig] = useState(null); // Settings for the ListModal
    const [returnSource, setReturnSource] = useState(null); // Invoice selected for return

    const handlePromptForSerial = (index) => {
        setPendingSerialIndex(index);
        setSerialModalOpen(true);
    };

    const handleSerialSelect = (serial) => {
        if (pendingSerialIndex === null) return;

        // Prevent duplicate IMEI selection
        const duplicate = cart.find((item, idx) => 
            idx !== pendingSerialIndex && 
            item.isSerialized && 
            (item.serialId === serial.serialId || item.serialNo === serial.serialNo)
        );
        if (duplicate) {
            addNotification('error', 'Duplicate IMEI', `IMEI: ${serial.serialNo} is already linked to another item in the cart.`);
            return;
        }
        
        setCart(prev => {
            const updated = [...prev];
            if (updated[pendingSerialIndex]) {
                updated[pendingSerialIndex] = {
                    ...updated[pendingSerialIndex],
                    serialId: serial.serialId,
                    serialNo: serial.serialNo,
                    selectedSerialId: serial.serialId // Backwards compatibility
                };
            }
            return updated;
        });
        
        setSerialModalOpen(false);
        setPendingSerialIndex(null);
        addNotification('success', 'Serial Selected', `IMEI: ${serial.serialNo} linked to item`);
    };

    // Track active sale ID for updates (Held/Recall flow)
    const [currentSaleId, setCurrentSaleId] = useState(null);
    const [editingCartIndex, setEditingCartIndex] = useState(null);
    const [selectedCartIndex, setSelectedCartIndex] = useState(null);
    const [quickGridRefresh, setQuickGridRefresh] = useState(0);
    const [time, setTime] = useState(new Date());
    const [cashierSummary, setCashierSummary] = useState(null);
    const [cashierSummaryLoading, setCashierSummaryLoading] = useState(false);
    const [billDiscount, setBillDiscount] = useState(0); // Bill-level discount amount
    const [pendingMultiPriceProduct, setPendingMultiPriceProduct] = useState(null);
    const [pendingSerialIndex, setPendingSerialIndex] = useState(null);
    const [serialModalOpen, setSerialModalOpen] = useState(false);

    const [showSupplierPaymentModal, setShowSupplierPaymentModal] = useState(false);
    const [supplierPaymentCount, setSupplierPaymentCount] = useState(0);
    const [approvedPayouts, setApprovedPayouts] = useState([]);
    const [rejectedPayouts, setRejectedPayouts] = useState([]);
    const [showApprovedPayoutModal, setShowApprovedPayoutModal] = useState(false);
    const [showRejectedPayoutModal, setShowRejectedPayoutModal] = useState(false);
    const [processingPayoutId, setProcessingPayoutId] = useState(null);
    const [processedPayoutIds, setProcessedPayoutIds] = useState(() => {
        try {
            const raw = localStorage.getItem('pos_processed_paid_out');
            const parsed = raw ? JSON.parse(raw) : [];
            return new Set(Array.isArray(parsed) ? parsed : []);
        } catch {
            return new Set();
        }
    });

    const getServiceOverlayKey = useCallback((shiftId) => `pos_service_overlay_shift_${shiftId}`, []);

    const getServiceOverlay = useCallback((shiftId) => {
        if (!shiftId) {
            return { cashSales: 0, cardSales: 0, otherSales: 0, expectedCash: 0, totalSales: 0, transactionCount: 0, dtvSales: 0, repairSales: 0, reloadSales: 0 };
        }
        try {
            const raw = localStorage.getItem(getServiceOverlayKey(shiftId));
            const parsed = raw ? JSON.parse(raw) : null;
            if (!parsed || typeof parsed !== 'object') throw new Error('invalid');
            return {
                cashSales: Number(parsed.cashSales || 0),
                cardSales: Number(parsed.cardSales || 0),
                otherSales: Number(parsed.otherSales || 0),
                expectedCash: Number(parsed.expectedCash || 0),
                totalSales: Number(parsed.totalSales || 0),
                transactionCount: Number(parsed.transactionCount || 0),
                dtvSales: Number(parsed.dtvSales || 0),
                repairSales: Number(parsed.repairSales || 0),
                reloadSales: Number(parsed.reloadSales || 0),
            };
        } catch {
            return { cashSales: 0, cardSales: 0, otherSales: 0, expectedCash: 0, totalSales: 0, transactionCount: 0, dtvSales: 0, repairSales: 0, reloadSales: 0 };
        }
    }, [getServiceOverlayKey]);

    const mergeTotalsWithOverlay = useCallback((baseTotals, shiftId) => {
        const overlay = getServiceOverlay(shiftId);
        const base = baseTotals || {};
        return {
            ...base,
            cashSales: Number(base.cashSales || base.cashTotal || base.cashAmount || 0) + overlay.cashSales,
            cardSales: Number(base.cardSales || base.cardTotal || base.cardAmount || 0) + overlay.cardSales,
            cardTotal: Number(base.cardTotal || base.cardSales || base.cardAmount || 0) + overlay.cardSales,
            otherPayments: Number(base.otherPayments || base.otherTotal || base.qrTotal || base.qrSales || 0) + overlay.otherSales,
            totalSales: Number(base.totalSales || base.netTotal || base.netSales || 0) + overlay.totalSales,
            netTotal: Number(base.netTotal || base.totalSales || 0) + overlay.totalSales,
            transactionCount: Number(base.transactionCount || base.totalBills || base.totalTransactions || base.billCount || 0) + overlay.transactionCount,
            totalBills: Number(base.totalBills || base.transactionCount || base.totalTransactions || base.billCount || 0) + overlay.transactionCount,
            expectedCash: Number(base.expectedCash || base.expectedCashInDrawer || 0) + overlay.expectedCash,
            expectedCashInDrawer: Number(base.expectedCashInDrawer || base.expectedCash || 0) + overlay.expectedCash,
            serviceDtvSales: overlay.dtvSales,
            serviceRepairSales: overlay.repairSales,
            serviceReloadSales: overlay.reloadSales,
        };
    }, [getServiceOverlay]);

    // Calculate cart totals including discounts
    const cartTotals = useMemo(() => {
        const grossTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const itemDiscountAmount = cart.reduce((sum, item) => sum + ((item.discount || 0) * item.qty), 0);
        // Tax/VAT removed: no tax is applied to sales.
        const taxAmount = 0;
        const totalDiscount = itemDiscountAmount + billDiscount;
        const netTotal = grossTotal - totalDiscount;

        return {
            grossTotal,
            itemDiscountAmount,
            billDiscountAmount: billDiscount,
            totalDiscount,
            taxAmount,
            netTotal,
            itemCount: cart.length,
            totalQty: cart.reduce((sum, item) => sum + item.qty, 0)
        };
    }, [cart, billDiscount]);

    // Helper to refresh shift totals
    const fetchShiftTotals = async () => {
        if (session.shiftId) {
            try {
                const res = await posService.getShiftTotals(session.shiftId);
                const data = res.data?.data || res.data || {};
                setShiftTotals(mergeTotalsWithOverlay(data, session.shiftId));
            } catch (e) {
                console.error("Failed to fetch shift totals:", e);
                addNotification('error', 'Sync Failed', 'Could not refresh shift totals.');
            }
        }
    };

    const inputRef = useRef(null);
    const { addNotification, setIsOpen, unreadCount } = useNotification();

    // Fetch branch info for header display
    useEffect(() => {
        let isMounted = true;

        authService.getBranches()
            .then((branches) => {
                if (!isMounted) return;

                const branch = branches?.find((b) =>
                    String(b.id ?? b.branchId) === String(branchId)
                );

                setBranchInfo({
                    id: branch?.id ?? branch?.branchId ?? branchId,
                    branchId: branch?.id ?? branch?.branchId ?? branchId,
                    name: branch?.name || branch?.branchName || `Branch ${branchId}`,
                    code: branch?.code || branch?.branchCode || ""
                });
            })
            .catch(() => {
                if (!isMounted) return;
                setBranchInfo({ id: branchId, branchId, name: `Branch ${branchId}`, code: "" });
            });

        return () => {
            isMounted = false;
        };
    }, [branchId]);

    // Clock
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch Supplier Payment Request count
    const fetchSupplierPaymentCount = useCallback(async () => {
        try {
            const res = await poService.getPOsByStatus('TRANSFERRED_TO_CASHIER');
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
            setSupplierPaymentCount(poList.length);
        } catch (err) {
            if (err?.response?.status !== 403) {
                console.error('Failed to fetch supplier payment count:', err);
            }
        }
    }, []);

    // Initial load effects
    useEffect(() => {
        fetchSupplierPaymentCount();
        const interval = setInterval(() => {
            fetchSupplierPaymentCount();
        }, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [fetchSupplierPaymentCount]);

    const getApprovalRows = useCallback((payload) => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.data?.data)) return payload.data.data;
        if (Array.isArray(payload?.rows)) return payload.rows;
        return [];
    }, []);

    const isApprovedPaidOutApproval = useCallback((row) => {
        const status = String(row?.status || '').toUpperCase();
        const category = String(row?.category || '').toUpperCase();
        const type = String(row?.type || row?.flowType || '').toUpperCase();
        const text = `${row?.reason || ''} ${row?.description || ''} ${row?.notes || ''}`.toUpperCase();
        const isPaidOutLike =
            category.includes('PAID_OUT') ||
            category.includes('CASH_FLOW_PAID_OUT') ||
            type.includes('PAID_OUT') ||
            text.includes('PAID_OUT') ||
            text.includes('PAYOUT') ||
            text.includes('CASH OUT') ||
            text.includes('CASH_OUT');
        return status === 'APPROVED' && isPaidOutLike;
    }, []);

    const isRejectedPaidOutApproval = useCallback((row) => {
        const status = String(row?.status || '').toUpperCase();
        const category = String(row?.category || '').toUpperCase();
        const type = String(row?.type || row?.flowType || '').toUpperCase();
        const text = `${row?.reason || ''} ${row?.description || ''} ${row?.notes || ''}`.toUpperCase();
        const isPaidOutLike =
            category.includes('PAID_OUT') ||
            category.includes('CASH_FLOW_PAID_OUT') ||
            type.includes('PAID_OUT') ||
            text.includes('PAID_OUT') ||
            text.includes('PAYOUT') ||
            text.includes('CASH OUT') ||
            text.includes('CASH_OUT');
        return status === 'REJECTED' && isPaidOutLike;
    }, []);

    const fetchApprovedPayouts = useCallback(async () => {
        try {
            const response = await getApprovals();
            const rows = getApprovalRows(response);
            const list = rows.filter(isApprovedPaidOutApproval);
            setApprovedPayouts(list.filter((r) => !processedPayoutIds.has(r.id)));
            const rejectedList = rows.filter(isRejectedPaidOutApproval);
            setRejectedPayouts(rejectedList);
        } catch (err) {
            if (err?.response?.status !== 403) {
                console.error('Failed to fetch approved payouts:', err);
            }
        }
    }, [getApprovalRows, isApprovedPaidOutApproval, isRejectedPaidOutApproval, processedPayoutIds]);

    useEffect(() => {
        fetchApprovedPayouts();
        const interval = setInterval(fetchApprovedPayouts, 60000);
        return () => clearInterval(interval);
    }, [fetchApprovedPayouts]);

    const handleProcessApprovedPayout = async (row) => {
        try {
            setProcessingPayoutId(row.id);
            const amount = Number(row.amount || 0);
            const reasonText = String(row.reason || row.description || row.notes || 'Approved payout').replace(/\[TAKEN_BY_MANAGER\]\s*/gi, '').trim();

            await printPayInOutReceipt({
                type: 'PAID_OUT',
                amount,
                reason: reasonText,
                referenceNo: row.referenceNo || row.id,
                cashierName: session.cashier,
                branchInfo,
            });

            setProcessedPayoutIds((prev) => {
                const next = new Set(prev);
                next.add(row.id);
                localStorage.setItem('pos_processed_paid_out', JSON.stringify(Array.from(next)));
                return next;
            });

            setApprovedPayouts((prev) => prev.filter((item) => item.id !== row.id));
            addNotification('success', 'Payout Completed', `Paid-out receipt printed for approval #${row.id}.`);
        } catch (err) {
            console.error('Failed to process approved payout:', err);
            addNotification('error', 'Payout Failed', err?.message || 'Failed to print payout receipt.');
        } finally {
            setProcessingPayoutId(null);
        }
    };

    useEffect(() => {
        if (selectedCartIndex === null || selectedCartIndex === undefined) return;
        if (selectedCartIndex < 0 || selectedCartIndex >= cart.length) {
            setSelectedCartIndex(null);
        }
    }, [cart, selectedCartIndex]);

    // Check for active shift on mount (Persistence)
    const initRef = useRef(false);
    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;

        const checkActiveShift = async () => {
            try {
                if (session.isOpen) return;

                let userId = null;
                let userObj = null;
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    try {
                        userObj = JSON.parse(userStr);
                        userId = userObj.id || userObj.userId;
                    } catch (e) { console.error("Error parsing user", e); }
                }

                const res = await posService.getCurrentShift(userId);
                const shift = res.data?.data || res.data;

                if (shift && shift.shiftId) {
                    console.log("Restoring active shift:", shift);

                    let cashierName = shift.cashierName;
                    if ((!cashierName || cashierName === "Restored User") && userObj) {
                        cashierName = userObj.username || userObj.name;
                    }

                    setSession({
                        isOpen: true,
                        cashier: cashierName || "Unknown User",
                        userId: shift.cashierId,
                        shiftId: shift.shiftId,
                        shiftNo: shift.shiftNo
                    });

                    setActiveModal(null);
                    addNotification('info', 'Session Restored', `Resumed Shift #${shift.shiftId}`);
                } else {
                    setActiveModal('FLOAT');
                }
            } catch {
                console.log("No active shift found, waiting for login.");
                setActiveModal('FLOAT');
            }
        };

        checkActiveShift();
    }, []);

    // Fetch next invoice number from backend
    useEffect(() => {
        const fetchNextInvoice = async () => {
            if (session.isOpen) {
                try {
                    const res = await posService.getLastInvoiceNumber(session.branchId || 1);
                    const lastInvoice = res.data?.data || res.data;

                    let lastNum = 0;
                    if (lastInvoice) {
                        if (typeof lastInvoice === 'number') {
                            lastNum = lastInvoice;
                        } else if (lastInvoice.nextSequence) {
                            lastNum = lastInvoice.nextSequence - 1;
                        } else if (typeof lastInvoice === 'string') {
                            const match = lastInvoice.match(/(\d+)$/);
                            lastNum = match ? parseInt(match[1]) : 0;
                        } else if (lastInvoice.invoiceNo) {
                            const match = lastInvoice.invoiceNo.match(/(\d+)$/);
                            lastNum = match ? parseInt(match[1]) : 0;
                        } else if (lastInvoice.lastNumber !== undefined) {
                            lastNum = lastInvoice.lastNumber;
                        }
                    }

                    setNextInvoiceNo(lastNum + 1);
                } catch (e) {
                    console.error("Failed to fetch next invoice no", e);
                }
            }
        };
        fetchNextInvoice();
    }, [session.isOpen]);

    // Generate invoice ID using next sequential number
    useEffect(() => {
        if (session.isOpen) {
            const today = new Date();
            const datePart = today.getFullYear().toString() +
                String(today.getMonth() + 1).padStart(2, '0') +
                String(today.getDate()).padStart(2, '0');

            const numPart = String(nextInvoiceNo).padStart(5, '0');
            const formattedId = `INV-${datePart}-${numPart}`;

            if (!currentSaleId && (invoiceId === 'INV-READY' || invoiceId !== formattedId)) {
                setInvoiceId(formattedId);
            }
        }
    }, [session.isOpen, nextInvoiceNo, currentSaleId, invoiceId]);

    // Block refresh while shift is open
    useEffect(() => {
        const handleKeyDownBlocker = (e) => {
            if (!session.isOpen) return;
            if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'r')) {
                e.preventDefault();
                addNotification('warning', 'Action Blocked', 'Refreshing is disabled while the shift is open.');
            }
        };
        const handleBeforeUnload = (e) => {
            if (!session.isOpen) return;
            e.preventDefault();
            e.returnValue = '';
            return '';
        };
        window.addEventListener('keydown', handleKeyDownBlocker);
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('keydown', handleKeyDownBlocker);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [session.isOpen, addNotification]);

    // --- HANDLER: OPEN SHIFT ---
    const handleLogin = async (cashierObj, amount, supervisorCreds, denominations = null, selectedBranchId = null) => {
        try {
            const authRes = await authService.login({
                username: supervisorCreds.username,
                password: supervisorCreds.password
            });
            const approver = authRes.data || authRes;

            console.log("Supervisor Auth Response:", approver);

            const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'SUPERVISOR'];
            const approverRole = (approver.role || approver.userRole || "").toUpperCase();

            if (!allowedRoles.includes(approverRole)) {
                addNotification('error', 'Access Denied',
                    `User '${approver.username || supervisorCreds.username}' is a ${approverRole || 'CASHIER'} and cannot approve shifts. Only Manager or Supervisor can approve.`);
                throw new Error("Insufficient Permissions");
            }

            const payload = {
                cashierId: cashierObj.id,
                branchId: selectedBranchId || branchId,
                openingCash: parseFloat(amount),
                supervisorUsername: supervisorCreds.username,
                supervisorPassword: supervisorCreds.password,
                approvedBy: approver.userId || approver.id
            };

            if (denominations && denominations.length > 0) {
                payload.denominations = denominations;
            }

            const res = await posService.openShift(payload);
            const data = res.data?.data || res.data;

            console.log("Shift Open Response:", data);

            let theShiftId = null;
            let shiftNo = null;
            if (typeof data === 'number') {
                theShiftId = data;
            } else if (data && typeof data === 'object') {
                theShiftId = data.shiftId || data.id || data.shift_id;
                shiftNo = data.shiftNo || data.shift_no;
            }

            if (!theShiftId) throw new Error("Invalid Shift ID received.");

            setSession({
                isOpen: true,
                cashier: cashierObj.name,
                shiftId: theShiftId,
                shiftNo: shiftNo || `SH-${theShiftId}`,
                userId: cashierObj.id,
                branchId: selectedBranchId || branchId
            });

            if (selectedBranchId) setBranchId(selectedBranchId);

            try {
                const invoiceRes = await posService.getLastInvoiceNumber(selectedBranchId || branchId);
                const lastInvoice = invoiceRes.data?.data || invoiceRes.data;
                let lastNum = 0;

                if (lastInvoice) {
                    if (typeof lastInvoice === 'number') {
                        lastNum = lastInvoice;
                    } else if (typeof lastInvoice === 'string') {
                        const match = lastInvoice.match(/(\d+)$/);
                        lastNum = match ? parseInt(match[1]) : 0;
                    } else if (lastInvoice.invoiceNo) {
                        const match = lastInvoice.invoiceNo.match(/(\d+)$/);
                        lastNum = match ? parseInt(match[1]) : 0;
                    } else if (lastInvoice.lastNumber !== undefined) {
                        lastNum = lastInvoice.lastNumber;
                    }
                }

                setNextInvoiceNo(lastNum + 1);
                console.log("Next Invoice Number:", lastNum + 1);
            } catch (invErr) {
                console.warn("Could not fetch last invoice number, starting from 1:", invErr);
                setNextInvoiceNo(1);
            }

            setActiveModal(null);
            addNotification('success', 'Shift Opened', `Shift #${theShiftId} started successfully. Approved by ${approver.username || supervisorCreds.username}.`);
        } catch (err) {
            console.error("Shift Open Error:", err);
            if (err.message === "Insufficient Permissions") {
                // Already handled
            } else if (err.response?.status === 401 || err.response?.status === 403) {
                addNotification('error', 'Verification Failed', 'Invalid Supervisor Username or Password.');
            } else if (err.response?.status === 400) {
                const msg = err.response?.data?.message || err.response?.data?.error || 'Invalid request data';
                addNotification('error', 'Validation Error', msg);
            } else {
                const msg = err.response?.data?.message || err.message || 'Failed to open shift';
                addNotification('error', 'Login Error', msg);
            }
            throw err;
        }
    };

    // --- HANDLER: CLOSE SHIFT ---
    const handleLogout = async (closingAmount, supervisorCreds, denominations = null) => {
        try {
            const authRes = await authService.login({
                username: supervisorCreds.username,
                password: supervisorCreds.password
            });
            const approver = authRes.data || authRes;

            const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'SUPERVISOR'];
            const approverRole = (approver.role || approver.userRole || "").toUpperCase();

            if (!allowedRoles.includes(approverRole)) {
                throw new Error(`Access Denied: ${approverRole} cannot approve shift end.`);
            }

            await posService.closeShift(session.shiftId, {
                closingCash: parseFloat(closingAmount),
                denominations: denominations,
                notes: "Shift Closed",
                supervisorUsername: supervisorCreds.username,
                supervisorPassword: supervisorCreds.password,
                approvedBy: approver.userId || approver.id
            });

            try {
                printShiftSummary({
                    cashierName: session.cashier,
                    shiftId: session.shiftId,
                    shiftTotals: shiftTotals || {},
                    closingCash: parseFloat(closingAmount),
                    denominations: denominations || [],
                    branchInfo: branchInfo,
                });
            } catch (printErr) {
                console.error('Shift summary print failed:', printErr);
            }

            setSession({
                isOpen: false,
                cashier: "--",
                shiftId: null,
                userId: null
            });
            
            try {
                const userObj = JSON.parse(localStorage.getItem('user') || '{}');
                const token = localStorage.getItem('token');
                await fetch(`${API_V1}/manager/activity/log`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({
                        branchId: branchId || 1,
                        userId: userObj.userId || userObj.id || session.userId,
                        username: userObj.username || session.cashier,
                        role: userObj.role || userObj.userRole || 'CASHIER',
                        actionType: 'LOGOUT',
                        details: `User logged out: ${userObj.username || session.cashier}`,
                        metadata: "{}"
                    })
                });
            } catch (e) {
                console.error("Failed to log LOGOUT", e);
            }

            localStorage.removeItem('pos_notifications');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('selectedBranchId');

            addNotification('success', 'Shift Closed', 'Redirecting to login...');
            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 1000);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Logout failed';
            addNotification('error', 'Logout Error', msg);
            throw new Error(msg);
        }
    };

    // --- HANDLER: ADD PRODUCT TO CART ---
    const handleAddToCart = async (productInput) => {
        if (!productInput) return;

        try {
            let rawData;

            if (typeof productInput === 'object' && productInput !== null) {
                rawData = productInput;
                
                if (!rawData.isService) {
                    const identifier = rawData.barcode || rawData.sku || rawData.productId || rawData.id;
                    if (identifier) {
                        try {
                            const res = await posService.getProduct(identifier);
                            const fullData = res.data?.data || res.data;
                            if (fullData) {
                                rawData = { ...rawData, ...fullData };
                            }
                        } catch (e) {
                            console.warn("Could not fetch full product details, falling back to basic data", e);
                        }
                    }
                }
            } else {
                const productCode = String(productInput).trim();
                if (!productCode) return;

                console.log("Scanning product code:", productCode);

                const res = await posService.getProduct(productCode, branchId);
                rawData = res.data?.data || res.data;

                console.log("Product API response:", rawData);

                if (!rawData) {
                    throw new Error("Product not found");
                }
            }

            const rawStock = rawData.availableStock ?? rawData.stockQty ?? rawData.quantity ?? rawData.stock;
            let product = {
                id: rawData.productId || rawData.id,
                name: rawData.name || rawData.productName,
                price: parseFloat(rawData.sellingPrice ?? rawData.selling_price ?? rawData.price ?? rawData.unitPrice ?? rawData.unit_price ?? 0),
                costPrice: parseFloat(rawData.costPrice ?? rawData.cost_price ?? 0),
                sku: rawData.sku,
                barcode: rawData.barcode,
                taxRate: parseFloat(rawData.taxRate || 0),
                availableStock: rawStock != null ? parseFloat(rawStock) : 0,
                qty: 1,
                discount: 0,
                isService: rawData.isService || false,
                isSerialized: rawData.isSerialized || false,
                serialId: rawData.selectedSerialId || null,
                serialNo: rawData.serialNo || null,
                batchId: rawData.selectedBatchId || null,
                dtvData: rawData.dtvData || null,
                repairData: rawData.repairData || null
            };

            // Prevent duplicate IMEI scanning in the current transaction
            if (product.isSerialized && product.serialId) {
                const duplicate = cart.find(item => 
                    item.isSerialized && 
                    (item.serialId === product.serialId || item.serialNo === product.serialNo)
                );
                if (duplicate) {
                    addNotification('error', 'Duplicate IMEI', `IMEI: ${product.serialNo} is already added to the cart.`);
                    return;
                }
            }

            if (!product.isService && !(product.isSerialized && product.serialId)) {
                if (rawData.availablePrices && rawData.availablePrices.length > 0) {
                    const priceGroupsMap = new Map();
                    for (const batch of rawData.availablePrices) {
                        if (batch.sellingPrice == null) continue;
                        const priceKey = parseFloat(batch.sellingPrice).toFixed(2);
                        if (!priceGroupsMap.has(priceKey)) {
                            priceGroupsMap.set(priceKey, {
                                sellingPrice: parseFloat(batch.sellingPrice),
                                mrp: batch.mrp ? parseFloat(batch.mrp) : null,
                                totalStock: 0,
                                primaryBatchId: batch.batchId,
                                batches: []
                            });
                        }
                        const group = priceGroupsMap.get(priceKey);
                        group.totalStock += parseFloat(batch.stockQty || 0);
                        group.batches.push(batch);
                    }

                    const uniquePriceGroups = Array.from(priceGroupsMap.values());

                    if (uniquePriceGroups.length > 1) {
                        setPendingMultiPriceProduct({ productData: rawData, options: uniquePriceGroups, baseProduct: product });
                        setActiveModal('PRICE_SELECT');
                        return;
                    } else if (uniquePriceGroups.length === 1) {
                        product.price = uniquePriceGroups[0].sellingPrice;
                        product.batchId = uniquePriceGroups[0].primaryBatchId;
                        product.availableStock = uniquePriceGroups[0].totalStock;
                    }
                }
            }

            if (!product.id && !product.sku && !product.barcode) {
                throw new Error("Invalid product data - no identifier");
            }

            if (!product.name) {
                throw new Error("Invalid product data - no name");
            }

            if (!product.id) {
                product.id = product.sku || product.barcode;
            }

            const processAdd = () => {
                let notification = null;
                let newCartLength = 0;
                setCart(prev => {
                    const existingIndex = product.isSerialized ? -1 : prev.findIndex(item =>
                        !item.isService && !product.isService && 
                        !item.isSerialized && !product.isSerialized && (
                            item.id === product.id ||
                            (item.barcode && item.barcode === product.barcode) ||
                            (item.sku && item.sku === product.sku)
                        ) && Math.abs(item.price - product.price) < 0.01
                    );

                    if (existingIndex >= 0) {
                        const updated = [...prev];
                        const newQty = updated[existingIndex].qty + 1;
                        updated[existingIndex] = { ...updated[existingIndex], qty: newQty };
                        notification = { type: 'info', title: 'Quantity Updated', message: `${product.name} x${newQty}` };
                        newCartLength = updated.length;
                        return updated;
                    }
                    notification = { type: 'success', title: 'Item Added', message: `${product.name} added to cart` };
                    newCartLength = prev.length + 1;
                    return [...prev, product];
                });

                if (product.isSerialized && !product.selectedSerialId && !product.serialId) {
                    setTimeout(() => {
                        handlePromptForSerial(newCartLength - 1); 
                    }, 500);
                }

                setTimeout(() => {
                    if (notification) addNotification(notification.type, notification.title, notification.message);
                    inputRef.current?.focus();
                }, 10);
            };

            const existingCartItem = cart.find(item =>
                !item.isService && !product.isService && !item.isSerialized && !product.isSerialized && (
                    item.id === product.id ||
                    (item.barcode && item.barcode === product.barcode) ||
                    (item.sku && item.sku === product.sku)
                ) && Math.abs(item.price - product.price) < 0.01
            );
            
            const currentQty = existingCartItem ? existingCartItem.qty : 0;
            const newQty = currentQty + 1;
            const stock = product.availableStock;

            if (!product.isService && stock != null && newQty > stock) {
                if (isOosAllowed) {
                    showConfirm(
                        stock <= 0 ? "Out of Stock" : "Stock Limit Exceeded", 
                        stock <= 0 
                            ? `'${product.name}' is out of stock. Allow negative stock sale?`
                            : `Only ${stock} units available. Sell ${newQty} units anyway?`,
                        () => {
                            processAdd();
                        },
                        true
                    );
                } else {
                    if (stock <= 0) {
                        addNotification('error', 'Out of Stock', `'${product.name}' is out of stock and cannot be sold.`);
                    } else {
                        addNotification('warning', 'Stock Limit', `Only ${stock} units of '${product.name}' available.`);
                    }
                }
                return;
            }

            processAdd();
        } catch (err) {
            console.error("Add to cart error:", err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
            const code = typeof productInput === 'object' ? (productInput?.sku || productInput?.barcode) : productInput;
            addNotification('error', 'Product Not Found', errorMsg || `Code '${code}' is invalid or not available.`);
        }
    };

    // Handle multi-price selection
    const _handleAddMultiPriceProduct = (selectedPrice) => {
        if (!pendingMultiPriceProduct) return;
        const { baseProduct, options } = pendingMultiPriceProduct;

        const priceGroup = options.find(g => Math.abs(g.sellingPrice - parseFloat(selectedPrice)) < 0.01);

        baseProduct.price = parseFloat(selectedPrice);
        if (priceGroup) {
            baseProduct.batchId = priceGroup.primaryBatchId;
            baseProduct.availableStock = priceGroup.totalStock;
        }

        const processAddMulti = () => {
            let notification = null;
            let newCartLength = 0;
            setCart(prev => {
                const existingIndex = baseProduct.isSerialized ? -1 : prev.findIndex(item =>
                    !item.isService && (
                        item.id === baseProduct.id ||
                        (item.barcode && item.barcode === baseProduct.barcode) ||
                        (item.sku && item.sku === baseProduct.sku)
                    ) && Math.abs(item.price - baseProduct.price) < 0.01
                );

                if (existingIndex >= 0) {
                    const updated = [...prev];
                    const newQty = updated[existingIndex].qty + 1;
                    updated[existingIndex] = { ...updated[existingIndex], qty: newQty };
                    notification = { type: 'info', title: 'Quantity Updated', message: `${baseProduct.name} x${newQty}` };
                    newCartLength = updated.length;
                    return updated;
                }

                notification = { type: 'success', title: 'Item Added', message: `${baseProduct.name} — LKR ${parseFloat(selectedPrice).toFixed(2)}` };
                newCartLength = prev.length + 1;
                return [...prev, baseProduct];
            });

            if (baseProduct.isSerialized) {
                setTimeout(() => {
                    handlePromptForSerial(newCartLength - 1);
                }, 500);
            }

            setTimeout(() => {
                if (notification) addNotification(notification.type, notification.title, notification.message);
                setPendingMultiPriceProduct(null);
                setActiveModal(null);
                inputRef.current?.focus();
            }, 10);
        };

        const existingCartItem = cart.find(item =>
            !item.isService && !baseProduct.isSerialized && (
                item.id === baseProduct.id ||
                (item.barcode && item.barcode === baseProduct.barcode) ||
                (item.sku && item.sku === baseProduct.sku)
            ) && Math.abs(item.price - baseProduct.price) < 0.01
        );

        const currentQty = existingCartItem ? existingCartItem.qty : 0;
        const newQty = currentQty + 1;
        const stock = baseProduct.availableStock;

        if (stock != null && newQty > stock) {
            if (isOosAllowed) {
                showConfirm(
                    stock <= 0 ? "Out of Stock" : "Stock Limit Exceeded", 
                    stock <= 0 
                        ? `'${baseProduct.name}' is out of stock at this price point. Allow negative stock sale?`
                        : `Only ${stock} units available at this price. Sell ${newQty} units anyway?`,
                    () => {
                        processAddMulti();
                    },
                    true
                );
            } else {
                if (stock <= 0) {
                    addNotification('error', 'Out of Stock', `'${baseProduct.name}' is out of stock and cannot be sold.`);
                } else {
                    addNotification('warning', 'Stock Limit', `Only ${stock} units of '${baseProduct.name}' available.`);
                }
            }
            return;
        }

        processAddMulti();

        setPendingMultiPriceProduct(null);
        inputRef.current?.focus();
    };

    const handleScan = (overrideValue) => {
        const text = (typeof overrideValue === 'string' ? overrideValue : inputBuffer).trim();

        if (!text) {
            if (cart.length > 0) {
                openPaymentModal('CASH');
            }
            return;
        }

        handleAddToCart(text);
        setInputBuffer("");
        inputRef.current?.focus();
    };

    // Stable idempotency key for one checkout attempt. A retried submit reuses it so the backend
    // returns the original sale instead of creating a duplicate; cleared on success.
    const checkoutKeyRef = useRef(null);

    const openPaymentModal = (mode = 'CASH') => {
        if (cart.length === 0) {
            addNotification('warning', 'Empty Cart', 'Add items first.');
            return;
        }
        if (!session.shiftId) {
            addNotification('error', 'System Error', 'No Active Shift.');
            return;
        }
        const hasReturnItems = cart.some(item => item.isReturn);
        if (hasReturnItems && cartTotals.netTotal <= 0) {
            addNotification('warning', 'Insufficient Items', 'Please add replacement items to cover the refund amount before checkout.');
            return;
        }
        if (!checkoutKeyRef.current) {
            checkoutKeyRef.current = (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        }
        setListConfig({ mode });
        setActiveModal('PAYMENT');
    };

    // --- HANDLER: PROCESS PAYMENT ---
    const processPayment = async (paymentDetails) => {
        const grossTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const itemDiscount = cart.reduce((sum, item) => sum + ((item.discount || 0) * item.qty), 0);
        const totalDiscount = itemDiscount + billDiscount;
        // Tax/VAT removed: no tax is applied to sales.
        const taxAmount = 0;
        const netTotal = grossTotal - totalDiscount;

        const productItems = cart.filter(item => !item.isService && !item.dtvData && !item.repairData && !item.isReturn);
        const mappedItems = productItems.map(item => ({
            productId: item.id,
            serialId: item.serialId || null,
            batchId: item.batchId || null,
            qty: item.qty,
            unitPrice: item.price,
            discount: item.discount || 0
        }));

        const paymentList = paymentDetails.payments.map(p => ({
            paymentType: p.paymentType,
            amount: p.amount,
            referenceNo: p.referenceNo || null,
            bankName: p.bankName || null,
            cardLast4: p.cardLast4 || null
        }));

        const hasServiceItems = cart.some(item => item.isService || item.dtvData || item.repairData);
        const isServiceOnly = mappedItems.length === 0 && hasServiceItems;

        const serviceTypeTotals = cart.reduce((acc, item) => {
            const line = Number(item.price || 0) * Number(item.qty || 1);
            if (item.dtvData) acc.dtv += line;
            else if (item.repairData) acc.repair += line;
            else if (item.type === 'RELOAD') acc.reload += line;
            return acc;
        }, { dtv: 0, repair: 0, reload: 0 });

        const orderData = {
            saleId: currentSaleId,
            branchId: branchId,
            cashierId: session.userId,
            customerId: customer ? customer.customerId || customer.id : null,
            shiftId: session.shiftId,
            grossTotal: grossTotal,
            discount: totalDiscount,
            taxAmount: taxAmount,
            netTotal: netTotal,
            paidAmount: paymentDetails.totalPaid,
            changeAmount: paymentDetails.changeAmount || 0,
            idempotencyKey: checkoutKeyRef.current,
            saleType: isServiceOnly ? "SERVICE" : "RETAIL",
            notes: isServiceOnly
                ? `Service payment: ${cart.map(i => i.repairData?.repairNo || i.dtvData?.refNo || (i.type === 'RELOAD' ? i.name : null) || (i.isService ? i.name : null)).filter(Boolean).join(', ')}`
                : "",
            items: mappedItems,
            payments: paymentList
        };

        try {
            const res = await posService.submitOrder(orderData);
            const data = res.data?.data || res.data;
            const finalInvoiceId = data?.invoiceNo || data?.invoice_no || invoiceId;

            setInvoiceId(finalInvoiceId);
            let loyaltyMsg = "";
            if (customer && customer.id) {
                const pointsEarned = Math.floor(netTotal / 100);
                if (pointsEarned > 0) {
                    try {
                        await posService.updateLoyaltyPoints(customer.id, pointsEarned);
                        loyaltyMsg = ` | +${pointsEarned} Points`;
                    } catch (e) {
                        console.error("Failed to update loyalty points", e);
                    }
                }
            }

            for (const item of cart) {
                if (item.dtvData) {
                    try {
                        const dtvPayload = {
                            ...item.dtvData,
                            saleId: data?.saleId || data?.id || null
                        };
                        await servicesService.createDtvService(dtvPayload);
                    } catch (dtvErr) {
                        console.error('Failed to submit deferred DTV request:', dtvErr);
                        addNotification('error', 'DTV Request Failed', 'Sale successful, but failed to log DTV request to technician. Please inform technician manually.');
                    }
                }

                if (item.repairData) {
                    try {
                        let cashierUserId = session.userId;
                        if (!cashierUserId) {
                            try {
                                const u = JSON.parse(localStorage.getItem('user'));
                                cashierUserId = u?.id || u?.userId;
                            } catch {
                                cashierUserId = null;
                            }
                        }
                        console.log('Marking repair as paid:', item.repairData.repairId, 'amount:', item.repairData.balanceDue || item.price, 'cashier:', cashierUserId);
                        await servicesService.markRepairPaid(
                            item.repairData.repairId,
                            item.repairData.balanceDue || item.price,
                            'CASH',
                            cashierUserId
                        );
                        console.log('Repair marked as DELIVERED successfully:', item.repairData.repairId);
                    } catch (repairErr) {
                        console.error('Failed to mark repair as paid:', repairErr);
                        addNotification('warning', 'Repair Update', 'Sale successful but repair status could not be updated. Please update manually.');
                    }
                }
            }

            addNotification('success', isServiceOnly ? 'Service Payment Complete' : 'Sale Complete', `Invoice: ${finalInvoiceId} | Change: LKR ${paymentDetails.changeAmount?.toFixed(2) || '0.00'}${loyaltyMsg}`);

            if (!paymentDetails.doNotPrint) {
                try {
                    printReceiptPDF({
                        invoiceId: finalInvoiceId,
                        branchInfo,
                        cashierName: session.cashier,
                        customer,
                        cart,
                        totals: cartTotals,
                        payments: paymentDetails.payments,
                        paidAmount: paymentDetails.totalPaid,
                        changeAmount: paymentDetails.changeAmount || 0,
                        billDiscount,
                    });
                } catch (printErr) {
                    console.error('Receipt print failed:', printErr);
                    addNotification('warning', 'Print Failed', 'Sale was successful but receipt could not be printed.');
                }
            } else {
                addNotification('info', 'Print Skipped', 'Receipt printing skipped.');
            }

            if (finalInvoiceId) {
                const match = finalInvoiceId.match(/(\d+)$/);
                if (match) {
                    setNextInvoiceNo(parseInt(match[1]) + 1);
                } else {
                    setNextInvoiceNo(prev => prev + 1);
                }
            } else {
                setNextInvoiceNo(prev => prev + 1);
            }

            if (isServiceOnly && session.shiftId) {
                const paymentBreakdown = paymentDetails.payments || [];
                const cashAdded = paymentBreakdown
                    .filter((p) => String(p.paymentType || '').toUpperCase() === 'CASH')
                    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
                const cardAdded = paymentBreakdown
                    .filter((p) => ['CARD', 'CREDIT_CARD', 'DEBIT_CARD'].includes(String(p.paymentType || '').toUpperCase()))
                    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
                const otherAdded = Math.max(0, Number(paymentDetails.totalPaid || 0) - cashAdded - cardAdded);

                const currentOverlay = getServiceOverlay(session.shiftId);
                const updatedOverlay = {
                    cashSales: currentOverlay.cashSales + cashAdded,
                    cardSales: currentOverlay.cardSales + cardAdded,
                    otherSales: currentOverlay.otherSales + otherAdded,
                    expectedCash: currentOverlay.expectedCash + cashAdded,
                    totalSales: currentOverlay.totalSales + Number(netTotal || 0),
                    transactionCount: currentOverlay.transactionCount + 1,
                    dtvSales: currentOverlay.dtvSales + Number(serviceTypeTotals.dtv || 0),
                    repairSales: currentOverlay.repairSales + Number(serviceTypeTotals.repair || 0),
                    reloadSales: currentOverlay.reloadSales + Number(serviceTypeTotals.reload || 0),
                };

                localStorage.setItem(getServiceOverlayKey(session.shiftId), JSON.stringify(updatedOverlay));
                setShiftTotals((prev) => mergeTotalsWithOverlay(prev || {}, session.shiftId));
                setCashierSummary((prev) => prev ? mergeTotalsWithOverlay(prev, session.shiftId) : prev);
            }

            setCart([]);
            setCustomer(null);
            setCurrentSaleId(null);
            setBillDiscount(0);
            setActiveModal(null);
            checkoutKeyRef.current = null; // fresh key for the next sale

            setTimeout(() => { setInvoiceId("INV-READY"); }, 3000);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || "Transaction failed";
            addNotification('error', 'Payment Failed', msg);
        }
    };

    const handleCartItemClick = (index) => {
        setSelectedCartIndex(index);
        if (editingCartIndex !== null && editingCartIndex !== index) {
            setEditingCartIndex(null);
        }
    };

    const handleInlineQuantityCommit = (index, rawQty) => {
        const parsed = Number(rawQty);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            addNotification('warning', 'Invalid Quantity', 'Enter a quantity greater than 0.');
            return;
        }

        const item = cart[index];
        if (item && item.availableStock != null && parsed > item.availableStock) {
            addNotification('warning', 'Stock Limit', `Only ${item.availableStock} units of '${item.name}' available.`);
            return;
        }

        setCart(prev => {
            const newCart = [...prev];
            if (!newCart[index]) return prev;
            newCart[index] = { ...newCart[index], qty: parsed };
            return newCart;
        });
        setEditingCartIndex(null);
        inputRef.current?.focus();
    };

    const handleInlineQuantityCancel = () => {
        setEditingCartIndex(null);
        inputRef.current?.focus();
    };

    const handleReloadAdd = (reloadDetails) => {
        const { provider, phoneNumber, amount } = reloadDetails;
        
        const reloadItem = {
            id: `RELOAD-${Date.now()}`,
            name: `Reload: ${provider} - ${phoneNumber}`,
            price: amount,
            qty: 1,
            isService: true,
            type: 'RELOAD',
            taxRate: 0,
            discount: 0
        };

        setCart(prev => [...prev, reloadItem]);
        setActiveModal(null);
        addNotification('success', 'Reload Added', `Added ${provider} reload of ${Number(amount).toFixed(2)}`);
    };

    const handleOpenCashierSummary = async () => {
        if (!session.shiftId) {
            addNotification('warning', 'No Active Shift', 'Open a shift to view summary.');
            return;
        }
        setActiveModal('CASHIER_SUMMARY');
        setCashierSummaryLoading(true);
        try {
            const res = await posService.getShiftTotals(session.shiftId);
            const data = res.data?.data || res.data || {};
            setCashierSummary(mergeTotalsWithOverlay(data, session.shiftId));
        } catch (e) {
            console.error('Failed to load cashier summary:', e);
            addNotification('error', 'Summary Error', e.response?.data?.message || 'Failed to load cashier summary.');
            setCashierSummary(null);
        } finally {
            setCashierSummaryLoading(false);
        }
    };

    const handleVoidItem = (index) => {
        const fallbackIndex = selectedCartIndex ?? (cart.length - 1);
        const targetIndex = index !== undefined ? index : fallbackIndex;
        if (targetIndex < 0 || targetIndex >= cart.length) return;
        const item = cart[targetIndex];
        showConfirm("Void Item", `Remove "${item.name}" from cart?`, () => {
            const newCart = [...cart];
            newCart.splice(targetIndex, 1);
            setCart(newCart);
            setSelectedCartIndex(prev => {
                if (prev === null || prev === undefined) return null;
                if (prev === targetIndex) {
                    return newCart.length ? Math.min(targetIndex, newCart.length - 1) : null;
                }
                if (prev > targetIndex) return prev - 1;
                return prev;
            });
            setActiveModal(null);
            addNotification('info', 'Item Voided', `${item.name} removed from cart.`);
        });
    };

    const handleApplyItemDiscount = (index, discountAmount) => {
        if (index < 0 || index >= cart.length) return;
        setCart(prev => {
            const newCart = [...prev];
            newCart[index] = { ...newCart[index], discount: discountAmount };
            return newCart;
        });
        addNotification('success', 'Discount Applied', `LKR ${discountAmount.toFixed(2)} discount applied.`);
    };

    const showConfirm = (title, message, onYes, isAlert = false) => {
        setConfirmConfig({ title, message, onYes, isAlert });
        setActiveModal('CONFIRM');
    };

    const handleComplexAction = async (action) => {
        if (action === 'HOLD') {
            if (cart.length === 0) return;
            showConfirm("Suspend Transaction", "Park this transaction for later?", async () => {
                try {
                    const grossTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
                    const itemDiscount = cart.reduce((sum, item) => sum + ((item.discount || 0) * item.qty), 0);
                    const totalDiscount = itemDiscount + billDiscount;
                    const taxAmount = cart.reduce((sum, item) => {
                        const itemTotal = (item.price * item.qty) - ((item.discount || 0) * item.qty);
                        return sum + (itemTotal * (item.taxRate || 0) / 100);
                    }, 0);
                    const netTotal = grossTotal - totalDiscount + taxAmount;

                    await posService.holdBill({
                        saleId: currentSaleId,
                        branchId: branchId,
                        cashierId: session.userId,
                        shiftId: session.shiftId,
                        customerId: customer?.customerId || customer?.id || null,
                        grossTotal: grossTotal,
                        discount: totalDiscount,
                        taxAmount: taxAmount,
                        netTotal: netTotal,
                        items: cart.map(item => ({
                            productId: item.id,
                            quantity: item.qty,
                            unitPrice: item.price,
                            discount: item.discount || 0,
                            taxRate: item.taxRate || 0
                        }))
                    });
                    setCart([]);
                    setCustomer(null);
                    setCurrentSaleId(null);
                    setBillDiscount(0);
                    setActiveModal(null);
                    setInvoiceId("INV-READY");
                    addNotification('info', 'Bill Held', 'Transaction parked successfully.');
                } catch (err) {
                    addNotification('error', 'Hold Failed', err.response?.data?.message || 'Could not hold bill.');
                }
            });
        }
        else if (action === 'CANCEL') {
            if (cart.length === 0) return;
            showConfirm("Cancel Transaction", "Void the entire bill?", () => {
                setCart([]);
                setCustomer(null);
                setCurrentSaleId(null);
                setBillDiscount(0);
                setActiveModal(null);
                setInvoiceId("INV-READY");
                addNotification('warning', 'Bill Cancelled', 'Transaction cleared.');
            });
        }
        else if (action === 'RECALL') {
            setListConfig({ type: 'RECALL' });
            setActiveModal('LIST');
        }
        else if (action === 'RELOAD') {
            setActiveModal('RELOAD');
        }
        else if (action === 'RETURN') {
            setActiveModal('SMART_RETURN');
        }
        else if (action === 'EXIT') {
            if (cart.length > 0) {
                showConfirm("Pending Items", "You have items in cart. Cancel them before closing shift.", null, true);
                return;
            }
            setShiftTotals(null);
            setActiveModal('END_SHIFT');
            fetchShiftTotals();
        }
        else if (action === 'PAY_CASH') { openPaymentModal('CASH'); }
        else if (action === 'PAY_CARD') { openPaymentModal('CARD'); }
        else if (action === 'PAY_QR') { openPaymentModal('QR'); }
        else if (action === 'DTV_INSTALL') {
            setActiveModal('DTV_INSTALL');
        }
        else if (action === 'REDEEM') {
            setActiveModal('REDEEM');
        }
        else if (action === 'REPAIR_LOG') {
            setActiveModal('REPAIR_LOG');
        }
    };

    const handleRecallBill = async (bill) => {
        try {
            if (listConfig?.type === 'RETURN') {
                setReturnSource(bill);
                setListConfig(null);
                setActiveModal('RETURN_DETAILS');
                return;
            }

            const res = await posService.recallBill(bill.saleId || bill.id);
            const data = res.data?.data || res.data;

            if (data.items && Array.isArray(data.items)) {
                const recalledCart = data.items.map(item => ({
                    id: item.productId,
                    name: item.productName || item.name,
                    price: item.unitPrice,
                    qty: item.quantity || item.qty,
                    discount: item.discount || 0,
                    taxRate: item.taxRate || 0
                }));
                setCart(recalledCart);
            }

            if (data.customer) {
                setCustomer({
                    id: data.customer.id || data.customer.customerId,
                    customerId: data.customer.id || data.customer.customerId,
                    name: data.customer.name,
                    phone: data.customer.phone,
                    email: data.customer.email,
                    loyaltyPoints: data.customer.loyaltyPoints || 0
                });
            } else if (data.customerId) {
                setCustomer({
                    id: data.customerId,
                    customerId: data.customerId,
                    name: data.customerName || 'Customer'
                });
            }

            if (bill.invoiceNo) setInvoiceId(bill.invoiceNo);
            if (bill.saleId || bill.id) setCurrentSaleId(bill.saleId || bill.id);

            setListConfig(null);
            setActiveModal(null);
            addNotification('success', 'Bill Recalled', `Bill #${bill.invoiceNo || bill.id} loaded.`);
        } catch (e) {
            addNotification('error', 'Recall Failed', e.response?.data?.message || 'Failed to load bill.');
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (activeModal && activeModal !== 'FLOAT') {
                if (e.key === 'Escape') { setActiveModal(null); setConfirmConfig(null); }
                return;
            }
            if (!session.isOpen) return;

            if (e.key === 'F1') { e.preventDefault(); setActiveModal('PRICE_CHECK'); }
            if (e.key === 'F3') { e.preventDefault(); handleComplexAction('RECALL'); }
            if (e.key === 'F4') { e.preventDefault(); handleComplexAction('CANCEL'); }
            if (e.key === 'F6') { e.preventDefault(); setActiveModal('PAID_IN'); }
            if (e.key === 'F7') { e.preventDefault(); setActiveModal('PAID_OUT'); }
            if (e.key === '\\') {
                if (document.activeElement.tagName !== 'INPUT') {
                    e.preventDefault();
                    handleComplexAction('PAY_CASH');
                }
            }
            if (e.key === 'F10') { e.preventDefault(); handleComplexAction('PAY_CARD'); }
            if (e.key === 'F11') { e.preventDefault(); handleComplexAction('PAY_QR'); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleComplexAction('PAY_CASH');
            }
            if (e.key === 'Delete') { e.preventDefault(); handleVoidItem(); }
            if (e.key === 'q' || e.key === 'Q') {
                if (selectedCartIndex !== null && selectedCartIndex !== undefined) {
                    e.preventDefault();
                    setEditingCartIndex(selectedCartIndex);
                }
            }

            if (!activeModal && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeModal, cart, session.isOpen, selectedCartIndex]);

    return (
        <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden font-sans relative">
            {/* HEADER */}
            <header className="bg-slate-900 text-white h-16 shrink-0 flex items-center justify-between px-4 shadow-md z-30 border-b border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col leading-none">
                        <span className="text-[19px] text-slate-500 uppercase font-bold tracking-wider truncate max-w-[220px]">
                            {systemName || 'SmartRetail Pro'}
                        </span>
                        <span className="text-[15px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                            <Store className="w-3 h-3" /> {branchInfo.name || `Branch ${branchId}`}
                        </span>
                    </div>

                    <div className="h-10 w-px bg-slate-700"></div>

                    <div className="h-12 flex items-center">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Invoice</span>
                            <div className="flex items-center gap-1">
                                {invoiceId === 'INV-READY' ? (
                                    <span className="font-mono text-lg font-bold text-slate-400 animate-pulse">READY</span>
                                ) : (
                                    <>
                                        {(() => {
                                            const parts = invoiceId.split('-');
                                            if (parts.length >= 3) {
                                                return (
                                                    <>
                                                        <span className="font-mono text-xs font-bold text-blue-400">{parts[0]}</span>
                                                        <span className="text-slate-600">-</span>
                                                        <span className="font-mono text-sm font-bold text-cyan-400">{parts[1]}</span>
                                                        <span className="text-slate-600">-</span>
                                                        <span className="font-mono text-xl font-black text-green-400 tracking-wider">{parts[2]}</span>
                                                    </>
                                                );
                                            }
                                            return <span className="font-mono text-xl font-bold text-white">{invoiceId}</span>;
                                        })()}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {session.shiftId && (
                        <div className="h-12 flex items-center ml-4">
                            <div className="flex flex-col">
                                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Active Shift</span>
                                <span className="text-lg text-green-400 font-mono font-bold">#{session.shiftId}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-6">
                    <button onClick={() => setIsOpen(true)} className="relative p-2 rounded-full hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></span>}
                    </button>

                    {supplierPaymentCount > 0 && (
                        <button
                            onClick={() => setShowSupplierPaymentModal(true)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-red-200 transition-colors mr-2"
                            title="Supplier Payment Requests"
                        >
                            <div className="relative">
                                <FileText className="w-4 h-4" />
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                            </div>
                            <span className="text-sm font-semibold">{supplierPaymentCount}</span>
                        </button>
                    )}

                    {approvedPayouts.length > 0 && (
                        <button
                            onClick={() => setShowApprovedPayoutModal(true)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-amber-200 transition-colors mr-2"
                            title="Approved Paid-Out Requests"
                        >
                            <div className="relative">
                                <Receipt className="w-4 h-4" />
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                            </div>
                            <span className="text-sm font-semibold">{approvedPayouts.length}</span>
                        </button>
                    )}

                    {rejectedPayouts.length > 0 && (
                        <button
                            onClick={() => setShowRejectedPayoutModal(true)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-rose-200 transition-colors mr-2"
                            title="Rejected Paid-Out Requests"
                        >
                            <div className="relative">
                                <FileText className="w-4 h-4" />
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
                            </div>
                            <span className="text-sm font-semibold">{rejectedPayouts.length}</span>
                        </button>
                    )}
                    <SecondaryRoleBanner />
                    <button
                        onClick={handleOpenCashierSummary}
                        disabled={!session.isOpen}
                        className="flex items-center gap-3 bg-blue-900/40 border border-blue-500/30 rounded-full py-1.5 px-4 hover:bg-blue-900/60 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <User className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-bold tracking-wide uppercase text-blue-100">{session.cashier}</span>
                    </button>
                    <div className="text-right leading-tight hidden md:block">
                        <div className="font-mono text-2xl font-bold text-white tracking-widest">
                            {time.toLocaleTimeString('en-US', { hour12: false })}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                            {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
                        </div>
                    </div>
                    <button
                        onClick={() => handleComplexAction('EXIT')}
                        disabled={!session.isOpen}
                        className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md text-xs font-bold uppercase tracking-widest border border-red-800 disabled:border-slate-600 shadow-lg active:scale-95 transition-all w-auto"
                    >
                        EXIT <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <div className={`flex flex-1 overflow-hidden transition-all duration-500 ${!session.isOpen || activeModal ? 'blur-[3px] brightness-90' : ''}`}>
                <BillPanel
                    cart={cart}
                    customer={customer}
                    totals={cartTotals}
                    onItemClick={handleCartItemClick}
                    selectedIndex={selectedCartIndex}
                    editingIndex={editingCartIndex}
                    onQuantityCommit={handleInlineQuantityCommit}
                    onQuantityCancel={handleInlineQuantityCancel}
                    onDetachCustomer={() => setCustomer(null)}
                    billDiscount={billDiscount}
                />
                <ControlPanel
                    inputRef={inputRef}
                    inputBuffer={inputBuffer}
                    setInputBuffer={setInputBuffer}
                    onScan={handleScan}
                    onOpenModal={setActiveModal}
                    onAction={handleComplexAction}
                    onVoid={() => handleVoidItem()}
                    isEnabled={session.isOpen}
                    onSelectProduct={handleAddToCart}
                    branchId={branchId}
                />
                <ProductGrid
                    onAddToCart={handleAddToCart}
                    onAddQuickItemClick={() => setActiveModal('QUICK_ADD')}
                    refreshTrigger={quickGridRefresh}
                    branchId={branchId}
                />
            </div>

            {/* NOTIFICATION PANEL */}
            <NotificationPanel />

            {/* MODALS */}
            {activeModal === 'FLOAT' && (
                <FloatModal
                    onApprove={handleLogin}
                    initialBranchId={branchId}
                />
            )}
            {activeModal === 'END_SHIFT' && (
                <EndShiftModal
                    cashierName={session.cashier}
                    shiftId={session.shiftId}
                    expectedTotals={shiftTotals}
                    onClose={() => setActiveModal(null)}
                    onConfirm={handleLogout}
                    onRefresh={fetchShiftTotals}
                />
            )}
            {activeModal === 'PAYMENT' && (
                <PaymentModal
                    total={cartTotals.netTotal}
                    cart={cart}
                    customer={customer}
                    invoiceId={invoiceId}
                    cashierName={session.cashier}
                    branchInfo={branchInfo}
                    totals={cartTotals}
                    initialMethod={listConfig?.mode || 'CASH'}
                    onClose={() => setActiveModal(null)}
                    onProcess={processPayment}
                />
            )}
            {activeModal === 'QUICK_ADD' && (
                <QuickAddModal
                    onClose={() => setActiveModal(null)}
                    onProductSelected={(item) => {
                        handleAddToCart(item);
                        setActiveModal(null);
                    }}
                    branchId={branchId}
                    onAddToQuickPick={async (item) => {
                        try {
                            const productId = item.productId || item.id;
                            await posService.addToQuickPick(productId, branchId);
                            setQuickGridRefresh(prev => prev + 1);
                            addNotification('success', 'Added', 'Product added to quick pick.');
                            return true;
                        } catch (err) {
                            console.error("Failed to add to quick pick", err);
                            addNotification('error', 'Error', 'Failed to add item to quick pick.');
                            return false;
                        }
                    }}
                />
            )}
            {activeModal === 'PAID_IN' && (
                <IOModal
                    type="PAID_IN"
                    shiftId={session.shiftId}
                    cashierName={session.cashier}
                    branchInfo={branchInfo}
                    onClose={() => setActiveModal(null)}
                    onNotify={addNotification}
                />
            )}
            {activeModal === 'PAID_OUT' && (
                <IOModal
                    type="PAID_OUT"
                    shiftId={session.shiftId}
                    cashierName={session.cashier}
                    branchInfo={branchInfo}
                    onClose={() => setActiveModal(null)}
                    onNotify={addNotification}
                />
            )}
            {activeModal === 'PRICE_CHECK' && (
                <PriceCheckModal onClose={() => setActiveModal(null)} branchId={branchId} />
            )}
            {activeModal === 'LOYALTY' && (
                <LoyaltyModal
                    onClose={() => setActiveModal(null)}
                    onAttach={(c) => { setCustomer(c); setActiveModal(null); }}
                />
            )}
            {activeModal === 'REDEEM' && (
                <LoyaltyRedeemModal
                    isOpen={true}
                    customer={customer}
                    onClose={() => setActiveModal(null)}
                    onNotify={addNotification}
                    onRedeemSuccess={(discountValue) => {
                        setBillDiscount(prev => prev + discountValue);
                        addNotification('success', 'Loyalty Redeemed', `LKR ${discountValue.toFixed(2)} discount applied from points.`);
                    }}
                />
            )}
            {activeModal === 'REGISTER' && (
                <RegisterModal onClose={() => setActiveModal(null)} />
            )}
            {activeModal === 'CONFIRM' && confirmConfig && (
                <ConfirmModal
                    title={confirmConfig.title}
                    message={confirmConfig.message}
                    onConfirm={() => {
                        if (confirmConfig.onYes) confirmConfig.onYes();
                        setActiveModal(null);
                        setConfirmConfig(null);
                    }}
                    onCancel={() => { setActiveModal(null); setConfirmConfig(null); }}
                    isAlert={confirmConfig.isAlert}
                />
            )}
            {activeModal === 'LIST' && listConfig && (
                <ListModal
                    type={listConfig.type}
                    branchId={branchId}
                    onClose={() => { setActiveModal(null); setListConfig(null); }}
                    onSelect={handleRecallBill}
                />
            )}
            {activeModal === 'CASHIER_SUMMARY' && (
                <CashierSummaryModal
                    cashierName={session.cashier}
                    shiftId={session.shiftId}
                    summary={cashierSummary}
                    loading={cashierSummaryLoading}
                    onClose={() => { setActiveModal(null); setCashierSummary(null); }}
                />
            )}
            {activeModal === 'RETURN_DETAILS' && returnSource && (
                <ReturnModal
                    sale={returnSource}
                    branchId={branchId}
                    onClose={() => { setActiveModal(null); setReturnSource(null); }}
                    onNotify={addNotification}
                />
            )}
            {activeModal === 'SMART_RETURN' && (
                <SmartReturnModal
                    branchId={branchId}
                    onClose={() => setActiveModal(null)}
                    onNotify={addNotification}
                    onReturnToCart={(negativeItems, refundTotal) => {
                        setCart(prev => [...prev, ...negativeItems]);
                        setActiveModal(null);
                        addNotification('info', 'Return Items Added', `LKR ${refundTotal.toFixed(2)} in return items added to cart. Please add replacement items.`);
                    }}
                />
            )}
            {activeModal === 'RELOAD' && (
                <ReloadModal
                    onClose={() => setActiveModal(null)}
                    onConfirm={handleReloadAdd}
                />
            )}
            {activeModal === 'DISCOUNT' && (
                <DiscountModal
                    selectedItem={selectedCartIndex !== null ? cart[selectedCartIndex] : null}
                    cartTotal={cart.reduce((sum, item) => sum + (item.price * item.qty) - ((item.discount || 0) * item.qty), 0)}
                    onClose={() => setActiveModal(null)}
                    onApply={(discountData) => {
                        if (discountData.scope === 'item' && selectedCartIndex !== null) {
                            handleApplyItemDiscount(selectedCartIndex, discountData.discountAmount / cart[selectedCartIndex].qty);
                        } else {
                            setBillDiscount(discountData.discountAmount);
                            addNotification('success', 'Bill Discount Applied', `LKR ${discountData.discountAmount.toFixed(2)} discount applied to bill.`);
                        }
                    }}
                />
            )}

            {/* New Services Modals */}
            {activeModal === 'DTV_INSTALL' && (
                <DtvRequestModal
                    onClose={() => setActiveModal(null)}
                    branchId={branchId}
                    onNotify={addNotification}
                    onAddToCart={handleAddToCart}
                />
            )}
            {activeModal === 'REPAIR_LOG' && (
                <MobileRepairModal
                    onClose={() => setActiveModal(null)}
                    branchId={branchId}
                    onNotify={addNotification}
                    onAddToCart={handleAddToCart}
                    enablePrintReceipt={true}
                    branchInfo={branchInfo}
                    cashierName={session.cashier}
                />
            )}

            {activeModal === 'PRICE_SELECT' && pendingMultiPriceProduct && (
                <PriceSelectionModal
                    isOpen={true}
                    product={pendingMultiPriceProduct}
                    onClose={() => {
                        setActiveModal(null);
                        setPendingMultiPriceProduct(null);
                        inputRef.current?.focus();
                    }}
                    onSelectPrice={(selectedPrice) => {
                        const selectedOption = pendingMultiPriceProduct.options.find(o => Math.abs(o.sellingPrice - selectedPrice) < 0.01);
                        
                        const finalProduct = {
                            ...pendingMultiPriceProduct.baseProduct,
                            price: selectedPrice,
                            batchId: selectedOption?.primaryBatchId || null,
                            availableStock: selectedOption?.totalStock || 0
                        };

                        let newCartLength = 0;
                        setCart(prev => {
                            const existingIndex = finalProduct.isSerialized ? -1 : prev.findIndex(item =>
                                !item.isService && (
                                    item.id === finalProduct.id ||
                                    (item.barcode && item.barcode === finalProduct.barcode) ||
                                    (item.sku && item.sku === finalProduct.sku)
                                ) && Math.abs(item.price - finalProduct.price) < 0.01
                            );

                            if (existingIndex >= 0) {
                                const updated = [...prev];
                                const newQty = updated[existingIndex].qty + 1;
                                updated[existingIndex] = { ...updated[existingIndex], qty: newQty };
                                addNotification('info', 'Quantity Updated', `${finalProduct.name} x${newQty}`);
                                newCartLength = updated.length;
                                return updated;
                            }
                            addNotification('success', 'Item Added', `${finalProduct.name} — LKR ${parseFloat(selectedPrice).toFixed(2)}`);
                            newCartLength = prev.length + 1;
                            return [...prev, finalProduct];
                        });

                        setActiveModal(null);
                        setPendingMultiPriceProduct(null);

                        if (finalProduct.isSerialized) {
                            setTimeout(() => {
                                handlePromptForSerial(newCartLength - 1);
                            }, 500);
                        }
                        inputRef.current?.focus();
                    }}
                />
            )}

            {serialModalOpen && cart[pendingSerialIndex] && (
                <SerialSelectionModal
                    isOpen={serialModalOpen}
                    productId={cart[pendingSerialIndex].id}
                    productName={cart[pendingSerialIndex].name}
                    branchId={branchId}
                    onSelect={handleSerialSelect}
                    onClose={() => {
                        setSerialModalOpen(false);
                        setPendingSerialIndex(null);
                        inputRef.current?.focus();
                    }}
                />
            )}

            {/* Supplier Payment Request Modal */}
            <SupplierPaymentModal
                isOpen={showSupplierPaymentModal}
                onClose={() => {
                    setShowSupplierPaymentModal(false);
                    fetchSupplierPaymentCount();
                }}
                onNotification={addNotification}
            />

            {showApprovedPayoutModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/55 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                        <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-amber-900">Approved Paid-Out Requests</h3>
                                <p className="text-xs text-amber-700 mt-0.5">Click Pay & Print to settle an approved payout and print its receipt.</p>
                            </div>
                            <button
                                onClick={() => setShowApprovedPayoutModal(false)}
                                className="px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-amber-700 hover:bg-amber-100 text-xs font-semibold"
                            >
                                Close
                            </button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto">
                            {approvedPayouts.length === 0 ? (
                                <div className="p-10 text-center text-slate-500">
                                    No approved payout requests waiting for cashier action.
                                </div>
                            ) : (
                                <table className="w-full text-left text-sm text-slate-700">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                        <tr>
                                            <th className="p-4 font-semibold">Approval</th>
                                            <th className="p-4 font-semibold">Reason</th>
                                            <th className="p-4 font-semibold">Amount</th>
                                            <th className="p-4 font-semibold text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {approvedPayouts.map((row) => (
                                            <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                                                <td className="p-4 font-mono text-xs font-bold text-amber-700">#{row.id}</td>
                                                <td className="p-4 text-slate-600">{String(row.reason || row.description || row.notes || 'Approved payout').replace(/\[TAKEN_BY_MANAGER\]\s*/gi, '')}</td>
                                                <td className="p-4 font-semibold text-slate-800">LKR {Number(row.amount || 0).toLocaleString()}</td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => handleProcessApprovedPayout(row)}
                                                        disabled={processingPayoutId === row.id}
                                                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors disabled:opacity-60"
                                                    >
                                                        {processingPayoutId === row.id ? 'Processing...' : 'Pay & Print'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showRejectedPayoutModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/55 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                        <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-rose-900">Rejected Paid-Out Requests</h3>
                                <p className="text-xs text-rose-700 mt-0.5">Manager rejected these payout requests.</p>
                            </div>
                            <button
                                onClick={() => setShowRejectedPayoutModal(false)}
                                className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold"
                            >
                                Close
                            </button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto">
                            {rejectedPayouts.length === 0 ? (
                                <div className="p-10 text-center text-slate-500">No rejected payout requests.</div>
                            ) : (
                                <table className="w-full text-left text-sm text-slate-700">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                        <tr>
                                            <th className="p-4 font-semibold">Approval</th>
                                            <th className="p-4 font-semibold">Reason</th>
                                            <th className="p-4 font-semibold">Amount</th>
                                            <th className="p-4 font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rejectedPayouts.map((row) => (
                                            <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                                                <td className="p-4 font-mono text-xs font-bold text-rose-700">#{row.id}</td>
                                                <td className="p-4 text-slate-600">{String(row.reason || row.description || row.notes || 'Rejected payout').replace(/\[TAKEN_BY_MANAGER\]\s*/gi, '')}</td>
                                                <td className="p-4 font-semibold text-slate-800">LKR {Number(row.amount || 0).toLocaleString()}</td>
                                                <td className="p-4"><span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-700">Rejected</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function POSScreen() {
    return (
        <NotificationProvider>
            <POSContent />
        </NotificationProvider>
    );
}
