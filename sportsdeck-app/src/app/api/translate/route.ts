import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromToken } from "@/lib/auth"
import { translateToEnglish } from "@/lib/ai"

/**
 * @openapi
 * /api/translate:
 *   post:
 *     summary: Translate a reply to English
 *     tags: [Translate]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 example: "Hola, ¿cómo estás?"
 *               contentType:
 *                 type: string
 *                 enum: [REPLY]
 *                 example: "REPLY"
 *               contentId:
 *                 type: string
 *                 example: "clxpost001"
 *     responses:
 *       200:
 *         description: Translation result with original and translated text
 *       400:
 *         description: Invalid contentType or no text provided
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reply not found
 *       503:
 *         description: Translation service unavailable
 *       500:
 *         description: Internal server error
 */

/**
 * POST /api/translate
 *
 * User Story:
 *   As a user browsing, I want an option to translate a comment
 *   written in a different language into English.
 *
 * Request body:
 *   { contentType: "REPLY", contentId: string }
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

    let body: { contentType?: string; contentId?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    let textToTranslate: string | null = null

    const { contentType, contentId } = body
    if (!contentType || !contentId) {
      return NextResponse.json(
        { error: "Provide { contentType: \"REPLY\", contentId }" },
        { status: 400 }
      )
    }

    if (contentType !== "REPLY") {
      return NextResponse.json(
        { error: "contentType must be REPLY" },
        { status: 400 }
      )
    }

    const reply = await prisma.reply.findUnique({
      where: { id: contentId },
      select: { content: true, isHidden: true },
    })
    if (!reply || reply.isHidden) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 })
    }
    textToTranslate = reply.content

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
