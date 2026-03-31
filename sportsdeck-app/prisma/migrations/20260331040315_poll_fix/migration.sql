/*
  Warnings:

  - A unique constraint covering the columns `[userId,feedEventId]` on the table `FeedEntry` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[threadId]` on the table `Poll` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[replyId]` on the table `Poll` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pollId` to the `Vote` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FeedEvent" ALTER COLUMN "groupKey" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "replyId" TEXT;

-- AlterTable
ALTER TABLE "Reply" ADD COLUMN     "parentReplyId" TEXT;

-- AlterTable
ALTER TABLE "Vote" ADD COLUMN     "pollId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "FeedEntry_userId_feedEventId_key" ON "FeedEntry"("userId", "feedEventId");

-- CreateIndex
CREATE UNIQUE INDEX "Poll_threadId_key" ON "Poll"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "Poll_replyId_key" ON "Poll"("replyId");

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_parentReplyId_fkey" FOREIGN KEY ("parentReplyId") REFERENCES "Reply"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "Reply"("id") ON DELETE SET NULL ON UPDATE CASCADE;
