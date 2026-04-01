import { NextResponse } from "next/server";
import { fetchTeamsPayload, getCachedTeamsPayload } from "@/lib/teamsData";

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

/** Reading search params requires a dynamic route; team list is still cached via unstable_cache. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const nocacheParam = new URL(req.url).searchParams.get("nocache");
    const bypassCache = nocacheParam === "1" || nocacheParam === "true";
    const payload = bypassCache
      ? await fetchTeamsPayload()
      : await getCachedTeamsPayload();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": bypassCache
          ? "private, no-store, max-age=0"
          : "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("GET /api/teams:", error);
    return NextResponse.json({ error: "Failed to load teams" }, { status: 500 });
  }
}
