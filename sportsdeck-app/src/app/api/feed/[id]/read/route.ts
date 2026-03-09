import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"

/**
 * PATCH /api/feed/:id/read
 *
 * User Story:
 * Allows a user to mark a feed notification or entry as read.
 *
 * Access:
 * Authenticated users only.
 */

async function patchHandler(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const feedId = params.id

    await prisma.feedEntry.update({
      where: { id: feedId },
      data: {
        isRead: true
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const PATCH = withAuth(patchHandler)