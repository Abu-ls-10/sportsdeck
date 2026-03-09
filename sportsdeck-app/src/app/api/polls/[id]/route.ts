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

    const poll = await prisma.poll.findUnique({
      where: { id: params.id },
      include: {
        options: true
      }
    })

    if (!poll)
      return NextResponse.json({ error: "Poll not found" }, { status: 404 })

    return NextResponse.json(poll)

  } catch (err) {

    console.error(err)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }

}


/**
 * PATCH /api/polls/:id
 *
 * Allows the thread author or an admin to edit poll properties.
 *
 * Editable fields:
 * - question
 * - deadline
 *
 * The endpoint verifies that the requesting user is either
 * the thread author or an admin before allowing the update.
 */
async function patchHandler(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = req.user

    const poll = await prisma.poll.findUnique({
      where: { id: params.id },
      include: { thread: true }
    })

    if (!poll)
      return NextResponse.json({ error: "Poll not found" }, { status: 404 })

    if (poll.thread.authorId !== user.id && user.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    // Block edits on polls in hidden threads
    if (poll.thread.isHidden)
      return NextResponse.json(
        { error: "This thread has been hidden by a moderator and cannot be edited" },
        { status: 403 }
      )

    const body = await req.json()

    const updated = await prisma.poll.update({
      where: { id: poll.id },
      data: {
        question: body.question ?? poll.question,
        deadline: body.deadline ? new Date(body.deadline) : poll.deadline
      }
    })

    return NextResponse.json(updated)

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/polls/:id
 *
 * Deletes a poll.
 *
 * Only the thread author or an admin can delete the poll.
 *
 * The poll is removed from the database. Any associated
 * options and votes will also be removed if cascading
 * deletes are configured in the Prisma schema.
 */
async function deleteHandler(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = req.user

    const poll = await prisma.poll.findUnique({
      where: { id: params.id },
      include: { thread: true }
    })

    if (!poll)
      return NextResponse.json({ error: "Poll not found" }, { status: 404 })

    if (poll.thread.authorId !== user.id && user.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    await prisma.poll.delete({
      where: { id: poll.id }
    })

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const PATCH = withAuth(patchHandler)
export const DELETE = withAuth(deleteHandler)