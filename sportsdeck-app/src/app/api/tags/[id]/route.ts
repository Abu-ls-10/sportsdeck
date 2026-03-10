import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/tags/:id
// Returns tag details.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: tagId } = await params

    // Validate param
    if (!tagId) {
      return NextResponse.json(
        { error: "Tag ID is required in the request URL." },
        { status: 400 }
      )
    }

    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            threads: true
          }
        }
      }
    })

    if (!tag) {
      return NextResponse.json(
        { error: `Tag with ID '${tagId}' was not found.` },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        message: "Tag details retrieved successfully.",
        data: tag
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("GET /api/tags/:id error:", error)

    return NextResponse.json(
      {
        error: "An unexpected error occurred while retrieving the tag."
      },
      { status: 500 }
    )
  }
}