import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"


/**
 * @openapi
 * /api/tags:
 *   get:
 *     summary: Get all tags
 *     tags: [Tags]
 *     responses:
 *       200:
 *         description: Tags retrieved successfully
 *       500:
 *         description: Internal server error
 */

// GET /api/tags
// Returns list of all tags.
export async function GET(_req: NextRequest) {
  try {

    const tags = await prisma.tag.findMany({
      orderBy: {
        name: "asc"
      },
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

    return NextResponse.json(
      {
        message: "Tags retrieved successfully.",
        data: {
          count: tags.length,
          tags
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("GET /api/tags error:", error)

    return NextResponse.json(
      {
        error: "An unexpected error occurred while retrieving tags."
      },
      { status: 500 }
    )
  }
}