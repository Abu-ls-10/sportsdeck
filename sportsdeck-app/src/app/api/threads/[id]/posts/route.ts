import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"

/**
 * GET /api/threads/:id/posts
 *
 * Visitors can view posts inside the thread.
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params

    const thread = await prisma.thread.findUnique({
      where: { id: threadId }
    })

    if (!thread) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      )
    }

    // Hide posts from hidden threads
    if (thread.isHidden) {
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
 * POST /api/threads/:id/posts
 *
 * User Story:
 * Users can post comments inside match discussion threads.
 *
 * Rules:
 * - Must be authenticated
 * - Thread must be open
 * - Thread must not be locked
 */

async function postHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params
    const user = req.user

<<<<<<< HEAD
    const body = await req.json()
=======
    let body: { content?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

>>>>>>> origin/main
    const { content } = body

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId }
    })

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    // Block posting in hidden threads
    if (thread.isHidden) {
      return NextResponse.json(
        { error: "This thread has been hidden by a moderator and no further activity is allowed" },
        { status: 403 }
      )
    }

    const now = new Date()

    // enforce open window
    if (thread.opensAt && now < thread.opensAt) {
      return NextResponse.json({ error: "Thread has not opened yet" }, { status: 403 })
    }

    if (thread.lockedAt && now > thread.lockedAt) {
      return NextResponse.json({ error: "Thread is closed" }, { status: 403 })
    }

    if (thread.isLocked) {
      return NextResponse.json({ error: "Thread is locked" }, { status: 403 })
    }

    const post = await prisma.post.create({
      data: {
        threadId: thread.id,
        authorId: user.user_id,
        content: content.trim()
      }
    })

    return NextResponse.json(post, { status: 201 })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withAuth(postHandler)