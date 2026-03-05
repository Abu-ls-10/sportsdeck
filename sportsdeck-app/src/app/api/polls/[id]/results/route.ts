import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/polls/:id/results
 *
 * Returns vote counts per option.
 */

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {

  try {

    const poll = await prisma.poll.findUnique({
      where: { id: params.id },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        }
      }
    })

    if (!poll)
      return NextResponse.json({ error: "Poll not found" }, { status: 404 })

    const results = poll.options.map(option => ({
      id: option.id,
      optionText: option.optionText,
      votes: option._count.votes
    }))

    return NextResponse.json({
      pollId: poll.id,
      question: poll.question,
      results
    })

  } catch (err) {

    console.error(err)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }

}