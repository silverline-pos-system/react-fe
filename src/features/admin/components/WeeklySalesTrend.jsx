import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatLKR, formatLKRCompact } from "../utils/format";

const dayLabel = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { weekday: "short" });
};

export default function WeeklySalesTrend({ data, loading }) {
  const chartData = useMemo(
    () =>
      (Array.isArray(data) ? data : []).map((row) => ({
        label: dayLabel(row.date),
        totalSales: Number(row.totalSales || 0),
      })),
    [data]
  );

  const { total, deltaPct, up } = useMemo(() => {
    const values = chartData.map((d) => d.totalSales);
    const sum = values.reduce((a, b) => a + b, 0);
    const first = values.find((v) => v > 0) ?? values[0] ?? 0;
    const last = values[values.length - 1] ?? 0;
    const pct = first > 0 ? ((last - first) / first) * 100 : 0;
    return { total: sum, deltaPct: pct, up: last >= first };
  }, [chartData]);

  if (loading) {
    return (
      <div className="bg-white border border-brand-border rounded-2xl shadow-sm p-6 animate-pulse h-full">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-5" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-brand-border rounded-2xl shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Weekly Sales Trend</h3>
          <p className="text-sm text-gray-500">Last 7 days, all branches</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-extrabold text-gray-800 tabular-nums">{formatLKR(total)}</div>
          <div
            className={`inline-flex items-center gap-1 text-xs font-semibold ${
              up ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(deltaPct).toFixed(1)}% vs start of week
          </div>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="flex-1 min-h-[250px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#6B7280", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatLKRCompact}
                tick={{ fill: "#6B7280", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip
                formatter={(value) => [formatLKR(value), "Sales"]}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                cursor={{ stroke: "#2563EB", strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              <Area
                type="monotone"
                dataKey="totalSales"
                stroke="#2563EB"
                strokeWidth={2.5}
                fill="url(#salesFill)"
                dot={{ r: 3, fill: "#2563EB" }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 min-h-[250px]">
          No sales recorded in the last 7 days
        </div>
      )}
    </div>
  );
}
