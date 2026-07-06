import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { LayoutGrid, Users, Building2, Activity, FileText, KeyRound, Puzzle, Sparkles, Palette } from "lucide-react";
import { getPasswordResetPendingCount, subscribeToPasswordResetPendingCount } from "../services/adminApi";
import { useSystemName } from "@/context/SystemNameContext";

const baseLink = "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-gray-300 hover:bg-gray-800 hover:translate-x-1 hover:text-white";
const activeLink = "bg-brand-primary text-white shadow-lg translate-x-1";

const NavItemLink = ({ to, icon: Icon, label, end = false, badge = null, onNavigate }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onNavigate}
    className={({ isActive }) => `${baseLink} ${isActive ? activeLink : ""}`}
  >
    <Icon size={18} className="shrink-0 transition-transform duration-200" />
    <span className="text-sm flex-1">{label}</span>
    {badge !== null && badge > 0 && (
      <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-amber-500 text-white text-xs font-bold rounded-full animate-pulse shadow-sm">
        {badge}
      </span>
    )}
  </NavLink>
);

export default function Sidebar({ isMobileOpen = false, onNavigate = () => {} }) {
  const { systemName } = useSystemName();
  const [pendingResetCount, setPendingResetCount] = useState(0);

  useEffect(() => {
    let unsubscribe = () => {};

    const fetchCount = async () => {
      try {
        const data = await getPasswordResetPendingCount();
        setPendingResetCount(data || 0);
      } catch {
        // silent
      }
    };

    fetchCount();

    unsubscribe = subscribeToPasswordResetPendingCount(
      (count) => setPendingResetCount(count || 0),
      () => {
        // Keep the last known count if the stream is temporarily unavailable.
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <aside className={`w-72 bg-gray-900 text-white h-screen flex flex-col min-h-0 fixed top-0 left-0 z-50 transform transition-transform duration-300 ease-out lg:static lg:translate-x-0 lg:z-auto ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">
          {systemName}
        </h1>
        <p className="text-sm text-gray-400 mt-1">Super Admin Dashboard</p>
      </div>

      <nav className="sidebar-scroll p-4 flex-1 min-h-0 overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            Overview
          </div>
          <div className="mt-2 space-y-1">
            <NavItemLink to="/admin" end icon={LayoutGrid} label="Overview" onNavigate={onNavigate} />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            Administration
          </div>
          <div className="mt-2 space-y-1">
            <NavItemLink to="/admin/users" icon={Users} label="User Registration" onNavigate={onNavigate} />
            <NavItemLink to="/admin/branches" icon={Building2} label="Branch Management" onNavigate={onNavigate} />
            <NavItemLink to="/admin/password-requests" icon={KeyRound} label="Password Requests" badge={pendingResetCount} onNavigate={onNavigate} />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            SaaS Configuration
          </div>
          <div className="mt-2 space-y-1">
            <NavItemLink to="/admin/features" icon={Puzzle} label="Feature Management" onNavigate={onNavigate} />
            <NavItemLink to="/admin/system-settings" icon={Sparkles} label="System Settings" onNavigate={onNavigate} />
            <NavItemLink to="/admin/bill-templates" icon={Palette} label="Print Header/Footer" onNavigate={onNavigate} />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            Audit & Logs
          </div>
          <div className="mt-2 space-y-1">
            <NavItemLink to="/admin/system-activity" icon={Activity} label="System Activity" onNavigate={onNavigate} />
          </div>
        </div>
      </nav>
    </aside>
  );
}
