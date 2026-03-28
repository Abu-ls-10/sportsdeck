/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { headers } from "next/headers";

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

async function get_Matchday(): Promise<number> {
  const apiKey = process.env.X_AUTH_TOKEN;
  if (!apiKey) {
    throw new Error("Missing X_AUTH_TOKEN environment variable");
  }

  const response = await fetch("https://api.football-data.org/v4/competitions/PL", {
    headers: {
      "X-Auth-Token": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`football-data.org returned ${response.status}`);
  }

  const competition = (await response.json()) as {
    currentSeason?: { currentMatchday?: number };
  };

  const currentMatchday = competition.currentSeason?.currentMatchday;
  if (!currentMatchday || Number.isNaN(currentMatchday)) {
    throw new Error("Could not determine current matchday from football-data.org");
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
    <div className="min-h-screen bg-black text-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Matches</h1>
            <p className="text-sm text-zinc-400">
              Premiere League - Season 2025-2026
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 md:flex-row md:items-center md:justify-between">
          <form method="get" className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-400" htmlFor="matchday">
                Matchday
              </label>
              <select
                id="matchday"
                name="matchday"
                defaultValue={matchdayToFetch}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
              >
                {matchdayOptions.map((md) => (
                  <option key={md} value={md}>
                    {md}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-400" htmlFor="stage">
                Stage
              </label>
              <select
                id="stage"
                name="stage"
                defaultValue={stageParam}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
              >
                {stageOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400"
            >
              Apply
            </button>
          </form>

          <div className="text-sm text-zinc-300">{matchCountText}</div>
        </div>

        {stageFiltered.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 text-center text-zinc-400">
            No matches found for this selection.
          </div>
        ) : (
          <div className="space-y-10">
            {!isFutureMatchday ? (
              <div className="space-y-10">
                {upcomingMatches.length > 0 && (
                  <section>
                    <div className="mb-3 flex items-end justify-between">
                      <h2 className="text-xl font-bold tracking-tight">Upcoming</h2>
                      <div className="text-xs text-zinc-400">
                        {upcomingMatches.length}{" "}
                        {upcomingMatches.length === 1 ? "match" : "matches"}
                      </div>
                    </div>

                    <div className="space-y-8">
                      {upcomingGroups.map((g) => (
                        <section key={`upcoming-${g.key}`}>
                          <h3 className="mb-3 text-xs font-semibold tracking-widest text-zinc-400">
                            {g.heading}
                          </h3>
                          <div className="grid gap-4 md:grid-cols-2">
                            {g.matches.map((match: Match) => {
                              const d = new Date(match.matchDate);
                              const statusUpper = (match.status ?? "").toUpperCase();
                              const isFinished = statusUpper === "FINISHED";
                              const scoreText = isFinished
                                ? `${match.homeScore ?? "-"} - ${match.awayScore ?? "-"}`
                                : null;

                              return (
                                <div
                                  key={match.id}
                                  className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4"
                                >
                                  <div className="mb-3 flex items-start justify-between gap-4">
                                    <div>
                                      <div className="text-xs font-semibold text-zinc-400">
                                        {match.stage || "Matchday"}
                                      </div>
                                      <div className="mt-1 text-sm font-semibold">
                                        {match.venue || match.homeTeam.venue || "TBA"}
                                      </div>
                                      <div className="mt-1 text-xs text-zinc-400">
                                        Kickoff {formatMatchTime(d)}
                                      </div>
                                    </div>

                                    {scoreText ? (
                                      <div className="text-right">
                                        <div className="text-lg font-bold">{scoreText}</div>
                                        <div className="text-xs text-zinc-400">Full time</div>
                                      </div>
                                    ) : (
                                      <div className="text-right">
                                        <div className="text-xs font-semibold text-zinc-400">
                                          {statusUpper === "IN_PLAY"
                                            ? "LIVE"
                                            : statusUpper === "PAUSED"
                                              ? "PAUSED"
                                              : statusUpper || "UPCOMING"}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      {match.homeTeam?.logoUrl ? (
                                        <img
                                          src={match.homeTeam.logoUrl}
                                          alt={`${match.homeTeam.name} logo`}
                                          className="h-10 w-10 rounded-full bg-zinc-900"
                                        />
                                      ) : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-xs">
                                          {match.homeTeam?.shortName?.slice(0, 2) ?? "H"}
                                        </div>
                                      )}
                                      <div className="text-sm font-semibold">
                                        {match.homeTeam?.name}
                                      </div>
                                    </div>

                                    <div className="text-xs font-semibold text-zinc-400">VS</div>

                                    <div className="flex items-center gap-3">
                                      <div className="text-right text-sm font-semibold">
                                        {match.awayTeam?.name}
                                      </div>
                                      {match.awayTeam?.logoUrl ? (
                                        <img
                                          src={match.awayTeam.logoUrl}
                                          alt={`${match.awayTeam.name} logo`}
                                          className="h-10 w-10 rounded-full bg-zinc-900"
                                        />
                                      ) : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-xs">
                                          {match.awayTeam?.shortName?.slice(0, 2) ?? "A"}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="mt-4 flex items-center justify-between">
                                    <Link
                                      href={`/matches/${match.id}`}
                                      className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
                                    >
                                      Match Thread
                                    </Link>
                                    <Link
                                      href={`/matches/${match.id}`}
                                      className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-900"
                                    >
                                      Details
                                    </Link>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                  </section>
                )}

                {recentMatches.length > 0 && (
                  <section>
                    <div className="mb-3 flex items-end justify-between">
                      <h2 className="text-xl font-bold tracking-tight">Recent</h2>
                      <div className="text-xs text-zinc-400">
                        {recentMatches.length}{" "}
                        {recentMatches.length === 1 ? "match" : "matches"}
                      </div>
                    </div>

                    <div className="space-y-8">
                      {recentishGroups.map((g) => (
                        <section key={`recent-${g.key}`}>
                          <h3 className="mb-3 text-xs font-semibold tracking-widest text-zinc-400">
                            {g.heading}
                          </h3>
                          <div className="grid gap-4 md:grid-cols-2">
                            {g.matches.map((match: Match) => {
                              const d = new Date(match.matchDate);
                              const statusUpper = (match.status ?? "").toUpperCase();
                              const isFinished = statusUpper === "FINISHED";
                              const scoreText = isFinished
                                ? `${match.homeScore ?? "-"} - ${match.awayScore ?? "-"}`
                                : null;

                              return (
                                <div
                                  key={match.id}
                                  className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4"
                                >
                                  <div className="mb-3 flex items-start justify-between gap-4">
                                    <div>
                                      <div className="text-xs font-semibold text-zinc-400">
                                        {match.stage || "Matchday"}
                                      </div>
                                      <div className="mt-1 text-sm font-semibold">
                                        {match.venue || match.homeTeam.venue || "TBA"}
                                      </div>
                                      <div className="mt-1 text-xs text-zinc-400">
                                        Kickoff {formatMatchTime(d)}
                                      </div>
                                    </div>

                                    {scoreText ? (
                                      <div className="text-right">
                                        <div className="text-lg font-bold">{scoreText}</div>
                                        <div className="text-xs text-zinc-400">Full time</div>
                                      </div>
                                    ) : (
                                      <div className="text-right">
                                        <div className="text-xs font-semibold text-zinc-400">
                                          {statusUpper || "UNKNOWN"}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      {match.homeTeam?.logoUrl ? (
                                        <img
                                          src={match.homeTeam.logoUrl}
                                          alt={`${match.homeTeam.name} logo`}
                                          className="h-10 w-10 rounded-full bg-zinc-900"
                                        />
                                      ) : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-xs">
                                          {match.homeTeam?.shortName?.slice(0, 2) ?? "H"}
                                        </div>
                                      )}
                                      <div className="text-sm font-semibold">
                                        {match.homeTeam?.name}
                                      </div>
                                    </div>

                                    <div className="text-xs font-semibold text-zinc-400">VS</div>

                                    <div className="flex items-center gap-3">
                                      <div className="text-right text-sm font-semibold">
                                        {match.awayTeam?.name}
                                      </div>
                                      {match.awayTeam?.logoUrl ? (
                                        <img
                                          src={match.awayTeam.logoUrl}
                                          alt={`${match.awayTeam.name} logo`}
                                          className="h-10 w-10 rounded-full bg-zinc-900"
                                        />
                                      ) : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-xs">
                                          {match.awayTeam?.shortName?.slice(0, 2) ?? "A"}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="mt-4 flex items-center justify-between">
                                    <Link
                                      href={`/matches/${match.id}`}
                                      className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
                                    >
                                      Match Thread
                                    </Link>
                                    <Link
                                      href={`/matches/${match.id}`}
                                      className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-900"
                                    >
                                      Details
                                    </Link>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <section>
                <div className="mb-3 flex items-end justify-between">
                  <h2 className="text-xl font-bold tracking-tight">Upcoming</h2>
            
                </div>

                {upcomingGroups.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 text-sm text-zinc-400">
                    No upcoming matches for this matchday.
                  </div>
                ) : (
                  <div className="space-y-8">
                    {upcomingGroups.map((g) => (
                      <section key={`upcoming-${g.key}`}>
                        <h3 className="mb-3 text-xs font-semibold tracking-widest text-zinc-400">
                          {g.heading}
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          {g.matches.map((match) => {
                            const d = new Date(match.matchDate);
                            const statusUpper = (match.status ?? "").toUpperCase();
                            const isFinished = statusUpper === "FINISHED";

                            const scoreText = isFinished
                              ? `${match.homeScore ?? "-"} - ${match.awayScore ?? "-"}`
                              : null;

                            return (
                              <div
                                key={match.id}
                                className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4"
                              >
                                <div className="mb-3 flex items-start justify-between gap-4">
                                  <div>
                                    <div className="text-xs font-semibold text-zinc-400">
                                      {match.stage || "Matchday"}
                                    </div>
                                    <div className="mt-1 text-sm font-semibold">
                                      {match.venue || match.homeTeam.venue || "TBA"}
                                    </div>
                                    <div className="mt-1 text-xs text-zinc-400">
                                      Kickoff {formatMatchTime(d)}
                                    </div>
                                  </div>

                                  {scoreText ? (
                                    <div className="text-right">
                                      <div className="text-lg font-bold">{scoreText}</div>
                                      <div className="text-xs text-zinc-400">Full time</div>
                                    </div>
                                  ) : (
                                    <div className="text-right">
                                      <div className="text-xs font-semibold text-zinc-400">
                                        {statusUpper || "UNKNOWN"}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    {match.homeTeam?.logoUrl ? (
                                      <img
                                        src={match.homeTeam.logoUrl}
                                        alt={`${match.homeTeam.name} logo`}
                                        className="h-10 w-10 rounded-full bg-zinc-900"
                                      />
                                    ) : (
                                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-xs">
                                        {match.homeTeam?.shortName?.slice(0, 2) ?? "H"}
                                      </div>
                                    )}
                                    <div className="text-sm font-semibold">
                                      {match.homeTeam?.name}
                                    </div>
                                  </div>

                                  <div className="text-xs font-semibold text-zinc-400">VS</div>

                                  <div className="flex items-center gap-3">
                                    <div className="text-right text-sm font-semibold">
                                      {match.awayTeam?.name}
                                    </div>
                                    {match.awayTeam?.logoUrl ? (
                                      <img
                                        src={match.awayTeam.logoUrl}
                                        alt={`${match.awayTeam.name} logo`}
                                        className="h-10 w-10 rounded-full bg-zinc-900"
                                      />
                                    ) : (
                                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-xs">
                                        {match.awayTeam?.shortName?.slice(0, 2) ?? "A"}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                  <Link
                                    href={`/matches/${match.id}`}
                                    className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
                                  >
                                    Match Thread
                                  </Link>
                                  <Link
                                    href={`/matches/${match.id}`}
                                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-900"
                                  >
                                    Details
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
            </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
