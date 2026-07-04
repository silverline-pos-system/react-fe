import { useEffect, useState } from "react";
import useEscapeClose from "@/hooks/useEscapeClose";

export default function SetTargetModal({ open, onClose, onSave, initialTarget }) {
  useEscapeClose(onClose, open);
  const [value, setValue] = useState(initialTarget ?? 250000);

  useEffect(() => {
    if (open) {
      setValue(initialTarget ?? 250000);
    }
  }, [open, initialTarget]);

  if (!open) return null;

  const save = () => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return alert("Enter a valid target amount");
    onSave(Math.round(n));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl border border-brand-border">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold">Set Today’s Sales Target</h3>
          <button
            type="button"
            className="px-3 py-1 rounded-lg bg-slate-100 border border-brand-border hover:bg-slate-200"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <p className="mt-2 text-sm text-brand-muted">
          Enter the target amount for <b>today</b>.
        </p>

        <div className="mt-4">
          <label className="text-sm font-semibold">Target (LKR)</label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-2 w-full px-4 py-2 rounded-xl border border-brand-border outline-none focus:ring-2 focus:ring-brand-secondary"
            placeholder="250000"
          />
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-slate-100 border border-brand-border hover:bg-slate-200 font-semibold"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-secondary text-white font-semibold"
            onClick={save}
          >
            Save Target
          </button>
        </div>
      </div>
    </div>
  );
}
