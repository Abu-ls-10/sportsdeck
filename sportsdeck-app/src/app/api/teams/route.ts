import { NextResponse } from "next/server";
import { getCachedTeamsPayload } from "@/lib/teamsData";

/**
 * @openapi
 * /api/teams:
 *   get:
 *     summary: List all teams (Premier League) with thread counts
 *     tags: [Teams]
 *     responses:
 *       200:
 *         description: Teams for current data set, cached at the edge
 */

/** Revalidate this route every hour (matches unstable_cache in teamsData). */
export const revalidate = 3600;

export async function GET() {
  try {
    const payload = await getCachedTeamsPayload();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("GET /api/teams:", error);
    return NextResponse.json({ error: "Failed to load teams" }, { status: 500 });
  }
}
