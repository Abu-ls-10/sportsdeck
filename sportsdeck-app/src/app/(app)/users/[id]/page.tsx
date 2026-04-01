"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  Flame,
  Loader2,
  MessageSquare,
  Pencil,
  Save,
  Settings2,
  Share2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

type FavoriteTeam = {
  id: string;
  name: string;
  shortName?: string | null;
  logoUrl?: string | null;
};

type BasicUser = {
  id: string;
  username?: string | null;
  avatarUrl?: string | null;
};

type ThreadItem = {
  id: string;
  title: string;
  createdAt: string;
  _count?: {
    posts?: number;
  };
};

type PostItem = {
  id: string;
  threadId: string;
  content?: string | null;
  createdAt: string;
};

type ReplyItem = {
  id: string;
  postId: string;
  content?: string | null;
  createdAt: string;
};

type UserProfile = {
  id: string;
  username?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
  favoriteTeam?: FavoriteTeam | null;
  _count?: {
    followers?: number;
    following?: number;
    threads?: number;
    posts?: number;
    replies?: number;
  };
  isFollowing?: boolean;
  threads?: ThreadItem[];
  posts?: PostItem[];
  replies?: ReplyItem[];
};

type Me = {
  id: string;
  username?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
  favoriteTeam?: FavoriteTeam | null;
  _count?: {
    followers?: number;
    following?: number;
    threads?: number;
    posts?: number;
    replies?: number;
  };
};

type MeResponse = {
  message?: string;
  data?: Me;
};

type ActivityApiItem = {
  date: string;
  posts?: number;
  replies?: number;
  total?: number;
};

type ActivityPoint = {
  date: string;
  count: number;
};

type TeamsResponse =
  | FavoriteTeam[]
  | {
      teams?: FavoriteTeam[];
      data?: FavoriteTeam[];
    };

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, {
      credentials: "include",
      cache: "no-store",
      ...init,
    });

    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (error) {
    console.error(`Failed to fetch ${url}`, error);
    return null;
  }
}

