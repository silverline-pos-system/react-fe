export default function ChartBox({ title = "Weekly Sales Performance", data = [] }) {
  const max = Math.max(...data, 1);

  return (
    <div className="bg-white border border-brand-border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 flex items-center justify-between">
        <div className="font-bold">{title}</div>
      </div>

      <div className="px-5 pb-5">
        <div className="flex items-end gap-3 h-44">
          {data.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full rounded-lg bg-brand-primary/80"
                style={{ height: `${(v / max) * 100}%` }}
                title={`${v}`}
              />
              <div className="text-[10px] text-brand-muted">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i] ?? `D${i + 1}`}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
