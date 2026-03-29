"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  UserPlus,
  Check,
  Loader2,
  MessageSquare,
  TrendingUp,
  Pencil,
  Share2,
} from "lucide-react";

/* =========================
   Types
========================= */

type User = {
  id: string;
  username: string;
  avatarUrl?: string;
  bio?: string;

  favoriteTeam?: {
    name: string;
  } | null;

  _count?: {
    followers: number;
    following: number;
    threads: number;
    posts: number;
  };
};

type Thread = {
  id: string;
  title: string;
  createdAt: string;
  _count?: { posts?: number };
};

type ActivityPoint = {
  date: string;
  count: number;
};

/* =========================
   Helpers
========================= */

function cx(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getInitials(name?: string) {
  if (!name) return "U";
  const parts = name.split(/[._\s]/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/* =========================
   Page
========================= */

export default function UserProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activity, setActivity] = useState<ActivityPoint[]>([]);

  const [isMe, setIsMe] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  /* =========================
     Load Data
  ========================= */

  useEffect(() => {
    async function load() {
      setLoading(true);

      const [profileRes, threadsRes, activityRes, meRes, followRes] =
        await Promise.all([
          fetch(`/api/users/${id}`),
          fetch(`/api/threads?authorId=${id}&limit=5`),
          fetch(`/api/users/${id}/activity`),
          fetch(`/api/users/me`),
          fetch(`/api/follow/${id}`),
        ]);

      const profile = await profileRes.json();
      const threadData = await threadsRes.json();
      const activityData = await activityRes.json();
      const me = await meRes.json();
      const followData = await followRes.json().catch(() => null);

      setUser(profile);
      setThreads(threadData?.threads || []);
      setActivity(activityData || []);

      if (me?.id === id) setIsMe(true);
      if (followData?.isFollowing) setIsFollowing(true);

      setLoading(false);
    }

    load();
  }, [id]);

  /* =========================
     Follow Logic
  ========================= */

  const handleFollow = async () => {
    if (!user) return;

    const prev = isFollowing;
    setIsFollowing(!prev);
    setFollowLoading(true);

    const res = await fetch(`/api/follow/${user.id}`, {
      method: prev ? "DELETE" : "POST",
    });

    if (!res.ok) {
      setIsFollowing(prev);
    }

    setFollowLoading(false);
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main text-text-primary">
      <main className="px-6 py-6">
        <div className="max-w-[1200px] mx-auto space-y-6">

          {/* ================= HEADER ================= */}

          <div className="rounded-3xl border border-border-subtle bg-bg-surface p-6 flex justify-between items-center">

            <div className="flex items-center gap-4">

              {/* Avatar */}
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  className="h-20 w-20 rounded-2xl object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-gradient-primary flex items-center justify-center text-white text-lg font-semibold">
                  {getInitials(user.username)}
                </div>
              )}

              <div>
                <h1 className="text-xl font-semibold">{user.username}</h1>
                <p className="text-sm text-text-muted">
                  @{user.username.toLowerCase()}
                </p>
                <p className="text-sm text-text-secondary mt-1 max-w-md">
                  {user.bio || "No bio provided"}
                </p>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3">

              {isMe ? (
                <button className="px-4 py-2 rounded-xl bg-white/10 border border-border-subtle flex items-center gap-2">
                  <Pencil size={16} />
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={cx(
                    "px-5 py-2 rounded-xl flex items-center gap-2 text-sm",
                    isFollowing
                      ? "bg-white/10 border border-border-subtle"
                      : "bg-primary-500 text-white"
                  )}
                >
                  {followLoading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : isFollowing ? (
                    <Check size={16} />
                  ) : (
                    <UserPlus size={16} />
                  )}
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}

              <button className="px-3 py-2 rounded-xl bg-white/10 border border-border-subtle">
                <Share2 size={16} />
              </button>

            </div>
          </div>

          {/* ================= STATS ================= */}

          <div className="grid grid-cols-4 gap-4">
            <Stat value={user._count?.followers} label="Followers" />
            <Stat value={user._count?.following} label="Following" />
            <Stat value={user._count?.threads} label="Threads" />
            <Stat value={4800} label="Reputation" />
          </div>

          {/* ================= MAIN ================= */}

          <div className="grid grid-cols-[1fr_1.2fr] gap-6">

            {/* LEFT */}
            <div className="space-y-4">

              {/* Activity */}
              <Card title="Engagement Overview">
                <div className="flex items-end gap-2 h-28">
                  {activity.map((a, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary-500/60 rounded"
                      style={{ height: `${a.count * 10}px` }}
                    />
                  ))}
                </div>
              </Card>

              {/* Settings */}
              {isMe && (
                <Card title="Profile Settings">
                  <input
                    className="w-full bg-white/5 border border-border-subtle rounded px-3 py-2 text-sm"
                    defaultValue={user.username}
                  />
                  <button className="mt-3 w-full bg-primary-500 rounded py-2 text-sm">
                    Save Changes
                  </button>
                </Card>
              )}

            </div>

            {/* RIGHT */}
            <div className="space-y-4">

              <Card title="Recent Threads">
                {threads.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 border border-border-subtle rounded-xl hover:bg-white/5 transition"
                  >
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-text-muted mt-1">
                      {timeAgo(t.createdAt)} • {t._count?.posts ?? 0} replies
                    </p>
                  </div>
                ))}
              </Card>

            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

/* =========================
   Components
========================= */

function Card({ title, children }: any) {
  return (
    <div className="rounded-2xl border border-border-subtle p-5 bg-bg-surface">
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Stat({ value, label }: any) {
  return (
    <div className="text-center border border-border-subtle rounded-xl p-4">
      <p className="text-lg font-semibold">{value ?? 0}</p>
      <p className="text-xs text-text-muted uppercase">{label}</p>
    </div>
  );
}