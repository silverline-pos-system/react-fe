import { useEffect, useRef, useState } from "react";

export default function ActionDropdown({ onApprove, onReject }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-4 py-2 rounded-xl border border-brand-border text-sm font-semibold bg-white hover:bg-slate-50 transition"
      >
        Edit <span className="ml-1">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-brand-border bg-white shadow-lg overflow-hidden z-20">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onApprove?.();
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
          >
            ✅ Approve
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onReject?.();
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
          >
            ❌ Reject
          </button>
        </div>
      )}
    </div>
  );
}
