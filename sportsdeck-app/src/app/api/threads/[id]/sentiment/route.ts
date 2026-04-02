import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { analyzeSentimentBatch } from "@/lib/ai"
import {
  rateLimitByIp,
  RL_SENTIMENT_MAX,
  RL_SENTIMENT_WINDOW_SEC,
} from "@/lib/rateLimitHttp"

/**
 * @openapi
 * /api/threads/{id}/sentiment:
 *   get:
 *     summary: Get AI-powered sentiment analysis of thread comments
 *     tags: [Threads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "clxthread001"
 *     responses:
 *       200:
 *         description: Sentiment breakdown including overall and per-team sentiment
 *       404:
 *         description: Thread not found or hidden
 *       500:
 *         description: Internal server error
 */

/**
 * GET /api/threads/:id/sentiment
 *
 * User Story:
 *   As a user, I want to see an overall sentiment indicator on match threads,
 *   showing the collective mood (positive, negative, mixed) based on AI
 *   analysis of all thread comments (top-level posts + replies). Sentiment
 *   should also be calculated for both teams in a match, based on comments
 *   posted by their fans.
 *
 * Response shape:
 * {
 *   threadId,
 *   overall: { sentiment, positiveCount, negativeCount, totalAnalyzed },
 *   teams: {
 *     home: { teamId, teamName, sentiment, positiveCount, negativeCount, totalAnalyzed },
 *     away: { teamId, teamName, sentiment, positiveCount, negativeCount, totalAnalyzed }
 *   }
 * }
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params

    const limited = await rateLimitByIp(
      req,
      `sentiment:${threadId}`,
      RL_SENTIMENT_MAX,
      RL_SENTIMENT_WINDOW_SEC,
      { error: "Too many sentiment requests for this thread. Try again later." }
    )
    if (limited) return limited

    // Fetch the thread with match + team info
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        match: {
          include: {
            homeTeam: { select: { id: true, name: true } },
            awayTeam: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!thread || thread.isHidden) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    // Gather all non-hidden thread comments (posts + replies)
    // and the author's favoriteTeamId so we can split by team.
    const [posts, replies] = await Promise.all([
      prisma.post.findMany({
        where: {
          threadId,
          isHidden: false,
        },
        select: {
          id: true,
          content: true,
          authorId: true,
          author: {
            select: { favoriteTeamId: true },
          },
        },
      }),
      prisma.reply.findMany({
        where: {
          post: { threadId },
          isHidden: false,
        },
        select: {
          id: true,
          content: true,
          authorId: true,
          author: {
            select: { favoriteTeamId: true },
          },
        },
      }),
    ])

    interface CommentEntry {
      id: string
      text: string
      authorFavoriteTeamId: string | null
    }

    const allComments: CommentEntry[] = [
      ...posts.map((post) => ({
        id: post.id,
        text: post.content,
        authorFavoriteTeamId: post.author.favoriteTeamId,
      })),
      ...replies.map((reply) => ({
        id: reply.id,
        text: reply.content,
        authorFavoriteTeamId: reply.author.favoriteTeamId,
      })),
    ]

    if (allComments.length === 0) {
      return NextResponse.json({
        threadId,
        overall: {
          sentiment: "neutral",
          positiveCount: 0,
          negativeCount: 0,
          totalAnalyzed: 0,
        },
        teams: null,
      })
    }

    // Truncate very long texts to keep HF requests manageable
    const truncate = (t: string) => (t.length > 512 ? t.slice(0, 512) : t)

    // ── Overall sentiment ────────────────────────────────────
    const allTexts = allComments.map((c) => truncate(c.text))

    // Send comments in batches of 32 to avoid exceeding payload limits
    const BATCH_SIZE = 32
    let totalPositive = 0
    let totalNegative = 0
    let totalAnalyzed = 0

    for (let i = 0; i < allTexts.length; i += BATCH_SIZE) {
      const batch = allTexts.slice(i, i + BATCH_SIZE)
      const result = await analyzeSentimentBatch(batch)
      totalPositive += result.positiveCount
      totalNegative += result.negativeCount
      totalAnalyzed += result.totalAnalyzed
    }

    const overallSentiment =
      totalAnalyzed === 0
        ? "neutral"
        : totalPositive / totalAnalyzed >= 0.65
          ? "positive"
          : totalNegative / totalAnalyzed >= 0.65
            ? "negative"
            : "mixed"

    // ── Per-team sentiment (only for match threads) ──────────
    let teams = null

    if (thread.match) {
      const homeTeamId = thread.match.homeTeam.id
      const awayTeamId = thread.match.awayTeam.id

      const homeTexts = allComments
        .filter((c) => c.authorFavoriteTeamId === homeTeamId)
        .map((c) => truncate(c.text))

      const awayTexts = allComments
        .filter((c) => c.authorFavoriteTeamId === awayTeamId)
        .map((c) => truncate(c.text))

      // Analyze home fans
      let homePositive = 0, homeNegative = 0, homeTotal = 0
      for (let i = 0; i < homeTexts.length; i += BATCH_SIZE) {
        const batch = homeTexts.slice(i, i + BATCH_SIZE)
        const r = await analyzeSentimentBatch(batch)
        homePositive += r.positiveCount
        homeNegative += r.negativeCount
        homeTotal += r.totalAnalyzed
      }

      // Analyze away fans
      let awayPositive = 0, awayNegative = 0, awayTotal = 0
      for (let i = 0; i < awayTexts.length; i += BATCH_SIZE) {
        const batch = awayTexts.slice(i, i + BATCH_SIZE)
        const r = await analyzeSentimentBatch(batch)
        awayPositive += r.positiveCount
        awayNegative += r.negativeCount
        awayTotal += r.totalAnalyzed
      }

      const toLabel = (pos: number, neg: number, total: number) =>
        total === 0
          ? "neutral"
          : pos / total >= 0.65
            ? "positive"
            : neg / total >= 0.65
              ? "negative"
              : "mixed"

      teams = {
        home: {
          teamId: homeTeamId,
          teamName: thread.match.homeTeam.name,
          sentiment: toLabel(homePositive, homeNegative, homeTotal),
          positiveCount: homePositive,
          negativeCount: homeNegative,
          totalAnalyzed: homeTotal,
        },
        away: {
          teamId: awayTeamId,
          teamName: thread.match.awayTeam.name,
          sentiment: toLabel(awayPositive, awayNegative, awayTotal),
          positiveCount: awayPositive,
          negativeCount: awayNegative,
          totalAnalyzed: awayTotal,
        },
      }
    }

    return NextResponse.json({
      threadId,
      overall: {
        sentiment: overallSentiment,
        positiveCount: totalPositive,
        negativeCount: totalNegative,
        totalAnalyzed,
      },
      teams,
    })
  } catch (error) {
    console.error("Sentiment analysis error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
