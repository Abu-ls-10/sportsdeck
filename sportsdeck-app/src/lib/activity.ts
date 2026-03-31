import { prisma } from "@/lib/prisma";
import { processFeed } from "@/lib/feed";

type ActivityInput = {
  actorId: string;
  type:
    | "follow_created"
    | "thread_created"
    | "post_created"
    | "reply_created"
    | "poll_created"
    | "poll_voted";
  entityType: "user" | "thread" | "post" | "reply" | "poll";
  entityId: string;
};

export async function logActivity(input: ActivityInput) {
  try {
    const activity = await prisma.activity.create({
      data: {
        actorId: input.actorId,
        type: input.type,
        entityType: input.entityType,
        entityId: input.entityId,
      },
    });

    // Trigger feed pipeline
    await processFeed({
      activityId: activity.id,
      actorId: input.actorId,
      type: input.type,
      entityType: input.entityType,
      entityId: input.entityId,
    });

    return activity;
  } catch (error) {
    console.error("Activity logging failed:", error);
  }
}