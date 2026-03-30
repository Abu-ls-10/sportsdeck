"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AppSidebar from "@/components/layout/AppSidebar";
import MobileTopbar from "@/components/layout/MobileTopbar";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, Upload } from "lucide-react";

type TeamOption = {
  id: string;
  name: string;
  shortName: string;
};

type MeResponse = {
  data: {
    id: string;
    username: string | null;
    avatarUrl: string | null;
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

export default function SettingsPage() {
  const { accessToken } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");

  const [userId, setUserId] = useState<string>("");
  const [username, setUsername] = useState("");
  const [favoriteTeamId, setFavoriteTeamId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [caption, setCaption] = useState("");

  const [teams, setTeams] = useState<TeamOption[]>([]);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const favoriteTeam = useMemo(
    () => teams.find((t) => t.id === favoriteTeamId) ?? null,
    [teams, favoriteTeamId]
  );

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
        setAvatarUrl(u.avatarUrl ?? "");
        setFavoriteTeamId(u.favoriteTeam?.id ?? "");

        const local = localStorage.getItem(`settings:${u.id}`);
        if (local) {
          const parsed = JSON.parse(local) as { caption?: string; bannerUrl?: string };
          setCaption(parsed.caption ?? "");
          setBannerUrl(parsed.bannerUrl ?? "");
        }
      } catch {
        setStatus("Failed loading settings.");
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [accessToken]);

  async function applyFile(
    e: React.ChangeEvent<HTMLInputElement>,
    target: "avatar" | "banner"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    if (target === "avatar") setAvatarUrl(dataUrl);
    else setBannerUrl(dataUrl);
    e.target.value = "";
  }

  async function applyDroppedFile(
    e: React.DragEvent<HTMLButtonElement>,
    target: "avatar" | "banner"
  ) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    if (target === "avatar") setAvatarUrl(dataUrl);
    else setBannerUrl(dataUrl);
  }

  function onDragOver(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
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
          avatarUrl: avatarUrl || undefined,
          favoriteTeamId: favoriteTeamId || undefined,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        setStatus(payload.error ?? "Failed to save profile.");
        return;
      }

      if (userId) {
        localStorage.setItem(
          `settings:${userId}`,
          JSON.stringify({ caption: caption.trim(), bannerUrl })
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
      <MobileTopbar onOpenSidebar={() => setMobileOpen(true)} />
      <AppSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className={`transition-all duration-300 pt-14 md:pt-0 ${collapsed ? "md:ml-[80px]" : "md:ml-[260px]"}`}>
        <main className="px-4 md:px-6 py-6">
          <section className="mx-auto max-w-5xl">
            <div
              className="relative h-52 rounded-2xl border border-border-subtle bg-black overflow-hidden"
              style={
                bannerUrl
                  ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : undefined
              }
            >
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                onDrop={(e) => void applyDroppedFile(e, "banner")}
                onDragOver={onDragOver}
                className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-black/60 px-3 py-2 text-xs text-white hover:bg-black/80"
              >
                <Upload size={14} />
                Change banner (drop or select)
              </button>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void applyFile(e, "banner")}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-xs text-text-secondary">Settings</p>
                <h1 className="text-2xl font-bold text-white">{username || "Your Profile"}</h1>
                <p className="text-sm text-text-secondary">
                  {favoriteTeam ? `${favoriteTeam.name} fan` : "No favorite team selected"}
                </p>
                {caption ? <p className="mt-1 text-sm text-white/90">{caption}</p> : null}
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
              <div className="rounded-2xl border border-border-subtle bg-bg-card p-5">
                <h2 className="mb-4 text-lg font-semibold">Profile Picture</h2>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  onDrop={(e) => void applyDroppedFile(e, "avatar")}
                  onDragOver={onDragOver}
                  className="group relative mx-auto block h-36 w-36 overflow-hidden rounded-full border border-border-subtle bg-bg-elevated"
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-text-muted">
                      {username ? username[0]?.toUpperCase() : "U"}
                    </div>
                  )}
                  <div className="absolute inset-0 hidden items-center justify-center bg-black/45 text-xs text-white group-hover:flex">
                    Drop or select image
                  </div>
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void applyFile(e, "avatar")}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm hover:bg-bg-surface"
                >
                  <Camera size={15} />
                  Change avatar
                </button>
              </div>

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
          </section>
        </main>
      </div>
    </div>
  );
}
