import { useEffect, useState } from "react";
import {
    Loader2,
    KeyRound,
    CheckCircle,
    XCircle,
    Clock,
    Search,
    Filter,
    User,
    Mail,
    Phone,
    Calendar,
    MessageSquare,
    Shield,
    AlertCircle,
} from "lucide-react";
import {
    getPasswordResetRequests,
    approvePasswordReset,
    rejectPasswordReset,
} from "../services/adminApi";
import useEscapeClose from "@/shared/hooks/useEscapeClose";
import Pagination from "@/shared/components/Pagination";

// Confirmation Modal
function ActionModal({ isOpen, onClose, onConfirm, request, action, loading }) {
    const [notes, setNotes] = useState("");

    useEscapeClose(onClose, isOpen);

    useEffect(() => {
        if (!isOpen || loading) return;

        const handleKeyDown = (e) => {
            if (e.key !== "Enter") return;
            const tag = document.activeElement?.tagName;
            if (tag === "TEXTAREA") return;
            e.preventDefault();
            onConfirm(notes);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, loading, onConfirm, notes]);

    if (!isOpen || !request) return null;

    const isApprove = action === "approve";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className={`px-6 py-4 ${isApprove ? "bg-emerald-50 border-b border-emerald-100" : "bg-red-50 border-b border-red-100"}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isApprove ? "bg-emerald-100" : "bg-red-100"}`}>
                            {isApprove ? (
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">
                                {isApprove ? "Approve Password Reset" : "Reject Password Reset"}
                            </h3>
                            <p className="text-sm text-slate-500">For user: <strong>{request.fullName}</strong> (@{request.username})</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">{request.email}</span>
                        </div>
                        {request.phone && (
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-600">{request.phone}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">
                                Requested: {new Date(request.createdAt).toLocaleString()}
                            </span>
                        </div>
                        {request.requestNotes && (
                            <div className="flex items-start gap-2 text-sm">
                                <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <span className="text-slate-600">{request.requestNotes}</span>
                            </div>
                        )}
                    </div>

                    {isApprove && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700">
                                    <strong>Warning:</strong> Approving will immediately change the user's password. They will be notified via email.
                                </p>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-bold text-slate-600 mb-1 block">
                            Admin Notes <span className="text-slate-300 font-normal">(Optional)</span>
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={isApprove ? "e.g., Verified user identity via phone" : "e.g., User failed identity verification"}
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl border border-brand-border outline-none focus:ring-2 focus:ring-brand-secondary text-sm resize-none"
                        />
                    </div>
                </div>

                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(notes)}
                        disabled={loading}
                        className={`px-5 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 ${isApprove
                            ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                            : "bg-red-600 hover:bg-red-700 shadow-red-200"
                            }`}
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isApprove ? "Approve & Apply" : "Reject Request"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PasswordRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("PENDING");
    const [search, setSearch] = useState("");
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [modalAction, setModalAction] = useState(""); // "approve" | "reject"

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getPasswordResetRequests(filter === "ALL" ? null : filter);
            setRequests(data || []);
        } catch (err) {
            console.error("Error fetching password reset requests:", err);
            setError("Failed to load password reset requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter, search]);

    const openModal = (request, action) => {
        setSelectedRequest(request);
        setModalAction(action);
        setModalOpen(true);
    };

    const handleAction = async (notes) => {
        if (!selectedRequest) return;
        try {
            setActionLoading(true);
            if (modalAction === "approve") {
                await approvePasswordReset(selectedRequest.id, notes);
            } else {
                await rejectPasswordReset(selectedRequest.id, notes);
            }
            setModalOpen(false);
            setSelectedRequest(null);
            await fetchRequests();
        } catch (err) {
            console.error("Error processing request:", err);
            alert("Failed to process request. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "PENDING":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3" /> Pending
                    </span>
                );
            case "APPROVED":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3" /> Approved
                    </span>
                );
            case "REJECTED":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                        <XCircle className="w-3 h-3" /> Rejected
                    </span>
                );
            default:
                return <span className="text-xs text-slate-400">{status}</span>;
        }
    };

    const filteredRequests = requests.filter((r) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            r.username?.toLowerCase().includes(q) ||
            r.fullName?.toLowerCase().includes(q) ||
            r.email?.toLowerCase().includes(q) ||
            r.phone?.includes(q)
        );
    });

    const paginatedRequests = filteredRequests.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    const totalItems = filteredRequests.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const pendingCount = requests.filter((r) => r.status === "PENDING").length;

    return (
        <div className="space-y-4">
            <ActionModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setSelectedRequest(null);
                }}
                onConfirm={handleAction}
                request={selectedRequest}
                action={modalAction}
                loading={actionLoading}
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-extrabold">Password Reset Requests</h1>
                        {pendingCount > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-amber-500 text-white text-xs font-bold rounded-full animate-pulse">
                                {pendingCount}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-brand-muted">
                        Review and manage user password reset requests. Approved requests will take effect immediately.
                    </p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white border border-brand-border rounded-2xl shadow-sm p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, username, or email..."
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-brand-border outline-none focus:ring-2 focus:ring-brand-secondary text-sm"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="pl-9 pr-10 py-2 rounded-xl border border-brand-border bg-white outline-none focus:ring-2 focus:ring-brand-secondary text-sm font-semibold cursor-pointer"
                        >
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="ALL">All Requests</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    {error}
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="bg-white border border-brand-border rounded-2xl shadow-sm p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <KeyRound className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-600 mb-1">No Requests Found</h3>
                    <p className="text-sm text-slate-400">
                        {filter === "PENDING"
                            ? "No pending password reset requests at this time."
                            : "No password reset requests match your search."}
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-brand-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 border-b border-brand-border font-bold">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Contact Number</th>
                                    <th className="px-6 py-4">Date Requested</th>
                                    <th className="px-6 py-4">Reason / Notes</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Admin Action</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0">
                                                    {req.fullName?.charAt(0)?.toUpperCase() || "?"}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-slate-800">{req.fullName}</div>
                                                    <div className="text-xs text-slate-400">@{req.username} • {req.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">
                                            {req.phone || <span className="text-slate-300">N/A</span>}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {new Date(req.createdAt).toLocaleString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={req.requestNotes}>
                                            {req.requestNotes || <span className="text-slate-300">No notes</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(req.status)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 max-w-xs">
                                            {req.status === "PENDING" ? (
                                                <span className="text-slate-300">Awaiting review</span>
                                            ) : (
                                                <div className="space-y-1">
                                                    {req.adminNotes && (
                                                        <div className="text-xs text-blue-600 font-medium">
                                                            {req.adminNotes}
                                                        </div>
                                                    )}
                                                    {req.reviewedAt && (
                                                        <div className="text-[10px] text-slate-400">
                                                            {new Date(req.reviewedAt).toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {req.status === "PENDING" ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openModal(req, "approve")}
                                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => openModal(req, "reject")}
                                                        className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" /> Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-300">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        setItemsPerPage={setItemsPerPage}
                    />
                </div>
            )}
        </div>
    );
}
