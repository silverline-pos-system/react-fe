import { useEffect, useState } from "react";
import useEscapeClose from "@/hooks/useEscapeClose";

const KEY = "srp_manager_shift";

export default function ShiftModal({ open, onClose, branch }) {
  useEscapeClose(onClose, open);
  const [shift, setShift] = useState(null);

  useEffect(() => {
    if (!open) return;
    const saved = localStorage.getItem(KEY);
    setShift(saved ? JSON.parse(saved) : null);
  }, [open]);

  if (!open) return null;

  const startShift = () => {
    const data = {
      branch,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: "ACTIVE",
    };
    localStorage.setItem(KEY, JSON.stringify(data));
    setShift(data);
  };

  const endShift = () => {
    if (!shift) return;
    const data = { ...shift, endedAt: new Date().toISOString(), status: "CLOSED" };
    localStorage.setItem(KEY, JSON.stringify(data));
    setShift(data);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-brand-border shadow-xl p-5">
        <div className="flex items-center justify-between">
          <div className="font-extrabold text-lg">Shift Management</div>
          <button
            type="button"
            className="px-3 py-1 rounded-lg bg-slate-100 border border-brand-border hover:bg-slate-200"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div>
            <span className="text-brand-muted">Branch:</span> <b>{branch}</b>
          </div>

          {!shift || shift.status === "CLOSED" ? (
            <div className="p-3 rounded-xl bg-slate-50 border border-brand-border">
              No active shift.
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-brand-border">
              <div>
                Status: <b className="text-brand-success">ACTIVE</b>
              </div>
              <div className="text-brand-muted">
                Started: {new Date(shift.startedAt).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-2 justify-end">
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-slate-100 border border-brand-border hover:bg-slate-200 font-semibold"
            onClick={onClose}
          >
            Close
          </button>

          {(!shift || shift.status === "CLOSED") && (
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-secondary text-white font-semibold"
              onClick={startShift}
            >
              Start Shift
            </button>
          )}

          {shift && shift.status === "ACTIVE" && (
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-brand-danger hover:bg-red-700 text-white font-semibold"
              onClick={endShift}
            >
              End Shift
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
