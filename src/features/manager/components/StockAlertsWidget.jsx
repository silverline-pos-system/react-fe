import { useEffect, useState } from "react";
import Badge from "./Badge";
import { getStockAlerts } from "../services/managerService";

export default function StockAlertsWidget() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const data = await getStockAlerts();
        setAlerts(data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching stock alerts:", err);
        setError("Failed to load stock alerts");
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  return (
    <div className="bg-white border border-brand-border rounded-2xl shadow-sm p-5">
      <div className="font-bold mb-3 text-slate-800">Low Stock (All Branches)</div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-brand-muted">Loading stock alerts...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : alerts.length === 0 ? (
          <div className="text-sm text-brand-muted">No stock alerts</div>
        ) : (
          alerts.map((a, i) => (
            <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
              <div>
                <div className="font-bold">{a.item}</div>
                <div className="text-xs text-brand-muted">Only {a.qty} left</div>
              </div>
              <Badge label={a.level} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
