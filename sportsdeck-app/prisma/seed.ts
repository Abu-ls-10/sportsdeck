import { PrismaClient } from "../src/generated/prisma"
import { main as seedTeams } from "./seeds/teams"
import seedUsers from "./seeds/users"
import seedMatches from "./seeds/matches"

const prisma = new PrismaClient()

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
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })