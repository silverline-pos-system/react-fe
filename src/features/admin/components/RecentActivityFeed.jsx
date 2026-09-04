import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, ArrowUpRight, RefreshCw } from "lucide-react";
import { getActivityLogs, getAllUsers } from "../services/adminApi";
import { formatRelativeTime } from "../utils/format";

const dotClass = (type) => {
  const t = (type || "").toUpperCase();
  if (t.includes("ERROR") || t.includes("CRITICAL") || t.includes("DELETE")) return "bg-red-500";
  if (t.includes("WARNING") || t.includes("UPDATE")) return "bg-amber-500";
  if (t.includes("LOGIN") || t.includes("CREATE")) return "bg-emerald-500";
  return "bg-slate-400";
};

export default function RecentActivityFeed() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const [logs, userList] = await Promise.all([getActivityLogs(), getAllUsers()]);
      setRows(Array.isArray(logs) ? logs : []);
      setUsers(Array.isArray(userList) ? userList : []);
      setError(null);
    } catch (err) {
      console.error("Failed to load recent activity:", err);
      setError("Failed to load recent activity");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const userName = (id) => {
    if (!id) return "System";
    const u = users.find((user) => (user.userId || user.id) == id);
    return u ? u.fullName || u.username : `User ${id}`;
  };

  const sorted = [...rows].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
  const recent = sorted.slice(0, 8);

  return (
    <div className="bg-white border border-brand-border rounded-2xl shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
            <Activity size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
            <p className="text-sm text-gray-500">Latest system events</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={load}
            title="Refresh"
            className="p-2 rounded-lg text-gray-400 hover:text-brand-primary hover:bg-slate-50 transition"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/system-activity")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
          >
            View all <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 flex-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-red-500 text-sm">{error}</div>
      ) : recent.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          No recent activity
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-gray-100">
          {recent.map((e, idx) => (
            <li
              key={e.activityId || idx}
              className="flex items-start gap-3 py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition cursor-default"
            >
              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dotClass(e.activityType)}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{e.description || e.activityType || "Activity"}</p>
                <p className="text-xs text-gray-400">
                  {userName(e.userId || e.performedBy)} · {formatRelativeTime(e.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
