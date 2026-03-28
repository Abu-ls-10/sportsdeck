"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Flame,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Vote,
  ArrowRight,
  Clock3,
  CheckCheck,
} from "lucide-react";

type FeedThread = {
  id: string;
  title: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
  tags: { id: string; name: string }[];
  replies: number;
};

type PollOption = {
  id: string;
  text?: string;
  label?: string;
  _count?: {
    votes: number;
  };
};

type FeedPoll = {
  id: string;
  question: string;
  isClosed?: boolean;
  options?: PollOption[];
};

type FeedItem = {
  id: string;
  isRead: boolean;
  createdAt: string;
  type: "thread" | "poll" | "activity";
  thread?: FeedThread | null;
  poll?: FeedPoll | null;
  meta?: {
    eventType?: string;
    groupKey?: string;
    count?: number;
    entityType?: string;
    entityId?: string;
  };
};

type Tag = {
  id: string;
  name: string;
  _count?: {
    threads?: number;
  };
};

type FeedTab = "all" | "unread" | "threads" | "polls";

function timeAgo(input: string) {
  const date = new Date(input).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - date);

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) {
    const mins = Math.max(1, Math.floor(diff / minute));
    return `${mins}m ago`;
  }
  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours}h ago`;
  }
  const days = Math.floor(diff / day);
  return `${days}d ago`;
}

function formatActivity(meta?: FeedItem["meta"]) {
  if (!meta) return "New activity";

  if (meta.eventType === "post_reply") {
    return `${meta.count && meta.count > 1 ? `${meta.count} new replies` : "New reply"} on a thread you follow`;
  }

  if (meta.eventType === "thread_created") {
    return `${meta.count && meta.count > 1 ? `${meta.count} new threads` : "New thread"} in your community`;
  }

  if (meta.eventType === "poll_created") {
    return "A new poll was posted";
  }

  return "Community activity update";
}

function FeedTabs({
  active,
  onChange,
}: {
  active: FeedTab;
  onChange: (tab: FeedTab) => void;
}) {
  const tabs: { key: FeedTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "threads", label: "Threads" },
    { key: "polls", label: "Polls" },
  ];

  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-surface/80 p-2 shadow-soft backdrop-blur-xs">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const activeTab = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={[
                "rounded-xl px-4 py-2 text-sm font-medium transition",
                activeTab
                  ? "bg-gradient-primary text-white shadow-glow"
                  : "bg-white/[0.03] text-text-secondary hover:bg-white/[0.06] hover:text-white",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CommunityHero({
  total,
  unread,
}: {
  total: number;
  unread: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border-subtle bg-bg-surface px-5 py-5 shadow-card md:px-6 md:py-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-glow opacity-90" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-300">
            <Sparkles className="h-3.5 w-3.5" />
            Community Hub
          </div>

          <h1 className="text-2xl font-semibold text-white md:text-3xl">
            Your SportsDeck community feed
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary md:text-base">
            Follow the conversations that matter, catch up on new threads,
            polls, and grouped activity, and jump straight into the discussion.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <div className="rounded-2xl border border-border-subtle bg-white/[0.03] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-text-muted">
                Feed items
              </p>
              <p className="mt-1 text-lg font-semibold text-white">{total}</p>
            </div>

            <div className="rounded-2xl border border-border-subtle bg-white/[0.03] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-text-muted">
                Unread
              </p>
              <p className="mt-1 text-lg font-semibold text-white">{unread}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[360px]">
          <div className="rounded-2xl border border-border-subtle bg-white/[0.04] p-4">
            <Bell className="h-4 w-4 text-accent-300" />
            <p className="mt-3 text-sm font-medium text-white">Notifications</p>
            <p className="mt-1 text-xs leading-5 text-text-secondary">
              Grouped feed items keep noise low.
            </p>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-white/[0.04] p-4">
            <MessageSquare className="h-4 w-4 text-primary-300" />
            <p className="mt-3 text-sm font-medium text-white">Threads</p>
            <p className="mt-1 text-xs leading-5 text-text-secondary">
              Jump into the latest discussion.
            </p>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-white/[0.04] p-4 col-span-2 sm:col-span-1">
            <Vote className="h-4 w-4 text-brand-300" />
            <p className="mt-3 text-sm font-medium text-white">Polls</p>
            <p className="mt-1 text-xs leading-5 text-text-secondary">
              Vote and track what the community thinks.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-soft"
        >
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="mt-4 h-6 w-2/3 rounded bg-white/10" />
          <div className="mt-3 h-4 w-full rounded bg-white/5" />
          <div className="mt-2 h-4 w-4/5 rounded bg-white/5" />
          <div className="mt-5 flex gap-2">
            <div className="h-7 w-20 rounded bg-white/10" />
            <div className="h-7 w-16 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ThreadFeedCard({
  item,
  onMarkRead,
}: {
  item: FeedItem;
  onMarkRead: (id: string) => void;
}) {
  const thread = item.thread;
  if (!thread) return null;

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-2xl border p-5 shadow-soft transition duration-200",
        item.isRead
          ? "border-border-subtle bg-bg-card/70"
          : "border-primary-500/30 bg-bg-surface shadow-glow",
      ].join(" ")}
    >
      {!item.isRead && (
        <div className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-accent-400 shadow-[0_0_16px_rgba(34,211,238,0.8)]" />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-300">
          <MessageSquare className="h-3.5 w-3.5" />
          Thread
        </span>

        <span className="text-xs text-text-muted">{timeAgo(item.createdAt)}</span>

        {!item.isRead && (
          <span className="rounded-full border border-accent-400/20 bg-accent-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-300">
            New
          </span>
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={`/threads/${thread.id}`}
            onClick={() => {
              if (!item.isRead) onMarkRead(item.id);
            }}
            className="inline-block"
          >
            <h2 className="text-lg font-semibold leading-snug text-white transition group-hover:text-primary-300">
              {thread.title}
            </h2>
          </Link>

          <p className="mt-2 text-sm text-text-secondary">
            by <span className="text-text-primary">{thread.author.username}</span>
          </p>
        </div>

        <div className="shrink-0 rounded-xl border border-border-subtle bg-white/[0.03] px-3 py-2 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-text-muted">
            Replies
          </p>
          <p className="mt-1 text-base font-semibold text-white">
            {thread.replies}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {thread.tags.slice(0, 4).map((tag) => (
          <span
            key={tag.id}
            className="rounded-full border border-border-subtle bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-text-secondary"
          >
            #{tag.name}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs text-text-muted">
          {item.meta?.count && item.meta.count > 1
            ? `${item.meta.count} grouped events`
            : "Latest discussion update"}
        </p>

        <Link
          href={`/threads/${thread.id}`}
          onClick={() => {
            if (!item.isRead) onMarkRead(item.id);
          }}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-300 transition hover:text-primary-200"
        >
          Open thread
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function PollFeedCard({
  item,
  onMarkRead,
}: {
  item: FeedItem;
  onMarkRead: (id: string) => void;
}) {
  const poll = item.poll;
  if (!poll) return null;

  const totalVotes =
    poll.options?.reduce((sum, option) => sum + (option._count?.votes ?? 0), 0) ??
    0;

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-2xl border p-5 shadow-soft transition duration-200",
        item.isRead
          ? "border-border-subtle bg-bg-card/70"
          : "border-brand-400/30 bg-bg-surface",
      ].join(" ")}
    >
      {!item.isRead && (
        <div className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-brand-400 shadow-[0_0_16px_rgba(251,146,60,0.8)]" />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-300">
          <Vote className="h-3.5 w-3.5" />
          Poll
        </span>

        <span className="text-xs text-text-muted">{timeAgo(item.createdAt)}</span>

        {!item.isRead && (
          <span className="rounded-full border border-brand-400/20 bg-brand-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-300">
            New
          </span>
        )}
      </div>

      <div className="mt-4">
        <h2 className="text-lg font-semibold leading-snug text-white">
          {poll.question}
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          {poll.isClosed ? "Poll closed" : "Poll open"} · {totalVotes} total votes
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {(poll.options ?? []).slice(0, 4).map((option) => {
          const label = option.text ?? option.label ?? "Option";
          const votes = option._count?.votes ?? 0;
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

          return (
            <div
              key={option.id}
              className="rounded-xl border border-border-subtle bg-white/[0.03] p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="truncate text-sm text-text-primary">{label}</span>
                <span className="text-xs text-text-muted">{pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-primary"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs text-text-muted">Community sentiment snapshot</p>

        <button
          onClick={() => {
            if (!item.isRead) onMarkRead(item.id);
          }}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-300 transition hover:text-brand-200"
        >
          Mark read
          <CheckCheck className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function ActivityCard({
  item,
  onMarkRead,
}: {
  item: FeedItem;
  onMarkRead: (id: string) => void;
}) {
  return (
    <article
      className={[
        "rounded-2xl border p-5 shadow-soft transition",
        item.isRead
          ? "border-border-subtle bg-bg-card/70"
          : "border-accent-400/25 bg-bg-surface",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-accent-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-300">
            <Bell className="h-3.5 w-3.5" />
            Activity
          </div>

          <h3 className="mt-3 text-base font-semibold text-white">
            {formatActivity(item.meta)}
          </h3>

          <p className="mt-2 text-sm text-text-secondary">
            Grouped activity helps keep your feed focused and easier to scan.
          </p>

          <div className="mt-4 flex items-center gap-3 text-xs text-text-muted">
            <span>{timeAgo(item.createdAt)}</span>
            {item.meta?.count && item.meta.count > 1 && (
              <>
                <span className="h-1 w-1 rounded-full bg-text-muted" />
                <span>{item.meta.count} events</span>
              </>
            )}
          </div>
        </div>

        {!item.isRead && (
          <button
            onClick={() => onMarkRead(item.id)}
            className="rounded-xl border border-border-subtle bg-white/[0.03] px-3 py-2 text-sm text-text-secondary transition hover:bg-white/[0.06] hover:text-white"
          >
            Mark read
          </button>
        )}
      </div>
    </article>
  );
}

function SidebarCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border-subtle bg-bg-surface p-4 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-text-primary">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export default function CommunityPage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [tab, setTab] = useState<FeedTab>("all");

  useEffect(() => {
    let active = true;

    const loadFeed = async () => {
      try {
        setFeedLoading(true);
        const res = await fetch("/api/feed?limit=20", {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to load feed");

        const data = await res.json();
        if (active) {
          setFeed(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error(error);
        if (active) setFeed([]);
      } finally {
        if (active) setFeedLoading(false);
      }
    };

    const loadTags = async () => {
      try {
        setTagsLoading(true);
        const res = await fetch("/api/tags", {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to load tags");

        const data = await res.json();

        if (active) {
          if (Array.isArray(data)) {
            setTags(data);
          } else if (Array.isArray(data.tags)) {
            setTags(data.tags);
          } else {
            setTags([]);
          }
        }
      } catch (error) {
        console.error(error);
        if (active) setTags([]);
      } finally {
        if (active) setTagsLoading(false);
      }
    };

    loadFeed();
    loadTags();

    return () => {
      active = false;
    };
  }, []);

  const filteredFeed = useMemo(() => {
    if (tab === "unread") return feed.filter((item) => !item.isRead);
    if (tab === "threads") return feed.filter((item) => item.type === "thread");
    if (tab === "polls") return feed.filter((item) => item.type === "poll");
    return feed;
  }, [feed, tab]);

  const unreadCount = useMemo(
    () => feed.filter((item) => !item.isRead).length,
    [feed]
  );

  const recentActivity = useMemo(
    () => feed.filter((item) => item.type === "activity").slice(0, 4),
    [feed]
  );

  const sidebarPoll = useMemo(
    () => feed.find((item) => item.type === "poll" && item.poll)?.poll ?? null,
    [feed]
  );

  const markAsRead = async (feedId: string) => {
    setFeed((prev) =>
      prev.map((item) =>
        item.id === feedId ? { ...item, isRead: true } : item
      )
    );

    try {
      const res = await fetch(`/api/feed/${feedId}/read`, {
        method: "PATCH",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to mark feed item as read");
      }
    } catch (error) {
      console.error(error);

      setFeed((prev) =>
        prev.map((item) =>
          item.id === feedId ? { ...item, isRead: false } : item
        )
      );
    }
  };

  return (
    <div className="px-4 py-5 md:px-6 md:py-6 lg:px-8">
      <div className="mx-auto max-w-[1280px]">
        <CommunityHero total={feed.length} unread={unreadCount} />

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-4">
            <FeedTabs active={tab} onChange={setTab} />

            {feedLoading ? (
              <FeedSkeleton />
            ) : filteredFeed.length === 0 ? (
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-8 text-center shadow-soft">
                <p className="text-base font-medium text-white">
                  Nothing to show right now
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  Your community feed will populate as activity picks up.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFeed.map((item) => {
                  if (item.type === "thread" && item.thread) {
                    return (
                      <ThreadFeedCard
                        key={item.id}
                        item={item}
                        onMarkRead={markAsRead}
                      />
                    );
                  }

                  if (item.type === "poll" && item.poll) {
                    return (
                      <PollFeedCard
                        key={item.id}
                        item={item}
                        onMarkRead={markAsRead}
                      />
                    );
                  }

                  return (
                    <ActivityCard
                      key={item.id}
                      item={item}
                      onMarkRead={markAsRead}
                    />
                  );
                })}
              </div>
            )}
          </section>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <SidebarCard
              icon={<Flame className="h-4 w-4 text-brand-300" />}
              title="Trending Topics"
            >
              {tagsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-10 animate-pulse rounded-xl bg-white/5"
                    />
                  ))}
                </div>
              ) : tags.length === 0 ? (
                <p className="text-sm text-text-secondary">
                  No trending tags yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {tags.slice(0, 6).map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/tags/${tag.id}/threads`}
                      className="flex items-center justify-between rounded-xl border border-border-subtle bg-white/[0.03] px-3 py-3 transition hover:bg-white/[0.06]"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          #{tag.name}
                        </p>
                        <p className="mt-0.5 text-xs text-text-muted">
                          Explore related discussions
                        </p>
                      </div>
                      <TrendingUp className="h-4 w-4 text-text-muted" />
                    </Link>
                  ))}
                </div>
              )}
            </SidebarCard>

            <SidebarCard
              icon={<Vote className="h-4 w-4 text-primary-300" />}
              title="Quick Poll Snapshot"
            >
              {!sidebarPoll ? (
                <p className="text-sm text-text-secondary">
                  No active poll in your feed yet.
                </p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium leading-6 text-white">
                      {sidebarPoll.question}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      {(sidebarPoll.options ?? []).length} options available
                    </p>
                  </div>

                  <div className="space-y-2">
                    {(sidebarPoll.options ?? []).slice(0, 3).map((option) => (
                      <div
                        key={option.id}
                        className="rounded-xl border border-border-subtle bg-white/[0.03] px-3 py-2 text-sm text-text-secondary"
                      >
                        {option.text ?? option.label ?? "Option"}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SidebarCard>

            <SidebarCard
              icon={<Clock3 className="h-4 w-4 text-accent-300" />}
              title="Recent Activity"
            >
              {recentActivity.length === 0 ? (
                <p className="text-sm text-text-secondary">
                  No recent grouped activity yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border-subtle bg-white/[0.03] p-3"
                    >
                      <p className="text-sm font-medium text-white">
                        {formatActivity(item.meta)}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        {timeAgo(item.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </SidebarCard>
          </aside>
        </div>
      </div>
    </div>
  );
}