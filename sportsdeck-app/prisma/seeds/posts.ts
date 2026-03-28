import { PrismaClient } from "../../src/generated/prisma"
import type { Post } from "../../src/generated/prisma"

const DAY_MS = 24 * 60 * 60 * 1000

function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/** Team forum posts: activity spread over the last ~30 days */
function randomCreatedAt(): Date {
  const now = Date.now()
  const maxAgeMs = 30 * DAY_MS
  return new Date(now - rnd(0, maxAgeMs))
}

/**
 * Match-thread posts: timestamps between 21 days before kickoff and end of the
 * match discussion window (kickoff + 14d), capped at "now" for realism.
 */
function randomCreatedAtForMatchThread(matchDate: Date): Date {
  const m = matchDate.getTime()
  const windowEnd = m + 14 * DAY_MS
  const start = m - 21 * DAY_MS
  const end = Math.min(Date.now(), windowEnd)
  if (end <= start) {
    return new Date(m - rnd(0, 7) * DAY_MS)
  }
  return new Date(start + Math.random() * (end - start))
}

function replyCreatedAt(postAt: Date, matchDate: Date): Date {
  const minT = postAt.getTime() + 60_000
  const windowEnd = matchDate.getTime() + 14 * DAY_MS
  const maxT = Math.min(Date.now(), windowEnd)
  if (maxT <= minT) {
    return new Date(minT)
  }
  return new Date(minT + Math.random() * (maxT - minT))
}

const GENERIC_SNIPPETS = [
  "Honestly think we need more creativity in the final third.",
  "The press has looked sharper lately — hope we keep that energy.",
  "Not worried yet, but the schedule gets brutal from here.",
  "Anyone else going to the ground for this one?",
  "Stats don't tell the whole story; eye test matters too.",
  "You love to see the academy kids getting minutes.",
  "VAR moment still has me heated from last week.",
  "If we stay compact out of possession we should be fine.",
  "That substitution changed the game for me.",
  "Respect to the away support — loud all match.",
]

const MATCH_SNIPPETS = (home: string, away: string) => [
  `Prediction: tight affair between ${home} and ${away}.`,
  `${home} at home — edge to the hosts if they start fast.`,
  `${away} on the counter could punish any sloppy turnover.`,
  `Key battle: ${home}'s midfield vs ${away}'s press.`,
  `I'm going 2-1 — could go either way in the last twenty.`,
  `Set pieces might decide this one; both sides are big.`,
  `Injuries could force a surprise lineup — watching team news.`,
  `Derby intensity even though it's not a local derby.`,
  `Weather might be a factor; could get scrappy.`,
]

const TEAM_SNIPPETS = (team: string) => [
  `Proud of how ${team} fought last weekend.`,
  `${team} fans — what's your ideal XI for the next run?`,
  `Transfer rumor mill is noisy; I'd trust the manager until summer.`,
  `Youth pipeline at ${team} is finally paying off.`,
  `Tactics thread: do we press high or sit in a mid-block?`,
  `Injury updates: anyone heard training-ground news?`,
]

function buildParagraph(rng: () => number, ctx: { kind: "match" | "team"; home?: string; away?: string; team?: string }): string {
  const parts: string[] = []
  const n = rnd(2, 4)
  for (let i = 0; i < n; i++) {
    if (ctx.kind === "match" && ctx.home && ctx.away && rng() < 0.45) {
      parts.push(pick(MATCH_SNIPPETS(ctx.home, ctx.away)))
    } else if (ctx.kind === "team" && ctx.team && rng() < 0.45) {
      parts.push(pick(TEAM_SNIPPETS(ctx.team)))
    } else {
      parts.push(pick(GENERIC_SNIPPETS))
    }
  }
  return parts.join(" ")
}

