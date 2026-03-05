import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromToken } from "@/lib/auth"

/**
 * GET /api/threads/:threadId/posts
 *
 * Visitors can view posts inside the thread.
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {

    const thread = await prisma.thread.findUnique({
      where: { id: params.threadId }
    })

    if (!thread) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      )
    }

    const posts = await prisma.post.findMany({
      where: {
        threadId: thread.id,
        isHidden: false
      },
      orderBy: {
        createdAt: "asc"
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    })

    return NextResponse.json(posts)

  } catch (error) {

    console.error(error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


/**
 * POST /api/threads/:threadId/posts
 *
 * User Story:
 * Users can post comments inside match discussion threads.
 *
 * Rules:
 * - Must be authenticated
 * - Thread must be open
 * - Thread must not be locked
 */

export async function POST(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {

    const user = await getUserFromToken(req)

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()

    const { content } = body

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      )
    }

    const thread = await prisma.thread.findUnique({
      where: { id: params.threadId }
    })

    if (!thread) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      )
    }

    const now = new Date()

    // enforce open window
    if (thread.opensAt && now < thread.opensAt) {
      return NextResponse.json(
        { error: "Thread has not opened yet" },
        { status: 403 }
      )
    }

    if (thread.lockedAt && now > thread.lockedAt) {
      return NextResponse.json(
        { error: "Thread is closed" },
        { status: 403 }
      )
    }

    if (thread.isLocked) {
      return NextResponse.json(
        { error: "Thread is locked" },
        { status: 403 }
      )
    }

    const post = await prisma.post.create({
      data: {
        threadId: thread.id,
        authorId: user.id,
        content: content.trim()
      }
    })

    return NextResponse.json(post, { status: 201 })

  } catch (error) {

    console.error(error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}