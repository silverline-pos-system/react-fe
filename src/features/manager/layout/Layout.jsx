import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden relative">
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onNavigate={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <Topbar onMenuClick={() => setIsMobileSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
