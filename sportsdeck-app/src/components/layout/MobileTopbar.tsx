"use client";

import { Menu, Bell } from "lucide-react";
import Logo from "../ui/Logo";

export default function MobileTopbar({
  onOpenSidebar,
}: {
  onOpenSidebar: () => void;
}) {
  return (
    <div className="
      md:hidden
      fixed top-0 left-0 right-0 z-50
      h-14
      px-4
      flex items-center justify-between
      bg-bg-surface/80 backdrop-blur-xl
      border-b border-border-subtle
    ">
      {/* Left */}
      <button
        onClick={onOpenSidebar}
        className="w-9 h-9 rounded-xl bg-bg-card flex items-center justify-center"
      >
        <Menu size={18} />
      </button>

      {/* Center */}
      <Logo variant="icon" />

      {/* Right */}
      <button className="w-9 h-9 rounded-xl bg-bg-card flex items-center justify-center">
        <Bell size={16} />
      </button>
    </div>
  );
}