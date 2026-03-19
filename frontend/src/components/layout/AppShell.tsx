import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { NotificationPanel } from "./NotificationPanel";
import { ToastContainer } from "./ToastContainer";

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const handler = () => setSidebarCollapsed(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggleSidebar = () => setSidebarCollapsed((v) => !v);

  return (
    <>
      <TopBar onMenuClick={toggleSidebar} />
      <Sidebar collapsed={sidebarCollapsed} />
      <NotificationPanel />
      <ToastContainer />
      <main
        className="min-h-screen bg-slate-50 p-6 transition-[margin-left] duration-200"
        style={{ marginLeft: sidebarCollapsed ? 64 : 256, marginTop: 64 }}
      >
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </>
  );
}
