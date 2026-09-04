import { useNavigate } from "react-router-dom";
import { Building2, ArrowUpRight } from "lucide-react";

export default function BranchHealthCard({ data, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return <div className="h-[148px] bg-gray-100 rounded-2xl animate-pulse" />;
  }

  const total = Number(data?.totalBranches || 0);
  const active = Number(data?.activeBranches || 0);
  const inactive = Math.max(0, total - active);
  const pct = total > 0 ? Math.round((active / total) * 100) : 0;

  return (
    <button
      type="button"
      onClick={() => navigate("/admin/branches")}
      className="group text-left w-full bg-white border border-brand-border rounded-2xl shadow-sm p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
          <Building2 size={20} />
        </div>
        <ArrowUpRight size={18} className="text-gray-300 group-hover:text-brand-primary transition-colors" />
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-medium text-gray-600">Branch health</div>
        <div className="text-xs font-semibold text-gray-500">{pct}% active</div>
      </div>
      <div className="mt-2 h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5 text-gray-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {active} active
        </span>
        <span className="inline-flex items-center gap-1.5 text-gray-600">
          <span className="w-2 h-2 rounded-full bg-gray-300" />
          {inactive} inactive
        </span>
      </div>
    </button>
  );
}
