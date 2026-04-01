"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Check,
  ChevronRight,
  KeyRound,
  Monitor,
  Moon,
  Save,
  Shield,
  Sparkles,
  Sun,
  Upload,
  UserCircle2,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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

type AvatarValidationResult =
  | { ok: true }
  | { ok: false; message: string };

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function validateAvatarFile(file: File): Promise<AvatarValidationResult> {
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
    return {
      ok: false,
      message: "Could not read this image. Try another file.",
    };
  }
}

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem("sportsdeck-theme");
  if (saved === "light" || saved === "dark") return saved;
  return "dark";
}

function applyThemeToDocument(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  localStorage.setItem("sportsdeck-theme", mode);
}

function getInitials(name?: string | null) {
  if (!name?.trim()) return "SD";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function formatProvider(value?: string | null) {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) return "Email";
  if (normalized === "google") return "Google";
  if (normalized === "github") return "GitHub";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

const AVATAR_LIMIT_MESSAGE = `Up to ${MAX_AVATAR_DIMENSION}×${MAX_AVATAR_DIMENSION} pixels (${MAX_AVATAR_PIXELS.toLocaleString()} pixels max) and ${MAX_AVATAR_FILE_BYTES / (1024 * 1024)} MB per file.`;

function GlassPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "rounded-3xl border border-border-subtle bg-bg-surface/90 shadow-card backdrop-blur-xs",
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border-subtle bg-white/[0.04] text-text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
          {eyebrow}
        </div>
        <h2 className="text-lg font-semibold text-text-primary md:text-xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-text-secondary">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function FieldShell({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-2 text-xs leading-5 text-text-muted">{hint}</p> : null}
    </div>
  );
}

function StatPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-white/[0.03] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function ThemeButton({
  active,
  icon,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "group relative overflow-hidden rounded-2xl border p-4 text-left transition duration-200",
        active
          ? "border-primary-500/40 bg-primary-500/10 shadow-glow"
          : "border-border-subtle bg-white/[0.03] hover:-translate-y-0.5 hover:border-primary-500/25 hover:bg-white/[0.05]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border-subtle bg-white/[0.04] text-text-primary">
          {icon}
        </div>

        <div
          className={cx(
            "flex h-6 w-6 items-center justify-center rounded-full border text-[11px]",
            active
              ? "border-primary-400 bg-primary-500 text-white"
              : "border-border-subtle bg-white/[0.04] text-transparent"
          )}
        >
          <Check className="h-3.5 w-3.5" />
        </div>
      </div>

      <p className="mt-4 text-sm font-semibold text-text-primary">{title}</p>
      <p className="mt-1 text-xs leading-5 text-text-secondary">{subtitle}</p>
    </button>
  );
}

function SettingsInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className={cx(
        "w-full rounded-2xl border border-border-subtle bg-bg-elevated px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-dim focus:border-primary-500 focus:bg-bg-card",
        props.className
      )}
    />
  );
}

function SettingsTextarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      className={cx(
        "w-full rounded-2xl border border-border-subtle bg-bg-elevated px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-dim focus:border-primary-500 focus:bg-bg-card",
        props.className
      )}
    />
  );
}

function SettingsSelect(
  props: React.SelectHTMLAttributes<HTMLSelectElement>
) {
  return (
    <select
      {...props}
      className={cx(
        "w-full rounded-2xl border border-border-subtle bg-bg-elevated px-4 py-3 text-sm text-text-primary outline-none transition focus:border-primary-500 focus:bg-bg-card",
        props.className
      )}
    />
  );
}

