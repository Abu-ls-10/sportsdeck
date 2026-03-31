import { PrismaClient } from "../../src/generated/prisma"

const CHUNK = 2500

function normalizeEventType(type: string): string {
  const t = type.trim().toLowerCase()
  if (t.endsWith("_created") || t.endsWith("_edited") || t === "poll_voted") {
    return t
  }
  return t
}

function normalizeEntityType(entityType: string): string {
  return entityType.trim().toLowerCase()
}

export default async function seedFeedEvents(prisma: PrismaClient) {
  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      actorId: true,
      type: true,
      entityType: true,
      entityId: true,
      createdAt: true,
    },
  })

  if (activities.length === 0) {
    console.log("Feed events seeded: 0 rows (no activities found).")
    return 0
  }

  const rows = activities.map((a) => ({
    actorId: a.actorId,
    eventType: normalizeEventType(a.type),
    entityType: normalizeEntityType(a.entityType),
    entityId: a.entityId,
    aggregateCount: 1,
    createdAt: a.createdAt,
  }))

  let inserted = 0
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK)
    const r = await prisma.feedEvent.createMany({ data: batch })
    inserted += r.count
  }

  console.log(`Feed events seeded: ${inserted} rows.`)
  return inserted
}
