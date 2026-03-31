import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function logTagsDbState(stage: string, extra: Record<string, unknown> = {}) {
  let dbState: Record<string, unknown> = {}
  try {
    const result = await prisma.$queryRaw<
      Array<{
        db: string
        schema_name: string
        tag_exists: string | null
      }>
    >`SELECT current_database() AS db, current_schema() AS schema_name, to_regclass('public."Tag"')::text AS tag_exists`
    dbState = result[0] ?? {}
  } catch (e) {
    dbState = {
      stateError: e instanceof Error ? e.message : String(e),
    }
  }
  // #region agent log
  fetch("http://127.0.0.1:7566/ingest/e4f4ce26-3bb7-4649-9c07-27dc446e55e9", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "d1b01d",
    },
    body: JSON.stringify({
      sessionId: "d1b01d",
      runId: "pre",
      hypothesisId: "DB_STATE",
      location: "api/tags/route.ts:logTagsDbState",
      message: stage,
      data: { ...dbState, ...extra },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
}


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
    await logTagsDbState("tags_handler_enter")

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
    await logTagsDbState("tags_handler_error", {
      errName: error instanceof Error ? error.name : "unknown",
      errMsg: error instanceof Error ? error.message : String(error),
    })
    console.error("GET /api/tags error:", error)

    return NextResponse.json(
      {
        error: "An unexpected error occurred while retrieving tags."
      },
      { status: 500 }
    )
  }
}