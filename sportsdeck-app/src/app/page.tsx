"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Flame,
  LayoutGrid,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  Vote,
  Zap,
  CheckCircle2,
  Star,
  PlayCircle,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

/* =========================
   Helpers
========================= */

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getInitials(name?: string | null) {
  if (!name) return "SD";

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

/* =========================
   Static content
========================= */

const heroStats = [
  {
    label: "Live match hub",
    value: "24/7",
    helper: "Matches, threads, and reactions in one place",
    icon: <CalendarDays className="h-4 w-4 text-primary-300" />,
  },
  {
    label: "Community energy",
    value: "Polls + posts",
    helper: "Fans can debate, vote, and join the action",
    icon: <MessageSquare className="h-4 w-4 text-accent-300" />,
  },
  {
    label: "Personalized value",
    value: "Custom feed",
    helper: "Sign up for a tailored SportsDeck experience",
    icon: <Sparkles className="h-4 w-4 text-brand-300" />,
  },
  {
    label: "Built for fandom",
    value: "Teams + trends",
    helper: "Follow what matters, skip the noise",
    icon: <TrendingUp className="h-4 w-4 text-primary-300" />,
  },
];

const featureCards = [
  {
    title: "Follow your league without the clutter",
    description:
      "SportsDeck brings matches, discussions, community polls, and trending topics into one clean experience so fans do not have to jump between scattered apps and timelines.",
    icon: <ShieldCheck className="h-4 w-4 text-accent-300" />,
    accent: "accent" as const,
  },
  {
    title: "Make your feed actually yours",
    description:
      "When visitors sign up, SportsDeck can personalize the experience around favorite teams, relevant conversations, and the topics they care about most.",
    icon: <Sparkles className="h-4 w-4 text-primary-300" />,
    accent: "primary" as const,
  },
  {
    title: "Go from spectator to active fan",
    description:
      "Posting, replying, voting in polls, and joining threads turns SportsDeck into more than a scoreboard, it becomes a place where fans participate.",
    icon: <Flame className="h-4 w-4 text-brand-300" />,
    accent: "brand" as const,
  },
];

const previewThreads = [
  {
    title: "Who should start in the next big match?",
    tag: "Lineups",
    replies: 128,
    author: "Matchday Minds",
  },
  {
    title: "Best underdog story of the season so far",
    tag: "Hot Takes",
    replies: 86,
    author: "The Sixth Stand",
  },
  {
    title: "Can this club actually win it all this year?",
    tag: "Predictions",
    replies: 214,
    author: "Final Whistle",
  },
];

const previewPolls = [
  {
    question: "What matters most to fans during match week?",
    options: [
      { label: "Lineup news", pct: 42 },
      { label: "Injury updates", pct: 24 },
      { label: "Tactical debate", pct: 21 },
      { label: "Fan reactions", pct: 13 },
    ],
  },
  {
    question: "Why create a SportsDeck account?",
    options: [
      { label: "Personalized feed", pct: 38 },
      { label: "Join discussions", pct: 31 },
      { label: "Vote in polls", pct: 19 },
      { label: "Track favorite teams", pct: 12 },
    ],
  },
];

const matchPreview = [
  {
    status: "Upcoming",
    home: "Toronto FC",
    away: "CF Montréal",
    venue: "BMO Field",
    date: "Sat · 7:30 PM",
  },
  {
    status: "Live",
    home: "Arsenal",
    away: "Liverpool",
    venue: "Emirates Stadium",
    date: "Now",
  },
  {
    status: "Final",
    home: "Lakers",
    away: "Celtics",
    venue: "TD Garden",
    date: "Final",
  },
];

const benefits = [
  "Discover conversations tied to teams, matches, and trends",
  "Build a custom feed after signing up",
  "Start threads, reply to fans, and post your takes",
  "Vote in community polls and see quick sentiment snapshots",
  "Stay closer to the action without a noisy interface",
  "Get a fan experience that feels modern, organized, and alive",
];

const steps = [
  {
    step: "01",
    title: "Explore",
    description:
      "Visitors instantly see what SportsDeck is about, live discussion, match context, polls, and fan energy.",
    icon: <LayoutGrid className="h-5 w-5" />,
  },
  {
    step: "02",
    title: "Sign up",
    description:
      "Creating an account unlocks personalization, participation, and a much richer home experience.",
    icon: <Users className="h-5 w-5" />,
  },
  {
    step: "03",
    title: "Join in",
    description:
      "Follow teams, jump into threads, vote in polls, and become part of the SportsDeck community.",
    icon: <Zap className="h-5 w-5" />,
  },
];

const testimonials = [
  {
    name: "Aisha",
    role: "Football fan",
    quote:
      "SportsDeck feels like the first sports platform that actually combines discussion, context, and discovery without being chaotic.",
  },
  {
    name: "Daniel",
    role: "Basketball follower",
    quote:
      "The idea of having my own custom sports feed plus the ability to jump into active threads is exactly what I want from a fan platform.",
  },
  {
    name: "Maya",
    role: "Casual fan turned active user",
    quote:
      "I would sign up just for the personalized feed, but the polls and discussions are what would keep me coming back.",
  },
];

/* =========================
   Small UI building blocks
========================= */

function SectionHeader({
  icon,
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon?: React.ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? (
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
            {icon}
            {eyebrow}
          </div>
        ) : null}

        <h2 className="text-2xl font-semibold text-text-primary md:text-3xl">
          {title}
        </h2>

        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary md:text-base">
            {description}
          </p>
        ) : null}
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

