import { NextResponse } from "next/server"
import { invalidateUserProfileCache } from "@/lib/cache/invalidateApiCache"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"
import { logActivity } from "@/lib/activity"

/**
 * @openapi
 * /api/follow/{userId}:
 *   post:
 *     summary: Follow a user
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         example: "clxuser789"
 *     responses:
 *       200:
 *         description: Now following the user
 *       400:
 *         description: Cannot follow yourself or already following
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Account banned
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Unfollow a user
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         example: "clxuser789"
 *     responses:
 *       200:
 *         description: Successfully unfollowed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Account banned
 *       500:
 *         description: Internal server error
 */

/**
 * POST /api/follow/:userId
 *
 * User Story:
 * As a user, I want to follow another user so I can keep up with
 * their activity in my personalized feed.
 *
 * Access:
 * Authenticated users only.
 */

async function postHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = req.user
    const { userId: targetUserId } = await params

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Target user id is required" },
        { status: 400 }
      )
    }

    if (currentUser.id === targetUserId) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      )
    }

    // Ensure the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const existing = await prisma.follow.findFirst({
      where: {
        followerId: currentUser.id,
        followingId: targetUserId
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: "Already following this user" },
        { status: 409 }
      )
    }

    await prisma.follow.create({
      data: {
        followerId: currentUser.id,
        followingId: targetUserId
      }
    })

    await logActivity({
      actorId: currentUser.id,
      type: "follow_created",
      entityType: "user",
      entityId: targetUserId,
    })

    await invalidateUserProfileCache(targetUserId)
    await invalidateUserProfileCache(currentUser.id)

    return NextResponse.json({ success: true }, { status: 201 })

  } catch (error) {

    console.error("POST /api/follow/:userId error:", error)

    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/follow/:userId
 *
 * User Story:
 * As a user, I want to unfollow someone so that their activity
 * no longer appears in my feed.
 */

async function deleteHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {

    const currentUser = req.user
    const { userId: targetUserId } = await params

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Target user id is required" },
        { status: 400 }
      )
    }

    const result = await prisma.follow.deleteMany({
      where: {
        followerId: currentUser.id,
        followingId: targetUserId
      }
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Follow relationship not found" },
        { status: 404 }
      )
    }

    await invalidateUserProfileCache(targetUserId)
    await invalidateUserProfileCache(currentUser.id)

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {

    console.error("DELETE /api/follow/:userId error:", error)

    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    )
  }
}

export const POST = withAuth(postHandler)
export const DELETE = withAuth(deleteHandler)