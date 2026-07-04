const classes = {
  Success: "bg-brand-success",
  Active: "bg-brand-success",
  Available: "bg-brand-success",
  Warning: "bg-brand-warning",
  Critical: "bg-brand-danger",
  Failed: "bg-brand-danger",
  Blocked: "bg-brand-danger",
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
