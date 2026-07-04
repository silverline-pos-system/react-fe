import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function BranchSalesChart({ data = [] }) {
  let safeData = [];

  if (Array.isArray(data) && data.length > 0) {
    if (typeof data[0] === 'number') {
      safeData = data;
    } else if (data[0] && typeof data[0] === 'object') {
      safeData = data.map(item => (typeof item === 'number' ? item : item.value || 0));
    }
  } else if (data && typeof data === 'object' && !Array.isArray(data)) {
    if (typeof data.value === 'number') {
      safeData = [data.value];
    } else if (Array.isArray(data.data)) {
      safeData = data.data;
    }
  }

  if (safeData.length === 0) {
    safeData = [0, 0, 0, 0, 0, 0, 0];
  }

  const chartData = safeData.map((value, i) => ({
    day: days[i] || `D${i + 1}`,
    sales: typeof value === 'number' ? value : 0
  }));

  const hasValidData = safeData.length > 0 && safeData.some(v => v !== 0);

  return (
    <div className="bg-white border border-brand-border rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-bold">Branch Weekly Sales</div>
        <span className="text-xs px-3 py-1 rounded-full bg-slate-100 border border-brand-border font-bold">
          💰 Sales
        </span>
      </div>

      <div style={{ width: '100%', height: '288px', minHeight: '288px', minWidth: '0' }}>
        {!hasValidData ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }} className="text-brand-muted text-sm">
            No sales data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={288} margin={0} minWidth={1} minHeight={1}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
