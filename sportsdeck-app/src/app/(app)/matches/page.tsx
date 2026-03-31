/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

type Team = {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
  venue?: string;
};

type Match = {
  id: string;
  status: string;
  matchDate: string; // serialized DateTime from Prisma
  homeTeam: Team;
  awayTeam: Team;
  matchday: number;
  venue: string;
  homeScore: number | null;
  awayScore: number | null;
  stage: string;
};

const MATCHDAY_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let cachedCurrentMatchday: number | null = null;
let cachedCurrentMatchdayAt = 0;
let currentMatchdayInFlight: Promise<number> | null = null;

/** When football-data.org is unreachable (e.g. connect timeout), use seeded DB matches. */
async function getCurrentMatchdayFromDatabase(): Promise<number> {
  const agg = await prisma.match.aggregate({ _max: { matchday: true } });
  const md = agg._max.matchday;
  if (md != null && !Number.isNaN(md) && md >= 1) {
    // #region agent log
    fetch("http://127.0.0.1:7566/ingest/e4f4ce26-3bb7-4649-9c07-27dc446e55e9", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "d1b01d",
      },
      body: JSON.stringify({
        sessionId: "d1b01d",
        location: "matches/page.tsx:getCurrentMatchdayFromDatabase",
        message: "db aggregate matchday",
        data: { matchday: md },
        timestamp: Date.now(),
        hypothesisId: "FIX",
        runId: "post-fix",
      }),
    }).catch(() => {});
    // #endregion
    return md;
  }
  throw new Error(
    "Could not determine current matchday: football-data.org unavailable and no matches in the database."
  );
}

async function get_Matchday(): Promise<number> {
  const apiKey = process.env.X_AUTH_TOKEN;
  // #region agent log
  fetch("http://127.0.0.1:7566/ingest/e4f4ce26-3bb7-4649-9c07-27dc446e55e9", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "d1b01d",
    },
    body: JSON.stringify({
      sessionId: "d1b01d",
      location: "matches/page.tsx:get_Matchday:entry",
      message: "get_Matchday start",
      data: { hasApiKey: Boolean(apiKey) },
      timestamp: Date.now(),
      hypothesisId: "H5",
      runId: "pre",
    }),
  }).catch(() => {});
  // #endregion
  if (!apiKey) {
    throw new Error("Missing X_AUTH_TOKEN environment variable");
  }

  // #region agent log
  let dnsData: Record<string, unknown> = {};
  try {
    const dns = await import("dns/promises");
    const r = await dns.lookup("api.football-data.org");
    dnsData = { address: r.address, family: r.family };
  } catch (dnsErr) {
    dnsData = {
      dnsError: dnsErr instanceof Error ? dnsErr.message : String(dnsErr),
    };
  }
  fetch("http://127.0.0.1:7566/ingest/e4f4ce26-3bb7-4649-9c07-27dc446e55e9", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "d1b01d",
    },
    body: JSON.stringify({
      sessionId: "d1b01d",
      location: "matches/page.tsx:get_Matchday:dns",
      message: "dns lookup api.football-data.org",
      data: dnsData,
      timestamp: Date.now(),
      hypothesisId: "H2",
      runId: "pre",
    }),
  }).catch(() => {});
  // #endregion

  const t0 = Date.now();
  let response: Response;
  try {
    response = await fetch("https://api.football-data.org/v4/competitions/PL", {
      headers: {
        "X-Auth-Token": apiKey,
      },
    });
  } catch (err) {
    // #region agent log
    const e = err as Error & { cause?: { code?: string; name?: string } };
    fetch("http://127.0.0.1:7566/ingest/e4f4ce26-3bb7-4649-9c07-27dc446e55e9", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "d1b01d",
      },
      body: JSON.stringify({
        sessionId: "d1b01d",
        location: "matches/page.tsx:get_Matchday:fetchErr",
        message: "football-data fetch threw",
        data: {
          name: e?.name,
          msg: e?.message,
          causeCode: e?.cause?.code,
          causeName: e?.cause?.name,
          elapsedMs: Date.now() - t0,
        },
        timestamp: Date.now(),
        hypothesisId: "H1",
        runId: "pre",
      }),
    }).catch(() => {});
    // #endregion
    // #region agent log
    fetch("http://127.0.0.1:7566/ingest/e4f4ce26-3bb7-4649-9c07-27dc446e55e9", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "d1b01d",
      },
      body: JSON.stringify({
        sessionId: "d1b01d",
        location: "matches/page.tsx:get_Matchday:fallback",
        message: "using DB matchday after fetch error",
        data: { reason: "fetch_throw" },
        timestamp: Date.now(),
        hypothesisId: "FIX",
        runId: "post-fix",
      }),
    }).catch(() => {});
    // #endregion
    return getCurrentMatchdayFromDatabase();
  }
  // #region agent log
  fetch("http://127.0.0.1:7566/ingest/e4f4ce26-3bb7-4649-9c07-27dc446e55e9", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "d1b01d",
    },
    body: JSON.stringify({
      sessionId: "d1b01d",
      location: "matches/page.tsx:get_Matchday:fetchOk",
      message: "football-data fetch got response",
      data: { ok: response.ok, status: response.status, elapsedMs: Date.now() - t0 },
      timestamp: Date.now(),
      hypothesisId: "H3",
      runId: "pre",
    }),
  }).catch(() => {});
  // #endregion

  if (!response.ok) {
    // #region agent log
    fetch("http://127.0.0.1:7566/ingest/e4f4ce26-3bb7-4649-9c07-27dc446e55e9", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "d1b01d",
      },
      body: JSON.stringify({
        sessionId: "d1b01d",
        location: "matches/page.tsx:get_Matchday:fallback",
        message: "using DB matchday after non-OK response",
        data: { reason: "http_status", status: response.status },
        timestamp: Date.now(),
        hypothesisId: "FIX",
        runId: "post-fix",
      }),
    }).catch(() => {});
    // #endregion
    return getCurrentMatchdayFromDatabase();
  }

  const competition = (await response.json()) as {
    currentSeason?: { currentMatchday?: number };
  };

  const currentMatchday = competition.currentSeason?.currentMatchday;
  if (!currentMatchday || Number.isNaN(currentMatchday)) {
    // #region agent log
    fetch("http://127.0.0.1:7566/ingest/e4f4ce26-3bb7-4649-9c07-27dc446e55e9", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "d1b01d",
      },
      body: JSON.stringify({
        sessionId: "d1b01d",
        location: "matches/page.tsx:get_Matchday:fallback",
        message: "using DB matchday after missing currentMatchday in payload",
        data: { reason: "parse" },
        timestamp: Date.now(),
        hypothesisId: "FIX",
        runId: "post-fix",
      }),
    }).catch(() => {});
    // #endregion
    return getCurrentMatchdayFromDatabase();
  }

  return currentMatchday;
}

