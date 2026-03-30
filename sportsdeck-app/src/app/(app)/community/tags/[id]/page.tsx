"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import {
  ArrowLeft,
  Hash,
  Flame,
  MessageSquare,
  TrendingUp,
  Sparkles,
} from "lucide-react";

type Thread = {
  id: string;
  title: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
  };
  team?: {
    id: string;
    name: string;
  };
  _count: {
    posts: number;
  };
};

export default function TagPage() {
  const { id } = useParams();
  const router = useRouter();

  const [tag, setTag] = useState<any>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =========================
  // FETCH
  // =========================
  useEffect(() => {
    if (!id) return;

    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/tags/${id}/threads`);

        if (!res.ok) throw new Error("Failed to load tag");

        const data = await res.json();

        if (active) {
          setTag(data.data.tag);
          setThreads(data.data.threads || []);
        }
      } catch (err: any) {
        console.error(err);
        if (active) setError(err.message || "Failed to load tag");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [id]);

  // =========================
  // HELPERS
  // =========================
  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // =========================
  // METRICS
  // =========================
  const totalReplies = useMemo(
    () => threads.reduce((sum, t) => sum + (t._count?.posts ?? 0), 0),
    [threads]
  );

  const activityLevel = useMemo(() => {
    if (threads.length === 0) return "Low";

    const avg = totalReplies / threads.length;

    if (avg > 20) return "🔥 Very Active";
    if (avg > 8) return "⚡ Active";
    return "Calm";
  }, [threads, totalReplies]);

  // =========================
  // STATES
  // =========================
  if (loading) {
    return (
      <div className="p-6 max-w-[1100px] mx-auto space-y-4">
        <div className="h-10 w-1/3 bg-white/5 rounded animate-pulse" />
        <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-400">{error}</div>;
  }

  if (!tag) {
    return <div className="p-6">Tag not found</div>;
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <div className="max-w-[1280px] mx-auto space-y-6">

        {/* BACK */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* =========================
            HERO
        ========================= */}
        <section className="relative overflow-hidden rounded-3xl border border-border-subtle bg-bg-surface p-6 shadow-card">
          <div className="absolute inset-0 bg-gradient-glow opacity-90" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/10 text-xs uppercase tracking-[0.12em] text-accent-300">
              <Sparkles className="w-3.5 h-3.5" />
              Tag Overview
            </div>

            <h1 className="text-3xl font-semibold text-white flex items-center gap-2">
              <Hash className="w-6 h-6 text-primary-300" />
              {tag.name}
            </h1>

            <p className="mt-2 text-sm text-text-secondary">
              Explore all discussions and activity related to this topic.
            </p>

            {/* STATS */}
            <div className="mt-5 flex flex-wrap gap-3">

              <div className="rounded-2xl border border-border-subtle bg-white/[0.03] px-4 py-3">
                <p className="text-xs text-text-muted uppercase">Threads</p>
                <p className="text-lg font-semibold text-white">
                  {threads.length}
                </p>
              </div>

              <div className="rounded-2xl border border-border-subtle bg-white/[0.03] px-4 py-3">
                <p className="text-xs text-text-muted uppercase">Replies</p>
                <p className="text-lg font-semibold text-white">
                  {totalReplies}
                </p>
              </div>

              <div className="rounded-2xl border border-border-subtle bg-white/[0.03] px-4 py-3">
                <p className="text-xs text-text-muted uppercase">Activity</p>
                <p className="text-lg font-semibold text-white">
                  {activityLevel}
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* =========================
            CONTENT
        ========================= */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">

          {/* LEFT */}
          <section className="space-y-4">

            {threads.length === 0 ? (
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-8 text-center">
                <p className="text-white font-medium">
                  No threads for this tag yet
                </p>
                <p className="text-text-secondary text-sm mt-2">
                  Be the first to start a discussion.
                </p>
              </div>
            ) : (
              threads.map((thread) => (
                <Link
                  key={thread.id}
                  href={`/community/threads/${thread.id}`}
                  className="block"
                >
                  <div className="rounded-2xl border border-border-subtle bg-bg-card p-5 hover:border-white/10 transition">

                    <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Thread
                      <span>•</span>
                      {timeAgo(thread.createdAt)}
                    </div>

                    <h2 className="text-lg font-semibold text-white">
                      {thread.title}
                    </h2>

                    <div className="mt-2 text-sm text-text-secondary">
                      by{" "}
                      <span className="text-text-primary font-medium">
                        {thread.author.username}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
                      <span>
                        {thread._count?.posts ?? 0} replies
                      </span>

                      {thread.team && (
                        <span className="text-primary-300">
                          {thread.team.name}
                        </span>
                      )}
                    </div>

                  </div>
                </Link>
              ))
            )}

          </section>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-4">

            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary-300" />
                <p className="text-sm font-semibold text-white">
                  Tag Insights
                </p>
              </div>

              <p className="text-sm text-text-secondary">
                This tag has{" "}
                <span className="text-white font-medium">
                  {threads.length}
                </span>{" "}
                threads with{" "}
                <span className="text-white font-medium">
                  {totalReplies}
                </span>{" "}
                total replies.
              </p>

              <p className="mt-3 text-sm text-text-secondary">
                Activity level is{" "}
                <span className="text-white font-medium">
                  {activityLevel}
                </span>
              </p>
            </div>

            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-brand-300" />
                <p className="text-sm font-semibold text-white">
                  Why this matters
                </p>
              </div>

              <p className="text-sm text-text-secondary">
                Tags help organize discussions and surface relevant conversations across the platform.
              </p>
            </div>

          </aside>

        </div>

      </div>
    </div>
  );
}