import { useNavigate } from "react-router-dom";
import { UserPlus, Building2, KeyRound, Puzzle, Activity, Palette } from "lucide-react";

const ACTIONS = [
  { label: "Register Manager", icon: UserPlus, to: "/admin/users", accent: "bg-purple-50 text-purple-600" },
  { label: "Add Branch", icon: Building2, to: "/admin/branches", accent: "bg-blue-50 text-blue-600" },
  { label: "Password Requests", icon: KeyRound, to: "/admin/password-requests", accent: "bg-amber-50 text-amber-600" },
  { label: "Feature Management", icon: Puzzle, to: "/admin/features", accent: "bg-emerald-50 text-emerald-600" },
  { label: "System Activity", icon: Activity, to: "/admin/system-activity", accent: "bg-slate-100 text-slate-600" },
  { label: "Print Templates", icon: Palette, to: "/admin/bill-templates", accent: "bg-rose-50 text-rose-600" },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-brand-border rounded-2xl shadow-sm p-6 flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800">Quick Actions</h3>
        <p className="text-sm text-gray-500">Jump straight to a task</p>
      </div>
      <div className="grid grid-cols-2 gap-3 flex-1">
        {ACTIONS.map(({ label, icon: Icon, to, accent }) => (
          <button
            key={to}
            type="button"
            onClick={() => navigate(to)}
            className="group flex flex-col items-start gap-2 p-4 rounded-xl border border-gray-100 hover:border-brand-primary/30 hover:bg-slate-50 hover:-translate-y-0.5 transition-all duration-200 text-left"
          >
            <span className={`p-2 rounded-lg ${accent} group-hover:scale-110 transition-transform`}>
              <Icon size={18} />
            </span>
            <span className="text-sm font-semibold text-gray-700 leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
