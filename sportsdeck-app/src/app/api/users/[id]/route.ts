import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/users/:id
 *
 * User Story:
 * As a visitor, I want to check out a user's profile page which includes
 * their follower/following counts, favorite team, and recent activity.
 *
 * Access:
 * Public endpoint — visitors do NOT need authentication.
 *
 * Data returned:
 * - Basic user profile information (username, avatarUrl, createdAt)
 * - Favorite team information via User.favoriteTeam relation
 * - Number of followers and users the person is following
 * - Recent threads created by the user
 * - Recent posts written by the user
 * - Recent replies written by the user
 *
 * Prisma relations used:
 * - User.favoriteTeam -> Team
 * - Follow.followerId / Follow.followingId
 * - Thread.authorId
 * - Post.authorId
 * - Reply.authorId
 *
 * Important behavior:
 * - Hidden content (isHidden = true) is excluded
 * - Activity lists are limited for performance
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
        favoriteTeam: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const followersCount = await prisma.follow.count({
      where: { followingId: userId },
    })

    const followingCount = await prisma.follow.count({
      where: { followerId: userId },
    })

    const threads = await prisma.thread.findMany({
      where: {
        authorId: userId,
        isHidden: false,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    })

    const posts = await prisma.post.findMany({
      where: {
        authorId: userId,
        isHidden: false,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        threadId: true,
        content: true,
        createdAt: true,
      },
    })

    const replies = await prisma.reply.findMany({
      where: {
        authorId: userId,
        isHidden: false,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        postId: true,
        content: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      user,
      followersCount,
      followingCount,
      threads,
      posts,
      replies,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}