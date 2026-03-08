import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromToken } from "@/lib/auth"
import { translateToEnglish } from "@/lib/ai"

/**
 * POST /api/translate
 *
 * User Story:
 *   As a user browsing, I want an option to translate a post or comment
 *   written in a different language into English.
 *
 * Request body:
 *   { text: string }
 *       OR
 *   { contentType: "POST" | "REPLY", contentId: string }
 *
 * When contentType + contentId are provided, the server looks up the
 * content from the database so users can translate posts/replies by ID.
 * When only `text` is supplied, it translates the raw text.
 *
 * Response:
 *   { originalText, translatedText }
 */

export async function POST(req: NextRequest) {
  try {
    // Authentication required
    const user = getUserFromToken(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    let textToTranslate: string | null = null

    // Option 1 — translate by content reference
    if (body.contentType && body.contentId) {
      const { contentType, contentId } = body

      if (contentType === "POST") {
        const post = await prisma.post.findUnique({
          where: { id: contentId },
          select: { content: true, isHidden: true },
        })
        if (!post || post.isHidden) {
          return NextResponse.json({ error: "Post not found" }, { status: 404 })
        }
        textToTranslate = post.content
      } else if (contentType === "REPLY") {
        const reply = await prisma.reply.findUnique({
          where: { id: contentId },
          select: { content: true, isHidden: true },
        })
        if (!reply || reply.isHidden) {
          return NextResponse.json({ error: "Reply not found" }, { status: 404 })
        }
        textToTranslate = reply.content
      } else {
        return NextResponse.json(
          { error: "contentType must be POST or REPLY" },
          { status: 400 }
        )
      }
    }

    // Option 2 — translate raw text
    if (!textToTranslate) {
      textToTranslate = body.text
    }

    if (!textToTranslate || typeof textToTranslate !== "string" || textToTranslate.trim().length === 0) {
      return NextResponse.json(
        { error: "Provide either { text } or { contentType, contentId }" },
        { status: 400 }
      )
    }

    const result = await translateToEnglish(textToTranslate)

    if (!result) {
      return NextResponse.json(
        { error: "Translation service unavailable" },
        { status: 503 }
      )
    }

    return NextResponse.json({
      originalText: textToTranslate,
      translatedText: result.translatedText,
    })
  } catch (error) {
    console.error("Translation endpoint error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
