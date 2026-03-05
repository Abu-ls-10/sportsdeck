import { NextResponse } from "next/dist/server/web/spec-extension/response"
import { prisma } from "@/lib/prisma"
import { getUserFromToken } from "@/lib/auth"

// PATCH /api/posts/:id
// Allows post owner to edit content.
// Creates PostVersion record.
// Sets isEdited = true.
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {

  try {

    const user = await getUserFromToken(request)

    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const post = await prisma.post.findUnique({
      where: { id: params.id }
    })

    if (!post)
      return NextResponse.json({ error: "Post not found" }, { status: 404 })

    if (post.authorId !== user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const { content } = body

    if (!content)
      return NextResponse.json({ error: "Content required" }, { status: 400 })


    /**
     * Save previous version
     */
    await prisma.postVersion.create({
      data: {
        postId: post.id,
        oldContent: post.content
      }
    })


    /**
     * Update post
     */
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

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )

  }

}

// DELETE /api/posts/:id
// Soft-hides post.
// Only owner or admin allowed.
export async function DELETE(request: Request, { params }: { params: { id: string } }) {}