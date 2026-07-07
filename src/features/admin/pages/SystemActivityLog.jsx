import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getActivityLogs, getAllBranches, getAllUsers } from "../services/adminApi";

const severityClass = (type) => {
  const t = (type || "").toUpperCase();
  if (t.includes("ERROR") || t.includes("CRITICAL") || t.includes("DELETE")) return "bg-brand-danger";
  if (t.includes("WARNING") || t.includes("UPDATE")) return "bg-brand-warning";
  if (t.includes("LOGIN") || t.includes("CREATE")) return "bg-brand-success";
  return "bg-slate-500";
};

export default function SystemActivityLog() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("All");
  const [branch, setBranch] = useState("All");
  const [rows, setRows] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [logsData, branchesData, usersData] = await Promise.all([
          getActivityLogs(),
          getAllBranches(),
          getAllUsers(),
        ]);
        setRows(logsData || []);
        setBranches(branchesData || []);
        setUsers(usersData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load activity logs");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  async function refresh() {
    try {
      setLoading(true);
      const filters = {};
      if (type !== "All") filters.type = type;
      if (branch !== "All") filters.branchId = branch;
      const data = await getActivityLogs(filters);
      setRows(data || []);
    } catch (err) {
      console.error("Error refreshing logs:", err);
    } finally {
      setLoading(false);
    }
  }

  const getBranchName = (id) => {
    if (!id) return "-";
    const b = branches.find(branch => (branch.id || branch.branchId) == id);
    return b ? (b.name || b.branchName) : "Unknown Branch";
  };

  const getUserName = (id) => {
    if (!id) return "-";
    const u = users.find(user => (user.userId || user.id) == id);
    return u ? (u.fullName || u.username) : `User ${id}`;
  };

  const getBranchIdProp = (b) => b.id || b.branchId || b.branch_id;
  const getBranchNameProp = (b) => b.name || b.branchName || b.branch_name;

  const filtered = rows.filter((r) => {
    const matchType = type === "All" ? true : r.activityType === type;
    const matchBranch = branch === "All" ? true : r.branchId == branch;
    if (!matchType || !matchBranch) return false;

    const s = q.trim().toLowerCase();
    if (!s) return true;

    const time = (r.createdAt || "").toLowerCase();
    const actor = getUserName(r.userId || r.performedBy).toLowerCase();
    const action = (r.description || "").toLowerCase();
    const aType = (r.activityType || "").toLowerCase();
    const bName = getBranchName(r.branchId).toLowerCase();

    return (
      time.includes(s) ||
      actor.includes(s) ||
      aType.includes(s) ||
      action.includes(s) ||
      bName.includes(s)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">System Activity (Merged Logs)</h1>
          <p className="text-sm text-brand-muted">
            Includes system actions and login history in one place.
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={refresh}
            className="hidden sm:inline-flex items-center justify-center px-3 py-2 rounded-xl bg-slate-100 border border-brand-border hover:bg-slate-200 transition text-sm font-bold"
          >
            Refresh
          </button>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-40 px-3 py-2 rounded-xl border border-brand-border bg-white text-sm"
          >
            <option>All</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="ERROR">Error</option>
          </select>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-40 px-3 py-2 rounded-xl border border-brand-border bg-white text-sm"
          >
            <option value="All">All Branches</option>
            {branches.map((b) => (
              <option key={getBranchIdProp(b)} value={getBranchIdProp(b)}>{getBranchNameProp(b)}</option>
            ))}
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search..."
            className="flex-1 sm:w-80 px-3 py-2 rounded-xl border border-brand-border outline-none focus:ring-2 focus:ring-brand-secondary"
          />
        </div>
      </div>

      <div className="bg-white border border-brand-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 font-bold">Audit Log</div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left p-3">Time</th>
                <th className="text-left p-3">Actor</th>
                <th className="text-left p-3">Branch</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Action</th>
                <th className="text-left p-3">Severity (Type)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, idx) => {
                const logId = e.activityId || idx;
                const time = e.createdAt ? new Date(e.createdAt).toLocaleString() : "-";
                const actorName = getUserName(e.userId || e.performedBy);
                const branchName = getBranchName(e.branchId);
                const action = e.description || "-";
                const activityType = e.activityType || "UNKNOWN";

                return (
                  <tr key={logId} className="border-t hover:bg-slate-50">
                    <td className="p-3 text-brand-muted whitespace-nowrap">{time}</td>
                    <td className="p-3 font-medium text-slate-900 whitespace-nowrap">{actorName}</td>
                    <td className="p-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 border border-blue-300 text-blue-700">
                        {branchName}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 border border-brand-border">
                        {activityType}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs truncate" title={action}>{action}</td>
                    <td className="p-3">
                      <span className={`text-xs px-3 py-1 rounded-full text-white font-bold ${severityClass(activityType)}`}>
                        {activityType}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-brand-muted" colSpan={6}>
                    No activity found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
