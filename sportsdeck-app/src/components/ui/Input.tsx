"use client";

import { LucideIcon } from "lucide-react";

interface InputProps {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  icon?: LucideIcon;
}

export default function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  icon: Icon,
}: InputProps) {
  return (
    <div>
      <label className="block text-xs text-text-secondary mb-1">
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
        )}

        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${
            Icon ? "pl-9" : "pl-3"
          } pr-3 py-2.5 rounded-xl bg-bg-elevated border border-border-subtle text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 transition`}
        />
      </div>
    </div>
  );
}