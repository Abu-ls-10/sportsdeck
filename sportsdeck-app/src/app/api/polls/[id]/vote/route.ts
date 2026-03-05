import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromToken } from "@/lib/auth"

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

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {

  try {

    const user = await getUserFromToken(request)

    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const poll = await prisma.poll.findUnique({
      where: { id: params.id },
      include: { options: true }
    })

    if (!poll)
      return NextResponse.json({ error: "Poll not found" }, { status: 404 })

    if (poll.isClosed || new Date() > poll.deadline)
      return NextResponse.json({ error: "Poll closed" }, { status: 400 })

    const body = await request.json()
    const { optionId } = body

    const option = await prisma.pollOption.findUnique({
      where: { id: optionId }
    })

    if (!option || option.pollId !== poll.id)
      return NextResponse.json({ error: "Invalid option" }, { status: 400 })


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
        { error: "User already voted in this poll" },
        { status: 400 }
      )


    const vote = await prisma.vote.create({
      data: {
        userId: user.id,
        pollOptionId: optionId
      }
    })

    return NextResponse.json(vote, { status: 201 })

  } catch (err) {

    console.error(err)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }

}