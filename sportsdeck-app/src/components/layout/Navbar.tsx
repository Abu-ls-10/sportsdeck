"use client";

import { useState, useRef, useEffect } from "react";
import {
  Menu,
  X,
  Bell,
  Search,
} from "lucide-react";
import Link from "next/link";
import Logo from "../ui/Logo";
import { useAuth } from "../../contexts/AuthContext";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  const { user, isLoading, logout } = useAuth();

  const navLinks = [
    { name: "Feed", href: "/" },
    { name: "Community", href: "/community" },
    { name: "Matches", href: "/matches" },
    { name: "Teams", href: "/teams" },
    { name: "Standings", href: "/standings" },
  ];

  // ===== CLOSE DROPDOWN ON OUTSIDE CLICK / ESC =====
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <>
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-bg-surface/80 backdrop-blur-xl border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">

          {/* ===== LEFT ===== */}
          <div className="flex items-center gap-6">

            {/* Mobile Menu */}
            <button
              className="md:hidden text-text-secondary"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
            <Logo variant="compact" />

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-2 ml-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="
                    px-3 py-1.5 rounded-lg text-sm
                    text-text-secondary
                    hover:text-white hover:bg-bg-elevated
                    transition
                  "
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* ===== CENTER (Search) ===== */}
          <div className="hidden md:flex items-center w-full max-w-md mx-6 relative">
            <Search className="absolute left-3 w-4 h-4 text-text-muted" />
            <input
              placeholder="Search matches, teams, players..."
              className="
                w-full pl-9 pr-3 py-2 rounded-xl
                bg-bg-card border border-border-subtle
                text-sm text-white placeholder:text-text-muted
                focus:outline-none focus:ring-1 focus:ring-primary-500
                transition
              "
            />
          </div>

          {/* ===== RIGHT ===== */}
          <div className="flex items-center gap-3">

            {/* Mobile Search */}
            <button className="md:hidden w-9 h-9 rounded-xl bg-bg-card flex items-center justify-center">
              <Search className="w-4 h-4 text-text-secondary" />
            </button>

            {!isLoading && user ? (
              <>
                {/* Notifications */}
                <button className="
                  relative w-9 h-9 rounded-xl
                  bg-bg-card flex items-center justify-center
                  hover:bg-bg-elevated transition
                ">
                  <Bell className="w-4 h-4 text-text-secondary" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-accent-400 rounded-full" />
                </button>

                {/* Profile */}
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileOpen((prev) => !prev)}
                    className="
                      w-9 h-9 rounded-full
                      bg-gradient-primary
                      flex items-center justify-center
                      text-white text-sm font-semibold
                      hover:scale-105 transition
                    "
                  >
                    {user.username?.[0]?.toUpperCase() ?? "U"}
                  </button>

                  {/* Dropdown */}
                  <div
                    className={`
                      absolute right-0 mt-2 w-52
                      rounded-xl border border-border-subtle
                      bg-bg-card/80 backdrop-blur-sm
                      shadow-[0_10px_30px_rgba(14,165,233,0.15)]
                      p-2

                      transition-all duration-200 origin-top-right

                      ${
                        profileOpen
                          ? "opacity-100 scale-100 pointer-events-auto"
                          : "opacity-0 scale-95 pointer-events-none"
                      }
                    `}
                  >
                    {/* User Info */}
                    <div className="px-3 py-2 border-b border-border-subtle mb-2">
                      <p className="text-sm text-text-primary font-medium">
                        @{user.username ?? "user"}
                      </p>
                      <p className="text-xs text-text-muted">
                        {user.role}
                      </p>
                    </div>

                    {/* Actions */}
                    <Link
                      href={`/users/${user.id}`}
                      className="block px-3 py-2 text-sm text-text-secondary hover:bg-bg-elevated hover:text-white rounded-lg transition"
                    >
                      My Profile
                    </Link>

                    <Link
                      href="/settings"
                      className="block px-3 py-2 text-sm text-text-secondary hover:bg-bg-elevated hover:text-white rounded-lg transition"
                    >
                      Settings
                    </Link>

                    <div className="border-t border-border-subtle my-2" />

                    <button
                      onClick={logout}
                      className="
                        w-full text-left px-3 py-2 text-sm
                        text-red-400 hover:bg-bg-elevated
                        rounded-lg transition
                      "
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : !isLoading ? (
              <Link
                href="/signup"
                className="
                  px-4 py-2 rounded-xl text-sm font-medium
                  bg-gradient-primary text-white
                  hover:opacity-90 transition
                "
              >
                Get Started
              </Link>
            ) : null}
          </div>
        </div>
      </nav>

      {/* Spacer */}
      <div className="h-16" />

      {/* ===== MOBILE DRAWER ===== */}
      <div
        className={`fixed inset-0 z-50 transition ${
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileOpen(false)}
        />

        {/* Drawer */}
        <div
          className={`absolute left-0 top-0 h-full w-[85%] max-w-sm bg-bg-surface border-r border-border-subtle p-6 transform transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Top */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold">Menu</h2>
            <button onClick={() => setMobileOpen(false)}>
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Links */}
          <div className="space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="block text-text-primary text-sm"
                onClick={() => setMobileOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}