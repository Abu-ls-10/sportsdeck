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

    const entries = await prisma.feedEntry.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        feedEvent: true
      }
    })

    const threadIds = new Set<string>()
    const pollIds = new Set<string>()
    const postIds = new Set<string>()
    const replyIds = new Set<string>()

    for (const entry of entries) {
      const event = entry.feedEvent

      if (event.entityType === "thread") {
        threadIds.add(event.entityId)
      }

      if (event.entityType === "poll") {
        pollIds.add(event.entityId)
      }

      if (event.entityType === "post") {
        postIds.add(event.entityId)
      }

      if (event.entityType === "reply") {
        replyIds.add(event.entityId)
      }
    }

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

    const posts = await prisma.post.findMany({
      where: {
        id: { in: Array.from(postIds) },
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
        thread: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    const replies = await prisma.reply.findMany({
      where: {
        id: { in: Array.from(replyIds) }
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        },
        post: {
          include: {
            thread: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    })

    const threadMap = new Map(threads.map(t => [t.id, t]))
    const pollMap = new Map(polls.map(p => [p.id, p]))
    const postMap = new Map(posts.map(p => [p.id, p]))
    const replyMap = new Map(replies.map(r => [r.id, r]))

    const formatted = entries.map((entry) => {
      const event = entry.feedEvent

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

      if (event.entityType === "post") {
        const post = postMap.get(event.entityId)

        return {
          id: entry.id,
          isRead: entry.isRead,
          createdAt: entry.createdAt,
          type: "post",
          post: post
            ? {
                id: post.id,
                content: post.content,
                author: post.author,
                thread: post.thread
              }
            : null,
          meta: {
            eventType: event.eventType,
            groupKey: event.groupKey,
            count: event.aggregateCount
          }
        }
      }

      if (event.entityType === "reply") {
        const reply = replyMap.get(event.entityId)

        return {
          id: entry.id,
          isRead: entry.isRead,
          createdAt: entry.createdAt,
          type: "reply",
          reply: reply
            ? {
                id: reply.id,
                content: reply.content,
                author: reply.author,
                thread: reply.post.thread
              }
            : null,
          meta: {
            eventType: event.eventType,
            groupKey: event.groupKey,
            count: event.aggregateCount
          }
        }
      }

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