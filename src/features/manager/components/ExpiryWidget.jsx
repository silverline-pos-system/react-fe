import { useEffect, useState } from "react";
import Badge from "./Badge";
import { getExpiryAlerts } from "../services/managerService";

export default function ExpiryWidget() {
  const [expiries, setExpiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExpiries = async () => {
      try {
        setLoading(true);
        const data = await getExpiryAlerts();
        setExpiries(data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching expiry alerts:", err);
        setError("Failed to load expiry data");
      } finally {
        setLoading(false);
      }
    };

    fetchExpiries();
  }, []);

  return (
    <div className="bg-white border border-brand-border rounded-2xl shadow-sm p-5">
      <div className="font-bold mb-3 text-slate-800">Company Expiry Alerts</div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-brand-muted">Loading expiry data...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : expiries.length === 0 ? (
          <div className="text-sm text-brand-muted">No expiry alerts</div>
        ) : (
          expiries.map((e, i) => (
            <div key={i} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
              <div className="min-w-0">
                <div className="font-semibold">{e.item}</div>
                <div className="text-xs text-brand-muted">Expires: {e.expiresOn} • Qty: {e.qty}</div>
              </div>
              <Badge label={e.severity} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
