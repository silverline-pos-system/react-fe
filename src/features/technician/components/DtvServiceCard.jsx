import React, { useState } from "react";
import { Tv, User, Phone, MapPin, Activity, LogOut } from "lucide-react";
import { getDtvStatusBadgeColor, getActionBtnColor } from "../utils/techHelpers";

export default function DtvServiceCard({
  job,
  onAction,
  onReturnToPool,
  actionText,
  actionColor,
  icon,
  disabled = false,
  isProcessing = false,
}) {
  const [balance, setBalance] = useState("");
  const [itemsUsed, setItemsUsed] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (job.serviceStatus === "IN_PROGRESS") {
      const parsedBalance = parseFloat(balance) || 0;
      onAction(parsedBalance, itemsUsed);
    } else {
      onAction();
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
        job.serviceStatus === "ASSIGNED"
          ? "border-orange-200"
          : job.serviceStatus === "IN_PROGRESS"
          ? "border-indigo-200"
          : "border-slate-100"
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-1.5">
            <Tv size={14} className="text-slate-400" />
            <span className="font-mono text-xs font-bold text-slate-500">
              SRV-{job.serviceId}
            </span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getDtvStatusBadgeColor(
              job.serviceStatus
            )}`}
          >
            {job.serviceStatus.replace(/_/g, " ")}
          </span>
        </div>

        {/* Service Type & Customer */}
        <h3 className="font-bold text-slate-800 text-lg mb-2">
          {job.serviceType?.replace(/_/g, " ") || "DTV Service"}
        </h3>

        <div className="space-y-2 mb-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <User size={14} className="text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-800">
              {job.customerName || "Customer"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-slate-400 shrink-0" />
            <a
              href={`tel:${job.contactNo}`}
              className="hover:underline text-blue-600"
            >
              {job.contactNo || "-"}
            </a>
          </div>
          {job.address && (
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
              <span className="line-clamp-2" title={job.address}>
                {job.address}
              </span>
            </div>
          )}
        </div>

        {/* Job Charge / Notes */}
        <div className="mb-4 pt-3 border-t border-slate-100">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-slate-400 font-medium">Service Charge:</span>
            <span className="font-bold text-slate-800">
              Rs. {Number(job.serviceCharge || 0).toLocaleString()}
            </span>
          </div>
          {job.notes && (
            <div className="mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Remarks
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {job.notes}
              </p>
            </div>
          )}
        </div>

        {/* Completion Form (Only when IN_PROGRESS) */}
        {job.serviceStatus === "IN_PROGRESS" && (
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">
                Balance Collected (Rs.)
              </label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">
                Additional Items / Materials
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                placeholder="e.g. 5m cable, connector"
                value={itemsUsed}
                onChange={(e) => setItemsUsed(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-5">
        {onReturnToPool && job.serviceStatus !== "COMPLETED" && (
          <button
            type="button"
            onClick={onReturnToPool}
            className="px-3 py-2.5 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 rounded-xl transition-all shadow-sm text-slate-500"
            title="Return to Pool"
          >
            <LogOut size={16} />
          </button>
        )}
        <button
          type="button"
          disabled={disabled || isProcessing}
          onClick={handleSubmit}
          className={`flex-1 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm text-sm active:scale-[0.98] ${getActionBtnColor(
            actionColor
          )} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isProcessing ? (
            <Activity size={16} className="animate-spin" />
          ) : (
            icon
          )}
          {actionText}
        </button>
      </div>
    </div>
  );
}