function AvatarBadge({
  name,
  size = "md",
}: {
  name?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm"
      ? "h-9 w-9 text-xs"
      : size === "lg"
        ? "h-14 w-14 text-base"
        : "h-11 w-11 text-sm";

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
      <p className="mt-1 truncate text-lg font-semibold text-text-primary">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-text-secondary">{helper}</p>
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
      <div
        className={cx(
          "pointer-events-none absolute inset-0 bg-gradient-to-br",
          accentClass
        )}
      />
      <div className="relative">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border-subtle bg-white/[0.04]">
          {icon}
        </div>

        <h3 className="mt-4 text-lg font-semibold text-text-primary">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          {description}
        </p>
      </div>
    </GlassPanel>
  );
}

/* =========================
   Sections
========================= */

function LandingHero() {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-border-subtle bg-bg-surface shadow-card">
      <div className="absolute inset-0 bg-gradient-glow opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.12),transparent_30%)]" />
      <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-primary-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-44 w-44 rounded-full bg-brand-500/10 blur-3xl" />

      <div className="relative grid gap-8 px-5 py-7 md:px-7 md:py-8 xl:grid-cols-[minmax(0,1.2fr)_390px] xl:items-stretch">
        <div className="flex flex-col justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-400/20 bg-accent-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-300">
              <Sparkles className="h-3.5 w-3.5" />
              The modern sports fan platform
            </div>

            <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-text-primary md:text-5xl xl:text-[3.25rem] xl:leading-[1.02]">
              SportsDeck brings matches, fan conversations, polls, and community energy into one unforgettable home.
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-text-secondary md:text-base">
              This is not just a landing page for scores. SportsDeck is where
              fans discover what matters, follow their teams, join debates,
              react in real time, and shape a custom feed built around the sports
              they actually care about. Sign up to unlock the full experience.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-white shadow-glow transition duration-200 hover:-translate-y-0.5"
              >
                Create your account
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-2xl border border-border-subtle bg-white/[0.04] px-5 py-3 text-sm font-medium text-text-primary transition hover:bg-white/[0.07]"
              >
                Log in
                <PlayCircle className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full border border-border-subtle bg-white/[0.04] px-3 py-2 text-xs font-medium text-text-secondary">
                Personalized feed after signup
              </span>
              <span className="rounded-full border border-border-subtle bg-white/[0.04] px-3 py-2 text-xs font-medium text-text-secondary">
                Join match discussions
              </span>
              <span className="rounded-full border border-border-subtle bg-white/[0.04] px-3 py-2 text-xs font-medium text-text-secondary">
                Vote in live community polls
              </span>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border-subtle bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
                Why sign up
              </p>
              <p className="mt-2 text-base font-semibold text-text-primary">
                Your custom SportsDeck
              </p>
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                Get a smarter home built around your teams, interests, and fan behavior.
              </p>
            </div>

            <div className="rounded-2xl border border-border-subtle bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
                Why stay
              </p>
              <p className="mt-2 text-base font-semibold text-text-primary">
                Active fan community
              </p>
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                Read, post, reply, and vote without the chaos of generic social feeds.
              </p>
            </div>

            <div className="rounded-2xl border border-border-subtle bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
                Why it stands out
              </p>
              <p className="mt-2 text-base font-semibold text-text-primary">
                Context meets conversation
              </p>
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                SportsDeck connects the event, the discussion, and the reaction in one flow.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
          {heroStats.map((stat) => (
            <HeroStatCard
              key={stat.label}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              helper={stat.helper}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureRail() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {featureCards.map((card) => (
        <FeatureCard
          key={card.title}
          icon={card.icon}
          title={card.title}
          description={card.description}
          accent={card.accent}
        />
      ))}
    </div>
  );
}

function PreviewExperience() {
  return (
    <GlassPanel className="p-5 md:p-6">
      <SectionHeader
        icon={<LayoutGrid className="h-3.5 w-3.5" />}
        eyebrow="Experience Preview"
        title="See what SportsDeck feels like"
        description="A landing page should sell the product. These preview panels give visitors a taste of the kind of experience they unlock once they sign up."
      />

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.95fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border-subtle bg-bg-card/70 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Fan conversations
                </p>
                <p className="text-xs text-text-muted">
                  Active topics people would want to jump into
                </p>
              </div>

              <Link
                href="/signup"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary-300 transition hover:text-primary-200"
              >
                Join the discussion
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {previewThreads.map((thread, index) => (
                <article
                  key={thread.title}
                  className={cx(
                    "rounded-2xl border p-4 shadow-soft transition duration-200 hover:-translate-y-0.5",
                    index === 0
                      ? "border-primary-500/30 bg-bg-surface"
                      : "border-border-subtle bg-white/[0.03]"
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-300">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Thread
                    </span>
                    <span className="rounded-full border border-border-subtle bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-text-secondary">
                      #{thread.tag}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-semibold leading-snug text-text-primary">
                    {thread.title}
                  </h3>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <AvatarBadge name={thread.author} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-text-primary">
                          {thread.author}
                        </p>
                        <p className="text-xs text-text-muted">
                          Active contributor
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border-subtle bg-white/[0.03] px-3 py-2 text-center">
                      <p className="text-sm font-semibold text-text-primary">
                        {thread.replies}
                      </p>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">
                        Replies
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-bg-card/70 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Match center preview
                </p>
                <p className="text-xs text-text-muted">
                  Context around live and upcoming games
                </p>
              </div>

              <Link
                href="/signup"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary-300 transition hover:text-primary-200"
              >
                Unlock more
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {matchPreview.map((match) => {
                const statusClass =
                  match.status === "Live"
                    ? "border-brand-400/25 bg-brand-400/10 text-brand-300"
                    : match.status === "Final"
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                      : "border-primary-400/20 bg-primary-400/10 text-primary-300";

                return (
                  <div
                    key={`${match.home}-${match.away}`}
                    className="rounded-2xl border border-border-subtle bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={cx(
                          "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
                          statusClass
                        )}
                      >
                        {match.status}
                      </span>
                      <span className="text-xs text-text-muted">{match.date}</span>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-white/[0.03] px-3 py-2.5">
                        <span className="text-sm font-medium text-text-primary">
                          {match.home}
                        </span>
                        <span className="text-text-muted">vs</span>
                        <span className="text-sm font-medium text-text-primary">
                          {match.away}
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-text-muted">{match.venue}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {previewPolls.map((poll) => (
            <div
              key={poll.question}
              className="rounded-2xl border border-border-subtle bg-bg-card/70 p-4 shadow-soft"
            >
              <div className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-300">
                <Vote className="h-3.5 w-3.5" />
                Community Poll
              </div>

              <h3 className="mt-3 text-base font-semibold leading-snug text-text-primary">
                {poll.question}
              </h3>

              <div className="mt-4 space-y-2.5">
                {poll.options.map((option) => (
                  <div
                    key={option.label}
                    className="rounded-xl border border-border-subtle bg-white/[0.03] p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="truncate text-sm text-text-primary">
                        {option.label}
                      </span>
                      <span className="text-xs text-text-muted">
                        {option.pct}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-primary"
                        style={{ width: `${option.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-border-subtle bg-bg-card/70 p-5">
            <p className="text-sm font-semibold text-text-primary">
              Signing up makes the difference
            </p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Visitors can understand the value here, but the real SportsDeck
              experience starts once they create an account. That is when the
              platform can tailor the feed, connect activity to the teams they
              follow, and let them post, reply, and participate.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-border-subtle bg-white/[0.03] px-3 py-2 text-xs font-medium text-text-secondary">
                Custom feed
              </span>
              <span className="rounded-full border border-border-subtle bg-white/[0.03] px-3 py-2 text-xs font-medium text-text-secondary">
                Favorite teams
              </span>
              <span className="rounded-full border border-border-subtle bg-white/[0.03] px-3 py-2 text-xs font-medium text-text-secondary">
                Join discussions
              </span>
              <span className="rounded-full border border-border-subtle bg-white/[0.03] px-3 py-2 text-xs font-medium text-text-secondary">
                Vote in polls
              </span>
            </div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

function BenefitsSection() {
  return (
    <GlassPanel className="p-6">
      <SectionHeader
        icon={<Star className="h-4 w-4" />}
        eyebrow="Why SportsDeck"
        title="Everything a modern sports fan actually wants"
        description="SportsDeck is built to simplify the sports experience while making it more interactive and engaging."
      />

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {benefits.map((b) => (
          <div
            key={b}
            className="flex items-start gap-3 rounded-xl border border-border-subtle bg-white/[0.03] p-4"
          >
            <CheckCircle2 className="h-5 w-5 text-primary-300 mt-0.5" />
            <p className="text-sm text-text-secondary">{b}</p>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

function HowItWorks() {
  return (
    <GlassPanel className="p-6">
      <SectionHeader
        icon={<Zap className="h-4 w-4" />}
        eyebrow="How it works"
        title="From visitor to active fan"
      />

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.step}
            className="rounded-2xl border border-border-subtle bg-white/[0.03] p-5"
          >
            <p className="text-xs text-text-muted">{step.step}</p>

            <div className="mt-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]">
              {step.icon}
            </div>

            <h3 className="mt-4 text-base font-semibold text-text-primary">
              {step.title}
            </h3>

            <p className="mt-2 text-sm text-text-secondary">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

function Testimonials() {
  return (
    <GlassPanel className="p-6">
      <SectionHeader
        icon={<Users className="h-4 w-4" />}
        eyebrow="What fans say"
        title="Loved by early users"
      />

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="rounded-2xl border border-border-subtle bg-white/[0.03] p-5"
          >
            <p className="text-sm text-text-secondary leading-6">
              “{t.quote}”
            </p>

            <div className="mt-4 flex items-center gap-3">
              <AvatarBadge name={t.name} />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {t.name}
                </p>
                <p className="text-xs text-text-muted">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-border-subtle bg-bg-surface shadow-card">
      <div className="absolute inset-0 bg-gradient-glow opacity-80" />

      <div className="relative px-6 py-10 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold text-text-primary">
          Ready to experience SportsDeck?
        </h2>

        <p className="mt-4 max-w-2xl mx-auto text-text-secondary text-sm md:text-base leading-7">
          Everything you saw becomes personalized, interactive, and alive once
          you create an account.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-primary px-6 py-3 text-sm font-semibold text-white shadow-glow hover:-translate-y-0.5"
          >
            Get started for free
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-2xl border border-border-subtle bg-white/[0.04] px-6 py-3 text-sm font-medium text-text-primary hover:bg-white/[0.07]"
          >
            Already have an account
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-main text-text-primary">
      <Navbar />

      <main className="px-6 py-6">
        <div className="max-w-[1280px] mx-auto space-y-6">
          <LandingHero />

          <FeatureRail />

          <PreviewExperience />

          <BenefitsSection />

          <HowItWorks />

          <Testimonials />

          <FinalCTA />
        </div>
      </main>

      <Footer />
    </div>
  );
}