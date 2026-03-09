import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"

/**
 * POST /api/polls/:id/options
 *
 * Adds options to an existing poll.
 * Only thread owner or admin can add options.
 *
 * Body:
 * {
 *   options: ["Team A", "Team B"]
 * }
 */

async function postHandler(
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

    const body = await req.json()
    const { options } = body

    if (!options || !Array.isArray(options))
      return NextResponse.json({ error: "Options required" }, { status: 400 })

    const created = []

    for (const optionText of options) {
      const option = await prisma.pollOption.create({
        data: {
          pollId: poll.id,
          optionText
        }
      })
      created.push(option)
    }

    return NextResponse.json(created, { status: 201 })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withAuth(postHandler)