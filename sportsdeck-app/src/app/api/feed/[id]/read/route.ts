import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"

/**
 * @openapi
 * /api/feed/{id}/read:
 *   patch:
 *     summary: Mark a feed entry as read
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: "clxfeed001"
 *     responses:
 *       200:
 *         description: Feed entry marked as read
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Feed entry not found
 *       500:
 *         description: Internal server error
 */

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = req.user
    const { id: feedId } = await params

    // Safety check (middleware should enforce this)
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Validate feed ID
    if (!feedId) {
      return NextResponse.json(
        { error: "Feed entry id is required" },
        { status: 400 }
      )
    }

    // Ensure the feed entry exists AND belongs to the current user
    const entry = await prisma.feedEntry.findUnique({
      where: { id: feedId },
      select: {
        id: true,
        userId: true
      }
    })

    if (!entry) {
      return NextResponse.json(
        { error: "Feed entry not found" },
        { status: 404 }
      )
    }

    if (entry.userId !== currentUser.id) {
      return NextResponse.json(
        { error: "You are not allowed to modify this feed entry" },
        { status: 403 }
      )
    }

    await prisma.feedEntry.update({
      where: { id: feedId },
      data: {
        isRead: true
      }
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {

    console.error("PATCH /api/feed/:id/read error:", error)

    return NextResponse.json(
      { error: "Failed to mark feed entry as read" },
      { status: 500 }
    )
  }
}

export const PATCH = withAuth(patchHandler)