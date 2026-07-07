import React, { useState } from "react";
import { DollarSign, X, Activity } from "lucide-react";
import { servicesService } from "@/services/servicesService";

export default function FinalizeCostModal({
  onClose,
  onSuccess,
  selectedJob,
  managers,
}) {
  const defaultManager =
    managers.length === 1
      ? managers[0].userId
      : managers.length === 0
      ? 1
      : "";
  const [finalForm, setFinalForm] = useState({
    managerId: defaultManager,
    estimatedCost: selectedJob?.estimatedCost || "",
    costNote: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!finalForm.managerId || !finalForm.estimatedCost) {
      alert("Please select a manager and enter an estimated cost.");
      return;
    }

    setSubmitting(true);
    try {
      await servicesService.requestFinalizeCost(
        selectedJob.repairId,
        finalForm.managerId,
        finalForm.estimatedCost,
        finalForm.costNote
      );
      setFinalForm({ managerId: "", estimatedCost: "", costNote: "" });
      onSuccess();
    } catch (error) {
      alert("Failed to send finalize request");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 bg-purple-50 text-purple-800 border-b border-purple-100 flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <DollarSign size={20} /> Request Finalize Cost
          </h3>
          <button onClick={onClose} className="text-purple-400 hover:text-purple-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">
              Select Manager / Supervisor
            </label>
            {managers.length > 0 ? (
              <select
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-semibold"
                value={finalForm.managerId}
                onChange={(e) =>
                  setFinalForm({ ...finalForm, managerId: e.target.value })
                }
                required
              >
                <option value="">-- Select Person --</option>
                {managers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.fullName} ({m.role.replace(/_/g, " ")})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-semibold"
                value={finalForm.managerId}
                onChange={(e) =>
                  setFinalForm({ ...finalForm, managerId: e.target.value })
                }
                placeholder="Enter Manager ID (e.g. 1)"
                required
              />
            )}
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">
              Estimated / Final Cost (Rs)
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg font-bold"
              value={finalForm.estimatedCost}
              onChange={(e) =>
                setFinalForm({ ...finalForm, estimatedCost: e.target.value })
              }
              required
              min="0"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">
              Notes / Replaced Parts Details
            </label>
            <textarea
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
              value={finalForm.costNote}
              onChange={(e) =>
                setFinalForm({ ...finalForm, costNote: e.target.value })
              }
              rows="3"
              placeholder="Explain the work done and parts used"
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
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-sm transition-colors flex justify-center items-center gap-2"
            >
              {submitting ? (
                <Activity size={18} className="animate-spin" />
              ) : (
                "Send Request"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
