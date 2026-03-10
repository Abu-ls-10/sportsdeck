import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * @openapi
 * /api/matches/{id}/thread:
 *   get:
 *     summary: Get (or auto-create) the discussion thread for a match
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "clxmatch001"
 *     responses:
 *       200:
 *         description: Match discussion thread
 *       404:
 *         description: Match not found
 *       500:
 *         description: Internal server error
 */

/**
 * GET /api/matches/:id/thread
 *
 * User Story:
 * Visitors can access a dedicated discussion thread for each match.
 *
 * Behavior:
 * - If a thread does not exist for the match, it is automatically created.
 * - Thread opens 14 days before the match.
 * - Thread closes 14 days after the match.
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    let thread = await prisma.thread.findFirst({
      where: {
        matchId,
        isMatchThread: true
      }
    })

    if (!thread) {
      const openDate = new Date(match.matchDate)
      openDate.setDate(openDate.getDate() - 14)

      const closeDate = new Date(match.matchDate)
      closeDate.setDate(closeDate.getDate() + 14)

      thread = await prisma.thread.create({
        data: {
          title: `Match Discussion`,
          matchId,
          teamId: match.homeTeamId,
          isMatchThread: true,
          opensAt: openDate,
          lockedAt: closeDate,
          authorId: "system"
        }
      })
    }

    return NextResponse.json(thread)

  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

