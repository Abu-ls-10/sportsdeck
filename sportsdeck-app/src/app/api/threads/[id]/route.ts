import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromToken } from "@/lib/auth"


/**
 * GET /api/threads/:id
 *
 * Returns detailed thread information including:
 * - metadata
 * - author
 * - post count
 * - poll (if exists)
 * - tags
 */

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {

  try {

    const thread = await prisma.thread.findUnique({
      where: { id: params.id },

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


    if (!thread || thread.isHidden) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      )
    }


    return NextResponse.json(thread)

  } catch (error) {

    console.error(error)

    return NextResponse.json(
      { error: "Internal server error" },
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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {

  try {

    const user = await getUserFromToken(request)

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Live ban check from DB
    const dbUser = await prisma.user.findUnique({ where: { id: user.user_id }, select: { isBanned: true } })
    if (dbUser?.isBanned) {
      return NextResponse.json({ error: "Your account has been banned" }, { status: 403 })
    }

    const thread = await prisma.thread.findUnique({
      where: { id: params.id }
    })

    if (!thread) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      )
    }

    // permission check
    if (thread.authorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Block edits on hidden threads
    if (thread.isHidden) {
      return NextResponse.json(
        { error: "This thread has been hidden by a moderator and cannot be edited" },
        { status: 403 }
      )
    }

    const body = await request.json()

    const {
      title,
      tags
    } = body


    const updatedThread = await prisma.thread.update({
      where: { id: thread.id },
      data: {
        title: title ?? thread.title
      }
    })


    /**
     * Handle tag updates
     */

    if (tags && Array.isArray(tags)) {

      // remove existing tags
      await prisma.threadTag.deleteMany({
        where: { threadId: thread.id }
      })

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


    return NextResponse.json(updatedThread)

  } catch (error) {

    console.error(error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )

  }

}



/**
 * DELETE /api/threads/:id
 *
 * Soft-hides thread by setting:
 * isHidden = true
 *
 * Only thread owner or admin can perform this action.
 */

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {

  try {

    const user = await getUserFromToken(request)

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Live ban check from DB
    const dbUser2 = await prisma.user.findUnique({ where: { id: user.user_id }, select: { isBanned: true } })
    if (dbUser2?.isBanned) {
      return NextResponse.json({ error: "Your account has been banned" }, { status: 403 })
    }

    const thread = await prisma.thread.findUnique({
      where: { id: params.id }
    })

    if (!thread) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      )
    }

    if (thread.authorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }


    await prisma.thread.update({
      where: { id: thread.id },
      data: {
        isHidden: true
      }
    })


    return NextResponse.json({
      success: true
    })

  } catch (error) {

    console.error(error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )

  }

}