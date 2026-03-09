import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"

// DELETE /api/threads/:id/tags/:tagId
// Removes tag from thread.

async function deleteHandler(
  req: AuthenticatedRequest, { params }: { params: { id: string; tagId: string } }) {
  try {
    const { id: threadId, tagId } = params
    const currentUser = req.user

    if (!threadId) {
      return NextResponse.json(
        { error: "Thread ID is required in the request URL." },
        { status: 400 }
      )
    }

    if (!tagId) {
      return NextResponse.json(
        { error: "Tag ID is required in the request URL." },
        { status: 400 }
      )
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: {
        id: true,
        authorId: true,
        isHidden: true
      }
    })

    if (!thread) {
      return NextResponse.json(
        { error: `Thread with ID '${threadId}' was not found.` },
        { status: 404 }
      )
    }

    if (thread.isHidden) {
      return NextResponse.json(
        { error: "This thread has been removed and cannot be modified." },
        { status: 403 }
      )
    }

    // Only owner or admin can modify thread tags
    if (thread.authorId !== currentUser.id && currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You do not have permission to modify tags on this thread." },
        { status: 403 }
      )
    }

    const relation = await prisma.threadTag.findUnique({
      where: {
        threadId_tagId: {
          threadId,
          tagId
        }
      }
    })

    if (!relation) {
      return NextResponse.json(
        { error: "This tag is not attached to the specified thread." },
        { status: 404 }
      )
    }

    await prisma.threadTag.delete({
      where: {
        threadId_tagId: {
          threadId,
          tagId
        }
      }
    })

    return NextResponse.json(
      {
        message: "Tag removed from thread successfully."
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("DELETE /api/threads/:id/tags/:tagId error:", error)

    return NextResponse.json(
      {
        error: "An unexpected error occurred while removing the tag from the thread."
      },
      { status: 500 }
    )
  }
}

export const DELETE = withAuth(deleteHandler)