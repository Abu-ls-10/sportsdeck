import { main } from "./seeds/populate_teams"
import { prisma } from "../src/lib/prisma"

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())