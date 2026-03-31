import { PrismaClient } from "../../src/generated/prisma"

type ActivityRow = {
  actorId: string
  type: string
  entityType: string
  entityId: string
  metadata: string | null
  createdAt: Date
}

const CHUNK = 2500

function snippet(text: string, max = 120): string {
  const t = text.replace(/\s+/g, " ").trim()
  return t.length <= max ? t : `${t.slice(0, max)}…`
}

/**
 * Activity feed / audit-style events aligned with forum, social, and poll user stories.
 * Rows tie an actor (user) to an entity for dashboards, profiles, and future aggregation.
 *
 * Types used:
 * - THREAD_CREATED, POST_CREATED, REPLY_CREATED
 * - POST_EDITED, REPLY_EDITED (from version history)
 * - POLL_CREATED, POLL_VOTE
 * - USER_FOLLOWED
 */
export default async function seedActivities(prisma: PrismaClient) {
  const rows: ActivityRow[] = []

  const threads = await prisma.thread.findMany({
    select: { id: true, authorId: true, title: true, createdAt: true },
  })
  for (const t of threads) {
    rows.push({
      actorId: t.authorId,
      type: "THREAD_CREATED",
      entityType: "THREAD",
      entityId: t.id,
      metadata: JSON.stringify({ title: t.title }),
      createdAt: t.createdAt,
    })
  }

  const posts = await prisma.post.findMany({
    where: { isHidden: false },
    select: {
      id: true,
      authorId: true,
      threadId: true,
      content: true,
      createdAt: true,
    },
  })
  for (const p of posts) {
    rows.push({
      actorId: p.authorId,
      type: "POST_CREATED",
      entityType: "POST",
      entityId: p.id,
      metadata: JSON.stringify({
        threadId: p.threadId,
        snippet: snippet(p.content),
      }),
      createdAt: p.createdAt,
    })
  }

  const replies = await prisma.reply.findMany({
    where: { isHidden: false },
    select: {
      id: true,
      authorId: true,
      postId: true,
      content: true,
      createdAt: true,
    },
  })
  for (const r of replies) {
    rows.push({
      actorId: r.authorId,
      type: "REPLY_CREATED",
      entityType: "REPLY",
      entityId: r.id,
      metadata: JSON.stringify({
        postId: r.postId,
        snippet: snippet(r.content),
      }),
      createdAt: r.createdAt,
    })
  }

  const postVersions = await prisma.postVersion.findMany({
    include: {
      post: { select: { authorId: true } },
    },
  })
  for (const pv of postVersions) {
    rows.push({
      actorId: pv.post.authorId,
      type: "POST_EDITED",
      entityType: "POST",
      entityId: pv.postId,
      metadata: JSON.stringify({
        versionId: pv.id,
        note: "Earlier revision retained for readers",
      }),
      createdAt: pv.editedAt,
    })
  }

  const replyVersions = await prisma.replyVersion.findMany({
    include: {
      reply: { select: { authorId: true } },
    },
  })
  for (const rv of replyVersions) {
    rows.push({
      actorId: rv.reply.authorId,
      type: "REPLY_EDITED",
      entityType: "REPLY",
      entityId: rv.replyId,
      metadata: JSON.stringify({
        versionId: rv.id,
        note: "Earlier revision retained for readers",
      }),
      createdAt: rv.editedAt,
    })
  }

  const polls = await prisma.poll.findMany({
    include: {
      thread: { select: { id: true, authorId: true, title: true } },
    },
  })
  for (const poll of polls) {
    rows.push({
      actorId: poll.thread.authorId,
      type: "POLL_CREATED",
      entityType: "POLL",
      entityId: poll.id,
      metadata: JSON.stringify({
        threadId: poll.threadId,
        threadTitle: poll.thread.title,
        question: snippet(poll.question, 200),
      }),
      createdAt: poll.createdAt,
    })
  }

  const votes = await prisma.vote.findMany({
    include: {
      pollOption: { select: { id: true, pollId: true } },
    },
  })
  for (const v of votes) {
    rows.push({
      actorId: v.userId,
      type: "POLL_VOTE",
      entityType: "POLL_OPTION",
      entityId: v.pollOptionId,
      metadata: JSON.stringify({ pollId: v.pollOption.pollId }),
      createdAt: v.createdAt,
    })
  }

  const follows = await prisma.follow.findMany({
    select: { followerId: true, followingId: true, createdAt: true },
  })
  for (const f of follows) {
    rows.push({
      actorId: f.followerId,
      type: "USER_FOLLOWED",
      entityType: "USER",
      entityId: f.followingId,
      metadata: JSON.stringify({ followingUserId: f.followingId }),
      createdAt: f.createdAt,
    })
  }

  let inserted = 0
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK)
    const r = await prisma.activity.createMany({ data: batch })
    inserted += r.count
  }

  console.log(`Activity seeded: ${inserted} rows (built ${rows.length} events).`)
  return inserted
}
