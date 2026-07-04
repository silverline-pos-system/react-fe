import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, Menu } from "lucide-react";
import { logActivity } from "../services/managerService";
import SecondaryRoleBanner from "@/components/common/SecondaryRoleBanner";
import ConfirmActionModal from "@/components/common/ConfirmActionModal";

export default function Topbar({ onMenuClick = () => {} }) {
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const userStr = localStorage.getItem('user');
  let userName = 'User';
  let userRole = '';

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      userName = user.username || user.name || 'User';
      userRole = (user.role || user.userRole || '').toUpperCase();
    } catch (error) {
      console.warn("Unable to parse user profile", error);
    }
  }

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    const userStr = localStorage.getItem('user');
    const selectedBranchId = localStorage.getItem('selectedBranchId');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        await logActivity({
          branchId: selectedBranchId || 1,
          userId: user.userId || user.id,
          username: user.username,
          role: user.role || user.userRole,
          actionType: 'LOGOUT',
          details: `User logged out: ${user.username}`,
          metadata: "{}"
        });
      } catch (e) {
        console.error("Failed to log logout", e);
      }
    }
    
    localStorage.clear();
    navigate('/login');
  };

  return (
    <>
      <ConfirmActionModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Sign Out"
        message="Are you sure you want to sign out of the Manager Dashboard?"
        type="danger"
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
      />
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
            aria-label="Open sidebar menu"
          >
            <Menu size={18} />
          </button>

          <div className="flex flex-col min-w-0">
            <h1 className="font-bold text-lg sm:text-xl text-slate-800 leading-tight tracking-tight truncate">Enterprise Console</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase font-bold tracking-widest leading-none">Company-Wide Access</span>
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {userRole === 'SUPER_ADMIN' && (
            <button
              onClick={() => navigate('/admin')}
              className="hidden md:flex group items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-blue-50 rounded-lg text-sm font-medium transition-all duration-300 hover:shadow-md hover:border-blue-200 border border-transparent"
            >
              <LayoutDashboard size={16} className="text-slate-600 group-hover:text-blue-600 transition-colors" />
              <span className="text-slate-700 group-hover:text-blue-700 transition-colors">Super Admin Dashboard</span>
            </button>
          )}
          <button
            onClick={() => navigate('/inventory')}
            className="hidden md:flex group items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-blue-50 rounded-lg text-sm font-medium transition-all duration-300 hover:shadow-md hover:border-blue-200 border border-transparent"
          >
            <LayoutDashboard size={16} className="text-slate-600 group-hover:text-blue-600 transition-colors" />
            <span className="text-slate-700 group-hover:text-blue-700 transition-colors">Inventory Dashboard</span>
          </button>

          <SecondaryRoleBanner />

          <div className="text-right leading-tight hidden sm:block">
            <div className="font-mono text-lg font-bold tracking-wider text-slate-700">
              {time.toLocaleTimeString('en-US', { hour12: false })}
            </div>
            <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">
              {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 group cursor-default">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md transform group-hover:scale-105 transition-transform duration-300 ring-2 ring-blue-100">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 transition-colors max-w-[100px] truncate">
              {userName}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogoutClick}
            className="group relative overflow-hidden flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-red-100 text-slate-700 hover:text-red-600 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="absolute inset-0 bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <LogOut size={18} className="relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-x-0.5" />
            <span className="relative z-10 hidden sm:inline text-sm font-semibold">Sign Out</span>
          </button>
        </div>
      </header>
    </>
  );
}
