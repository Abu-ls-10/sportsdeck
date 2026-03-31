import { NextRequest } from "next/server"
import { verifyAccessToken } from "@/lib/auth"

/** Bearer or `access_token` cookie; no DB check (matches prior GET /api/users/:id behavior). */
export function getOptionalViewerIdFromRequest(req: NextRequest): string | null {
  let token: string | null = null
  const authHeader = req.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1] ?? null
  }
  if (!token) {
    token = req.cookies.get("access_token")?.value ?? null
  }
  if (!token) return null
  const payload = verifyAccessToken(token)
  if (!payload || typeof payload === "string") return null
  const id = payload.id
  return typeof id === "string" ? id : null
}
