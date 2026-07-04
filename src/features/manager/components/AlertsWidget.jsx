import { useEffect, useState } from "react";
import Badge from "./Badge";
import { getBranchAlerts } from "../services/managerService";

export default function AlertsWidget() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const data = await getBranchAlerts();
        setAlerts(data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching alerts:", err);
        setError("Failed to load alerts");
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  return (
    <div className="bg-white border border-brand-border rounded-2xl shadow-sm p-5">
      <div className="font-bold mb-3">Alerts</div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-brand-muted">Loading alerts...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : alerts.length === 0 ? (
          <div className="text-sm text-brand-muted">No recent alerts</div>
        ) : (
          alerts.map((a, i) => (
            <div key={i} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
              <div className="min-w-0">
                <div className="font-semibold">{a.message}</div>
                <div className="text-xs text-brand-muted">{a.time}</div>
              </div>
              <Badge label={a.type} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
