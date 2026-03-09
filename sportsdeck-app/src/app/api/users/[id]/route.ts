import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/middleware"


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  try {

    const { id: userId } = await params

    if (!userId)
      return NextResponse.json(
        { error: "User id is required" },
        { status: 400 }
      )

    const user = await prisma.user.findUnique({

      where: { id: userId },

      select: {
        id: true,
        username: true,
        avatarUrl: true,
        createdAt: true,

        favoriteTeam: {
          select: {
            id: true,
            name: true,
            logoUrl: true
          }
        }
      }

    })

    if (!user)
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )

    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } })
    ])

    const threads = await prisma.thread.findMany({

      where: {
        authorId: userId,
        isHidden: false
      },

      orderBy: { createdAt: "desc" },

      take: 10,

      select: {
        id: true,
        title: true,
        createdAt: true
      }

    })

    const posts = await prisma.post.findMany({

      where: {
        authorId: userId,
        isHidden: false
      },

      orderBy: { createdAt: "desc" },

      take: 10,

      select: {
        id: true,
        threadId: true,
        content: true,
        createdAt: true
      }

    })

    const replies = await prisma.reply.findMany({

      where: {
        authorId: userId,
        isHidden: false
      },

      orderBy: { createdAt: "desc" },

      take: 10,

      select: {
        id: true,
        postId: true,
        content: true,
        createdAt: true
      }

    })

    return NextResponse.json(
      {
        user,
        followersCount,
        followingCount,
        threads,
        posts,
        replies
      },
      { status: 200 }
    )

  } catch (error) {

    console.error("GET /api/users/:id error:", error)

    return NextResponse.json(
      { error: "Failed to retrieve user profile" },
      { status: 500 }
    )

  }

}


// TODO: REMOVE!
async function updateUser(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {

  try {

    const { id: userId } = await params

    if (!userId)
      return NextResponse.json(
        { error: "User id is required" },
        { status: 400 }
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

    const { new_username, new_avatar, new_favorite_team } = body

    if (!new_username && !new_avatar && !new_favorite_team)
      return NextResponse.json(
        { error: "No fields provided to update" },
        { status: 400 }
      )

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user)
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )

    let team

    if (new_favorite_team) {

      team = await prisma.team.findUnique({
        where: { name: new_favorite_team }
      })

      if (!team)
        return NextResponse.json(
          { error: "Favorite team not found" },
          { status: 404 }
        )

    }

    await prisma.user.update({

      where: { id: userId },

      data: {

        ...(new_username && {
          username: String(new_username).trim()
        }),

        ...(new_avatar && {
          avatarUrl: new_avatar
        }),

        ...(team && {
          favoriteTeam: {
            connect: { id: team.id }
          }
        })

      }

    })

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )

  } catch (error) {

    console.error("PATCH /api/users/:id error:", error)

    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    )

  }

}

export const PATCH = withAuth(updateUser)