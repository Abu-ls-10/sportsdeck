"use client";

import { MessageSquare, Pin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type ThreadCardProps = {
  id: string;
  pinned?: boolean;
  title: string;
  excerpt?: string;
  tags?: string[];
  replies?: number;
  meta?: string;
  team?: string;
  match?: string;
  createdAt?: string;
};

export default function ThreadCard({
  id,
  pinned = false,
  title,
  excerpt,
  tags = [],
  replies = 0,
  meta,
  team,
  match,
  createdAt,
}: ThreadCardProps) {
  const router = useRouter();

  // Prefetch for instant navigation
  useEffect(() => {
    router.prefetch(`community/threads/${id}`);
  }, [id, router]);

  const handleClick = () => {
    router.push(`/community/threads/${id}`);
  };

  // Generate excerpt fallback
  const safeExcerpt =
    excerpt && excerpt.length > 0
      ? excerpt
      : "Join the discussion and share your thoughts...";

  // Relative time helper
  const formatTime = (date?: string) => {
    if (!date) return meta || "";

    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${days}d ago`;
  };

  return (
    <article
      onClick={handleClick}
      className="group cursor-pointer rounded-2xl border border-white/6 bg-bg-surface p-4 shadow-soft transition-all hover:border-primary-500/25 hover:bg-bg-card hover:scale-[1.01]"
    >
      {/* TOP */}
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="space-y-2">
          
          {/* Pinned */}
          {pinned && (
            <div className="inline-flex items-center gap-1 rounded-md bg-primary-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-400">
              <Pin className="h-3 w-3" />
              Pinned
            </div>
          )}

          {/* Title */}
          <h3 className="max-w-[620px] text-lg font-semibold leading-snug text-white group-hover:text-primary-400 transition">
            {title}
          </h3>

          {/* Context */}
          {(team || match) && (
            <div className="flex flex-wrap gap-2 text-xs text-text-muted">
              {team && team !== "none" && (
                <span className="rounded bg-white/[0.03] px-2 py-0.5">
                  {team}
                </span>
              )}
              {match && match !== "none" && (
                <span className="rounded bg-white/[0.03] px-2 py-0.5">
                  {match}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Replies */}
        <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-xs text-text-secondary">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>{replies}</span>
        </div>
      </div>

      {/* Excerpt */}
      <p className="max-w-[700px] text-sm leading-6 text-text-secondary line-clamp-2">
        {safeExcerpt}
      </p>

      {/* Bottom */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-text-muted hover:bg-primary-500/10 hover:text-primary-400 transition"
              onClick={(e) => {
                e.stopPropagation();
                // Future: filter by tag
                console.log("Filter by tag:", tag);
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Meta */}
        <p className="text-xs text-text-muted">
          {createdAt ? formatTime(createdAt) : meta}
        </p>
      </div>
    </article>
  );
}