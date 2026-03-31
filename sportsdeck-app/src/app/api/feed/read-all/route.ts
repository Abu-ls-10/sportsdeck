import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"

/**
 * PATCH /api/feed/read-all
 *
 * Marks all feed entries as read for the current user
 */

async function patchHandler(req: AuthenticatedRequest) {
  try {
    const user = req.user

    // middleware already guarantees auth, but safe to keep
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    await prisma.feedEntry.updateMany({
      where: {
        userId: user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error("PATCH /api/feed/read-all error:", error)

    return NextResponse.json(
      { error: "Failed to mark all as read" },
      { status: 500 }
    )
  }
}

export const PATCH = withAuth(patchHandler)