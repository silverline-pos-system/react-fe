import { useNavigate } from "react-router-dom";
import { KeyRound, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { usePasswordResetCount } from "@/context/PasswordResetCountContext";

export default function PendingRequestsCard() {
  const navigate = useNavigate();
  const { pendingCount: count, loading } = usePasswordResetCount();

  const hasPending = count > 0;

  return (
    <button
      type="button"
      onClick={() => navigate("/admin/password-requests")}
      className={`group text-left w-full rounded-2xl shadow-sm p-5 border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
        hasPending ? "bg-amber-50 border-amber-200" : "bg-white border-brand-border"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${hasPending ? "bg-amber-100 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
          {hasPending ? <KeyRound size={20} /> : <CheckCircle2 size={20} />}
        </div>
        <ArrowUpRight size={18} className="text-gray-300 group-hover:text-brand-primary transition-colors" />
      </div>
      <div className="text-2xl font-extrabold text-gray-800 tabular-nums">
        {loading ? "..." : count}
      </div>
      <div className="text-sm font-medium text-gray-600">Pending password requests</div>
      <div className={`text-xs mt-1 font-semibold ${hasPending ? "text-amber-600" : "text-emerald-600"}`}>
        {hasPending ? "Needs your review" : "Queue is clear"}
      </div>
    </button>
  );
}
