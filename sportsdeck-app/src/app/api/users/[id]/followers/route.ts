import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * @openapi
 * /api/users/{id}/followers:
 *   get:
 *     summary: Get the list of users who follow a given user
 *     tags: [Users]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: "clxuser789"
 *     responses:
 *       200:
 *         description: List of followers with profile info
 *       400:
 *         description: User ID is required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

/**
 * GET /api/users/:id/followers
 *
 * Returns list of followers for a user.
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