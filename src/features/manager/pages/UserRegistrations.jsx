import { useEffect, useRef, useState } from "react";
import {
  getUserRegistrations,
  updateRegistrationStatus,
  getStaffSummary,
} from "../services/managerService";
import { AlertTriangle } from 'lucide-react';

const ROLE_OPTIONS = [
  "STORE_KEEPER",
  "CASHIER",
  "SUPERVISOR",
  "DTV_TECHNICIAN",
  "MOBILE_TECHNICIAN"
];

// Confirmation Modal Component
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, type = 'info' }) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    confirmBtnRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{title}</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-all active:scale-95 ${type === 'danger'
              ? 'bg-red-600 hover:bg-red-700 shadow-red-200'
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
              }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserRegistrations() {
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingRoles, setPendingRoles] = useState({});
  const [_userRoles, setUserRoles] = useState({});
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    row: null,
    action: null,
    title: "",
    message: "",
    type: "info"
  });

  useEffect(() => {
    fetchPending();
    fetchUsers();
  }, []);

  const fetchPending = async () => {
    try {
      setLoadingPending(true);
      setError(null);

      console.log("Fetching pending registrations...");
      const data = await getUserRegistrations("PENDING");
      console.log("Raw Pending API Response:", data);

      if (!Array.isArray(data)) {
        console.warn("API response is not an array:", data);
        setPending([]);
        return;
      }

      const rows = data.map(r => ({
        ...r,
        name: r.requestedBy || r.reference || "Unknown",
        username: r.username || (r.referenceNo ? r.referenceNo.replace("USER-", "") : "-"),
        email: r.email || "No Email",
        time: r.time || "Recently"
      }));

      setPending(rows);

      const roleMap = {};
      rows.forEach((r) => {
        roleMap[r.id] = r.role || "CASHIER";
      });
      setPendingRoles(roleMap);

    } catch (err) {
      console.error("Error fetching pending registrations:", err);
      setError("Failed to connect to server. Ensure Backend is running.");
    } finally {
      setLoadingPending(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await getStaffSummary();

      const rows = (data || []).map(u => ({
        id: u.userId,
        name: u.name,
        username: "-",
        email: u.email || "-",
        phone: u.phone || "-",
        employeeId: u.employeeId || "-",
        role: u.role,
        lastLogin: u.lastLogin,
        isActive: u.status === "Active" || u.status === "Online",
        statusRaw: u.status,
        approvedBy: u.approvedBy || "System"
      })).filter(u => u.role !== "SUPER_ADMIN" && u.role !== "MANAGER");

      setUsers(rows);

      const roleMap = {};
      rows.forEach((u) => {
        roleMap[u.id] = u.role || "CASHIER";
      });
      setUserRoles(roleMap);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const openApproveModal = (row) => {
    const role = pendingRoles[row.id] || "CASHIER";
    setModalConfig({
      isOpen: true,
      row,
      action: "approve",
      title: "Approve Registration",
      message: `Are you sure you want to approve ${row.name}'s registration as ${role}? A confirmation email will be sent to ${row.email} with their account details.`,
      type: "info"
    });
  };

  const openRejectModal = (row) => {
    setModalConfig({
      isOpen: true,
      row,
      action: "reject",
      title: "Reject Registration",
      message: `Are you sure you want to reject ${row.name}'s registration? A rejection notification email will be sent to ${row.email}.`,
      type: "danger"
    });
  };

  const [employeeDetails, setEmployeeDetails] = useState(null);

  const openEmployeeModal = (row) => {
    setEmployeeDetails(row);
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleModalConfirm = async () => {
    const { row, action } = modalConfig;
    if (!row || !action) return;
    closeModal();

    if (action === "approve") {
      await handleApprove(row);
    } else {
      await handleReject(row);
    }
  };

  const handleApprove = async (row) => {
    const id = row.id;
    const role = pendingRoles[id] || "CASHIER";
    try {
      setUpdating(id);
      await updateRegistrationStatus(id, "APPROVED", role);

      setPending((prev) => prev.filter((r) => r.id !== id));

      setTimeout(fetchUsers, 500);

    } catch (err) {
      console.error("Error approving registration:", err);
      alert("Failed to approve. Check console for details.");
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (row) => {
    const id = row.id;
    try {
      setUpdating(id);
      await updateRegistrationStatus(id, "REJECTED");
      setPending((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Error rejecting registration:", err);
      alert("Failed to reject.");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={handleModalConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />

      {employeeDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Employee Profile</h3>
                <p className="text-sm text-slate-500">System Information for {employeeDetails.name}</p>
              </div>
              <button 
                onClick={() => setEmployeeDetails(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                  {employeeDetails.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-slate-900">{employeeDetails.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 uppercase tracking-wider">
                      {employeeDetails.role}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${employeeDetails.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {employeeDetails.statusRaw}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6 pt-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee ID</p>
                  <p className="text-sm font-semibold text-slate-700">{employeeDetails.employeeId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</p>
                  <p className="text-sm font-semibold text-slate-700">{employeeDetails.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                  <p className="text-sm font-semibold text-slate-700 break-all">{employeeDetails.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Approved By</p>
                  <p className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block">{employeeDetails.approvedBy}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Login Activity</p>
                  <p className="text-sm font-semibold text-slate-700 font-mono">{employeeDetails.lastLogin || 'Never logged in'}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setEmployeeDetails(null)}
                className="px-6 py-2 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-900 transition-all active:scale-95 shadow-lg shadow-slate-200"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-xl font-extrabold text-slate-800">User Management</h1>
        <button
          onClick={() => { fetchPending(); fetchUsers(); }}
          className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded font-bold transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
          <span className="font-bold relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <span className="font-bold text-slate-700">Pending Approvals</span>
          {pending.length > 0 && (
            <span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm border border-amber-200">
              {pending.length} Waiting
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Name</th>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Username</th>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Email</th>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Assign Role</th>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingPending ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                      <span>Syncing requests...</span>
                    </div>
                  </td>
                </tr>
              ) : pending.length === 0 ? (
                <tr>
                  <td className="p-8 text-center text-slate-400" colSpan={5}>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg opacity-50">✓</span>
                      <span>No pending registrations found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pending.map((r) => {
                  const id = r.id;
                  const assignedRole = pendingRoles[id] || "CASHIER";
                  const isProcessing = updating === id;

                  return (
                    <tr key={id} className={`group hover:bg-slate-50 transition-colors ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                      <td className="p-4 font-semibold text-slate-700">
                        {r.name}
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5 max-w-[150px] truncate">{r.reference}</div>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-600">{r.username}</td>
                      <td className="p-4 text-slate-600">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-xs font-medium text-slate-600 border border-slate-200 max-w-[180px] break-all">
                          {r.email}
                        </span>
                      </td>
                      <td className="p-4">
                        <select
                          value={assignedRole}
                          onChange={(e) =>
                            setPendingRoles((prev) => ({ ...prev, [id]: e.target.value }))
                          }
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand cursor-pointer hover:border-slate-300 transition-colors"
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openApproveModal(r)}
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => openRejectModal(r)}
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-white border border-slate-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 hover:border-red-200 transition-all active:scale-95 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 font-bold text-slate-700">
          Staff Directory
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Name</th>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Role</th>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Approved By</th>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Last Login</th>
                <th className="text-left p-4 font-semibold uppercase text-xs tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingUsers ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">Loading staff...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="p-8 text-center text-slate-400" colSpan={4}>No staff found</td>
                </tr>
              ) : (
                users.map((u) => {
                  const id = u.id;
                  const roleValue = u.role || "CASHIER";
                  const isActive = u.isActive;
                  return (
                    <tr 
                      key={id} 
                      onClick={() => openEmployeeModal(u)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="p-4">
                        <div className="font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{u.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">Click to view details</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-md text-xs font-bold border border-slate-200 text-slate-600">
                          {roleValue}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {u.approvedBy}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 font-mono text-xs">
                        {u.lastLogin || "Never"}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide border ${isActive
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}>
                          {u.statusRaw || "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
