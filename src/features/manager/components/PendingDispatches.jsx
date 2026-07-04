import { useEffect, useState } from "react";
import Badge from "./Badge";
import { getPendingDispatches } from "../services/managerService";

export default function PendingDispatches() {
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDispatches = async () => {
      try {
        setLoading(true);
        const data = await getPendingDispatches();
        setDispatches(data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching pending Dispatches:", err);
        setError("Failed to load Dispatches");
      } finally {
        setLoading(false);
      }
    };

    fetchDispatches();
  }, []);

  return (
    <div className="bg-white border border-brand-border rounded-2xl shadow-sm p-5">
      <div className="font-bold mb-3">Pending Dispatches</div>
      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-brand-muted">Loading Dispatches...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : dispatches.length === 0 ? (
          <div className="text-sm text-brand-muted">No pending Dispatches</div>
        ) : (
          dispatches.map((g) => (
            <div key={g.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
              <div>
                <div className="font-bold">{g.id}</div>
                <div className="text-xs text-brand-muted">{g.supplier} • {g.items} items</div>
                <div className="text-[10px] text-indigo-500 font-bold mt-0.5">Req By: {g.requestedBy}</div>
              </div>
              <Badge label={g.eta === "Today" ? "Warning" : "Success"} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
