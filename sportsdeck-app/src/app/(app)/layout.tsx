"use client";

import { useState } from "react";
import AppSidebar from "@/components/layout/AppSidebar";
import MobileTopbar from "@/components/layout/MobileTopbar";
import { AuthProvider } from "@/contexts/AuthContext";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-bg-main text-text-primary">

        {/* Mobile Topbar */}
        <MobileTopbar onOpenSidebar={() => setMobileOpen(true)} />

        {/* Sidebar */}
        <AppSidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Main */}
        <div
          className={`
            transition-all duration-300 pt-14 md:pt-0
            ${collapsed ? "md:ml-[80px]" : "md:ml-[260px]"}
          `}
        >
          <main className="px-4 md:px-6 py-6">
            {children}
          </main>
        </div>

      </div>
    </AuthProvider>
  );
}