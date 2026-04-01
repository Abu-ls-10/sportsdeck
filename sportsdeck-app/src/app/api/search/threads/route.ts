import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * @openapi
 * /api/search/threads:
 *   get:
 *     summary: Search threads by text or filters
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         example: "Arsenal vs Chelsea"
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         example: "Premier League"
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *         example: "clxteam123"
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
 *         description: Matching threads
 *       500:
 *         description: Internal server error
 */

// Search threads by text or filters.
// GET /api/search/threads?q=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim()

    // ✅ validation
    if (!q) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    if (q.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      )
    }

    const threads = await prisma.thread.findMany({
      where: {
        title: {
          contains: q,
          mode: "insensitive",
        },
        isHidden: false,
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: { username: true },
        },
        _count: {
          select: { posts: true },
        },
      },
    })

    return NextResponse.json({ data: threads }, { status: 200 })
  } catch (err) {
    console.error("GET /api/search/threads error:", err)
    return NextResponse.json(
      { error: "Failed to search threads" },
      { status: 500 }
    )
  }
}