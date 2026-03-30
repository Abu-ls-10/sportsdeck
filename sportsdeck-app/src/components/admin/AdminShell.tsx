"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck, Flag, Gavel, MessageSquareWarning, ChevronRight, ShieldOff, LogIn } from "lucide-react";

type AdminShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  { label: "Reports Queue", href: "/admin/reports", icon: <Flag className="w-4 h-4" /> },
  { label: "Appeals", href: "/admin/appeals", icon: <MessageSquareWarning className="w-4 h-4" /> },
  { label: "Bans", href: "/admin/bans", icon: <Gavel className="w-4 h-4" /> },
];

export default function AdminShell({ title, subtitle, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

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
          <h1 className="mb-2 text-lg font-bold text-white">Sign in required</h1>
          <p className="mb-6 text-sm text-text-secondary">
            You need to be signed in to access the Admin Console. Please log in with an administrator account.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-400"
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
          <h1 className="mb-2 text-lg font-bold text-white">Access denied</h1>
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
      {/* Top glow accent */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[240px_1fr]">
        {/* ── Sidebar ── */}
        <aside className="h-fit rounded-2xl border border-border bg-bg-surface p-4 shadow-card">
          {/* Logo */}
          <div className="mb-6 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">SportsDeck</p>
              <p className="text-[10px] text-text-muted uppercase tracking-widest">Admin Console</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? "flex items-center gap-2.5 rounded-xl border border-primary-500/30 bg-primary-500/10 px-3 py-2.5 text-sm font-semibold text-primary-300"
                      : "flex items-center gap-2.5 rounded-xl border border-transparent px-3 py-2.5 text-sm text-text-secondary hover:border-border hover:bg-bg-elevated hover:text-text-primary transition"
                  }
                >
                  <span className={active ? "text-primary-400" : "text-text-muted"}>{item.icon}</span>
                  {item.label}
                  {active && <ChevronRight className="ml-auto w-3.5 h-3.5 text-primary-400" />}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="mt-8 border-t border-border pt-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-primary text-[10px] font-bold text-white">
                {(user.username ?? "A").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-text-primary">{user.username ?? "Admin"}</p>
                <p className="text-[10px] text-text-muted">Administrator</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main>
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
        </main>
      </div>
    </div>
  );
}
