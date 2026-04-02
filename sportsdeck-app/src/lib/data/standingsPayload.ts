import type { Prisma } from "@/generated/prisma";
import { Standing } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

const standingInclude = { team: true } as const;

export type StandingWithTeam = Prisma.StandingGetPayload<{
  include: typeof standingInclude;
}>;

export type StandingsType = "TOTAL" | "HOME" | "AWAY";

export type StandingsPayload = { standings: StandingWithTeam[] };

type ApiStandingRow = {
  team: { id: number };
  position: number;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

function is_stale(standing: Standing) {
  const time_difference = Date.now() - standing.cachedAt.getTime();
  return time_difference > 60 * 60 * 1000;
}

/**
 * Loads PL standings for a season and table type (DB-first, optional API refresh).
 * Same JSON shape as GET /api/standings for Redis/cache reuse.
 */
export async function loadStandingsPayload(params: {
  apiKey: string;
  season: string;
  type: StandingsType;
}): Promise<StandingsPayload> {
  const { apiKey, season, type } = params;

  const football_api_url = `https://api.football-data.org/v4/competitions/PL/standings?season=${season}`;

  let season_standings = await prisma.standing.findMany({
    where: { season, type },
    include: standingInclude,
    orderBy: { position: "asc" },
  });

  const stale =
    season_standings.length === 0 ||
    season_standings.some((s) => is_stale(s));

  if (!stale) {
    return { standings: season_standings };
  }

  try {
    const response = await fetch(football_api_url, {
      headers: { "X-Auth-Token": apiKey },
    });

    if (!response.ok) {
      return { standings: season_standings };
    }

    const standingsJson = (await response.json())["standings"] as {
      type: string | null;
      table: ApiStandingRow[];
    }[];

    const block = standingsJson.find((s) => s.type === type);
    if (!block?.table) {
      return { standings: season_standings };
    }

    const response_standings = block.table;

    await Promise.all(
      response_standings.map((standing) =>
        prisma.standing.upsert({
          where: {
            externalTeamId_season_type: {
              externalTeamId: String(standing.team.id),
              season: String(season),
              type,
            },
          },
          update: {
            position: standing.position,
            played: standing.playedGames,
            won: standing.won,
            drawn: standing.draw,
            lost: standing.lost,
            goalsFor: standing.goalsFor,
            goalsAgainst: standing.goalsAgainst,
            points: standing.points,
            cachedAt: new Date(),
            type,
          },
          create: {
            team: { connect: { externalId: String(standing.team.id) } },
            externalTeamId: String(standing.team.id),
            season: String(season),
            position: standing.position,
            played: standing.playedGames,
            won: standing.won,
            drawn: standing.draw,
            lost: standing.lost,
            goalsFor: standing.goalsFor,
            goalsAgainst: standing.goalsAgainst,
            points: standing.points,
            cachedAt: new Date(),
            type,
          },
        })
      )
    );

    const updated_season_standings = await prisma.standing.findMany({
      where: { season, type },
      include: standingInclude,
      orderBy: { position: "asc" },
    });

    return { standings: updated_season_standings };
  } catch (e) {
    console.error("Failed to parse API response or upsert standings:", e);
    return { standings: season_standings };
  }
}
