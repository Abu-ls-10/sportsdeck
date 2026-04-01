import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"

/**
 * @openapi
 * /api/admin/reports:
 *   get:
 *     summary: Admin moderation queue of reported items (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, dismissed, approved]
 *         example: "pending"
 *       - in: query
 *         name: sort
 *         description: "ai = highest toxicity first; reports = most reported first; recent = most recently reported first"
 *         schema:
 *           type: string
 *           enum: [ai, reports, recent]
 *         example: "ai"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 20
 *     responses:
 *       200:
 *         description: Paginated moderation queue
 *       400:
 *         description: Invalid status value
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * GET /api/admin/reports?status=pending&page=1&limit=20&sort=ai|reports|recent
 *
 * Admin-only. Returns the moderation queue of reported items.
 *
 * Sorting (via ?sort=):
 *   - "ai"      → AI toxicity score descending (highest toxicity first), then report count
 *   - "reports"  → report count descending (most reported first), then AI score
 *   - "recent"  → most recently reported first
 *   - default   → AI score desc, then report count desc
 *
 * Filterable by status: pending (default), dismissed, approved.
 *
 * AI verdict fields (aiScore, aiLabel, aiExplanation, aiModel) are included
 * in every item so the admin can see the AI-generated verdict at a glance.
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") ?? "pending"
    const sortParam = searchParams.get("sort") ?? "default"
    const page = Math.max(1, Number(searchParams.get("page") ?? 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)))
    const skip = (page - 1) * limit

    // Validate status filter
    const allowedStatuses = ["pending", "dismissed", "approved"]
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { message: `status must be one of: ${allowedStatuses.join(", ")}` },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { status }

    // Get total count for pagination metadata
    const totalCount = await prisma.reportedItem.count({ where })

    // Build sort order based on query param
    type OrderByItem = Record<string, string>
    let orderBy: OrderByItem[]

    switch (sortParam) {
      case "ai":
        // AI-flagged items first (highest toxicity score), then by report count
        orderBy = [
          { aiScore: "desc" },
          { reportCount: "desc" },
          { lastReportedAt: "desc" },
        ]
        break
      case "reports":
        // Most user-reported first, then by AI score
        orderBy = [
          { reportCount: "desc" },
          { aiScore: "desc" },
          { lastReportedAt: "desc" },
        ]
        break
      case "recent":
        orderBy = [{ lastReportedAt: "desc" }]
        break
      default:
        // Default: AI score first, then report count
        orderBy = [
          { aiScore: "desc" },
          { reportCount: "desc" },
          { lastReportedAt: "desc" },
        ]
        break
    }

    // Fetch reported items with AI verdict fields included
    const reportedItems = await prisma.reportedItem.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        reports: {
          include: {
            reporter: {
              select: { id: true, username: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        adminActions: {
          include: {
            admin: {
              select: { id: true, username: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    // Add a compact preview of the actual reported content text/title for queue cards.
    const dataWithContentPreview = await Promise.all(
      reportedItems.map(async (item) => ({
        ...item,
        contentPreviewText: await getQueueContentPreviewText(item.contentType, item.contentId),
      }))
    )

    return NextResponse.json({
      data: dataWithContentPreview,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error("ADMIN REPORTS ERROR:", error)
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    )
  }
}, "ADMIN")

function truncatePreview(text: string, maxLength = 220): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}...`
}

async function getQueueContentPreviewText(
  contentType: string,
  contentId: string
): Promise<string | null> {
  switch (contentType) {
    case "THREAD": {
      const thread = await prisma.thread.findUnique({
        where: { id: contentId },
        select: { title: true },
      })
      return thread?.title ? truncatePreview(thread.title) : null
    }
    case "POST": {
      const post = await prisma.post.findUnique({
        where: { id: contentId },
        select: { content: true },
      })
      return post?.content ? truncatePreview(post.content) : null
    }
    case "REPLY": {
      const reply = await prisma.reply.findUnique({
        where: { id: contentId },
        select: { content: true },
      })
      return reply?.content ? truncatePreview(reply.content) : null
    }
    case "POLL": {
      const poll = await prisma.poll.findUnique({
        where: { id: contentId },
        select: { question: true },
      })
      return poll?.question ? truncatePreview(poll.question) : null
    }
    default:
      return null
  }
}
