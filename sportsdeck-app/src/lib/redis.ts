import Redis from "ioredis"

const globalForRedis = globalThis as unknown as {
  sportsdeckRedis: Redis | false | undefined
}

function redisUrl(): string | undefined {
  const url = process.env.REDIS_URL?.trim()
  return url || undefined
}

function getRedis(): Redis | null {
  if (!redisUrl()) return null
  if (globalForRedis.sportsdeckRedis === false) return null
  if (globalForRedis.sportsdeckRedis) return globalForRedis.sportsdeckRedis
  try {
    const client = new Redis(redisUrl()!, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    })
    globalForRedis.sportsdeckRedis = client
    return client
  } catch {
    globalForRedis.sportsdeckRedis = false
    return null
  }
}

function ttlExSeconds(ttlSeconds: number): number {
  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) return 1
  return Math.min(Math.floor(ttlSeconds), 2147483647)
}

/**
 * Store JSON at key with TTL. No-op if REDIS_URL is unset or Redis errors.
 */
export async function setJson(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  const client = getRedis()
  if (!client) return
  try {
    await client.setex(key, ttlExSeconds(ttlSeconds), JSON.stringify(value))
  } catch {
    // Fall back to DB-only path at call sites; never throw Redis failures.
  }
}

/**
 * Return cached JSON or compute with factory, then cache. On any Redis error,
 * runs factory only (same as cache miss) and does not throw.
 */
export async function getOrSetJSON<T>(
  key: string,
  ttlSeconds: number,
  factory: () => Promise<T>
): Promise<T> {
  const client = getRedis()
  if (!client) return factory()

  try {
    const raw = await client.get(key)
    if (raw != null) {
      try {
        return JSON.parse(raw) as T
      } catch {
        // Corrupt cache entry — treat as miss.
      }
    }
  } catch {
    return factory()
  }

  const value = await factory()
  await setJson(key, value, ttlSeconds)
  return value
}
