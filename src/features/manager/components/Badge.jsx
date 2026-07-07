const classes = {
  Success: "bg-brand-success",
  Active: "bg-brand-success",
  Available: "bg-brand-success",
  Approved: "bg-emerald-500",
  APPROVED: "bg-emerald-500",
  Warning: "bg-brand-warning",
  Pending: "bg-brand-warning",
  PENDING: "bg-brand-warning",
  Critical: "bg-brand-danger",
  Failed: "bg-brand-danger",
  Blocked: "bg-brand-danger",
  Rejected: "bg-red-500",
  REJECTED: "bg-red-500",
  Offline: "bg-slate-500",
  Sold: "bg-brand-secondary",
};

export default function Badge({ label }) {
  const cls = classes[label] || "bg-slate-500";
  return (
    <span className={`text-xs px-3 py-1 rounded-full text-white font-bold ${cls}`}>
      {label}
    </span>
  );
}
