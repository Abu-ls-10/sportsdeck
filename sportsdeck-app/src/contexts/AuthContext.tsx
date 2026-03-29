"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface AuthUser {
  id: string;
  username: string | null;
  role: string;
  isBanned: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function parseJwt(token: string): AuthUser | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(json);
    return {
      id: payload.id,
      username: payload.username ?? null,
      role: payload.role ?? "USER",
      isBanned: payload.isBanned ?? false,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyToken = useCallback((token: string) => {
    setAccessToken(token);
    setUser(parseJwt(token));
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return null;
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) {
        localStorage.removeItem("refresh_token");
        setAccessToken(null);
        setUser(null);
        return null;
      }
      const data = await res.json();
      const newAccess = data.access_token;
      const newRefresh = data.new_refresh_token;
      if (newRefresh) localStorage.setItem("refresh_token", newRefresh);
      applyToken(newAccess);
      return newAccess;
    } catch {
      return null;
    }
  }, [applyToken]);

  // On mount, try to restore session via refresh token
  useEffect(() => {
    const init = async () => {
      const storedRefresh = localStorage.getItem("refresh_token");
      if (storedRefresh) {
        await refreshAccessToken();
      }
      setIsLoading(false);
    };
    init();
  }, [refreshAccessToken]);

  const login = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) return { error: data.message ?? "Login failed" };
        localStorage.setItem("refresh_token", data.refresh_token);
        applyToken(data.access_token);
        return {};
      } catch {
        return { error: "Network error. Please try again." };
      }
    },
    [applyToken]
  );

  const signup = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) return { error: data.message ?? "Signup failed" };
        localStorage.setItem("refresh_token", data.refresh_token);
        applyToken(data.access_token);
        return {};
      } catch {
        return { error: "Network error. Please try again." };
      }
    },
    [applyToken]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("refresh_token");
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, login, signup, logout, refreshAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
