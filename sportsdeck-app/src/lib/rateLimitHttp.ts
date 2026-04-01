import { NextResponse } from "next/server"
import { getClientIp } from "@/lib/clientIp"
import { isWithinRateLimit } from "@/lib/redis"

function parsePositiveInt(name: string, fallback: number): number {
  const raw = process.env[name]
  if (raw == null || raw === "") return fallback
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

/** Signup: requests per IP per window (default 10 / 1h). */
export const RL_SIGNUP_MAX = parsePositiveInt("RL_SIGNUP_MAX_PER_IP", 10)
export const RL_SIGNUP_WINDOW_SEC = parsePositiveInt("RL_SIGNUP_WINDOW_SECONDS", 3600)

/** Refresh: requests per IP per window (default 120 / 15m). */
export const RL_REFRESH_MAX = parsePositiveInt("RL_REFRESH_MAX_PER_IP", 120)
export const RL_REFRESH_WINDOW_SEC = parsePositiveInt(
  "RL_REFRESH_WINDOW_SECONDS",
  900
)

/** Translate: per authenticated user per window (default 40 / 1h). */
export const RL_TRANSLATE_MAX = parsePositiveInt("RL_TRANSLATE_MAX_PER_USER", 40)
export const RL_TRANSLATE_WINDOW_SEC = parsePositiveInt(
  "RL_TRANSLATE_WINDOW_SECONDS",
  3600
)

/** Sentiment GET: per IP + thread per window (default 20 / 1h). */
export const RL_SENTIMENT_MAX = parsePositiveInt("RL_SENTIMENT_MAX_PER_IP_THREAD", 20)
export const RL_SENTIMENT_WINDOW_SEC = parsePositiveInt(
  "RL_SENTIMENT_WINDOW_SECONDS",
  3600
)

/** Admin AI analyze: per admin user per window (default 30 / 1h). */
export const RL_ADMIN_ANALYZE_MAX = parsePositiveInt(
  "RL_ADMIN_ANALYZE_MAX_PER_ADMIN",
  30
)
export const RL_ADMIN_ANALYZE_WINDOW_SEC = parsePositiveInt(
  "RL_ADMIN_ANALYZE_WINDOW_SECONDS",
  3600
)

/**
 * Fixed-window limit by client IP. Returns 429 response when over limit; null to continue.
 */
export async function rateLimitByIp(
  req: Request,
  scope: string,
  max: number,
  windowSeconds: number,
  body: { message?: string; error?: string } = {
    message: "Too many requests. Try again later.",
  }
): Promise<NextResponse | null> {
  const ok = await isWithinRateLimit(
    `rl:${scope}:${getClientIp(req)}`,
    max,
    windowSeconds
  )
  if (ok) return null
  return NextResponse.json(body, { status: 429 })
}

/**
 * Fixed-window limit by arbitrary id (e.g. user id). Returns 429 when over limit; null to continue.
 */
export async function rateLimitById(
  id: string,
  scope: string,
  max: number,
  windowSeconds: number,
  body: Record<string, string> = { error: "Too many requests. Try again later." }
): Promise<NextResponse | null> {
  const ok = await isWithinRateLimit(
    `rl:${scope}:${id}`,
    max,
    windowSeconds
  )
  if (ok) return null
  return NextResponse.json(body, { status: 429 })
}
