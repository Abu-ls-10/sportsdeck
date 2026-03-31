import { NextResponse } from "next/server"
import { invalidateThreadFullCache } from "@/lib/cache/invalidateApiCache"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"
import { moderateContent } from "@/lib/moderation"
import { logActivity } from "@/lib/activity"

/**
 * @openapi
 * /api/posts/{id}/replies:
 *   post:
 *     summary: Create a reply under a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "clx1abc123"
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
 *                 example: "This is my reply to the post."
 *     responses:
 *       201:
 *         description: Reply created successfully
 *       400:
 *         description: Content is required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Account banned or thread locked/closed
 *       404:
 *         description: Post or thread not found
 *       500:
 *         description: Internal server error
 *   get:
 *     summary: Get all visible replies under a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "clx1abc123"
 *     responses:
 *       200:
 *         description: List of replies
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */

/**
 * POST /api/posts/:id/replies
 * Supports:
 * - replying to post
 * - replying to another reply (nested)
 */
async function postHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const user = req.user

    // =========================
    // VALIDATE POST + THREAD
    // =========================
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { thread: true },
    })

    if (!post || post.isHidden)
      return NextResponse.json({ error: "Post not found" }, { status: 404 })

    const thread = post.thread

    if (thread.isHidden)
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })

    if (thread.isLocked)
      return NextResponse.json({ error: "Thread is locked" }, { status: 403 })

    const now = new Date()

    if (thread.opensAt && now < thread.opensAt)
      return NextResponse.json(
        { error: "Thread has not opened yet" },
        { status: 403 }
      )

    if (thread.lockedAt && now > thread.lockedAt)
      return NextResponse.json(
        { error: "Thread is closed" },
        { status: 403 }
      )

    // =========================
    // BODY
    // =========================
    const body = await req.json()
    const { content, parentReplyId } = body

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      )
    }

    // =========================
    // VALIDATE PARENT REPLY
    // =========================
    if (parentReplyId) {
      const parent = await prisma.reply.findUnique({
        where: { id: parentReplyId },
      })

      if (!parent || parent.isHidden) {
        return NextResponse.json(
          { error: "Parent reply not found" },
          { status: 404 }
        )
      }

      // must belong to same post
      if (parent.postId !== postId) {
        return NextResponse.json(
          { error: "Invalid parent reply" },
          { status: 400 }
        )
      }
    }

    // =========================
    // CREATE REPLY
    // =========================
    const reply = await prisma.$transaction(async (tx) => {
      const created = await tx.reply.create({
        data: {
          postId: post.id,
          authorId: user.id,
          content: content.trim(),
          parentReplyId: parentReplyId ?? null, 
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      })

      return created
    })

    // =========================
    // ACTIVITY + MODERATION
    // =========================
    await logActivity({
      actorId: user.id,
      type: "reply_created",
      entityType: "reply",
      entityId: reply.id,
    })

    moderateContent("REPLY", reply.id, reply.content).catch((err) =>
      console.error("[replies] moderateContent failed:", err)
    )

    await invalidateThreadFullCache(thread.id)

    return NextResponse.json(reply, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const POST = withAuth(postHandler)

// =========================
// GET /api/posts/:id/replies
// (flat — tree is built in threads/full)
// =========================
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params

    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post || post.isHidden)
      return NextResponse.json({ error: "Post not found" }, { status: 404 })

    const replies = await prisma.reply.findMany({
      where: { postId, isHidden: false },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    })

    return NextResponse.json(replies)
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}