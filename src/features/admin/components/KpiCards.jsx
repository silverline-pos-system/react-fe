import { useNavigate } from "react-router-dom";
import { TrendingUp, Wallet, Users, Building2, ArrowUpRight } from "lucide-react";
import { formatLKR } from "../utils/format";

const Card = ({ icon: Icon, label, value, sub, accent, to, onClick }) => {
  const navigate = useNavigate();
  const clickable = Boolean(to);

  return (
    <button
      type="button"
      onClick={onClick || (clickable ? () => navigate(to) : undefined)}
      disabled={!clickable}
      className={`group text-left w-full bg-white border border-brand-border rounded-2xl shadow-sm p-5 flex flex-col gap-3 transition-all duration-200 ${
        clickable ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : "cursor-default"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`p-2.5 rounded-xl ${accent}`}>
          <Icon size={20} />
        </div>
        {clickable && (
          <ArrowUpRight
            size={18}
            className="text-gray-300 group-hover:text-brand-primary transition-colors"
          />
        )}
      </div>
      <div>
        <div className="text-2xl font-extrabold text-gray-800 tabular-nums">{value}</div>
        <div className="text-sm font-medium text-gray-500">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
      </div>
    </button>
  );
};

export default function KpiCards({ data, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const overview = data || {};
  const userStats = overview.userStats || {};
  const totalBranches = Number(overview.totalBranches || 0);
  const activeBranches = Number(overview.activeBranches || 0);
  const totalUsers = Number(overview.totalUsers ?? userStats.TOTAL ?? 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <Card
        icon={TrendingUp}
        label="Today's Sales"
        value={formatLKR(overview.todaySales)}
        sub="Across all branches"
        accent="bg-emerald-50 text-emerald-600"
        to="/admin/branches"
      />
      <Card
        icon={Wallet}
        label="This Month's Sales"
        value={formatLKR(overview.monthSales)}
        sub="Current calendar month"
        accent="bg-blue-50 text-blue-600"
      />
      <Card
        icon={Users}
        label="Total Users"
        value={totalUsers.toLocaleString()}
        sub="Registered accounts"
        accent="bg-purple-50 text-purple-600"
        to="/admin/users"
      />
      <Card
        icon={Building2}
        label="Active Branches"
        value={`${activeBranches} / ${totalBranches}`}
        sub={totalBranches - activeBranches > 0 ? `${totalBranches - activeBranches} inactive` : "All active"}
        accent="bg-amber-50 text-amber-600"
        to="/admin/branches"
      />
    </div>
  );
}
