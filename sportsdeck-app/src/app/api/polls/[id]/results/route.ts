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

    const pollId = params.id

    if (!pollId)
      return NextResponse.json(
        { error: "Poll id is required" },
        { status: 400 }
      )

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
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
      return NextResponse.json(
        { error: "Poll not found" },
        { status: 404 }
      )

    const results = poll.options.map(option => ({
      id: option.id,
      optionText: option.optionText,
      votes: option._count?.votes ?? 0
    }))

    return NextResponse.json(
      {
        pollId: poll.id,
        question: poll.question,
        results
      },
      { status: 200 }
    )

  } catch (err) {

    console.error("GET /api/polls/:id/results error:", err)

    return NextResponse.json(
      { error: "Failed to retrieve poll results" },
      { status: 500 }
    )
  }

}