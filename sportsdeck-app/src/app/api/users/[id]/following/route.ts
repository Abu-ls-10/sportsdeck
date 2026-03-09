import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/users/:id/following
 *
 * Returns list of users that a given user follows.
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  try {

    const { id: userId } = await params

    if (!userId)
      return NextResponse.json(
        { error: "User id is required" },
        { status: 400 }
      )

    // Optional but good API design: verify user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    if (!userExists)
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )

    const following = await prisma.follow.findMany({

      where: { followerId: userId },

      orderBy: { createdAt: "desc" },

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

    console.error("GET /api/users/:id/following error:", error)

    return NextResponse.json(
      { error: "Failed to retrieve following list" },
      { status: 500 }
    )

  }

}