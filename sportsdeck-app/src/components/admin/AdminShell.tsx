"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldOff, LogIn } from "lucide-react";
import AppSidebar from "@/components/layout/AppSidebar";
import MobileTopbar from "@/components/layout/MobileTopbar";

type AdminShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function AdminShell({ title, subtitle, children }: AdminShellProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-main px-4 text-text-secondary">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading admin console...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-main px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border-subtle bg-bg-surface p-8 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
            <LogIn className="h-7 w-7 text-amber-400" />
          </div>
          <h1 className="mb-2 text-lg font-bold text-primary">Sign in required</h1>
          <p className="mb-6 text-sm text-text-secondary">
            You need to be signed in to access the Admin Console. Please log in with an administrator account.
          </p>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary-400"
          >
            <LogIn className="h-4 w-4" />
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-main px-4">
        <div className="w-full max-w-sm rounded-2xl border border-rose-500/20 bg-bg-surface p-8 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
            <ShieldOff className="h-7 w-7 text-rose-400" />
          </div>
          <h1 className="mb-2 text-lg font-bold text-primary">Access denied</h1>
          <p className="mb-1 text-sm text-text-secondary">
            The Admin Console is restricted to administrators only.
          </p>
          <p className="mb-6 text-sm text-text-muted">
            You are signed in as{" "}
            <span className="font-semibold text-text-primary">
              {user.username?.trim() || "this account"}
            </span>
            , which does not have admin privileges.
          </p>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border-subtle bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-white/[0.08]"
          >
            ← Back to SportsDeck
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main text-text-primary">
      <MobileTopbar onOpenSidebar={() => setMobileOpen(true)} />
      <AppSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className={`transition-all duration-300 pt-14 md:pt-0 ${collapsed ? "md:ml-[80px]" : "md:ml-[260px]"}`}>
        <main className="px-4 md:px-6 py-6">
          <div className="mx-auto max-w-7xl">
            <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
                {subtitle ? <p className="mt-1 text-sm text-text-secondary">{subtitle}</p> : null}
              </div>
              <Link
                href="/"
                className="rounded-xl border border-border bg-bg-surface px-4 py-2 text-sm text-text-secondary hover:border-border-strong hover:bg-bg-elevated hover:text-text-primary transition"
              >
                ← Back to app
              </Link>
            </header>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
