import { useState, useEffect } from "react";
import { useBranch } from "@/context/BranchContext";
import {
  DollarSign, TrendingUp, TrendingDown, ShoppingCart, Users,
  Calendar, RefreshCw, Download, CreditCard, QrCode, Banknote,
  ArrowUpRight, ArrowDownRight, Clock, Package, Activity
} from "lucide-react";
import { getSalesAnalytics, getTopSellingProducts } from "../services/managerService";
import { useSystemName } from "@/context/SystemNameContext";

// Mini sparkline component
function MiniSparkline({ data, color = "#10b981" }) {
  if (!data || data.length < 2) return <div className="w-20 h-6" />;
  
  const values = data.map(d => Number(typeof d === 'number' ? d : (d.value || d.sales || 0)));
  const max = Math.max(...values, 1);
  const width = 80;
  const height = 24;
  
  const points = values.map((val, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - (val / max) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-20 h-6" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, color, trend, trendValue, sparkData }) {
  const colors = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' }
  };
  const c = colors[color] || colors.blue;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${c.bg} ${c.border} border`}>
          <Icon size={20} className={c.text} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
            {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trendValue}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-800 mb-1">{value}</div>
      <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">{title}</div>
      {sparkData && sparkData.length > 0 && (
        <MiniSparkline data={sparkData} color={trend === 'up' ? '#10b981' : '#f59e0b'} />
      )}
    </div>
  );
}

// Hourly Sales Chart
function HourlySalesChart({ data }) {
  const maxSales = Math.max(...data.map(h => Number(h.sales) || 0), 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Clock size={18} className="text-blue-500" />
        Sales by Hour
      </h3>
      <div className="flex items-end gap-1 h-40">
        {data.map((hour, idx) => {
          const sales = Number(hour.sales) || 0;
          const heightPct = (sales / maxSales) * 100;
          const isCurrentHour = new Date().getHours() === parseInt(hour.hour);

          return (
            <div key={idx} className="flex-1 flex flex-col items-center group">
              <div className="relative w-full flex justify-center mb-1">
                <div
                  className={`w-full max-w-[20px] rounded-t transition-all duration-300 cursor-pointer group-hover:opacity-80 ${isCurrentHour ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-gradient-to-t from-slate-300 to-slate-200'
                    }`}
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                  title={`${hour.hour}: LKR ${sales.toLocaleString()}`}
                />
              </div>
              {idx % 3 === 0 && (
                <span className="text-[10px] text-slate-400 mt-1">{hour.hour?.split(':')[0]}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Payment Methods Chart
function PaymentMethodsChart({ data }) {
  const total = data.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  const methodConfig = {
    CASH: { icon: Banknote, color: '#10b981', label: 'Cash' },
    CARD: { icon: CreditCard, color: '#3b82f6', label: 'Card' },
    QR: { icon: QrCode, color: '#8b5cf6', label: 'QR' },
    OTHER: { icon: DollarSign, color: '#f59e0b', label: 'Other' }
  };

  const segments = data.reduce(
    (acc, d) => {
      const pct = total > 0 ? (Number(d.amount || 0) / total) * 100 : 0;
      const start = acc.cumulative;
      const end = start + pct;
      acc.segments.push({ ...d, percentage: pct, start, end });
      acc.cumulative = end;
      return acc;
    },
    { cumulative: 0, segments: [] }
  ).segments;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <DollarSign size={18} className="text-emerald-500" />
        Payment Methods
      </h3>
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            {segments.map((seg, idx) => {
              const config = methodConfig[seg.method] || methodConfig.OTHER;
              return (
                <circle
                  key={idx}
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke={config.color}
                  strokeWidth="3"
                  strokeDasharray={`${seg.percentage} ${100 - seg.percentage}`}
                  strokeDashoffset={-seg.start}
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-slate-800">{data.length}</div>
              <div className="text-xs text-slate-400">Types</div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((d, idx) => {
            const config = methodConfig[d.method] || methodConfig.OTHER;
            const Icon = config.icon;
            return (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                <Icon size={14} className="text-slate-400" />
                <span className="text-sm text-slate-600 flex-1">{config.label}</span>
                <span className="text-sm font-bold text-slate-800">
                  LKR {Number(d.amount || 0).toLocaleString()}
                </span>
                <span className="text-xs text-slate-400">({d.percentage?.toFixed(1) || 0}%)</span>
              </div>
            );
          })}
          {data.length === 0 && (
            <div className="text-sm text-slate-400 text-center py-4">No payment data</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Recent Transactions List
function RecentTransactions({ data }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Activity size={18} className="text-purple-500" />
        Recent Transactions
      </h3>
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {data.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No recent transactions</div>
        ) : data.map((tx, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'RETURN' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
              {tx.type === 'RETURN' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-800">{tx.invoiceNo}</div>
              <div className="text-xs text-slate-400">{tx.cashier} • {tx.itemCount} items</div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-bold ${tx.type === 'RETURN' ? 'text-red-600' : 'text-slate-800'}`}>
                {tx.type === 'RETURN' ? '-' : ''}LKR {Number(tx.amount || 0).toLocaleString()}
              </div>
              <div className="text-xs text-slate-400">{tx.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Top Products List
function TopProductsList({ data }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Package size={18} className="text-amber-500" />
        Top Selling Products
      </h3>
      <div className="space-y-3">
        {data.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No product data</div>
        ) : data.map((product, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-700 font-bold text-sm">
              {idx + 1}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-800">{product.name}</div>
              <div className="text-xs text-slate-400">{product.sku}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-800">{product.units} units</div>
              <div className="text-xs text-emerald-600">{product.revenue}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Sales() {
  const { selectedBranchId } = useBranch();
  const { systemName } = useSystemName();
  const reportSystemName = (systemName || "SmartRetail Pro").toUpperCase();
  const [analytics, setAnalytics] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState("daily");

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [analyticsData, productsData] = await Promise.all([
        getSalesAnalytics(period),
        getTopSellingProducts(5)
      ]);

      setAnalytics(analyticsData);
      setTopProducts(productsData || []);
    } catch (err) {
      console.error("Failed to load sales data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [period, selectedBranchId]);

  const exportData = () => {
    if (!analytics) return;

    const lines = [];
    lines.push(`📊 ${reportSystemName} - SALES DASHBOARD`);
    lines.push("=".repeat(60));
    lines.push(`📅 Generated: ${new Date().toLocaleString()}`);
    lines.push(`📈 Period: ${period.toUpperCase()}`);
    lines.push("=".repeat(60));
    lines.push("");
    lines.push("KEY METRICS:");
    lines.push(`Today's Revenue: LKR ${Number(analytics.todaySales || 0).toLocaleString()}`);
    lines.push(`Transactions: ${analytics.todayTransactions || 0}`);
    lines.push(`Avg Transaction: LKR ${Number(analytics.avgTransactionValue || 0).toLocaleString()}`);
    lines.push(`Customers Served: ${analytics.customersServed || 0}`);
    lines.push(`Growth: ${analytics.growthPercentage?.toFixed(1) || 0}%`);
    lines.push("");
    lines.push("PAYMENT BREAKDOWN:");
    (analytics.paymentBreakdown || []).forEach(p => {
      lines.push(`${p.method}: LKR ${Number(p.amount || 0).toLocaleString()} (${p.count} transactions)`);
    });

    const csv = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-dashboard-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Loading sales data...</p>
        </div>
      </div>
    );
  }

  const sparkData = analytics?.dailyTrend || [];
  const growthUp = (analytics?.growthPercentage || 0) >= 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-emerald-600" />
            Sales Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Real-time sales analytics and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-xl p-1">
            {['daily', 'weekly', 'monthly'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === p
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className={`p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-all ${refreshing ? 'animate-spin' : ''
              }`}
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Revenue"
          value={`LKR ${Number(analytics?.todaySales || 0).toLocaleString()}`}
          icon={DollarSign}
          color="emerald"
          trend={growthUp ? 'up' : 'down'}
          trendValue={Math.abs(analytics?.growthPercentage || 0).toFixed(1)}
          sparkData={sparkData}
        />
        <StatCard
          title="Transactions"
          value={analytics?.todayTransactions || 0}
          icon={ShoppingCart}
          color="blue"
          trend={growthUp ? 'up' : 'down'}
          trendValue={Math.abs(analytics?.growthPercentage || 0).toFixed(1)}
        />
        <StatCard
          title="Avg Transaction"
          value={`LKR ${Number(analytics?.avgTransactionValue || 0).toLocaleString()}`}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Customers Served"
          value={analytics?.customersServed || 0}
          icon={Users}
          color="amber"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <HourlySalesChart data={analytics?.hourlySales || []} />
        <PaymentMethodsChart data={analytics?.paymentBreakdown || []} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <RecentTransactions data={analytics?.recentTransactions || []} />
        <TopProductsList data={topProducts} />
      </div>
    </div>
  );
}
