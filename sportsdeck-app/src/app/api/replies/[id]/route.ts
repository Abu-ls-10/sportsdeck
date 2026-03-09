import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"
import { moderateContent } from "@/lib/moderation"

// PATCH /api/replies/:id
// Allows reply owner to edit.
// Creates ReplyVersion record.
async function patchHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const user = req.user
    const { id: replyId } = await params

    if (!user)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )

    if (!replyId)
      return NextResponse.json(
        { error: "Reply id is required" },
        { status: 400 }
      )

    const reply = await prisma.reply.findUnique({
      where: { id: replyId }
    })

    if (!reply)
      return NextResponse.json(
        { error: "Reply not found" },
        { status: 404 }
      )

    if (reply.authorId !== user.user_id)
      return NextResponse.json(
        { error: "You are not allowed to edit this reply" },
        { status: 403 }
      )

    if (reply.isHidden)
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

    // Ensure version + update occur together
    const updated = await prisma.$transaction(async (tx) => {

      await tx.replyVersion.create({
        data: {
          replyId: reply.id,
          oldContent: reply.content
        }
      })

      return tx.reply.update({
        where: { id: reply.id },
        data: {
          content: newContent,
          isEdited: true,
          updatedAt: new Date()
        }
      })

    })

    // Fire-and-forget AI moderation on edited content
    moderateContent("REPLY", reply.id, newContent).catch((err) =>
      console.error("[replies/edit] moderateContent failed:", err)
    )

    return NextResponse.json(updated, { status: 200 })

  } catch (err) {

    console.error("PATCH /api/replies/:id error:", err)

    return NextResponse.json(
      { error: "Failed to update reply" },
      { status: 500 }
    )
  }
}


// DELETE /api/replies/:id
// Soft-hides reply.
// Owner or admin only.
async function deleteHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const user = req.user
    const { id: replyId } = await params

    if (!user)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )

    if (!replyId)
      return NextResponse.json(
        { error: "Reply id is required" },
        { status: 400 }
      )

    const reply = await prisma.reply.findUnique({
      where: { id: replyId }
    })

    if (!reply)
      return NextResponse.json(
        { error: "Reply not found" },
        { status: 404 }
      )

    if (reply.authorId !== user.user_id && user.role !== "ADMIN")
      return NextResponse.json(
        { error: "You are not allowed to delete this reply" },
        { status: 403 }
      )

    if (reply.isHidden)
      return NextResponse.json(
        { error: "Reply already hidden" },
        { status: 400 }
      )

    await prisma.reply.update({
      where: { id: reply.id },
      data: { isHidden: true }
    })

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )

  } catch (err) {

    console.error("DELETE /api/replies/:id error:", err)

    return NextResponse.json(
      { error: "Failed to delete reply" },
      { status: 500 }
    )
  }
}

export const PATCH = withAuth(patchHandler)
export const DELETE = withAuth(deleteHandler)