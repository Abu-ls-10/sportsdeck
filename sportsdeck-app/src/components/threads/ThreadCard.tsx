"use client";

import { MessageSquare, Pin } from "lucide-react";
import { useRouter } from "next/navigation";

type ThreadCardProps = {
  id: string;
  pinned?: boolean;
  title: string;
  excerpt: string;
  tags: string[];
  replies: number;
  meta: string;
  team?: string;
  match?: string;
};

export default function ThreadCard({
  id,
  pinned = false,
  title,
  excerpt,
  tags,
  replies,
  meta,
  team,
  match,
}: ThreadCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/threads/${id}`);
  };

  return (
    <article
      onClick={handleClick}
      className="cursor-pointer rounded-2xl border border-white/6 bg-bg-surface p-4 shadow-soft transition hover:border-primary-500/25 hover:bg-bg-card hover:scale-[1.01]"
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
          <h3 className="max-w-[620px] text-lg font-semibold leading-snug text-white">
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
      {excerpt && (
        <p className="max-w-[700px] text-sm leading-6 text-text-secondary">
          {excerpt}
        </p>
      )}

      {/* Bottom */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-text-muted"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Meta */}
        <p className="text-xs text-text-muted">{meta}</p>
      </div>
    </article>
  );
}