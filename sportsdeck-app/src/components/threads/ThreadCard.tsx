import { MessageSquare, Pin } from "lucide-react";

type ThreadCardProps = {
  pinned?: boolean;
  title: string;
  excerpt: string;
  tags: string[];
  replies: number;
  meta: string;
};

export default function ThreadCard({
  pinned = false,
  title,
  excerpt,
  tags,
  replies,
  meta,
}: ThreadCardProps) {
  return (
    <article className="rounded-2xl border border-white/6 bg-bg-surface p-4 shadow-soft transition hover:border-primary-500/25 hover:bg-bg-card">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="space-y-2">
          {pinned && (
            <div className="inline-flex items-center gap-1 rounded-md bg-primary-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-400">
              <Pin className="h-3 w-3" />
              Pinned
            </div>
          )}

          <h3 className="max-w-[620px] text-lg font-semibold leading-snug text-white">
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-xs text-text-secondary">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>{replies}</span>
        </div>
      </div>

      <p className="max-w-[700px] text-sm leading-6 text-text-secondary">
        {excerpt}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
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

        <p className="text-xs text-text-muted">{meta}</p>
      </div>
    </article>
  );
}