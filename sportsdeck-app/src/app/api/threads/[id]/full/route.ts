import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/threads/:id/full
 *
 * Returns the full thread page data in one request:
 * - thread metadata
 * - author
 * - tags
 * - poll (if exists)
 * - posts
 * - replies
 * - counts
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
            options: {
              include: {
                _count: {
                  select: { votes: true }
                }
              }
            }
          }
        },

        posts: {

          where: {
            isHidden: false
          },

          orderBy: {
            createdAt: "asc"
          },

          include: {

            author: {
              select: {
                id: true,
                username: true,
                avatarUrl: true
              }
            },

            replies: {

              where: {
                isHidden: false
              },

              orderBy: {
                createdAt: "asc"
              },

              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    avatarUrl: true
                  }
                }
              }

            },

            _count: {
              select: {
                replies: true
              }
            }

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