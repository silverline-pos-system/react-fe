import { useEffect, useState, useCallback, useRef } from "react";
import {
  getStaffSummary,
  getSecondaryRoleAssignments,
  assignSecondaryRole,
  revokeSecondaryRole,
} from "../services/managerService";
import {
  UserPlus, Shield, Clock, X, AlertTriangle, CheckCircle,
  Loader2, Search, Trash2, Calendar, User, ChevronDown
} from "lucide-react";

const ASSIGNABLE_ROLES = [
  { value: "CASHIER", label: "Cashier", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "SUPERVISOR", label: "Supervisor", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "STORE_KEEPER", label: "Store Keeper", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "DTV_TECHNICIAN", label: "DTV Technician", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { value: "MOBILE_TECHNICIAN", label: "Mobile Technician", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
];

const DURATION_PRESETS = [
  { label: "Rest of Today", value: "today" },
  { label: "1 Day", value: "1d" },
  { label: "3 Days", value: "3d" },
  { label: "1 Week", value: "7d" },
  { label: "Custom", value: "custom" },
];

function getRoleBadgeClass(role) {
  const found = ASSIGNABLE_ROLES.find((r) => r.value === role);
  return found ? found.color : "bg-slate-100 text-slate-700 border-slate-200";
}

function getRoleLabel(role) {
  const found = ASSIGNABLE_ROLES.find((r) => r.value === role);
  return found ? found.label : role;
}

function formatExpiry(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d - now;
  if (diffMs <= 0) return "Expired";
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h remaining`;
  }
  return hours > 0 ? `${hours}h ${mins}m remaining` : `${mins}m remaining`;
}

function calcExpiresAt(preset, customDate) {
  const now = new Date();
  switch (preset) {
    case "today": {
      const eod = new Date(now);
      eod.setHours(23, 59, 59, 999);
      return eod.toISOString();
    }
    case "1d": {
      const d = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      return d.toISOString();
    }
    case "3d": {
      const d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      return d.toISOString();
    }
    case "7d": {
      const d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return d.toISOString();
    }
    case "custom":
      return customDate ? new Date(customDate + "T23:59:59").toISOString() : null;
    default:
      return null;
  }
}

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, type = "danger" }) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    confirmBtnRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${type === "danger" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{title}</h3>
              <p className="text-sm text-slate-500 mt-1">{message}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg ${type === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SecondaryRoleAssignment() {
  const [staff, setStaff] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [durationPreset, setDurationPreset] = useState("today");
  const [customDate, setCustomDate] = useState("");
  const [reason, setReason] = useState("");

  const notify = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [staffData, assignmentData] = await Promise.all([
        getStaffSummary(),
        getSecondaryRoleAssignments(),
      ]);
      setStaff(Array.isArray(staffData) ? staffData : []);
      setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
    } catch (err) {
      console.error("Failed to load data:", err);
      notify("error", "Failed to load staff data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => setAssignments((prev) => [...prev]), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAssign = async () => {
    if (!selectedUser || !selectedRole) {
      notify("error", "Please select a user and role");
      return;
    }

    const primaryRole = (selectedUser.role || selectedUser.userRole || "").toUpperCase();
    if (primaryRole === selectedRole) {
      notify("error", "Cannot assign same role as the user's primary role");
      return;
    }

    const expiresAt = calcExpiresAt(durationPreset, customDate);
    if (!expiresAt) {
      notify("error", "Please select a valid duration");
      return;
    }

    setSaving(true);
    try {
      await assignSecondaryRole({
        userId: selectedUser.userId || selectedUser.id,
        secondaryRole: selectedRole,
        expiresAt,
        reason: reason.trim() || "Temporary duty assignment",
      });
      notify("success", `Secondary role assigned to ${selectedUser.username || selectedUser.name}`);
      resetForm();
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Assignment failed";
      notify("error", msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revokeSecondaryRole(revokeTarget.id || revokeTarget.assignmentId);
      notify("success", "Secondary role revoked");
      setRevokeTarget(null);
      fetchData();
    } catch (err) {
      notify("error", err.response?.data?.message || "Failed to revoke");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setSelectedUser(null);
    setSelectedRole("");
    setDurationPreset("today");
    setCustomDate("");
    setReason("");
  };

  const filteredStaff = staff.filter((s) => {
    if (s.status === "Rejected") return false;
    const name = (s.username || s.name || "").toLowerCase();
    const role = (s.role || s.userRole || "").toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || role.includes(q);
  });

  const now = new Date();
  const activeAssignments = assignments.filter((a) => !a.revoked && new Date(a.expiresAt) > now);
  const expiredAssignments = assignments.filter((a) => a.revoked || new Date(a.expiresAt) <= now);

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-right duration-300 ${
          notification.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {notification.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {notification.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-xl">
              <Shield className="w-6 h-6 text-violet-600" />
            </div>
            Secondary Role Assignments
          </h1>
          <p className="text-sm text-slate-500 mt-1">Assign temporary secondary roles to staff for limited periods</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-200 flex items-center gap-2 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" /> Assign Role
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-500" /> Active Assignments
            {activeAssignments.length > 0 && (
              <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full">{activeAssignments.length}</span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <Loader2 className="w-8 h-8 text-slate-300 animate-spin mx-auto" />
            <p className="text-sm text-slate-400 mt-2">Loading assignments...</p>
          </div>
        ) : activeAssignments.length === 0 ? (
          <div className="p-10 text-center">
            <Shield className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No active secondary role assignments</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeAssignments.map((a) => (
              <div key={a.id || a.assignmentId} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {(a.username || a.userName || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-sm">{a.username || a.userName}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>Primary: <span className="font-semibold">{getRoleLabel(a.primaryRole || a.role)}</span></span>
                    <span className="text-slate-300">→</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeClass(a.secondaryRole)}`}>
                      + {getRoleLabel(a.secondaryRole)}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-semibold text-amber-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatExpiry(a.expiresAt)}
                  </div>
                  {a.reason && <div className="text-[10px] text-slate-400 mt-0.5 max-w-[200px] truncate">{a.reason}</div>}
                </div>
                <button
                  onClick={() => setRevokeTarget(a)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Revoke"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {expiredAssignments.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-500 text-sm flex items-center gap-2">
              Recent Expired/Revoked Assignments
              <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">{expiredAssignments.length}</span>
            </h2>
          </div>
          <div className="divide-y divide-slate-100 opacity-60">
            {expiredAssignments.slice(0, 10).map((a) => (
              <div key={a.id || a.assignmentId} className="px-6 py-3 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                  {(a.username || a.userName || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-slate-600 font-medium">{a.username || a.userName}</span>
                  <span className="mx-2 text-slate-300">→</span>
                  <span className="text-xs text-slate-400">{getRoleLabel(a.secondaryRole)}</span>
                </div>
                <span className="text-xs text-red-400 font-semibold">Expired</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-violet-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5" /> Assign Secondary Role
              </h3>
              <button onClick={resetForm} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Staff Member *</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    placeholder="Search by name or role..."
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {filteredStaff.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-400">No staff found</div>
                  ) : filteredStaff.map((s) => {
                    const uid = s.userId || s.id;
                    const isSelected = selectedUser && (selectedUser.userId || selectedUser.id) === uid;
                    const hasActive = activeAssignments.some((a) => (a.userId || a.staffUserId) === uid);
                    return (
                      <button
                        key={uid}
                        onClick={() => setSelectedUser(s)}
                        disabled={hasActive}
                        className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                          isSelected ? "bg-violet-50 border-l-4 border-violet-500" : "hover:bg-slate-50"
                        } ${hasActive ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">{s.username || s.name}</div>
                          <div className="text-[10px] text-slate-400">{getRoleLabel(s.role || s.userRole)}</div>
                        </div>
                        {hasActive && <span className="text-[10px] font-bold text-violet-500">Already assigned</span>}
                        {isSelected && <CheckCircle className="w-4 h-4 text-violet-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Secondary Role *</label>
                <div className="grid grid-cols-2 gap-2">
                  {ASSIGNABLE_ROLES
                    .filter((r) => {
                      if (!selectedUser) return true;
                      const primary = (selectedUser.role || selectedUser.userRole || "").toUpperCase();
                      return r.value !== primary;
                    })
                    .map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setSelectedRole(r.value)}
                      className={`px-3 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                        selectedRole === r.value
                          ? "border-violet-500 bg-violet-50 text-violet-700 shadow-sm"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" /> Duration *
                </label>
                <div className="flex flex-wrap gap-2">
                  {DURATION_PRESETS.map((dp) => (
                    <button
                      key={dp.value}
                      onClick={() => setDurationPreset(dp.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        durationPreset === dp.value
                          ? "border-violet-500 bg-violet-50 text-violet-700"
                          : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {dp.label}
                    </button>
                  ))}
                </div>
                {durationPreset === "custom" && (
                  <input
                    type="date"
                    value={customDate}
                    min={minDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="mt-2 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Reason <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  placeholder="e.g., Cover shift for absent cashier"
                />
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 flex gap-3">
              <button onClick={resetForm} className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={saving || !selectedUser || !selectedRole}
                className="flex-[2] py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white rounded-lg font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Assigning...</> : <><Shield className="w-4 h-4" /> Assign Secondary Role</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        title="Revoke Secondary Role"
        message={`Are you sure you want to revoke the secondary role "${getRoleLabel(revokeTarget?.secondaryRole)}" from ${revokeTarget?.username || revokeTarget?.userName}?`}
        type="danger"
      />
    </div>
  );
}
