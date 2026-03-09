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

    const reply = await prisma.reply.findUnique({
      where: { id: replyId }
    })

    if (!reply)
      return NextResponse.json({ error: "Reply not found" }, { status: 404 })

    if (reply.authorId !== user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    // Block edits on hidden content
    if (reply.isHidden)
      return NextResponse.json(
        { error: "This content has been hidden by a moderator and cannot be edited" },
        { status: 403 }
      )

    const body = await req.json()
    const { content } = body

    if (!content)
      return NextResponse.json({ error: "Content required" }, { status: 400 })

    // Save old version
    await prisma.replyVersion.create({
      data: {
        replyId: reply.id,
        oldContent: reply.content
      }
    })

    // Update reply
    const updated = await prisma.reply.update({
      where: { id: reply.id },
      data: {
        content,
        isEdited: true,
        updatedAt: new Date()
      }
    })

    // Fire-and-forget AI moderation on edited content
    moderateContent("REPLY", reply.id, content).catch((err) =>
      console.error("[replies/edit] moderateContent failed:", err)
    )

    return NextResponse.json(updated)

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/replies/:id
// Soft-hides reply.
// Owner or admin only.
async function deleteHandler(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = req.user

    const reply = await prisma.reply.findUnique({
      where: { id: params.id }
    })

    if (!reply)
      return NextResponse.json({ error: "Reply not found" }, { status: 404 })

    if (reply.authorId !== user.id && user.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    await prisma.reply.update({
      where: { id: reply.id },
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