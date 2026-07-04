import { useEffect, useState } from "react";

export default function Clock({ timeZone = "Asia/Colombo" }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString("en-LK", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // return (
  //   <span className="text-xs px-3 py-1 rounded-full bg-slate-100 border border-brand-border">
  //     {time}
  //   </span>

  return (
  <span className="text-xs leading-none px-3 py-1.5 rounded-full bg-slate-100 border border-brand-border">
    {time}
  </span>
  );
}
