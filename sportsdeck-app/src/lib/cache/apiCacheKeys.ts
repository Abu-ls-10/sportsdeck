/** Prefix for all viewer-specific keys for one thread (use with SCAN invalidation). */
export function threadFullCachePrefix(threadId: string): string {
  return `thread:full:${threadId}:`;
}

/** GET /api/threads/[id]/full — viewer suffix avoids cross-user poll vote leakage. */
export function threadFullCacheKey(
  threadId: string,
  viewerId: string | null
): string {
  return `${threadFullCachePrefix(threadId)}${viewerId ?? "anon"}`;
}

/** GET /api/polls/[id]/results */
export function pollResultsCacheKey(pollId: string): string {
  return `poll:results:${pollId}`;
}

/** Prefix for SCAN invalidation of all viewer variants of a public profile. */
export function userProfileCachePrefix(profileUserId: string): string {
  return `user:profile:${profileUserId}:`;
}

/** GET /api/users/[id] — viewer suffix for isFollowing. */
export function userProfileCacheKey(
  profileUserId: string,
  viewerId: string | null
): string {
  return `${userProfileCachePrefix(profileUserId)}${viewerId ?? "anon"}`;
}

export const TAGS_CACHE_KEY = "tags:all";

/** Plan: short TTL for hot thread pages. */
export const THREAD_FULL_TTL_SECONDS = 60;

/** Plan: semi-static global list. */
export const TAGS_TTL_SECONDS = 600;

/** Poll vote counts change often; keep short. */
export const POLL_RESULTS_TTL_SECONDS = 60;

/** Aggregated profile; invalidate on follow/profile edits. */
export const USER_PROFILE_TTL_SECONDS = 120;
