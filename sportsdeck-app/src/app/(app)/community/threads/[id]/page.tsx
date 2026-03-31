"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import ReplyBox from "@/components/threads/ReplyBox";
import PollCard from "@/components/threads/PollCard";

export default function ThreadPage() {
  const router = useRouter();
  const params = useParams();
  const threadId = params?.id as string;

  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [replyTarget, setReplyTarget] = useState<any>(null);

  // =========================
  // FETCH
  // =========================
  useEffect(() => {
    if (!threadId) return;

    let active = true;

    const loadThread = async () => {
      try {
        setLoading(true);
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

  const Avatar = ({ user, size = 36 }: any) => {
    if (user?.avatarUrl) {
      return (
        <img
          src={user.avatarUrl}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      );
    }

    return (
      <div
        className="rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold"
        style={{ width: size, height: size }}
      >
        {user?.username?.[0]?.toUpperCase()}
      </div>
    );
  };

  // =========================
  // SCROLL TO REPLY
  // =========================
  const scrollToReply = (replyId: string) => {
    const el = document.getElementById(`reply-${replyId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });

      // highlight effect
      el.classList.add("ring-2", "ring-accent-400");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-accent-400");
      }, 1500);
    }
  };

  // =========================
  // POLL UPDATE
  // =========================
  const handlePollUpdate = (updated: any) => {
    setThread((prev: any) => ({
      ...prev,
      poll: {
        ...prev.poll,
        options: updated.options,
        userVote: updated.userVote,
      },
    }));
  };

  // =========================
  // ADD REPLY (TREE UPDATE)
  // =========================
  const insertReply = (replies: any[], newReply: any): any[] => {
    if (!newReply.parentReplyId) {
      return [...replies, { ...newReply, children: [] }];
    }

    return replies.map((r) => {
      if (r.id === newReply.parentReplyId) {
        return {
          ...r,
          children: [...(r.children || []), { ...newReply, children: [] }],
        };
      }

      if (r.children?.length) {
        return {
          ...r,
          children: insertReply(r.children, newReply),
        };
      }

      return r;
    });
  };

  // =========================
  // STATES
  // =========================
  if (!threadId) return <div className="p-6">Invalid thread</div>;
  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;
  if (!thread || !thread.post) return <div className="p-6">Thread not found</div>;

  // =========================
  // REPLY COMPONENT
  // =========================
  const ReplyItem = ({ reply, depth = 0 }: any) => {
    return (
      <div id={`reply-${reply.id}`} className="flex gap-3">

        {/* AVATAR */}
        <Link href={`/users/${reply.author.id}`}>
          <div className="cursor-pointer">
            <Avatar user={reply.author} size={32} />
          </div>
        </Link>

        <div className="flex-1">

          {/* HEADER */}
          <div className="text-xs text-text-muted mb-1">
            <Link
              href={`/users/${reply.author.id}`}
              className="text-white font-medium hover:text-accent-300"
            >
              {reply.author.username}
            </Link>
            <span className="mx-1">•</span>
            {timeAgo(reply.createdAt)}
          </div>

          {/* CONTENT */}
          <div className="text-sm text-text-secondary">
            {reply.content}
          </div>

          {/* POLL IN REPLY */}
          {thread.poll?.replyId === reply.id && (
            <div className="mt-3">
              <PollCard
                poll={thread.poll}
                onVote={handlePollUpdate}
              />
            </div>
          )}

          {/* ACTIONS */}
          <div className="mt-2 text-xs text-text-muted flex gap-4">
            <button
              onClick={() => setReplyTarget(reply)}
              className="hover:text-accent-300"
            >
              Reply
            </button>
          </div>

          {/* CHILDREN */}
          {reply.children?.length > 0 && (
            <div className="mt-3 space-y-3 border-l border-white/10 pl-4">
              {reply.children.map((child: any) => (
                <ReplyItem key={child.id} reply={child} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <div className="max-w-[900px] mx-auto space-y-6">

        {/* BACK */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* THREAD HERO */}
        <section className="rounded-3xl border border-border-subtle bg-bg-surface p-6 space-y-4">

          <h1 className="text-2xl font-semibold text-white">
            {thread.title}
          </h1>

          <div className="flex items-center gap-3 text-sm text-text-muted">
            <Link href={`/users/${thread.author.id}`}>
              <Avatar user={thread.author} />
            </Link>

            <Link href={`/users/${thread.author.id}`} className="text-white">
              {thread.author.username}
            </Link>

            <span>•</span>
            {timeAgo(thread.createdAt)}
          </div>

          <div className="pt-4 border-t border-white/10 text-text-secondary">
            {thread.post.content}
          </div>

        </section>

        {/* HERO POLL */}
        {thread.poll && (
          <div className="space-y-3">
            <PollCard
              poll={thread.poll}
              onVote={handlePollUpdate}
            />

            {thread.poll.replyId && (
              <button
                onClick={() => scrollToReply(thread.poll.replyId)}
                className="text-xs text-accent-300 hover:text-accent-200 transition"
              >
                View poll in discussion ↓
              </button>
            )}
          </div>
        )}

        {/* REPLY BOX */}
        <ReplyBox
          postId={thread.post.id}
          parentReplyId={replyTarget?.id ?? null}
          replyingTo={replyTarget?.author?.username ?? null}
          onCancel={() => setReplyTarget(null)}
          onReplyCreated={(newReply: any) => {
            setThread((prev: any) => ({
              ...prev,
              post: {
                ...prev.post,
                replies: insertReply(prev.post.replies, newReply),
              },
            }));
            setReplyTarget(null);
          }}
        />

        {/* REPLIES */}
        <div className="space-y-4">
          {thread.post.replies.map((reply: any) => (
            <ReplyItem key={reply.id} reply={reply} />
          ))}
        </div>

      </div>
    </div>
  );
}