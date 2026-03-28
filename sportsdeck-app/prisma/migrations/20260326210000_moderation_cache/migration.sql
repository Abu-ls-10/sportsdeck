-- CreateTable
CREATE TABLE "ModerationCache" (
    "id" TEXT NOT NULL,
    "normalizedTextHash" TEXT NOT NULL,
    "pipelineKey" TEXT NOT NULL,
    "originalTextLength" INTEGER NOT NULL,
    "translatedText" TEXT,
    "flagged" BOOLEAN NOT NULL,
    "toxicityScore" DOUBLE PRECISION NOT NULL,
    "labelSummary" TEXT NOT NULL,
    "labelsJson" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModerationCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModerationCache_normalizedTextHash_pipelineKey_key" ON "ModerationCache"("normalizedTextHash", "pipelineKey");

-- CreateIndex
CREATE INDEX "ModerationCache_normalizedTextHash_idx" ON "ModerationCache"("normalizedTextHash");

-- CreateIndex
CREATE INDEX "ModerationCache_cachedAt_idx" ON "ModerationCache"("cachedAt");
