import { useEffect, useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, Download,
  Calendar, RefreshCw, ChevronRight, ChevronDown,
  ArrowUpRight, ArrowDownRight, Printer, PieChart,
  BarChart2, Target, AlertCircle, CheckCircle
} from "lucide-react";
import { getProfitAndLoss } from "../services/managerService";
import { useSystemName } from "@/context/SystemNameContext";

function PLLineItem({ item, level = 0, isExpanded, onToggle }) {
  const hasChildren = item.children && item.children.length > 0;
  const indent = level * 24;

  return (
    <>
      <tr
        className={`hover:bg-slate-50 transition-colors cursor-pointer ${level === 0 ? 'font-semibold' : ''}`}
        onClick={() => hasChildren && onToggle(item.id)}
      >
        <td className="p-4" style={{ paddingLeft: `${16 + indent}px` }}>
          <div className="flex items-center gap-2">
            {hasChildren && (
              isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />
            )}
            {!hasChildren && <span className="w-4" />}
            <span className={level === 0 ? 'text-slate-800' : 'text-slate-600'}>{item.name}</span>
          </div>
        </td>
        <td className="p-4 text-right">
          {item.budget > 0 && (
            <span className="text-slate-400">LKR {item.budget.toLocaleString()}</span>
          )}
        </td>
        <td className="p-4 text-right font-bold">
          <span className={item.isNegative ? 'text-red-600' : 'text-slate-800'}>
            {item.isNegative && '-'}LKR {Math.abs(item.amount).toLocaleString()}
          </span>
        </td>
        <td className="p-4 text-right">
          {item.budget > 0 && (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.variance >= 0
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700'
              }`}>
              {item.variance >= 0 ? '+' : ''}{item.variance?.toFixed(1) || 0}%
            </span>
          )}
        </td>
      </tr>
      {hasChildren && isExpanded && item.children.map(child => (
        <PLLineItem
          key={child.id}
          item={child}
          level={level + 1}
          isExpanded={false}
          onToggle={onToggle}
        />
      ))}
    </>
  );
}

function KPICard({ title, value, subtitle, icon: Icon, trend, trendValue, color = "blue" }) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    red: "from-red-500 to-red-600",
    purple: "from-purple-500 to-purple-600"
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-5 text-white relative overflow-hidden shadow-lg`}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20"></div>
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-xl bg-white/20">
            <Icon size={20} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-400/30' : 'bg-red-400/30'
              }`}>
              {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {trendValue}%
            </div>
          )}
        </div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-sm opacity-80 mt-1">{title}</div>
        {subtitle && <div className="text-xs opacity-60 mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}

function ExpenseBreakdown({ expenses }) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0) || 1;
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-red-500', 'bg-cyan-500'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800">Expense Breakdown</h3>
        <PieChart size={18} className="text-slate-400" />
      </div>

      <div className="h-4 flex rounded-full overflow-hidden mb-4">
        {expenses.map((e, i) => (
          <div
            key={i}
            className={`${colors[i % colors.length]} transition-all`}
            style={{ width: `${(e.amount / total) * 100}%` }}
            title={`${e.name}: LKR ${e.amount.toLocaleString()}`}
          />
        ))}
      </div>

      <div className="space-y-2">
        {expenses.slice(0, 6).map((e, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`} />
              <span className="text-sm text-slate-600">{e.name}</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-slate-800">LKR {e.amount.toLocaleString()}</span>
              <span className="text-slate-400 ml-2">({((e.amount / total) * 100).toFixed(1)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthlyComparison({ data }) {
  const maxVal = Math.max(...data.map(d => Math.max(d.revenue, d.expenses)), 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800">Monthly Comparison</h3>
        <BarChart2 size={18} className="text-slate-400" />
      </div>

      <div className="flex items-end gap-4 h-40">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex gap-1 items-end justify-center h-32">
              <div
                className="w-6 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t"
                style={{ height: `${(d.revenue / maxVal) * 100}%` }}
                title={`Revenue: LKR ${d.revenue.toLocaleString()}`}
              />
              <div
                className="w-6 bg-gradient-to-t from-red-400 to-red-300 rounded-t"
                style={{ height: `${(d.expenses / maxVal) * 100}%` }}
                title={`Expenses: LKR ${d.expenses.toLocaleString()}`}
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">{d.month}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm text-slate-600">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <span className="text-sm text-slate-600">Expenses</span>
        </div>
      </div>
    </div>
  );
}

function ProfitMarginGauge({ margin }) {
  const getColor = (m) => {
    if (m >= 20) return { bg: 'bg-emerald-500', text: 'text-emerald-700', status: 'Excellent' };
    if (m >= 10) return { bg: 'bg-blue-500', text: 'text-blue-700', status: 'Good' };
    if (m >= 5) return { bg: 'bg-amber-500', text: 'text-amber-700', status: 'Fair' };
    return { bg: 'bg-red-500', text: 'text-red-700', status: 'Needs Attention' };
  };

  const { bg, text, status } = getColor(margin);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800">Profit Margin</h3>
        <Target size={18} className="text-slate-400" />
      </div>

      <div className="relative pt-4">
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${bg} transition-all duration-1000`}
            style={{ width: `${Math.min(margin, 100)}%` }}
          />
        </div>
        <div className="absolute -top-1 left-0 right-0 flex justify-between text-xs text-slate-400">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <div className="text-4xl font-bold text-slate-800">{margin.toFixed(1)}%</div>
        <div className={`text-sm font-medium ${text} mt-1`}>
          {margin >= 0 ? <CheckCircle size={14} className="inline mr-1" /> : <AlertCircle size={14} className="inline mr-1" />}
          {status}
        </div>
      </div>
    </div>
  );
}

export default function ProfitLoss() {
  const { systemName } = useSystemName();
  const reportSystemName = (systemName || "SmartRetail Pro").toUpperCase();
  const [plData, setPlData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("monthly");

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getProfitAndLoss(period);

      if (data) {
        setPlData(data);
      } else {
        setPlData(null);
      }
    } catch (err) {
      console.error("Error fetching P&L:", err);
      setPlData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const calculations = useMemo(() => {
    if (!plData) return null;

    const totalExpenses = plData.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const operatingProfit = plData.grossProfit - totalExpenses;
    const netProfit = operatingProfit;
    const grossMargin = plData.revenue > 0 ? (plData.grossProfit / plData.revenue) * 100 : 0;
    const netMargin = plData.revenue > 0 ? (netProfit / plData.revenue) * 100 : 0;
    const revenueGrowth = plData.previousRevenue > 0
      ? ((plData.revenue - plData.previousRevenue) / plData.previousRevenue) * 100
      : 0;
    const profitGrowth = plData.previousProfit > 0
      ? ((netProfit - plData.previousProfit) / plData.previousProfit) * 100
      : 0;

    const expensesWithVariance = plData.expenses?.map(e => ({
      ...e,
      variance: e.budget > 0 ? ((e.budget - e.amount) / e.budget) * 100 : 0
    })) || [];

    return {
      totalExpenses,
      operatingProfit,
      netProfit,
      grossMargin,
      netMargin,
      revenueGrowth,
      profitGrowth,
      expensesWithVariance
    };
  }, [plData]);

  const exportReport = () => {
    if (!plData || !calculations) return;

    const lines = [];
    lines.push(`📈 ${reportSystemName} - PROFIT & LOSS STATEMENT`);
    lines.push("=".repeat(70));
    lines.push(`📅 Generated: ${new Date().toLocaleString()}`);
    lines.push(`📆 Period: ${plData.period}`);
    lines.push("=".repeat(70));
    lines.push("");

    lines.push("INCOME");
    lines.push("-".repeat(70));
    lines.push(`Sales Revenue,LKR ${plData.revenue.toLocaleString()}`);
    lines.push("");

    lines.push("COST OF GOODS SOLD");
    lines.push("-".repeat(70));
    lines.push(`Cost of Goods Sold,LKR ${plData.cogs.toLocaleString()}`);
    lines.push(`GROSS PROFIT,LKR ${plData.grossProfit.toLocaleString()}`);
    lines.push("");

    lines.push("OPERATING EXPENSES");
    lines.push("-".repeat(70));
    calculations.expensesWithVariance.forEach(e => {
      lines.push(`${e.name},LKR ${e.amount.toLocaleString()}`);
    });
    lines.push(`TOTAL EXPENSES,LKR ${calculations.totalExpenses.toLocaleString()}`);
    lines.push("");

    lines.push("=".repeat(70));
    lines.push(`NET PROFIT,LKR ${calculations.netProfit.toLocaleString()}`);
    lines.push(`Profit Margin,${calculations.netMargin.toFixed(1)}%`);
    lines.push("=".repeat(70));
    lines.push("✅ End of Report");

    const csv = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `profit-loss-${period}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Loading P&L report...</p>
        </div>
      </div>
    );
  }

  if (!plData || !calculations) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500">No P&L data available for the selected period.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            Profit & Loss Statement
          </h1>
          <p className="text-slate-500 mt-1">
            Financial performance for <span className="font-medium text-slate-700">{plData.period}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors"
          >
            <Printer size={16} />
            Print
          </button>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={`LKR ${plData.revenue.toLocaleString()}`}
          subtitle="Gross Sales"
          icon={DollarSign}
          color="blue"
          trend={calculations.revenueGrowth >= 0 ? 'up' : 'down'}
          trendValue={Math.abs(calculations.revenueGrowth).toFixed(1)}
        />
        <KPICard
          title="Gross Profit"
          value={`LKR ${plData.grossProfit.toLocaleString()}`}
          subtitle={`${calculations.grossMargin.toFixed(1)}% margin`}
          icon={TrendingUp}
          color="emerald"
        />
        <KPICard
          title="Operating Expenses"
          value={`LKR ${calculations.totalExpenses.toLocaleString()}`}
          subtitle={`${((calculations.totalExpenses / plData.revenue) * 100).toFixed(1)}% of revenue`}
          icon={TrendingDown}
          color="amber"
        />
        <KPICard
          title="Net Profit"
          value={`LKR ${calculations.netProfit.toLocaleString()}`}
          subtitle={`${calculations.netMargin.toFixed(1)}% margin`}
          icon={Target}
          color={calculations.netProfit >= 0 ? "emerald" : "red"}
          trend={calculations.profitGrowth >= 0 ? 'up' : 'down'}
          trendValue={Math.abs(calculations.profitGrowth).toFixed(1)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MonthlyComparison data={plData.monthlyTrend || []} />
        <ExpenseBreakdown expenses={calculations.expensesWithVariance} />
        <ProfitMarginGauge margin={calculations.netMargin} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <h3 className="font-bold text-slate-800">Detailed Statement</h3>
          <p className="text-sm text-slate-500 mt-1">Click rows to expand details</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-slate-600">
              <tr>
                <th className="text-left p-4 font-semibold">Description</th>
                <th className="text-right p-4 font-semibold">Budget</th>
                <th className="text-right p-4 font-semibold">Actual</th>
                <th className="text-right p-4 font-semibold">Variance</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-blue-50/50 font-bold text-blue-800">
                <td className="p-4">REVENUE</td>
                <td className="p-4 text-right">-</td>
                <td className="p-4 text-right">LKR {plData.revenue.toLocaleString()}</td>
                <td className="p-4 text-right">-</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="p-4 pl-8 text-slate-600">Sales Revenue</td>
                <td className="p-4 text-right text-slate-400">-</td>
                <td className="p-4 text-right font-semibold">LKR {plData.revenue.toLocaleString()}</td>
                <td className="p-4 text-right">-</td>
              </tr>

              <tr className="bg-red-50/50 font-bold text-red-800 border-t-2 border-slate-200">
                <td className="p-4">COST OF GOODS SOLD</td>
                <td className="p-4 text-right">-</td>
                <td className="p-4 text-right">LKR {plData.cogs.toLocaleString()}</td>
                <td className="p-4 text-right">-</td>
              </tr>

              <tr className="bg-emerald-50 font-bold text-emerald-800 border-t-2 border-slate-200">
                <td className="p-4">GROSS PROFIT</td>
                <td className="p-4 text-right">-</td>
                <td className="p-4 text-right">LKR {plData.grossProfit.toLocaleString()}</td>
                <td className="p-4 text-right">
                  <span className="px-2 py-1 bg-emerald-100 rounded-full text-xs">
                    {calculations.grossMargin.toFixed(1)}% margin
                  </span>
                </td>
              </tr>

              <tr className="bg-amber-50/50 font-bold text-amber-800 border-t-2 border-slate-200">
                <td className="p-4">OPERATING EXPENSES</td>
                <td className="p-4 text-right">-</td>
                <td className="p-4 text-right">LKR {calculations.totalExpenses.toLocaleString()}</td>
                <td className="p-4 text-right">-</td>
              </tr>
              {calculations.expensesWithVariance.map(exp => (
                <tr key={exp.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-4 pl-8 text-slate-600">{exp.name}</td>
                  <td className="p-4 text-right text-slate-400">
                    {exp.budget > 0 ? `LKR ${exp.budget.toLocaleString()}` : '-'}
                  </td>
                  <td className="p-4 text-right font-semibold">LKR {exp.amount.toLocaleString()}</td>
                  <td className="p-4 text-right">
                    {exp.budget > 0 && (
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${exp.variance >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {exp.variance >= 0 ? 'Under' : 'Over'} {Math.abs(exp.variance).toFixed(0)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              <tr className={`font-bold text-lg border-t-4 border-slate-300 ${calculations.netProfit >= 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                }`}>
                <td className="p-5">NET PROFIT / (LOSS)</td>
                <td className="p-5 text-right">-</td>
                <td className="p-5 text-right text-xl">
                  {calculations.netProfit < 0 && '('}
                  LKR {Math.abs(calculations.netProfit).toLocaleString()}
                  {calculations.netProfit < 0 && ')'}
                </td>
                <td className="p-5 text-right">
                  <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${calculations.netProfit >= 0 ? 'bg-emerald-200' : 'bg-red-200'
                    }`}>
                    {calculations.netMargin.toFixed(1)}% margin
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
