"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  IconBallFootball,
  IconBell,
  IconEye,
  IconFilter,
  IconHome,
  IconLayoutGrid,
  IconList,
  IconMessage2,
  IconSearch,
  IconSettings,
  IconTrophy,
  IconUsers,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";
import type { TeamWithThreadCount, TeamsPagePayload } from "@/lib/teamsData";

const FEATURED_BADGES = [
  { label: "TRENDING #1", className: "border-sky-500/50 bg-sky-500/20 text-sky-200" },
  { label: "CHAMPIONS", className: "border-emerald-500/50 bg-emerald-500/20 text-emerald-200" },
  { label: "IN FORM", className: "border-indigo-500/50 bg-indigo-500/20 text-indigo-200" },
];

const NAV = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/standings", label: "Leagues", icon: IconTrophy },
  { href: "/teams", label: "Teams", icon: IconUsers, active: true },
  { href: "/threads", label: "Forums", icon: IconMessage2 },
  { href: "/matches", label: "Matches", icon: IconBallFootball },
];

function hashHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % 360;
  return h;
}

export default function TeamsPageClient({ teams, featured, seasonLabel }: TeamsPagePayload) {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return teams;
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(s) ||
        t.shortName.toLowerCase().includes(s) ||
        t.venue.toLowerCase().includes(s)
    );
  }, [teams, q]);

  return (
    <div className="flex min-h-screen bg-[#060a14] text-slate-100">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-800/80 bg-[#080d18] md:flex">
        <div className="border-b border-slate-800/80 px-4 py-5">
          <Link href="/" className="text-lg font-bold tracking-tight text-white">
            Sports<span className="text-sky-400">Deck</span>
          </Link>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-slate-500">
            Fan experience
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {NAV.map(({ href, label, icon: Icon, active }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-sky-500/15 text-sky-300"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Icon className="h-5 w-5 opacity-80" aria-hidden />
              {label}
            </Link>
          ))}
          <Link
            href="/settings"
            className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
          >
            <IconSettings className="h-5 w-5 opacity-80" aria-hidden />
            Settings
          </Link>
        </nav>
        <div className="border-t border-slate-800/80 p-3">
          <div className="flex items-center gap-3 rounded-lg bg-slate-900/50 p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-slate-200">
              {(user?.username ?? "G").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user?.username ?? "Guest"}</p>
              <p className="text-[11px] text-slate-500">{user ? "Member" : "Sign in"}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-3 border-b border-slate-800/80 bg-[#0a0f1c]/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="relative min-w-[200px] flex-1 max-w-xl">
            <IconSearch
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search teams, players or news..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-lg border border-slate-700/80 bg-[#111a2e] py-2 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-sky-500/60"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              aria-label="Notifications"
            >
              <IconBell className="h-5 w-5" />
            </button>
            <Link
              href={user ? "/threads" : "/login"}
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400"
            >
              + Post Update
            </Link>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 lg:flex-row lg:p-6">
          <main className="min-w-0 flex-1 space-y-8">
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-white">Featured Teams</h2>
                <Link href="/standings" className="text-sm font-medium text-sky-400 hover:text-sky-300">
                  View Standings
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {featured.map((team, i) => {
                  const badge = FEATURED_BADGES[i] ?? FEATURED_BADGES[0];
                  const hue = hashHue(team.name);
                  return (
                    <Link
                      key={team.id}
                      href={`/teams/${team.id}`}
                      className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-[#0d1424] shadow-lg transition hover:border-sky-500/40"
                    >
                      <div
                        className="absolute inset-0 opacity-30"
                        style={{
                          background: `linear-gradient(135deg, hsl(${hue}, 45%, 22%) 0%, #0a0f1c 100%)`,
                        }}
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={team.logoUrl}
                        alt=""
                        className="absolute right-[-20%] top-1/2 h-48 w-48 -translate-y-1/2 opacity-20 blur-sm"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#060a14] via-[#060a14]/85 to-transparent" />
                      <div className="relative flex h-44 flex-col justify-end p-4">
                        <span
                          className={`mb-2 w-fit rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        <div className="flex items-end gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={team.logoUrl}
                            alt=""
                            className="h-14 w-14 rounded-lg border border-slate-600/50 bg-slate-900/80 object-contain p-1"
                          />
                          <div>
                            <p className="text-lg font-bold text-white group-hover:text-sky-200">{team.name}</p>
                            <p className="text-xs text-slate-400">{team.venue}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">Teams Directory</h2>
                  <p className="text-sm text-slate-500">
                    {teams.length} clubs competing in the Premier League {seasonLabel}
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-slate-700/60 bg-[#111a2e] p-1">
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    className={`rounded-md p-2 ${view === "grid" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"}`}
                    aria-label="Grid view"
                  >
                    <IconLayoutGrid className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className={`rounded-md p-2 ${view === "list" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"}`}
                    aria-label="List view"
                  >
                    <IconList className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="rounded-md p-2 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                    aria-label="Filters"
                  >
                    <IconFilter className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div
                className={
                  view === "grid"
                    ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                    : "flex flex-col gap-3"
                }
              >
                {filtered.map((team) => {
                  const hue = hashHue(team.name);
                  return (
                    <div
                      key={team.id}
                      className={`flex rounded-xl border border-slate-700/60 bg-[#0d1424] p-4 shadow-md ${
                        view === "list" ? "flex-row items-center gap-4" : "flex-col"
                      }`}
                    >
                      <div
                        className={`mb-3 flex shrink-0 items-center justify-center rounded-xl border border-slate-600/50 ${
                          view === "list" ? "mb-0 h-16 w-16" : "mx-auto h-20 w-20 sm:mx-0"
                        }`}
                        style={{ backgroundColor: `hsla(${hue}, 35%, 18%, 0.9)` }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={team.logoUrl}
                          alt=""
                          className="h-[70%] w-[70%] object-contain"
                        />
                      </div>
                      <div className={view === "list" ? "min-w-0 flex-1" : ""}>
                        <h3 className="font-bold text-white">{team.name}</h3>
                        <p className="text-sm text-slate-500">{team.venue}</p>
                        {team._count.threads > 0 ? (
                          <p className="mt-1 text-[11px] text-slate-600">
                            {team._count.threads} forum thread{team._count.threads === 1 ? "" : "s"}
                          </p>
                        ) : null}
                      </div>
                      <div
                        className={`mt-4 flex gap-2 ${view === "list" ? "mt-0 shrink-0 flex-col sm:flex-row" : ""}`}
                      >
                        <Link
                          href={`/teams/${team.id}`}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-600/80 bg-slate-800/40 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                        >
                          <IconEye className="h-4 w-4" aria-hidden />
                          Details
                        </Link>
                        <Link
                          href={`/threads?teamId=${team.id}`}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-sky-500/90 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-400"
                        >
                          <IconMessage2 className="h-4 w-4" aria-hidden />
                          Forum
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filtered.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500">No teams match your search.</p>
              ) : null}
            </section>
          </main>

          <aside className="w-full shrink-0 space-y-6 lg:w-80">
            <div className="rounded-2xl border border-slate-700/60 bg-[#0d1424] p-4">
              <h3 className="mb-3 text-sm font-bold text-white">Transfer News</h3>
              <ul className="space-y-4">
                {[
                  { tag: "CONFIRMED", tagClass: "bg-emerald-500/20 text-emerald-300", title: "Midfield signing finalized ahead of window", time: "2h ago" },
                  { tag: "RUMOUR", tagClass: "bg-amber-500/20 text-amber-200", title: "Top six club linked with PL striker", time: "5h ago" },
                  { tag: "INJURY", tagClass: "bg-rose-500/20 text-rose-200", title: "Defender ruled out for three weeks", time: "Yesterday" },
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-3 border-b border-slate-800/80 pb-4 last:border-0 last:pb-0">
                    <div className="h-14 w-14 shrink-0 rounded-lg bg-slate-800/80" />
                    <div className="min-w-0">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold ${item.tagClass}`}>
                        {item.tag}
                      </span>
                      <p className="mt-1 text-sm font-medium leading-snug text-slate-200">{item.title}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{item.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-sky-500/40 bg-gradient-to-br from-sky-600/30 to-sky-900/20 p-5">
              <h3 className="text-lg font-bold text-white">Join the Forum</h3>
              <p className="mt-2 text-sm text-sky-100/90">
                Connect with thousands of fans and discuss the latest matches.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-sky-900 hover:bg-sky-50"
              >
                Create Account
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
