import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromToken } from "@/lib/auth"
import { logActivity } from "@/lib/activity";

/**
 * @openapi
 * /api/threads/{id}/poll:
 *   post:
 *     summary: Create a poll attached to a thread
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "clxthread001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question, deadline]
 *             properties:
 *               question:
 *                 type: string
 *                 example: "Who will win the match?"
 *               deadline:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-04-01T20:00:00.000Z"
 *     responses:
 *       201:
 *         description: Poll created
 *       400:
 *         description: Question and deadline required or thread already has a poll
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Thread not found
 *       500:
 *         description: Internal server error
 */

/**
 * POST /api/threads/:id/poll
 *
 * Creates a poll attached to a thread.
 *
 * Request body:
 * {
 *   question: string
 *   deadline: string (ISO date)
 * }
 *
 * Rules:
 * - must be authenticated
 * - thread must exist
 * - thread cannot already have a poll
 * - only thread owner or admin can create poll
 */

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params

    const user = await getUserFromToken(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: { polls: true },
    })

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    // only 1 poll allowed
    if (thread.polls.length > 0) {
      return NextResponse.json(
        { error: "Thread already has a poll" },
        { status: 400 }
      )
    }

    // only owner/admin
    if (thread.authorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json().catch(() => null)

    const { question, deadline, options, replyId } = body || {}

    if (!question || !deadline || !options || options.length < 2) {
      return NextResponse.json(
        { error: "Question, deadline, and at least 2 options are required" },
        { status: 400 }
      )
    }

    // =========================
    // VALIDATE REPLY (optional)
    // =========================
    if (replyId) {
      const reply = await prisma.reply.findUnique({
        where: { id: replyId },
        include: {
          post: {
            include: {
              thread: true,
            },
          },
        },
      })

      if (!reply || reply.isHidden) {
        return NextResponse.json(
          { error: "Reply not found" },
          { status: 404 }
        )
      }

      if (reply.post.thread.id !== threadId) {
        return NextResponse.json(
          { error: "Invalid reply for this thread" },
          { status: 400 }
        )
      }
    }

    // =========================
    // CREATE POLL + OPTIONS
    // =========================
    const poll = await prisma.poll.create({
      data: {
        threadId: thread.id,
        question,
        deadline: new Date(deadline),
        isClosed: false,
        replyId: replyId ?? null,
        options: {
          create: options.map((text: string) => ({
            optionText: text,
          })),
        },
      },
      include: {
        options: true,
      },
    })

    await logActivity({
      actorId: user.id,
      type: "poll_created",
      entityType: "poll",
      entityId: poll.id,
    })

    return NextResponse.json(poll, { status: 201 })

  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}