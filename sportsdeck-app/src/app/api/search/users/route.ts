import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * @openapi
 * /api/search/users:
 *   get:
 *     summary: Search for users by username
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         example: "john_doe"
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
 *         description: Matching users
 *       500:
 *         description: Internal server error
 */

// GET /api/search/users?q=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim()

    // validation
    if (!q) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    if (q.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      )
    }

    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: q,
          mode: "insensitive",
        },
      },
      take: 5,
      select: {
        id: true,
        username: true,
        avatarUrl: true,
      },
    })

    return NextResponse.json({ data: users }, { status: 200 })
  } catch (err) {
    console.error("GET /api/search/users error:", err)
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    )
  }
}