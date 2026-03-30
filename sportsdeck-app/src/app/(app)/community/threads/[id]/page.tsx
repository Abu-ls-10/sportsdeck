"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  MessageSquare,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

import ReplyBox from "@/components/threads/ReplyBox";
import PostComposer from "@/components/threads/PostComposer";
import PollCard from "@/components/threads/PollCard";

export default function ThreadPage() {
  const router = useRouter();
  const params = useParams();

  const threadId = params?.id as string;

  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =========================
  // FETCH
  // =========================
  useEffect(() => {
    if (!threadId) return;

    let active = true;

    const loadThread = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/threads/${threadId}/full`);
        if (!res.ok) throw new Error();

        const data = await res.json();

        if (active) setThread(data);
      } catch (err) {
        console.error(err);
        if (active) setError("Failed to load thread");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadThread();

    return () => {
      active = false;
    };
  }, [threadId]);

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
  // STATES
  // =========================
  if (!threadId) {
    return <div className="p-6">Invalid thread</div>;
  }

  if (loading) {
    return (
      <div className="p-6 max-w-[900px] mx-auto space-y-4">
        <div className="h-6 w-1/2 bg-white/5 rounded animate-pulse" />
        <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
        <div className="h-24 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-400">{error}</div>;
  }

  if (!thread) {
    return <div className="p-6">Thread not found</div>;
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <div className="max-w-[900px] mx-auto space-y-6">

        {/* BACK */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to discussions
        </button>

        {/* =========================
            THREAD HERO
        ========================= */}
        <section className="relative overflow-hidden rounded-3xl border border-border-subtle bg-bg-surface p-6 shadow-card">
          <div className="absolute inset-0 bg-gradient-glow opacity-90" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/10 text-xs uppercase tracking-[0.12em] text-accent-300">
              <Sparkles className="w-3.5 h-3.5" />
              Thread
            </div>

            <h1 className="text-2xl md:text-3xl font-semibold text-white leading-tight">
              {thread.title}
            </h1>

            <div className="mt-4 flex items-center gap-3 text-sm text-text-muted">
              <div className="h-9 w-9 rounded-full bg-primary-500/30" />
              <span className="text-text-primary font-medium">
                {thread.author?.username ?? "Unknown"}
              </span>
              <span>•</span>
              <span>{timeAgo(thread.createdAt)}</span>
            </div>
          </div>
        </section>

        {/* =========================
            COMPOSER
        ========================= */}
        <PostComposer
          threadId={thread.id}
          onPostCreated={(newPost) =>
            setThread((prev: any) => ({
              ...prev,
              posts: [newPost, ...prev.posts],
            }))
          }
        />

        {/* =========================
            POLL
        ========================= */}
        {thread.poll && <PollCard poll={thread.poll} />}

        {/* =========================
            POSTS
        ========================= */}
        <div className="space-y-4">
          {thread.posts?.map((post: any) => (
            <article
              key={post.id}
              className="rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-soft hover:border-white/10 transition"
            >

              {/* HEADER */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-full bg-primary-500/30" />

                <div className="text-sm text-text-muted">
                  <span className="text-white font-medium">
                    {post.author?.username ?? "User"}
                  </span>
                  <span className="mx-1">•</span>
                  {timeAgo(post.createdAt)}
                </div>
              </div>

              {/* CONTENT */}
              <p className="text-sm leading-6 text-text-secondary">
                {post.content}
              </p>

              {/* ACTIONS */}
              <div className="mt-4 flex items-center gap-4 text-xs text-text-muted">
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {post.replies?.length ?? 0} replies
                </div>
              </div>

              {/* REPLY BOX */}
              <div className="mt-4">
                <ReplyBox
                  postId={post.id}
                  onReplyCreated={(newReply: any) => {
                    setThread((prev: any) => ({
                      ...prev,
                      posts: prev.posts.map((p: any) =>
                        p.id === post.id
                          ? {
                              ...p,
                              replies: [...p.replies, newReply],
                            }
                          : p
                      ),
                    }));
                  }}
                />
              </div>

              {/* REPLIES */}
              <div className="mt-4 space-y-3 border-l border-white/5 pl-4">
                {post.replies?.map((r: any) => (
                  <div key={r.id} className="flex gap-3">
                    <div className="h-7 w-7 rounded-full bg-primary-500/30" />

                    <div className="flex-1">
                      <div className="text-xs text-text-muted mb-1">
                        <span className="text-white font-medium">
                          {r.author?.username ?? "User"}
                        </span>
                        <span className="mx-1">•</span>
                        {timeAgo(r.createdAt)}
                      </div>

                      <div className="text-sm text-text-secondary leading-5">
                        {r.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </article>
          ))}
        </div>

      </div>
    </div>
  );
}