function getInitials(name?: string | null) {
  if (!name) return "U";

  const trimmed = name.trim();
  if (!trimmed) return "U";

  const parts = trimmed.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function timeAgo(input?: string) {
  if (!input) return "Recently";

  const date = new Date(input).getTime();
  if (Number.isNaN(date)) return "Recently";

  const diff = Math.max(0, Date.now() - date);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;

  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}m ago`;
  if (diff < day) return `${Math.max(1, Math.floor(diff / hour))}h ago`;
  if (diff < month) return `${Math.max(1, Math.floor(diff / day))}d ago`;

  return new Date(input).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCompactNumber(value?: number) {
  const n = value ?? 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function extractTeams(value: TeamsResponse | null): FavoriteTeam[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.teams)) return value.teams;
  if (Array.isArray(value.data)) return value.data;
  return [];
}

function normalizeActivity(value: unknown): ActivityPoint[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const row = item as ActivityApiItem;
      return {
        date: row.date,
        count: row.total ?? 0,
      };
    })
    .filter((item) => !!item.date);
}

function getMemberSince(input?: string) {
  if (!input) return "Recently joined";

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "Recently joined";

  return `Member since ${date.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  })}`;
}

function getProfileStrength(profile: UserProfile | null) {
  if (!profile) return 0;

  let score = 0;
  if (profile.username?.trim()) score += 34;
  if (profile.avatarUrl?.trim()) score += 33;
  if (profile.favoriteTeam?.id) score += 33;

  return score;
}

function truncateText(value?: string | null, max = 160) {
  const text = value?.trim();
  if (!text) return "No content preview available.";
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
}

function SectionHeader({
  icon,
  eyebrow,
  title,
  actionHref,
  actionLabel,
  action,
}: {
  icon?: React.ReactNode;
  eyebrow?: string;
  title: string;
  actionHref?: string;
  actionLabel?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
            {icon}
            {eyebrow}
          </div>
        ) : null}
        <h2 className="text-lg font-semibold text-text-primary md:text-xl">{title}</h2>
      </div>

      {action ? action : null}

      {!action && actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-300 transition hover:text-primary-200"
        >
          {actionLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function GlassPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "rounded-3xl border border-border-subtle bg-bg-surface/90 shadow-card backdrop-blur-xs",
        className
      )}
    >
      {children}
    </div>
  );
}

function Avatar({
  name,
  src,
  size = "md",
}: {
  name?: string | null;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeClass =
    size === "sm"
      ? "h-9 w-9 text-xs"
      : size === "lg"
        ? "h-16 w-16 text-base"
        : size === "xl"
          ? "h-20 w-20 text-lg"
          : "h-11 w-11 text-sm";

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? "Avatar"}
        className={cx(
          "rounded-2xl border border-border-subtle object-cover shadow-soft",
          sizeClass
        )}
      />
    );
  }

  return (
    <div
      className={cx(
        "flex items-center justify-center rounded-2xl border border-border-subtle bg-gradient-primary font-semibold text-primary shadow-soft",
        sizeClass
      )}
    >
      {getInitials(name)}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-white/[0.04] p-4 shadow-inner transition duration-200 hover:-translate-y-0.5">
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]">
          {icon}
        </span>
      </div>

      <p className="mt-4 text-xs uppercase tracking-[0.14em] text-text-muted">
        {label}
      </p>
      <p className="mt-1 truncate text-lg font-semibold text-text-primary">{value}</p>
      <p className="mt-1 text-xs leading-5 text-text-secondary">{helper}</p>
    </div>
  );
}

function EmptyStateCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card/70 p-8 text-center shadow-soft">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border-subtle bg-white/[0.04]">
        <Sparkles className="h-5 w-5 text-accent-300" />
      </div>
      <p className="mt-4 text-base font-medium text-text-primary">{title}</p>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
    </div>
  );
}

function MiniInsight({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-white/[0.03] px-3 py-2.5 text-center">
      <p className="text-sm font-semibold text-text-primary">{value}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-text-muted">
        {label}
      </p>
    </div>
  );
}

function MiniRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-white/[0.03] px-3 py-3">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-semibold text-text-primary">{value}</span>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function ProfileHero({
  profile,
  isMe,
  isFollowing,
  followLoading,
  onFollowToggle,
  onShare,
}: {
  profile: UserProfile;
  isMe: boolean;
  isFollowing: boolean;
  followLoading: boolean;
  onFollowToggle: () => void;
  onShare: () => void;
}) {
  const username = profile.username ?? "Unknown user";
  const handle = `@${username.toLowerCase().replace(/\s+/g, "")}`;
  const memberSince = getMemberSince(profile.createdAt);

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-border-subtle bg-bg-surface shadow-card">
      <div className="absolute inset-0 bg-gradient-glow opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.12),transparent_30%)]" />
      <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />

      <div className="relative px-5 py-6 md:px-7 md:py-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4 md:gap-5">
            <Avatar name={username} src={profile.avatarUrl} size="xl" />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-text-primary md:text-3xl">
                  {username}
                </h1>

                {profile.favoriteTeam?.name ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary-400/20 bg-primary-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-300">
                    <ShieldCheck className="h-3 w-3" />
                    {profile.favoriteTeam.name} fan
                  </span>
                ) : null}
              </div>

              <p className="mt-1 text-sm text-text-muted">{handle}</p>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary md:text-base">
                {isMe
                  ? "Your public profile is powered by your real SportsDeck activity, followers, and favorite team."
                  : "This profile shows public discussion activity, recent threads, and community connections."}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <span className="rounded-full border border-border-subtle bg-white/[0.04] px-3 py-2 text-xs font-medium text-text-secondary">
                  {memberSince}
                </span>

                {profile.favoriteTeam?.name ? (
                  <span className="rounded-full border border-border-subtle bg-white/[0.04] px-3 py-2 text-xs font-medium text-text-secondary">
                    Favorite team: {profile.favoriteTeam.name}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            {isMe ? (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-border-subtle bg-white/[0.04] px-4 py-3 text-sm font-medium text-text-primary">
                <Pencil className="h-4 w-4" />
                Your profile
              </div>
            ) : (
              <button
                onClick={onFollowToggle}
                disabled={followLoading}
                className={cx(
                  "inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-70",
                  isFollowing
                    ? "border border-border-subtle bg-white/[0.04] text-text-primary hover:bg-white/[0.07]"
                    : "bg-gradient-primary text-primary shadow-glow hover:-translate-y-0.5"
                )}
              >
                {followLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isFollowing ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}

            <button
              onClick={onShare}
              className="inline-flex items-center gap-2 rounded-2xl border border-border-subtle bg-white/[0.04] px-4 py-3 text-sm font-medium text-text-primary transition hover:bg-white/[0.07]"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ActivityOverviewCard({
  points,
}: {
  points: ActivityPoint[];
}) {
  const sortedPoints = [...points].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const total = sortedPoints.reduce((sum, point) => sum + point.count, 0);
  const peak = Math.max(0, ...sortedPoints.map((p) => p.count));

  return (
    <GlassPanel className="p-5 md:p-6">
      <SectionHeader
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        eyebrow="Momentum"
        title="Activity overview"
      />

      <div className="mt-5">
        {sortedPoints.length === 0 ? (
          <EmptyStateCard
            title="No recent activity"
            description="This chart uses the real activity endpoint. Once posts or replies appear, the trend will show up here."
          />
        ) : (
          <>
            <p className="text-xs text-text-muted mb-3">
              Last {sortedPoints.length} days
            </p>

            <div className="flex gap-3">
              <div className="flex flex-col justify-between text-[10px] text-text-muted pr-1">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {sortedPoints.map((point, index) => {
                  const intensity =
                    point.count === 0
                      ? "bg-white/5"
                      : point.count <= peak * 0.25
                        ? "bg-primary-500/30"
                        : point.count <= peak * 0.6
                          ? "bg-primary-500/60"
                          : "bg-primary-500";

                  return (
                    <div
                      key={`${point.date}-${index}`}
                      className={cx(
                        "h-3.5 w-3.5 rounded-sm transition hover:scale-110",
                        intensity
                      )}
                      title={`${new Date(point.date).toLocaleDateString()}: ${
                        point.count
                      } activities`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="h-3 w-3 bg-white/5 rounded-sm" />
                <div className="h-3 w-3 bg-primary-500/30 rounded-sm" />
                <div className="h-3 w-3 bg-primary-500/60 rounded-sm" />
                <div className="h-3 w-3 bg-primary-500 rounded-sm" />
              </div>
              <span>More</span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <MiniInsight label="Range total" value={String(total)} />
              <MiniInsight label="Peak day" value={String(peak)} />
              <MiniInsight label="Source" value="Live" />
            </div>
          </>
        )}
      </div>
    </GlassPanel>
  );
}

function ThreadShowcaseCard({
  threads,
}: {
  threads: ThreadItem[];
}) {
  return (
    <GlassPanel className="p-5 md:p-6">
      <SectionHeader
        icon={<MessageSquare className="h-3.5 w-3.5" />}
        eyebrow="Discussions"
        title="Recent threads"
        actionHref="/community"
        actionLabel="Open community"
      />

      <div className="mt-5 grid gap-4">
        {threads.length === 0 ? (
          <EmptyStateCard
            title="No visible threads yet"
            description="Once this user starts public conversations, their latest threads will appear here."
          />
        ) : (
          threads.map((thread) => (
            <article
              key={thread.id}
              className="group relative overflow-hidden rounded-2xl border border-border-subtle bg-bg-card/70 p-5 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-primary-500/30"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-border opacity-70" />

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-primary-400/20 bg-primary-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-300">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Discussion
                </span>

                <span className="text-xs text-text-muted">{timeAgo(thread.createdAt)}</span>
              </div>

              <div className="mt-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Link href={`community/threads/${thread.id}`} className="inline-block">
                    <h3 className="text-lg font-semibold leading-snug text-text-primary transition group-hover:text-primary-300">
                      {thread.title}
                    </h3>
                  </Link>

                  <p className="mt-3 text-sm leading-6 text-text-secondary">
                    Open the full thread to read the conversation and join in.
                  </p>
                </div>

                <div className="shrink-0 rounded-2xl border border-border-subtle bg-white/[0.03] px-3 py-3 text-center">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted">
                    Posts
                  </p>
                  <p className="mt-1 text-lg font-semibold text-text-primary">
                    {thread._count?.posts ?? 0}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-xs text-text-muted">
                  <Clock3 className="h-4 w-4" />
                  Recent thread activity
                </div>

                <Link
                  href={`/community/threads/${thread.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary-300 transition hover:text-primary-200"
                >
                  Open thread
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
    </GlassPanel>
  );
}

