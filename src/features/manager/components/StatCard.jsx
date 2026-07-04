import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from "lucide-react";

const toneToBorder = {
  primary: "border-brand-primary",
  secondary: "border-brand-secondary",
  warning: "border-brand-warning",
  danger: "border-brand-danger",
  success: "border-brand-success",
};

const toneToIconBg = {
  primary: "bg-blue-100 text-blue-600",
  secondary: "bg-indigo-100 text-indigo-600",
  warning: "bg-yellow-100 text-yellow-600",
  danger: "bg-red-100 text-red-600",
  success: "bg-green-100 text-green-600",
};

const iconMap = {
  dollar: DollarSign,
  money: DollarSign,
  revenue: DollarSign,
  sales: ShoppingCart,
  cart: ShoppingCart,
  trending: TrendingUp,
  growth: TrendingUp,
  users: Users,
  staff: Users,
  package: Package,
  inventory: Package,
  alert: AlertCircle,
  check: CheckCircle,
  clock: Clock,
  pending: Clock,
  chart: BarChart3,
  analytics: BarChart3,
};

export default function StatCard({ title, value, icon = "chart", tone = "primary" }) {
  const border = toneToBorder[tone] || toneToBorder.primary;
  const iconBg = toneToIconBg[tone] || toneToIconBg.primary;
  const safeValue = typeof value === 'object' ? JSON.stringify(value) : value;
  const IconComponent = iconMap[icon?.toLowerCase()] || BarChart3;

  return (
    <div className={`bg-white border border-brand-border border-l-4 ${border} rounded-2xl shadow-sm p-5 h-full min-h-[110px] hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-brand-muted leading-tight">{title}</div>
          <div className="mt-2 text-2xl font-extrabold leading-none">{safeValue}</div>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${iconBg} grid place-items-center shrink-0 shadow-sm`}>
          <IconComponent size={24} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}
