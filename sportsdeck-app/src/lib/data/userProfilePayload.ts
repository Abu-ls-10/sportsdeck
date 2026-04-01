import { prisma } from "@/lib/prisma"

export type UserProfilePayload = {
  id: string
  username: string
  avatarUrl: string | null
  createdAt: Date
  favoriteTeam: {
    id: string
    name: string
    logoUrl: string | null
  } | null
  _count: {
    followers: number
    following: number
    threads: number
    posts: number
    replies: number
  }
  isFollowing: boolean
  threads: {
    id: string
    title: string
    createdAt: Date
    _count: { posts: number }
  }[]
  posts: {
    id: string
    threadId: string
    content: string
    createdAt: Date
  }[]
  replies: {
    id: string
    postId: string
    content: string
    createdAt: Date
  }[]
}

/** Returns null if user not found. */
export async function loadUserProfilePayload(
  userId: string,
  viewerId: string | null
): Promise<UserProfilePayload | null> {
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

  if (!user) return null

  const [
    followersCount,
    followingCount,
    threads,
    posts,
    replies,
    followRelation,
  ] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
    prisma.thread.findMany({
      where: { authorId: userId, isHidden: false },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        createdAt: true,
        _count: { select: { posts: true } },
      },
    }),
    prisma.post.findMany({
      where: { authorId: userId, isHidden: false },
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
      where: { authorId: userId, isHidden: false },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        postId: true,
        content: true,
        createdAt: true,
      },
    }),
    viewerId
      ? prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: viewerId,
              followingId: userId,
            },
          },
        })
      : null,
  ])

  return {
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
  }
}
