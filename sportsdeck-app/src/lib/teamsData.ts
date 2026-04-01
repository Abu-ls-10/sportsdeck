import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export type TeamWithThreadCount = {
  id: string;
  externalId: string;
  name: string;
  shortName: string;
  logoUrl: string;
  venue: string;
  _count: { threads: number };
};

export type TeamsPagePayload = {
  teams: TeamWithThreadCount[];
  featured: TeamWithThreadCount[];
  seasonLabel: string;
};

function formatSeasonLabel(s?: string | null): string {
  if (!s) return "Premier League";
  const m = s.match(/^(\d{4})-(\d{4})$/);
  if (m) return `${m[1]}/${m[2].slice(-2)}`;
  return s;
}

/**
 * Loads all PL teams from DB plus top-3 featured (from standings when available).
 * Cached across the app and reused by GET /api/teams.
 */
/** Direct DB read (no unstable_cache). Use for admin or when clients must see fresh ids. */
export async function fetchTeamsPayload(): Promise<TeamsPagePayload> {
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { threads: true } } },
  });

  const seasonRow = await prisma.standing.findFirst({
    where: { type: "TOTAL" },
    orderBy: { cachedAt: "desc" },
    select: { season: true },
  });

  const featured: TeamWithThreadCount[] = [];

  if (seasonRow?.season) {
    const top = await prisma.standing.findMany({
      where: { type: "TOTAL", season: seasonRow.season },
      orderBy: { position: "asc" },
      take: 3,
      include: {
        team: { include: { _count: { select: { threads: true } } } },
      },
    });
    for (const row of top) {
      if (row.team) featured.push(row.team as TeamWithThreadCount);
    }
  }

  const byCode = (code: string) => teams.find((t) => t.shortName === code);
  for (const code of ["ARS", "MCI", "LIV"]) {
    if (featured.length >= 3) break;
    const t = byCode(code);
    if (t && !featured.some((f) => f.id === t.id)) featured.push(t);
  }

  for (const t of teams) {
    if (featured.length >= 3) break;
    if (!featured.some((f) => f.id === t.id)) featured.push(t);
  }

  const matchSeason = await prisma.match.findFirst({
    orderBy: { matchDate: "desc" },
    select: { season: true },
  });

  return {
    teams,
    featured: featured.slice(0, 3),
    seasonLabel: formatSeasonLabel(matchSeason?.season ?? seasonRow?.season),
  };
}

export const getCachedTeamsPayload = unstable_cache(fetchTeamsPayload, ["pl-teams-directory"], {
  revalidate: 3600,
  tags: ["teams"],
});
