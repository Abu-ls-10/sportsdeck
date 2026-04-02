import { NextRequest, NextResponse } from "next/server"
import {
  userProfileCacheKey,
  USER_PROFILE_TTL_SECONDS,
} from "@/lib/cache/apiCacheKeys"
import { loadUserProfilePayload } from "@/lib/data/userProfilePayload"
import { getOptionalViewerIdFromRequest } from "@/lib/requestAuth"
import { getJson, setJson } from "@/lib/redis"

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Get user details
 *     tags: [Users]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       400:
 *         description: User ID is required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

/**
 * GET /api/users/:id
 *
 * Returns a fully aggregated user profile
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

    if (!userId) {
      return NextResponse.json(
        { error: "User id is required" },
        { status: 400 }
      )
    }

    const viewerId = getOptionalViewerIdFromRequest(req)
    const cacheKey = userProfileCacheKey(userId, viewerId)

    const cached = await getJson<Awaited<ReturnType<typeof loadUserProfilePayload>>>(
      cacheKey
    )
    if (cached) {
      return NextResponse.json(cached, { status: 200 })
    }

    const payload = await loadUserProfilePayload(userId, viewerId)
    if (!payload) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    await setJson(cacheKey, payload, USER_PROFILE_TTL_SECONDS)
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    console.error("GET /api/users/:id error:", error)

    return NextResponse.json(
      { error: "Failed to retrieve user profile" },
      { status: 500 }
    )
  }
}
