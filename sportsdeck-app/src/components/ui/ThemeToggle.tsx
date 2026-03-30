"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "sportsdeck-theme";
type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(initialTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  const isDark = mounted ? theme === "dark" : false;
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="fixed bottom-5 right-5 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-bg-card text-text-primary shadow-card transition hover:bg-bg-elevated"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
