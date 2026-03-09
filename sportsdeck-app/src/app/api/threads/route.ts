import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"

/**
 * POST /api/threads
 *
 * Creates a new discussion thread.
 */

async function postHandler(req: AuthenticatedRequest) {
  try {

    const user = req.user

    if (!user)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
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

    let { title, content } = body
    const { teamId, tags } = body

    if (!title || !content)
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )

    title = title.trim()
    content = content.trim()

    if (title.length === 0 || content.length === 0)
      return NextResponse.json(
        { error: "Title and content cannot be empty" },
        { status: 400 }
      )

    const result = await prisma.$transaction(async (tx) => {

      const thread = await tx.thread.create({
        data: {
          title,
          authorId: user.id,
          teamId: teamId ?? null,
          isMatchThread: false,
          isLocked: false,
          isHidden: false
        }
      })

      await tx.post.create({
        data: {
          threadId: thread.id,
          authorId: user.id,
          content
        }
      })

      if (tags && Array.isArray(tags)) {

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

      return thread

    })

    return NextResponse.json(result, { status: 201 })

  } catch (error) {

    console.error("POST /api/threads error:", error)

    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 }
    )

  }
}

export const POST = withAuth(postHandler)



/**
 * GET /api/threads
 *
 * Returns paginated list of threads.
 */

export async function GET(request: Request) {

  try {

    const { searchParams } = new URL(request.url)

    const teamId = searchParams.get("teamId")
    const matchId = searchParams.get("matchId")
    const tag = searchParams.get("tag")
    const authorId = searchParams.get("authorId")
    const author = searchParams.get("author")
    const q = searchParams.get("q")
    const sort = searchParams.get("sort") ?? "recent"

    const page = Number(searchParams.get("page") ?? 1)
    const limit = Number(searchParams.get("limit") ?? 20)

    if (isNaN(page) || page < 1)
      return NextResponse.json(
        { error: "Invalid page parameter" },
        { status: 400 }
      )

    if (isNaN(limit) || limit < 1 || limit > 100)
      return NextResponse.json(
        { error: "Limit must be between 1 and 100" },
        { status: 400 }
      )

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      isHidden: false
    }

    if (teamId) where.teamId = teamId
    if (matchId) where.matchId = matchId
    if (authorId) where.authorId = authorId

    if (author) {
      where.author = {
        username: {
          contains: author,
          mode: "insensitive"
        }
      }
    }

    if (q) {
      where.title = {
        contains: q,
        mode: "insensitive"
      }
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: tag
          }
        }
      }
    }

    let orderBy: Record<string, unknown> = {
      createdAt: "desc"
    }

    if (sort === "top") {
      orderBy = {
        posts: {
          _count: "desc"
        }
      }
    }

    const threads = await prisma.thread.findMany({

      where,
      orderBy,
      skip,
      take: limit,

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

        _count: {
          select: {
            posts: true
          }
        }

      }

    })

    return NextResponse.json(threads, { status: 200 })

  } catch (error) {

    console.error("GET /api/threads error:", error)

    return NextResponse.json(
      { error: "Failed to retrieve threads" },
      { status: 500 }
    )

  }

}