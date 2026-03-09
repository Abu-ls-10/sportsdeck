import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"


/**
 * @openapi
 * /api/posts/{id}:
 *   patch:
 *     summary: Edit a post's content (owner only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "clx1abc123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Updated post content here."
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       400:
 *         description: Content is required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden or account banned or content hidden
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Soft-delete a post (owner or admin)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "clx1abc123"
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Post not found
 */
// PATCH /api/posts/:id
// Allows post owner to edit content.
// Creates PostVersion record.
// Sets isEdited = true.
async function patchHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const user = req.user
    const { id: postId } = await params

    if (!user)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )

    if (!postId)
      return NextResponse.json(
        { error: "Post id is required" },
        { status: 400 }
      )

    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post)
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )

    if (post.authorId !== user.user_id)
      return NextResponse.json(
        { error: "You are not allowed to edit this post" },
        { status: 403 }
      )

    if (post.isHidden)
      return NextResponse.json(
        { error: "This content has been hidden by a moderator and cannot be edited" },
        { status: 403 }
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

    const { content } = body

    if (!content || typeof content !== "string" || content.trim().length === 0)
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      )

    const newContent = content.trim()

    // Transaction ensures version + update happen together
    const updated = await prisma.$transaction(async (tx) => {

      await tx.postVersion.create({
        data: {
          postId: post.id,
          oldContent: post.content
        }
      })

      return tx.post.update({
        where: { id: post.id },
        data: {
          content: newContent,
          isEdited: true,
          updatedAt: new Date()
        }
      })

    })

    return NextResponse.json(updated, { status: 200 })

  } catch (err) {

    console.error("PATCH /api/posts/:id error:", err)

    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    )
  }
}


// DELETE /api/posts/:id
// Soft-hides post.
// Only owner or admin allowed.
async function deleteHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const user = req.user
    const { id: postId } = await params

    if (!user)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )

    if (!postId)
      return NextResponse.json(
        { error: "Post id is required" },
        { status: 400 }
      )

    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post)
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )

    if (post.authorId !== user.user_id && user.role !== "ADMIN")
      return NextResponse.json(
        { error: "You are not allowed to delete this post" },
        { status: 403 }
      )

    if (post.isHidden)
      return NextResponse.json(
        { error: "Post already hidden" },
        { status: 400 }
      )

    await prisma.post.update({
      where: { id: post.id },
      data: { isHidden: true }
    })

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )

  } catch (err) {

    console.error("DELETE /api/posts/:id error:", err)

    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    )
  }
}

export const PATCH = withAuth(patchHandler)
export const DELETE = withAuth(deleteHandler)