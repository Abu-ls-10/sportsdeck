import { NextRequest, NextResponse } from "next/server"
import { invalidateThreadFullCache } from "@/lib/cache/invalidateApiCache"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"
import { logActivity } from "@/lib/activity"

/**
 * @openapi
 * /api/threads/{id}/posts:
 *   get:
 *     summary: Get posts in a thread
 *     tags: [Threads]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *       404:
 *         description: Thread not found
 *   post:
 *     summary: Create a post in a thread
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: "This is my post content"
 *     responses:
 *       201:
 *         description: Post created successfully
 *       403:
 *         description: Thread is locked or closed
 *       404:
 *         description: Thread not found
 *       500:
 *         description: Internal server error
 */

/**
 * GET /api/threads/:id/posts
 *
 * Visitors can view posts inside the thread.
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params

    const thread = await prisma.thread.findUnique({
      where: { id: threadId }
    })

    if (!thread) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      )
    }

    // Hide posts from hidden threads
    if (thread.isHidden) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      )
    }

    const posts = await prisma.post.findMany({
      where: {
        threadId: thread.id,
        isHidden: false
      },
      orderBy: {
        createdAt: "asc"
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    })

    return NextResponse.json(posts)

  } catch (error) {

    console.error(error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


/**
 * POST /api/threads/:id/posts
 *
 * User Story:
 * Users can post comments inside match discussion threads.
 *
 * Rules:
 * - Must be authenticated
 * - Thread must be open
 * - Thread must not be locked
 */

async function postHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params
    const user = req.user

    const body = await req.json()
    const { content } = body

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId }
    })

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    if (thread.isHidden) {
      return NextResponse.json(
        { error: "This thread has been hidden by a moderator and no further activity is allowed" },
        { status: 403 }
      )
    }

    const now = new Date()

    if (thread.opensAt && now < thread.opensAt) {
      return NextResponse.json({ error: "Thread has not opened yet" }, { status: 403 })
    }

    if (thread.lockedAt && now > thread.lockedAt) {
      return NextResponse.json({ error: "Thread is closed" }, { status: 403 })
    }

    if (thread.isLocked) {
      return NextResponse.json({ error: "Thread is locked" }, { status: 403 })
    }

    const result = await prisma.$transaction(async (tx) => {

      const post = await tx.post.create({
        data: {
          threadId: thread.id,
          authorId: user.id,
          content: content.trim()
        }
      })

      return post
    })

    await logActivity({
      actorId: user.id,
      type: "post_created",
      entityType: "post",
      entityId: result.id,
    });

    await invalidateThreadFullCache(thread.id)

    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withAuth(postHandler)