import { Match } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * @openapi
 * /api/matches:
 *   get:
 *     summary: Get Premier League matches by matchday or date range
 *     tags: [Matches]
 *     parameters:
 *       - in: query
 *         name: matchday
 *         schema:
 *           type: integer
 *         example: 20
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-03-01"
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-03-07"
 *     responses:
 *       200:
 *         description: List of matches with team info
 *       400:
 *         description: Invalid or missing matchday/date range parameters
 *       500:
 *         description: Internal server error
 */

/**
 * /api/matches
 * Supports:
 * - matchday
 * - dateFrom + dateTo
 * - limit (landing page)
 */

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

export async function GET(req: Request) {
  const apiKey = process.env.X_AUTH_TOKEN;

  if (!apiKey) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);

  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const matchday = searchParams.get("matchday");

  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam) : undefined;

  let api_route =
    "https://api.football-data.org/v4/competitions/PL/matches";

  const hasMatchday = !!matchday;
  const hasDateRange = !!dateFrom && !!dateTo;

  // Require at least one valid mode
  if (!hasMatchday && !hasDateRange && !limit) {
    return NextResponse.json(
      { message: "Provide matchday, date range, or limit." },
      { status: 400 }
    );
  }

  let where;

  // =========================
  // MATCHDAY MODE
  // =========================
  if (hasMatchday) {
    api_route += `?matchday=${matchday}`;
    where = { matchday: parseInt(matchday!) };
  }

  // =========================
  // DATE RANGE MODE
  // =========================
  else if (hasDateRange) {
    if (
      isNaN(new Date(dateFrom!).getTime()) ||
      isNaN(new Date(dateTo!).getTime())
    ) {
      return NextResponse.json(
        { message: "Invalid date format" },
        { status: 400 }
      );
    }

    api_route += `?dateFrom=${dateFrom}&dateTo=${dateTo}`;

    where = {
      matchDate: {
        gte: new Date(dateFrom!),
        lte: new Date(dateTo!),
      },
    };
  }

  // =========================
  // DEFAULT (LIMIT MODE)
  // =========================
  else {
    const now = new Date();

    const past = new Date();
    past.setDate(now.getDate() - 2);

    const future = new Date();
    future.setDate(now.getDate() + 5);

    where = {
      matchDate: {
        gte: past,
        lte: future,
      },
    };
  }

  // =========================
  // FETCH FROM DB
  // =========================
  let matches = await prisma.match.findMany({
    where,
    orderBy: { matchDate: "asc" },
    take: limit ?? undefined,
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  // FALLBACK: ensure we always return matches for landing page
  if (limit && matches.length === 0) {
    matches = await prisma.match.findMany({
      orderBy: { matchDate: "desc" },
      take: limit,
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });
  }

  // =========================
  // CACHE FRESHNESS CHECK
  // =========================
  const check_freshness = (match: Match) => {
    const diff = Date.now() - match.cachedAt.getTime();

    if (match.status === "FINISHED") return false;

    if (match.status === "IN_PLAY" || match.status === "PAUSED") {
      return diff > 60_000;
    }

    return diff > 10 * 60_000;
  };

  const is_stale =
    matches.length === 0 || matches.some((m) => check_freshness(m));

  if (!is_stale) {
    return NextResponse.json({ matches }, { status: 200 });
  }

  // =========================
  // FETCH FROM EXTERNAL API
  // =========================
  const response = await fetch(api_route, {
    headers: { "X-Auth-Token": apiKey },
  });

  if (!response.ok) {
    console.error("API Fetch failed for matches");
    return NextResponse.json({ matches }, { status: 200 });
  }

  try {
    const matches_api = (await response.json())["matches"];

    await Promise.all(
      matches_api.map((m: API_Match) => upsert_match(m))
    );

    matches = await prisma.match.findMany({
      where,
      orderBy: { matchDate: "asc" },
      take: limit ?? undefined,
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    // fallback again after refresh
    if (limit && matches.length === 0) {
      matches = await prisma.match.findMany({
        orderBy: { matchDate: "desc" },
        take: limit,
        include: {
          homeTeam: true,
          awayTeam: true,
        },
      });
    }

    return NextResponse.json({ matches }, { status: 200 });

  } catch (e) {
    console.error("Failed to parse or upsert matches:", e);
    return NextResponse.json({ matches }, { status: 200 });
  }
}