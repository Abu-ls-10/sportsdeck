"use client";

import { useState } from "react";
import AppSidebar from "@/components/layout/AppSidebar";
import MobileTopbar from "@/components/layout/MobileTopbar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";


function ClientLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-main text-text-primary">
        <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-40 rounded-xl bg-white/5" />
            <div className="h-40 rounded-3xl bg-white/5" />
            <div className="h-24 rounded-2xl bg-white/5" />
            <div className="h-24 rounded-2xl bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED SHELL
  if (user) {
    return (
      <div className="min-h-screen bg-bg-main text-text-primary">
        <MobileTopbar onOpenSidebar={() => setMobileOpen(true)} />

        <AppSidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        <div
          className={`
            transition-all duration-300 pt-14 md:pt-0
            ${collapsed ? "md:ml-[80px]" : "md:ml-[260px]"}
          `}
        >
          <main className="px-4 py-6 md:px-6">{children}</main>
        </div>
      </div>
    );
  }

  // PUBLIC SHELL
  return (
    <div className="min-h-screen bg-bg-main text-text-primary flex flex-col">
      <Navbar />

      <main className="flex-1">
        {children}
      </main>

      <Footer />
    </div>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ClientLayoutShell>{children}</ClientLayoutShell>
    </AuthProvider>
  );
}