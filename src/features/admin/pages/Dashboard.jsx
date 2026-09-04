import { useEffect, useState } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { getDashboardOverview } from "../services/adminApi";
import UserStatsByRole from "../components/UserStatsByRole";
import TopBranchesChart from "../components/TopBranchesChart";
import KpiCards from "../components/KpiCards";
import WeeklySalesTrend from "../components/WeeklySalesTrend";
import PendingRequestsCard from "../components/PendingRequestsCard";
import BranchHealthCard from "../components/BranchHealthCard";
import RecentActivityFeed from "../components/RecentActivityFeed";
import QuickActions from "../components/QuickActions";

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getDashboardOverview();
      setOverview(data || {});
      setError(null);
    } catch (err) {
      console.error("Failed to load dashboard overview:", err);
      setError("Failed to load dashboard overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-800">Overview</h1>
          <p className="text-sm text-gray-500">Key metrics and actions at a glance</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-brand-border hover:bg-slate-50 transition text-sm font-semibold text-gray-700"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* KPI header row */}
      <KpiCards data={overview} loading={loading} />

      {/* Trend + actionable side column */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        <div className="xl:col-span-2 min-h-[380px] flex [&>*]:w-full">
          <WeeklySalesTrend data={overview?.weeklySalesTrend} loading={loading} />
        </div>
        <div className="xl:col-span-1 flex flex-col gap-6">
          <PendingRequestsCard />
          <BranchHealthCard data={overview} loading={loading} />
        </div>
      </div>

      {/* Existing widgets */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        <div className="xl:col-span-1 min-h-[400px] flex [&>*]:w-full [&>*]:flex-1">
          <UserStatsByRole stats={overview?.userStats} loading={loading} />
        </div>
        <div className="xl:col-span-2 min-h-[400px] flex [&>*]:w-full [&>*]:flex-1">
          <TopBranchesChart />
        </div>
      </div>

      {/* Activity feed + quick actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        <div className="xl:col-span-2 min-h-[320px] flex [&>*]:w-full [&>*]:flex-1">
          <RecentActivityFeed />
        </div>
        <div className="xl:col-span-1 min-h-[320px] flex [&>*]:w-full [&>*]:flex-1">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
