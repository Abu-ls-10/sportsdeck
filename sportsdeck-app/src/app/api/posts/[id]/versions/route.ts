import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/posts/:id/versions
// Returns version history of a post.
// Used to view edit history.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params

    // Validate param
    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required in the request URL." },
        { status: 400 }
      )
    }

    // Find post first
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        isEdited: true,
        isHidden: true,
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: `Post with ID '${postId}' does not exist.` },
        { status: 404 }
      )
    }

    if (post.isHidden) {
      return NextResponse.json(
        { error: "This post has been removed and its history cannot be viewed." },
        { status: 403 }
      )
    }

    // Fetch version history
    const versions = await prisma.postVersion.findMany({
      where: { postId },
      orderBy: { editedAt: "asc" },
      select: {
        id: true,
        oldContent: true,
        editedAt: true
      }
    })

    return NextResponse.json(
      {
        message: "Post version history retrieved successfully.",
        data: {
          postId: post.id,
          author: post.author,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          isEdited: post.isEdited,
          currentContent: post.content,
          versionHistory: versions
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("GET /api/posts/:id/versions error:", error)

    return NextResponse.json(
      {
        error: "An unexpected error occurred while retrieving the post version history."
      },
      { status: 500 }
    )
  }
}