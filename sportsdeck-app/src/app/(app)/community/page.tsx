"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Sparkles,
  MessageSquare,
  Flame,
  TrendingUp,
  Clock3,
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
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function CommunityHero({
  total,
}: {
  total: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border-subtle bg-bg-surface px-6 py-6 shadow-card">
      <div className="absolute inset-0 bg-gradient-glow opacity-90" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-300">
            <Sparkles className="h-3.5 w-3.5" />
            Community
          </div>

          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            Explore discussions
          </h1>

          <p className="mt-2 text-sm text-text-secondary max-w-xl">
            Dive into fan conversations, match threads, and trending topics across SportsDeck.
          </p>

          <div className="mt-4 flex gap-3">
            <div className="rounded-2xl border border-border-subtle bg-white/[0.03] px-4 py-3">
              <p className="text-xs text-text-muted uppercase">Threads</p>
              <p className="text-lg font-semibold text-white">{total}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-[360px]">
          <div className="rounded-2xl border border-border-subtle bg-white/[0.04] p-4">
            <MessageSquare className="h-4 w-4 text-primary-300" />
            <p className="mt-2 text-sm text-white font-medium">Discussions</p>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-white/[0.04] p-4">
            <Flame className="h-4 w-4 text-brand-300" />
            <p className="mt-2 text-sm text-white font-medium">Trending</p>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-white/[0.04] p-4">
            <Clock3 className="h-4 w-4 text-accent-300" />
            <p className="mt-2 text-sm text-white font-medium">Live updates</p>
          </div>
        </div>
      </div>
    </section>
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
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-16 bg-white/10 rounded" />
            <div className="h-6 w-12 bg-white/10 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CommunityPage() {
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
      setError(err.message || "Failed to load threads");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const trendingTags = useMemo(() => {
    const tagMap: Record<string, number> = {};

    threads.forEach((t) => {
      t.tags?.forEach((tag) => {
        tagMap[tag.tag.name] = (tagMap[tag.tag.name] || 0) + 1;
      });
    });

    return Object.entries(tagMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [threads]);

  return (
    <div className="px-4 py-5 md:px-6 lg:px-8">
      <div className="max-w-[1280px] mx-auto">

        <CommunityHero total={threads.length} />

        <div className="mt-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">

          {/* LEFT */}
          <section className="space-y-4">

            <ThreadsFilterBar onChange={setFilters} />

            <StartDiscussionCard onSuccess={fetchThreads} />

            {loading && <ThreadsSkeleton />}

            {error && (
              <div className="text-red-400 text-sm">{error}</div>
            )}

            {!loading && !error && threads.length === 0 && (
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-8 text-center">
                <p className="text-white font-medium">No discussions found</p>
                <p className="text-text-secondary text-sm mt-2">
                  Try adjusting filters or start a new thread.
                </p>
              </div>
            )}

            {!loading && !error && (
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

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-4 xl:sticky xl:top-6">

            {/* Trending */}
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary-300" />
                <p className="text-sm font-semibold text-white">Trending Tags</p>
              </div>

              {trendingTags.length === 0 ? (
                <p className="text-text-secondary text-sm">
                  No trending topics yet
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {trendingTags.map(([tag]) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs bg-white/[0.05] border border-border-subtle text-text-secondary"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Hint */}
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-4 w-4 text-brand-300" />
                <p className="text-sm font-semibold text-white">
                  Community Activity
                </p>
              </div>

              <p className="text-sm text-text-secondary">
                Discussions update in real-time. Jump into active threads to stay engaged.
              </p>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}