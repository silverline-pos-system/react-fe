import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import TopSellingTable from "../components/TopSellingTable";
import StaffWidget from "../components/StaffWidget";
import StockAlertsWidget from "../components/StockAlertsWidget";
import ExpiryWidget from "../components/ExpiryWidget";

import { getApprovals, getDashboardStats, getStaffSummary, getLoyaltyStats } from "../services/managerService";
import { useBranch } from "@/context/BranchContext";

export default function Dashboard() {
  const { branches } = useBranch();
  const [kpiCards, setKpiCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.removeItem('selectedBranchId');

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsResponse, approvalsResponse, _staffResponse, loyaltyResponse] = await Promise.all([
          getDashboardStats(),
          getApprovals(),
          getStaffSummary(),
          getLoyaltyStats().catch(() => ({ totalCustomers: 0, totalPoints: 0 }))
        ]);

        const statsArray = Array.isArray(statsResponse) ? statsResponse : [statsResponse];

        const pendingCount = (Array.isArray(approvalsResponse) ? approvalsResponse : []).filter(
          (r) => (r.status || "").toUpperCase() === "PENDING"
        ).length;

        const customerCount = loyaltyResponse?.totalCustomers || 0;

        const salesStat = statsArray.find(s => s.title?.includes("Sales")) || { value: "LKR 0" };

        setKpiCards([
          {
            title: 'Global Daily Revenue',
            value: salesStat.value,
            icon: 'revenue',
            tone: 'primary',
          },
          {
            title: 'Active Branches',
            value: branches.length || 0,
            icon: 'staff',
            tone: 'secondary',
          },
          {
            title: 'Registered Customers',
            value: customerCount.toLocaleString(),
            icon: 'users',
            tone: 'success',
          },
          {
            title: 'Pending Approvals',
            value: pendingCount,
            icon: 'pending',
            tone: pendingCount > 0 ? 'warning' : 'success',
          },
        ]);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [branches.length]);

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
