import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Edit, Trash2, Power, MapPin, Loader2, AlertTriangle } from "lucide-react";
import {
  getAllBranches,
  createBranch,
  updateBranch,
  deleteBranchWithPassword,
  toggleBranchStatus,
  getUsersByBranch,
} from "../services/adminApi";
import AdminPasswordModal from "../components/AdminPasswordModal";
import useEscapeClose from "@/hooks/useEscapeClose";

export default function Branches() {
  const [q, setQ] = useState("");
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({ code: "", branchName: "", address: "", status: "INACTIVE" });
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchUsers, setBranchUsers] = useState([]);
  const [editBranch, setEditBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);

  // Delete confirmation with password
  const [deleteModal, setDeleteModal] = useState({ open: false, branchId: null, branchName: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEscapeClose(() => {
    if (selectedBranch) {
      setSelectedBranch(null);
      setBranchUsers([]);
    }
  }, !!selectedBranch);

  useEffect(() => {
    if (!selectedBranch) return;

    const handleKeyDown = (e) => {
      if (e.key !== "Enter") return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      setSelectedBranch(null);
      setBranchUsers([]);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedBranch]);

  // Fetch branches on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const branchesData = await getAllBranches();
        setBranches(branchesData || []);
        setForm((prev) => ({
          ...prev,
          code: "",
          branchName: "",
          address: "",
          status: "INACTIVE"
        }));
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter branches based on search
  const filtered = branches.filter((b) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    const code = b.code || "";
    const branchName = b.branchName || b.branch_name || b.name || "";
    const address = b.address || "";
    const status = b.status || "";
    return (
      code.toLowerCase().includes(s) ||
      branchName.toLowerCase().includes(s) ||
      address.toLowerCase().includes(s) ||
      status.toLowerCase().includes(s)
    );
  });

  const resetForm = () => {
    setForm({
      code: "",
      branchName: "",
      address: "",
      status: "INACTIVE"
    });
    setEditBranch(null);
    setFormError(null);
  };

  async function onAdd(e) {
    e.preventDefault();
    if (!form.branchName) return alert("Branch Name is required");

    try {
      setSubmitting(true);
      setFormError(null);
      const payload = {
        name: form.branchName,
        address: form.address,
        isActive: form.status === "ACTIVE"
      };
      await createBranch(payload);
      const data = await getAllBranches();
      setBranches(data || []);
      resetForm();
    } catch (err) {
      console.error("Error creating branch:", err);
      const msg = err.response?.data?.message || "";
      if (msg.includes("exists") || msg.includes("Duplicate")) {
        setFormError("Branch Code already exists");
      } else {
        setFormError("Failed to create branch. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(branchId) {
    try {
      await toggleBranchStatus(branchId);
      const data = await getAllBranches();
      setBranches(data || []);
    } catch (err) {
      console.error("Error toggling status:", err);
      alert("Failed to update branch status. Please try again.");
    }
  }

  function handleEditBranch(branch) {
    setEditBranch(branch);
    setFormError(null);
    setForm({
      code: branch.code || "",
      branchName: branch.branchName || branch.branch_name || branch.name || "",
      address: branch.address || "",
      status: isActive(branch) ? "ACTIVE" : "INACTIVE"
    });
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!form.branchName) return alert("Branch Name is required");

    try {
      setSubmitting(true);
      setFormError(null);
      const branchId = getBranchId(editBranch);
      const payload = {
        code: form.code,
        name: form.branchName,
        address: form.address,
        isActive: form.status === "ACTIVE"
      };
      await updateBranch(branchId, payload);
      const data = await getAllBranches();
      setBranches(data || []);
      resetForm();
    } catch (err) {
      console.error("Error updating branch:", err);
      const msg = err.response?.data?.message || "";
      if (msg.includes("exists") || msg.includes("Duplicate")) {
        setFormError("Branch Code already exists");
      } else {
        setFormError("Failed to update branch. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleDeleteBranch(branchId) {
    const branch = branches.find(b => (b.branchId || b.id) === branchId);
    setDeleteModal({ open: true, branchId, branchName: branch?.branchName || branch?.name || 'this branch' });
  }

  async function confirmDeleteBranch(password) {
    try {
      setDeleteLoading(true);
      await deleteBranchWithPassword(deleteModal.branchId, password);
      const data = await getAllBranches();
      setBranches(data || []);
      setDeleteModal({ open: false, branchId: null, branchName: '' });
    } catch (err) {
      console.error("Error deleting branch:", err);
      alert(err?.response?.data?.message || err.message || "Incorrect password or failed to delete branch.");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleViewBranch(branch) {
    setSelectedBranch(branch);
    try {
      const branchId = getBranchId(branch);
      const users = await getUsersByBranch(branchId);
      setBranchUsers(users || []);
    } catch (err) {
      console.error("Error fetching branch users:", err);
      setBranchUsers([]);
    }
  }

  const getBranchId = (b) => b.id || b.branchId || b.branch_id;
  const getBranchName = (b) => b.name || b.branchName || b.branch_name;
  const getBranchStatus = (b) => isActive(b) ? "ACTIVE" : "INACTIVE";
  const isActive = (b) => {
    if (typeof b === 'object') {
      return b.isActive === true || b.status === "ACTIVE" || b.status === "Active";
    }
    return b === "ACTIVE" || b === "Active" || b === true;
  };

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
      <h1 className="text-xl font-extrabold">Create & Manage Branches</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Form */}
        <div className={`lg:col-span-1 bg-white border rounded-2xl shadow-sm p-5 transition-all duration-300 ${editBranch ? 'border-blue-400 ring-2 ring-blue-100' : 'border-brand-border'}`}>
          {editBranch && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
              <Edit size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Editing: {getBranchName(editBranch)}</span>
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold">{editBranch ? "Edit Branch" : "Add New Branch"}</div>
            {editBranch && (
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            )}
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={editBranch ? handleSaveEdit : onAdd} className="space-y-3">
            {editBranch && (
              <div>
                <label className="text-sm font-bold">Branch Code (ID)</label>
                <input
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-brand-border outline-none focus:ring-2 focus:ring-brand-secondary disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="Auto generated"
                  value={form.code}
                  readOnly
                  disabled
                />
              </div>
            )}

            <div>
              <label className="text-sm font-bold">Branch Name</label>
              <input
                className="mt-1 w-full px-3 py-2 rounded-xl border border-brand-border outline-none focus:ring-2 focus:ring-brand-secondary"
                placeholder="e.g., Colombo Branch"
                value={form.branchName}
                onChange={(e) => setForm({ ...form, branchName: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-bold">Address / City</label>
              <input
                className="mt-1 w-full px-3 py-2 rounded-xl border border-brand-border outline-none focus:ring-2 focus:ring-brand-secondary"
                placeholder="e.g., Colombo"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-bold">Status</label>
              <select
                className="mt-1 w-full px-3 py-2 rounded-xl border border-brand-border bg-white"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 rounded-xl bg-brand-primary hover:bg-brand-secondary text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {editBranch ? "Save Changes" : "Create Branch"}
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="lg:col-span-2 bg-white border border-brand-border rounded-2xl shadow-sm overflow-visible">
          <div className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-bold">Branch List</div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search branch..."
              className="w-full sm:w-80 px-3 py-2 rounded-xl border border-brand-border outline-none focus:ring-2 focus:ring-brand-secondary"
            />
          </div>

          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left p-3">Branch Code</th>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Address</th>
                  <th className="text-center p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const branchId = getBranchId(b);
                  const branchName = getBranchName(b);
                  return (
                    <tr
                      key={branchId}
                      className="border-t hover:bg-slate-50 cursor-pointer"
                      onClick={() => handleViewBranch(b)}
                    >
                      <td className="p-3 font-mono text-xs">{b.code || branchId}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                            <MapPin size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{branchName}</span>
                            <span className="text-xs text-gray-500">{b.address}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">{b.address}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${isActive(b) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}
                        >
                          {getBranchStatus(b)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-brand-muted" colSpan={4}>
                      No branches found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Branch Detail Modal */}
      {selectedBranch && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-brand-border sticky top-0 bg-white">
              <h2 className="text-2xl font-extrabold">Manage Branch</h2>
              <button
                onClick={() => {
                  setSelectedBranch(null);
                  setBranchUsers([]);
                }}
                className="text-slate-500 hover:text-slate-700 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-bold text-slate-600 mb-1">Branch Code</div>
                  <div className="text-lg font-mono">{selectedBranch.code || getBranchId(selectedBranch)}</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-600 mb-1">Location</div>
                  <div className="text-lg">{selectedBranch.address}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-bold text-slate-600 mb-2">Users ({branchUsers.length})</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {branchUsers.length > 0 ? (
                    branchUsers.map(user => {
                      const userId = user.userId || user.user_id || user.id;
                      const userName = user.fullName || user.full_name;
                      return (
                        <div key={userId} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <div className="font-bold text-sm">{userName}</div>
                          <div className="text-xs text-slate-600">{user.role} • @{user.username}</div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-slate-500 text-sm p-3">No users assigned to this branch</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm font-bold text-slate-600 mb-2">Status</div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${isActive(selectedBranch) ? "bg-brand-success" : "bg-slate-500"}`}>
                  {getBranchStatus(selectedBranch)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-gray-100">
                <button
                  onClick={() => {
                    handleEditBranch(selectedBranch);
                    setSelectedBranch(null);
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                >
                  <Edit size={20} />
                  <span className="text-xs font-bold">Edit</span>
                </button>

                <button
                  onClick={() => {
                    handleToggleStatus(getBranchId(selectedBranch));
                    setSelectedBranch(null);
                  }}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition ${isActive(selectedBranch)
                    ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
                    : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                >
                  <Power size={20} />
                  <span className="text-xs font-bold">
                    {isActive(selectedBranch) ? "Deactivate" : "Activate"}
                  </span>
                </button>

                <button
                  onClick={() => {
                    handleDeleteBranch(getBranchId(selectedBranch));
                    setSelectedBranch(null);
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition"
                >
                  <Trash2 size={20} />
                  <span className="text-xs font-bold">Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      <AdminPasswordModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, branchId: null, branchName: '' })}
        onConfirm={confirmDeleteBranch}
        actionLabel={`Delete branch "${deleteModal.branchName}"`}
        loading={deleteLoading}
      />
    </div>
  );
}
