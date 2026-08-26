import Badge from "./Badge";
import { useStaffSummary } from "../hooks/managerQueries";

export default function StaffWidget({ branchId = undefined }) {
  // Cached, deduped staff summary with the same 15s refresh (React Query handles the polling).
  const { data: staff = [], isLoading: loading, isError, dataUpdatedAt } = useStaffSummary(branchId);
  const error = isError ? "Failed to load staff data" : null;
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'online' || s === 'active' || s === 'clocked_in' || s === 'clocked-in') return 'bg-green-500';
    if (s === 'break' || s === 'on_break' || s === 'on-break') return 'bg-yellow-500';
    if (s === 'offline' || s === 'inactive' || s === 'clocked_out' || s === 'clocked-out') return 'bg-gray-400';
    return 'bg-gray-400';
  };

  const getTimeSince = (dateStr) => {
    if (!dateStr) return 'No login record';
    try {
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return 'No login record';

      const now = new Date();
      const diffMs = now - date;
      if (Number.isNaN(diffMs) || diffMs < 0) return 'No login record';

      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'No login record';
    }
  };

  const getRecencyLabel = (dateStr) => {
    if (!dateStr) return { label: 'No record', tone: 'text-slate-400' };
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return { label: 'No record', tone: 'text-slate-400' };

    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins <= 15) return { label: 'Very Active', tone: 'text-emerald-600' };
    if (mins <= 120) return { label: 'Active Today', tone: 'text-blue-600' };
    if (mins <= 1440) return { label: 'Inactive', tone: 'text-amber-600' };
    return { label: 'Needs Follow-up', tone: 'text-red-600' };
  };

  const onlineCount = staff.filter(s => {
    const st = (s.status || '').toLowerCase();
    return st === 'online' || st === 'active' || st === 'clocked_in' || st === 'clocked-in';
  }).length;

  return (
    <div className="bg-white border border-brand-border rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-bold">Staff Activity</div>
        <div className="flex items-center gap-2">
          {onlineCount > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              {onlineCount} online
            </span>
          )}
          {lastUpdated && (
            <span className="text-[10px] text-gray-400">
              Updated {getTimeSince(lastUpdated)}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-brand-muted flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            Loading staff data...
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : staff.length === 0 ? (
          <div className="text-sm text-brand-muted">No staff members found</div>
        ) : (
          staff.slice(0, 6).map((s, idx) => (
            <div key={s.userId || s.name || idx} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                    {(s.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(s.status)}`}></div>
                </div>
                <div>
                  <div className="font-bold text-sm">{s.name} <span className="text-xs text-brand-muted font-normal">({s.role})</span></div>
                  <div className="text-xs text-brand-muted">
                    Last login: {getTimeSince(s.lastLogin)}
                  </div>
                  <div className={`text-[10px] font-semibold ${getRecencyLabel(s.lastLogin).tone}`}>
                    {getRecencyLabel(s.lastLogin).label}
                  </div>
                </div>
              </div>
              <Badge label={s.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
