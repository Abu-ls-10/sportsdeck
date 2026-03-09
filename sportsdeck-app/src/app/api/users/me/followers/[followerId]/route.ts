import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"

/**
 * @openapi
 * /api/users/me/followers/{followerId}:
 *   delete:
 *     summary: Remove a follower from the authenticated user's follower list
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: followerId
 *         required: true
 *         schema:
 *           type: string
 *         example: "clxuser456"
 *     responses:
 *       200:
 *         description: Follower removed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * DELETE /api/users/me/followers/:followerId
 *
 * Removes a follower from the current user's followers list.
 */

async function deleteHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ followerId: string }> }
) {

  try {

    const currentUser = req.user
    const { followerId } = await params

    if (!currentUser)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )

    if (!followerId)
      return NextResponse.json(
        { error: "Follower id is required" },
        { status: 400 }
      )

    const result = await prisma.follow.deleteMany({

      where: {
        followerId: followerId,
        followingId: currentUser.user_id
      }

    })

    if (result.count === 0)
      return NextResponse.json(
        { error: "Follow relationship not found" },
        { status: 404 }
      )

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )

  } catch (error) {

    console.error("DELETE /api/users/me/followers/:followerId error:", error)

    return NextResponse.json(
      { error: "Failed to remove follower" },
      { status: 500 }
    )

  }

}

export const DELETE = withAuth(deleteHandler)