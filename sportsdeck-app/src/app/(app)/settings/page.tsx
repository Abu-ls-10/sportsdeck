"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import {
  DEFAULT_AVATAR_URL,
  MAX_AVATAR_DIMENSION,
  MAX_AVATAR_FILE_BYTES,
  MAX_AVATAR_PIXELS,
} from "@/lib/avatar";

/* ================= TYPES ================= */

type TeamOption = {
  id: string;
  name: string;
};

type ThemeMode = "light" | "dark";

type AvatarValidationResult =
  | { ok: true }
  | { ok: false; message: string };
  

/* ================= HELPERS ================= */

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
    return { ok: false, message: "File too large" };
  }
  try {
    const bitmap = await createImageBitmap(file);
    if (
      bitmap.width > MAX_AVATAR_DIMENSION ||
      bitmap.height > MAX_AVATAR_DIMENSION
    ) {
      return { ok: false, message: "Image too large" };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Invalid image" };
  }
}

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem("sportsdeck-theme");
  if (saved === "light" || saved === "dark") return saved;
  return "dark";
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
  localStorage.setItem("sportsdeck-theme", mode);
}

/* ================= COMPONENT ================= */

export default function SettingsPage() {
  const { accessToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [username, setUsername] = useState("");
  const [caption, setCaption] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [favoriteTeamId, setFavoriteTeamId] = useState("");
  const [themeDraft, setThemeDraft] = useState<ThemeMode>("dark");

  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [status, setStatus] = useState("");

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const avatarPreview = avatarUrl || DEFAULT_AVATAR_URL;

  /* ================= LOAD ================= */

  useEffect(() => {
    setThemeDraft(readStoredTheme());

    async function load() {
      try {
        const teamsRes = await fetch("/api/teams");
        const data = await teamsRes.json();
        setTeams(data.teams || []);
      } catch {}

      setLoading(false);
    }

    load();
  }, []);

  /* ================= HANDLERS ================= */

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const check = await validateAvatarFile(file);
    if (!check.ok) {
      setStatus(check.message);
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    setAvatarUrl(dataUrl);
  }

  async function handleSave() {
    setSaving(true);
    setStatus("");

    try {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          avatarUrl,
          favoriteTeamId,
        }),
      });

      applyTheme(themeDraft);

      setStatus("Saved successfully");
    } catch {
      setStatus("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  /* ================= UI ================= */

  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6">

      {/* HEADER */}
      <div className="rounded-3xl border border-border-subtle bg-bg-surface p-6 shadow-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow opacity-40" />

        <div className="relative flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              Settings
            </h1>
            <p className="text-sm text-text-muted">
              Manage your account and preferences
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-gradient-primary px-5 py-2 text-primary shadow-glow hover:scale-[1.02] transition"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">

        {/* LEFT: PROFILE */}
        <div className="rounded-3xl border border-border-subtle bg-bg-surface p-6 shadow-card">

          <div className="flex flex-col items-center text-center">

            <div
              onClick={() => avatarInputRef.current?.click()}
              className="group relative h-28 w-28 rounded-full overflow-hidden border border-border-subtle cursor-pointer"
            >
              <img src={avatarPreview} className="h-full w-full object-cover" />

              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <Camera size={18} className="text-primary" />
              </div>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-text-primary">
              {username || "Your Name"}
            </h3>

            <p className="text-sm text-text-muted">
              {caption || "Add a bio"}
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">

          {/* PROFILE */}
          <div className="card">
            <h2 className="section-title">Profile</h2>

            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              placeholder="Username"
            />

            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="input h-24"
              placeholder="Caption"
            />

            <select
              value={favoriteTeamId}
              onChange={(e) => setFavoriteTeamId(e.target.value)}
              className="input"
            >
              <option value="">Select team</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* AVATAR */}
          <div className="card">
            <h2 className="section-title">Avatar</h2>

            <input
              ref={avatarInputRef}
              type="file"
              className="hidden"
              onChange={handleAvatar}
            />

            <button
              onClick={() => avatarInputRef.current?.click()}
              className="btn"
            >
              Upload Image
            </button>
          </div>

          {/* THEME */}
          <div className="card">
            <h2 className="section-title">Theme</h2>

            <div className="flex gap-3">
              {["light", "dark"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setThemeDraft(mode as ThemeMode)}
                  className={`flex-1 rounded-xl px-4 py-2 transition ${
                    themeDraft === mode
                      ? "bg-gradient-primary text-primary"
                      : "bg-bg-elevated text-text-secondary"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {status && (
            <p className="text-sm text-text-secondary">{status}</p>
          )}
        </div>
      </div>

      {/* STYLES */}
      <style jsx>{`
        .card {
          @apply rounded-3xl border border-border-subtle bg-bg-surface p-6 shadow-card space-y-4;
        }

        .section-title {
          @apply text-xs uppercase text-text-muted tracking-wide;
        }

        .input {
          @apply w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary-500;
        }

        .btn {
          @apply rounded-xl border border-border-subtle px-4 py-2 text-sm hover:bg-bg-surface;
        }
      `}</style>
    </section>
  );
}