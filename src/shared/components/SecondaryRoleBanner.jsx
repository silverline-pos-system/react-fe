import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Shield, ChevronRight, Clock, ArrowLeft } from "lucide-react";
import { getMySecondaryRole } from "@/features/manager/services/managerService";

const ROLE_NAV_MAP = {
  CASHIER: { path: "/pos", label: "POS" },
  SUPERVISOR: { path: "/pos", label: "POS" },
  DTV_TECHNICIAN: { path: "/dtv-tech", label: "DTV" },
  MOBILE_TECHNICIAN: { path: "/mobile-tech", label: "Mobile Repair" },
  MANAGER: { path: "/manager", label: "Manager" },
  SUPER_ADMIN: { path: "/admin", label: "Super Admin Dashboard" },
};

const ROLE_COLORS = {
  CASHIER: "from-green-500 to-emerald-600",
  SUPERVISOR: "from-blue-500 to-indigo-600",
  DTV_TECHNICIAN: "from-indigo-500 to-violet-600",
  MOBILE_TECHNICIAN: "from-emerald-500 to-teal-600",
  MANAGER: "from-blue-600 to-blue-800",
  SUPER_ADMIN: "from-purple-600 to-indigo-700",
};

function getRoleLabel(role) {
  const labels = {
    CASHIER: "Cashier",
    SUPERVISOR: "Supervisor",
    DTV_TECHNICIAN: "DTV Tech",
    MOBILE_TECHNICIAN: "Mobile Tech",
    MANAGER: "Manager",
    SUPER_ADMIN: "Super Admin",
  };
  return labels[role] || role;
}

function getTimeRemaining(expiresAt, nowMs = Date.now()) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - nowMs;
  if (diff <= 0) return null;

  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function isOnSecondaryRolePage(currentPath, secondaryRole) {
  if (!secondaryRole) return false;
  const secondaryNavInfo = ROLE_NAV_MAP[secondaryRole];
  if (!secondaryNavInfo) return false;
  return currentPath.startsWith(secondaryNavInfo.path);
}

function readSecondaryRole(nowMs) {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.secondaryRole || !user.secondaryRoleExpiresAt) return null;

    const expires = new Date(user.secondaryRoleExpiresAt);
    if (Number.isNaN(expires.getTime()) || expires.getTime() <= nowMs) {
      return null;
    }

    return {
      primaryRole: user.role || user.userRole,
      secondaryRole: user.secondaryRole,
      expiresAt: user.secondaryRoleExpiresAt,
    };
  } catch {
    return null;
  }
}

/**
 * SecondaryRoleBanner
 * Displays a compact button in any topbar/header when the user has an active secondary role.
 */
export default function SecondaryRoleBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const [nowMs, setNowMs] = useState(() => Date.now());

  const roleAccess = useMemo(() => readSecondaryRole(nowMs), [nowMs]);
  const secondaryRole = roleAccess?.secondaryRole;
  const primaryRole = roleAccess?.primaryRole;
  const expiresAt = roleAccess?.expiresAt;
  const timeLeft = getTimeRemaining(expiresAt, nowMs);
  const isOnSecondary = isOnSecondaryRolePage(location.pathname, secondaryRole);

  useEffect(() => {
    // Fetch latest secondary role from server to sync state
    const syncRole = async () => {
      try {
        const secondaryRoleData = await getMySecondaryRole();
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        
        let changed = false;
        if (secondaryRoleData && secondaryRoleData.secondaryRole) {
          const expires = new Date(secondaryRoleData.expiresAt);
          if (expires > new Date()) {
            if (
              user.secondaryRole !== secondaryRoleData.secondaryRole ||
              user.secondaryRoleExpiresAt !== secondaryRoleData.expiresAt
            ) {
              user.secondaryRole = secondaryRoleData.secondaryRole;
              user.secondaryRoleExpiresAt = secondaryRoleData.expiresAt;
              user.secondaryRoleReason = secondaryRoleData.reason;
              changed = true;
            }
          }
        } else {
          if (user.secondaryRole) {
            delete user.secondaryRole;
            delete user.secondaryRoleExpiresAt;
            delete user.secondaryRoleReason;
            changed = true;
          }
        }
        
        if (changed) {
          localStorage.setItem("user", JSON.stringify(user));
          // Trigger re-render by updating nowMs
          setNowMs(Date.now());
        }
      } catch {
        // ignore
      }
    };
    
    syncRole();
  }, []);

  useEffect(() => {
    if (!expiresAt) return undefined;
    const interval = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!secondaryRole || !primaryRole || !timeLeft) return null;

  if (isOnSecondary) {
    const primaryNavInfo = ROLE_NAV_MAP[primaryRole];
    const primaryGradient = ROLE_COLORS[primaryRole] || "from-slate-500 to-slate-600";

    return (
      <button
        onClick={() => primaryNavInfo && navigate(primaryNavInfo.path)}
        className={`group flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${primaryGradient} text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200`}
        title={`Return to ${getRoleLabel(primaryRole)} primary role`}
      >
        <ArrowLeft className="w-3.5 h-3.5 opacity-80" />
        <span>{primaryNavInfo?.label || getRoleLabel(primaryRole)}</span>
        <span className="flex items-center gap-0.5 opacity-70 text-[10px] font-mono">
          <Clock className="w-2.5 h-2.5" />
          {timeLeft}
        </span>
      </button>
    );
  }

  const secondaryNavInfo = ROLE_NAV_MAP[secondaryRole];
  const secondaryGradient = ROLE_COLORS[secondaryRole] || "from-violet-500 to-indigo-600";

  return (
    <button
      onClick={() => secondaryNavInfo && navigate(secondaryNavInfo.path)}
      className={`group flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${secondaryGradient} text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200`}
      title={`Switch to ${getRoleLabel(secondaryRole)} temporary access`}
    >
      <Shield className="w-3.5 h-3.5 opacity-80" />
      <span>{secondaryNavInfo?.label || getRoleLabel(secondaryRole)}</span>
      <span className="flex items-center gap-0.5 opacity-70 text-[10px] font-mono">
        <Clock className="w-2.5 h-2.5" />
        {timeLeft}
      </span>
      <ChevronRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}