export default async function seedPosts(
  prisma: PrismaClient,
  _users: { id: string }[],
  _threads: { id: string; matchId: string | null }[]
) {
  void _users
  void _threads

  const authors = await prisma.user.findMany({
    where: { isBanned: false, id: { not: "system" } },
    select: { id: true },
  })
  if (authors.length === 0) {
    console.warn("seedPosts: no eligible authors, skipping")
    return []
  }

  const authorIds = authors.map((u) => u.id)

  const pickAuthor = () => pick(authorIds)
  const rng = () => Math.random()

  const allThreads = await prisma.thread.findMany({
    include: {
      match: { include: { homeTeam: true, awayTeam: true } },
      team: true,
    },
  })

  const createdPosts: Post[] = []

  for (const thread of allThreads) {
    let numPosts = 0

    if (thread.matchId && thread.match) {
      // Always seed posts for every match thread (past, future, or in-between).
      // Posting is gated in the app by opensAt / lockedAt around kickoff ± 14 days.
      numPosts = rnd(1, 25)
    } else if (thread.teamId && !thread.matchId) {
      numPosts = rnd(1, 25)
    } else {
      continue
    }

    const matchDate = thread.match?.matchDate

    for (let i = 0; i < numPosts; i++) {
      const authorId = pickAuthor()
      const homeName = thread.match?.homeTeam.shortName ?? thread.match?.homeTeam.name ?? "Home"
      const awayName = thread.match?.awayTeam.shortName ?? thread.match?.awayTeam.name ?? "Away"
      const teamName = thread.team?.shortName ?? thread.team?.name ?? "the club"

      const content =
        thread.matchId && thread.match
          ? buildParagraph(rng, { kind: "match", home: homeName, away: awayName })
          : buildParagraph(rng, { kind: "team", team: teamName })

      const createdAt =
        thread.match && matchDate ? randomCreatedAtForMatchThread(matchDate) : randomCreatedAt()

      const post = await prisma.post.create({
        data: {
          threadId: thread.id,
          authorId,
          content,
          createdAt,
        },
      })
      createdPosts.push(post)

      const editThis = rng() < 0.18
      if (editThis) {
        const oldContent = post.content
        const tweaked = `${oldContent} (Edit: clarified my take after rewatching the highlights.)`
        await prisma.postVersion.create({
          data: {
            postId: post.id,
            oldContent,
            editedAt: new Date(createdAt.getTime() + rnd(60, 3600) * 1000),
          },
        })
        await prisma.post.update({
          where: { id: post.id },
          data: {
            content: tweaked,
            isEdited: true,
          },
        })
      }

      if (rng() < 0.38) {
        const nReplies = rnd(1, 3)
        for (let r = 0; r < nReplies; r++) {
          let replyAuthor = pickAuthor()
          if (authorIds.length > 1) {
            while (replyAuthor === authorId && rng() < 0.5) {
              replyAuthor = pickAuthor()
            }
          }
          const replyContent = thread.match
            ? buildParagraph(rng, { kind: "match", home: homeName, away: awayName })
            : buildParagraph(rng, { kind: "team", team: teamName })
          const replyAt =
            thread.match && matchDate
              ? replyCreatedAt(createdAt, matchDate)
              : new Date(createdAt.getTime() + rnd(120, 72 * 3600) * 1000)

          const reply = await prisma.reply.create({
            data: {
              postId: post.id,
              authorId: replyAuthor,
              content: replyContent,
              createdAt: replyAt,
            },
          })

          if (rng() < 0.12) {
            const oldR = reply.content
            await prisma.replyVersion.create({
              data: {
                replyId: reply.id,
                oldContent: oldR,
                editedAt: new Date(replyAt.getTime() + rnd(30, 900) * 1000),
              },
            })
            await prisma.reply.update({
              where: { id: reply.id },
              data: {
                content: `${oldR} — small typo fix.`,
                isEdited: true,
              },
            })
          }
        }
      }
    }
  }

  console.log(`seedPosts: created ${createdPosts.length} posts (with replies & versions where randomized)`)
  return createdPosts
}
