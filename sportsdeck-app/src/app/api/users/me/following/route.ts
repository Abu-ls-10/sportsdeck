import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"

/**
 * GET /api/users/me/following
 *
 * Returns the list of users the authenticated user follows.
 */

async function getHandler(req: AuthenticatedRequest) {

  try {

    const currentUser = req.user

    if (!currentUser)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )

    const following = await prisma.follow.findMany({

      where: {
        followerId: currentUser.user_id
      },

      orderBy: {
        createdAt: "desc"
      },

      select: {
        following: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }

    })

    const result = following.map((f) => f.following)

    return NextResponse.json(result, { status: 200 })

  } catch (error) {

    console.error("GET /api/users/me/following error:", error)

    return NextResponse.json(
      { error: "Failed to retrieve following list" },
      { status: 500 }
    )

  }

}

export const GET = withAuth(getHandler)