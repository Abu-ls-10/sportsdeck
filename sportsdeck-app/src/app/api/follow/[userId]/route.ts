import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromToken } from "@/lib/auth"

/**
 * POST /api/follow/:userId
 *
 * User Story:
 * As a user, I want to follow another user so I can keep up with
 * their activity in my personalized feed.
 *
 * Access:
 * Authenticated users only.
 *
 * Behavior:
 * - Creates a new Follow relationship between the current user
 *   (follower) and the target user (following).
 * - Prevents users from following themselves.
 * - Prevents duplicate follow relationships.
 *
 * Prisma table used:
 * Follow
 *
 * Fields:
 * - followerId  -> current authenticated user
 * - followingId -> target user
 */

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const currentUser = await getUserFromToken(req)

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const targetUserId = params.userId

    if (currentUser.id === targetUserId) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      )
    }

    const existing = await prisma.follow.findFirst({
      where: {
        followerId: currentUser.id,
        followingId: targetUserId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Already following this user" },
        { status: 400 }
      )
    }

    await prisma.follow.create({
      data: {
        followerId: currentUser.id,
        followingId: targetUserId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Internal server error" },
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
 *
 * Access:
 * Authenticated users only.
 *
 * Behavior:
 * - Deletes the follow relationship between the current user
 *   and the target user.
 */

export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const currentUser = await getUserFromToken(req)

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const targetUserId = params.userId

    await prisma.follow.deleteMany({
      where: {
        followerId: currentUser.id,
        followingId: targetUserId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}