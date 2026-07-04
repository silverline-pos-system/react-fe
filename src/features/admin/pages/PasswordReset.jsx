import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getAllUsers, issuePasswordReset, generateTempPassword } from "../services/adminApi";

export default function PasswordReset() {
  const [users, setUsersState] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await getAllUsers();
        setUsersState(data || []);
        if (data?.length > 0) {
          const userId = data[0].userId || data[0].user_id || data[0].id;
          setSelectedId(userId);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const getUserId = (u) => u.userId || u.user_id || u.id;
  const getUserName = (u) => u.fullName || u.full_name;

  const selectedUser = users.find((u) => getUserId(u) === selectedId);

  async function onGenerate() {
    try {
      const data = await generateTempPassword();
      setTempPassword(data.tempPassword || data.temp_password || generateLocalTempPassword());
    } catch {
      setTempPassword(generateLocalTempPassword());
    }
  }

  function generateLocalTempPassword() {
    const part = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `Tmp@${part}${Math.floor(Math.random() * 90 + 10)}`;
  }

  async function onReset(e) {
    e.preventDefault();
    if (!selectedUser) {
      alert("Please select a user.");
      return;
    }
    if (!tempPassword.trim()) {
      alert("Please generate or enter a temporary password.");
      return;
    }

    try {
      setSubmitting(true);
      await issuePasswordReset(selectedId, tempPassword.trim());
      
      alert(
        `Temporary password set for '${selectedUser.username}'.\n\nTemp password: ${tempPassword.trim()}\n\nUser will need to change it on next login.`
      );
      setTempPassword("");
      
      const data = await getAllUsers();
      setUsersState(data || []);
    } catch (err) {
      console.error("Error resetting password:", err);
      alert("Failed to reset password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

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
      <div>
        <h1 className="text-xl font-extrabold">Password Reset</h1>
        <p className="text-sm text-brand-muted">
          Select a user and issue a temporary password. User should change it on next login.
        </p>
      </div>

      <div className="bg-white border border-brand-border rounded-2xl shadow-sm p-5 max-w-2xl">
        <form onSubmit={onReset} className="space-y-4">
          <div>
            <label className="text-sm font-bold">Select User</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-brand-border bg-white"
            >
              {users.map((u) => {
                const userId = getUserId(u);
                const userName = getUserName(u);
                const status = u.status || "INACTIVE";
                return (
                  <option key={userId} value={userId}>
                    {userName} (@{u.username}) — {status}
                  </option>
                );
              })}
            </select>

            {selectedUser && (
              <div className="mt-2 text-xs text-brand-muted">
                Role: <span className="font-bold">{selectedUser.role}</span> • Branch:{" "}
                <span className="font-bold">{selectedUser.branchName || selectedUser.branch_name || selectedUser.branch || "-"}</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-bold">Temporary Password</label>
            <div className="mt-1 flex gap-2">
              <input
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Click Generate or type one"
                className="flex-1 px-3 py-2 rounded-xl border border-brand-border outline-none focus:ring-2 focus:ring-brand-secondary"
              />
              <button
                type="button"
                onClick={onGenerate}
                className="px-4 py-2 rounded-xl bg-slate-100 border border-brand-border hover:bg-slate-200 transition text-sm font-bold"
              >
                Generate
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 rounded-xl bg-brand-primary hover:bg-brand-secondary text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Issue Password Reset
          </button>
        </form>
      </div>
    </div>
  );
}
