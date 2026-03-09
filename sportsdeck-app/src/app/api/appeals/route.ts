import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromToken } from "@/lib/auth"

/**
 * POST /api/appeals
 *
 * Allows a banned user to submit an appeal request.
 * Does NOT use withAuth because banned users must be allowed to access this endpoint.
 *
 * Body:
 * - message (required) — the reason why the user should be unbanned
 *
 * Automatically finds the user's active ban.
 * Only one pending appeal per ban is allowed.
 */
export async function POST(request: Request) {
  const user = getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  // Only banned users can submit appeals
  if (!user.isBanned) {
    return NextResponse.json(
      { message: "You are not banned and cannot submit an appeal" },
      { status: 400 }
    )
  }

  let body: { message?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 })
  }

  const { message } = body

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { message: "message is required" },
      { status: 400 }
    )
  }

  // Find the user's active ban
  const activeBan = await prisma.ban.findFirst({
    where: { userId: user.user_id, status: "active" },
    orderBy: { createdAt: "desc" },
  })

  if (!activeBan) {
    return NextResponse.json(
      { message: "No active ban found" },
      { status: 404 }
    )
  }

  // Prevent duplicate pending appeals on the same ban
  const existingPendingAppeal = await prisma.appeal.findFirst({
    where: { banId: activeBan.id, appealerId: user.user_id, status: "pending" },
  })

  if (existingPendingAppeal) {
    return NextResponse.json(
      { message: "You already have a pending appeal for this ban" },
      { status: 409 }
    )
  }

  // Create the appeal
  const appeal = await prisma.appeal.create({
    data: {
      appealerId: user.user_id,
      banId: activeBan.id,
      message: message.trim(),
      status: "pending",
    },
    include: {
      ban: {
        select: { id: true, reason: true, status: true, createdAt: true },
      },
    },
  })

  return NextResponse.json(appeal, { status: 201 })
}

/**
 * GET /api/appeals
 *
 * Returns the authenticated user's own appeals.
 * Accessible by banned users so they can check appeal status.
 *
 * Query params:
 * - status  (optional) — filter by "pending", "approved", "rejected"
 * - page    (optional, default 1)
 * - limit   (optional, default 20, max 100)
 */
export async function GET(request: Request) {
  const user = getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const page = Math.max(1, Number(searchParams.get("page") ?? 1))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)))
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { appealerId: user.user_id }

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
        ban: {
          select: { id: true, reason: true, status: true, createdAt: true },
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
