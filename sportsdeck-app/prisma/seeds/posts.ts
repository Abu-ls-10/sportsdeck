import { PrismaClient } from "../../src/generated/prisma"
import { ensureMatchThreadStarterPosts } from "../../src/lib/ensureMatchThreadStarterPosts"

export default async function seedPosts(
  prisma: PrismaClient,
  _users: { id: string }[],
  threads: { id: string; matchId: string | null }[]
) {
  void _users;
  const posts = []

  for (const thread of threads) {
    if (!thread.matchId) continue
    await ensureMatchThreadStarterPosts(prisma, thread.id, thread.matchId)
    const root = await prisma.post.findFirst({
      where: { threadId: thread.id },
      orderBy: { createdAt: "asc" },
    })
    if (root) posts.push(root)
  }

  return posts
}
