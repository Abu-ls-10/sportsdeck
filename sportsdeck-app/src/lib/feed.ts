import { prisma } from "@/lib/prisma";

function buildGroupKey(input: {
  type: string;
  actorId: string;
  entityId: string;
}) {
  switch (input.type) {
    case "reply_created":
      return `reply:${input.actorId}:${input.entityId}`;

    case "poll_voted":
      return `poll_vote:${input.entityId}`;

    default:
      return null;
  }
}

async function resolveRecipients(input: {
  actorId: string;
  type: string;
  entityType: string;
  entityId: string;
}) {
  const recipients = new Set<string>();

  // Always include actor
  recipients.add(input.actorId);

  // =========================
  // FOLLOW EVENT
  // =========================
  if (input.type === "follow_created") {
    recipients.add(input.entityId); // target user
    return Array.from(recipients);
  }

  // =========================
  // REPLY EVENT
  // =========================
  if (input.type === "reply_created") {
    const reply = await prisma.reply.findUnique({
      where: { id: input.entityId },
      include: {
        post: {
          include: {
            thread: true
          }
        }
      }
    });

    if (!reply) return Array.from(recipients);

    // Post author
    recipients.add(reply.post.authorId);

    // Thread participants (posts)
    const participants = await prisma.post.findMany({
      where: { threadId: reply.post.threadId },
      select: { authorId: true },
      distinct: ["authorId"]
    });

    participants.forEach(p => recipients.add(p.authorId));

    // Repliers
    const repliers = await prisma.reply.findMany({
      where: {
        post: {
          threadId: reply.post.threadId
        }
      },
      select: { authorId: true },
      distinct: ["authorId"]
    });

    repliers.forEach(r => recipients.add(r.authorId));

    return Array.from(recipients);
  }

  // =========================
  // POST CREATED
  // =========================
  if (input.type === "post_created") {
    const post = await prisma.post.findUnique({
      where: { id: input.entityId }
    });

    if (!post) return Array.from(recipients);

    const participants = await prisma.post.findMany({
      where: { threadId: post.threadId },
      select: { authorId: true },
      distinct: ["authorId"]
    });

    participants.forEach(p => recipients.add(p.authorId));

    return Array.from(recipients);
  }

  // =========================
  // POLL CREATED / VOTED
  // =========================
  if (input.entityType === "poll") {
    const poll = await prisma.poll.findUnique({
      where: { id: input.entityId }
    });

    if (poll?.threadId) {
      const participants = await prisma.post.findMany({
        where: { threadId: poll.threadId },
        select: { authorId: true },
        distinct: ["authorId"]
      });

      participants.forEach(p => recipients.add(p.authorId));
    }

    return Array.from(recipients);
  }

  // =========================
  // DEFAULT → FOLLOWERS
  // =========================
  const followers = await prisma.follow.findMany({
    where: { followingId: input.actorId },
    select: { followerId: true }
  });

  followers.forEach(f => recipients.add(f.followerId));

  return Array.from(recipients);
}

export async function processFeed(input: {
  activityId: string;
  actorId: string;
  type: string;
  entityType: string;
  entityId: string;
}) {
  try {
    const groupKey = buildGroupKey(input);

    let event: any;

    if (groupKey) {
      event = await prisma.feedEvent.findFirst({
        where: {
          groupKey,
          eventType: input.type,
        },
      });
    }

    if (event) {
      event = await prisma.feedEvent.update({
        where: { id: event.id },
        data: {
          aggregateCount: { increment: 1 },
          createdAt: new Date(),
        },
      });
    } else {
      event = await prisma.feedEvent.create({
        data: {
          actorId: input.actorId,
          eventType: input.type,
          entityType: input.entityType,
          entityId: input.entityId,
          groupKey,
          aggregateCount: 1,
        },
      });

      // Dynamic recipients
      const recipientIds = await resolveRecipients(input);

      if (recipientIds.length > 0) {
        await prisma.feedEntry.createMany({
          data: recipientIds.map((userId) => ({
            userId,
            feedEventId: event.id,
          })),
          skipDuplicates: true,
        });
      }
    }

    return event;
  } catch (error) {
    console.error("Feed processing failed:", error);
  }
}