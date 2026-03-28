"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import Input from "../ui/Input";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);

  const navItems = [
    "Football",
    "Basketball",
    "Tennis",
    "UCL",
    "NBA",
  ];

  return (
    <>
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-bg-surface/80 backdrop-blur-md border-b border-border">
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">

          {/* LEFT */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              className="md:hidden text-text-secondary"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              ☰
            </button>

            {/* Logo */}
            <h1 className="font-bold text-lg tracking-tight">
              SportsDeck
            </h1>
          </div>

          {/* CENTER - Search */}
          <div className="hidden md:block w-full max-w-md mx-6">
            <Input placeholder="Search teams, players..." />
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">
            
            {/* Dropdown */}
            <div
              className="relative hidden md:block"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button className="flex items-center gap-1 text-text-secondary hover:text-primary-500 transition">
                Sports
                <ChevronDown
                  className={`w-4 h-4 transition ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full mt-2 w-48 bg-bg-card border rounded-xl shadow-lg p-2 space-y-1">
                  {navItems.map((item, i) => (
                    <button
                      key={i}
                      className="block w-full text-left px-3 py-2 rounded-lg text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="w-9 h-9 rounded-xl bg-bg-card flex items-center justify-center cursor-pointer hover:bg-bg-surface">
              🔔
            </div>

            {/* Profile */}
            <div className="w-9 h-9 rounded-full bg-primary-500 cursor-pointer"></div>
          </div>
        </div>
      </nav>

      {/* Spacer */}
      <div className="h-16" />

      {/* ===== MOBILE DRAWER ===== */}
      <div
        className={`fixed top-16 right-0 h-[calc(100%-64px)] w-72 bg-bg-surface border-l border-border p-6 space-y-6 transition-transform duration-300 z-40
        ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        
        {/* Search */}
        <Input placeholder="Search..." />

        {/* Dropdown */}
        <div>
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
            <div className="mt-3 ml-2 border-l border-border pl-4 space-y-2">
              {navItems.map((item, i) => (
                <button
                  key={i}
                  className="block text-left w-full text-text-secondary hover:text-primary-500 text-sm"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 mt-auto">
          <div className="w-10 h-10 rounded-full bg-primary-500"></div>
          <span className="text-text-secondary">My Profile</span>
        </div>
      </div>
    </>
  );
}