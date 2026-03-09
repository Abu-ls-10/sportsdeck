import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"

/**
 * POST /api/threads
 *
 * Creates a new discussion thread.
 *
 * User provides:
 * - title
 * - content (first post)
 * - optional teamId
 * - optional tags
 *
 * Creates:
 * - THREAD
 * - initial POST
 * - TAG relations
 */

async function postHandler(req: AuthenticatedRequest) {
  try {
    const user = req.user
    const body = await req.json()

    const { title, content, teamId, tags } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content required" },
        { status: 400 }
      )
    }

    const thread = await prisma.thread.create({
      data: {
        title,
        authorId: user.id,
        teamId: teamId ?? null,
        isMatchThread: false,
        isLocked: false,
        isHidden: false
      }
    })

    // create first post
    await prisma.post.create({
      data: {
        threadId: thread.id,
        authorId: user.id,
        content
      }
    })

    // handle tags
    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        let tag = await prisma.tag.findUnique({
          where: { name: tagName }
        })

        if (!tag) {
          tag = await prisma.tag.create({
            data: { name: tagName }
          })
        }

        await prisma.threadTag.create({
          data: {
            threadId: thread.id,
            tagId: tag.id
          }
        })
      }
    }

    return NextResponse.json(thread, { status: 201 })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withAuth(postHandler)


/**
 * GET /api/threads
 *
 * Returns paginated list of threads.
 *
 * Supports filters:
 * - teamId
 * - matchId
 * - tag
 * - authorId
 * - q (search text)
 * - sort (recent | top)
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


    let orderBy:  Record<string, unknown> = {
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


    return NextResponse.json(threads)

  } catch (error) {

    console.error(error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )

  }

}