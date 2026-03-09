import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"

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
      include: { options: true }
    })

    if (!poll)
      return NextResponse.json(
        { error: "Poll not found" },
        { status: 404 }
      )

    if (poll.isClosed || (poll.deadline && new Date() > poll.deadline))
      return NextResponse.json(
        { error: "Poll is closed" },
        { status: 403 }
      )

    // Block voting on polls in hidden threads
    const thread = await prisma.thread.findUnique({
      where: { id: poll.threadId },
      select: { isHidden: true }
    })

    if (thread?.isHidden)
      return NextResponse.json(
        { error: "This thread has been hidden by a moderator and no further activity is allowed" },
        { status: 403 }
      )

    let body
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      )
    }

    const { optionId } = body

    if (!optionId)
      return NextResponse.json(
        { error: "optionId is required" },
        { status: 400 }
      )

    const option = await prisma.pollOption.findUnique({
      where: { id: optionId }
    })

    if (!option || option.pollId !== poll.id)
      return NextResponse.json(
        { error: "Invalid poll option" },
        { status: 400 }
      )

    const existingVote = await prisma.vote.findFirst({
      where: {
        userId: user.id,
        pollOption: {
          pollId: poll.id
        }
      }
    })

    if (existingVote)
      return NextResponse.json(
        { error: "User has already voted in this poll" },
        { status: 409 }
      )

    const vote = await prisma.vote.create({
      data: {
        userId: user.id,
        pollOptionId: optionId
      }
    })

    return NextResponse.json(vote, { status: 201 })

  } catch (err) {

    console.error("POST /api/polls/:id/vote error:", err)

    return NextResponse.json(
      { error: "Failed to cast vote" },
      { status: 500 }
    )
  }
}

export const POST = withAuth(postHandler)