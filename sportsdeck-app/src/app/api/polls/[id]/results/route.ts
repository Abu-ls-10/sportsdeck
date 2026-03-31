import { NextResponse } from "next/server"
import {
  pollResultsCacheKey,
  POLL_RESULTS_TTL_SECONDS,
} from "@/lib/cache/apiCacheKeys"
import { loadPollResultsPayload } from "@/lib/data/pollResultsPayload"
import { getJson, setJson } from "@/lib/redis"

/**
 * @openapi
 * /api/polls/{id}/results:
 *   get:
 *     summary: Get vote counts per poll option
 *     tags: [Polls]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "clxpoll001"
 *     responses:
 *       200:
 *         description: Poll results with per-option vote counts
 *       404:
 *         description: Poll not found
 *       500:
 *         description: Internal server error
 */

/**
 * GET /api/polls/:id/results
 *
 * Returns vote counts per option.
 */

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params

    if (!pollId)
      return NextResponse.json(
        { error: "Poll id is required" },
        { status: 400 }
      )

    const key = pollResultsCacheKey(pollId)
    const cached = await getJson<{
      pollId: string
      question: string
      results: { id: string; optionText: string; votes: number }[]
    }>(key)
    if (cached) {
      return NextResponse.json(cached, { status: 200 })
    }

    const payload = await loadPollResultsPayload(pollId)
    if (!payload) {
      return NextResponse.json(
        { error: "Poll not found" },
        { status: 404 }
      )
    }

    await setJson(key, payload, POLL_RESULTS_TTL_SECONDS)
    return NextResponse.json(payload, { status: 200 })
  } catch (err) {
    console.error("GET /api/polls/:id/results error:", err)

    return NextResponse.json(
      { error: "Failed to retrieve poll results" },
      { status: 500 }
    )
  }
}
