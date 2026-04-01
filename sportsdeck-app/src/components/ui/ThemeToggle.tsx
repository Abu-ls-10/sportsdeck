"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

/**
 * Safe initial state (no hydration mismatch)
 */
function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "dark";

  return document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const toggleClass = "group relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border-subtle bg-bg-card/80 text-text-secondary backdrop-blur-md shadow-card transition-all duration-300 ease-smooth hover:scale-[1.05] hover:border-primary-500/30 hover:bg-bg-elevated hover:text-text-primary active:scale-[0.97] animate-[float_4s_ease-in-out_infinite] hover:animate-none";

  /**
   * ONLY sync external systems
   */
  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("sportsdeck-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={toggleClass}
    >
      <span className="absolute inset-0 rounded-2xl opacity-0 bg-gradient-primary transition-opacity duration-300 group-hover:opacity-[0.08]" />

      <span className="relative flex items-center justify-center">
        {isDark ? (
          <Sun className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
        ) : (
          <Moon className="h-5 w-5 transition-transform duration-300 group-hover:-rotate-12" />
        )}
      </span>
    </button>
  );
}