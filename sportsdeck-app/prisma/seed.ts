import { prisma } from "../src/lib/prisma"
import { main as seedTeams } from "./seeds/teams"
import seedUsers from "./seeds/users"
import seedMatches from "./seeds/matches"

async function main() {
  console.log("Seeding...")

  const teams = await seedTeams(prisma)
  const users = await seedUsers(prisma)
  const matches = await seedMatches(prisma, teams)

  console.log("Seed complete")
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {})
    process.exit(process.exitCode ?? 0)
  })
