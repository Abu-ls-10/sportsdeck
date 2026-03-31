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


// -------------------------
// Types
// -------------------------
type NestedReply = {
  id: string
  content: string
  createdAt: Date
  parentReplyId: string | null
  author: {
    id: string
    username: string
    avatarUrl: string | null
    favoriteTeam: {
      id: string
      name: string
      shortName: string
    } | null
  }
  children: NestedReply[]
}

// -------------------------
// Helper: Build reply tree
// -------------------------
function buildReplyTree(replies: any[]): NestedReply[] {
  const map = new Map<string, NestedReply>()
  const roots: NestedReply[] = []

  replies.forEach((r) => {
    map.set(r.id, {
      id: r.id,
      content: r.content,
      createdAt: r.createdAt,
      parentReplyId: r.parentReplyId,
      author: r.author,
      children: [],
    })
  })

  replies.forEach((r) => {
    const node = map.get(r.id)!
    if (r.parentReplyId) {
      const parent = map.get(r.parentReplyId)
      if (parent) {
        parent.children.push(node)
      }
    } else {
      roots.push(node)
    }
  })

  return roots
}

// -------------------------
// Route
// -------------------------
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
    // OPTIONAL USER
    // =========================
    const user = getUserFromToken(request)
    const userId = user?.id ?? null

    // =========================
    // FETCH THREAD
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

    // =========================
    // THREAD OPEN CHECK
    // =========================
    const now = new Date()

    if (thread.opensAt && now < thread.opensAt) {
      return NextResponse.json(
        { error: "Thread not opened yet" },
        { status: 403 }
      )
    }

    const mainPost = thread.posts?.[0] ?? null

    // =========================
    // FETCH REPLIES
    // =========================
    let nestedReplies: NestedReply[] = []

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

      nestedReplies = buildReplyTree(replies)
    }

    // =========================
    // POLL PROCESSING
    // =========================
    const poll = thread.polls.length > 0 ? thread.polls[0] : null

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

    let normalizedPoll = null

    if (poll) {
      const totalVotes = poll.options.reduce(
        (sum, o) => sum + o._count.votes,
        0
      )

      normalizedPoll = {
        id: poll.id,
        question: poll.question,
        deadline: poll.deadline,
        isClosed: poll.isClosed,
        replyId: poll.replyId ?? null,
        totalVotes,

        options: poll.options.map((o) => ({
          id: o.id,
          text: o.optionText,
          votes: o._count.votes,
          percentage: totalVotes
            ? Math.round((o._count.votes / totalVotes) * 100)
            : 0,
        })),

        userVote,
      }
    }

    // =========================
    // RESPONSE
    // =========================
    return NextResponse.json(
      {
        id: thread.id,
        title: thread.title,
        createdAt: thread.createdAt,

        isLocked: thread.isLocked,
        isHidden: thread.isHidden,

        author: thread.author,

        tags: thread.tags.map((t) => t.tag),

        post: mainPost
          ? {
              id: mainPost.id,
              content: mainPost.content,
              createdAt: mainPost.createdAt,
              author: mainPost.author,
              replyCount: nestedReplies.length,
              replies: nestedReplies,
            }
          : null,

        poll: normalizedPoll,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error({
      route: "GET /api/threads/:id/full",
      error,
    })

    return NextResponse.json(
      { error: "Failed to retrieve thread data" },
      { status: 500 }
    )
  }
}