function ContentTimelineCard({
  title,
  eyebrow,
  icon,
  emptyTitle,
  emptyDescription,
  items,
}: {
  title: string;
  eyebrow: string;
  icon: React.ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  items: Array<{
    id: string;
    href: string;
    title: string;
    body: string;
    meta: string;
  }>;
}) {
  return (
    <GlassPanel className="p-5 md:p-6">
      <SectionHeader icon={icon} eyebrow={eyebrow} title={title} />

      <div className="mt-5 space-y-4">
        {items.length === 0 ? (
          <EmptyStateCard title={emptyTitle} description={emptyDescription} />
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-border-subtle bg-bg-card/70 p-4 shadow-soft transition duration-200 hover:border-primary-500/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={item.href}
                    className="text-base font-semibold text-text-primary transition hover:text-primary-300"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {item.body}
                  </p>
                </div>

                <Link
                  href={item.href}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-white/[0.03] text-text-secondary transition hover:bg-white/[0.06] hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-3 text-xs text-text-muted">{item.meta}</div>
            </article>
          ))
        )}
      </div>
    </GlassPanel>
  );
}

function PeopleListCard({
  title,
  eyebrow,
  icon,
  users,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  eyebrow: string;
  icon: React.ReactNode;
  users: BasicUser[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <GlassPanel className="p-5">
      <SectionHeader icon={icon} eyebrow={eyebrow} title={title} />

      <div className="mt-5 space-y-3">
        {users.length === 0 ? (
          <EmptyStateCard title={emptyTitle} description={emptyDescription} />
        ) : (
          users.slice(0, 8).map((user) => (
            <Link
              key={user.id}
              href={`/users/${user.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-white/[0.03] px-3 py-3 transition hover:bg-white/[0.06]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={user.username ?? "User"} src={user.avatarUrl} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {user.username ?? "Community member"}
                  </p>
                  <p className="text-xs text-text-muted">View profile</p>
                </div>
              </div>

              <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
            </Link>
          ))
        )}
      </div>
    </GlassPanel>
  );
}

function ProfileStrengthCard({
  profile,
  recentThreadsCount,
  recentPostsCount,
  recentRepliesCount,
}: {
  profile: UserProfile;
  recentThreadsCount: number;
  recentPostsCount: number;
  recentRepliesCount: number;
}) {
  const strength = getProfileStrength(profile);

  return (
    <GlassPanel className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-text-primary">
          <ShieldCheck className="h-4 w-4 text-accent-300" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary">Profile snapshot</h3>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-text-primary">{strength}% complete</p>
          <p className="text-xs text-text-muted">Based on supported public fields</p>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-primary"
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <MiniRow label="Recent threads returned" value={String(recentThreadsCount)} />
        <MiniRow label="Recent posts returned" value={String(recentPostsCount)} />
        <MiniRow label="Recent replies returned" value={String(recentRepliesCount)} />
        <MiniRow
          label="Favorite team set"
          value={profile.favoriteTeam?.name ? "Yes" : "No"}
        />
      </div>

      <p className="mt-4 text-xs leading-6 text-text-muted">
        This card uses only the fields the current backend actually returns.
      </p>
    </GlassPanel>
  );
}

function OwnerInsightsCard({
  me,
}: {
  me: Me;
}) {
  return (
    <GlassPanel className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-text-primary">
          <Flame className="h-4 w-4 text-brand-300" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary">Your stats</h3>
      </div>

      <div className="space-y-3">
        <MiniRow label="Followers" value={String(me._count?.followers ?? 0)} />
        <MiniRow label="Following" value={String(me._count?.following ?? 0)} />
        <MiniRow label="Threads" value={String(me._count?.threads ?? 0)} />
        <MiniRow label="Posts" value={String(me._count?.posts ?? 0)} />
        <MiniRow label="Replies" value={String(me._count?.replies ?? 0)} />
      </div>

      <p className="mt-4 text-xs leading-6 text-text-muted">
        These values come from the authenticated user endpoint.
      </p>
    </GlassPanel>
  );
}

function ProfileSettingsCard({
  profile,
  teams,
  saving,
  saveMessage,
  onSave,
}: {
  profile: UserProfile;
  teams: FavoriteTeam[];
  saving: boolean;
  saveMessage: string | null;
  onSave: (payload: {
    username: string;
    avatarUrl: string;
    favoriteTeamId: string | null;
  }) => Promise<void>;
}) {
  const [username, setUsername] = useState(profile.username ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [favoriteTeamId, setFavoriteTeamId] = useState(
    profile.favoriteTeam?.id ?? ""
  );
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [teamSearch, setTeamSearch] = useState("");
  const teamDropdownRef = useRef<HTMLDivElement>(null);
  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(teamSearch.toLowerCase())
  );
  const selectedTeam = teams.find(t => t.id === favoriteTeamId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(e.target as Node)) {
        setTeamDropdownOpen(false);
        setTeamSearch("");
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <GlassPanel className="p-5">
      <SectionHeader
        icon={<Settings2 className="h-3.5 w-3.5" />}
        eyebrow="Account"
        title="Profile settings"
      />

      <form
        className="mt-5 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          await onSave({
            username: username.trim(),
            avatarUrl: avatarUrl.trim(),
            favoriteTeamId: favoriteTeamId || null,
          });
        }}
      >
        <Field label="Display name / username">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-border-subtle bg-white/[0.03] px-3 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-dim focus:border-primary-500/40 focus:bg-white/[0.05]"
            placeholder="Choose a username"
          />
        </Field>

        <Field label="Avatar URL">
          <input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="w-full rounded-xl border border-border-subtle bg-white/[0.03] px-3 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-dim focus:border-primary-500/40 focus:bg-white/[0.05]"
            placeholder="https://..."
          />
        </Field>

        <Field label="Favorite team">
          <div ref={teamDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setTeamDropdownOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-border-subtle bg-white/[0.03] px-3 py-3 text-sm"
            >
              <span className="flex items-center gap-2">
                {selectedTeam?.logoUrl && (
                  <img
                    src={selectedTeam.logoUrl}
                    className="h-5 w-5 rounded-full object-contain"
                  />
                )}

                <span>
                  {selectedTeam?.name || "No favorite team"}
                </span>
              </span>

              <ChevronRight
                className={`h-4 w-4 transition ${teamDropdownOpen ? "rotate-90" : ""}`}
              />
            </button>

            {teamDropdownOpen && (
              <div className="absolute z-50 mt-2 w-full rounded-xl border border-border-subtle bg-bg-surface shadow-xl">
                
                {/* SEARCH */}
                <div className="p-2 border-b border-border-subtle">
                  <input
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    placeholder="Search teams..."
                    className="w-full bg-transparent text-xs outline-none"
                  />
                </div>

                {/* OPTIONS */}
                <div className="max-h-56 overflow-y-auto">
                  <button
                    onClick={() => {
                      setFavoriteTeamId("");
                      setTeamDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-bg-elevated"
                  >
                    No favorite team
                  </button>

                  {filteredTeams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => {
                        setFavoriteTeamId(team.id);
                        setTeamDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-bg-elevated"
                    >
                      {team.logoUrl ? (
                        <img
                          src={team.logoUrl}
                          className="h-5 w-5 rounded-full object-contain"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-primary-500/20 flex items-center justify-center text-xs">
                          {team.shortName?.[0] ?? team.name[0]}
                        </div>
                      )}

                      {team.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Field>

        <div className="rounded-2xl border border-border-subtle bg-white/[0.03] p-3 text-xs leading-6 text-text-muted">
          Bio editing is not shown here because the current backend does not support saving
          bio from <code>/api/users/me</code>.
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary shadow-glow transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save changes
        </button>

        {saveMessage ? (
          <p className="text-xs leading-6 text-text-secondary">
            {saveMessage}
          </p>
        ) : null}
      </form>
    </GlassPanel>
  );
}

function AuthPromptModal({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-border-subtle bg-bg-surface p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border-subtle bg-white/[0.04]">
            <Users className="h-5 w-5 text-primary-300" />
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-border-subtle bg-white/[0.03] p-2 text-text-secondary transition hover:bg-white/[0.06] hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 className="mt-5 text-xl font-semibold text-text-primary">Sign in to follow users</h3>
        <p className="mt-2 text-sm leading-7 text-text-secondary">
          Create your SportsDeck account or sign back in to follow fans, personalize
          your feed, and keep up with the conversations you care about.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary shadow-glow transition hover:-translate-y-0.5"
          >
            Go to sign in
          </Link>

          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl border border-border-subtle bg-white/[0.04] px-5 py-3 text-sm font-medium text-text-primary transition hover:bg-white/[0.07]"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="min-h-screen bg-bg-main text-text-primary">
      <main className="px-6 py-8">
        <div className="mx-auto max-w-[1200px]">
          <GlassPanel className="p-10">
            <EmptyStateCard title={title} description={description} />
          </GlassPanel>
        </div>
      </main>
    </div>
  );
}

export default function UserProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const { isLoading: authLoading, user: authUser } = useAuth() as any;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [teams, setTeams] = useState<FavoriteTeam[]>([]);
  const [activity, setActivity] = useState<ActivityPoint[]>([]);
  const [followers, setFollowers] = useState<BasicUser[]>([]);
  const [following, setFollowing] = useState<BasicUser[]>([]);

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [followOverride, setFollowOverride] = useState<boolean | null>(null);

  useEffect(() => {
  if (authLoading) return;

  let active = true;

  async function load() {
    setPageLoading(true);
    setPageError(null);

    const [
      profileData,
      meData,
      activityData,
      teamsData,
      followersData,
      followingData,
    ] = await Promise.all([
      fetchJson<UserProfile>(`/api/users/${id}`),
      fetchJson<MeResponse>("/api/users/me"),
      fetchJson<ActivityApiItem[]>(`/api/users/${id}/activity`),
      fetchJson<TeamsResponse>("/api/teams"),
      fetchJson<BasicUser[]>(`/api/users/${id}/followers`),
      fetchJson<BasicUser[]>(`/api/users/${id}/following`),
    ]);

    if (!active) return;

    if (!profileData) {
      setProfile(null);
      setPageError("We could not load this profile.");
      setPageLoading(false);
      return;
    }

    setProfile(profileData);
    setMe(meData?.data ?? null);
    setTeams(extractTeams(teamsData));
    setActivity(normalizeActivity(activityData));
    setFollowers(Array.isArray(followersData) ? followersData : []);
    setFollowing(Array.isArray(followingData) ? followingData : []);

    setFollowOverride(null);

    setPageLoading(false);
  }

  load();

  return () => {
    active = false;
  };
}, [id, authLoading]);

  const isMe = !!profile && !!me && profile.id === me.id;
  const username = profile?.username ?? "Unknown";
  const effectiveIsFollowing = followOverride ?? !!profile?.isFollowing;

  const recentThreads = profile?.threads ?? [];
  const recentPosts = profile?.posts ?? [];
  const recentReplies = profile?.replies ?? [];

  const activityPoints = useMemo(() => activity, [activity]);

  async function handleFollowToggle() {
    if (!profile) return;

    const signedIn = !!me?.id || !!authUser?.id;
    if (!signedIn) {
      setShowAuthPrompt(true);
      return;
    }

    setFollowLoading(true);

    const wasFollowing = effectiveIsFollowing;
    const nextFollowing = !wasFollowing;

    setFollowOverride(nextFollowing);
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            _count: {
              ...prev._count,
              followers: Math.max(
                0,
                (prev._count?.followers ?? 0) + (wasFollowing ? -1 : 1)
              ),
            },
          }
        : prev
    );

    const res = await fetch(`/api/follow/${profile.id}`, {
      method: wasFollowing ? "DELETE" : "POST",
      credentials: "include",
    });

    if (!res.ok) {
      setFollowOverride(wasFollowing);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              _count: {
                ...prev._count,
                followers: Math.max(
                  0,
                  (prev._count?.followers ?? 0) + (wasFollowing ? 0 : -1) + (wasFollowing ? 1 : 0)
                ),
              },
            }
          : prev
      );
      setFollowLoading(false);
      return;
    }

    const followerDelta = nextFollowing ? 1 : -1;
    setFollowers((prev) => {
      if (!me) return prev;

      if (nextFollowing) {
        const exists = prev.some((item) => item.id === me.id);
        if (exists) return prev;
        return [
          {
            id: me.id,
            username: me.username,
            avatarUrl: me.avatarUrl,
          },
          ...prev,
        ];
      }

      return prev.filter((item) => item.id !== me.id);
    });

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            isFollowing: nextFollowing,
            _count: {
              ...prev._count,
              followers: Math.max(
                0,
                (prev._count?.followers ?? 0) + (followerDelta === 1 ? 0 : 0)
              ),
            },
          }
        : prev
    );

    setFollowLoading(false);
  }

  async function handleSaveSettings(payload: {
    username: string;
    avatarUrl: string;
    favoriteTeamId: string | null;
  }) {
    if (!me?.id) {
      setSaveMessage("You need to be signed in to update your profile.");
      return;
    }

    setSaveLoading(true);
    setSaveMessage(null);

    const body: Record<string, unknown> = {};

    if (payload.username) body.username = payload.username;
    if (payload.avatarUrl) body.avatarUrl = payload.avatarUrl;
    if (payload.favoriteTeamId) body.favoriteTeamId = payload.favoriteTeamId;

    if (Object.keys(body).length === 0) {
      setSaveMessage("Add at least one supported field before saving.");
      setSaveLoading(false);
      return;
    }

    const res = await fetch("/api/users/me", {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setSaveMessage(data?.error || "Unable to save profile settings.");
      setSaveLoading(false);
      return;
    }

    const updated = data?.data;

    setMe((prev) =>
      prev
        ? {
            ...prev,
            username: updated?.username ?? prev.username,
            avatarUrl: updated?.avatarUrl ?? prev.avatarUrl,
            favoriteTeam:
              teams.find((team) => team.id === payload.favoriteTeamId) ?? prev.favoriteTeam,
          }
        : prev
    );

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            username: updated?.username ?? prev.username,
            avatarUrl: updated?.avatarUrl ?? prev.avatarUrl,
            favoriteTeam:
              teams.find((team) => team.id === payload.favoriteTeamId) ?? null,
          }
        : prev
    );

    setSaveMessage("Profile updated successfully.");
    setSaveLoading(false);
  }

  async function handleShare() {
    const url =
      typeof window !== "undefined" ? window.location.href : `/users/${id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${username} on SportsDeck`,
          text: `Check out ${username}'s profile on SportsDeck.`,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      setSaveMessage("Profile link copied to clipboard.");
    } catch {
      setSaveMessage("Could not share this profile right now.");
    }
  }

  const statFollowers =
    followers.length > 0 ? followers.length : (profile?._count?.followers ?? 0);
  const statFollowing =
    following.length > 0 ? following.length : (profile?._count?.following ?? 0);

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-bg-main text-text-primary">
        <main className="px-6 py-6">
          <div className="mx-auto max-w-[1200px] space-y-6">
            <div className="animate-pulse rounded-[28px] border border-border-subtle bg-bg-surface p-8 shadow-card">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 rounded-2xl bg-white/10" />
                <div className="flex-1 space-y-3">
                  <div className="h-8 w-52 rounded-xl bg-white/10" />
                  <div className="h-4 w-36 rounded-xl bg-white/10" />
                  <div className="h-4 w-full max-w-xl rounded-xl bg-white/10" />
                  <div className="h-4 w-full max-w-lg rounded-xl bg-white/10" />
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="animate-pulse rounded-3xl border border-border-subtle bg-bg-surface p-6 shadow-card">
                <div className="h-6 w-40 rounded-xl bg-white/10" />
                <div className="mt-5 h-40 rounded-2xl bg-white/10" />
              </div>
              <div className="animate-pulse rounded-3xl border border-border-subtle bg-bg-surface p-6 shadow-card">
                <div className="h-6 w-32 rounded-xl bg-white/10" />
                <div className="mt-5 space-y-3">
                  <div className="h-14 rounded-2xl bg-white/10" />
                  <div className="h-14 rounded-2xl bg-white/10" />
                  <div className="h-14 rounded-2xl bg-white/10" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (pageError || !profile) {
    return (
      <ErrorState
        title="Profile unavailable"
        description={pageError ?? "This profile could not be loaded right now."}
      />
    );
  }

  return (
    <div className="min-h-screen bg-bg-main text-text-primary">
      <main className="px-6 py-6 md:px-8">
        <div className="mx-auto max-w-[1280px] space-y-6">
          <ProfileHero
            profile={profile}
            isMe={isMe}
            isFollowing={effectiveIsFollowing}
            followLoading={followLoading}
            onFollowToggle={handleFollowToggle}
            onShare={handleShare}
          />

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<Users className="h-5 w-5 text-primary-300" />}
              label="Followers"
              value={formatCompactNumber(statFollowers)}
              helper="Public follower count"
            />
            <StatCard
              icon={<UserPlus className="h-5 w-5 text-accent-300" />}
              label="Following"
              value={formatCompactNumber(statFollowing)}
              helper="Accounts this user follows"
            />
            <StatCard
              icon={<MessageSquare className="h-5 w-5 text-brand-300" />}
              label="Recent threads"
              value={formatCompactNumber(recentThreads.length)}
              helper="Returned by the profile endpoint"
            />
            <StatCard
              icon={<Flame className="h-5 w-5 text-orange-300" />}
              label="Recent activity"
              value={formatCompactNumber(recentPosts.length + recentReplies.length)}
              helper="Recent posts plus replies"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
            <div className="space-y-6">
              <ActivityOverviewCard points={activityPoints} />

              <ThreadShowcaseCard threads={recentThreads} />

              <ContentTimelineCard
                title="Recent posts"
                eyebrow="Posts"
                icon={<MessageSquare className="h-3.5 w-3.5" />}
                emptyTitle="No recent posts"
                emptyDescription="Once this user writes public posts, they will appear here."
                items={recentPosts.map((post) => ({
                  id: post.id,
                  href: `/community/threads/${post.threadId}`,
                  title: `Post in thread ${post.threadId.slice(0, 8)}`,
                  body: truncateText(post.content, 180),
                  meta: timeAgo(post.createdAt),
                }))}
              />

              <ContentTimelineCard
                title="Recent replies"
                eyebrow="Replies"
                icon={<ArrowRight className="h-3.5 w-3.5" />}
                emptyTitle="No recent replies"
                emptyDescription="Once this user replies in discussions, they will appear here."
                items={recentReplies.map((reply) => ({
                  id: reply.id,
                  href: `/posts/${reply.postId}`,
                  title: `Reply on post ${reply.postId.slice(0, 8)}`,
                  body: truncateText(reply.content, 180),
                  meta: timeAgo(reply.createdAt),
                }))}
              />
            </div>

            <aside className="space-y-6">
              {isMe && me ? (
                <>
                  <ProfileSettingsCard
                    key={profile.id}
                    profile={profile}
                    teams={teams}
                    saving={saveLoading}
                    saveMessage={saveMessage}
                    onSave={handleSaveSettings}
                  />
                  <OwnerInsightsCard me={me} />
                </>
              ) : null}

              <ProfileStrengthCard
                profile={profile}
                recentThreadsCount={recentThreads.length}
                recentPostsCount={recentPosts.length}
                recentRepliesCount={recentReplies.length}
              />

              <PeopleListCard
                title="Followers"
                eyebrow="Community"
                icon={<Users className="h-3.5 w-3.5" />}
                users={followers}
                emptyTitle="No followers yet"
                emptyDescription="Once people follow this account, they will appear here."
              />

              <PeopleListCard
                title="Following"
                eyebrow="Network"
                icon={<UserPlus className="h-3.5 w-3.5" />}
                users={following}
                emptyTitle="Not following anyone yet"
                emptyDescription="Accounts followed by this user will appear here."
              />
            </aside>
          </section>
        </div>
      </main>

      {showAuthPrompt ? <AuthPromptModal onClose={() => setShowAuthPrompt(false)} /> : null}
    </div>
  );
}