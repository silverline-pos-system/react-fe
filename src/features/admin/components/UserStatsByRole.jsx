import { useState, useEffect } from "react";
import { getAllUsers } from "../services/adminApi";

const RoleBadge = ({ label, count, color }) => (
  <div className={`flex flex-col items-center justify-center p-4 rounded-xl ${color} transition-transform hover:scale-105`}>
    <div className="text-2xl font-extrabold text-gray-800">{(count || 0).toLocaleString()}</div>
    <div className="text-sm font-medium text-gray-600 text-center">{label}</div>
  </div>
);

const formatRoleLabel = (role) =>
  String(role || "Unknown")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function UserStatsByRole() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [roleCounts, setRoleCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const users = await getAllUsers();
        const list = Array.isArray(users) ? users : [];

        const counts = list.reduce((acc, user) => {
          const roleRaw = user?.role || user?.userRole || "UNKNOWN";
          const role = String(roleRaw).toUpperCase();
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {});

        const sortedRoles = Object.entries(counts)
          .filter(([role]) => role !== "UNKNOWN")
          .sort((a, b) => b[1] - a[1])
          .map(([role, count]) => ({ role, label: formatRoleLabel(role), count }));

        setTotalUsers(list.length);
        setRoleCounts(sortedRoles);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch user stats:", err);
        setError("Failed to load user statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-brand-border rounded-2xl shadow-sm p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-5"></div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl shadow-sm p-6">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-brand-border rounded-2xl shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Users by Role</h3>
          <p className="text-sm text-gray-500">Total registered: {totalUsers}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {roleCounts.map((item, idx) => (
          <RoleBadge
            key={item.role}
            label={item.label}
            count={item.count}
            color={[
              "bg-gradient-to-br from-blue-100 to-blue-50",
              "bg-gradient-to-br from-green-100 to-green-50",
              "bg-gradient-to-br from-purple-100 to-purple-50",
              "bg-gradient-to-br from-amber-100 to-amber-50",
              "bg-gradient-to-br from-rose-100 to-rose-50",
              "bg-gradient-to-br from-cyan-100 to-cyan-50",
            ][idx % 6]}
          />
        ))}
      </div>
    </div>
  );
}
