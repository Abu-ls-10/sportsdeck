import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromToken } from "@/lib/auth"

/**
 * @openapi
 * /api/threads/{id}/full:
 *   get:
 *     summary: Get complete thread page data in a single request
 *     tags: [Threads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "clxthread001"
 *     responses:
 *       200:
 *         description: Full thread data including metadata, posts, replies, poll, and tags
 *       404:
 *         description: Thread not found or hidden
 *       500:
 *         description: Internal server error
 */

/**
 * GET /api/threads/:id/full
 *
 * Returns:
 * - thread metadata
 * - author
 * - tags
 * - post (main thread content)
 * - nested replies
 * - poll (if exists)
 */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params

    if (!threadId) {
      return NextResponse.json(
        { error: "Thread id is required" },
        { status: 400 }
      )
    }

    // =========================
    // OPTIONAL USER (for votes)
    // =========================
    const user = await getUserFromToken(request).catch(() => null)
    const userId = user?.id ?? null

    // =========================
    // FETCH THREAD + MAIN POST
    // =========================
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },

      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },

        tags: {
          include: {
            tag: true,
          },
        },

        polls: {
          include: {
            options: {
              include: {
                _count: {
                  select: { votes: true },
                },
              },
            },
          },
        },

        posts: {
          where: {
            isHidden: false,
          },
          orderBy: {
            createdAt: "asc",
          },
          take: 1,
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                favoriteTeam: {
                  select: {
                    id: true,
                    name: true,
                    shortName: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!thread || thread.isHidden) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      )
    }

    const mainPost = thread.posts?.[0] ?? null

    // =========================
    // FETCH REPLIES (FLAT)
    // =========================
    let nestedReplies: any[] = []

    if (mainPost) {
      const replies = await prisma.reply.findMany({
        where: {
          postId: mainPost.id,
          isHidden: false,
        },
        orderBy: {
          createdAt: "asc",
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              favoriteTeam: {
                select: {
                  id: true,
                  name: true,
                  shortName: true,
                },
              },
            },
          },
        },
      })

      const map = new Map<string, any>()
      const roots: any[] = []

      replies.forEach((r) => {
        map.set(r.id, { ...r, children: [] })
      })

      replies.forEach((r) => {
        if (r.parentReplyId) {
          const parent = map.get(r.parentReplyId)
          if (parent) {
            parent.children.push(map.get(r.id))
          }
        } else {
          roots.push(map.get(r.id))
        }
      })

      nestedReplies = roots
    }

    // =========================
    // POLL PROCESSING
    // =========================
    const poll = thread.polls?.[0] ?? null

    let userVote: string | null = null

    if (poll && userId) {
      const vote = await prisma.vote.findFirst({
        where: {
          pollId: poll.id,
          userId,
        },
        select: {
          pollOptionId: true,
        },
      })

      userVote = vote?.pollOptionId ?? null
    }

    const normalizedPoll = poll
      ? {
          id: poll.id,
          question: poll.question,
          deadline: poll.deadline,
          isClosed: poll.isClosed,
          replyId: poll.replyId ?? null,
          options: poll.options.map((o) => ({
            id: o.id,
            text: o.optionText,
            votes: o._count.votes,
          })),
          userVote,
        }
      : null

    // =========================
    // RESPONSE
    // =========================
    return NextResponse.json(
      {
        id: thread.id,
        title: thread.title,
        createdAt: thread.createdAt,

        author: thread.author,

        tags: thread.tags.map((t) => t.tag),

        post: mainPost
          ? {
              id: mainPost.id,
              content: mainPost.content,
              createdAt: mainPost.createdAt,
              author: mainPost.author,
              replies: nestedReplies,
            }
          : null,

        poll: normalizedPoll,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("GET /api/threads/:id/full error:", error)

    return NextResponse.json(
      { error: "Failed to retrieve thread data" },
      { status: 500 }
    )
  }
}