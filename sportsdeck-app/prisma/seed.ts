
import { PrismaClient } from "../src/generated/prisma"
import seedUsers from "./seeds/users"
import { main as seedTeams } from "./seeds/teams"
import seedMatches from "./seeds/matches"
import seedThreads from "./seeds/threads"
import seedPosts from "./seeds/posts"
import seedPolls from "./seeds/polls"
import seedFollows from "./seeds/follows"

const prisma = new PrismaClient()

async function main() {
  const users = await seedUsers(prisma)
  const teams = await seedTeams(prisma)
  const matches = await seedMatches(prisma, teams)
  const threads = await seedThreads(prisma, users, teams, matches)
  const posts = await seedPosts(prisma, users, threads)
  await seedPolls(prisma, threads)
  await seedFollows(prisma, users)

  console.log("Seeding complete.")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
