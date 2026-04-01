import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim()

    if (!q) {
      return NextResponse.json(
        { data: { users: [], threads: [] } },
        { status: 200 }
      )
    }

    if (q.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      )
    }

    const [users, threads] = await Promise.all([
      prisma.user.findMany({
        where: {
          username: { contains: q, mode: "insensitive" },
        },
        take: 5,
        select: { id: true, username: true, avatarUrl: true },
      }),

      prisma.thread.findMany({
        where: {
          title: { contains: q, mode: "insensitive" },
          isHidden: false,
        },
        take: 5,
        include: {
          author: { select: { username: true } },
          _count: { select: { posts: true } },
        },
      }),
    ])

    return NextResponse.json(
      { data: { users, threads } },
      { status: 200 }
    )
  } catch (err) {
    console.error("GET /api/search error:", err)
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    )
  }
}