import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * GET /api/users/me
 *
 * User Story:
 * Returns the currently authenticated user's profile.
 *
 * Access:
 * Authenticated users only.
 */

async function getHandler(req: AuthenticatedRequest) {
  try {
    const currentUser = req.user
    const user = await prisma.user.findUnique({
      where: {
        id: currentUser.id
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        favoriteTeamId: true,
        createdAt: true,

        _count: {
          select: {
            followers: true,
            following: true,
            threads: true,
            posts: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Authenticated user was not found in the database." },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: "Authenticated user profile retrieved successfully.",
      data: user
    })

  } catch (error) {
    console.error("GET /api/users/me error:", error)

    return NextResponse.json(
      { error: "An unexpected error occurred while retrieving the user profile." },
      { status: 500 }
    )
  }
}


/**
 * PATCH /api/users/me
 *
 * User Story:
 * Allow authenticated user to update their own profile.
 *
 * Allowed updates:
 * - username
 * - avatarUrl
 * - favoriteTeamId
 */

async function patchHandler(req: AuthenticatedRequest) {
  try {
    const currentUser = req.user
    const body = await req.json()

    const { username, avatarUrl, favoriteTeamId } = body

    // Ensure at least one field is provided
    if (!username && !avatarUrl && !favoriteTeamId) {
      return NextResponse.json(
        { error: "At least one field (username, avatarUrl, or favoriteTeamId) must be provided." },
        { status: 400 }
      )
    }

    // Username validation
    if (username) {
      if (typeof username !== "string" || username.trim().length < 3) {
        return NextResponse.json(
          { error: "Username must be at least 3 characters long." },
          { status: 400 }
        )
      }

      // Check if username already exists
      const existingUser = await prisma.user.findUnique({
        where: { username }
      })

      if (existingUser && existingUser.id !== currentUser.id) {
        return NextResponse.json(
          { error: "Username is already taken." },
          { status: 409 }
        )
      }
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: currentUser.id
      },
      data: {
        ...(username && { username: username.trim() }),
        ...(avatarUrl && { avatarUrl }),
        ...(favoriteTeamId && { favoriteTeamId })
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        favoriteTeamId: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      message: "User profile updated successfully.",
      data: updatedUser
    })

  } catch (error) {
    console.error("PATCH /api/users/me error:", error)

    return NextResponse.json(
      { error: "An unexpected error occurred while updating the user profile." },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getHandler)
export const PATCH = withAuth(patchHandler)