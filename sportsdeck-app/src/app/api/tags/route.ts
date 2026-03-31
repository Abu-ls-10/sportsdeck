import {
  TAGS_CACHE_KEY,
  TAGS_TTL_SECONDS,
} from "@/lib/cache/apiCacheKeys"
import { prisma } from "@/lib/prisma"
import { getOrSetJSON } from "@/lib/redis"
import { NextRequest, NextResponse } from "next/server"


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
type TagsGetResponse = {
  message: string
  data: {
    count: number
    tags: {
      id: string
      name: string
      _count: { threads: number }
    }[]
  }
}

export async function GET(_req: NextRequest) {
  try {
    const body = await getOrSetJSON<TagsGetResponse>(
      TAGS_CACHE_KEY,
      TAGS_TTL_SECONDS,
      async () => {
        const tags = await prisma.tag.findMany({
          orderBy: {
            name: "asc",
          },
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                threads: true,
              },
            },
          },
        })

        return {
          message: "Tags retrieved successfully.",
          data: {
            count: tags.length,
            tags,
          },
        }
      }
    )

    return NextResponse.json(body, { status: 200 })
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