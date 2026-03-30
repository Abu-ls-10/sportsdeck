import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/middleware"


/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Get user details
 *     tags: [Users]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       400:
 *         description: User ID is required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

/**
 * GET /api/users/:id
 *
 * Returns a fully aggregated user profile
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "User id is required" },
        { status: 400 }
      );
    }

    /* =========================
       Get current user (for follow state)
    ========================= */
    // Assumes auth middleware attaches user to request
    const currentUserId = (req as any).user?.id ?? null;

    /* =========================
       Fetch core user
    ========================= */

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
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    /* =========================
       Parallel queries
    ========================= */

    const [
      followersCount,
      followingCount,
      threads,
      posts,
      replies,
      followRelation,
    ] = await Promise.all([
      prisma.follow.count({
        where: { followingId: userId },
      }),

      prisma.follow.count({
        where: { followerId: userId },
      }),

      prisma.thread.findMany({
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
          _count: {
            select: {
              posts: true, // reply count
            },
          },
        },
      }),

      prisma.post.findMany({
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
      }),

      prisma.reply.findMany({
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
      }),

      currentUserId
        ? prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUserId,
                followingId: userId,
              },
            },
          })
        : null,
    ]);

    /* =========================
       Final response (FLATTENED)
    ========================= */

    return NextResponse.json(
      {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        favoriteTeam: user.favoriteTeam,

        _count: {
          followers: followersCount,
          following: followingCount,
          threads: threads.length,
          posts: posts.length,
          replies: replies.length,
        },

        isFollowing: !!followRelation,

        threads,
        posts,
        replies,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/users/:id error:", error);

    return NextResponse.json(
      { error: "Failed to retrieve user profile" },
      { status: 500 }
    );
  }
}