/*
  Warnings:

  - A unique constraint covering the columns `[userId,feedEventId]` on the table `FeedEntry` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "FeedEvent" ALTER COLUMN "groupKey" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "FeedEntry_userId_feedEventId_key" ON "FeedEntry"("userId", "feedEventId");
