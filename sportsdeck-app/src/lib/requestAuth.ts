import { verifyAccessToken } from "@/lib/auth"

function accessTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim()
    if (!trimmed.startsWith("access_token=")) continue
    const value = trimmed.slice("access_token=".length).trim()
    if (value) return decodeURIComponent(value)
  }
  return null
}

/**
 * Bearer header or `access_token` cookie (Cookie header parse works for plain `Request` in route handlers).
 * No DB check — same idea as optional auth on public GETs.
 */
export function getOptionalViewerIdFromRequest(req: Request): string | null {
  let token: string | null = null
  const authHeader = req.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1] ?? null
  }
  if (!token) {
    const anyReq = req as Request & { cookies?: { get: (n: string) => { value: string } | undefined } }
    token = anyReq.cookies?.get("access_token")?.value ?? null
  }
  if (!token) {
    token = accessTokenFromCookieHeader(req.headers.get("cookie"))
  }
  if (!token) return null
  const payload = verifyAccessToken(token)
  if (!payload || typeof payload === "string") return null
  const id = payload.id
  return typeof id === "string" ? id : null
}
