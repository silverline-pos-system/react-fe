// Shared formatting helpers for admin dashboard widgets.

export const formatLKR = (value) => `LKR ${Number(value || 0).toLocaleString()}`;

export const formatLKRCompact = (value) => {
  const n = Number(value || 0);
  if (Math.abs(n) >= 1000) return `LKR ${(n / 1000).toFixed(0)}K`;
  return `LKR ${n.toFixed(0)}`;
};

export const formatRelativeTime = (input) => {
  if (!input) return "-";
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return "-";
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(input).toLocaleDateString();
};