async function getCachedCurrentMatchday(): Promise<number> {
  const now = Date.now();
  if (
    cachedCurrentMatchday !== null &&
    now - cachedCurrentMatchdayAt < MATCHDAY_CACHE_TTL_MS
  ) {
    return cachedCurrentMatchday;
  }

  if (currentMatchdayInFlight) {
    return currentMatchdayInFlight;
  }

  currentMatchdayInFlight = get_Matchday()
    .then((md) => {
      cachedCurrentMatchday = md;
      cachedCurrentMatchdayAt = Date.now();
      return md;
    })
    .finally(() => {
      currentMatchdayInFlight = null;
    });

  return currentMatchdayInFlight;
}

function getSearchParam(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value[0];
  return value;
}

async function getOriginFromHeaders(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  const proto =
    h.get("x-forwarded-proto") ?? h.get("x-forwarded-protocol") ?? "http";

  if (!host) return "http://localhost";
  return `${proto}://${host}`;
}

function formatMatchdayDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatMatchdayHeading(d: Date): string {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(d);
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(d);
  const day = String(d.getDate()).padStart(2, "0");
  return `${weekday.toUpperCase()}, ${month.toUpperCase()} ${day}`;
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatMatchTime(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

async function fetchMatchesForMatchday(matchday: number): Promise<Match[]> {
  const origin = await getOriginFromHeaders();
  const res = await fetch(`${origin}/api/matches?matchday=${matchday}`, {
    cache: "no-store",
  });

  if (!res.ok) return [];

  const data = (await res.json()) as { matches?: Match[] };
  return data.matches ?? [];
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};

  const requestedMatchdayRaw = getSearchParam(sp.matchday);
  const requestedMatchday = requestedMatchdayRaw
    ? parseInt(requestedMatchdayRaw, 10)
    : undefined;

  const stageParam = getSearchParam(sp.stage) ?? "All";

  const currentMatchday = await getCachedCurrentMatchday();

  const matchdayToFetch =
    requestedMatchday && !Number.isNaN(requestedMatchday)
      ? Math.max(1, requestedMatchday)
      : currentMatchday;

  const matches = await fetchMatchesForMatchday(matchdayToFetch);

  const stageOptionsFromData = Array.from(
    new Set(matches.map((m) => m.stage).filter(Boolean))
  );
  const stageOptions = ["All", ...stageOptionsFromData];
  if (stageParam !== "All" && !stageOptions.includes(stageParam)) {
    stageOptions.push(stageParam);
  }

  const stageFiltered =
    stageParam === "All" ? matches : matches.filter((m) => m.stage === stageParam);

  const today = new Date();
  const hasTodayMatches = stageFiltered.some((m) =>
    isSameLocalDay(new Date(m.matchDate), today)
  );

  const isMatchUpcoming = (m: Match) => {
    const statusUpper = (m.status ?? "").toUpperCase();
    if (statusUpper === "FINISHED") return false;
    // If kickoff time is still in the future, it must show in Upcoming.
    return new Date(m.matchDate).getTime() > Date.now();
  };

  const isMatchRecent = (m: Match) => {
    const statusUpper = (m.status ?? "").toUpperCase();
    if (statusUpper === "FINISHED") return true;
    // If kickoff is in the past and it's not finished, treat as "Recent-ish" (live/postponed)
    // so it doesn't disappear from both lists.
    return new Date(m.matchDate).getTime() <= Date.now();
  };

  const recentMatches = stageFiltered
    .filter(isMatchRecent)
    .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());

  const upcomingMatches = stageFiltered
    .filter(isMatchUpcoming)
    .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());

  const isFutureMatchday = matchdayToFetch > currentMatchday;

  const matchCountText = `${stageFiltered.length} ${
    stageFiltered.length === 1 ? "match" : "matches"
  }`;

  const groupMatchesForRender = (
    list: Match[],
    direction: "asc" | "desc"
  ): Array<{ key: string; heading: string; matches: Match[]; sortKey: number }> => {
    const map = new Map<string, { heading: string; matches: Match[]; sortKey: number }>();
    for (const m of list) {
      const d = new Date(m.matchDate);
      const key = formatMatchdayDateKey(d);
      const sortKey = d.getTime();
      const existing = map.get(key);
      if (existing) {
        existing.matches.push(m);
        continue;
      }
      const heading =
        hasTodayMatches && isSameLocalDay(d, today) ? "TODAY" : formatMatchdayHeading(d);
      map.set(key, { heading, matches: [m], sortKey });
    }

    return Array.from(map.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => (direction === "asc" ? a.sortKey - b.sortKey : b.sortKey - a.sortKey));
  };

  const recentGroups = groupMatchesForRender(recentMatches, "desc");
  const upcomingGroups = groupMatchesForRender(upcomingMatches, "asc");
  const nonUpcomingMatches = stageFiltered
    .filter((m) => !isMatchUpcoming(m))
    .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());
  const recentishGroups = groupMatchesForRender(nonUpcomingMatches, "desc");

  // Premier League is 38 matchdays; render the full range so selection never "snaps back".
  const MATCHDAY_MIN = 1;
  const MATCHDAY_MAX = 38;
  const matchdayOptions: number[] = Array.from(
    { length: MATCHDAY_MAX - MATCHDAY_MIN + 1 },
    (_, i) => MATCHDAY_MIN + i
  );

  return (
    <div className="min-h-screen bg-bg-main text-text-primary">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">

        {/* ================= HERO ================= */}
        <section className="relative overflow-hidden rounded-3xl border border-border-subtle bg-bg-surface px-6 py-6 shadow-card">
          <div className="absolute inset-0 bg-gradient-glow opacity-90" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary-400/20 bg-primary-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary-300">
                Match Center
              </div>

              <h1 className="text-3xl font-semibold text-white md:text-4xl">
                Matchday {matchdayToFetch}
              </h1>

              <p className="mt-2 text-sm text-text-secondary">
                Premier League · Season 2025–2026
              </p>
            </div>

            <div className="flex gap-4">
              <div className="rounded-2xl border border-border-subtle bg-white/[0.04] px-4 py-3">
                <p className="text-xs text-text-muted uppercase tracking-[0.12em]">
                  Matches
                </p>
                <p className="text-lg font-semibold text-white">
                  {stageFiltered.length}
                </p>
              </div>

              <div className="rounded-2xl border border-border-subtle bg-white/[0.04] px-4 py-3">
                <p className="text-xs text-text-muted uppercase tracking-[0.12em]">
                  Stage
                </p>
                <p className="text-sm font-semibold text-white">
                  {stageParam}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FILTER BAR ================= */}
        <div className="mt-6 rounded-2xl border border-border-subtle bg-bg-surface/80 p-4 shadow-soft backdrop-blur-xs">
          <form method="get" className="flex flex-wrap gap-4 items-end">

            <div>
              <label className="text-xs text-text-muted">Matchday</label>
              <select
                name="matchday"
                defaultValue={matchdayToFetch}
                className="mt-1 rounded-xl border border-border-subtle bg-bg-card px-3 py-2 text-sm text-text-primary"
              >
                {matchdayOptions.map((md) => (
                  <option key={md} value={md}>
                    {md}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-text-muted">Stage</label>
              <select
                name="stage"
                defaultValue={stageParam}
                className="mt-1 rounded-xl border border-border-subtle bg-bg-card px-3 py-2 text-sm text-text-primary"
              >
                {stageOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <button className="rounded-xl bg-gradient-primary px-5 py-2 text-sm font-semibold text-white shadow-glow">
              Apply
            </button>

            <div className="ml-auto text-sm text-text-secondary">
              {matchCountText}
            </div>
          </form>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="mt-8 space-y-10">

          {/* ================= UPCOMING ================= */}
          {upcomingMatches.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Upcoming Matches
              </h2>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {upcomingMatches.map((match) => {
                  const d = new Date(match.matchDate);

                  return (
                    <div
                      key={match.id}
                      className="group rounded-2xl border border-border-subtle bg-bg-card p-4 shadow-soft transition hover:-translate-y-1 hover:border-primary-500/30"
                    >
                      <div className="flex justify-between text-xs text-text-muted">
                        <span>{match.stage}</span>
                        <span>{formatMatchTime(d)}</span>
                      </div>

                      <div className="mt-4 flex items-center justify-between">

                        {/* HOME */}
                        <div className="flex items-center gap-2">
                          <img
                            src={match.homeTeam.logoUrl || ""}
                            className="h-10 w-10 rounded-xl bg-bg-surface"
                          />
                          <span className="text-sm font-semibold">
                            {match.homeTeam.name}
                          </span>
                        </div>

                        <span className="text-xs text-text-muted">VS</span>

                        {/* AWAY */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {match.awayTeam.name}
                          </span>
                          <img
                            src={match.awayTeam.logoUrl || ""}
                            className="h-10 w-10 rounded-xl bg-bg-surface"
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Link
                          href={`/matches/${match.id}/thread`}
                          className="flex-1 rounded-xl bg-primary-500/10 text-primary-300 text-center py-2 text-sm font-medium hover:bg-primary-500/20"
                        >
                          Thread
                        </Link>
                        <Link
                          href={`/matches/${match.id}`}
                          className="flex-1 rounded-xl border border-border-subtle text-center py-2 text-sm hover:bg-bg-elevated"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ================= RECENT ================= */}
          {recentMatches.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Recent Matches
              </h2>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {recentMatches.map((match) => {
                  const score = `${match.homeScore ?? "-"} - ${match.awayScore ?? "-"}`;

                  return (
                    <div
                      key={match.id}
                      className="rounded-2xl border border-border-subtle bg-bg-card p-4 shadow-soft"
                    >
                      <div className="flex justify-between text-xs text-text-muted">
                        <span>{match.stage}</span>
                        <span>Final</span>
                      </div>

                      <div className="mt-4 flex items-center justify-between">

                        <div className="flex items-center gap-2">
                          <img src={match.homeTeam.logoUrl || ""} className="h-10 w-10 rounded-xl" />
                          <span>{match.homeTeam.name}</span>
                        </div>

                        <div className="text-lg font-bold text-white">
                          {score}
                        </div>

                        <div className="flex items-center gap-2">
                          <span>{match.awayTeam.name}</span>
                          <img src={match.awayTeam.logoUrl || ""} className="h-10 w-10 rounded-xl" />
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Link
                          href={`/matches/${match.id}`}
                          className="flex-1 rounded-xl bg-white/[0.05] text-center py-2 text-sm hover:bg-white/[0.08]"
                        >
                          Thread
                        </Link>
                        <Link
                          href={`/matches/${match.id}`}
                          className="flex-1 rounded-xl border border-border-subtle text-center py-2 text-sm hover:bg-bg-elevated"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
