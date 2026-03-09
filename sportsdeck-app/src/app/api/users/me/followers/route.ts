import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"

/**
 * GET /api/users/me/followers
 *
 * User Story:
 * As a user, I want to see the list of users who follow me.
 *
 * Access:
 * Authenticated users only.
 *
 * Behavior:
 * - Returns followers sorted by follow time.
 */

async function getHandler(req: AuthenticatedRequest) {
  try {
    const currentUser = req.user

    const followers = await prisma.follow.findMany({
      where: {
        followingId: currentUser.id
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    })

    return NextResponse.json(followers)

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withAuth(getHandler)