"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sparkles,
  MessageSquare,
  Flame,
  TrendingUp,
  Clock3,
  Users,
  Hash,
} from "lucide-react";

import ThreadsFilterBar, {
  ThreadFilters,
} from "@/components/threads/ThreadsFilterBar";
import ThreadCard from "@/components/threads/ThreadCard";
import StartDiscussionCard from "@/components/threads/StartDiscussionCard";

type Thread = {
  id: string;
  title: string;
  createdAt: string;
  author: {
    username: string;
  };
  teamId?: string | null;
  matchId?: string | null;
  tags: {
    tag: { name: string };
  }[];
  _count: {
    posts: number;
  };
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function CommunityHero({
  total,
  replies,
}: {
  total: number;
  replies: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border-subtle bg-bg-surface px-6 py-7 shadow-card">
      <div className="absolute inset-0 bg-gradient-glow opacity-90" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-300">
            <Sparkles className="h-3.5 w-3.5" />
            Community
          </div>

          <h1 className="text-3xl font-semibold text-primary">
            Explore discussions
          </h1>

          <p className="mt-2 max-w-xl text-sm text-text-secondary">
            Discover threads, follow live conversations, and connect with fans
            across SportsDeck.
          </p>

          <div className="mt-5 flex gap-3">
            <StatCard label="Threads" value={total} />
            <StatCard label="Replies" value={replies} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-[360px]">
          <Feature icon={MessageSquare} label="Discussions" />
          <Feature icon={Flame} label="Trending" />
          <Feature icon={Clock3} label="Live" />
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-white/[0.04] px-4 py-3">
      <p className="text-xs uppercase text-text-muted">{label}</p>
      <p className="text-lg font-semibold text-primary">{value}</p>
    </div>
  );
}

function Feature({
  icon: Icon,
  label,
}: {
  icon: any;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-white/[0.04] p-4 text-center">
      <Icon className="h-4 w-4 text-primary-300 mx-auto" />
      <p className="mt-2 text-sm text-primary font-medium">{label}</p>
    </div>
  );
}

function ThreadsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-border-subtle bg-bg-card p-5"
        >
          <div className="h-5 w-2/3 bg-white/10 rounded" />
          <div className="mt-3 h-4 w-1/2 bg-white/5 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();

  const [filters, setFilters] = useState<ThreadFilters>({
    search: "",
    team: "all",
    match: "all",
    sort: "recent",
    tag: "all",
  });

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (filters.search) params.append("q", filters.search);
      if (filters.team !== "all") params.append("teamId", filters.team);
      if (filters.match !== "all") params.append("matchId", filters.match);
      if (filters.tag !== "all") params.append("tag", filters.tag);
      if (filters.sort) params.append("sort", filters.sort);

      const res = await fetch(`/api/threads?${params.toString()}`);

      if (!res.ok) throw new Error("Failed to fetch threads");

      const data = await res.json();
      setThreads(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // derived stats
  const totalReplies = useMemo(
    () => threads.reduce((sum, t) => sum + (t._count?.posts ?? 0), 0),
    [threads]
  );

  const trendingTags = useMemo(() => {
    const map: Record<string, number> = {};

    threads.forEach((t) => {
      t.tags?.forEach((tag) => {
        map[tag.tag.name] = (map[tag.tag.name] || 0) + 1;
      });
    });

    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [threads]);

  const topUsers = useMemo(() => {
    const map: Record<string, number> = {};

    threads.forEach((t) => {
      const u = t.author?.username ?? "Unknown";
      map[u] = (map[u] || 0) + 1;
    });

    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [threads]);

  return (
    <div className="px-4 py-5 md:px-6 lg:px-8">
      <div className="max-w-[1280px] mx-auto">

        <CommunityHero total={threads.length} replies={totalReplies} />

        <div className="mt-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">

          {/* LEFT */}
          <section className="space-y-4">

            <ThreadsFilterBar onChange={setFilters} />

            <StartDiscussionCard
              onSuccess={fetchThreads}
              isBanned={Boolean(user?.isBanned)}
            />

            {loading && <ThreadsSkeleton />}

            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-sm text-red-300 font-medium">
                  Failed to load threads
                </p>
                <p className="text-xs text-red-200 mt-1">{error}</p>
              </div>
            )}

            {!loading && !error && threads.length === 0 && (
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-8 text-center">
                <p className="text-primary font-medium">No discussions found</p>
                <p className="text-text-secondary text-sm mt-2">
                  Try different filters or start a thread.
                </p>
              </div>
            )}

            {!loading && !error && threads.length > 0 && (
              <div className="space-y-4">
                {threads.map((thread) => (
                  <ThreadCard
                    key={thread.id}
                    id={thread.id}
                    title={thread.title}
                    excerpt=""
                    tags={thread.tags?.map((t) => t.tag.name) ?? []}
                    replies={thread._count?.posts ?? 0}
                    team={thread.teamId || "none"}
                    match={thread.matchId || "none"}
                    meta={`Posted ${timeAgo(thread.createdAt)} by ${
                      thread.author?.username ?? "Unknown"
                    }`}
                  />
                ))}
              </div>
            )}
          </section>

          {/* RIGHT */}
          <aside className="space-y-4 xl:sticky xl:top-6">

            {/* Trending */}
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary-300" />
                <p className="text-sm font-semibold text-primary">
                  Trending Tags
                </p>
              </div>

              {trendingTags.length === 0 ? (
                <p className="text-text-secondary text-sm">
                  No trending topics yet
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {trendingTags.map(([tag]) => (
                    <button
                      key={tag}
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, tag }))
                      }
                      className="px-3 py-1 rounded-full text-xs bg-white/[0.05] border border-border-subtle text-text-secondary hover:bg-accent-500/10"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Top Users */}
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-accent-300" />
                <p className="text-sm font-semibold text-primary">
                  Top Contributors
                </p>
              </div>

              {topUsers.map(([u, count], i) => (
                <div
                  key={u}
                  className="flex justify-between text-sm text-text-secondary py-1"
                >
                  <span>
                    {i + 1}. {u}
                  </span>
                  <span>{count}</span>
                </div>
              ))}
            </div>

            {/* Activity */}
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-4 w-4 text-brand-300" />
                <p className="text-sm font-semibold text-primary">
                  Community Activity
                </p>
              </div>

              <p className="text-sm text-text-secondary">
                Discussions update in real-time. Jump into active threads.
              </p>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}