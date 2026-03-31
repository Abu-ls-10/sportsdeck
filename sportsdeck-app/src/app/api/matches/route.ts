import {
  MATCHES_TTL_SECONDS,
  matchesCacheKeyDateRange,
  matchesCacheKeyLimit,
  matchesCacheKeyMatchday,
} from "@/lib/cache/warmCache";
import { loadMatchesPayload } from "@/lib/data/matchesPayload";
import { getOrSetJSON } from "@/lib/redis";
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
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  const hasMatchday = !!matchday;
  const hasDateRange = !!dateFrom && !!dateTo;

  if (!hasMatchday && !hasDateRange && !limit) {
    return NextResponse.json(
      { message: "Provide matchday, date range, or limit." },
      { status: 400 }
    );
  }

  if (hasDateRange) {
    if (
      isNaN(new Date(dateFrom!).getTime()) ||
      isNaN(new Date(dateTo!).getTime())
    ) {
      return NextResponse.json(
        { message: "Invalid date format" },
        { status: 400 }
      );
    }
  }

  if (hasMatchday) {
    const md = parseInt(matchday!, 10);
    if (!Number.isFinite(md)) {
      return NextResponse.json(
        { message: "Invalid matchday" },
        { status: 400 }
      );
    }
    const key = matchesCacheKeyMatchday(md);
    const payload = await getOrSetJSON(key, MATCHES_TTL_SECONDS, () =>
      loadMatchesPayload({ apiKey, matchday: md })
    );
    return NextResponse.json(payload, { status: 200 });
  }

  if (hasDateRange) {
    const key = matchesCacheKeyDateRange(dateFrom!, dateTo!);
    const payload = await getOrSetJSON(key, MATCHES_TTL_SECONDS, () =>
      loadMatchesPayload({
        apiKey,
        dateFrom: dateFrom!,
        dateTo: dateTo!,
      })
    );
    return NextResponse.json(payload, { status: 200 });
  }

  if (!Number.isFinite(limit)) {
    return NextResponse.json(
      { message: "Invalid limit" },
      { status: 400 }
    );
  }
  const key = matchesCacheKeyLimit(limit!);
  const payload = await getOrSetJSON(key, MATCHES_TTL_SECONDS, () =>
    loadMatchesPayload({ apiKey, limit: limit! })
  );
  return NextResponse.json(payload, { status: 200 });
}
