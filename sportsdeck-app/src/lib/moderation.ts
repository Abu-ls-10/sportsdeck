import { createHash } from "node:crypto"
import { prisma } from "@/lib/prisma"
import { translateToEnglish } from "@/lib/ai"

const TOXICITY_MODEL = "unitary/toxic-bert"
const TRANSLATION_MODEL = "Helsinki-NLP/opus-mt-mul-en"
const HF_API_URL =
  `https://router.huggingface.co/hf-inference/models/${TOXICITY_MODEL}`
const HF_TOKEN = process.env.HUGGINGFACE_API_KEY
const TOXICITY_THRESHOLD = parseFloat(process.env.TOXICITY_THRESHOLD ?? "0.7")
const TRANSLATION_MODE = (process.env.MODERATION_TRANSLATION_MODE ?? "auto").toLowerCase()
const MODERATION_PIPELINE_VERSION = process.env.MODERATION_PIPELINE_VERSION ?? "v1"
const COMMON_ENGLISH_HINTS = new Set([
  "a",
  "an",
  "and",
  "are",
  "be",
  "for",
  "from",
  "have",
  "he",
  "i",
  "in",
  "is",
  "it",
  "not",
  "of",
  "on",
  "that",
  "the",
  "their",
  "this",
  "to",
  "was",
  "we",
  "what",
  "with",
  "you",
  "your",
])

/**
 * Shape returned by the HuggingFace text-classification pipeline
 * for `unitary/toxic-bert`.
 * Labels: toxic, severe_toxic, obscene, threat, insult, identity_hate, sexual_explicit
 *
 * The API returns [[{label, score}, …]] — an array-of-arrays.
 */
interface HFLabel {
  label: string
  score: number
}

type ModerationLabel = { label: string; score: number }

export interface ModerationResult {
  flagged: boolean
  toxicityScore: number
  labels: ModerationLabel[]
  explanation: string
  model: string
}

function getDefaultResult(): ModerationResult {
  return {
    flagged: false,
    toxicityScore: 0,
    labels: [],
    explanation: "AI moderation unavailable",
    model: `moderate:${TOXICITY_MODEL}`,
  }
}

function normalizeText(text: string): string {
  return text.normalize("NFKC").replace(/\s+/g, " ").trim()
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex")
}

function getPipelineKey(): string {
  return [
    `version:${MODERATION_PIPELINE_VERSION}`,
    `translateMode:${TRANSLATION_MODE}`,
    `translateModel:${TRANSLATION_MODEL}`,
    `moderateModel:${TOXICITY_MODEL}`,
    `threshold:${TOXICITY_THRESHOLD}`,
  ].join("|")
}

function summarizeLabels(labels: ModerationLabel[]): string {
  return labels
    .filter((label) => label.score > 0.3)
    .map((label) => label.label)
    .join(", ") || "none"
}

function buildExplanation(labels: ModerationLabel[]): string {
  const significantLabels = labels
    .filter((label) => label.score > 0.3)
    .sort((a, b) => b.score - a.score)

  return significantLabels.length > 0
    ? significantLabels
        .map((label) => `${label.label}: ${(label.score * 100).toFixed(1)}%`)
        .join(", ")
    : "No significant toxicity detected"
}

