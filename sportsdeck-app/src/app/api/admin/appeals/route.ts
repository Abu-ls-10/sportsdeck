import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromToken } from "@/lib/auth"

/**
 * GET /api/admin/appeals
 *
 * Admin-only. Lists all appeals with optional status filter and pagination.
 *
 * Query params:
 * - status  (optional) — "pending", "approved", "rejected"
 * - page    (optional, default 1)
 * - limit   (optional, default 20, max 100)
 */
export async function GET(request: Request) {
  const admin = getUserFromToken(request)
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
  if (admin.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const page = Math.max(1, Number(searchParams.get("page") ?? 1))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)))
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}

  if (status) {
    const allowedStatuses = ["pending", "approved", "rejected"]
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { message: `status must be one of: ${allowedStatuses.join(", ")}` },
        { status: 400 }
      )
    }
    where.status = status
  }

  const [appeals, totalCount] = await Promise.all([
    prisma.appeal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        appealer: { select: { id: true, username: true, email: true } },
        ban: {
          select: {
            id: true,
            reason: true,
            status: true,
            createdAt: true,
            bannedByAdmin: { select: { id: true, username: true } },
          },
        },
        reviewedByAdmin: { select: { id: true, username: true } },
      },
    }),
    prisma.appeal.count({ where }),
  ])

  return NextResponse.json({
    data: appeals,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  })
}
