/**
 * Checks if a given date string corresponds to today.
 */
export const isToday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

/**
 * Returns Tailwind class names for a DTV service status badge.
 */
export const getDtvStatusBadgeColor = (status) => {
  const colors = {
    PENDING: "bg-blue-100 text-blue-700",
    ASSIGNED: "bg-orange-100 text-orange-700",
    IN_PROGRESS: "bg-indigo-100 text-indigo-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-red-100 text-red-700",
  };
  return colors[status] || "bg-slate-100 text-slate-700";
};

/**
 * Returns Tailwind class names for a Mobile repair status badge.
 */
export const getRepairStatusBadgeColor = (status) => {
  const colors = {
    RECEIVED: "bg-yellow-100 text-yellow-700",
    DIAGNOSED: "bg-orange-100 text-orange-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    WAITING_APPROVAL: "bg-purple-100 text-purple-700",
    READY_FOR_PAYMENT: "bg-emerald-100 text-emerald-700",
    PAID: "bg-green-100 text-green-700",
    DELIVERED: "bg-slate-100 text-slate-700",
  };
  return colors[status] || "bg-slate-100 text-slate-700";
};

/**
 * Returns button color theme classes.
 */
export const getActionBtnColor = (color) => {
  const colors = {
    blue: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100",
    orange: "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-100",
    emerald: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100",
    slate: "bg-slate-500 hover:bg-slate-600 text-white shadow-sm",
  };
  return colors[color] || "bg-blue-600 hover:bg-blue-700 text-white";
};

/**
 * Formats the repair number or generates a fallback formatted version.
 */
export const formatRepairNo = (job) => {
  if (job?.repairNo && String(job.repairNo).trim()) return job.repairNo;
  const id = String(job?.repairId || "").padStart(6, "0");
  const d = new Date(job?.createdAt || job?.updatedAt || Date.now());
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `REP-${y}${m}-${id}`;
};
