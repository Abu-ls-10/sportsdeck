"use client";

import { LucideIcon } from "lucide-react";

interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  icon?: LucideIcon;
  className?: string;
  disabled?: boolean;
  error?: string;
}

export default function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  icon: Icon,
  className = "",
  disabled = false,
  error,
}: InputProps) {
  return (
    <div className="space-y-1">
      
      {/* LABEL */}
      {label && (
        <label className="block text-xs text-text-secondary">
          {label}
        </label>
      )}

      {/* INPUT */}
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
          value={value ?? ""} // ✅ prevents uncontrolled warning
          onChange={(e) => onChange?.(e.target.value)} // ✅ optional
          disabled={disabled}
          className={`
            w-full
            ${Icon ? "pl-9" : "pl-3"} pr-3 py-2.5
            rounded-xl
            bg-bg-elevated
            border
            ${error ? "border-red-500" : "border-border-subtle"}
            text-text-primary
            placeholder:text-text-muted
            focus:outline-none
            focus:ring-2
            ${error ? "focus:ring-red-500" : "focus:ring-primary-500"}
            transition
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
        />
      </div>

      {/* ERROR */}
      {error && (
        <p className="text-xs text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}