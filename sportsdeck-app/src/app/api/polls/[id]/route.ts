import { NextResponse } from "next/server"
import {
  invalidatePollResultsCache,
  invalidateThreadFullCache,
} from "@/lib/cache/invalidateApiCache"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"

/**
 * @openapi
 * /api/polls/{id}:
 *   get:
 *     summary: Get poll details including question, options, and deadline
 *     tags: [Polls]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "clxpoll001"
 *     responses:
 *       200:
 *         description: Poll details
 *       404:
 *         description: Poll not found
 *       500:
 *         description: Internal server error
 *   patch:
 *     summary: Edit poll question or deadline (thread owner or admin)
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
 *             properties:
 *               question:
 *                 type: string
 *                 example: "Who will score first?"
 *               deadline:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-04-15T18:00:00.000Z"
 *     responses:
 *       200:
 *         description: Poll updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden or account banned
 *       404:
 *         description: Poll not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete a poll (thread owner or admin)
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
 *     responses:
 *       200:
 *         description: Poll deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden or account banned
 *       404:
 *         description: Poll not found
 *       500:
 *         description: Internal server error
 */

/**
 * GET /api/polls/:id
 *
 * Returns poll details including:
 * - question
 * - options
 * - deadline
 * - isClosed
 * - thread (for navigation)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params

    if (!pollId) {
      return NextResponse.json(
        { error: "Poll id is required" },
        { status: 400 }
      )
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }, // important for UI %
            },
          },
        },
        thread: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    if (!poll) {
      return NextResponse.json(
        { error: "Poll not found" },
        { status: 404 }
      )
    }

    if (poll.isHidden) {
      return NextResponse.json(
        { error: "Poll not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(poll, { status: 200 })

  } catch (err) {
    console.error("GET /api/polls/:id error:", err)

    return NextResponse.json(
      { error: "Failed to retrieve poll" },
      { status: 500 }
    )
  }
}


/**
 * PATCH /api/polls/:id
 *
 * Allows the thread author or an admin to edit poll properties.
 */
async function patchHandler(
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

    if (!pollId)
      return NextResponse.json(
        { error: "Poll id is required" },
        { status: 400 }
      )

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { thread: true }
    })

    if (!poll)
      return NextResponse.json(
        { error: "Poll not found" },
        { status: 404 }
      )

    if (poll.isHidden)
      return NextResponse.json(
        { error: "This poll has been hidden by a moderator and cannot be modified" },
        { status: 403 }
      )

    if (poll.thread.authorId !== user.id && user.role !== "ADMIN")
      return NextResponse.json(
        { error: "You are not allowed to modify this poll" },
        { status: 403 }
      )

    if (poll.thread.isHidden)
      return NextResponse.json(
        { error: "This thread has been hidden by a moderator and cannot be edited" },
        { status: 403 }
      )

    const body = await req.json()

    if (body.deadline) {
      const parsed = new Date(body.deadline)
      if (isNaN(parsed.getTime()))
        return NextResponse.json(
          { error: "Invalid deadline format" },
          { status: 400 }
        )
    }

    const updated = await prisma.poll.update({
      where: { id: poll.id },
      data: {
        question: body.question ?? poll.question,
        deadline: body.deadline ? new Date(body.deadline) : poll.deadline
      }
    })

    await invalidatePollResultsCache(poll.id)
    await invalidateThreadFullCache(poll.threadId)

    return NextResponse.json(updated, { status: 200 })

  } catch (err) {

    console.error("PATCH /api/polls/:id error:", err)

    return NextResponse.json(
      { error: "Failed to update poll" },
      { status: 500 }
    )
  }
}


/**
 * DELETE /api/polls/:id
 *
 * Deletes a poll.
 *
 * Only the thread author or an admin can delete the poll.
 */
async function deleteHandler(
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

    if (!pollId)
      return NextResponse.json(
        { error: "Poll id is required" },
        { status: 400 }
      )

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { thread: true }
    })

    if (!poll)
      return NextResponse.json(
        { error: "Poll not found" },
        { status: 404 }
      )

    if (poll.isHidden)
      return NextResponse.json(
        { error: "This poll has been hidden by a moderator and cannot be deleted" },
        { status: 403 }
      )

    if (poll.thread.authorId !== user.id && user.role !== "ADMIN")
      return NextResponse.json(
        { error: "You are not allowed to delete this poll" },
        { status: 403 }
      )

    const threadId = poll.threadId
    const pollPk = poll.id

    await prisma.poll.delete({
      where: { id: poll.id }
    })

    await invalidatePollResultsCache(pollPk)
    await invalidateThreadFullCache(threadId)

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )

  } catch (err) {

    console.error("DELETE /api/polls/:id error:", err)

    return NextResponse.json(
      { error: "Failed to delete poll" },
      { status: 500 }
    )
  }
}

export const PATCH = withAuth(patchHandler)
export const DELETE = withAuth(deleteHandler)