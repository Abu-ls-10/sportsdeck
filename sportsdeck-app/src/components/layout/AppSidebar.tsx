"use client";

import {
  Home,
  LayoutDashboard,
  Users,
  Trophy,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Ban,
  Flag,
  BarChart3,
  FlagTriangleRight,
  Inbox,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Logo from "../ui/Logo";
import { UserAvatar } from "../ui/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";

/** JWT does not include avatarUrl; load it for the sidebar avatar. */
function useMyAvatarUrl(
  userId: string | undefined,
  accessToken: string | null,
  pathname: string
) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
  if (!userId || !accessToken) {
    setAvatarUrl(null);
    return;
  }

  let cancelled = false;

  void (async () => {
    try {
      const res = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });

      if (!res.ok) return;

      const json = await res.json();

      if (!cancelled) {
        setAvatarUrl(json.data?.avatarUrl ?? null);
      }
    } catch {
      if (!cancelled) setAvatarUrl(null);
    }
  })();

  return () => {
    cancelled = true;
  };
}, [userId, accessToken]);

  return avatarUrl;
}

const navItems = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Feed", href: "/feed", icon: LayoutDashboard },
  { label: "Community", href: "/community", icon: Users },
  { label: "Matches", href: "/matches", icon: Trophy },
  { label: "Teams", href: "/teams", icon: Flag },
  { label: "Standings", href: "/standings", icon: BarChart3 },
];

const adminItems = [
  { label: "Bans", href: "/admin/bans", icon: Ban },
  { label: "Reports", href: "/admin/reports", icon: FlagTriangleRight },
  { label: "Appeals", href: "/admin/appeals", icon: MessageSquare },
];

const accountItems = [
  { label: "My Appeals", href: "/appeals", icon: Inbox },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function AppSidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: {
  collapsed: boolean;
  setCollapsed: Dispatch<SetStateAction<boolean>>;
  mobileOpen: boolean;
  setMobileOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const pathname = usePathname();
  const { user, logout, accessToken } = useAuth();
  const meAvatarUrl = useMyAvatarUrl(user?.id, accessToken, pathname);

  const isExpanded = !collapsed;

  return (
    <>
      {/* ================= OVERLAY (separate layer) ================= */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="
            fixed inset-0 z-[50]
            bg-black/40 backdrop-blur-sm
            transition-opacity duration-300
          "
        />
      )}

      {/* ================= MOBILE DRAWER ================= */}
      <aside
        className={`
          fixed top-0 left-0 z-[60] h-screen w-[260px]
          bg-bg-surface/95 backdrop-blur-xl
          border-r border-border-subtle

          transform transition-transform duration-300 md:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <SidebarContent
          expanded={true}
          pathname={pathname}
          user={user}
          meAvatarUrl={meAvatarUrl}
          logout={logout}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside
        className="
          hidden md:flex fixed top-0 left-0 z-[40] h-screen
          bg-bg-surface/90 backdrop-blur-xl
          border-r border-border-subtle
          transition-all duration-300
        "
        style={{
          width: collapsed ? 80 : 260,
        }}
      >
        <SidebarContent
          expanded={isExpanded}
          pathname={pathname}
          user={user}
          meAvatarUrl={meAvatarUrl}
          logout={logout}
        />
      </aside>

      {/* ================= FLOATING TOGGLE ================= */}
      <button
        onClick={() => setCollapsed((prev) => !prev)}
        className="
          hidden md:flex
          fixed top-1/2 -translate-y-1/2 z-[70]

          w-8 h-8
          rounded-full
          bg-bg-card/80 backdrop-blur-sm
          border border-border-subtle
          shadow-md

          items-center justify-center
          hover:bg-bg-elevated hover:scale-105 hover:shadow-glow
          transition-all duration-300
        "
        style={{
          left: collapsed ? 72 : 252,
        }}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </>
  );
}

/* ================= SHARED CONTENT ================= */

function SidebarContent({
  expanded,
  pathname,
  user,
  meAvatarUrl,
  logout,
  onNavigate,
}: {
  expanded: boolean;
  pathname: string;
  user: { id: string; username: string | null; role: string } | null;
  meAvatarUrl: string | null;
  logout: () => void;
  onNavigate?: () => void;
}) {
  const roleLower = user?.role?.toLowerCase() ?? "";
  const isAdmin = roleLower === "admin";
  const showAdminNav = isAdmin || roleLower === "moderator";

  return (
    <div className="flex h-full flex-col">

      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between p-4">
        {expanded ? (
          <Logo variant="compact" />
        ) : (
          <div className="flex justify-center w-full">
            <Logo variant="icon" />
          </div>
        )}
      </div>

      {/* ===== NAV ===== */}
      <nav
        className="
          flex-1 px-3 space-y-1
          overflow-y-auto
          scrollbar-hide
          pb-4
        "
      >

        {/* ===== MAIN NAV ===== */}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.label}
              href={item.href}
              title={!expanded ? item.label : ""}
              onClick={onNavigate}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                transition-all duration-200
                ${
                  isActive
                    ? "bg-primary-500/15 text-primary-400 shadow-inner border border-primary-500/20"
                    : "text-text-secondary hover:bg-bg-elevated hover:scale-[1.02] hover:text-primary"
                }
              `}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-primary-400" : ""}`} />
              {expanded && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* ===== ADMIN SECTION ===== */}
        {showAdminNav ? (
          <>
            <div className="mt-4 px-3">
              {expanded && (
                <p className="text-xs text-text-muted mb-2">MODERATION</p>
              )}
            </div>

            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  title={!expanded ? item.label : ""}
                  onClick={onNavigate}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                    transition-all duration-200
                    ${
                      isActive
                        ? "bg-brand-500/15 text-brand-400 shadow-inner border border-brand-500/20"
                        : "text-text-secondary hover:bg-brand-500/10 hover:text-brand-300 hover:scale-[1.02]"
                    }
                  `}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-brand-400" : ""}`} />
                  {expanded && <span>{item.label}</span>}
                </Link>
              );
            })}
          </>
        ) : null}

        {/* ===== ACCOUNT SECTION ===== */}
        <div className="mt-4 px-3">
          {expanded && (
            <p className="text-xs text-text-muted mb-2">ACCOUNT</p>
          )}
        </div>

        {accountItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.label}
              href={item.href}
              title={!expanded ? item.label : ""}
              onClick={onNavigate}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                transition-all duration-200
                ${
                  isActive
                    ? "bg-accent-500/15 text-accent-400 shadow-inner border border-accent-500/20"
                    : "text-text-secondary hover:bg-accent-500/10 hover:text-accent-300 hover:scale-[1.02]"
                }
              `}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-accent-400" : ""}`} />
              {expanded && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ===== PROFILE ===== */}
      <div className="p-3 border-t border-border-subtle">
        <div className="flex items-start gap-3">
          {user?.id ? (
            <UserAvatar
              username={user.username}
              avatarUrl={meAvatarUrl}
              href={`/users/${user.id}`}
              title="View profile"
              sizeClass="h-9 w-9"
            />
          ) : null}

          {expanded && (
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="truncate text-sm text-text-primary">
                @{user?.username ?? "user"}
              </p>
              <p
                className={
                  isAdmin
                    ? "text-xs font-semibold text-emerald-400"
                    : "text-xs text-text-muted"
                }
              >
                {isAdmin ? "Admin" : "User"}
              </p>
              <button
                type="button"
                onClick={logout}
                className="self-start text-xs text-red-400 transition hover:text-red-300"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}