import React, { useState } from "react";
import { DollarSign, X, Activity } from "lucide-react";
import { createApprovalRequest } from "@/services/managerService";

export default function PORequestModal({ onClose }) {
  const [poForm, setPoForm] = useState({ amount: "", notes: "" });
  const [poSubmitting, setPoSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requestedAmount = Number.parseFloat(String(poForm.amount || "").trim());
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setPoSubmitting(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const branchId =
        storedUser.branchId || localStorage.getItem("selectedBranchId") || null;
      const approvalReference = `TECH-PO-${Date.now()}`;
      const approvalPayload = {
        type: "CASH_FLOW_PAID_OUT",
        category: "CASH_FLOW_PAID_OUT",
        status: "PENDING",
        reference: approvalReference,
        referenceNo: approvalReference,
        amount: requestedAmount,
        reason: `PO request for repair parts${
          poForm.notes ? ` | ${poForm.notes.trim()}` : ""
        }`,
        description: poForm.notes.trim(),
        notes: "Technician PO request submitted from the mobile repair dashboard.",
        requestedBy:
          storedUser.fullName ||
          storedUser.name ||
          storedUser.username ||
          "Technician",
        email: storedUser.email || "",
        branchId: branchId ? Number(branchId) : null,
        takenByManager: false,
      };

      await createApprovalRequest(approvalPayload);
      setPoForm({ amount: "", notes: "" });
      alert("PO request sent to the Manager for approval. The cashier can process it after approval.");
      onClose();
    } catch (error) {
      if (error.response?.status === 403) {
        alert("You do not have permission to submit PO requests. Please ask a Manager.");
      } else {
        console.error("Failed to create PO request:", error);
        const msg = error.response?.data?.message || "Failed to send PO request.";
        alert(msg);
      }
    } finally {
      setPoSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 bg-blue-50 text-blue-800 border-b border-blue-100 flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <DollarSign size={20} /> Request Parts Funds (PO)
          </h3>
          <button onClick={onClose} className="text-blue-400 hover:text-blue-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">
              Estimated Amount Needed (Rs)
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold"
              value={poForm.amount}
              onChange={(e) => setPoForm({ ...poForm, amount: e.target.value })}
              required
              min="1"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">
              Parts Needed / Notes
            </label>
            <textarea
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={poForm.notes}
              onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
              rows="3"
              required
              placeholder="List the parts you need to buy and the repair job number if applicable..."
            />
          </div>
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={poSubmitting}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors flex justify-center items-center gap-2"
            >
              {poSubmitting ? (
                <Activity size={18} className="animate-spin" />
              ) : (
                "Send PO Request"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