function shouldTranslateText(text: string): boolean {
  if (TRANSLATION_MODE === "always") {
    return true
  }

  if (TRANSLATION_MODE === "never") {
    return false
  }

  if (/[^\u0000-\u007F]/.test(text)) {
    return true
  }

  const words = text.toLowerCase().match(/[a-z']+/g) ?? []
  if (words.length < 4) {
    return false
  }

  const englishHints = words.filter((word) => COMMON_ENGLISH_HINTS.has(word)).length
  return englishHints === 0
}

async function getCachedVerdict(
  normalizedTextHash: string,
  pipelineKey: string
): Promise<ModerationResult | null> {
  const cached = await prisma.moderationCache.findUnique({
    where: {
      normalizedTextHash_pipelineKey: {
        normalizedTextHash,
        pipelineKey,
      },
    },
  })

  if (!cached) {
    console.log(
      `[moderation] cache miss hash=${normalizedTextHash.slice(0, 12)} pipeline=${pipelineKey}`
    )
    return null
  }

  console.log(
    `[moderation] cache hit hash=${normalizedTextHash.slice(0, 12)} pipeline=${pipelineKey}`
  )

  return {
    flagged: cached.flagged,
    toxicityScore: cached.toxicityScore,
    labels: Array.isArray(cached.labelsJson) ? (cached.labelsJson as ModerationLabel[]) : [],
    explanation: cached.explanation,
    model: cached.model,
  }
}

async function cacheVerdict(args: {
  normalizedTextHash: string
  pipelineKey: string
  originalTextLength: number
  translatedText: string | null
  result: ModerationResult
}) {
  await prisma.moderationCache.upsert({
    where: {
      normalizedTextHash_pipelineKey: {
        normalizedTextHash: args.normalizedTextHash,
        pipelineKey: args.pipelineKey,
      },
    },
    create: {
      normalizedTextHash: args.normalizedTextHash,
      pipelineKey: args.pipelineKey,
      originalTextLength: args.originalTextLength,
      translatedText: args.translatedText,
      flagged: args.result.flagged,
      toxicityScore: args.result.toxicityScore,
      labelSummary: summarizeLabels(args.result.labels),
      labelsJson: args.result.labels,
      explanation: args.result.explanation,
      model: args.result.model,
      cachedAt: new Date(),
    },
    update: {
      originalTextLength: args.originalTextLength,
      translatedText: args.translatedText,
      flagged: args.result.flagged,
      toxicityScore: args.result.toxicityScore,
      labelSummary: summarizeLabels(args.result.labels),
      labelsJson: args.result.labels,
      explanation: args.result.explanation,
      model: args.result.model,
      cachedAt: new Date(),
    },
  })
}

async function runModerationModel(
  text: string,
  modelDescriptor: string
): Promise<ModerationResult | null> {
  console.log(
    `[moderation] HF classify model=${modelDescriptor} textLen=${text.length}`
  )

  const response = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  })

  if (!response.ok) {
    console.error(`HF API error: ${response.status} ${response.statusText}`)
    return null
  }

  const data: HFLabel[][] = await response.json()
  const labels = data?.[0]

  if (!Array.isArray(labels)) {
    console.error("Unexpected HF response shape:", data)
    return null
  }

  const normalizedLabels = labels.map((label) => ({
    label: label.label,
    score: label.score,
  }))
  const toxicityLabel = normalizedLabels.find((label) => label.label === "toxic")
  const toxicityScore = toxicityLabel?.score ?? 0

  return {
    flagged: toxicityScore >= TOXICITY_THRESHOLD,
    toxicityScore,
    labels: normalizedLabels,
    explanation: buildExplanation(normalizedLabels),
    model: modelDescriptor,
  }
}

/**
 * Calls the Hugging Face Inference API to analyze text for toxicity.
 * Returns a structured moderation result.
 *
 * If the API key is not set or the call fails, returns a non-flagged result
 * so the app degrades gracefully — content is still created, just not auto-flagged.
 */
export async function analyzeContent(text: string): Promise<ModerationResult> {
  const defaultResult = getDefaultResult()
  const normalizedText = normalizeText(text)
  const pipelineKey = getPipelineKey()

  if (!normalizedText) {
    return {
      ...defaultResult,
      explanation: "No text to analyze",
    }
  }

  if (!HF_TOKEN) {
    console.warn("HUGGINGFACE_API_KEY not set — skipping AI moderation")
    return defaultResult
  }

  try {
    const normalizedTextHash = hashText(normalizedText)
    const cachedVerdict = await getCachedVerdict(normalizedTextHash, pipelineKey)
    if (cachedVerdict) {
      return cachedVerdict
    }

    let moderationInput = normalizedText
    let translatedText: string | null = null
    let modelDescriptor = `moderate:${TOXICITY_MODEL}`

    if (shouldTranslateText(normalizedText)) {
      console.log(
        `[moderation] translation attempt textLen=${normalizedText.length}`
      )
      const translation = await translateToEnglish(normalizedText)
      const maybeTranslated = translation?.translatedText?.trim()

      if (maybeTranslated) {
        console.log(
          `[moderation] translation success srcLen=${normalizedText.length} dstLen=${maybeTranslated.length}`
        )
        moderationInput = maybeTranslated
        translatedText = maybeTranslated
        modelDescriptor = `translate:${TRANSLATION_MODEL}|moderate:${TOXICITY_MODEL}`
      } else {
        console.log("[moderation] translation unavailable, fallback to original text")
      }
    }

    let result = await runModerationModel(moderationInput, modelDescriptor)

    if (!result && translatedText) {
      result = await runModerationModel(normalizedText, `moderate:${TOXICITY_MODEL}`)
      translatedText = null
    }

    if (!result) {
      return defaultResult
    }

    await cacheVerdict({
      normalizedTextHash,
      pipelineKey,
      originalTextLength: normalizedText.length,
      translatedText,
      result,
    })

    return result
  } catch (error) {
    console.error("AI moderation error:", error)
    return defaultResult
  }
}

