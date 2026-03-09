import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"


// PATCH /api/posts/:id
// Allows post owner to edit content.
// Creates PostVersion record.
// Sets isEdited = true.
async function patchHandler(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = req.user

    const post = await prisma.post.findUnique({
      where: { id: params.id }
    })

    if (!post)
      return NextResponse.json({ error: "Post not found" }, { status: 404 })

    if (post.authorId !== user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    // Block edits on hidden content
    if (post.isHidden)
      return NextResponse.json(
        { error: "This content has been hidden by a moderator and cannot be edited" },
        { status: 403 }
      )

    const body = await req.json()
    const { content } = body

    if (!content)
      return NextResponse.json({ error: "Content required" }, { status: 400 })

    // Save previous version
    await prisma.postVersion.create({
      data: {
        postId: post.id,
        oldContent: post.content
      }
    })

    // Update post
    const updated = await prisma.post.update({
      where: { id: post.id },
      data: {
        content,
        isEdited: true,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updated)

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/posts/:id
// Soft-hides post.
// Only owner or admin allowed.
async function deleteHandler(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = req.user

    const post = await prisma.post.findUnique({
      where: { id: params.id }
    })

    if (!post)
      return NextResponse.json({ error: "Post not found" }, { status: 404 })

    if (post.authorId !== user.id && user.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    await prisma.post.update({
      where: { id: post.id },
      data: { isHidden: true }
    })

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const PATCH = withAuth(patchHandler)
export const DELETE = withAuth(deleteHandler)