import { useEffect, useMemo, useState } from "react";
import { getDashboardStats } from "../services/managerService";
import SetTargetModal from "./SetTargetModal";

export default function TargetProgress() {
  const [targetToday, setTargetToday] = useState(250000);
  const [achievedToday, setAchievedToday] = useState(0);
  const [open, setOpen] = useState(false);

  const getBranchName = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.branchName || user.branch || "Main Branch";
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
    return "Main Branch";
  };

  const BRANCH = getBranchName();
  const dayKey = new Date().toISOString().slice(0, 10);
  const storageKey = `srp_target_${BRANCH.replace(/\s+/g, "_")}_${dayKey}`;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        if (data && data.length > 0) {
          const salesStat = data.find(s => s.title?.includes("Sales"));
          if (salesStat) {
            const value = parseInt(salesStat.value?.replace(/\D/g, "") || 0);
            setAchievedToday(value);
          }
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const n = Number(saved);
      if (Number.isFinite(n) && n > 0) {
        setTargetToday(n);
      }
    }
  }, [storageKey]);

  const pct = useMemo(() => {
    if (!targetToday) return 0;
    return Math.min(100, Math.round((achievedToday / targetToday) * 100));
  }, [achievedToday, targetToday]);

  const achieved = achievedToday.toLocaleString();
  const target = targetToday.toLocaleString();

  const saveTarget = (n) => {
    setTargetToday(n);
    localStorage.setItem(storageKey, String(n));
  };

  return (
    <div className="bg-white border border-brand-border rounded-2xl shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-brand-muted">Today's Target</div>
          <div className="mt-1 text-xl font-extrabold">LKR {achieved} / {target}</div>
          <div className="mt-1 text-xs text-brand-muted">You're at <span className="font-bold text-brand-primary">{pct}%</span> of today's sales goal.</div>
        </div>

        <button
          type="button"
          className="text-xs px-3 py-1 rounded-full bg-slate-100 border border-brand-border font-bold hover:bg-slate-200 transition"
          onClick={() => setOpen(true)}
        >
          🎯 Set Target
        </button>
      </div>

      <div className="mt-4 h-3 w-full rounded-full bg-slate-100 overflow-hidden border border-brand-border">
        <div
          className="h-full bg-brand-primary"
          style={{ width: `${pct}%` }}
        />
      </div>

      <SetTargetModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={saveTarget}
        initialTarget={targetToday}
      />
    </div>
  );
}
