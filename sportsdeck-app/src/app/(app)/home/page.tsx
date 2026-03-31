"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCheck,
  ChevronRight,
  Clock3,
  Flame,
  LayoutGrid,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  Vote,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";

/* =========================
   Types
========================= */

type FeedThread = {
  id: string;
  title: string;
  author: {
    id: string;
    username?: string | null;
    avatarUrl?: string | null;
  };
  tags: { id: string; name: string }[];
  replies: number;
};

type PollOption = {
  id: string;
  text?: string;
  label?: string;
  optionText?: string;
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

type ThreadTag = {
  tag: Tag;
};

type Me = {
  id: string;
  email?: string;
  username?: string | null;
  avatarUrl?: string | null;
  role?: string;
  favoriteTeam?: {
    id: string;
    name: string;
    shortName?: string;
    logoUrl?: string;
  } | null;
  _count?: {
    followers?: number;
    following?: number;
    threads?: number;
    posts?: number;
    replies?: number;
  };
};

type MatchTeam = {
  id?: string;
  name?: string;
  shortName?: string;
  logoUrl?: string;
};

type MatchItem = {
  id: string;
  status?: string;
  venue?: string;
  matchDate?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  homeTeam?: MatchTeam | null;
  awayTeam?: MatchTeam | null;
  thread?: {
    id: string;
  } | null;
};

type StandingItem = {
  id: string;
  position?: number;
  points?: number;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  team?: {
    id?: string;
    name?: string;
    shortName?: string;
    logoUrl?: string;
  } | null;
};

type LandingTab = "for-you" | "conversations" | "polls" | "activity";

/* =========================
   Helpers
========================= */

function normalizeThread(thread: any) {
  return {
    ...thread,
    tags: (thread.tags as ThreadTag[])
      ?.map((t) => t.tag)
      .filter(Boolean),
  };
}

function timeAgo(input?: string) {
  if (!input) return "Just now";

  const date = new Date(input).getTime();
  if (Number.isNaN(date)) return "Recently";

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
    const hours = Math.max(1, Math.floor(diff / hour));
    return `${hours}h ago`;
  }

  const days = Math.max(1, Math.floor(diff / day));
  return `${days}d ago`;
}

