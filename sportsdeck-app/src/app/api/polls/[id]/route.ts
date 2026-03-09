import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"


/**
 * GET /api/polls/:id
 *
 * Returns poll details including:
 * - question
 * - options
 * - deadline
 * - isClosed
 *
 * Accessible by visitors.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {

  try {

    const pollId = params.id

    if (!pollId)
      return NextResponse.json(
        { error: "Poll id is required" },
        { status: 400 }
      )

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: true
      }
    })

    if (!poll)
      return NextResponse.json(
        { error: "Poll not found" },
        { status: 404 }
      )

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
  { params }: { params: { id: string } }
) {
  try {

    const user = req.user
    const pollId = params.id

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
  { params }: { params: { id: string } }
) {
  try {

    const user = req.user
    const pollId = params.id

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

    if (poll.thread.authorId !== user.id && user.role !== "ADMIN")
      return NextResponse.json(
        { error: "You are not allowed to delete this poll" },
        { status: 403 }
      )

    await prisma.poll.delete({
      where: { id: poll.id }
    })

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