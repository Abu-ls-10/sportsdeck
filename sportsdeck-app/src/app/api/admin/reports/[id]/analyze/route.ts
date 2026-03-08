import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromToken } from "@/lib/auth"
import { analyzeContent } from "@/lib/moderation"

/**
 * POST /api/admin/reports/:id/analyze
 *
 * Admin-only. Triggers a fresh AI analysis on the reported content.
 * Fetches the actual text of the content, runs it through the toxicity model,
 * and updates the ReportedItem with the new AI verdict.
 *
 * Useful when:
 * - Content was reported before AI moderation was enabled
 * - Admin wants a fresh analysis after the model has been updated
 * - The content was edited after the original analysis
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  // Find the reported item
  const reportedItem = await prisma.reportedItem.findUnique({
    where: { id },
  })

  if (!reportedItem) {
    return NextResponse.json({ message: "Reported item not found" }, { status: 404 })
  }

  // Fetch the actual content text
  const contentText = await getContentText(reportedItem.contentType, reportedItem.contentId)

  if (!contentText) {
    return NextResponse.json(
      { message: "Could not retrieve content text for analysis" },
      { status: 404 }
    )
  }

  // Run AI analysis
  const result = await analyzeContent(contentText)

  // Update the reported item with the new AI verdict
  const updated = await prisma.reportedItem.update({
    where: { id },
    data: {
      aiScore: result.toxicityScore,
      aiLabel: result.labels
        .filter((l) => l.score > 0.3)
        .map((l) => l.label)
        .join(", "),
      aiExplanation: result.explanation,
      aiModel: result.model,
      aiUpdatedAt: new Date(),
    },
  })

  return NextResponse.json({
    message: "AI analysis completed",
    aiVerdict: {
      score: result.toxicityScore,
      flagged: result.flagged,
      labels: result.labels,
      explanation: result.explanation,
      model: result.model,
      analyzedAt: updated.aiUpdatedAt,
      recommendation:
        result.toxicityScore >= 0.7
          ? "LIKELY_INAPPROPRIATE"
          : result.toxicityScore >= 0.4
            ? "NEEDS_REVIEW"
            : "LIKELY_SAFE",
    },
  })
}

/**
 * Fetches the raw text of content by type and id.
 */
async function getContentText(
  contentType: string,
  contentId: string
): Promise<string | null> {
  switch (contentType) {
    case "THREAD": {
      const thread = await prisma.thread.findUnique({
        where: { id: contentId },
        select: { title: true },
      })
      return thread?.title ?? null
    }
    case "POST": {
      const post = await prisma.post.findUnique({
        where: { id: contentId },
        select: { content: true },
      })
      return post?.content ?? null
    }
    case "REPLY": {
      const reply = await prisma.reply.findUnique({
        where: { id: contentId },
        select: { content: true },
      })
      return reply?.content ?? null
    }
    default:
      return null
  }
}