function formatDateLabel(input?: string) {
  if (!input) return "TBD";

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "TBD";

  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCompactDate(input?: string) {
  if (!input) return "Today";

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "Today";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getInitials(name?: string | null) {
  if (!name) return "SD";

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizePollOptions(options?: PollOption[]) {
  return (options ?? []).map((option) => ({
    ...option,
    text: option.text ?? option.label ?? option.optionText ?? "Option",
  }));
}

function getFeedHeadline(feed: FeedItem[], me: Me | null) {
  const unread = feed.filter((item) => !item.isRead).length;
  const topThread = feed.find((item) => item.type === "thread" && item.thread)?.thread;
  const topPoll = feed.find((item) => item.type === "poll" && item.poll)?.poll;
  const favoriteTeam = me?.favoriteTeam?.name;

  if (topThread?.title) return topThread.title;
  if (topPoll?.question) return topPoll.question;

  if (favoriteTeam) {
    return `${favoriteTeam} fans are driving the conversation today`;
  }

  if (unread > 0) {
    return `${unread} fresh updates are waiting in your SportsDeck feed`;
  }

  return "Everything happening across your SportsDeck universe";
}

function getFeedSubheadline(feed: FeedItem[], me: Me | null, tags: Tag[]) {
  const unread = feed.filter((item) => !item.isRead).length;
  const activityCount = feed.filter((item) => item.type === "activity").length;
  const leadingTags = tags.slice(0, 3).map((tag) => `#${tag.name}`).join(", ");
  const name = me?.username ?? "there";

  const pieces = [
    `Welcome back, ${name}.`,
    unread > 0 ? `${unread} unread updates are ready for you.` : "Your feed is all caught up.",
    activityCount > 0 ? `${activityCount} grouped activity items are keeping the noise low.` : "",
    leadingTags ? `Trending now: ${leadingTags}.` : "",
  ].filter(Boolean);

  return pieces.join(" ");
}

function getMatchStatusTone(status?: string) {
  const normalized = (status ?? "").toLowerCase();

  if (
    normalized.includes("live") ||
    normalized.includes("in_play") ||
    normalized.includes("in play")
  ) {
    return {
      label: "Live",
      className:
        "border-brand-400/25 bg-brand-400/10 text-brand-300",
    };
  }

  if (
    normalized.includes("finished") ||
    normalized.includes("full") ||
    normalized.includes("ft")
  ) {
    return {
      label: "Final",
      className:
        "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    };
  }

  if (
    normalized.includes("scheduled") ||
    normalized.includes("timed") ||
    normalized.includes("not_started")
  ) {
    return {
      label: "Upcoming",
      className:
        "border-primary-400/20 bg-primary-400/10 text-primary-300",
    };
  }

  return {
    label: status || "Match",
    className: "border-border-subtle bg-white/[0.03] text-text-secondary",
  };
}

function formatActivity(meta?: FeedItem["meta"]) {
  if (!meta) return "New activity across your network";

  if (meta.eventType === "post_reply") {
    return meta.count && meta.count > 1
      ? `${meta.count} new replies on threads you follow`
      : "A new reply landed on a thread you follow";
  }

  if (meta.eventType === "thread_created") {
    return meta.count && meta.count > 1
      ? `${meta.count} new threads were created`
      : "A new thread was created";
  }

  if (meta.eventType === "poll_created") {
    return meta.count && meta.count > 1
      ? `${meta.count} new polls are gaining traction`
      : "A new poll is gaining traction";
  }

  return "Fresh activity is rolling through your feed";
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) return null;

    return (await res.json()) as T;
  } catch (error) {
    console.error(`Failed to fetch ${url}`, error);
    return null;
  }
}

function extractStandingsResponse(value: unknown): StandingItem[] {
  if (Array.isArray(value)) return value as StandingItem[];

  if (
    value &&
    typeof value === "object" &&
    "standings" in value &&
    Array.isArray((value as any).standings)
  ) {
    return (value as any).standings;
  }

  if (
    value &&
    typeof value === "object" &&
    "data" in value &&
    Array.isArray((value as any).data)
  ) {
    return (value as any).data;
  }

  return [];
}

function extractData<T>(value: any): T | null {
  if (!value) return null;
  if ("data" in value) return value.data;
  return value;
}

function threadsToFeed(threads: any[]): FeedItem[] {
  return threads.map((thread) => ({
    id: `fallback-${thread.id}`,
    type: "thread",
    isRead: true,
    createdAt: thread.createdAt,
    thread: {
      id: thread.id,
      title: thread.title,
      author: thread.author,
      tags: thread.tags ?? [],
      replies: thread._count?.posts ?? 0,
    },
  }));
}

/* =========================
   Small UI building blocks
========================= */

function SectionHeader({
  icon,
  eyebrow,
  title,
  actionHref,
  actionLabel,
}: {
  icon?: React.ReactNode;
  eyebrow?: string;
  title: string;
  actionHref?: string;
  actionLabel?: string;
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

        <h2 className="text-lg font-semibold text-white md:text-xl">{title}</h2>
      </div>

      {actionHref && actionLabel ? (
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
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm"
      ? "h-9 w-9 text-xs"
      : size === "lg"
        ? "h-14 w-14 text-base"
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
        "flex items-center justify-center rounded-2xl border border-border-subtle bg-gradient-primary font-semibold text-white shadow-soft",
        sizeClass
      )}
    >
      {getInitials(name)}
    </div>
  );
}

/* =========================
   Hero
========================= */

function LandingHero({
  me,
  feed,
  tags,
  unreadCount,
  totalCount,
}: {
  me: Me | null;
  feed: FeedItem[];
  tags: Tag[];
  unreadCount: number;
  totalCount: number;
}) {
  const headline = getFeedHeadline(feed, me);
  const subheadline = getFeedSubheadline(feed, me, tags);
  const quickTags = tags.slice(0, 3);

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-border-subtle bg-bg-surface shadow-card">
      <div className="absolute inset-0 bg-gradient-glow opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.12),transparent_30%)]" />
      <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />

      <div className="relative grid gap-6 px-5 py-6 md:px-7 md:py-7 xl:grid-cols-[minmax(0,1.35fr)_360px] xl:items-stretch">
        <div className="flex flex-col justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-400/20 bg-accent-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-300">
              <Sparkles className="h-3.5 w-3.5" />
              Daily Digest
            </div>

            <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-white md:text-4xl xl:text-[2.55rem] xl:leading-[1.05]">
              {headline}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary md:text-base">
              {subheadline}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/feed"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-white shadow-glow transition duration-200 hover:-translate-y-0.5"
              >
                Explore your feed
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/community"
                className="inline-flex items-center gap-2 rounded-2xl border border-border-subtle bg-white/[0.04] px-5 py-3 text-sm font-medium text-text-primary transition hover:bg-white/[0.07]"
              >
                Open community
                <LayoutGrid className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {quickTags.length > 0 ? (
              quickTags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/community/tags/${tag.id}`}
                  className="rounded-full border border-border-subtle bg-white/[0.04] px-3 py-2 text-xs font-medium text-text-secondary transition hover:bg-white/[0.07] hover:text-white"
                >
                  #{tag.name}
                </Link>
              ))
            ) : (
              <span className="rounded-full border border-border-subtle bg-white/[0.04] px-3 py-2 text-xs font-medium text-text-secondary">
                Personalized for you
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
          <HeroStatCard
            icon={<Bell className="h-4 w-4 text-accent-300" />}
            label="Unread updates"
            value={String(unreadCount)}
            helper="Fresh activity waiting"
          />

          <HeroStatCard
            icon={<MessageSquare className="h-4 w-4 text-primary-300" />}
            label="Feed items"
            value={String(totalCount)}
            helper="Personalized feed volume"
          />

          <HeroStatCard
            icon={<Users className="h-4 w-4 text-brand-300" />}
            label="Favorite team"
            value={me?.favoriteTeam?.shortName || me?.favoriteTeam?.name || "Not set"}
            helper="Set in your profile"
          />

          <HeroStatCard
            icon={<TrendingUp className="h-4 w-4 text-primary-300" />}
            label="Trending tags"
            value={String(tags.length)}
            helper="Live conversation signals"
          />
        </div>
      </div>
    </section>
  );
}

function HeroStatCard({
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
    <div className="rounded-2xl border border-border-subtle bg-white/[0.04] p-4 shadow-inner">
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]">
          {icon}
        </span>
      </div>

      <p className="mt-4 text-xs uppercase tracking-[0.14em] text-text-muted">
        {label}
      </p>
      <p className="mt-1 truncate text-lg font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-text-secondary">{helper}</p>
    </div>
  );
}

/* =========================
   Feature rail
========================= */

function FeatureRail({
  me,
  tags,
  unreadCount,
}: {
  me: Me | null;
  tags: Tag[];
  unreadCount: number;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <FeatureCard
        icon={<ShieldCheck className="h-4 w-4 text-accent-300" />}
        title="Clean signal, less noise"
        description="Grouped activity and tailored feed cards help you scan everything faster without losing the important discussions."
        accent="accent"
      />

      <FeatureCard
        icon={<Trophy className="h-4 w-4 text-brand-300" />}
        title={me?.favoriteTeam?.name ? `${me.favoriteTeam.name} focus` : "Personalized sports focus"}
        description={
          me?.favoriteTeam?.name
            ? `Your landing page is ready to spotlight threads, reactions, and momentum around ${me.favoriteTeam.name}.`
            : "Once a favorite team is set, the home experience becomes even more relevant."
        }
        accent="brand"
      />

      <FeatureCard
        icon={<Flame className="h-4 w-4 text-primary-300" />}
        title={`${Math.max(tags.length, unreadCount)} reasons to jump in`}
        description="Trending tags, fresh conversations, and live poll snapshots make the home page feel active from the first glance."
        accent="primary"
      />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: "primary" | "accent" | "brand";
}) {
  const accentClass =
    accent === "brand"
      ? "from-brand-500/15 to-transparent"
      : accent === "accent"
        ? "from-accent-500/15 to-transparent"
        : "from-primary-500/15 to-transparent";

  return (
    <GlassPanel className="relative overflow-hidden p-5">
      <div className={cx("pointer-events-none absolute inset-0 bg-gradient-to-br", accentClass)} />
      <div className="relative">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border-subtle bg-white/[0.04]">
          {icon}
        </div>

        <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
      </div>
    </GlassPanel>
  );
}

/* =========================
   Match center
========================= */

function MatchCenter({
  matches,
  loading,
  available,
}: {
  matches: MatchItem[];
  loading: boolean;
  available: boolean;
}) {
  return (
    <GlassPanel className="p-5 md:p-6">
      <SectionHeader
        icon={<CalendarDays className="h-3.5 w-3.5" />}
        eyebrow="Live Match Center"
        title="Upcoming and recent matches"
        actionHref="/matches"
        actionLabel="View all matches"
      />

      {loading ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-border-subtle bg-bg-card p-4"
            >
              <div className="h-4 w-24 rounded bg-white/10" />
              <div className="mt-5 h-8 w-full rounded bg-white/10" />
              <div className="mt-5 h-3 w-1/2 rounded bg-white/5" />
              <div className="mt-4 h-9 w-full rounded bg-white/10" />
            </div>
          ))}
        </div>
      ) : matches.length > 0 ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {matches.slice(0, 6).map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <EmptyStateCard
          title={available ? "No match data to show right now" : "Match routes are not available yet"}
          description={
            available
              ? "Once match data is returned from the backend, this section will automatically populate."
              : "This landing page is ready for match data. If you add a matches endpoint later, the UI is already wired for it."
          }
        />
      )}
    </GlassPanel>
  );
}

function MatchCard({ match }: { match: MatchItem }) {
  const statusTone = getMatchStatusTone(match.status);

  return (
    <article className="group rounded-2xl border border-border-subtle bg-bg-card/70 p-4 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-primary-500/30">
      <div className="flex items-center justify-between gap-3">
        <span
          className={cx(
            "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
            statusTone.className
          )}
        >
          {statusTone.label}
        </span>

        <span className="text-xs text-text-muted">{formatCompactDate(match.matchDate)}</span>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamMini team={match.homeTeam} align="left" />
        <div className="min-w-[68px] text-center">
          <div className="text-lg font-semibold text-white">
            {match.homeScore ?? "-"} <span className="text-text-muted">:</span> {match.awayScore ?? "-"}
          </div>
        </div>
        <TeamMini team={match.awayTeam} align="right" />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 text-xs text-text-muted">
        <span className="truncate">{match.venue || "Venue TBA"}</span>
        <span>{formatDateLabel(match.matchDate)}</span>
      </div>

      <div className="mt-4">
        {match.thread?.id ? (
          <Link
            href={`/matches/${match.id}/thread`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary-500/20 bg-primary-500/10 px-3 py-2.5 text-sm font-medium text-primary-300 transition hover:bg-primary-500/15"
          >
            Join discussion
            <MessageSquare className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href="/matches"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border-subtle bg-white/[0.03] px-3 py-2.5 text-sm font-medium text-text-secondary transition hover:bg-white/[0.06] hover:text-white"
          >
            View details
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </article>
  );
}

function TeamMini({
  team,
  align,
}: {
  team?: MatchTeam | null;
  align: "left" | "right";
}) {
  const content = (
    <>
      {team?.logoUrl ? (
        <img
          src={team.logoUrl}
          alt={team?.shortName || team?.name || "Team"}
          className="h-10 w-10 rounded-xl border border-border-subtle object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-white/[0.04] text-xs font-semibold text-white">
          {getInitials(team?.shortName || team?.name || "TM")}
        </div>
      )}

      <div className={cx("min-w-0", align === "right" ? "text-right" : "text-left")}>
        <p className="truncate text-sm font-semibold text-white">
          {team?.shortName || team?.name || "Team"}
        </p>
        <p className="truncate text-xs text-text-muted">{team?.name || "Club"}</p>
      </div>
    </>
  );

  return (
    <div
      className={cx(
        "flex items-center gap-2 min-w-0",
        align === "right" ? "justify-end" : "justify-start"
      )}
    >
      {align === "right" ? (
        <>
          <div className="min-w-0">{content.props.children[1]}</div>
          {content.props.children[0]}
        </>
      ) : (
        <>
          {content.props.children[0]}
          <div className="min-w-0">{content.props.children[1]}</div>
        </>
      )}
    </div>
  );
}

/* =========================
   Main feed
========================= */

function LandingTabs({
  active,
  onChange,
}: {
  active: LandingTab;
  onChange: (tab: LandingTab) => void;
}) {
  const tabs: Array<{ key: LandingTab; label: string }> = [
    { key: "for-you", label: "For You" },
    { key: "conversations", label: "Conversations" },
    { key: "polls", label: "Polls" },
    { key: "activity", label: "Activity" },
  ];

  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-surface/80 p-2 shadow-soft backdrop-blur-xs">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = active === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={cx(
                "rounded-xl px-4 py-2 text-sm font-medium transition duration-200",
                isActive
                  ? "bg-gradient-primary text-white shadow-glow"
                  : "bg-white/[0.03] text-text-secondary hover:bg-white/[0.06] hover:text-white"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FeedShell({
  feed,
  filteredFeed,
  loading,
  activeTab,
  onTabChange,
  onMarkRead,
}: {
  feed: FeedItem[];
  filteredFeed: FeedItem[];
  loading: boolean;
  activeTab: LandingTab;
  onTabChange: (tab: LandingTab) => void;
  onMarkRead: (id: string) => void;
}) {
  return (
    <GlassPanel className="p-5 md:p-6">
      <SectionHeader
        icon={<Sparkles className="h-3.5 w-3.5" />}
        eyebrow="Smart Feed"
        title="The pulse of SportsDeck"
        actionHref="/feed"
        actionLabel="Open full feed"
      />

      <div className="mt-5">
        <LandingTabs active={activeTab} onChange={onTabChange} />
      </div>

      <div className="mt-5">
        {loading ? (
          <FeedSkeleton />
        ) : filteredFeed.length === 0 ? (
          <EmptyStateCard
            title="Nothing to show in this section yet"
            description="As conversations, polls, and activity roll in, this area will update automatically."
          />
        ) : (
          <div className="grid gap-4">
            {filteredFeed.map((item) => {
              if (item.type === "thread" && item.thread) {
                return (
                  <ThreadFeedCard
                    key={item.id}
                    item={item}
                    onMarkRead={onMarkRead}
                  />
                );
              }

              if (item.type === "poll" && item.poll) {
                return (
                  <PollFeedCard
                    key={item.id}
                    item={item}
                    onMarkRead={onMarkRead}
                  />
                );
              }

              return (
                <ActivityCard
                  key={item.id}
                  item={item}
                  onMarkRead={onMarkRead}
                />
              );
            })}
          </div>
        )}
      </div>

      {!loading && feed.length > 0 ? (
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-border-subtle bg-white/[0.03] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">Want the deeper thread view?</p>
            <p className="mt-1 text-xs text-text-muted">
              Open a thread, jump into replies, or continue the discussion in the dedicated community experience.
            </p>
          </div>

          <Link
            href="/community"
            className="ml-4 inline-flex shrink-0 items-center gap-2 rounded-xl border border-border-subtle bg-white/[0.04] px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-white/[0.07]"
          >
            Community
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}
    </GlassPanel>
  );
}

function FeedSkeleton() {
  return (
    <div className="grid gap-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-soft"
        >
          <div className="h-4 w-28 rounded bg-white/10" />
          <div className="mt-4 h-6 w-2/3 rounded bg-white/10" />
          <div className="mt-3 h-4 w-full rounded bg-white/5" />
          <div className="mt-2 h-4 w-4/5 rounded bg-white/5" />
          <div className="mt-5 flex gap-2">
            <div className="h-8 w-24 rounded bg-white/10" />
            <div className="h-8 w-20 rounded bg-white/10" />
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

  const normalizedThread = normalizeThread(thread);

  return (
    <article
      className={cx(
        "group relative overflow-hidden rounded-2xl border p-5 shadow-soft transition duration-200 hover:-translate-y-0.5",
        item.isRead
          ? "border-border-subtle bg-bg-card/70"
          : "border-primary-500/30 bg-bg-surface shadow-glow"
      )}
    >
      {!item.isRead ? (
        <div className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-accent-400 shadow-[0_0_16px_rgba(34,211,238,0.8)]" />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-300">
          <MessageSquare className="h-3.5 w-3.5" />
          Conversation
        </span>

        <span className="text-xs text-text-muted">{timeAgo(item.createdAt)}</span>

        {!item.isRead ? (
          <span className="rounded-full border border-accent-400/20 bg-accent-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-300">
            New
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link
            href={`/community/threads/${thread.id}`}
            onClick={() => {
              if (!item.isRead) onMarkRead(item.id);
            }}
            className="inline-block"
          >
            <h3 className="text-lg font-semibold leading-snug text-white transition group-hover:text-primary-300">
              {thread.title}
            </h3>
          </Link>

          <div className="mt-3 flex items-center gap-3">
            <Avatar
              name={thread.author.username || "User"}
              src={thread.author.avatarUrl}
              size="sm"
            />

            <div className="min-w-0">
              <p className="truncate text-sm text-text-primary">
                {thread.author.username || "SportsDeck User"}
              </p>
              <p className="text-xs text-text-muted">Discussion starter</p>
            </div>
          </div>
        </div>

        <div className="shrink-0 rounded-2xl border border-border-subtle bg-white/[0.03] px-3 py-3 text-center">
          <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted">
            Replies
          </p>
          <p className="mt-1 text-lg font-semibold text-white">{thread.replies}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {normalizedThread.tags.length > 0 ? (
          normalizedThread.tags.slice(0, 5).map((tag) => (
            <Link
              key={tag.id}
              href={`/community/tags/${tag.id}`}
              className="rounded-full border border-border-subtle bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-text-secondary transition hover:bg-white/[0.06] hover:text-white"
            >
              #{tag.name}
            </Link>
          ))
        ) : (
          <span className="rounded-full border border-border-subtle bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-text-secondary">
            General discussion
          </span>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs text-text-muted">
          {item.meta?.count && item.meta.count > 1
            ? `${item.meta.count} grouped events around this thread`
            : "Fresh discussion momentum"}
        </p>

        <Link
          href={`/community/threads/${thread.id}`}
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

  const options = normalizePollOptions(poll.options);
  const totalVotes = options.reduce((sum, option) => sum + (option._count?.votes ?? 0), 0);

  return (
    <article
      className={cx(
        "group relative overflow-hidden rounded-2xl border p-5 shadow-soft transition duration-200 hover:-translate-y-0.5",
        item.isRead
          ? "border-border-subtle bg-bg-card/70"
          : "border-brand-400/30 bg-bg-surface"
      )}
    >
      {!item.isRead ? (
        <div className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-brand-400 shadow-[0_0_16px_rgba(251,146,60,0.8)]" />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-300">
          <Vote className="h-3.5 w-3.5" />
          Poll
        </span>

        <span className="text-xs text-text-muted">{timeAgo(item.createdAt)}</span>

        {!item.isRead ? (
          <span className="rounded-full border border-brand-400/20 bg-brand-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-300">
            New
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold leading-snug text-white">{poll.question}</h3>
        <p className="mt-2 text-sm text-text-secondary">
          {poll.isClosed ? "Poll closed" : "Poll open"} · {totalVotes} total votes
        </p>
      </div>

      <div className="mt-4 space-y-2.5">
        {options.slice(0, 4).map((option) => {
          const votes = option._count?.votes ?? 0;
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

          return (
            <div
              key={option.id}
              className="rounded-xl border border-border-subtle bg-white/[0.03] p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="truncate text-sm text-text-primary">{option.text}</span>
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
        <p className="text-xs text-text-muted">Quick sentiment snapshot from the community</p>

        {!item.isRead ? (
          <button
            onClick={() => onMarkRead(item.id)}
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-300 transition hover:text-brand-200"
          >
            Mark read
            <CheckCheck className="h-4 w-4" />
          </button>
        ) : (
          <span className="text-xs font-medium text-text-muted">Already read</span>
        )}
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
      className={cx(
        "rounded-2xl border p-5 shadow-soft transition duration-200 hover:-translate-y-0.5",
        item.isRead
          ? "border-border-subtle bg-bg-card/70"
          : "border-accent-400/25 bg-bg-surface"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-300">
            <Bell className="h-3.5 w-3.5" />
            Activity
          </div>

          <h3 className="mt-3 text-base font-semibold text-white">
            {formatActivity(item.meta)}
          </h3>

          <p className="mt-2 text-sm text-text-secondary">
            Grouped activity keeps your landing page clean while still surfacing what matters.
          </p>

          <div className="mt-4 flex items-center gap-3 text-xs text-text-muted">
            <span>{timeAgo(item.createdAt)}</span>
            {item.meta?.count && item.meta.count > 1 ? (
              <>
                <span className="h-1 w-1 rounded-full bg-text-muted" />
                <span>{item.meta.count} events</span>
              </>
            ) : null}
          </div>
        </div>

        {!item.isRead ? (
          <button
            onClick={() => onMarkRead(item.id)}
            className="rounded-xl border border-border-subtle bg-white/[0.03] px-3 py-2 text-sm text-text-secondary transition hover:bg-white/[0.06] hover:text-white"
          >
            Mark read
          </button>
        ) : null}
      </div>
    </article>
  );
}

/* =========================
   Sidebar
========================= */

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

function Sidebar({
  me,
  tags,
  feed,
  standings,
  standingsLoading,
  standingsAvailable,
}: {
  me: Me | null;
  tags: Tag[];
  feed: FeedItem[];
  standings: StandingItem[];
  standingsLoading: boolean;
  standingsAvailable: boolean;
}) {
  const recentActivity = feed.filter((item) => item.type === "activity").slice(0, 4);
  const quickPoll = feed.find((item) => item.type === "poll" && item.poll)?.poll ?? null;
  const followSuggestions = feed
    .filter((item) => item.thread?.author)
    .map((item) => item.thread!.author)
    .filter(
      (author, index, arr) =>
        author?.id &&
        arr.findIndex((entry) => entry.id === author.id) === index
    )
    .slice(0, 3);

  return (
    <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
      <SidebarCard
        icon={<Users className="h-4 w-4 text-accent-300" />}
        title="Your Home Base"
      >
        <div className="flex items-center gap-3">
          <Avatar name={me?.username || "SportsDeck User"} src={me?.avatarUrl} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {me?.username || "SportsDeck User"}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              {me?.favoriteTeam?.name
                ? `Favorite team: ${me.favoriteTeam.name}`
                : "Set a favorite team for a more tailored home feed"}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <MiniMetric
            label="Followers"
            value={String(me?._count?.followers ?? 0)}
          />
          <MiniMetric
            label="Following"
            value={String(me?._count?.following ?? 0)}
          />
          <MiniMetric
            label="Threads"
            value={String(me?._count?.threads ?? 0)}
          />
        </div>

        <Link
          href={`/users/${me?.id}`}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border-subtle bg-white/[0.03] px-3 py-2.5 text-sm font-medium text-text-primary transition hover:bg-white/[0.06]"
        >
          View profile
          <ArrowRight className="h-4 w-4" />
        </Link>
      </SidebarCard>

      <SidebarCard
        icon={<Trophy className="h-4 w-4 text-brand-300" />}
        title="Standings Snapshot"
      >
        {standingsLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : standings.length > 0 ? (
          <div className="space-y-2">
            {standings.slice(0, 5).map((entry, index) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-xl border border-border-subtle bg-white/[0.03] px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-5 text-xs font-semibold text-text-muted">
                    {entry.position ?? index + 1}
                  </span>

                  {entry.team?.logoUrl ? (
                    <img
                      src={entry.team.logoUrl}
                      alt={entry.team.shortName || entry.team.name || "Team"}
                      className="h-8 w-8 rounded-lg border border-border-subtle object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-white/[0.04] text-[10px] font-semibold text-white">
                      {getInitials(entry.team?.shortName || entry.team?.name || "TM")}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {entry.team?.shortName || entry.team?.name || "Team"}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      {entry.played ?? 0} played
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{entry.points ?? 0}</p>
                  <p className="text-[11px] text-text-muted">pts</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-6 text-text-secondary">
            {standingsAvailable
              ? "No standings available right now."
              : "This block is ready for standings data once the backend route is exposed."}
          </p>
        )}
      </SidebarCard>

      <SidebarCard
        icon={<Flame className="h-4 w-4 text-brand-300" />}
        title="Trending Topics"
      >
        {tags.length === 0 ? (
          <p className="text-sm text-text-secondary">No trending tags yet.</p>
        ) : (
          <div className="space-y-2">
            {tags.slice(0, 6).map((tag) => (
              <Link
                key={tag.id}
                href={`/community/tags/${tag.id}`}
                className="flex items-center justify-between rounded-xl border border-border-subtle bg-white/[0.03] px-3 py-3 transition hover:bg-white/[0.06]"
              >
                <div>
                  <p className="text-sm font-medium text-white">#{tag.name}</p>
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
        {!quickPoll ? (
          <p className="text-sm text-text-secondary">No active poll in your feed yet.</p>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium leading-6 text-white">{quickPoll.question}</p>
              <p className="mt-1 text-xs text-text-muted">
                {normalizePollOptions(quickPoll.options).length} options available
              </p>
            </div>

            <div className="space-y-2">
              {normalizePollOptions(quickPoll.options)
                .slice(0, 3)
                .map((option) => (
                  <div
                    key={option.id}
                    className="rounded-xl border border-border-subtle bg-white/[0.03] px-3 py-2 text-sm text-text-secondary"
                  >
                    {option.text}
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
          <p className="text-sm text-text-secondary">No recent grouped activity yet.</p>
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
                <p className="mt-1 text-xs text-text-muted">{timeAgo(item.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </SidebarCard>

      <SidebarCard
        icon={<UserPlus className="h-4 w-4 text-primary-300" />}
        title="Who to Watch"
      >
        {followSuggestions.length === 0 ? (
          <p className="text-sm text-text-secondary">
            Once more discussion authors appear in your feed, this section will populate.
          </p>
        ) : (
          <div className="space-y-3">
            {followSuggestions.map((author) => (
              <div
                key={author.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-white/[0.03] p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={author.username || "User"} src={author.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {author.username || "SportsDeck User"}
                    </p>
                    <p className="text-xs text-text-muted">Active contributor</p>
                  </div>
                </div>

                <Link
                  href={`/users/${author.id}`}
                  className="rounded-lg border border-border-subtle bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-text-primary transition hover:bg-white/[0.08]"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </SidebarCard>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-white/[0.03] px-3 py-2.5 text-center">
      <p className="text-sm font-semibold text-white">{value}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-text-muted">
        {label}
      </p>
    </div>
  );
}

/* =========================
   Empty / fallback
========================= */

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

      <p className="mt-4 text-base font-medium text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
    </div>
  );
}

/* =========================
   Page
========================= */

export default function LandingPage() {
  const [me, setMe] = useState<Me | null>(null);

  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [standings, setStandings] = useState<StandingItem[]>([]);

  const [feedLoading, setFeedLoading] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [standingsLoading, setStandingsLoading] = useState(true);
  const [meLoading, setMeLoading] = useState(true);

  const [matchesRouteAvailable, setMatchesRouteAvailable] = useState(true);
  const [standingsRouteAvailable, setStandingsRouteAvailable] = useState(true);

  const [tab, setTab] = useState<LandingTab>("for-you");

  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login?redirect=/home");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (isLoading) return;

    let active = true;

    async function load() {
      setFeedLoading(true);
      setTagsLoading(true);
      setMatchesLoading(true);
      setStandingsLoading(true);
      setMeLoading(true);

      const [
        meData,
        feedData,
        tagsData,
        matchesData,
        standingsData,
        fallbackThreadsData,
      ] = await Promise.all([
        fetchJson<Me>("/api/users/me"),
        fetchJson<FeedItem[] | { feed?: FeedItem[] }>("/api/feed?limit=24"),
        fetchJson<Tag[] | { tags?: Tag[] }>("/api/tags"),
        fetchJson<
          MatchItem[] | { matches?: MatchItem[] } | { data?: MatchItem[] }
        >("/api/matches?limit=6"),
        fetchJson<
          StandingItem[] | { standings?: StandingItem[] } | { data?: StandingItem[] }
        >("/api/standings?limit=5"),
        fetchJson("/api/threads?sort=recent&limit=10"),
      ]);

      if (!active) return;

      setMe(extractData<Me>(meData));
      setMeLoading(false);

      let finalFeed: FeedItem[] = [];

      if (Array.isArray(feedData)) {
        finalFeed = feedData;
      } else if (feedData && "feed" in feedData && Array.isArray(feedData.feed)) {
        finalFeed = feedData.feed;
      }

      // FALLBACK
      if (finalFeed.length === 0) {
        let threads: any[] = [];

        if (Array.isArray(fallbackThreadsData)) {
          threads = fallbackThreadsData;
        } else if (
          fallbackThreadsData &&
          typeof fallbackThreadsData === "object" &&
          "threads" in fallbackThreadsData &&
          Array.isArray((fallbackThreadsData as any).threads)
        ) {
          threads = (fallbackThreadsData as any).threads;
        }

        finalFeed = threadsToFeed(threads);
      }

      setFeed(finalFeed);
      setFeedLoading(false);

      if (Array.isArray(tagsData)) {
        setTags(tagsData);
      } else if (tagsData && "tags" in tagsData && Array.isArray(tagsData.tags)) {
        setTags(tagsData.tags);
      } else if (
        tagsData &&
        "data" in tagsData &&
        tagsData.data &&
        typeof tagsData.data === "object" &&
        "tags" in tagsData.data &&
        Array.isArray(tagsData.data.tags)
      ) {
        setTags(tagsData.data.tags);
      } else {
        setTags([]);
      }

      if (matchesData === null) {
        setMatches([]);
        setMatchesRouteAvailable(false);
      } else if (Array.isArray(matchesData)) {
        setMatches(matchesData);
      } else if ("matches" in matchesData && Array.isArray(matchesData.matches)) {
        setMatches(matchesData.matches);
      } else if ("data" in matchesData && Array.isArray(matchesData.data)) {
        setMatches(matchesData.data);
      } else {
        setMatches([]);
      }
      setMatchesLoading(false);

      if (standingsData === null) {
        setStandings([]);
        setStandingsRouteAvailable(false);
      } else {
        setStandings(extractStandingsResponse(standingsData));
      }
      setStandingsLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, [isLoading]);

  const unreadCount = useMemo(
    () => feed.filter((item) => !item.isRead).length,
    [feed]
  );

  const filteredFeed = useMemo(() => {
    if (tab === "conversations") {
      return feed.filter((item) => item.type === "thread");
    }

    if (tab === "polls") {
      return feed.filter((item) => item.type === "poll");
    }

    if (tab === "activity") {
      return feed.filter((item) => item.type === "activity");
    }

    return feed;
  }, [feed, tab]);

  if (isLoading || !user) return null;

  async function markAsRead(feedId: string) {
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
  }

  const pageLoading =
    meLoading && feedLoading && tagsLoading && matchesLoading && standingsLoading;

  return (

    <div className="min-h-screen bg-bg-main text-text-primary flex flex-col">

        <div className="min-h-screen bg-bg-main text-text-primary">
          <div className="mx-auto max-w-[1440px] px-4 py-5 md:px-6 md:py-6 lg:px-8">
            <div className="space-y-6">
              <LandingHero
                me={me}
                feed={feed}
                tags={tags}
                unreadCount={unreadCount}
                totalCount={feed.length}
              />

              <FeatureRail
                me={me}
                tags={tags}
                unreadCount={unreadCount}
              />

              <MatchCenter
                matches={matches}
                loading={matchesLoading}
                available={matchesRouteAvailable}
              />

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <section className="space-y-6">
                  <FeedShell
                    feed={feed}
                    filteredFeed={filteredFeed}
                    loading={feedLoading}
                    activeTab={tab}
                    onTabChange={setTab}
                    onMarkRead={markAsRead}
                  />
                </section>

                <aside>
                  <Sidebar
                    me={me}
                    tags={tagsLoading ? [] : tags}
                    feed={feed}
                    standings={standings}
                    standingsLoading={standingsLoading}
                    standingsAvailable={standingsRouteAvailable}
                  />
                </aside>
              </div>

              {pageLoading ? (
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-border-subtle bg-bg-surface p-4 text-sm text-text-secondary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading your SportsDeck home...
                </div>
              ) : null}
            </div>
          </div>
        </div>
    </div>
  );
}