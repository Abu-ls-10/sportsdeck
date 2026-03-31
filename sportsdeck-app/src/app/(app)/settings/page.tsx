"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Camera } from "lucide-react";
import {
  DEFAULT_AVATAR_URL,
  MAX_AVATAR_DIMENSION,
  MAX_AVATAR_FILE_BYTES,
  MAX_AVATAR_PIXELS,
} from "@/lib/avatar";

type TeamOption = {
  id: string;
  name: string;
  shortName: string;
};
type ThemeMode = "light" | "dark";

type MeResponse = {
  data: {
    id: string;
    username: string | null;
    avatarUrl: string | null;
    authProvider: string | null;
    favoriteTeam: TeamOption | null;
  };
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function validateAvatarFile(file: File): Promise<{ ok: true } | { ok: false; message: string }> {
  if (file.size > MAX_AVATAR_FILE_BYTES) {
    return {
      ok: false,
      message: `Image must be at most ${MAX_AVATAR_FILE_BYTES / (1024 * 1024)} MB.`,
    };
  }
  try {
    const bitmap = await createImageBitmap(file);
    const w = bitmap.width;
    const h = bitmap.height;
    bitmap.close();
    if (w > MAX_AVATAR_DIMENSION || h > MAX_AVATAR_DIMENSION) {
      return {
        ok: false,
        message: `Image must be at most ${MAX_AVATAR_DIMENSION}×${MAX_AVATAR_DIMENSION} pixels (max ${MAX_AVATAR_PIXELS.toLocaleString()} pixels).`,
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Could not read this image. Try another file." };
  }
}

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem("sportsdeck-theme");
  if (saved === "light" || saved === "dark") return saved;
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyThemeToDocument(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  localStorage.setItem("sportsdeck-theme", mode);
}

const AVATAR_LIMIT_MESSAGE = `Up to ${MAX_AVATAR_DIMENSION}×${MAX_AVATAR_DIMENSION} pixels (${MAX_AVATAR_PIXELS.toLocaleString()} pixels max) and ${MAX_AVATAR_FILE_BYTES / (1024 * 1024)} MB per file.`;

export default function SettingsPage() {
  const { accessToken, applySessionFromAuthResponse } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");

  const [userId, setUserId] = useState<string>("");
  const [username, setUsername] = useState("");
  const [authProvider, setAuthProvider] = useState<string | null>(null);
  const [favoriteTeamId, setFavoriteTeamId] = useState("");
  /** Stored value for API (empty = no custom upload; preview uses default). */
  const [avatarUrl, setAvatarUrl] = useState("");
  const [caption, setCaption] = useState("");
  /** Draft only — applied to the document when the user clicks Save. */
  const [themeDraft, setThemeDraft] = useState<ThemeMode>("dark");

  const [teams, setTeams] = useState<TeamOption[]>([]);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const isOAuthAccount =
    authProvider?.toLowerCase() === "google" || authProvider?.toLowerCase() === "github";

  const avatarPreviewSrc = avatarUrl.trim() ? avatarUrl : DEFAULT_AVATAR_URL;

  useEffect(() => {
    setThemeDraft(readStoredTheme());
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setStatus("");

        const teamsRes = await fetch("/api/teams", { cache: "no-store" });
        if (teamsRes.ok) {
          const payload = (await teamsRes.json()) as { teams?: TeamOption[] };
          setTeams(payload.teams ?? []);
        }

        if (!accessToken) return;
        const meRes = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        });
        if (!meRes.ok) {
          setStatus("Could not load profile details.");
          return;
        }

        const me = (await meRes.json()) as MeResponse;
        const u = me.data;
        setUserId(u.id);
        const loadedCaption = (() => {
          const local = localStorage.getItem(`settings:${u.id}`);
          if (!local) return "";
          try {
            const parsed = JSON.parse(local) as { caption?: string };
            return parsed.caption ?? "";
          } catch {
            return "";
          }
        })();

        setUsername(u.username ?? "");
        setAuthProvider(u.authProvider ?? null);
        setAvatarUrl(u.avatarUrl?.trim() ?? "");
        setFavoriteTeamId(u.favoriteTeam?.id ?? "");
        setCaption(loadedCaption);
      } catch {
        setStatus("Failed loading settings.");
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [accessToken]);

  async function applyAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = await validateAvatarFile(file);
    if (!check.ok) {
      setStatus(check.message);
      e.target.value = "";
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setAvatarUrl(dataUrl);
    setStatus("");
    e.target.value = "";
  }

  async function applyDroppedAvatar(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const check = await validateAvatarFile(file);
    if (!check.ok) {
      setStatus(check.message);
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setAvatarUrl(dataUrl);
    setStatus("");
  }

  function onDragOver(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
  }

  async function handleRemoveAvatar() {
    if (!accessToken) {
      setStatus("Log in required.");
      return;
    }
    try {
      setStatus("");
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ removeAvatar: true }),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus(payload.error ?? "Could not remove avatar.");
        return;
      }
      setAvatarUrl(DEFAULT_AVATAR_URL);
      setStatus("Avatar reset to default.");
    } catch {
      setStatus("Could not remove avatar.");
    }
  }

  function openPasswordModal() {
    setPwCurrent("");
    setPwNew("");
    setPwConfirm("");
    setPwError("");
    setPasswordModalOpen(true);
  }

  async function submitPasswordChange() {
    if (!accessToken) {
      setPwError("Log in required.");
      return;
    }
    setPwSaving(true);
    setPwError("");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: pwCurrent,
          newPassword: pwNew,
          passwordConfirmation: pwConfirm,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        access_token?: string;
        refresh_token?: string;
      };
      if (!res.ok) {
        setPwError(data.message ?? "Could not change password.");
        return;
      }
      if (data.access_token && data.refresh_token) {
        applySessionFromAuthResponse({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      }
      setPasswordModalOpen(false);
      setStatus("Password updated. You are still signed in with your new credentials.");
    } catch {
      setPwError("Network error. Please try again.");
    } finally {
      setPwSaving(false);
    }
  }

  async function handleSave() {
    if (!accessToken) {
      setStatus("Log in required.");
      return;
    }
    try {
      setSaving(true);
      setStatus("");
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim() || undefined,
          ...(avatarUrl.trim() ? { avatarUrl: avatarUrl.trim() } : {}),
          favoriteTeamId: favoriteTeamId || undefined,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        setStatus(payload.error ?? "Failed to save profile.");
        return;
      }

      applyThemeToDocument(themeDraft);

      if (userId) {
        localStorage.setItem(
          `settings:${userId}`,
          JSON.stringify({ caption: caption.trim() })
        );
      }

      setStatus("Profile settings saved.");
    } catch {
      setStatus("Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl">
      <div className="relative overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface px-6 py-5 shadow-card">
        <div className="absolute inset-0 bg-gradient-glow opacity-40" />
        <div className="relative">
          <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
        </div>
      </div>

      <div className="mt-6">
        <div className="rounded-2xl border border-border-subtle bg-bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold">Profile Settings</h2>

          {loading ? (
            <p className="text-sm text-text-muted">Loading settings...</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-text-muted">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary-500"
                  placeholder="Enter username"
                />
              </div>

              {!isOAuthAccount ? (
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Password</label>
                  <div className="flex w-full items-stretch overflow-hidden rounded-lg border border-border-subtle bg-bg-elevated focus-within:border-primary-500">
                    <input
                      type="text"
                      readOnly
                      tabIndex={-1}
                      value="•••••••"
                      aria-label="Password (hidden)"
                      className="min-w-0 flex-1 cursor-default border-0 bg-transparent px-3 py-2 text-sm tracking-widest text-text-primary outline-none"
                    />
                    <button
                      type="button"
                      onClick={openPasswordModal}
                      className="shrink-0 border-l border-border-subtle bg-bg-elevated px-4 py-2 text-sm text-text-primary hover:bg-bg-surface"
                    >
                      Change password
                    </button>
                  </div>
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-xs text-text-muted">Profile picture</label>
                <div className="flex flex-wrap items-start gap-4">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    onDrop={(e) => void applyDroppedAvatar(e)}
                    onDragOver={onDragOver}
                    className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-border-subtle bg-bg-elevated"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarPreviewSrc}
                      alt="Avatar preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 hidden items-center justify-center bg-black/45 px-1 text-center text-[10px] leading-tight text-white group-hover:flex">
                      Drop or select
                    </div>
                  </button>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => void applyAvatarFile(e)}
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="inline-flex w-fit items-center justify-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm hover:bg-bg-surface"
                    >
                      <Camera size={15} />
                      Change avatar
                    </button>
                    <p className="text-xs text-text-muted">{AVATAR_LIMIT_MESSAGE}</p>
                    <button
                      type="button"
                      onClick={() => void handleRemoveAvatar()}
                      className="inline-flex w-fit rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500"
                    >
                      Remove avatar
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-text-muted">Favorite team</label>
                <select
                  value={favoriteTeamId}
                  onChange={(e) => setFavoriteTeamId(e.target.value)}
                  className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary-500"
                >
                  <option value="">Select a team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-text-muted">Caption</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="h-24 w-full resize-none rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary-500"
                  placeholder="Write a short bio/caption"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-text-muted">Theme</label>
                <select
                  value={themeDraft}
                  onChange={(e) => setThemeDraft(e.target.value as ThemeMode)}
                  className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
                <p className="mt-1 text-xs text-text-muted">
                  Theme updates when you click Save changes (saved for future visits).
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave()}
                  className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-400 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                {status ? <p className="mt-2 text-sm text-text-secondary">{status}</p> : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {passwordModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-password-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-card">
            <h3 id="change-password-title" className="text-lg font-semibold text-text-primary">
              Password
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              Change your password or recover your current one.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-text-primary">
                  Current password
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={pwCurrent}
                  onChange={(e) => setPwCurrent(e.target.value)}
                  className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary-500"
                />
                <p className="mt-1 text-xs text-text-muted">
                  You must provide your current password in order to change it.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-text-primary">
                  New password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                  className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-text-primary">
                  Password confirmation
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                  className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary-500"
                />
              </div>
            </div>

            {pwError ? <p className="mt-3 text-sm text-red-400">{pwError}</p> : null}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={pwSaving}
                onClick={() => void submitPasswordChange()}
                className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-400 disabled:opacity-60"
              >
                {pwSaving ? "Saving..." : "Save password"}
              </button>
              <Link
                href="/login"
                className="text-sm text-primary-400 hover:underline"
                onClick={() => setPasswordModalOpen(false)}
              >
                I forgot my password
              </Link>
              <button
                type="button"
                className="ml-auto text-sm text-text-muted hover:text-text-primary"
                onClick={() => setPasswordModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
