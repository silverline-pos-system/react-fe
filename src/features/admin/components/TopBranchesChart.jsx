import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getTopBranchesBySales } from "../services/adminApi";

const COLORS = ["#1F3C88", "#2563EB", "#16A34A", "#F59E0B", "#EF4444"];

export default function TopBranchesChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getTopBranchesBySales();
        setData(result);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch top branches:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (value) => `LKR ${((value || 0) / 1000).toFixed(0)}K`;

  if (loading) {
    return (
      <div className="bg-white border border-brand-border rounded-2xl shadow-sm p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-5"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl shadow-sm p-6">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-brand-border rounded-2xl shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            Top Performing Branches
          </h3>
          <p className="text-sm text-gray-500">Today's sales comparison</p>
        </div>
      </div>

      {data.length > 0 ? (
        <div className="flex-1 flex flex-col min-h-[250px]">
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  tickFormatter={formatCurrency}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="branchName"
                  tick={{ fill: "#374151", fontSize: 12, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip
                  formatter={(value) => [`LKR ${(value || 0).toLocaleString()}`, "Sales"]}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  cursor={{ fill: "rgba(31, 60, 136, 0.1)" }}
                />
                <Bar dataKey="totalSales" radius={[0, 8, 8, 0]} barSize={32}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
            {data.slice(0, 3).map((branch, index) => (
              <div key={branch.branchId || branch.branchName || index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                ></div>
                <span className="text-xs text-gray-600">
                  {index + 1}. {branch.branchName}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No data available
        </div>
      )}
    </div>
  );
}