/**
 * Runs moderation on content and, if flagged, auto-creates a ReportedItem
 * with source = "AI" so it appears in the admin review queue.
 *
 * Called asynchronously after post/reply creation — does not block the response.
 *
 * @param contentType  "THREAD" | "POST" | "REPLY"
 * @param contentId    The id of the created content
 * @param text         The text to analyze
 */
export async function moderateContent(
  contentType: string,
  contentId: string,
  text: string
): Promise<void> {
  try {
    const result = await analyzeContent(text)

    console.log(
      `[moderation] ${contentType}:${contentId} — toxic=${result.toxicityScore.toFixed(4)} flagged=${result.flagged} threshold=${TOXICITY_THRESHOLD} labels=${JSON.stringify(result.labels)}`
    )

    // Always update AI verdict on an existing ReportedItem (e.g. user-reported content).
    // Only CREATE a new ReportedItem automatically when the content is actually flagged.
    const existing = await prisma.reportedItem.findUnique({
      where: { contentType_contentId: { contentType, contentId } },
    })

    const aiData = {
      aiScore: result.toxicityScore,
      aiLabel: summarizeLabels(result.labels),
      aiExplanation: result.explanation,
      aiModel: result.model,
      aiUpdatedAt: new Date(),
    }

    if (existing) {
      // Update verdict on already-reported item regardless of threshold
      await prisma.reportedItem.update({
        where: { contentType_contentId: { contentType, contentId } },
        data: aiData,
      })
    } else if (result.flagged) {
      const defaultReportCount = contentType === "REPLY" ? 1 : 0
      // Auto-create only when AI actually flags it
      await prisma.reportedItem.create({
        data: {
          contentType,
          contentId,
          reportCount: defaultReportCount,
          status: "pending",
          ...aiData,
        },
      })
      console.log(`[moderation] AUTO-FLAGGED ${contentType}:${contentId}`)
    }
  } catch (error) {
    console.error(`[moderation] Error for ${contentType}:${contentId}:`, error)
  }
}

/**
 * Re-evaluates AI verdict and updates existing ReportedItem only.
 * Does not auto-create a new ReportedItem when none exists.
 *
 * Useful for post/thread edits where we must refresh verdicts for already
 * reported content without expanding auto-flagging scope.
 */
export async function reevaluateExistingReportedItem(
  contentType: string,
  contentId: string,
  text: string
): Promise<void> {
  try {
    const existing = await prisma.reportedItem.findUnique({
      where: { contentType_contentId: { contentType, contentId } },
    })

    if (!existing) {
      console.log(
        `[moderation] reeval-skip ${contentType}:${contentId} (no ReportedItem exists)`
      )
      return
    }

    const result = await analyzeContent(text)
    const aiData = {
      aiScore: result.toxicityScore,
      aiLabel: summarizeLabels(result.labels),
      aiExplanation: result.explanation,
      aiModel: result.model,
      aiUpdatedAt: new Date(),
    }

    await prisma.reportedItem.update({
      where: { contentType_contentId: { contentType, contentId } },
      data: aiData,
    })

    console.log(
      `[moderation] reeval-updated ${contentType}:${contentId} toxic=${result.toxicityScore.toFixed(4)} flagged=${result.flagged}`
    )
  } catch (error) {
    console.error(`[moderation] reevaluateExistingReportedItem error for ${contentType}:${contentId}:`, error)
  }
}
