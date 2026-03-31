import {
  pollResultsCacheKey,
  TAGS_CACHE_KEY,
  threadFullCachePrefix,
  userProfileCachePrefix,
} from "@/lib/cache/apiCacheKeys"
import { del, delByPrefix } from "@/lib/redis"
import { prisma } from "@/lib/prisma"

export async function invalidateThreadFullCache(threadId: string): Promise<void> {
  await delByPrefix(threadFullCachePrefix(threadId))
}

export async function invalidatePollResultsCache(pollId: string): Promise<void> {
  await del(pollResultsCacheKey(pollId))
}

export async function invalidateUserProfileCache(profileUserId: string): Promise<void> {
  await delByPrefix(userProfileCachePrefix(profileUserId))
}

export async function invalidateTagsListCache(): Promise<void> {
  await del(TAGS_CACHE_KEY)
}

/**
 * After admin moderation hides content, drop related API cache entries.
 */
export async function invalidateCachesAfterContentHidden(
  contentType: string,
  contentId: string
): Promise<void> {
  switch (contentType) {
    case "THREAD": {
      const polls = await prisma.poll.findMany({
        where: { threadId: contentId },
        select: { id: true },
      })
      await Promise.all(polls.map((p) => invalidatePollResultsCache(p.id)))
      await invalidateThreadFullCache(contentId)
      break
    }
    case "POST": {
      const post = await prisma.post.findUnique({
        where: { id: contentId },
        select: { threadId: true },
      })
      if (post?.threadId) {
        await invalidateThreadFullCache(post.threadId)
      }
      break
    }
    case "REPLY": {
      const reply = await prisma.reply.findUnique({
        where: { id: contentId },
        include: { post: { select: { threadId: true } } },
      })
      if (reply?.post.threadId) {
        await invalidateThreadFullCache(reply.post.threadId)
      }
      const replyPolls = await prisma.poll.findMany({
        where: { replyId: contentId },
        select: { id: true },
      })
      await Promise.all(replyPolls.map((p) => invalidatePollResultsCache(p.id)))
      break
    }
    case "POLL": {
      await invalidatePollResultsCache(contentId)
      const poll = await prisma.poll.findUnique({
        where: { id: contentId },
        select: { threadId: true },
      })
      if (poll?.threadId) {
        await invalidateThreadFullCache(poll.threadId)
      }
      break
    }
    default:
      break
  }
}
