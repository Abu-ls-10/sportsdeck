import type { Prisma } from "@/generated/prisma";
import { Match } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

const matchInclude = { homeTeam: true, awayTeam: true } as const;

export type MatchWithTeams = Prisma.MatchGetPayload<{
  include: typeof matchInclude;
}>;

export type MatchesPayload = { matches: MatchWithTeams[] };

export type LoadMatchesParams =
  | { apiKey: string; matchday: number }
  | { apiKey: string; dateFrom: string; dateTo: string }
  | { apiKey: string; limit: number };

interface API_Match {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: {
    id: number;
    name: string;
    tla: string;
    crest: string;
    venue: string;
  };
  awayTeam: {
    id: number;
    name: string;
    tla: string;
    crest: string;
    venue: string;
  };
  matchday: number;
  venue: string;
  score: {
    winner: string;
    fullTime: { home: number | null; away: number | null };
  };
  season: { startDate: string; endDate: string };
  stage: string;
}

async function upsert_match(match: API_Match) {
  return prisma.match.upsert({
    where: { externalId: String(match.id) },
    update: {
      status: match.status,
      venue: match.venue ?? "",
      homeScore: match.score.fullTime.home,
      awayScore: match.score.fullTime.away,
      matchDate: new Date(match.utcDate),
      cachedAt: new Date(),
    },
    create: {
      externalId: String(match.id),
      venue: match.venue ?? "",
      status: match.status,
      homeScore: match.score.fullTime.home,
      awayScore: match.score.fullTime.away,
      cachedAt: new Date(),
      matchDate: new Date(match.utcDate),
      homeTeam: { connect: { externalId: String(match.homeTeam.id) } },
      awayTeam: { connect: { externalId: String(match.awayTeam.id) } },
      matchday: match.matchday,
      season: `${new Date(match.season.startDate).getFullYear()}-${new Date(match.season.endDate).getFullYear()}`,
      stage: match.stage,
    },
  });
}

function buildApiRoute(params: LoadMatchesParams): string {
  let api_route =
    "https://api.football-data.org/v4/competitions/PL/matches";

  if ("matchday" in params) {
    api_route += `?matchday=${params.matchday}`;
  } else if ("dateFrom" in params) {
    api_route += `?dateFrom=${params.dateFrom}&dateTo=${params.dateTo}`;
  }

  return api_route;
}

function buildWhereClause(
  params: LoadMatchesParams
): Prisma.MatchWhereInput {
  if ("matchday" in params) {
    return { matchday: params.matchday };
  }
  if ("dateFrom" in params) {
    return {
      matchDate: {
        gte: new Date(params.dateFrom),
        lte: new Date(params.dateTo),
      },
    };
  }

  const now = new Date();
  const past = new Date();
  past.setDate(now.getDate() - 2);
  const future = new Date();
  future.setDate(now.getDate() + 5);

  return {
    matchDate: {
      gte: past,
      lte: future,
    },
  };
}

function getLimit(params: LoadMatchesParams): number | undefined {
  return "limit" in params ? params.limit : undefined;
}

function check_freshness(match: Match) {
  const diff = Date.now() - match.cachedAt.getTime();

  if (match.status === "FINISHED") return false;

  if (match.status === "IN_PLAY" || match.status === "PAUSED") {
    return diff > 60_000;
  }

  return diff > 10 * 60_000;
}

/**
 * Loads Premier League matches (DB-first, optional Football-Data refresh).
 * Same JSON shape as GET /api/matches for Redis/cache reuse.
 */
export async function loadMatchesPayload(
  params: LoadMatchesParams
): Promise<MatchesPayload> {
  const apiKey = params.apiKey;
  const where = buildWhereClause(params);
  const limit = getLimit(params);
  const api_route = buildApiRoute(params);

  let matches = await prisma.match.findMany({
    where,
    orderBy: { matchDate: "asc" },
    take: limit,
    include: matchInclude,
  });

  if (limit !== undefined && matches.length === 0) {
    matches = await prisma.match.findMany({
      orderBy: { matchDate: "desc" },
      take: limit,
      include: matchInclude,
    });
  }

  const is_stale =
    matches.length === 0 || matches.some((m) => check_freshness(m));

  if (!is_stale) {
    return { matches };
  }

  const response = await fetch(api_route, {
    headers: { "X-Auth-Token": apiKey },
  });

  if (!response.ok) {
    console.error("API Fetch failed for matches");
    return { matches };
  }

  try {
    const matches_api = (await response.json())["matches"];

    await Promise.all(
      matches_api.map((m: API_Match) => upsert_match(m))
    );

    matches = await prisma.match.findMany({
      where,
      orderBy: { matchDate: "asc" },
      take: limit,
      include: matchInclude,
    });

    if (limit !== undefined && matches.length === 0) {
      matches = await prisma.match.findMany({
        orderBy: { matchDate: "desc" },
        take: limit,
        include: matchInclude,
      });
    }

    return { matches };
  } catch (e) {
    console.error("Failed to parse or upsert matches:", e);
    return { matches };
  }
}
