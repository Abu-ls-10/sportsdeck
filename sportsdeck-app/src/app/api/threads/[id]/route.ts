import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"


/**
 * GET /api/threads/:id
 *
 * Returns detailed thread information
 */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  try {

    const { id: threadId } = await params

    if (!threadId)
      return NextResponse.json(
        { error: "Thread id is required" },
        { status: 400 }
      )

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },

      include: {

        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        },

        tags: {
          include: {
            tag: true
          }
        },

        polls: {
          include: {
            options: true
          }
        },

        _count: {
          select: {
            posts: true
          }
        }

      }
    })

    if (!thread || thread.isHidden)
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      )

    return NextResponse.json(thread, { status: 200 })

  } catch (error) {

    console.error("GET /api/threads/:id error:", error)

    return NextResponse.json(
      { error: "Failed to retrieve thread" },
      { status: 500 }
    )

  }

}


/**
 * PATCH /api/threads/:id
 *
 * Allows thread owner or admin to edit:
 * - title
 * - tags
 */

async function patchHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  try {

    const user = req.user
    const { id: threadId } = await params

    if (!user)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )

    if (!threadId)
      return NextResponse.json(
        { error: "Thread id is required" },
        { status: 400 }
      )

    const thread = await prisma.thread.findUnique({
      where: { id: threadId }
    })

    if (!thread)
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      )

    if (thread.authorId !== user.user_id && user.role !== "ADMIN")
      return NextResponse.json(
        { error: "You are not allowed to edit this thread" },
        { status: 403 }
      )

    if (thread.isHidden)
      return NextResponse.json(
        { error: "This thread has been hidden by a moderator and cannot be edited" },
        { status: 403 }
      )

    let body
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      )
    }

    let { title } = body
    const { tags } = body

    if (title !== undefined) {

      title = String(title).trim()

      if (title.length === 0)
        return NextResponse.json(
          { error: "Title cannot be empty" },
          { status: 400 }
        )

    }

    const updatedThread = await prisma.$transaction(async (tx) => {

      const updated = await tx.thread.update({
        where: { id: thread.id },
        data: {
          title: title ?? thread.title
        }
      })

      if (tags && Array.isArray(tags)) {

        await tx.threadTag.deleteMany({
          where: { threadId: thread.id }
        })

        for (const tagNameRaw of tags) {

          const tagName = String(tagNameRaw).trim().toLowerCase()
          if (!tagName) continue

          let tag = await tx.tag.findUnique({
            where: { name: tagName }
          })

          if (!tag) {
            tag = await tx.tag.create({
              data: { name: tagName }
            })
          }

          await tx.threadTag.create({
            data: {
              threadId: thread.id,
              tagId: tag.id
            }
          })

        }

      }

      return updated

    })

    return NextResponse.json(updatedThread, { status: 200 })

  } catch (error) {

    console.error("PATCH /api/threads/:id error:", error)

    return NextResponse.json(
      { error: "Failed to update thread" },
      { status: 500 }
    )

  }

}


/**
 * DELETE /api/threads/:id
 *
 * Soft-hides thread
 */

async function deleteHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  try {

    const user = req.user
    const { id: threadId } = await params

    if (!user)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )

    if (!threadId)
      return NextResponse.json(
        { error: "Thread id is required" },
        { status: 400 }
      )

    const thread = await prisma.thread.findUnique({
      where: { id: threadId }
    })

    if (!thread)
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      )

    if (thread.authorId !== user.user_id && user.role !== "ADMIN")
      return NextResponse.json(
        { error: "You are not allowed to delete this thread" },
        { status: 403 }
      )

    if (thread.isHidden)
      return NextResponse.json(
        { error: "Thread already hidden" },
        { status: 400 }
      )

    await prisma.thread.update({
      where: { id: thread.id },
      data: { isHidden: true }
    })

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )

  } catch (error) {

    console.error("DELETE /api/threads/:id error:", error)

    return NextResponse.json(
      { error: "Failed to delete thread" },
      { status: 500 }
    )

  }

}

export const PATCH = withAuth(patchHandler)
export const DELETE = withAuth(deleteHandler)