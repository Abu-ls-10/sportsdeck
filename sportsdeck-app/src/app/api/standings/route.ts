import {
  STANDINGS_TTL_SECONDS,
  standingsCacheKey,
} from "@/lib/cache/warmCache";
import {
  loadStandingsPayload,
  type StandingsType,
} from "@/lib/data/standingsPayload";
import { getOrSetJSON } from "@/lib/redis";
import { NextResponse } from "next/server";

/**
 * @openapi
 * /api/standings:
 *   get:
 *     summary: Get Premier League standings for a season
 *     tags: [Standings]
 *     parameters:
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *         example: "2024"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [TOTAL, HOME, AWAY]
 *         example: "TOTAL"
 *     responses:
 *       200:
 *         description: Ordered list of standings with team info
 *       400:
 *         description: Invalid type parameter or invalid season year
 *       500:
 *         description: Internal server error (API key missing)
 */
export async function GET(req: Request) {
  const apiKey = process.env.X_AUTH_TOKEN;

  if (!apiKey) {
    return NextResponse.json(
      { message: "Internal Server Error: API key not found." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  let season = searchParams.get("season");
  const typeRaw = searchParams.get("type") ?? "TOTAL";

  if (typeRaw !== "TOTAL" && typeRaw !== "HOME" && typeRaw !== "AWAY") {
    return NextResponse.json(
      {
        message:
          "Invalid type parameter. Provide TOTAL, HOME, or AWAY.",
      },
      { status: 400 }
    );
  }

  const type = typeRaw as StandingsType;

  if (!season) {
    season = String(new Date().getFullYear() - 1);
  }

  const seasonYear = parseInt(season, 10);
  if (
    isNaN(seasonYear) ||
    seasonYear < 1992 ||
    seasonYear > new Date().getFullYear() - 1
  ) {
    return NextResponse.json({ message: "Invalid season" }, { status: 400 });
  }

  const key = standingsCacheKey(season, type);
  const payload = await getOrSetJSON(key, STANDINGS_TTL_SECONDS, () =>
    loadStandingsPayload({
      apiKey,
      season,
      type,
    })
  );

  return NextResponse.json(payload, { status: 200 });
}
