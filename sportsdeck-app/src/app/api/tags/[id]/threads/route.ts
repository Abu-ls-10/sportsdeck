import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/tags/:id/threads
// Returns threads associated with that tag.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: tagId } = await params

    // Validate parameter
    if (!tagId) {
      return NextResponse.json(
        { error: "Tag ID is required in the request URL." },
        { status: 400 }
      )
    }

    // Ensure tag exists
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
      select: {
        id: true,
        name: true
      }
    })

    if (!tag) {
      return NextResponse.json(
        { error: `Tag with ID '${tagId}' does not exist.` },
        { status: 404 }
      )
    }

    // Fetch threads associated with this tag
    const threads = await prisma.thread.findMany({
      where: {
        isHidden: false,
        tags: {
          some: {
            tagId: tagId
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            username: true
          }
        },
        team: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            posts: true
          }
        }
      }
    })

    return NextResponse.json(
      {
        message: `Threads for tag '${tag.name}' retrieved successfully.`,
        data: {
          tag,
          threadCount: threads.length,
          threads
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("GET /api/tags/:id/threads error:", error)

    return NextResponse.json(
      {
        error: "An unexpected error occurred while retrieving threads for this tag."
      },
      { status: 500 }
    )
  }
}
