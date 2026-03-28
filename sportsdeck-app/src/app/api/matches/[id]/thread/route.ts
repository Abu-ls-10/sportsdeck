import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ensureMatchThreadStarterPosts } from "@/lib/ensureMatchThreadStarterPosts"

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

    const openDate = new Date(match.matchDate)
    openDate.setDate(openDate.getDate() - 14)

    const closeDate = new Date(match.matchDate)
    closeDate.setDate(closeDate.getDate() + 14)

    const now = Date.now()
    const openMs = openDate.getTime()
    const closeMs = closeDate.getTime()
    // Mirrors product rule: new posts only while now ∈ [opensAt, lockedAt] (kickoff ± 14 days).
    const scheduleLocked = now < openMs || now > closeMs

    // Concurrency-safe: matchId is unique on Thread, so upsert prevents P2002 races.
    const thread = await prisma.thread.upsert({
      where: { matchId },
      update: {
        // Keep the window aligned if match time changes.
        opensAt: openDate,
        lockedAt: closeDate,
        isMatchThread: true,
        teamId: match.homeTeamId,
        isLocked: scheduleLocked,
      },
      create: {
        title: `Match Discussion`,
        matchId,
        teamId: match.homeTeamId,
        isMatchThread: true,
        opensAt: openDate,
        lockedAt: closeDate,
        authorId: "system",
        isLocked: scheduleLocked,
      },
    })

    // Match pages only load this thread — not team forum threads (those have random
    // seed posts under teamId). API-synced PL matches get a new row here with no
    // posts until we seed starter content once.
    await ensureMatchThreadStarterPosts(prisma, thread.id, matchId)

    return NextResponse.json(thread)

  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

