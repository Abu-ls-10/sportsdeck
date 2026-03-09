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

    if (poll.thread.authorId !== user.id && user.role !== "ADMIN")
      return NextResponse.json(
        { error: "You are not allowed to modify this poll" },
        { status: 403 }
      )

    if (poll.thread.isHidden)
      return NextResponse.json(
        { error: "This thread has been hidden by a moderator and cannot be modified" },
        { status: 403 }
      )

    if (poll.isClosed)
      return NextResponse.json(
        { error: "Poll is closed and cannot accept new options" },
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

    const { options } = body

    if (!options || !Array.isArray(options))
      return NextResponse.json(
        { error: "Options array is required" },
        { status: 400 }
      )

    if (options.length === 0)
      return NextResponse.json(
        { error: "At least one option must be provided" },
        { status: 400 }
      )

    const cleanedOptions = options
      .map((o: string) => o?.trim())
      .filter((o: string) => o && o.length > 0)

    if (cleanedOptions.length === 0)
      return NextResponse.json(
        { error: "Options cannot be empty" },
        { status: 400 }
      )

    await prisma.pollOption.createMany({
      data: cleanedOptions.map((optionText: string) => ({
        pollId: poll.id,
        optionText
      }))
    })

    const createdOptions = await prisma.pollOption.findMany({
      where: { pollId: poll.id }
    })

    return NextResponse.json(createdOptions, { status: 201 })

  } catch (err) {

    console.error("POST /api/polls/:id/options error:", err)

    return NextResponse.json(
      { error: "Failed to add poll options" },
      { status: 500 }
    )
  }
}

export const POST = withAuth(postHandler)