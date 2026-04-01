"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IconBell,
  IconEye,
  IconFilter,
  IconLayoutGrid,
  IconList,
  IconMessage2,
  IconSearch,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";
import type { TeamsPagePayload } from "@/lib/teamsData";

/* ---------------- UTIL ---------------- */

function hashHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % 360;
  return h;
}

/* ---------------- COMPONENT ---------------- */

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

  useEffect(() => {
    const first = teams[0];
    if (!first) return;
    const forumHref = `/community?team=${encodeURIComponent(first.id)}`;
    // #region agent log
    fetch("http://127.0.0.1:7877/ingest/85a6ad7f-6143-4b09-b7de-17f9236ebb4d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "651fac",
      },
      body: JSON.stringify({
        sessionId: "651fac",
        location: "TeamsPageClient.tsx",
        message: "teams hub sample card hrefs",
        data: {
          detailsHref: `/teams/${first.id}`,
          forumHref,
        },
        timestamp: Date.now(),
        hypothesisId: "H1",
        runId: "verify",
      }),
    }).catch(() => {});
    // #endregion
  }, [teams]);

  return (
    <div className="min-h-screen bg-bg-main text-text-primary">
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-6">

        {/* ================= HERO ================= */}
        <section className="relative overflow-hidden rounded-3xl border border-border-subtle bg-bg-surface px-6 py-6 shadow-card">
          <div className="absolute inset-0 bg-gradient-glow opacity-80" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold text-primary">
                Teams Hub
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                Premier League · Season {seasonLabel}
              </p>
            </div>

            <div className="flex gap-3 items-center">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="search"
                  placeholder="Search teams..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9 pr-3 py-2 rounded-xl bg-bg-card border border-border-subtle text-sm outline-none focus:border-primary-500"
                />
              </div>

              <button className="w-10 h-10 rounded-xl bg-bg-card border border-border-subtle flex items-center justify-center">
                <IconBell className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        {/* ================= FEATURED ================= */}
        <section className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-primary">
              Featured Teams
            </h2>
            <Link href="/standings" className="text-sm text-primary-400 hover:text-primary-300">
              View Standings
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((team) => {
              const hue = hashHue(team.name);

              return (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-border-subtle bg-bg-card p-4 shadow-soft hover:border-primary-500/30 transition"
                >
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: `linear-gradient(135deg, hsl(${hue}, 50%, 25%) 0%, transparent 100%)`,
                    }}
                  />

                  <div className="relative flex items-center gap-4">
                    <img
                      src={team.logoUrl}
                      className="h-14 w-14 rounded-xl bg-bg-surface p-1"
                    />

                    <div>
                      <p className="text-lg font-semibold group-hover:text-primary-300">
                        {team.name}
                      </p>
                      <p className="text-sm text-text-muted">{team.venue}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ================= DIRECTORY ================= */}
        <section className="mt-10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-xl font-semibold">Teams Directory</h2>
              <p className="text-sm text-text-secondary">
                {teams.length} clubs competing
              </p>
            </div>

            <div className="flex items-center gap-1 bg-bg-card border border-border-subtle p-1 rounded-xl">
              <button
                onClick={() => setView("grid")}
                className={`p-2 rounded-lg ${
                  view === "grid" ? "bg-bg-elevated text-primary" : "text-text-muted"
                }`}
              >
                <IconLayoutGrid className="h-5 w-5" />
              </button>

              <button
                onClick={() => setView("list")}
                className={`p-2 rounded-lg ${
                  view === "list" ? "bg-bg-elevated text-primary" : "text-text-muted"
                }`}
              >
                <IconList className="h-5 w-5" />
              </button>

              <button className="p-2 text-text-muted hover:text-primary">
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
                  className={`rounded-2xl border border-border-subtle bg-bg-card p-4 shadow-soft transition hover:border-primary-500/30 ${
                    view === "list" ? "flex items-center gap-4" : ""
                  }`}
                >
                  <div
                    className="flex items-center justify-center rounded-xl bg-bg-surface"
                    style={{
                      backgroundColor: `hsla(${hue}, 35%, 18%, 0.8)`,
                      width: view === "list" ? 64 : 80,
                      height: view === "list" ? 64 : 80,
                    }}
                  >
                    <img src={team.logoUrl} className="w-[70%]" />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-primary">{team.name}</h3>
                    <p className="text-sm text-text-muted">{team.venue}</p>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/teams/${team.id}`}
                      className="px-3 py-2 text-xs rounded-lg border border-border-subtle hover:bg-bg-elevated"
                    >
                      <IconEye className="inline w-4 h-4 mr-1" />
                      Details
                    </Link>

                    <Link
                      href={`/community?team=${encodeURIComponent(team.id)}`}
                      className="px-3 py-2 text-xs rounded-lg bg-gradient-primary text-primary"
                    >
                      <IconMessage2 className="inline w-4 h-4 mr-1" />
                      Forum
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <p className="py-12 text-center text-text-muted">
              No teams found.
            </p>
          )}
        </section>

      </div>
    </div>
  );
}