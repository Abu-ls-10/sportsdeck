import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma"
import seedUsers from "./seeds/users"
import { main as seedTeams } from "./seeds/teams"
import seedMatches from "./seeds/matches"
import seedThreads from "./seeds/threads"
import seedPosts from "./seeds/posts"
import seedPolls from "./seeds/polls"
import seedFollows from "./seeds/follows"
import seedActivities from "./seeds/activity"
import seedFeedEvents from "./seeds/feedEvents"
import seedFeedEntries from "./seeds/feedEntries"
import seedVotes from "./seeds/votes"

const prisma = new PrismaClient({
  log: process.env.SEED_DEBUG === "1" ? ["info", "warn", "error"] : [],
})

/**
 * One TRUNCATE ... CASCADE is far faster than dozens of deleteMany() calls and
 * avoids sitting on the first DELETE while the pool or locks misbehave.
 * Table names match PostgreSQL defaults for Prisma models.
 */
async function clearDatabase() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "FeedEntry",
      "FeedEvent",
      "Activity",
      "Appeal",
      "Ban",
      "AdminAction",
      "Report",
      "ReportedItem",
      "Vote",
      "PollOption",
      "Poll",
      "ThreadTag",
      "ReplyVersion",
      "PostVersion",
      "Reply",
      "Post",
      "Thread",
      "Follow",
      "Match",
      "Standing",
      "ModerationCache",
      "User",
      "Team",
      "Tag",
      "DailyDigest"
    RESTART IDENTITY CASCADE;
  `)
}

async function main() {
  console.log("[seed] connecting to database…")
  await prisma.$connect()
  console.log("[seed] clearing database (truncate)…")
  await clearDatabase()
  console.log("[seed] database cleared")

  console.log("[seed] teams (football-data API)…")
  const teams = await seedTeams(prisma)

  console.log("[seed] users…")
  const users = await seedUsers(prisma)

  console.log("[seed] matches (football-data API)…")
  const matches = await seedMatches(prisma, teams)

  console.log("[seed] threads…")
  const threads = await seedThreads(prisma, users, teams, matches)

  console.log("[seed] posts (can take several minutes with full PL data)…")
  await seedPosts(prisma, users, threads)

  console.log("[seed] polls…")
  const [polls, poptions] = await seedPolls(prisma, threads)

  console.log("[seed] votes...")
  await seedVotes(prisma, users, poptions);

  console.log("[seed] follows…")
  await seedFollows(prisma, users)

  console.log("[seed] activities…")
  await seedActivities(prisma)

  console.log("[seed] feed events…")
  await seedFeedEvents(prisma)

  console.log("[seed] feed entries…")
  await seedFeedEntries(prisma)

  console.log("Seeding complete.")
}

;(async () => {
  let code = 0
  try {
    await main()
  } catch (e) {
    console.error(e)
    code = 1
  } finally {
    await prisma.$disconnect()
  }
  process.exit(code)
})()
