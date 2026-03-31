import { PrismaClient } from "../../src/generated/prisma"

const CHUNK = 2500

export default async function seedFeedEntries(prisma: PrismaClient) {
  const [events, follows] = await Promise.all([
    prisma.feedEvent.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, actorId: true, eventType: true, entityType: true, entityId: true },
    }),
    prisma.follow.findMany({
      select: { followerId: true, followingId: true },
    }),
  ])

  if (events.length === 0) {
    console.log("Feed entries seeded: 0 rows (no feed events found).")
    return 0
  }

  const followerMap = new Map<string, Set<string>>()
  for (const f of follows) {
    const set = followerMap.get(f.followingId) ?? new Set<string>()
    set.add(f.followerId)
    followerMap.set(f.followingId, set)
  }

  const rows: Array<{ userId: string; feedEventId: string; isRead: boolean }> = []
  for (const event of events) {
    const recipients = new Set<string>()
    recipients.add(event.actorId)

    const actorFollowers = followerMap.get(event.actorId)
    if (actorFollowers) {
      actorFollowers.forEach((id) => recipients.add(id))
    }

    if (event.eventType === "follow_created" && event.entityType === "user") {
      recipients.add(event.entityId)
    }

    for (const userId of recipients) {
      rows.push({
        userId,
        feedEventId: event.id,
        isRead: false,
      })
    }
  }

  let inserted = 0
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK)
    const r = await prisma.feedEntry.createMany({
      data: batch,
      skipDuplicates: true,
    })
    inserted += r.count
  }

  console.log(`Feed entries seeded: ${inserted} rows (built ${rows.length}).`)
  return inserted
}