export default function SettingsPage() {
  const { accessToken, applySessionFromAuthResponse } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [authProvider, setAuthProvider] = useState<string | null>(null);
  const [favoriteTeamId, setFavoriteTeamId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [themeDraft, setThemeDraft] = useState<ThemeMode>("dark");

  const [teams, setTeams] = useState<TeamOption[]>([]);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");

  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const isOAuthAccount =
    authProvider?.toLowerCase() === "google" ||
    authProvider?.toLowerCase() === "github";

  const avatarPreviewSrc =
    avatarUrl.trim() && avatarUrl !== DEFAULT_AVATAR_URL
      ? avatarUrl
      : DEFAULT_AVATAR_URL;

  const favoriteTeamName = useMemo(() => {
    return teams.find((team) => team.id === favoriteTeamId)?.name ?? "Not set";
  }, [teams, favoriteTeamId]);

  const hasChanges = useMemo(() => {
    return true;
  }, [username, avatarUrl, favoriteTeamId, caption, themeDraft]);

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
        setUsername(u.username ?? "");
        setAuthProvider(u.authProvider ?? null);
        setAvatarUrl(u.avatarUrl?.trim() ?? "");
        setFavoriteTeamId(u.favoriteTeam?.id ?? "");

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

        setCaption(loadedCaption);
      } catch {
        setStatus("Failed loading settings.");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [accessToken]);

  async function applyAvatarFromFile(file: File) {
    const check = await validateAvatarFile(file);

    if (!check.ok) {
      setStatus(check.message);
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    setAvatarUrl(dataUrl);
    setStatus("");
  }

  async function applyAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await applyAvatarFromFile(file);
    e.target.value = "";
  }

  async function applyDroppedAvatar(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsDraggingAvatar(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    await applyAvatarFromFile(file);
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

      setAvatarUrl("");
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
    <div className="min-h-screen bg-bg-main text-text-primary">
      <section className="mx-auto max-w-[1440px] px-4 py-5 md:px-6 md:py-6 lg:px-8">
        <div className="space-y-6">
          <section className="relative overflow-hidden rounded-[28px] border border-border-subtle bg-bg-surface shadow-card">
            <div className="absolute inset-0 bg-gradient-glow opacity-90" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.12),transparent_30%)]" />
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary-500/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />

            <div className="relative grid gap-6 px-5 py-6 md:px-7 md:py-7 xl:grid-cols-[minmax(0,1.2fr)_340px] xl:items-stretch">
              <div className="flex flex-col justify-between">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-400/20 bg-accent-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    Account Control Center
                  </div>

                  <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-text-primary md:text-4xl xl:text-[2.55rem] xl:leading-[1.05]">
                    Tune your SportsDeck profile, identity, and experience.
                  </h1>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary md:text-base">
                    Personalize how your profile looks, keep your security settings clean,
                    and choose the visual experience you want every time you come back.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={saving || loading}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-white shadow-glow transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? "Saving changes..." : "Save changes"}
                    </button>

                    <Link
                      href={userId ? `/users/${userId}` : "#"}
                      className="inline-flex items-center gap-2 rounded-2xl border border-border-subtle bg-white/[0.04] px-5 py-3 text-sm font-medium text-text-primary transition hover:bg-white/[0.07]"
                    >
                      View profile
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <StatPill label="Theme" value={themeDraft === "dark" ? "Dark mode" : "Light mode"} />
                  <StatPill label="Provider" value={formatProvider(authProvider)} />
                  <StatPill label="Favorite team" value={favoriteTeamName} />
                </div>
              </div>

              <div className="rounded-3xl border border-border-subtle bg-white/[0.04] p-4 shadow-inner">
                <div className="rounded-[26px] border border-border-subtle bg-bg-card/80 p-5">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarPreviewSrc}
                        alt="Profile avatar preview"
                        className="h-20 w-20 rounded-3xl border border-border-subtle object-cover shadow-soft"
                      />
                      <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-2xl border border-border-subtle bg-gradient-primary text-white shadow-glow">
                        <UserCircle2 className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-semibold text-text-primary">
                        {username.trim() || "SportsDeck User"}
                      </p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {caption.trim() || "No bio yet. Add a caption to give your profile more personality."}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-border-subtle bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-text-secondary">
                          {favoriteTeamName}
                        </span>
                        <span className="rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-[11px] font-medium text-primary-300">
                          {themeDraft === "dark" ? "Dark default" : "Light selected"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-border-subtle bg-white/[0.03] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                      Live preview
                    </p>
                    <p className="mt-2 text-sm leading-6 text-text-secondary">
                      This card reflects your current edits before you save them, so you can see your
                      profile direction as you shape it.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {status ? (
            <div
              className={cx(
                "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm",
                status.toLowerCase().includes("saved") || status.toLowerCase().includes("updated") || status.toLowerCase().includes("reset")
                  ? "border-primary-500/20 bg-primary-500/10 text-primary-300"
                  : "border-brand-500/20 bg-brand-500/10 text-brand-300"
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-current/20 bg-white/10">
                {status.toLowerCase().includes("saved") ||
                status.toLowerCase().includes("updated") ||
                status.toLowerCase().includes("reset") ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
              </div>
              <span>{status}</span>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="space-y-6">
              <GlassPanel className="p-5 md:p-6">
                <SectionHeader
                  icon={<UserCircle2 className="h-5 w-5 text-primary-300" />}
                  eyebrow="Profile"
                  title="Identity and public presence"
                  description="Keep your profile sharp, recognizable, and aligned with how you want to show up across SportsDeck."
                />

                {loading ? (
                  <div className="mt-6 grid gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="animate-pulse rounded-2xl border border-border-subtle bg-bg-card p-4"
                      >
                        <div className="h-4 w-28 rounded bg-white/10" />
                        <div className="mt-3 h-11 w-full rounded-2xl bg-white/10" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 grid gap-5">
                    <FieldShell label="Username" hint="This is how your name appears on your profile and around the app.">
                      <SettingsInput
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        maxLength={40}
                      />
                    </FieldShell>

                    <FieldShell label="Caption" hint="A short bio or one-liner that adds personality to your profile preview.">
                      <SettingsTextarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="min-h-[112px] resize-none"
                        placeholder="Write a short bio or profile caption"
                        maxLength={180}
                      />
                      <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
                        <span>Keep it short and punchy.</span>
                        <span>{caption.trim().length}/180</span>
                      </div>
                    </FieldShell>

                    <FieldShell label="Favorite team" hint="Used to personalize your home experience and make your feed feel more relevant.">
                      <SettingsSelect
                        value={favoriteTeamId}
                        onChange={(e) => setFavoriteTeamId(e.target.value)}
                      >
                        <option value="">Select a team</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </SettingsSelect>
                    </FieldShell>
                  </div>
                )}
              </GlassPanel>

              <GlassPanel className="p-5 md:p-6">
                <SectionHeader
                  icon={<Camera className="h-5 w-5 text-accent-300" />}
                  eyebrow="Avatar"
                  title="Profile image"
                  description="Use a clean profile image that looks crisp in threads, replies, and profile previews."
                />

                <div className="mt-6 grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
                  <div className="flex justify-center lg:justify-start">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      onDrop={(e) => void applyDroppedAvatar(e)}
                      onDragOver={onDragOver}
                      onDragEnter={() => setIsDraggingAvatar(true)}
                      onDragLeave={() => setIsDraggingAvatar(false)}
                      className={cx(
                        "group relative h-36 w-36 overflow-hidden rounded-[32px] border transition duration-200",
                        isDraggingAvatar
                          ? "border-primary-500 bg-primary-500/10 shadow-glow"
                          : "border-border-subtle bg-bg-elevated hover:-translate-y-0.5 hover:border-primary-500/25"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarPreviewSrc}
                        alt="Avatar preview"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
                        <div className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm">
                          Drop or select image
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="min-w-0">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => void applyAvatarFile(e)}
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border-subtle bg-white/[0.04] px-4 py-3 text-sm font-medium text-text-primary transition hover:bg-white/[0.07]"
                      >
                        <Upload className="h-4 w-4" />
                        Upload new image
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleRemoveAvatar()}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm font-medium text-brand-300 transition hover:bg-brand-500/15"
                      >
                        <X className="h-4 w-4" />
                        Reset to default
                      </button>
                    </div>

                    <div className="mt-4 rounded-2xl border border-border-subtle bg-white/[0.03] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                        Upload guidance
                      </p>
                      <p className="mt-2 text-sm leading-6 text-text-secondary">
                        Drag and drop an image directly onto the avatar card, or upload from your device.
                      </p>
                      <p className="mt-2 text-xs leading-5 text-text-muted">
                        {AVATAR_LIMIT_MESSAGE}
                      </p>
                    </div>
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel className="p-5 md:p-6">
                <SectionHeader
                  icon={<Monitor className="h-5 w-5 text-brand-300" />}
                  eyebrow="Appearance"
                  title="Theme preference"
                  description="Dark is the default SportsDeck experience, but your saved preference is always respected."
                />

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <ThemeButton
                    active={themeDraft === "dark"}
                    icon={<Moon className="h-5 w-5 text-primary-300" />}
                    title="Dark mode"
                    subtitle="Best match for the SportsDeck visual language, glow system, and overall feel."
                    onClick={() => setThemeDraft("dark")}
                  />

                  <ThemeButton
                    active={themeDraft === "light"}
                    icon={<Sun className="h-5 w-5 text-brand-300" />}
                    title="Light mode"
                    subtitle="A brighter workspace when you want a cleaner, lighter reading experience."
                    onClick={() => setThemeDraft("light")}
                  />
                </div>

                <div className="mt-5 rounded-2xl border border-border-subtle bg-white/[0.03] px-4 py-3">
                  <p className="text-sm text-text-secondary">
                    Theme changes apply when you save, and will persist for future visits.
                  </p>
                </div>
              </GlassPanel>

              {!isOAuthAccount ? (
                <GlassPanel className="p-5 md:p-6">
                  <SectionHeader
                    icon={<KeyRound className="h-5 w-5 text-accent-300" />}
                    eyebrow="Security"
                    title="Password and sign-in"
                    description="Keep your account secure and update your password whenever you need to."
                  />

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={openPasswordModal}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
                    >
                      <KeyRound className="h-4 w-4" />
                      Change password
                    </button>

                    <p className="text-sm text-text-secondary">
                      You’ll stay signed in after a successful update.
                    </p>
                  </div>
                </GlassPanel>
              ) : null}
            </section>

            <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
              <GlassPanel className="overflow-hidden">
                <div className="relative border-b border-border-subtle p-5">
                  <div className="absolute inset-0 bg-gradient-glow opacity-40" />
                  <div className="relative">
                    <div className="inline-flex items-center gap-2 rounded-full border border-accent-400/20 bg-accent-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-300">
                      <Sparkles className="h-3.5 w-3.5" />
                      Profile Summary
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarPreviewSrc}
                      alt="Sidebar avatar"
                      className="h-16 w-16 rounded-3xl border border-border-subtle object-cover shadow-soft"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-text-primary">
                        {username.trim() || "SportsDeck User"}
                      </p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {caption.trim() || "Add a short caption to make your profile feel more complete."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <StatPill label="Favorite team" value={favoriteTeamName} />
                    <StatPill label="Sign in method" value={formatProvider(authProvider)} />
                    <StatPill label="Theme" value={themeDraft === "dark" ? "Dark mode" : "Light mode"} />
                  </div>

                  <Link
                    href={userId ? `/users/${userId}` : "#"}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border-subtle bg-white/[0.04] px-4 py-3 text-sm font-medium text-text-primary transition hover:bg-white/[0.07]"
                  >
                    Open public profile
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </GlassPanel>

              <GlassPanel className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border-subtle bg-white/[0.04] text-text-primary">
                    <Shield className="h-4 w-4 text-brand-300" />
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary">Quick notes</h3>
                </div>

                <div className="space-y-3 text-sm text-text-secondary">
                  <div className="rounded-2xl border border-border-subtle bg-white/[0.03] p-4">
                    <p className="font-medium text-text-primary">Default theme behavior</p>
                    <p className="mt-1 leading-6">
                      New users start in dark mode. If someone explicitly saved light mode, that saved preference should remain respected.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border-subtle bg-white/[0.03] p-4">
                    <p className="font-medium text-text-primary">Avatar fallback</p>
                    <p className="mt-1 leading-6">
                      If no custom avatar is uploaded, the app should show your branded default profile image instead of a generic placeholder.
                    </p>
                  </div>
                </div>
              </GlassPanel>

              <div className="rounded-2xl border border-border-subtle bg-white/[0.03] p-4">
                <button
                  type="button"
                  disabled={saving || loading || !hasChanges}
                  onClick={() => void handleSave()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-white shadow-glow transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving changes..." : "Save all changes"}
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {passwordModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-password-title"
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-border-subtle bg-bg-card shadow-card">
            <div className="absolute inset-0 bg-gradient-glow opacity-50" />
            <div className="relative p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-accent-400/20 bg-accent-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-300">
                    <KeyRound className="h-3.5 w-3.5" />
                    Security
                  </div>
                  <h3 id="change-password-title" className="text-xl font-semibold text-text-primary">
                    Change password
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-text-secondary">
                    Update your password and keep your account secure.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="rounded-2xl border border-border-subtle bg-white/[0.03] p-2 text-text-secondary transition hover:bg-white/[0.06] hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <FieldShell
                  label="Current password"
                  hint="You must provide your current password in order to change it."
                >
                  <SettingsInput
                    type="password"
                    autoComplete="current-password"
                    value={pwCurrent}
                    onChange={(e) => setPwCurrent(e.target.value)}
                    placeholder="Enter current password"
                  />
                </FieldShell>

                <FieldShell label="New password">
                  <SettingsInput
                    type="password"
                    autoComplete="new-password"
                    value={pwNew}
                    onChange={(e) => setPwNew(e.target.value)}
                    placeholder="Enter new password"
                  />
                </FieldShell>

                <FieldShell label="Confirm new password">
                  <SettingsInput
                    type="password"
                    autoComplete="new-password"
                    value={pwConfirm}
                    onChange={(e) => setPwConfirm(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </FieldShell>
              </div>

              {pwError ? (
                <div className="mt-4 rounded-2xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm text-brand-300">
                  {pwError}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={pwSaving}
                  onClick={() => void submitPasswordChange()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {pwSaving ? "Saving..." : "Save password"}
                </button>

                <Link
                  href="/login"
                  className="text-sm font-medium text-primary-300 transition hover:text-primary-200 hover:underline"
                  onClick={() => setPasswordModalOpen(false)}
                >
                  I forgot my password
                </Link>

                <button
                  type="button"
                  className="ml-auto text-sm text-text-muted transition hover:text-text-primary"
                  onClick={() => setPasswordModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}