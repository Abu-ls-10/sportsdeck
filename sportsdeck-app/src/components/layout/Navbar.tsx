"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Bell,
  Search,
} from "lucide-react";
import Input from "../ui/Input";
import Link from "next/link";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);

  const navLinks = [
    { name: "Feed", href: "/" },
    { name: "Community", href: "/community" },
    { name: "Matches", href: "/matches" },
    { name: "Teams", href: "/teams" },
  ];

  const sportsItems = [
    "Football",
    "Basketball",
    "Tennis",
    "UCL",
    "NBA",
  ];

  return (
    <>
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-bg-surface/80 backdrop-blur-xl border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">

          {/* LEFT */}
          <div className="flex items-center gap-4">

            {/* Mobile Menu */}
            <button
              className="md:hidden text-text-secondary"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
            <Link href="/" className="font-semibold text-lg text-white">
              SportsDeck
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6 ml-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm text-text-secondary hover:text-white transition"
                >
                  {link.name}
                </Link>
              ))}

              {/* Sports Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button className="flex items-center gap-1 text-sm text-text-secondary hover:text-white transition">
                  Sports
                  <ChevronDown
                    className={`w-4 h-4 transition ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute top-full mt-2 w-48 bg-bg-card border border-border-subtle rounded-xl shadow-lg p-2">
                    {sportsItems.map((item) => (
                      <button
                        key={item}
                        className="block w-full text-left px-3 py-2 rounded-lg text-text-secondary hover:bg-bg-surface hover:text-white text-sm"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CENTER - Search */}
          <div className="hidden md:flex items-center w-full max-w-md mx-6 relative">
            <Search className="absolute left-3 w-4 h-4 text-text-muted" />
            <input
              placeholder="Search matches, teams, players..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-bg-card border border-border-subtle text-sm text-white placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">

            {/* Search icon (mobile) */}
            <button className="md:hidden w-9 h-9 rounded-xl bg-bg-card flex items-center justify-center">
              <Search className="w-4 h-4 text-text-secondary" />
            </button>

            {/* Notifications */}
            <button className="relative w-9 h-9 rounded-xl bg-bg-card flex items-center justify-center hover:bg-bg-surface transition">
              <Bell className="w-4 h-4 text-text-secondary" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent-400 rounded-full" />
            </button>

            {/* Profile */}
            <div className="w-9 h-9 rounded-full bg-gradient-primary cursor-pointer" />
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

          {/* Search */}
          <Input placeholder="Search..." />

          {/* Links */}
          <div className="mt-6 space-y-4">
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

          {/* Sports Dropdown */}
          <div className="mt-6">
            <button
              onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
              className="w-full flex justify-between items-center text-text-primary"
            >
              Sports
              <ChevronRight
                className={`transition ${
                  mobileDropdownOpen ? "rotate-90" : ""
                }`}
              />
            </button>

            {mobileDropdownOpen && (
              <div className="mt-3 ml-2 border-l border-border-subtle pl-4 space-y-2">
                {sportsItems.map((item) => (
                  <button
                    key={item}
                    className="block text-left text-text-secondary hover:text-white text-sm"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Profile */}
          <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary" />
            <span className="text-text-secondary text-sm">My Profile</span>
          </div>
        </div>
      </div>
    </>
  );
}