import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"

/**
 * @openapi
 * /api/feed:
 *   get:
 *     summary: Get the authenticated user's personalized activity feed
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 20
 *     responses:
 *       200:
 *         description: List of grouped feed entries
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * GET /api/feed
 *
 * User Story:
 * As a user, I want my feed to group related events so that I do not
 * get overwhelmed by many notifications about the same post or thread.
 *
 * Implementation:
 * Feed entries reference grouped events stored in FEED_EVENT.
 * Multiple activities are aggregated into one feed item via groupKey.
 *
 * Tables used:
 * FEED_ENTRY
 * FEED_EVENT
 */

async function getHandler(req: AuthenticatedRequest) {
  try {

    const currentUser = req.user

    // Safety check (middleware should already enforce this)
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)

    const limitParam = searchParams.get("limit")
    const limit = limitParam ? Number(limitParam) : 20

    // Validate limit
    if (limitParam && isNaN(limit)) {
      return NextResponse.json(
        { error: "Invalid 'limit' query parameter" },
        { status: 400 }
      )
    }

    // Prevent abuse (feeds shouldn't request huge pages)
    if (limit <= 0 || limit > 100) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 100" },
        { status: 400 }
      )
    }

    const entries = await prisma.feedEntry.findMany({
      where: {
        userId: currentUser.user_id
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit,
      include: {
        feedEvent: true
      }
    })

    return NextResponse.json(entries, { status: 200 })

  } catch (error) {

    console.error("GET /api/feed error:", error)

    return NextResponse.json(
      { error: "Failed to retrieve feed entries" },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getHandler)