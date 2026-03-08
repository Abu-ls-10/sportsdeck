
export default async function seedTeams(prisma) {

  const teams = await Promise.all([
    prisma.team.create({
      data: {
        externalId: "arsenal",
        name: "Arsenal",
        shortName: "ARS",
        logoUrl: "https://logo.com/arsenal.png",
        venue: "Emirates Stadium",
        cachedAt: new Date()
      }
    }),
    prisma.team.create({
      data: {
        externalId: "liverpool",
        name: "Liverpool",
        shortName: "LIV",
        logoUrl: "https://logo.com/liverpool.png",
        venue: "Anfield",
        cachedAt: new Date()
      }
    }),
    prisma.team.create({
      data: {
        externalId: "chelsea",
        name: "Chelsea",
        shortName: "CHE",
        logoUrl: "https://logo.com/chelsea.png",
        venue: "Stamford Bridge",
        cachedAt: new Date()
      }
    })
  ])

  return teams
}
