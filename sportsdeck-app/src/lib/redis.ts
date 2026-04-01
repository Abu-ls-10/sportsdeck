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
 * Read JSON at key. Returns null on miss, parse error, or Redis unavailable.
 */
export async function getJson<T>(key: string): Promise<T | null> {
  const client = getRedis()
  if (!client) return null
  try {
    const raw = await client.get(key)
    if (raw == null) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  } catch {
    return null
  }
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

/**
 * Delete a key. No-op if Redis is unavailable or errors.
 */
export async function del(key: string): Promise<void> {
  const client = getRedis()
  if (!client) return
  try {
    await client.del(key)
  } catch {
    // Same as other helpers: never throw from Redis.
  }
}

/**
 * Delete all keys whose names start with `prefix` (SCAN + DEL).
 */
export async function delByPrefix(prefix: string): Promise<void> {
  const client = getRedis()
  if (!client || !prefix) return
  const pattern = `${prefix}*`
  try {
    let cursor = "0"
    do {
      const [next, keys] = await client.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100
      )
      cursor = next
      if (keys.length > 0) {
        await client.del(...keys)
      }
    } while (cursor !== "0")
  } catch {
    // ignore
  }
}

/**
 * SET key NX with expiry. Returns true if lock acquired (or Redis unavailable — fail-open).
 */
export async function tryAcquireLock(
  key: string,
  ttlSeconds: number
): Promise<boolean> {
  const client = getRedis()
  if (!client) return true
  try {
    const r = await client.set(
      key,
      "1",
      "EX",
      ttlExSeconds(ttlSeconds),
      "NX"
    )
    return r === "OK"
  } catch {
    return true
  }
}

/**
 * Fixed-window rate limit: increments key, sets TTL on first hit. Returns true if under/equal max.
 * If Redis is down, returns true (fail-open).
 */
export async function isWithinRateLimit(
  key: string,
  max: number,
  windowSeconds: number
): Promise<boolean> {
  const client = getRedis()
  if (!client) return true
  try {
    const n = await client.incr(key)
    if (n === 1) {
      await client.expire(key, ttlExSeconds(windowSeconds))
    }
    return n <= max
  } catch {
    return true
  }
}
