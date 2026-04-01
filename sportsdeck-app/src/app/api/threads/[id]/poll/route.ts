import { NextResponse } from "next/server"
import { invalidateThreadFullCache } from "@/lib/cache/invalidateApiCache"
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
 * Rules:
 * - must be authenticated
 * - thread must exist
 * - thread must not be hidden
 * - thread cannot already have a poll
 * - only thread owner or admin can create poll
 * - deadline must be valid
 * - at least 2 non-empty options required
 */
export async function POST(
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

    const user = getUserFromToken(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: { polls: true },
    })

    if (!thread || thread.isHidden) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    if (thread.isLocked) {
      return NextResponse.json(
        { error: "Thread is locked" },
        { status: 403 }
      )
    }

    const now = new Date()
    if (thread.opensAt && now < thread.opensAt) {
      return NextResponse.json(
        { error: "Thread has not opened yet" },
        { status: 403 }
      )
    }

    if (thread.authorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (thread.polls.length > 0) {
      return NextResponse.json(
        { error: "Thread already has a poll" },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => null)
    const { question, deadline, options, replyId } = body || {}

    const trimmedQuestion =
      typeof question === "string" ? question.trim() : ""

    const normalizedOptions = Array.isArray(options)
      ? options
          .filter((opt): opt is string => typeof opt === "string")
          .map((opt) => opt.trim())
          .filter((opt) => opt.length > 0)
      : []

    if (!trimmedQuestion || !deadline || normalizedOptions.length < 2) {
      return NextResponse.json(
        { error: "Question, deadline, and at least 2 options are required" },
        { status: 400 }
      )
    }

    const parsedDeadline = new Date(deadline)
    if (Number.isNaN(parsedDeadline.getTime())) {
      return NextResponse.json(
        { error: "Invalid deadline" },
        { status: 400 }
      )
    }

    if (parsedDeadline <= now) {
      return NextResponse.json(
        { error: "Deadline must be in the future" },
        { status: 400 }
      )
    }

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

    const poll = await prisma.poll.create({
      data: {
        threadId: thread.id,
        question: trimmedQuestion,
        deadline: parsedDeadline,
        isClosed: false,
        replyId: replyId ?? null,
        options: {
          create: normalizedOptions.map((text) => ({
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

    await invalidateThreadFullCache(thread.id)

    const normalizedPoll = {
      id: poll.id,
      question: poll.question,
      deadline: poll.deadline,
      isClosed: poll.isClosed,
      replyId: poll.replyId ?? null,
      totalVotes: 0,
      options: poll.options.map((option) => ({
        id: option.id,
        text: option.optionText,
        votes: 0,
        percentage: 0,
      })),
      userVote: null,
    }

    return NextResponse.json(normalizedPoll, { status: 201 })
  } catch (error) {
    console.error("POST /api/threads/:id/poll error:", error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}