import { NextResponse } from "next/server"
import {
  invalidatePollResultsCache,
  invalidateThreadFullCache,
} from "@/lib/cache/invalidateApiCache"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"
import { logActivity } from "@/lib/activity"

/**
 * @openapi
 * /api/polls/{id}/vote:
 *   post:
 *     summary: Cast a vote on a poll option
 *     tags: [Polls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "clxpoll001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [optionId]
 *             properties:
 *               optionId:
 *                 type: string
 *                 example: "clxopt001"
 *     responses:
 *       201:
 *         description: Vote recorded
 *       400:
 *         description: Poll closed, invalid option, or user already voted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Account banned or thread hidden
 *       404:
 *         description: Poll not found
 *       500:
 *         description: Internal server error
 */

/**
 * POST /api/polls/:id/vote
 *
 * Cast vote for an option.
 *
 * Body:
 * {
 *   optionId: string
 * }
 *
 * Enforces:
 * - one vote per user per poll
 * - poll not closed
 */

async function postHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = req.user
    const { id: pollId } = await params

    if (!user)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true },
    })

    if (!poll)
      return NextResponse.json(
        { error: "Poll not found" },
        { status: 404 }
      )

    if (poll.isHidden)
      return NextResponse.json(
        { error: "Poll is hidden" },
        { status: 403 }
      )

    if (poll.isClosed || (poll.deadline && new Date() > poll.deadline))
      return NextResponse.json(
        { error: "Poll is closed" },
        { status: 403 }
      )

    const thread = await prisma.thread.findUnique({
      where: { id: poll.threadId },
      select: { isHidden: true },
    })

    if (thread?.isHidden)
      return NextResponse.json(
        { error: "Thread is hidden" },
        { status: 403 }
      )

    const body = await req.json().catch(() => null)
    const optionId = body?.optionId

    if (!optionId)
      return NextResponse.json(
        { error: "optionId is required" },
        { status: 400 }
      )

    const option = await prisma.pollOption.findUnique({
      where: { id: optionId },
    })

    if (!option || option.pollId !== poll.id)
      return NextResponse.json(
        { error: "Invalid poll option" },
        { status: 400 }
      )

    // =========================
    // SINGLE-SELECT TOGGLE
    // =========================

    // Find all existing votes in this poll for this user.
    // Schema currently enforces uniqueness by (pollOptionId, userId), so without
    // poll-level uniqueness a user could still have multiple votes across options.
    const existingVotes = await prisma.vote.findMany({
      where: {
        userId: user.id,
        pollId: poll.id,
      },
      orderBy: { createdAt: "asc" },
    })
    const existingVote = existingVotes[0] ?? null

    if (existingVote) {
      if (existingVote.pollOptionId === optionId) {
        // SAME OPTION → UNVOTE
        await prisma.vote.deleteMany({
          where: {
            userId: user.id,
            pollId: poll.id,
          },
        })
      } else {
        // DIFFERENT OPTION → SWITCH
        await prisma.vote.deleteMany({
          where: {
            userId: user.id,
            pollId: poll.id,
          },
        })
        await prisma.vote.create({
          data: {
            userId: user.id,
            pollId: poll.id,
            pollOptionId: optionId,
          },
        })
      }
    } else {
      // NO EXISTING VOTE → CREATE
      await prisma.vote.create({
        data: {
          userId: user.id,
          pollId: poll.id,
          pollOptionId: optionId,
        },
      })

      await logActivity({
        actorId: user.id,
        type: "poll_voted",
        entityType: "poll",
        entityId: pollId,
      })
    }

    // =========================
    // RETURN UPDATED STATE
    // =========================
    const options = await prisma.pollOption.findMany({
      where: { pollId },
      include: {
        _count: {
          select: { votes: true },
        },
      },
    })

    const userVote = await prisma.vote.findFirst({
      where: {
        pollId,
        userId: user.id,
      },
      select: {
        pollOptionId: true,
      },
    })

    await invalidatePollResultsCache(pollId)
    await invalidateThreadFullCache(poll.threadId)

    return NextResponse.json({
      options: options.map((o) => ({
        id: o.id,
        text: o.optionText,
        votes: o._count.votes,
      })),
      userVote: userVote?.pollOptionId ?? null,
    })

  } catch (err) {
    console.error("POST /api/polls/:id/vote error:", err)

    return NextResponse.json(
      { error: "Failed to cast vote" },
      { status: 500 }
    )
  }
}

export const POST = withAuth(postHandler)