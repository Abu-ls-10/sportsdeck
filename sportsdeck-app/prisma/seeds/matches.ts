import { PrismaClient } from "../../src/generated/prisma"

/** Same shape as football-data.org v4 competition matches. */
interface API_Match {
  id: number
  utcDate: string
  status: string
  homeTeam: { id: number; name: string; tla: string; crest: string; venue: string }
  awayTeam: { id: number; name: string; tla: string; crest: string; venue: string }
  matchday: number
  venue: string
  score: { winner: string; fullTime: { home: number | null; away: number | null } }
  season: { startDate: string; endDate: string }
  stage: string
}

async function upsertMatch(prisma: PrismaClient, match: API_Match) {
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
  })
}

/**
 * Loads the full Premier League fixture list for the same season as `teams` seed.
 * Expect ~380 rows per season (20 teams, double round robin).
 */
export default async function seedMatches(prisma: PrismaClient, _teams: unknown[]) {
  void _teams

  const apiKey = process.env.X_AUTH_TOKEN
  if (!apiKey) {
    throw new Error(
      "Missing X_AUTH_TOKEN — set it in .env (same token as team seed) to fetch PL matches from football-data.org."
    )
  }

  const season = 2025
  const url = `https://api.football-data.org/v4/competitions/PL/matches?season=${season}`

  const response = await fetch(url, {
    headers: { "X-Auth-Token": apiKey },
  })

  if (!response.ok) {
    const body = await response.text()
    console.error(`PL matches fetch failed: ${response.status} ${response.statusText}`, body)
    throw new Error(`Failed to fetch PL matches (${response.status}). Check X_AUTH_TOKEN and plan limits.`)
  }

  const data = (await response.json()) as {
    matches?: API_Match[]
    resultSet?: { count: number; competitions: string; first: string; last: string }
  }

  const raw = data.matches ?? []
  if (raw.length === 0) {
    console.warn(`No matches returned for PL season ${season}. Response may be empty or season unavailable on your API plan.`)
  } else if (raw.length < 300) {
    console.warn(
      `Only ${raw.length} matches returned (expected ~380). Free-tier or season coverage may be limited.`
    )
  }

  await Promise.all(raw.map((m) => upsertMatch(prisma, m)))

  const withTeams = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchDate: "asc" },
  })

  console.log(`Matches seeded: ${withTeams.length} (API returned ${raw.length} fixtures)`)
  return withTeams
}
