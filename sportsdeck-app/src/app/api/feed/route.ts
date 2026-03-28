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

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? 20)

    if (isNaN(limit) || limit <= 0 || limit > 100) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 100" },
        { status: 400 }
      )
    }

    // STEP 1: Get feed entries
    const entries = await prisma.feedEntry.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        feedEvent: true
      }
    })

    // STEP 2: Collect IDs
    const threadIds = new Set<string>()
    const pollIds = new Set<string>()

    for (const entry of entries) {
      const event = entry.feedEvent

      if (event.entityType === "thread") {
        threadIds.add(event.entityId)
      }

      if (event.entityType === "poll") {
        pollIds.add(event.entityId)
      }
    }

    // STEP 3: Fetch related data in batch
    const threads = await prisma.thread.findMany({
      where: {
        id: { in: Array.from(threadIds) },
        isHidden: false
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            posts: true
          }
        }
      }
    })

    const polls = await prisma.poll.findMany({
      where: {
        id: { in: Array.from(pollIds) }
      },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        }
      }
    })

    // STEP 4: Map for quick lookup
    const threadMap = new Map(threads.map(t => [t.id, t]))
    const pollMap = new Map(polls.map(p => [p.id, p]))

    // STEP 5: Format response
    const formatted = entries.map((entry) => {
      const event = entry.feedEvent

      // THREAD
      if (event.entityType === "thread") {
        const thread = threadMap.get(event.entityId)

        return {
          id: entry.id,
          isRead: entry.isRead,
          createdAt: entry.createdAt,
          type: "thread",

          thread: thread
            ? {
                id: thread.id,
                title: thread.title,
                author: thread.author,
                tags: thread.tags.map(t => t.tag),
                replies: thread._count.posts
              }
            : null,

          meta: {
            eventType: event.eventType,
            groupKey: event.groupKey,
            count: event.aggregateCount
          }
        }
      }

      // POLL
      if (event.entityType === "poll") {
        const poll = pollMap.get(event.entityId)

        return {
          id: entry.id,
          isRead: entry.isRead,
          createdAt: entry.createdAt,
          type: "poll",
          poll,
          meta: {
            eventType: event.eventType,
            groupKey: event.groupKey
          }
        }
      }

      // FALLBACK
      return {
        id: entry.id,
        isRead: entry.isRead,
        createdAt: entry.createdAt,
        type: "activity",
        meta: {
          eventType: event.eventType,
          entityType: event.entityType,
          entityId: event.entityId,
          count: event.aggregateCount
        }
      }
    })

    return NextResponse.json(formatted, { status: 200 })

  } catch (error) {
    console.error("GET /api/feed error:", error)

    return NextResponse.json(
      { error: "Failed to retrieve feed entries" },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getHandler)