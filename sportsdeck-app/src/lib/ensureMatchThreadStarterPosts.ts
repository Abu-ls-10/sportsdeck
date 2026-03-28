import type { PrismaClient } from "../generated/prisma";

/**
 * If a match discussion thread has no posts yet, add one root post + reply.
 * Runs on GET /matches/:id/thread so API-synced matches get readable content.
 * Does not use "today's" calendar window — past/future matches are backfilled the same.
 */
export async function ensureMatchThreadStarterPosts(
  prisma: PrismaClient,
  threadId: string,
  matchId: string
): Promise<void> {
  const postCount = await prisma.post.count({ where: { threadId } });
  if (postCount > 0) return;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { homeTeam: true, awayTeam: true },
  });
  if (!match) return;

  const homeFan = await prisma.user.findFirst({
    where: { favoriteTeamId: match.homeTeamId, isBanned: false },
  });
  const awayFan = await prisma.user.findFirst({
    where: { favoriteTeamId: match.awayTeamId, isBanned: false },
  });

  const fallback = await prisma.user.findMany({
    where: { id: { not: "system" }, isBanned: false },
    take: 2,
    orderBy: { createdAt: "asc" },
  });

  const authorId = homeFan?.id ?? fallback[0]?.id;
  const replierId = awayFan?.id ?? fallback[1]?.id ?? fallback[0]?.id;
  if (!authorId || !replierId) return;

  const homeName = match.homeTeam.shortName || match.homeTeam.name;
  const awayName = match.awayTeam.shortName || match.awayTeam.name;

  const post = await prisma.post.create({
    data: {
      threadId,
      authorId,
      content: `${homeName} will edge this one — I'm calling a narrow win at home. The midfield battle decides it. Come on you ${homeName}!`,
    },
  });

  await prisma.reply.create({
    data: {
      postId: post.id,
      authorId: replierId,
      content: `Don't celebrate too early — ${awayName} has a habit of late drama. Expect a nervy last fifteen either way.`,
    },
  });
}
