import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"

/**
 * GET /api/users/me/followers
 *
 * Returns the list of users who follow the authenticated user.
 */

async function getHandler(req: AuthenticatedRequest) {

  try {

    const currentUser = req.user

    if (!currentUser)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )

    const followers = await prisma.follow.findMany({

      where: {
        followingId: currentUser.user_id
      },

      orderBy: {
        createdAt: "desc"
      },

      select: {
        follower: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }

    })

    const result = followers.map((f) => f.follower)

    return NextResponse.json(result, { status: 200 })

  } catch (error) {

    console.error("GET /api/users/me/followers error:", error)

    return NextResponse.json(
      { error: "Failed to retrieve followers list" },
      { status: 500 }
    )

  }

}

export const GET = withAuth(getHandler)