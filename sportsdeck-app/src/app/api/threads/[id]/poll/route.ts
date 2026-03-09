import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromToken } from "@/lib/auth"

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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: { polls: true }
    })

    if (!thread) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      )
    }

    if (thread.polls.length > 0) {
      return NextResponse.json(
        { error: "Thread already has a poll" },
        { status: 400 }
      )
    }

    if (thread.authorId !== user.user_id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const body = await request.json()

    const { question, deadline } = body

    if (!question || !deadline) {
      return NextResponse.json(
        { error: "Question and deadline required" },
        { status: 400 }
      )
    }

    const poll = await prisma.poll.create({
      data: {
        threadId: thread.id,
        question,
        deadline: new Date(deadline),
        isClosed: false
      }
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