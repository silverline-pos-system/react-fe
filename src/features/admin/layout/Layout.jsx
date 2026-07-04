import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { NotificationProvider } from "@/features/pos/context/NotificationContext";
import NotificationPanel from "@/features/pos/components/NotificationPanel";

export default function Layout({ children }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <NotificationProvider>
      <div className="flex h-screen bg-gray-50 relative overflow-hidden">
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

        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Topbar onMenuClick={() => setIsMobileSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
      <NotificationPanel />
    </NotificationProvider>
  );
}
