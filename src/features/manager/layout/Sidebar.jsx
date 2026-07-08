import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  CheckCircle,
  Activity,
  ShoppingCart,
  BarChart3,
  UserCheck,
  FileText,
  Package,
  CreditCard,
  Wrench,
  Shield,
  Wallet
} from "lucide-react";
import { 
  getUserRegistrations, 
  getApprovals, 
  getPendingDispatches 
} from "../services/managerService";
import { poService } from "@/features/procurement/services/poService";
import { useSystemName } from "@/context/SystemNameContext";
import FeatureGate from "@/components/common/FeatureGate";

const base =
  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-gray-300 hover:bg-gray-800 hover:translate-x-1 hover:text-white relative";
const activeClass = "bg-brand-primary text-white shadow-lg translate-x-1";

const NavItemLink = ({ to, icon: Icon, label, end = false, badge, onNavigate }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onNavigate}
    className={({ isActive }) => `${base} ${isActive ? activeClass : ""}`}
  >
    <Icon size={18} className="shrink-0 transition-transform duration-200" />
    <span className="text-sm truncate flex-1">{label}</span>
    {badge > 0 && (
      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-pulse">
        {badge}
      </span>
    )}
  </NavLink>
);

export default function Sidebar({ isMobileOpen = false, onNavigate = () => {} }) {
  const { systemName } = useSystemName();
  const [pendingCount, setPendingCount] = useState(0);
  const [cashierPendingCount, setCashierPendingCount] = useState(0);
  const [inventoryPendingCount, setInventoryPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCounts = async () => {
      try {
        const userData = await getUserRegistrations("PENDING");
        if (Array.isArray(userData)) {
          setPendingCount(userData.length);
        }

        const approvalData = await getApprovals("PENDING");
        if (Array.isArray(approvalData)) {
          const filtered = approvalData.filter(item => item.category !== "USER_REGISTRATION");
          setCashierPendingCount(filtered.length);
        }

        const poRes = await poService.getPendingPOs();
        const poRaw = poRes.data?.data || poRes.data || [];
        let poList = [];
        if (Array.isArray(poRaw)) {
          poList = poRaw;
        } else if (poRaw.content && Array.isArray(poRaw.content)) {
          poList = poRaw.content;
        } else if (poRaw.data && Array.isArray(poRaw.data)) {
          poList = poRaw.data;
        } else if (poRaw.data?.content && Array.isArray(poRaw.data.content)) {
          poList = poRaw.data.content;
        }
        setInventoryPendingCount(poList.length);
      } catch (err) {
        console.error("Failed to fetch pending counts sidebar", err);
      }
    };

    fetchPendingCounts();
    const interval = setInterval(fetchPendingCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className={`w-72 bg-gray-900 text-white h-screen flex flex-col min-h-0 fixed top-0 left-0 z-50 transform transition-transform duration-300 ease-out lg:static lg:translate-x-0 lg:z-auto ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">{systemName}</h1>
        <p className="text-sm text-gray-400 mt-1">Enterprise Console</p>
      </div>

      <nav className="sidebar-scroll p-4 flex-1 min-h-0 overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            Overview
          </div>
          <div className="mt-2 space-y-1">
            <NavItemLink to="/manager" end icon={LayoutGrid} label="Dashboard" onNavigate={onNavigate} />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            Operations
          </div>
          <div className="mt-2 space-y-1">
            <NavItemLink to="/manager/approvals" icon={CheckCircle} label="Cashier Approvals" badge={cashierPendingCount} onNavigate={onNavigate} />
            <NavItemLink to="/manager/manager-po-approvals" icon={CreditCard} label="Inventory Approvals" badge={inventoryPendingCount} onNavigate={onNavigate} />
            <NavItemLink to="/manager/services" icon={Wrench} label="DTV & Repairs" onNavigate={onNavigate} />
            <NavItemLink to="/manager/activity" icon={Activity} label="Branch Activity" onNavigate={onNavigate} />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            Sales
          </div>
          <div className="mt-2 space-y-1">
            <NavItemLink to="/manager/sales" icon={ShoppingCart} label="Sales" onNavigate={onNavigate} />
            <FeatureGate featureCode="SALES_REPORTS" featureName="Sales Reports">
              <NavItemLink to="/manager/sales-reports" icon={BarChart3} label="Sales Reports" onNavigate={onNavigate} />
            </FeatureGate>
            <FeatureGate featureCode="MANAGER_LOYALTY" featureName="Manager Loyalty">
              <NavItemLink to="/manager/loyalty" icon={Package} label="Loyalty & Customers" onNavigate={onNavigate} />
            </FeatureGate>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            Staff
          </div>
          <div className="mt-2 space-y-1">
            <NavItemLink to="/manager/user-registrations" icon={UserCheck} label="User Registrations" badge={pendingCount} onNavigate={onNavigate} />
            <NavItemLink to="/manager/secondary-roles" icon={Shield} label="Secondary Roles" onNavigate={onNavigate} />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            Finance
          </div>
          <div className="mt-2 space-y-1">
            <NavItemLink to="/manager/expenses" icon={Wallet} label="Expenses" onNavigate={onNavigate} />
          </div>
        </div>
      </nav>
    </aside>
  );
}
