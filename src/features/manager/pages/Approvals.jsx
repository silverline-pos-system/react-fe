import { useEffect, useMemo, useRef, useState } from "react";
import { useBranch } from "@/context/BranchContext";
import Badge from "../components/Badge";
import { updateApprovalStatus, getApprovalHistoryPdf } from "../services/managerService";
import { useApprovals } from "../hooks/managerQueries";
import { CheckCircle, ArrowUpRight, ArrowDownLeft, ShieldCheck, ListFilter, History, Download, AlertTriangle, X } from 'lucide-react';

const formatCategory = (cat) => {
  if (!cat) return "";
  return cat
    .replace("CASH_FLOW_", "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
};

const getCategoryIcon = (cat) => {
  const lower = (cat || "").toLowerCase();
  if (lower.includes("paid_in")) return <ArrowDownLeft className="w-4 h-4 text-emerald-500" />;
  if (lower.includes("paid_out")) return <ArrowUpRight className="w-4 h-4 text-red-500" />;
  if (lower.includes("registration")) return <ShieldCheck className="w-4 h-4 text-blue-500" />;
  return <ListFilter className="w-4 h-4 text-slate-400" />;
};

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, type = 'info' }) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    confirmBtnRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{title}</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-all active:scale-95 ${type === 'danger'
              ? 'bg-red-600 hover:bg-red-700 shadow-red-200'
              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
              }`}
          >
            Confirm Action
          </button>
        </div>
      </div>
    </div>
  );
}

// Pure helpers (module scope so they're available to the render-time derivations below).
const isManagerTakenPayout = (row) => {
  const txt = `${row?.reason || ""} ${row?.description || ""} ${row?.notes || ""}`;
  return row?.takenByManager === true || /\[TAKEN_BY_MANAGER\]/i.test(txt);
};

const cleanReasonText = (txt) => String(txt || "").replace(/\[TAKEN_BY_MANAGER\]\s*/gi, "").trim();

const getHistorySortTimestamp = (row) => {
  const candidates = [
    row?.approvedAt,
    row?.updatedAt,
    row?.processedAt,
    row?.actionAt,
    row?.createdAt,
    row?.time,
    row?.date,
  ];

  for (const value of candidates) {
    if (!value) continue;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getTime();
    }
  }

  return 0;
};

const isToday = (row) => {
  const ts = getHistorySortTimestamp(row);
  if (!ts) return false;
  const date = new Date(ts);
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

const sortHistoryNewestFirst = (rows) => [...rows].sort((left, right) => {
  const timeDiff = getHistorySortTimestamp(right) - getHistorySortTimestamp(left);
  if (timeDiff !== 0) return timeDiff;
  return Number(right?.id || 0) - Number(left?.id || 0);
});

export default function Approvals() {
  // Approvals are fetched via React Query (cached, deduped). pending/history/summary are derived
  // during render from the same data the old fetchApprovals produced.
  const {
    data: allApprovalsRaw = [],
    isLoading: loading,
    isError,
    refetch: refetchApprovals,
  } = useApprovals(null);
  const error = isError ? "Failed to load approvals" : null;

  const allRows = useMemo(
    () => (allApprovalsRaw || []).filter((item) => item.category !== "USER_REGISTRATION"),
    [allApprovalsRaw],
  );
  const pending = useMemo(
    () => allRows.filter((r) => (r.status || "").toUpperCase() === "PENDING"),
    [allRows],
  );
  const history = useMemo(
    () => sortHistoryNewestFirst(allRows.filter((r) => (r.status || "").toUpperCase() !== "PENDING")),
    [allRows],
  );
  const summary = useMemo(() => {
    const todayApprovedRows = allRows
      .filter((r) => (r.status || "").toUpperCase() === "APPROVED")
      .filter(isToday);
    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, r) => sum + Number(r.amount || 0), 0),
      managerTakenPayoutTotal: allRows
        .filter((r) => (r.category || "").toUpperCase().includes("PAID_OUT") && isManagerTakenPayout(r))
        .reduce((sum, r) => sum + Number(r.amount || 0), 0),
      todayPayInTotal: todayApprovedRows
        .filter((r) => (r.category || "").toUpperCase().includes("PAID_IN"))
        .reduce((sum, r) => sum + Number(r.amount || 0), 0),
      todayPayoutTotal: todayApprovedRows
        .filter((r) => (r.category || "").toUpperCase().includes("PAID_OUT"))
        .reduce((sum, r) => sum + Number(r.amount || 0), 0),
    };
  }, [allRows, pending]);
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState("ALL");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("ALL");
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 10;
  const [updating, setUpdating] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    id: null,
    status: null,
    title: "",
    message: "",
    type: "info"
  });

  const { selectedBranchId } = useBranch();

  // Refetch when the branch filter changes (preserves the previous behavior).
  useEffect(() => {
    refetchApprovals();
  }, [selectedBranchId, refetchApprovals]);

  // Kept name so existing callers (post-action + refresh buttons) are unchanged.
  const fetchApprovals = refetchApprovals;

  useEffect(() => {
    setHistoryPage(1);
  }, [historyCategoryFilter, historyStatusFilter, historySearch, history.length]);

  const openConfirmModal = (id, status) => {
    const isApprove = status === 'Approved';
    setModalConfig({
      isOpen: true,
      id,
      status,
      title: isApprove ? "Confirm Approval" : "Reject Request",
      message: isApprove
        ? "Are you sure you want to approve this request? This action will update the system records immediately."
        : "Are you sure you want to reject this request? The requester will be notified.",
      type: isApprove ? "info" : "danger"
    });
  };

  const closeConfirmModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  async function handleStatusConfirm() {
    const { id, status } = modalConfig;
    if (!id || !status) return;

    closeConfirmModal();

    try {
      setUpdating(id);
      await updateApprovalStatus(id, status);

      // Refresh the shared badge count, then re-fetch approvals (pending/history are derived
      // from the query, so refetch re-syncs the lists).
      window.dispatchEvent(new CustomEvent('refresh-approval-count'));
      await refetchApprovals();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdating(null);
    }
  }

  const exportHistoryPDF = async () => {
    try {
      setExporting(true);
      const blob = await getApprovalHistoryPdf();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `approval_history_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export PDF', err);
      alert("Failed to generate PDF report.");
    } finally {
      setExporting(false);
    }
  };

  const historyFiltered = history.filter((r) => {
    const category = (r.category || "").toUpperCase();
    const status = (r.status || "").toUpperCase();
    const reference = (r.reference || r.referenceNo || "").toLowerCase();
    const requestedBy = (r.requestedBy || "").toLowerCase();
    const reason = cleanReasonText(r.reason || r.description || "").toLowerCase();

    const matchesCategory = historyCategoryFilter === "ALL" || category === historyCategoryFilter;
    const matchesStatus = historyStatusFilter === "ALL" || status === historyStatusFilter;
    const q = historySearch.trim().toLowerCase();
    const matchesSearch = !q || reference.includes(q) || requestedBy.includes(q) || reason.includes(q);

    return matchesCategory && matchesStatus && matchesSearch;
  });

  const historyTotalPages = Math.max(1, Math.ceil(historyFiltered.length / historyPageSize));
  const safeHistoryPage = Math.min(historyPage, historyTotalPages);
  const historyPaginated = historyFiltered.slice(
    (safeHistoryPage - 1) * historyPageSize,
    safeHistoryPage * historyPageSize
  );

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-extrabold text-slate-800">Approvals & Requests</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchApprovals}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={closeConfirmModal}
        onConfirm={handleStatusConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Approvals & Requests</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchApprovals}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Pending Requests</div>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">{summary.pendingCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Pending Amount</div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">LKR {summary.pendingAmount.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Today's Approved Pay In</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">LKR {summary.todayPayInTotal.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Today's Approved Payout</div>
          <div className="text-2xl font-extrabold text-red-600 mt-1">LKR {summary.todayPayoutTotal.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Manager-Taken Total</div>
          <div className="text-2xl font-extrabold text-indigo-700 mt-1">LKR {summary.managerTakenPayoutTotal.toLocaleString()}</div>
        </div>
      </div>

      {/* PENDING TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <span className="font-bold text-slate-700">Pending Approvals</span>
          {pending.length > 0 && (
            <span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm border border-amber-200">
              {pending.length} Waiting
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider w-12"></th>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Type / Ref</th>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Reason</th>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Amount</th>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Branch</th>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Requested By</th>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
                      <span>Checking for requests...</span>
                    </div>
                  </td>
                </tr>
              ) : pending.length === 0 ? (
                <tr>
                  <td className="p-12 text-center text-slate-400" colSpan={7}>
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="w-8 h-8 text-emerald-100 text-emerald-400" />
                      <span>No pending approvals found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pending.map((r) => {
                  const isProcessing = updating === r.id;
                  const displayAmount = r.amount ? `LKR ${Number(r.amount).toLocaleString()}` : "-";
                  const displayReason = cleanReasonText(r.reason || r.description || "No reason provided");
                  const displayRef = r.reference || r.referenceNo || "-";
                  const managerTaken = isManagerTakenPayout(r);

                  return (
                    <tr key={r.id} className={`group hover:bg-blue-50/30 transition-colors ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                      <td className="p-4 pl-6">
                        <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                          {getCategoryIcon(r.category)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-700">{formatCategory(r.category)}</div>
                        <div className="font-mono text-xs text-slate-500 mt-1">
                          {displayRef}
                        </div>
                      </td>
                      <td className="p-4 max-w-xs">
                        <div className="text-slate-600 text-sm leading-snug">
                          {displayReason}
                        </div>
                        {managerTaken && (
                          <div className="text-[10px] mt-1 inline-block px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold">
                            Taken by Manager
                          </div>
                        )}
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <History className="w-3 h-3" /> {r.time}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        {displayAmount}
                      </td>
                      <td className="p-4 text-slate-600 font-medium">
                        {r.branchName || "-"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                            {r.requestedBy?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-700">{r.requestedBy}</div>
                            <div className="text-[10px] text-slate-400">{r.phone && r.phone !== "-" ? r.phone : "Staff"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openConfirmModal(r.id, "Approved")}
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 shadow-sm hover:shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openConfirmModal(r.id, "Rejected")}
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 shadow-sm hover:shadow-red-200 transition-all active:scale-95 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HISTORY TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="font-bold text-slate-700 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" /> Approval History
          </div>
          <button
            onClick={exportHistoryPDF}
            disabled={exporting}
            className={`flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors ${exporting ? 'opacity-50 cursor-wait' : ''}`}
          >
            {exporting ? (
              <>Generating...</>
            ) : (
              <>
                <Download className="w-3 h-3" /> Export PDF
              </>
            )}
          </button>
        </div>
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center gap-3">
          <select
            value={historyCategoryFilter}
            onChange={(e) => setHistoryCategoryFilter(e.target.value)}
            className="pl-3 pr-8 py-2 text-xs border border-slate-200 rounded-lg bg-white cursor-pointer hover:border-slate-300 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="CASH_FLOW_PAID_IN">Paid In</option>
            <option value="CASH_FLOW_PAID_OUT">Paid Out</option>
          </select>

          <select
            value={historyStatusFilter}
            onChange={(e) => setHistoryStatusFilter(e.target.value)}
            className="pl-3 pr-8 py-2 text-xs border border-slate-200 rounded-lg bg-white cursor-pointer hover:border-slate-300 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <input
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder="Search ref / reason / requested by..."
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white min-w-[260px]"
          />

          <div className="text-xs text-slate-500 ml-auto">
            Showing {historyPaginated.length} of {historyFiltered.length}
          </div>
        </div>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0">
              <tr>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Type</th>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Reference</th>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Reason / Description</th>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Amount</th>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Branch</th>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Requested By</th>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Approved By</th>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Approved At</th>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">Loading history...</td>
                </tr>
              ) : historyFiltered.length === 0 ? (
                <tr>
                  <td className="p-8 text-center text-slate-400" colSpan={9}>No approval history</td>
                </tr>
              ) : (
                historyPaginated.map((r) => {
                  const displayAmount = r.amount ? `LKR ${Number(r.amount).toLocaleString()}` : "-";
                  const displayReason = cleanReasonText(r.reason || r.description || "-");
                  const displayRef = r.reference || r.referenceNo || "-";

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-slate-600">
                        {formatCategory(r.category)}
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-500">
                        {displayRef}
                      </td>
                      <td className="p-4 text-slate-600 text-xs max-w-xs truncate">
                        {displayReason}
                      </td>
                      <td className="p-4 font-bold text-slate-700 text-xs">
                        {displayAmount}
                      </td>
                      <td className="p-4 text-slate-600 font-medium">
                        {r.branchName || "-"}
                      </td>
                      <td className="p-4 text-slate-600">
                        {r.requestedBy}
                      </td>
                      <td className="p-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                          {r.approvedBy || "-"}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 text-xs font-mono">
                        {r.approvedAt || "-"}
                      </td>
                      <td className="p-4">
                        <Badge label={r.status} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-slate-100 bg-white flex items-center justify-between">
          <div className="text-xs text-slate-500">Page {safeHistoryPage} of {historyTotalPages}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
              disabled={safeHistoryPage <= 1}
              className="px-3 py-1.5 text-xs rounded-md border border-slate-200 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
              disabled={safeHistoryPage >= historyTotalPages}
              className="px-3 py-1.5 text-xs rounded-md border border-slate-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
