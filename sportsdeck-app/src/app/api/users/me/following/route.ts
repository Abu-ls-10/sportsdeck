import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"

/**
 * GET /api/users/me/following
 *
 * User Story:
 * As a user, I want to view the list of users I am following.
 *
 * Access:
 * Authenticated users only.
 *
 * Behavior:
 * - Returns all users the current user follows.
 * - Sorted by follow time (most recent first).
 *
 * Tables used:
 * FOLLOW
 * USER
 */

async function getHandler(req: AuthenticatedRequest) {
  try {
    const currentUser = req.user

    const following = await prisma.follow.findMany({
      where: {
        followerId: currentUser.id
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    })

    return NextResponse.json(following)

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withAuth(getHandler)