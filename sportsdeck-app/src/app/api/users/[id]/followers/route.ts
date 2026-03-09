import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/users/:id/followers
 *
 * Returns list of followers for a user.
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {

  try {

    const userId = params.id

    if (!userId)
      return NextResponse.json(
        { error: "User id is required" },
        { status: 400 }
      )

    // Optional but good API design: ensure user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    if (!userExists)
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )

    const followers = await prisma.follow.findMany({

      where: { followingId: userId },

      orderBy: { createdAt: "desc" },

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

    console.error("GET /api/users/:id/followers error:", error)

    return NextResponse.json(
      { error: "Failed to retrieve followers" },
      { status: 500 }
    )

  }

}