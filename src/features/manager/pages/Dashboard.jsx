import { useEffect } from "react";
import StatCard from "../components/StatCard";
import TopSellingTable from "../components/TopSellingTable";
import StaffWidget from "../components/StaffWidget";
import StockAlertsWidget from "../components/StockAlertsWidget";
import ExpiryWidget from "../components/ExpiryWidget";

import { useApprovals, useDashboardStats, useLoyaltyStats } from "../hooks/managerQueries";
import { useBranch } from "@/context/BranchContext";

export default function Dashboard() {
  const { branches } = useBranch();

  // Cached/deduped server state. The approvals query is shared with the sidebar badge, so the
  // dashboard no longer re-fetches approvals independently.
  const statsQuery = useDashboardStats();
  const approvalsQuery = useApprovals('PENDING');
  const loyaltyQuery = useLoyaltyStats();

  useEffect(() => {
    localStorage.removeItem('selectedBranchId');
  }, []);

  const loading = statsQuery.isLoading || approvalsQuery.isLoading || loyaltyQuery.isLoading;
  const error = statsQuery.isError || approvalsQuery.isError || loyaltyQuery.isError
    ? "Failed to load dashboard data. Please try again."
    : null;

  const statsArray = statsQuery.data || [];
  const salesStat = statsArray.find((s) => s.title?.includes("Sales")) || { value: "LKR 0" };
  const pendingCount = (approvalsQuery.data || []).filter(
    (r) => (r.status || "").toUpperCase() === "PENDING",
  ).length;
  const customerCount = loyaltyQuery.data?.totalCustomers || 0;

  const kpiCards = [
    { title: 'Global Daily Revenue', value: salesStat.value, icon: 'revenue', tone: 'primary' },
    { title: 'Active Branches', value: branches.length || 0, icon: 'staff', tone: 'secondary' },
    { title: 'Registered Customers', value: customerCount.toLocaleString(), icon: 'users', tone: 'success' },
    { title: 'Pending Approvals', value: pendingCount, icon: 'pending', tone: pendingCount > 0 ? 'warning' : 'success' },
  ];

  if (error) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-extrabold">Company Manager Dashboard</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Company Overview</h1>
          <p className="text-sm text-slate-500 font-medium">
            Real-time insights across all business branches and operations.
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-2xl border border-slate-200"></div>
          ))
        ) : (
          kpiCards.map((s, i) => (
            <StatCard key={i} title={s.title} value={s.value} icon={s.icon} tone={s.tone} />
          ))
        )}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Top Selling & Global Performance */}
        <div className="xl:col-span-2 space-y-6">
          <TopSellingTable />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StockAlertsWidget />
            <ExpiryWidget />
          </div>
        </div>

        {/* Right: Staff & Approvals */}
        <div className="xl:col-span-1 space-y-6">
          <StaffWidget />
        </div>
      </div>
    </div>
  );
}
